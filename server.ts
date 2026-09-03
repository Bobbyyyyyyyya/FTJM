import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import { postgresSecurityMiddleware, getSecurityStats } from './server/postgresSecurityMiddleware';

dotenv.config();

// Active unified Supabase server client (Main database & auth)
const MAIN_SUPABASE_URL = 'https://lahoorkdcopypnubnosl.supabase.co';
const MAIN_SUPABASE_KEY = 'sb_publishable_53DnrJekb2FrlxjduTP1BQ_KX43MYLy';

const activeSupabaseUrl = process.env.VITE_SUPABASE_URL || MAIN_SUPABASE_URL;
const activeSupabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                          process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                          process.env.VITE_SUPABASE_ANON_KEY || 
                          MAIN_SUPABASE_KEY;

const serverSupabase = createClient(activeSupabaseUrl, activeSupabaseKey);

async function startServer() {
  const app = express();
  app.use(compression());
  const PORT = 3000;

  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ limit: '35mb', extended: true }));

  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Cached Egress configuration: 1-year immutable caching for static media & uploads
  const setCacheControlHeaders = (res: express.Response) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  };

  app.use(express.static(PUBLIC_DIR, { 
    setHeaders: (res, filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === 'sw.js' || fileName === 'manifest.json' || fileName.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      } else {
        setCacheControlHeaders(res);
      }
    }
  }));
  app.use('/uploads', express.static(UPLOADS_DIR, { 
    maxAge: '1y',
    immutable: true,
    setHeaders: (res) => setCacheControlHeaders(res)
  }));
  app.use('/api/uploads', express.static(UPLOADS_DIR, { 
    maxAge: '1y',
    immutable: true,
    setHeaders: (res) => setCacheControlHeaders(res)
  }));

  // 1x1 transparent PNG buffer for missing/offline image fallbacks
  const TRANSPARENT_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );

  // Serve root-level uploaded images or return graceful file if found
  app.get('/:filename', (req, res, next) => {
    const filename = req.params.filename;
    if (filename && /\.(jpe?g|png|webp|gif|svg|avif|webm|mp3|wav|ogg)$/i.test(filename)) {
      setCacheControlHeaders(res);
      const publicFile = path.join(PUBLIC_DIR, path.basename(filename));
      if (fs.existsSync(publicFile)) {
        return res.sendFile(publicFile);
      }
      const localFile = path.join(UPLOADS_DIR, path.basename(filename));
      if (fs.existsSync(localFile)) {
        return res.sendFile(localFile);
      }
    }
    next();
  });

  // Chat Encryption / Decryption Helpers
  const CHAT_ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'w836mDIpEhFnugUrKLgroqOp026IEKspJrckVQf5g9M=';
  const LEGACY_CHAT_ENCRYPTION_KEY = 'app-chat-secret-key-2024';

  const encryptGeneralChat = (text: string): string => {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, CHAT_ENCRYPTION_KEY).toString();
      return `gc:${encrypted}`;
    } catch (error) {
      console.error('Server encryption error:', error);
      return text;
    }
  };

  const decryptGeneralChat = (cipherText: string): string => {
    try {
      if (!cipherText || typeof cipherText !== 'string') {
        return typeof cipherText === 'string' ? cipherText : '';
      }
      
      let cleanText = cipherText.trim();
      
      if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        cleanText = cleanText.substring(1, cleanText.length - 1).trim();
      }
      if (cleanText.startsWith("'") && cleanText.endsWith("'")) {
        cleanText = cleanText.substring(1, cleanText.length - 1).trim();
      }
      if (cleanText.startsWith('\\"') && cleanText.endsWith('\\"')) {
        cleanText = cleanText.substring(2, cleanText.length - 2).trim();
      }

      let actualCipher = cleanText;
      while (actualCipher.startsWith('gc:')) {
        actualCipher = actualCipher.substring(3).trim();
      }
      
      // 1. Primary key decrypt
      try {
        const bytes = CryptoJS.AES.decrypt(actualCipher, CHAT_ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (originalText && originalText.trim().length > 0) {
          return originalText;
        }
        const latinText = bytes.toString(CryptoJS.enc.Latin1);
        if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
          return latinText;
        }
      } catch (e) {}

      // 2. Legacy key decrypt
      try {
        const bytes = CryptoJS.AES.decrypt(actualCipher, LEGACY_CHAT_ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (originalText && originalText.trim().length > 0) {
          return originalText;
        }
        const latinText = bytes.toString(CryptoJS.enc.Latin1);
        if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
          return latinText;
        }
      } catch (e) {}
      
      return cleanText.startsWith('gc:') ? actualCipher : cipherText;
    } catch (error) {
      console.error('Decryption failed for:', cipherText, error);
      return typeof cipherText === 'string' ? cipherText : '';
    }
  };

  // PostgreSQL & SQL Injection Exploit Protection Middleware
  app.use(postgresSecurityMiddleware);

  // Serve API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Security Shield Stats & Incident Audit Log Endpoint
  app.get('/api/security/stats', (req, res) => {
    res.json({ success: true, ...getSecurityStats() });
  });

  // Image & Media Upload Endpoint (ImgBB with local persistent /uploads/ fallback)
  app.post('/api/upload-image', async (req, res) => {
    try {
      const { image, name, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Geen afbeeldingsdata meegeleverd.',
        });
      }

      // Block video uploads entirely
      if (
        (mimeType && mimeType.includes('video')) ||
        (typeof image === 'string' && (image.startsWith('data:video/') || image.includes('video/')))
      ) {
        return res.status(400).json({
          success: false,
          error: 'Videobestanden worden momenteel niet ondersteund.',
        });
      }

      // Strip potential Data URI header if passed as base64 string
      let base64Data = image;
      let detectedMime = mimeType || 'image/jpeg';
      if (typeof image === 'string' && image.includes('base64,')) {
        const match = image.match(/^data:([^;]+);base64,/);
        if (match) detectedMime = match[1];
        base64Data = image.split('base64,')[1];
      }

      if (detectedMime.includes('video')) {
        return res.status(400).json({
          success: false,
          error: 'Videobestanden worden momenteel niet ondersteund.',
        });
      }

      const ext = detectedMime.includes('webp') ? 'webp' : detectedMime.includes('png') ? 'png' : detectedMime.includes('gif') ? 'gif' : detectedMime.includes('audio') ? 'webm' : 'jpg';
      const cleanName = (name ? name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'img') + `_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const isImgBBSupported = detectedMime.includes('image/') || detectedMime.includes('webp') || detectedMime.includes('png') || detectedMime.includes('jpg') || detectedMime.includes('jpeg') || detectedMime.includes('gif');

      // 1. Try ImgBB if API key is present AND it's an image
      const apiKey = process.env.IMGBB_API_KEY;
      if (apiKey && apiKey.trim() !== '' && isImgBBSupported) {
        try {
          const formData = new URLSearchParams();
          formData.append('image', base64Data);
          if (name) {
            formData.append('name', name);
          }

          const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const data = (await response.json()) as any;

          if (response.ok && data.success && (data.data?.display_url || data.data?.url || data.data?.image?.url)) {
            const directUrl = data.data.image?.url || data.data.display_url || data.data.url;
            return res.json({
              success: true,
              url: directUrl,
              display_url: directUrl,
              thumb: data.data.thumb?.url || directUrl,
              delete_url: data.data.delete_url,
              size: data.data.size,
              width: data.data.width,
              height: data.data.height,
            });
          } else {
            console.warn('[ImgBB Upload failed, saving to local static storage]:', data?.error?.message || data);
          }
        } catch (imgbbErr) {
          console.warn('[ImgBB Connection Error, saving to local static storage]:', imgbbErr);
        }
      }

      // 2. Guaranteed local storage fallback (0% key dependency, 100% reliability for all users)
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(UPLOADS_DIR, cleanName);
      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${cleanName}`;
      return res.json({
        success: true,
        url: publicUrl,
        display_url: publicUrl,
        thumb: publicUrl,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('[Upload Server Error]', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Interne serverfout bij uploaden van afbeelding.',
      });
    }
  });

  // Image Proxy to resolve ImgBB viewer pages, CDN URLs, and bypass adblockers
  app.get('/api/image-proxy', async (req, res) => {
    try {
      let targetUrl = req.query.url as string;
      if (!targetUrl || typeof targetUrl !== 'string') {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(TRANSPARENT_PNG);
      }
      targetUrl = targetUrl.trim();

      // Handle relative paths or bare filenames like /uploads/... or 1787748721080_h9vdr68.jpg
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.startsWith('//')) {
          targetUrl = 'https:' + targetUrl;
        } else {
          // Check if it exists in UPLOADS_DIR
          const cleanBase = path.basename(targetUrl.split('?')[0]);
          const localPath = path.join(UPLOADS_DIR, cleanBase);
          if (fs.existsSync(localPath)) {
            return res.sendFile(localPath);
          }
          // If not found locally, return transparent fallback image
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.status(200).send(TRANSPARENT_PNG);
        }
      }

      // Check if it is an ImgBB HTML viewer link (e.g. https://ibb.co/xyz)
      const isIbbViewer = targetUrl.includes('ibb.co/') && !targetUrl.includes('i.ibb.co/');

      let response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html,*/*;q=0.8',
        }
      });

      if (!response.ok && (response.status === 404 || response.status === 410)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(TRANSPARENT_PNG);
      }

      let contentType = response.headers.get('content-type') || '';

      // If response is HTML (e.g. ImgBB viewer page or redirect page), extract direct image
      if (contentType.includes('text/html') || isIbbViewer) {
        const html = await response.text();

        // Search for direct image URL in meta tags or page content
        const ogMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image)["']/i) ||
                        html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+id=["']image-viewer["'][^>]+src=["']([^"']+)["']/i) ||
                        html.match(/https:\/\/i\.ibb\.co\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/i);

        const directImgUrl = ogMatch ? (ogMatch[1] || ogMatch[0]) : null;

        if (directImgUrl && (directImgUrl.startsWith('http://') || directImgUrl.startsWith('https://'))) {
          const directResponse = await fetch(directImgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
          });

          if (directResponse.ok) {
            const imgContentType = directResponse.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', imgContentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
            const arrayBuffer = await directResponse.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(TRANSPARENT_PNG);
      }

      if (!response.ok) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(TRANSPARENT_PNG);
      }

      res.setHeader('Content-Type', contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');

      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('[Image Proxy Error]:', err.message);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(TRANSPARENT_PNG);
    }
  });

  // Reusable Base64 to ImgBB CDN (or Local Static) Converter
  const uploadBase64ToServerOrImgBB = async (b64: string, name: string): Promise<string | null> => {
    if (!b64 || typeof b64 !== 'string') return null;
    if (b64.startsWith('data:video/')) return null; // Drop videos

    let base64Data = b64;
    let detectedMime = 'image/jpeg';
    if (b64.includes('base64,')) {
      const match = b64.match(/^data:([^;]+);base64,/);
      if (match) detectedMime = match[1];
      base64Data = b64.split('base64,')[1];
    }

    const ext = detectedMime.includes('webp') ? 'webp' : detectedMime.includes('png') ? 'png' : detectedMime.includes('gif') ? 'gif' : detectedMime.includes('audio') ? 'webm' : 'jpg';
    const cleanName = `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const apiKey = process.env.IMGBB_API_KEY;
    if (apiKey && apiKey.trim() !== '' && !detectedMime.includes('audio')) {
      try {
        const formData = new URLSearchParams();
        formData.append('image', base64Data);
        formData.append('name', name);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        const data = (await response.json()) as any;
        if (response.ok && data.success && (data.data?.display_url || data.data?.url || data.data?.image?.url)) {
          return data.data.image?.url || data.data.display_url || data.data.url;
        }
      } catch (e) {}
    }

    // Save local with 1-year immutable cache header
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(UPLOADS_DIR, cleanName);
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${cleanName}`;
  };

  const migrateStringPayload = async (str: string, label: string): Promise<{ text: string; changed: boolean }> => {
    if (!str || typeof str !== 'string' || !str.includes('data:')) return { text: str, changed: false };
    const dataUrlRegex = /data:(image|audio|video)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
    const matches = str.match(dataUrlRegex);
    if (!matches || matches.length === 0) return { text: str, changed: false };

    let result = str;
    let changed = false;
    for (const match of matches) {
      if (match.startsWith('data:video/')) {
        result = result.replace(match, '');
        changed = true;
      } else {
        const newUrl = await uploadBase64ToServerOrImgBB(match, label);
        if (newUrl) {
          result = result.replace(match, newUrl);
          changed = true;
        }
      }
    }
    return { text: result, changed };
  };

  // Automatic Background Worker: Continuously migrates legacy Base64 PFPs and Banners in the database to ImgBB CDN
  async function autoMigrateBase64ProfilesAndBanners() {
    try {
      console.log('[AutoMigration] Checking for legacy Base64 PFPs and Banners in database...');
      const { data: profiles, error } = await serverSupabase
        .from('profiles')
        .select('id, photo_url, banner_url, custom_theme')
        .limit(200);

      if (error || !profiles) {
        console.warn('[AutoMigration] Profiles query note:', error?.message);
        return;
      }

      let migratedCount = 0;
      for (const p of profiles) {
        let changed = false;
        let newPhoto = p.photo_url;
        let newBanner = p.banner_url;
        let newTheme = p.custom_theme ? { ...p.custom_theme } : {};

        // Auto-migrate PFP
        if (p.photo_url && typeof p.photo_url === 'string' && p.photo_url.includes('data:')) {
          const url = await uploadBase64ToServerOrImgBB(p.photo_url, `pfp_${p.id}`);
          if (url) {
            newPhoto = url;
            changed = true;
            migratedCount++;
          }
        }

        // Auto-migrate Banner
        if (p.banner_url && typeof p.banner_url === 'string' && p.banner_url.includes('data:')) {
          const url = await uploadBase64ToServerOrImgBB(p.banner_url, `banner_${p.id}`);
          if (url) {
            newBanner = url;
            changed = true;
            migratedCount++;
          }
        }

        // Auto-migrate Wallpaper
        if (newTheme.wallpaper && typeof newTheme.wallpaper === 'string' && newTheme.wallpaper.includes('data:')) {
          const url = await uploadBase64ToServerOrImgBB(newTheme.wallpaper, `wallpaper_${p.id}`);
          if (url) {
            newTheme.wallpaper = url;
            changed = true;
            migratedCount++;
          }
        }

        if (changed) {
          console.log(`[AutoMigration] Migrated legacy Base64 for user ${p.id} to CDN (photo: ${Boolean(newPhoto)}, banner: ${Boolean(newBanner)})`);
          await serverSupabase
            .from('profiles')
            .update({
              photo_url: newPhoto,
              banner_url: newBanner,
              custom_theme: newTheme,
              updated_at: new Date().toISOString()
            })
            .eq('id', p.id);

          // Synchronize author photo across other tables
          if (newPhoto && newPhoto !== p.photo_url) {
            await Promise.allSettled([
              serverSupabase.from('posts').update({ author_photo: newPhoto }).eq('author_id', p.id),
              serverSupabase.from('forum_threads').update({ author_photo: newPhoto }).eq('author_id', p.id),
              serverSupabase.from('forum_comments').update({ author_photo: newPhoto }).eq('author_id', p.id),
              serverSupabase.from('notifications').update({ actor_photo: newPhoto }).eq('actor_id', p.id)
            ]);
          }
        }
      }

      if (migratedCount > 0) {
        console.log(`[AutoMigration] Success: Automatically migrated ${migratedCount} PFPs/Banners to ImgBB / CDN.`);
      }
    } catch (jobErr) {
      console.warn('[AutoMigration] Background worker note:', jobErr);
    }
  }

  // Launch initial scan 5 seconds after startup, then every 20 minutes
  setTimeout(() => {
    autoMigrateBase64ProfilesAndBanners().catch(console.error);
  }, 5000);
  setInterval(() => {
    autoMigrateBase64ProfilesAndBanners().catch(console.error);
  }, 20 * 60 * 1000);

  // Admin Media Migration API (Converts all remaining legacy Base64 across all tables)
  app.post('/api/admin/migrate-media', async (req, res) => {
    try {
      const supabase = serverSupabase;

      let totalMigrated = 0;
      const details = {
        posts: 0,
        messages: 0,
        profileMedia: 0,
        profiles: 0,
        forumThreads: 0,
        forumComments: 0
      };

      // 1. Migrate profile_media
      try {
        const { data: mediaItems } = await supabase.from('profile_media').select('id, media_url, media_type').limit(300);
        if (mediaItems) {
          for (const item of mediaItems) {
            if (item.media_url && typeof item.media_url === 'string' && item.media_url.includes('data:')) {
              if (item.media_url.startsWith('data:video/')) {
                await supabase.from('profile_media').delete().eq('id', item.id);
                details.profileMedia++;
                totalMigrated++;
              } else {
                const newUrl = await uploadBase64ToServerOrImgBB(item.media_url, `feed_${item.id}`);
                if (newUrl) {
                  await supabase.from('profile_media').update({ media_url: newUrl }).eq('id', item.id);
                  details.profileMedia++;
                  totalMigrated++;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Server Migration] profile_media error:', e);
      }

      // 2. Migrate posts (General chat & feed)
      try {
        const { data: posts } = await supabase.from('posts').select('id, content, author_photo').order('created_at', { ascending: false }).limit(300);
        if (posts) {
          for (const post of posts) {
            let updated = false;
            let newContent = post.content;
            let newAuthorPhoto = post.author_photo;

            if (post.author_photo && post.author_photo.includes('data:')) {
              const photoUrl = await uploadBase64ToServerOrImgBB(post.author_photo, `author_${post.id}`);
              if (photoUrl) {
                newAuthorPhoto = photoUrl;
                updated = true;
              }
            }

            if (post.content && typeof post.content === 'string') {
              const decrypted = decryptGeneralChat(post.content);
              const { text: cleanText, changed } = await migrateStringPayload(decrypted, `post_${post.id}`);
              if (changed) {
                newContent = encryptGeneralChat(cleanText);
                updated = true;
              }
            }

            if (updated) {
              await supabase.from('posts').update({ content: newContent, author_photo: newAuthorPhoto }).eq('id', post.id);
              details.posts++;
              totalMigrated++;
            }
          }
        }
      } catch (e) {
        console.warn('[Server Migration] posts error:', e);
      }

      // 3. Migrate messages (DMs)
      try {
        const { data: msgs } = await supabase.from('messages').select('id, text').order('created_at', { ascending: false }).limit(300);
        if (msgs) {
          for (const msg of msgs) {
            if (msg.text && typeof msg.text === 'string') {
              const decrypted = decryptGeneralChat(msg.text);
              const { text: cleanText, changed } = await migrateStringPayload(decrypted, `dm_${msg.id}`);
              if (changed) {
                const encrypted = encryptGeneralChat(cleanText);
                await supabase.from('messages').update({ text: encrypted }).eq('id', msg.id);
                details.messages++;
                totalMigrated++;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Server Migration] messages error:', e);
      }

      // 4. Migrate profiles
      try {
        const { data: profiles } = await supabase.from('profiles').select('id, photo_url, banner_url, custom_theme').limit(200);
        if (profiles) {
          for (const p of profiles) {
            let updated = false;
            let newPhoto = p.photo_url;
            let newBanner = p.banner_url;
            let newTheme = p.custom_theme;

            if (p.photo_url && p.photo_url.includes('data:')) {
              const u = await uploadBase64ToServerOrImgBB(p.photo_url, `p_photo_${p.id}`);
              if (u) { newPhoto = u; updated = true; }
            }
            if (p.banner_url && p.banner_url.includes('data:')) {
              const u = await uploadBase64ToServerOrImgBB(p.banner_url, `p_banner_${p.id}`);
              if (u) { newBanner = u; updated = true; }
            }
            if (p.custom_theme?.wallpaper && typeof p.custom_theme.wallpaper === 'string' && p.custom_theme.wallpaper.includes('data:')) {
              const u = await uploadBase64ToServerOrImgBB(p.custom_theme.wallpaper, `p_wall_${p.id}`);
              if (u) {
                newTheme = { ...newTheme, wallpaper: u };
                updated = true;
              }
            }

            if (updated) {
              await supabase.from('profiles').update({ photo_url: newPhoto, banner_url: newBanner, custom_theme: newTheme }).eq('id', p.id);
              if (newPhoto && newPhoto !== p.photo_url) {
                await Promise.allSettled([
                  supabase.from('posts').update({ author_photo: newPhoto }).eq('author_id', p.id),
                  supabase.from('forum_threads').update({ author_photo: newPhoto }).eq('author_id', p.id),
                  supabase.from('forum_comments').update({ author_photo: newPhoto }).eq('author_id', p.id),
                  supabase.from('notifications').update({ actor_photo: newPhoto }).eq('actor_id', p.id),
                ]);
              }
              details.profiles++;
              totalMigrated++;
            }
          }
        }
      } catch (e) {
        console.warn('[Server Migration] profiles error:', e);
      }

      console.log(`[Admin Migration Complete]: Migrated ${totalMigrated} items across all tables.`, details);
      return res.json({
        success: true,
        totalMigrated,
        details
      });
    } catch (err: any) {
      console.error('[Admin Migration Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve compiled assets under /assets/ or return 404 if chunk does not exist
  app.use('/assets', (req, res, next) => {
    const distAssetPath = path.join(process.cwd(), 'dist', 'assets', path.basename(req.path));
    if (fs.existsSync(distAssetPath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(distAssetPath);
    }
    return res.status(404).setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0').send('Asset not found');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        const fileName = path.basename(filePath);
        if (fileName === 'sw.js' || fileName === 'manifest.json' || fileName.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        } else if (filePath.includes(path.join('dist', 'assets'))) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    // SPA fallback: Send index.html with NO CACHE
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Self-keep-alive loop (ping localhost to bypass external cookie check proxy)
  setInterval(() => {
    fetch(`http://localhost:${PORT}/api/health`)
      .then(res => res.json())
      .then(data => console.log('[Keep-Alive] Self-ping successful:', data.status))
      .catch(err => console.warn('[Keep-Alive] Self-ping error:', err.message));
  }, 4 * 60 * 1000); // every 4 minutes

  // Start Discord Bot
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  if (!discordBotToken) {
    console.log('⚠️ DISCORD_BOT_TOKEN is niet ingesteld in de omgevingsvariabelen. De Discord Bot start niet.');
  } else {
    try {
      // Single-instance check using a PID file to prevent duplicate bot instances in development
      const pidFile = path.join(process.cwd(), '.discord_bot.pid');
      if (fs.existsSync(pidFile)) {
        try {
          const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
          if (oldPid && oldPid !== process.pid) {
            try {
              console.log(`[Discord Bot] Sending SIGKILL to potential duplicate process with PID ${oldPid}...`);
              process.kill(oldPid, 'SIGKILL');
              // Give the OS a tiny fraction of a second to release the port or token connection if any
              const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
              await delay(200);
            } catch (e) {
              // Safe to ignore if process already terminated
            }
          }
        } catch (err) {
          console.warn('[Discord Bot] Error reading or parsing PID file:', err);
        }
      }
      fs.writeFileSync(pidFile, process.pid.toString(), 'utf8');

      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      // Verification function to terminate duplicate or zombie bot processes
      const isProcessActive = (): boolean => {
        try {
          if (fs.existsSync(pidFile)) {
            const activePid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
            if (activePid && activePid !== process.pid) {
              console.log(`[Discord Bot] Process ${process.pid} is no longer the active bot instance (Active PID is ${activePid}). Terminating to prevent duplicates...`);
              try {
                client.destroy();
              } catch (e) {}
              process.exit(0);
              return false;
            }
          }
        } catch (err) {
          // Ignore read errors
        }
        return true;
      };

      // Decrypt General Chat helper for the Discord Bot
      const CHAT_ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'w836mDIpEhFnugUrKLgroqOp026IEKspJrckVQf5g9M=';
      const LEGACY_CHAT_ENCRYPTION_KEY = 'app-chat-secret-key-2024';

      const decryptGeneralChat = (cipherText: string): string => {
        try {
          if (!cipherText || typeof cipherText !== 'string') {
            return typeof cipherText === 'string' ? cipherText : '';
          }
          
          let cleanText = cipherText.trim();
          
          if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
            cleanText = cleanText.substring(1, cleanText.length - 1).trim();
          }
          if (cleanText.startsWith("'") && cleanText.endsWith("'")) {
            cleanText = cleanText.substring(1, cleanText.length - 1).trim();
          }
          if (cleanText.startsWith('\\"') && cleanText.endsWith('\\"')) {
            cleanText = cleanText.substring(2, cleanText.length - 2).trim();
          }

          let actualCipher = cleanText;
          if (cleanText.startsWith('gc:')) {
            actualCipher = cleanText.substring(3).trim();
          }
          
          // 1. Primary key decrypt
          try {
            const bytes = CryptoJS.AES.decrypt(actualCipher, CHAT_ENCRYPTION_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (originalText && originalText.trim().length > 0) {
              return originalText;
            }
            const latinText = bytes.toString(CryptoJS.enc.Latin1);
            if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
              return latinText;
            }
          } catch (e) {}

          // 2. Legacy key decrypt
          try {
            const bytes = CryptoJS.AES.decrypt(actualCipher, LEGACY_CHAT_ENCRYPTION_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (originalText && originalText.trim().length > 0) {
              return originalText;
            }
            const latinText = bytes.toString(CryptoJS.enc.Latin1);
            if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
              return latinText;
            }
          } catch (e) {}
          
          return cipherText;
        } catch (error) {
          console.error('Decryption failed for:', cipherText, error);
          return typeof cipherText === 'string' ? cipherText : '';
        }
      };

      // --- Database Offline Resilience Caching ---
      interface CacheSchema {
        profiles: any[];
        posts: any[];
        lastUpdated: string;
      }

      const CACHE_FILE = path.join(process.cwd(), '.supabase_cache.json');

      const getCache = (): CacheSchema => {
        try {
          if (fs.existsSync(CACHE_FILE)) {
            const content = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(content);
          }
        } catch (err) {
          console.error('[Offline Cache] Error reading cache file:', err);
        }
        return { profiles: [], posts: [], lastUpdated: '' };
      };

      const updateCache = (key: 'profiles' | 'posts', data: any[]) => {
        try {
          const cache = getCache();
          cache[key] = data;
          cache.lastUpdated = new Date().toISOString();
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
        } catch (err) {
          console.error('[Offline Cache] Error writing cache file:', err);
        }
      };

      // --- Discord Bot Configuration & Channel Forwarding ---
      interface BotConfig {
        chat_channel_id?: string;
        reports_channel_id?: string;
      }

      const CONFIG_FILE = path.join(process.cwd(), 'discord_bot_config.json');

      const getBotConfig = (): BotConfig => {
        try {
          if (fs.existsSync(CONFIG_FILE)) {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content);
          }
        } catch (err) {
          console.error('[Bot Config] Error reading config file:', err);
        }
        return {};
      };

      const saveBotConfig = (config: BotConfig) => {
        try {
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        } catch (err) {
          console.error('[Bot Config] Error writing config file:', err);
        }
      };

      const sendToConfiguredChannel = async (type: 'chat' | 'reports', embed: EmbedBuilder) => {
        const config = getBotConfig();
        const channelId = type === 'chat' ? config.chat_channel_id : config.reports_channel_id;
        if (!channelId) {
          console.log(`[Discord Bot] No ${type} channel configured. Skipping forwarding.`);
          return;
        }

        try {
          const channel = await client.channels.fetch(channelId);
          if (channel) {
            const isText = (channel as any).type === 0 || (channel as any).type === 5 || (channel as any).type === 11 || (channel as any).type === 12 || (typeof (channel as any).isTextBased === 'function' && (channel as any).isTextBased());
            if (isText) {
              await (channel as any).send({ embeds: [embed] });
              console.log(`[Discord Bot] Successfully forwarded ${type} embed to channel ${channelId}`);
            } else {
              console.warn(`[Discord Bot] Channel ${channelId} is not a valid text/announcement/thread channel (Type: ${(channel as any).type}).`);
            }
          } else {
            console.warn(`[Discord Bot] Channel ${channelId} could not be found or resolved.`);
          }
        } catch (err) {
          console.error(`[Discord Bot] Failed to send message to configured ${type} channel (${channelId}):`, err);
          if (err instanceof Error && (err.message.includes('Missing Access') || (err as any).code === 50001)) {
            console.error(`[Discord Bot] 💡 TIP: De bot heeft geen "Kanalen bekijken" (View Channel) of "Berichten verzenden" (Send Messages) machtigingen in het ingestelde kanaal (${channelId}). Voeg de bot toe aan het kanaal en geef de benodigde machtigingen.`);
          }
        }
      };

      // Expose API endpoints for direct, robust event forwarding from React Client
      app.post('/api/bot/forward-chat', async (req, res) => {
        try {
          const { author_id, author_name, content, created_at } = req.body;
          if (!content) {
            return res.status(400).json({ error: 'Missing content' });
          }

          const decryptedContent = decryptGeneralChat(content);
          
          let displayName = author_name || 'Anoniem';
          if (author_id) {
            try {
              const { data: profile } = await serverSupabase
                .from('profiles')
                .select('display_name')
                .eq('id', author_id)
                .single();
              if (profile?.display_name) {
                displayName = profile.display_name;
              }
            } catch (err) {}
          }

          const embed = new EmbedBuilder()
            .setTitle('💬 Nieuw bericht in de App Chat!')
            .setDescription(decryptedContent || '*(Leeg bericht)*')
            .setColor(0x3498db)
            .addFields(
              { name: '👤 Afzender', value: displayName, inline: true },
              { name: '📅 Tijdstip', value: new Date(created_at || Date.now()).toLocaleString('nl-NL'), inline: true }
            )
            .setTimestamp();

          await sendToConfiguredChannel('chat', embed);
          res.json({ success: true });
        } catch (err) {
          console.error('[API bot/forward-chat] Error:', err);
          res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
        }
      });

      app.post('/api/bot/forward-report', async (req, res) => {
        try {
          const { reporter_id, reported_id, target_type, target_id, reason, details } = req.body;

          let reporterName = 'Systeem/Anoniem';
          let reportedName = 'Onbekend';

          try {
            if (reporter_id && reporter_id !== 'SYSTEM') {
              const { data: profile } = await serverSupabase
                .from('profiles')
                .select('display_name')
                .eq('id', reporter_id)
                .single();
              if (profile?.display_name) {
                reporterName = profile.display_name;
              }
            } else if (reporter_id === 'SYSTEM') {
              reporterName = '🚨 Systeem (Automatisch)';
            }

            if (reported_id) {
              const { data: profile } = await serverSupabase
                .from('profiles')
                .select('display_name')
                .eq('id', reported_id)
                .single();
              if (profile?.display_name) {
                reportedName = profile.display_name;
              }
            }
          } catch (err) {}

          const targetTypeLabel = target_type === 'user' ? 'Gebruiker' : target_type === 'post' ? 'Post/Bericht' : target_type;

          const embed = new EmbedBuilder()
            .setTitle('🚨 Nieuwe Rapportage Ontvangen!')
            .setColor(0xe74c3c)
            .addFields(
              { name: '👤 Melder', value: reporterName, inline: true },
              { name: '👤 Gerapporteerde', value: reportedName, inline: true },
              { name: '📁 Type', value: targetTypeLabel, inline: true },
              { name: '❓ Reden', value: reason || 'Geen reden opgegeven', inline: false }
            )
            .setTimestamp();

          if (details) {
            embed.addFields({ name: '📝 Details', value: details });
          }

          await sendToConfiguredChannel('reports', embed);
          res.json({ success: true });
        } catch (err) {
          console.error('[API bot/forward-report] Error:', err);
          res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
        }
      });

      const getProfilesWithCache = async (supabaseClient: any) => {
        let profiles: any[] = [];
        let isCacheFallback = false;
        try {
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url')
            .limit(100);
          if (error) throw error;
          if (data) {
            profiles = data;
            updateCache('profiles', data);
          }
        } catch (err) {
          console.error('[Database Fallback] Failed to fetch profiles, using offline cache:', err);
          const cached = getCache();
          profiles = cached.profiles || [];
          isCacheFallback = true;
        }
        return { profiles, isCacheFallback };
      };

      const getPostsWithCache = async (supabaseClient: any) => {
        let posts: any[] = [];
        let isCacheFallback = false;
        try {
          const { data, error } = await supabaseClient
            .from('posts')
            .select('author_id, author_name, content, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
          if (error) throw error;
          if (data) {
            posts = data;
            updateCache('posts', data);
          }
        } catch (err) {
          console.error('[Database Fallback] Failed to fetch posts, using offline cache:', err);
          const cached = getCache();
          posts = cached.posts || [];
          isCacheFallback = true;
        }
        return { posts, isCacheFallback };
      };

      // --- Discord Arcade Games Engine ---
      interface GameState {
        type: 'snake' | 'higherlower' | 'tictactoe';
        userId: string;
        userName: string;
        score: number;
        data: any;
      }

      const activeGames = new Map<string, GameState>();

      const renderSnakeBoard = (snake: { x: number; y: number }[], apple: { x: number; y: number }): string => {
        let board = '';
        for (let y = 0; y < 7; y++) {
          for (let x = 0; x < 7; x++) {
            if (snake[0].x === x && snake[0].y === y) {
              board += '🐍';
            } else if (snake.some((s, idx) => idx > 0 && s.x === x && s.y === y)) {
              board += '🟢';
            } else if (apple.x === x && apple.y === y) {
              board += '🍎';
            } else {
              board += '⬛';
            }
          }
          board += '\n';
        }
        return board;
      };

      const startSnakeGame = (userId: string, userName: string) => {
        const snake = [{ x: 3, y: 3 }, { x: 3, y: 4 }];
        let apple = { x: 1, y: 1 };
        while (snake.some(s => s.x === apple.x && s.y === apple.y)) {
          apple = { x: Math.floor(Math.random() * 7), y: Math.floor(Math.random() * 7) };
        }
        return {
          type: 'snake' as const,
          userId,
          userName,
          score: 0,
          data: { snake, apple, dir: 'up' }
        };
      };

      const startTicTacToeGame = (userId: string, userName: string) => {
        return {
          type: 'tictactoe' as const,
          userId,
          userName,
          score: 0,
          data: {
            board: Array(9).fill(''),
            status: 'ongoing'
          }
        };
      };

      const startHigherLowerGame = (userId: string, userName: string) => {
        const startNum = Math.floor(Math.random() * 90) + 5;
        return {
          type: 'higherlower' as const,
          userId,
          userName,
          score: 0,
          data: {
            currentNumber: startNum,
            status: 'ongoing'
          }
        };
      };

      const getSnakeComponents = () => {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('snake_left').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snake_up').setLabel('⬆️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snake_down').setLabel('⬇️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snake_right').setLabel('➡️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snake_stop').setLabel('❌ Stop').setStyle(ButtonStyle.Danger)
        );
        return [row];
      };

      const getTicTacToeComponents = (board: string[], disabled = false) => {
        const rows = [];
        for (let r = 0; r < 3; r++) {
          const row = new ActionRowBuilder<ButtonBuilder>();
          for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const val = board[idx];
            let label = '➖';
            let style = ButtonStyle.Secondary;
            if (val === 'X') {
              label = '❌';
              style = ButtonStyle.Success;
            } else if (val === 'O') {
              label = '⭕';
              style = ButtonStyle.Danger;
            }
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`ttt_${idx}`)
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disabled || val !== '')
            );
          }
          rows.push(row);
        }
        const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('ttt_stop').setLabel('❌ Stop').setStyle(ButtonStyle.Danger).setDisabled(disabled)
        );
        rows.push(controlRow);
        return rows;
      };

      const getHigherLowerComponents = (disabled = false) => {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('hl_higher').setLabel('🔼 Hoger').setStyle(ButtonStyle.Primary).setDisabled(disabled),
          new ButtonBuilder().setCustomId('hl_lower').setLabel('🔽 Lager').setStyle(ButtonStyle.Primary).setDisabled(disabled),
          new ButtonBuilder().setCustomId('hl_stop').setLabel('❌ Stop').setStyle(ButtonStyle.Danger).setDisabled(disabled)
        );
        return [row];
      };

      client.on('ready', async () => {
        console.log(`🤖 Discord Bot is online als ${client.user?.tag}!`);

        // Register slash commands (/) with Discord
        try {
          const slashCommands = [
            {
              name: 'help',
              description: "Bekijk alle beschikbare commando's van de FTJM Bot."
            },
            {
              name: 'leaderboard',
              description: 'Bekijk de top 5 highscores van alle games live!'
            },
            {
              name: 'stats',
              description: 'Bekijk de persoonlijke highscores van een specifieke speler.',
              options: [
                {
                  name: 'gebruiker',
                  description: 'De naam of display name van de speler',
                  type: 3, // STRING
                  required: true
                }
              ]
            },
            {
              name: 'chat',
              description: 'Bekijk de meest recente berichten in de General Chat.'
            },
            {
              name: 'play',
              description: 'Speel een game direct in Discord!',
              options: [
                {
                  name: 'game',
                  description: 'Kies welke game je wilt spelen',
                  type: 3, // STRING
                  required: true,
                  choices: [
                    { name: '🐍 Snake (Interactive Button Grid!)', value: 'snake' },
                    { name: '🔢 Higher or Lower (Getallenspel)', value: 'higherlower' },
                    { name: '❌ Tic-Tac-Toe (Boter-kaas-en-eieren)', value: 'tictactoe' }
                  ]
                }
              ]
            },
            {
              name: 'site',
              description: 'Ontvang een directe link naar de live app.'
            },
            {
              name: 'setchannel',
              description: 'Stel het Discord kanaal in voor chatberichten of rapportages.',
              options: [
                {
                  name: 'type',
                  description: 'Kies chatberichten of rapportages',
                  type: 3, // STRING
                  required: true,
                  choices: [
                    { name: '💬 App Chatberichten (Posts)', value: 'chat' },
                    { name: '🚨 Rapportages (Reports)', value: 'reports' }
                  ]
                },
                {
                  name: 'kanaal',
                  description: 'Kies het textkanaal',
                  type: 7, // CHANNEL
                  required: true,
                  channel_types: [0, 5, 11, 12] // Restrict to GuildText, GuildAnnouncement, PublicThread, PrivateThread
                }
              ]
            }
          ];

          // Global commands (can take up to 1 hour to propagate)
          await client.application?.commands.set(slashCommands);

          // Guild commands (propagates instantly to all guilds the bot is in)
          try {
            const guilds = await client.guilds.fetch();
            for (const [guildId] of guilds) {
              const guild = await client.guilds.fetch(guildId);
              await guild.commands.set(slashCommands);
              console.log(`[Discord Bot] Slash commands geregistreerd voor guild: ${guild.name} (${guildId})`);
            }
          } catch (guildErr) {
            console.error('[Discord Bot] Fout bij guild commands registratie:', guildErr);
          }

          console.log('✅ Discord Slash Commands (/) succesvol geregistreerd!');

          // --- Supabase Realtime Forwarding to Discord Channels ---
          const supabaseUrl = activeSupabaseUrl;
          const supabaseKey = activeSupabaseKey;

          if (supabaseUrl && supabaseKey) {
            console.log('[Discord Bot] Starting Supabase Realtime listeners for forwarding chat & reports...');
            const { createClient: createSupabase } = await import('@supabase/supabase-js');
            const botSupabase = createSupabase(supabaseUrl, supabaseKey);

            // Subscribe to posts (INSERT events)
            botSupabase
              .channel('bot-posts-sync')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
                if (!isProcessActive()) return;
                const newPost = payload.new;
                if (!newPost) return;

                try {
                  const decryptedContent = decryptGeneralChat(newPost.content || '');
                  
                  // Resolve author display name
                  let displayName = 'Anoniem';
                  if (newPost.author_id) {
                    const { data: profile } = await botSupabase
                      .from('profiles')
                      .select('display_name')
                      .eq('id', newPost.author_id)
                      .single();
                    if (profile?.display_name && profile.display_name.trim() !== '') {
                      displayName = profile.display_name;
                    }
                  }
                  if (displayName === 'Anoniem' && newPost.author_name && newPost.author_name !== 'null' && newPost.author_name.trim() !== '') {
                    displayName = newPost.author_name;
                  }

                  const safeDisplayName = displayName.trim() || 'Anoniem';
                  const safeContent = (decryptedContent || '').trim() || '*(Leeg bericht)*';

                  const embed = new EmbedBuilder()
                    .setTitle('💬 Nieuw bericht in de App Chat!')
                    .setDescription(safeContent.substring(0, 4000))
                    .setColor(0x3498db)
                    .addFields(
                      { name: '👤 Afzender', value: safeDisplayName.substring(0, 1000), inline: true },
                      { name: '📅 Tijdstip', value: new Date(newPost.created_at).toLocaleString('nl-NL'), inline: true }
                    )
                    .setTimestamp();

                  await sendToConfiguredChannel('chat', embed);
                } catch (err) {
                  console.error('[Bot Realtime Posts] Error handling post insertion:', err);
                }
              })
              .subscribe();

            // Subscribe to reports (INSERT events)
            botSupabase
              .channel('bot-reports-sync')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, async (payload) => {
                if (!isProcessActive()) return;
                const newReport = payload.new;
                if (!newReport) return;

                try {
                  // Resolve reporter display name
                  let reporterName = 'Systeem/Anoniem';
                  if (newReport.reporter_id && newReport.reporter_id !== 'SYSTEM') {
                    const { data: profile } = await botSupabase
                      .from('profiles')
                      .select('display_name')
                      .eq('id', newReport.reporter_id)
                      .single();
                    if (profile?.display_name) {
                      reporterName = profile.display_name;
                    }
                  } else if (newReport.reporter_id === 'SYSTEM') {
                    reporterName = '🚨 Systeem (Automatisch)';
                  }

                  // Resolve reported user display name
                  let reportedName = 'Onbekend';
                  if (newReport.reported_id) {
                    const { data: profile } = await botSupabase
                      .from('profiles')
                      .select('display_name')
                      .eq('id', newReport.reported_id)
                      .single();
                    if (profile?.display_name) {
                      reportedName = profile.display_name;
                    }
                  }

                  const targetTypeLabel = newReport.target_type === 'user' ? 'Gebruiker' : newReport.target_type === 'post' ? 'Post/Bericht' : newReport.target_type;

                  const embed = new EmbedBuilder()
                    .setTitle('🚨 Nieuwe Rapportage Ontvangen!')
                    .setColor(0xe74c3c)
                    .addFields(
                      { name: '👤 Melder', value: reporterName, inline: true },
                      { name: '👤 Gerapporteerde', value: reportedName, inline: true },
                      { name: '📁 Type', value: targetTypeLabel, inline: true },
                      { name: '❓ Reden', value: newReport.reason || 'Geen reden opgegeven', inline: false }
                    )
                    .setTimestamp();

                  if (newReport.details) {
                    embed.addFields({ name: '📝 Details', value: newReport.details });
                  }

                  await sendToConfiguredChannel('reports', embed);
                } catch (err) {
                  console.error('[Bot Realtime Reports] Error handling report insertion:', err);
                }
              })
              .subscribe();
          }
        } catch (regErr) {
          console.error('❌ Fout bij registreren slash commands:', regErr);
        }
      });

      // Handle Slash Commands (Interactions)
      client.on('interactionCreate', async (interaction) => {
        if (!isProcessActive()) return;
        try {
          if (interaction.isButton()) {
          const game = activeGames.get(interaction.message.id);
          if (!game) {
            await interaction.reply({ content: '❌ Dit spel is niet meer actief of verlopen. Start een nieuw spel!', ephemeral: true });
            return;
          }

          if (interaction.user.id !== game.userId) {
            await interaction.reply({ content: `❌ Alleen **${game.userName}** kan dit spel besturen! Typ \`/play\` of \`!play\` om zelf een spel te starten.`, ephemeral: true });
            return;
          }

          if (interaction.customId === 'snake_stop' || interaction.customId === 'ttt_stop' || interaction.customId === 'hl_stop') {
            activeGames.delete(interaction.message.id);
            const embed = new EmbedBuilder()
              .setTitle('🚪 Spel Gestopt')
              .setDescription(`**${game.userName}** heeft het spel gestopt.\nEindscore: **${game.score}**`)
              .setColor(0x7f8c8d)
              .setTimestamp();
            await interaction.update({ embeds: [embed], components: [] });
            return;
          }

          if (game.type === 'snake') {
            let dx = 0;
            let dy = 0;
            if (interaction.customId === 'snake_up') dy = -1;
            else if (interaction.customId === 'snake_down') dy = 1;
            else if (interaction.customId === 'snake_left') dx = -1;
            else if (interaction.customId === 'snake_right') dx = 1;

            const { snake, apple } = game.data;
            const currentHead = snake[0];
            const newHead = { x: currentHead.x + dx, y: currentHead.y + dy };

            if (newHead.x < 0 || newHead.x >= 7 || newHead.y < 0 || newHead.y >= 7) {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('💥 GAME OVER - Muur geraakt!')
                .setDescription(`Je bent tegen de muur gelopen!\n\n**Eindscore**: **${game.score}**🍎`)
                .setColor(0xe74c3c)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: [] });
              return;
            }

            const isEating = (newHead.x === apple.x && newHead.y === apple.y);
            const bodyToCheck = isEating ? snake : snake.slice(0, -1);
            if (bodyToCheck.some(s => s.x === newHead.x && s.y === newHead.y)) {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('💥 GAME OVER - Jezelf gebeten!')
                .setDescription(`Je hebt jezelf gebeten!\n\n**Eindscore**: **${game.score}**🍎`)
                .setColor(0xe74c3c)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: [] });
              return;
            }

            snake.unshift(newHead);
            if (isEating) {
              game.score += 1;
              let newApple = { x: Math.floor(Math.random() * 7), y: Math.floor(Math.random() * 7) };
              let attempts = 0;
              while (snake.some(s => s.x === newApple.x && s.y === newApple.y) && attempts < 100) {
                newApple = { x: Math.floor(Math.random() * 7), y: Math.floor(Math.random() * 7) };
                attempts++;
              }
              game.data.apple = newApple;
            } else {
              snake.pop();
            }

            const boardStr = renderSnakeBoard(snake, game.data.apple);
            const embed = new EmbedBuilder()
              .setTitle(`🐍 FTJM Discord Snake - ${game.userName}`)
              .setDescription(`Gebruik de knoppen om te bewegen!\n\nScore: **${game.score}** 🍎\n\n\`\`\`\n${boardStr}\`\`\``)
              .setColor(0x2ecc71)
              .setFooter({ text: 'FTJM Arcade 🎮' });

            await interaction.update({ embeds: [embed], components: getSnakeComponents() });
          }

          else if (game.type === 'tictactoe') {
            const idx = parseInt(interaction.customId.split('_')[1]);
            const board = game.data.board;

            if (board[idx] !== '') {
              await interaction.reply({ content: '❌ Dit vakje is al bezet!', ephemeral: true });
              return;
            }

            board[idx] = 'X';

            const checkWinner = (b: string[]) => {
              const wins = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
              ];
              for (const w of wins) {
                if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) {
                  return b[w[0]];
                }
              }
              if (b.every(cell => cell !== '')) return 'draw';
              return null;
            };

            let winner = checkWinner(board);

            if (winner === 'X') {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('🎉 Gefeliciteerd! Je hebt gewonnen!')
                .setDescription(`Je hebt de FTJM Bot verslagen in Tic-Tac-Toe! 🏆`)
                .setColor(0x2ecc71)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: getTicTacToeComponents(board, true) });
              return;
            } else if (winner === 'draw') {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('🤝 Gelijkspel (Remise)')
                .setDescription(`Het is een gelijkspel geworden! Goed gespeeld.`)
                .setColor(0xf1c40f)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: getTicTacToeComponents(board, true) });
              return;
            }

            const emptyIndices = board.map((val: string, index: number) => val === '' ? index : null).filter((v: number | null) => v !== null) as number[];
            if (emptyIndices.length > 0) {
              let botChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              
              const findWinningMove = (symbol: string) => {
                for (const indexOption of emptyIndices) {
                  const tempBoard = [...board];
                  tempBoard[indexOption] = symbol;
                  if (checkWinner(tempBoard) === symbol) return indexOption;
                }
                return null;
              };

              const winningMove = findWinningMove('O');
              const blockingMove = findWinningMove('X');

              if (winningMove !== null) botChoice = winningMove;
              else if (blockingMove !== null) botChoice = blockingMove;

              board[botChoice] = 'O';
            }

            winner = checkWinner(board);

            if (winner === 'O') {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('🤖 Verloren!')
                .setDescription(`De FTJM Bot heeft gewonnen. Volgende keer beter! 🕹️`)
                .setColor(0xe74c3c)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: getTicTacToeComponents(board, true) });
              return;
            } else if (winner === 'draw') {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle('🤝 Gelijkspel (Remise)')
                .setDescription(`Het is een gelijkspel geworden! Goed gespeeld.`)
                .setColor(0xf1c40f)
                .setTimestamp();
              await interaction.update({ embeds: [embed], components: getTicTacToeComponents(board, true) });
              return;
            }

            const embed = new EmbedBuilder()
              .setTitle(`❌ Tic-Tac-Toe - ${game.userName} vs FTJM Bot`)
              .setDescription(`Jij bent ❌, de Bot is ⭕. Doe je volgende zet!`)
              .setColor(0x3498db)
              .setFooter({ text: 'FTJM Arcade 🎮' });

            await interaction.update({ embeds: [embed], components: getTicTacToeComponents(board, false) });
          }

          else if (game.type === 'higherlower') {
            const currentNum = game.data.currentNumber;
            let nextNum = Math.floor(Math.random() * 98) + 2;
            while (nextNum === currentNum) {
              nextNum = Math.floor(Math.random() * 98) + 2;
            }

            const guess = interaction.customId === 'hl_higher' ? 'higher' : 'lower';
            const correct = (guess === 'higher' && nextNum > currentNum) || (guess === 'lower' && nextNum < currentNum);

            if (correct) {
              game.score += 1;
              game.data.currentNumber = nextNum;

              const embed = new EmbedBuilder()
                .setTitle(`🔢 Higher or Lower - Score: ${game.score}`)
                .setDescription(`✅ **Goed geraden!** Het vorige getal was **${currentNum}**.\nHet nieuwe getal is **${nextNum}**.\n\nZal het volgende getal **Hoger** 🔼 of **Lager** 🔽 zijn?`)
                .setColor(0x2ecc71)
                .setFooter({ text: 'FTJM Arcade 🎮' });

              await interaction.update({ embeds: [embed], components: getHigherLowerComponents(false) });
            } else {
              activeGames.delete(interaction.message.id);
              const embed = new EmbedBuilder()
                .setTitle(`💥 Fout geraden! - GAME OVER`)
                .setDescription(`Helaas! Het getal was **${nextNum}** (vorige was **${currentNum}**).\n\n**Eindscore**: **${game.score}** goed geraden!`)
                .setColor(0xe74c3c)
                .setTimestamp();

              await interaction.update({ embeds: [embed], components: getHigherLowerComponents(true) });
            }
          }
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'help') {
          const embed = new EmbedBuilder()
            .setTitle('🎮 FTJM Discord Bot Commando\'s')
            .setDescription('Welkom bij de FTJM Chat & Arcade Bot! Gebruik de volgende slash commands:')
            .setColor(0x3498db)
            .addFields(
              { name: '🏆 `/leaderboard`', value: 'Bekijk de top 5 highscores van alle games live!' },
              { name: '📊 `/stats <gebruiker>`', value: 'Bekijk de persoonlijke highscores van een specifieke speler.' },
              { name: '💬 `/chat`', value: 'Bekijk de meest recente berichten in de General Chat (automatisch ontsleuteld).' },
              { name: '🕹️ `/play <game>`', value: 'Speel games zoals Snake, Tic-Tac-Toe en Higher/Lower live via Discord buttons!' },
              { name: '🌐 `/site` of `/app`', value: 'Ontvang een directe link naar de live app.' },
              { name: '⚙️ `/setchannel <type> <kanaal>`', value: 'Stel het doorstuurkanaal in voor chatberichten of rapportages (Admin-only).' }
            )
            .setFooter({ text: 'FTJM Chat & Arcade 🎮' })
            .setTimestamp();
          await interaction.reply({ embeds: [embed] });
        }

        else if (commandName === 'leaderboard') {
          await interaction.deferReply();
          try {
            const supabaseClient = serverSupabase;
            const { profiles, isCacheFallback } = await getProfilesWithCache(supabaseClient);

            const boards: Record<string, { name: string; score: number }[]> = {
              snake: [],
              flappy: [],
              sysadmin: [],
              hamster: [],
              conquest: [],
              geometry: [],
              breakout: []
            };

            profiles?.forEach((p: any) => {
              const highScores = p.custom_theme?.game_high_scores || {};
              Object.keys(boards).forEach((gameId) => {
                const score = Number(highScores[gameId]);
                if (score > 0) {
                  boards[gameId].push({
                    name: p.display_name || 'Anoniem',
                    score: score
                  });
                }
              });
            });

            Object.keys(boards).forEach((gameId) => {
              boards[gameId].sort((a, b) => b.score - a.score).splice(5);
            });

            const title = '🏆 FTJM LIVE HIGH SCORES' + (isCacheFallback ? ' ⚠️ (Offline Cache)' : '');
            const embed = new EmbedBuilder()
              .setTitle(title)
              .setColor(isCacheFallback ? 0xe67e22 : 0xf1c40f)
              .setTimestamp();

            if (isCacheFallback) {
              embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende offline opgeslagen highscores op de server.*');
            }

            const gameNames: Record<string, string> = {
              snake: '🐍 Snake',
              flappy: '🐦 Flappy Bird',
              sysadmin: '💻 SysAdmin Server Chaos',
              hamster: '🐹 Hamster Pacman',
              conquest: '🏰 Conquest',
              geometry: '📐 Geometry Dash',
              breakout: '🧱 Breakout'
            };

            Object.keys(boards).forEach((gameId) => {
              const list = boards[gameId];
              const name = gameNames[gameId] || gameId;
              let val = 'Geen scores bekend.';
              if (list.length > 0) {
                val = list.map((item, idx) => `${idx + 1}. **${item.name}**: ${item.score} ptn`).join('\n');
              }
              embed.addFields({ name: name, value: val, inline: true });
            });

            await interaction.editReply({ embeds: [embed] });
          } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fout bij het ophalen van de highscores.');
          }
        }

        else if (commandName === 'stats') {
          const queryName = interaction.options.getString('gebruiker')?.trim().toLowerCase();
          if (!queryName) {
            await interaction.reply({ content: '❌ Voer een geldige spelernaam in.', ephemeral: true });
            return;
          }

          await interaction.deferReply();
          try {
            const supabaseClient = serverSupabase;
            const { profiles, isCacheFallback } = await getProfilesWithCache(supabaseClient);

            const found = profiles?.find((p: any) => 
              p.display_name?.toLowerCase() === queryName || 
              p.display_name?.toLowerCase().includes(queryName)
            );

            if (!found) {
              await interaction.editReply(`❌ Geen speler gevonden met de naam "${interaction.options.getString('gebruiker')}".`);
              return;
            }

            const highScores = found.custom_theme?.game_high_scores || {};
            const title = `🎮 STATISTIEKEN VOOR ${found.display_name.toUpperCase()}` + (isCacheFallback ? ' ⚠️ (Offline Cache)' : '');
            const embed = new EmbedBuilder()
              .setTitle(title)
              .setColor(isCacheFallback ? 0xe67e22 : 0x2ecc71)
              .setTimestamp();

            if (isCacheFallback) {
              embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende statistieken van deze speler.*');
            }

            if (found.photo_url) {
              embed.setThumbnail(found.photo_url);
            }

            const gameNames: Record<string, string> = {
              snake: '🐍 Snake',
              flappy: '🐦 Flappy Bird',
              sysadmin: '💻 SysAdmin Server Chaos',
              hamster: '🐹 Hamster Pacman',
              conquest: '🏰 Conquest',
              geometry: '📐 Geometry Dash',
              breakout: '🧱 Breakout'
            };

            let hasScores = false;
            Object.keys(gameNames).forEach((gameId) => {
              const score = highScores[gameId];
              if (score !== undefined) {
                embed.addFields({ name: gameNames[gameId], value: `**${score}** ptn`, inline: true });
                hasScores = true;
              }
            });

            if (!hasScores) {
              const currentDesc = embed.data.description || '';
              embed.setDescription((currentDesc ? currentDesc + '\n\n' : '') + 'Deze gebruiker heeft nog geen highscores opgeslagen.');
            }

            await interaction.editReply({ embeds: [embed] });
          } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fout bij het ophalen van de statistieken.');
          }
        }

        else if (commandName === 'chat') {
          await interaction.deferReply();
          try {
            const supabaseClient = serverSupabase;
            const { posts, isCacheFallback: isPostsFallback } = await getPostsWithCache(supabaseClient);
            const { profiles } = await getProfilesWithCache(supabaseClient);

            const title = '💬 Recente Berichten in General Chat' + (isPostsFallback ? ' ⚠️ (Offline Cache)' : '');
            const embed = new EmbedBuilder()
              .setTitle(title)
              .setColor(isPostsFallback ? 0xe67e22 : 0x9b59b6)
              .setTimestamp();

            if (isPostsFallback) {
              embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende chatberichten op de server.*');
            }

            if (!posts || posts.length === 0) {
              const currentDesc = embed.data.description || '';
              embed.setDescription((currentDesc ? currentDesc + '\n\n' : '') + 'Er zijn geen recente berichten gevonden.');
            } else {
              const list = [...posts].reverse().slice(-5); // show last 5
              list.forEach((p: any) => {
                const timeStr = new Date(p.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                const decrypted = decryptGeneralChat(p.content || '');
                const authorProf = profiles?.find((prof: any) => prof.id === p.author_id);
                const authorName = authorProf?.display_name || (!p.author_name || p.author_name === 'null' ? 'Anoniem' : p.author_name);
                embed.addFields({ name: `👤 ${authorName} (${timeStr})`, value: decrypted || '*(Leeg bericht)*' });
              });
            }

            await interaction.editReply({ embeds: [embed] });
          } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fout bij het ophalen van de berichten.');
          }
        }

        else if (commandName === 'play') {
          const gameChoice = interaction.options.getString('game');
          
          let gameObj: any;
          let embed: EmbedBuilder;
          let components: any[];

          const authorName = interaction.user.globalName || interaction.user.username;

          if (gameChoice === 'snake') {
            gameObj = startSnakeGame(interaction.user.id, authorName);
            const boardStr = renderSnakeBoard(gameObj.data.snake, gameObj.data.apple);
            embed = new EmbedBuilder()
              .setTitle(`🐍 FTJM Discord Snake - ${gameObj.userName}`)
              .setDescription(`Gebruik de knoppen om te bewegen!\n\nScore: **0** 🍎\n\n\`\`\`\n${boardStr}\`\`\``)
              .setColor(0x2ecc71)
              .setFooter({ text: 'FTJM Arcade 🎮' });
            components = getSnakeComponents();
          } else if (gameChoice === 'tictactoe') {
            gameObj = startTicTacToeGame(interaction.user.id, authorName);
            embed = new EmbedBuilder()
              .setTitle(`❌ Tic-Tac-Toe - ${gameObj.userName} vs FTJM Bot`)
              .setDescription(`Jij bent ❌, de Bot is ⭕. Klik op een vakje om te beginnen!`)
              .setColor(0x3498db)
              .setFooter({ text: 'FTJM Arcade 🎮' });
            components = getTicTacToeComponents(gameObj.data.board);
          } else {
            gameObj = startHigherLowerGame(interaction.user.id, authorName);
            embed = new EmbedBuilder()
              .setTitle(`🔢 Higher or Lower - Start`)
              .setDescription(`Het huidige getal is: **${gameObj.data.currentNumber}**.\n\nZal het volgende getal **Hoger** 🔼 of **Lager** 🔽 zijn?`)
              .setColor(0x3498db)
              .setFooter({ text: 'FTJM Arcade 🎮' });
            components = getHigherLowerComponents();
          }

          const response = await interaction.reply({ embeds: [embed], components, fetchReply: true });
          activeGames.set(response.id, gameObj);
        }

        else if (commandName === 'site') {
          await interaction.reply('🎮 **FTJM Chat & Arcade App**: https://ais-pre-3d4qy6xrtw5vtu4g3hs7yo-160997107127.europe-west3.run.app 🚀');
        }

        else if (commandName === 'setchannel') {
          // Check permissions
          if (interaction.guildId) {
            if (!interaction.memberPermissions?.has('Administrator') && !interaction.memberPermissions?.has('ManageGuild')) {
              await interaction.reply({ content: '❌ Je hebt Administrator of Beheerder-rechten nodig om dit commando uit te voeren.', ephemeral: true });
              return;
            }
          }

          const type = interaction.options.getString('type');
          const channelOption = interaction.options.getChannel('kanaal');

          if (!channelOption) {
            await interaction.reply({ content: '❌ Selecteer een geldig kanaal.', ephemeral: true });
            return;
          }

          try {
            // Fetch full channel from the Discord API to verify access and correct text-channel properties
            const channel = await client.channels.fetch(channelOption.id);
            if (!channel) {
              await interaction.reply({ content: '❌ Kan dit kanaal niet vinden of laden.', ephemeral: true });
              return;
            }

            const isText = (channel as any).type === 0 || (channel as any).type === 5 || (channel as any).type === 11 || (channel as any).type === 12 || (typeof (channel as any).isTextBased === 'function' && (channel as any).isTextBased());
            if (!isText) {
              await interaction.reply({ content: '❌ Selecteer een geldig tekstkanaal, aankondigingskanaal of draad (thread).', ephemeral: true });
              return;
            }

            const config = getBotConfig();
            if (type === 'chat') {
              config.chat_channel_id = channel.id;
            } else if (type === 'reports') {
              config.reports_channel_id = channel.id;
            }

            saveBotConfig(config);

            await interaction.reply({ 
              content: `✅ Succesvol ingesteld! Alle **${type === 'chat' ? 'App Chatberichten 💬' : 'Rapportages 🚨'}** worden vanaf nu doorgestuurd naar <#${channel.id}>.`,
              ephemeral: true 
            });
          } catch (fetchErr) {
            console.error('[Discord Bot] Error fetching channel in setchannel slash command:', fetchErr);
            await interaction.reply({ 
              content: `❌ De bot kan geen toegang krijgen tot dit kanaal. Zorg ervoor dat de bot de "Kanalen bekijken" (View Channel) en "Berichten verzenden" (Send Messages) machtigingen heeft voor dit kanaal in de Discord-server instellingen.`, 
              ephemeral: true 
            });
          }
        }
        } catch (err) {
          console.error('[Discord Bot] Error handling interaction:', err);
          try {
            const anyInteraction = interaction as any;
            if (anyInteraction.deferred || anyInteraction.replied) {
              await anyInteraction.followUp({ content: `❌ Er is een fout opgetreden bij het verwerken van deze interactie: ${err instanceof Error ? err.message : err}`, ephemeral: true });
            } else if (typeof anyInteraction.reply === 'function') {
              await anyInteraction.reply({ content: `❌ Er is een fout opgetreden bij het verwerken van deze interactie: ${err instanceof Error ? err.message : err}`, ephemeral: true });
            }
          } catch (replyErr) {
            console.error('[Discord Bot] Failed to send error reply:', replyErr);
          }
        }


      });

      // Handle Traditional Message Commands (with '!')
      client.on('messageCreate', async (message) => {
        if (!isProcessActive()) return;
        if (message.author.bot) return;

        if (message.content.startsWith('!')) {
          const args = message.content.slice(1).trim().split(/ +/);
          const command = args.shift()?.toLowerCase();

          if (command === 'help') {
            const embed = new EmbedBuilder()
              .setTitle('🎮 FTJM Discord Bot Commando\'s')
              .setDescription('Welkom bij de FTJM Chat & Arcade Bot! Gebruik de volgende commando\'s:')
              .setColor(0x3498db)
              .addFields(
                { name: '🏆 `!leaderboard` of `!highscores`', value: 'Bekijk de top 5 highscores van alle games live!' },
                { name: '📊 `!stats <gebruiker>`', value: 'Bekijk de persoonlijke highscores van een specifieke speler.' },
                { name: '💬 `!unread` of `!chat`', value: 'Bekijk de meest recente berichten in de General Chat (automatisch ontsleuteld).' },
                { name: '🕹️ `!play <game>`', value: 'Speel games direct op Discord! (snake, tictactoe, higherlower)' },
                { name: '🌐 `!site` of `!app`', value: 'Ontvang een directe link naar de live app.' },
                { name: '⚙️ `!setchannel <chat/reports> <#kanaal_of_id>`', value: 'Stel het doorstuurkanaal in voor chatberichten of rapportages (Admin-only).' }
              )
              .setFooter({ text: 'FTJM Chat & Arcade 🎮' })
              .setTimestamp();
            await message.reply({ embeds: [embed] });
          }

          else if (command === 'leaderboard' || command === 'highscores') {
            try {
              const supabaseUrl = activeSupabaseUrl;
              const supabaseKey = activeSupabaseKey;

              if (!supabaseUrl || !supabaseKey) {
                await message.reply('❌ Supabase configuratie ontbreekt op de server.');
                return;
              }

              const { createClient: createSupabase } = await import('@supabase/supabase-js');
              const supabaseClient = createSupabase(supabaseUrl, supabaseKey);

              const { profiles, isCacheFallback } = await getProfilesWithCache(supabaseClient);

              const boards: Record<string, { name: string; score: number }[]> = {
                snake: [],
                flappy: [],
                sysadmin: [],
                hamster: [],
                conquest: [],
                geometry: [],
                breakout: []
              };

              profiles?.forEach((p: any) => {
                const highScores = p.custom_theme?.game_high_scores || {};
                Object.keys(boards).forEach((gameId) => {
                  const score = Number(highScores[gameId]);
                  if (score > 0) {
                    boards[gameId].push({
                      name: p.display_name || 'Anoniem',
                      score: score
                    });
                  }
                });
              });

              Object.keys(boards).forEach((gameId) => {
                boards[gameId].sort((a, b) => b.score - a.score).splice(5);
              });

              const title = '🏆 FTJM LIVE HIGH SCORES' + (isCacheFallback ? ' ⚠️ (Offline Cache)' : '');
              const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(isCacheFallback ? 0xe67e22 : 0xf1c40f)
                .setTimestamp();

              if (isCacheFallback) {
                embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende offline opgeslagen highscores op de server.*');
              }

              const gameNames: Record<string, string> = {
                snake: '🐍 Snake',
                flappy: '🐦 Flappy Bird',
                sysadmin: '💻 SysAdmin Server Chaos',
                hamster: '🐹 Hamster Pacman',
                conquest: '🏰 Conquest',
                geometry: '📐 Geometry Dash',
                breakout: '🧱 Breakout'
              };

              Object.keys(boards).forEach((gameId) => {
                const list = boards[gameId];
                const name = gameNames[gameId] || gameId;
                let val = 'Geen scores bekend.';
                if (list.length > 0) {
                  val = list.map((item, idx) => `${idx + 1}. **${item.name}**: ${item.score} ptn`).join('\n');
                }
                embed.addFields({ name: name, value: val, inline: true });
              });

              await message.reply({ embeds: [embed] });
            } catch (err) {
              console.error(err);
              await message.reply('❌ Fout bij het ophalen van de highscores.');
            }
          }

          else if (command === 'stats') {
            const queryName = args.join(' ').trim().toLowerCase();
            if (!queryName) {
              await message.reply('❌ Gebruik: `!stats <naam>` (bijv. `!stats Mark`)');
              return;
            }

            try {
              const supabaseUrl = activeSupabaseUrl;
              const supabaseKey = activeSupabaseKey;

              if (!supabaseUrl || !supabaseKey) {
                await message.reply('❌ Supabase configuratie ontbreekt op de server.');
                return;
              }

              const { createClient: createSupabase } = await import('@supabase/supabase-js');
              const supabaseClient = createSupabase(supabaseUrl, supabaseKey);

              const { profiles, isCacheFallback } = await getProfilesWithCache(supabaseClient);

              const found = profiles?.find((p: any) => 
                p.display_name?.toLowerCase() === queryName || 
                p.display_name?.toLowerCase().includes(queryName)
              );

              if (!found) {
                await message.reply(`❌ Geen speler gevonden met de naam "${args.join(' ')}".`);
                return;
              }

              const highScores = found.custom_theme?.game_high_scores || {};
              const title = `🎮 STATISTIEKEN VOOR ${found.display_name.toUpperCase()}` + (isCacheFallback ? ' ⚠️ (Offline Cache)' : '');
              const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(isCacheFallback ? 0xe67e22 : 0x2ecc71)
                .setTimestamp();

              if (isCacheFallback) {
                embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende statistieken van deze speler.*');
              }

              if (found.photo_url) {
                embed.setThumbnail(found.photo_url);
              }

              const gameNames: Record<string, string> = {
                snake: '🐍 Snake',
                flappy: '🐦 Flappy Bird',
                sysadmin: '💻 SysAdmin Server Chaos',
                hamster: '🐹 Hamster Pacman',
                conquest: '🏰 Conquest',
                geometry: '📐 Geometry Dash',
                breakout: '🧱 Breakout'
              };

              let hasScores = false;
              Object.keys(gameNames).forEach((gameId) => {
                const score = highScores[gameId];
                if (score !== undefined) {
                  embed.addFields({ name: gameNames[gameId], value: `**${score}** ptn`, inline: true });
                  hasScores = true;
                }
              });

              if (!hasScores) {
                const currentDesc = embed.data.description || '';
                embed.setDescription((currentDesc ? currentDesc + '\n\n' : '') + 'Deze gebruiker heeft nog geen highscores opgeslagen.');
              }

              await message.reply({ embeds: [embed] });
            } catch (err) {
              console.error(err);
              await message.reply('❌ Fout bij het ophalen van de statistieken.');
            }
          }

          else if (command === 'unread' || command === 'berichten' || command === 'chat') {
            try {
              const supabaseUrl = activeSupabaseUrl;
              const supabaseKey = activeSupabaseKey;

              if (!supabaseUrl || !supabaseKey) {
                await message.reply('❌ Supabase configuratie ontbreekt op de server.');
                return;
              }

              const { createClient: createSupabase } = await import('@supabase/supabase-js');
              const supabaseClient = createSupabase(supabaseUrl, supabaseKey);

              const { posts, isCacheFallback: isPostsFallback } = await getPostsWithCache(supabaseClient);
              const { profiles } = await getProfilesWithCache(supabaseClient);

              const title = '💬 Recente Berichten in General Chat' + (isPostsFallback ? ' ⚠️ (Offline Cache)' : '');
              const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(isPostsFallback ? 0xe67e22 : 0x9b59b6)
                .setTimestamp();

              if (isPostsFallback) {
                embed.setDescription('ℹ️ *De database is momenteel niet bereikbaar. Dit zijn de laatst bekende chatberichten op de server.*');
              }

              if (!posts || posts.length === 0) {
                const currentDesc = embed.data.description || '';
                embed.setDescription((currentDesc ? currentDesc + '\n\n' : '') + 'Er zijn geen recente berichten gevonden.');
              } else {
                const list = [...posts].reverse().slice(-5); // show last 5
                list.forEach((p: any) => {
                  const timeStr = new Date(p.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                  const decrypted = decryptGeneralChat(p.content || '');
                  const authorProf = profiles?.find((prof: any) => prof.id === p.author_id);
                  const authorName = authorProf?.display_name || (!p.author_name || p.author_name === 'null' ? 'Anoniem' : p.author_name);
                  embed.addFields({ name: `👤 ${authorName} (${timeStr})`, value: decrypted || '*(Leeg bericht)*' });
                });
              }

              await message.reply({ embeds: [embed] });
            } catch (err) {
              console.error(err);
              await message.reply('❌ Fout bij het ophalen van de berichten.');
            }
          }

          else if (command === 'play') {
            const gameChoice = args[0]?.toLowerCase();
            if (!gameChoice || !['snake', 'tictactoe', 'higherlower', 'hogerlager'].includes(gameChoice)) {
              await message.reply('🕹️ **Gebruik**: `!play <game>`\nKies uit: `snake`, `tictactoe` of `higherlower`!');
              return;
            }

            let actualGame = gameChoice;
            if (actualGame === 'hogerlager') actualGame = 'higherlower';

            let gameObj: any;
            let embed: EmbedBuilder;
            let components: any[];

            const authorName = message.author.globalName || message.author.username;

            if (actualGame === 'snake') {
              gameObj = startSnakeGame(message.author.id, authorName);
              const boardStr = renderSnakeBoard(gameObj.data.snake, gameObj.data.apple);
              embed = new EmbedBuilder()
                .setTitle(`🐍 FTJM Discord Snake - ${gameObj.userName}`)
                .setDescription(`Gebruik de knoppen om te bewegen!\n\nScore: **0** 🍎\n\n\`\`\`\n${boardStr}\`\`\``)
                .setColor(0x2ecc71)
                .setFooter({ text: 'FTJM Arcade 🎮' });
              components = getSnakeComponents();
            } else if (actualGame === 'tictactoe') {
              gameObj = startTicTacToeGame(message.author.id, authorName);
              embed = new EmbedBuilder()
                .setTitle(`❌ Tic-Tac-Toe - ${gameObj.userName} vs FTJM Bot`)
                .setDescription(`Jij bent ❌, de Bot is ⭕. Klik op een vakje om te beginnen!`)
                .setColor(0x3498db)
                .setFooter({ text: 'FTJM Arcade 🎮' });
              components = getTicTacToeComponents(gameObj.data.board);
            } else {
              gameObj = startHigherLowerGame(message.author.id, authorName);
              embed = new EmbedBuilder()
                .setTitle(`🔢 Higher or Lower - Start`)
                .setDescription(`Het huidige getal is: **${gameObj.data.currentNumber}**.\n\nZal het volgende getal **Hoger** 🔼 of **Lager** 🔽 zijn?`)
                .setColor(0x3498db)
                .setFooter({ text: 'FTJM Arcade 🎮' });
              components = getHigherLowerComponents();
            }

            const response = await message.reply({ embeds: [embed], components });
            activeGames.set(response.id, gameObj);
          }

          else if (command === 'site' || command === 'app') {
            await message.reply('🎮 **FTJM Chat & Arcade App**: https://ais-pre-3d4qy6xrtw5vtu4g3hs7yo-160997107127.europe-west3.run.app 🚀');
          }

          else if (command === 'setchannel') {
            // Check permissions (must be administrator or have manage guild)
            if (!message.member?.permissions.has('Administrator') && !message.member?.permissions.has('ManageGuild')) {
              await message.reply('❌ Je hebt Administrator of Beheerder-rechten nodig om dit commando te gebruiken.');
              return;
            }

            const type = args[0]?.toLowerCase();
            const channelMention = args[1];

            if (!type || !['chat', 'reports'].includes(type)) {
              await message.reply('❌ **Gebruik**: `!setchannel <chat/reports> <#kanaal_of_id>`');
              return;
            }

            // Resolve channel ID from mention or ID
            let channelId = '';
            if (channelMention) {
              const match = channelMention.match(/^<#(\d+)>$/);
              if (match) {
                channelId = match[1];
              } else if (/^\d+$/.test(channelMention)) {
                channelId = channelMention;
              }
            }

            if (!channelId) {
              await message.reply('❌ **Gebruik**: `!setchannel <chat/reports> <#kanaal_of_id>`\nBijvoorbeeld: `!setchannel chat #algemeen` of `!setchannel reports 123456789012345678`');
              return;
            }

            // Verify if channel exists and is text based
            try {
              const channel = await client.channels.fetch(channelId);
              const isText = channel && ((channel as any).type === 0 || (channel as any).type === 5 || (channel as any).type === 11 || (channel as any).type === 12 || (typeof (channel as any).isTextBased === 'function' && (channel as any).isTextBased()));
              if (!channel || !isText) {
                await message.reply('❌ Dit is geen geldig tekstkanaal.');
                return;
              }

              const config = getBotConfig();
              if (type === 'chat') {
                config.chat_channel_id = channel.id;
              } else if (type === 'reports') {
                config.reports_channel_id = channel.id;
              }

              saveBotConfig(config);

              await message.reply(`✅ Succesvol ingesteld! Alle **${type === 'chat' ? 'App Chatberichten 💬' : 'Rapportages 🚨'}** worden vanaf nu doorgestuurd naar <#${channel.id}>.`);
            } catch (err) {
              await message.reply('❌ Kan dit kanaal niet vinden of laden. Zorg ervoor dat de bot rechten heeft om dit kanaal te bekijken.');
            }
          }


        }
      });

      await client.login(discordBotToken);

      // Clean up the bot client on process exit to avoid ghost sessions
      const cleanExit = () => {
        console.log('[Discord Bot] Cleaning up and logging out...');
        try {
          client.destroy();
        } catch (e) {}
        try {
          if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
          }
        } catch (e) {}
        process.exit(0);
      };

      process.once('SIGINT', cleanExit);
      process.once('SIGTERM', cleanExit);
    } catch (botErr) {
      console.error('❌ Discord bot login fout:', botErr);
    }
  }
}

startServer();
