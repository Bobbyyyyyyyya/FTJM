import { uploadImageToImgBB } from './helpers';
import { encryptGeneralChat, decryptGeneralChat } from './encryption';
import { UserProfile, Post, DirectMessage, ForumThread, ForumComment } from '../types';
import { toast } from 'sonner';

/**
 * Checks if a string contains one or more data URI (Base64) media payloads.
 */
export const containsBase64DataUrl = (text: string | null | undefined): boolean => {
  if (!text || typeof text !== 'string') return false;
  return (
    text.includes('data:image/') ||
    text.includes('data:audio/') ||
    text.includes('data:video/') ||
    /data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/i.test(text)
  );
};

/**
 * Replaces all embedded data:image/audio/video Base64 URLs with newly uploaded CDN / server URLs.
 */
export const migrateDataUrlsInText = async (text: string, contextName: string = 'media'): Promise<{ text: string; count: number }> => {
  if (!containsBase64DataUrl(text)) {
    return { text, count: 0 };
  }

  const dataUrlRegex = /data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = text.match(dataUrlRegex);
  if (!matches || matches.length === 0) {
    return { text, count: 0 };
  }

  let newText = text;
  let migratedCount = 0;

  for (const match of matches) {
    // Delete video base64 entirely since they are no longer supported
    if (match.startsWith('data:video/')) {
      newText = newText.replace(match, '');
      migratedCount++;
      continue;
    }

    try {
      const uploadRes = await uploadImageToImgBB(match, `migrated_${contextName}_${Date.now()}`);
      if (uploadRes?.url) {
        newText = newText.replace(match, uploadRes.url);
        migratedCount++;
      }
    } catch (err) {
      console.warn(`[Base64Migration] Failed to upload match for ${contextName}:`, err);
    }
  }

  return { text: newText, count: migratedCount };
};

export interface Base64MigrationCallbacks {
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setPosts?: React.Dispatch<React.SetStateAction<Post[]>>;
  setMessages?: React.Dispatch<React.SetStateAction<DirectMessage[]>>;
  setConversations?: React.Dispatch<React.SetStateAction<any[]>>;
  setProfileMedia?: React.Dispatch<React.SetStateAction<any[]>>;
  setFeedMedia?: React.Dispatch<React.SetStateAction<any[]>>;
}

/**
 * Main auto-migration function executed on user login or profile refresh.
 * Automatically scans user profile, posts, messages, forum entries, and profile media,
 * converting heavy Base64 strings to permanent ImgBB/server CDN URLs.
 */
export const runAutoBase64Migration = async (
  supabaseClient: any,
  user: { uid: string; email?: string | null; displayName?: string | null },
  currentProfile: UserProfile | null,
  callbacks?: Base64MigrationCallbacks,
  forceAllForAdmin: boolean = false
): Promise<number> => {
  if (!supabaseClient || !user?.uid) return 0;

  // Egress optimization: throttle repeated auto-scans unless forced
  const scanCacheKey = `auto_migration_last_${user.uid}`;
  if (!forceAllForAdmin) {
    try {
      const lastCheck = localStorage.getItem(scanCacheKey);
      if (lastCheck && Date.now() - Number(lastCheck) < 12 * 3600 * 1000) {
        return 0; // Already checked in the last 12 hours
      }
    } catch {}
  }

  const isUserAdmin = Boolean(
    forceAllForAdmin ||
    currentProfile?.role === 'admin' ||
    (user.email && user.email.toLowerCase() === 'markohoksen@gmail.com')
  );

  let totalMigrated = 0;

  try {
    try {
      localStorage.setItem(scanCacheKey, String(Date.now()));
    } catch {}
    console.log(`[Base64Migration] Starting migration scan (Admin mode: ${isUserAdmin})...`);

    // If Admin mode or forced, also trigger the backend server migration endpoint
    if (isUserAdmin) {
      try {
        const serverRes = await fetch('/api/admin/migrate-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (serverRes.ok) {
          const serverData = await serverRes.json();
          if (serverData.success && serverData.totalMigrated > 0) {
            totalMigrated += serverData.totalMigrated;
            console.log(`[Base64Migration] Server-side migration completed: ${serverData.totalMigrated} items processed.`);
          }
        }
      } catch (srvErr) {
        console.warn('[Base64Migration] Note on server-side migration call:', srvErr);
      }
    }

    // ==========================================
    // 1. MIGRATE USER PROFILE (Avatar & Banner & Wallpaper)
    // ==========================================
    if (currentProfile) {
      let profileNeedsUpdate = false;
      const profileUpdates: Partial<UserProfile> = {};
      const themeUpdates = { ...(currentProfile.custom_theme || {}) };

      // 1a. Photo URL
      if (currentProfile.photo_url && containsBase64DataUrl(currentProfile.photo_url)) {
        try {
          const res = await uploadImageToImgBB(currentProfile.photo_url, `avatar_${user.uid}`);
          if (res?.url) {
            profileUpdates.photo_url = res.url;
            profileNeedsUpdate = true;
            totalMigrated++;
          }
        } catch (e) {
          console.warn('[Base64Migration] Failed avatar migration:', e);
        }
      }

      // 1b. Banner URL
      const currentBanner = currentProfile.banner_url || currentProfile.custom_theme?.banner_url;
      if (currentBanner && containsBase64DataUrl(currentBanner)) {
        try {
          const res = await uploadImageToImgBB(currentBanner, `banner_${user.uid}`);
          if (res?.url) {
            profileUpdates.banner_url = res.url;
            themeUpdates.banner_url = res.url;
            profileNeedsUpdate = true;
            totalMigrated++;
          }
        } catch (e) {
          console.warn('[Base64Migration] Failed banner migration:', e);
        }
      }

      // 1c. Custom theme wallpaper / background image
      if (themeUpdates.wallpaper && containsBase64DataUrl(themeUpdates.wallpaper)) {
        try {
          const res = await uploadImageToImgBB(themeUpdates.wallpaper, `wallpaper_${user.uid}`);
          if (res?.url) {
            themeUpdates.wallpaper = res.url;
            profileNeedsUpdate = true;
            totalMigrated++;
          }
        } catch (e) {
          console.warn('[Base64Migration] Failed wallpaper migration:', e);
        }
      }

      // 1d. Custom theme media items
      if (Array.isArray(themeUpdates.media) && themeUpdates.media.length > 0) {
        let mediaChanged = false;
        const updatedMedia = [];
        for (const item of themeUpdates.media) {
          if (item && item.url && containsBase64DataUrl(item.url)) {
            try {
              const res = await uploadImageToImgBB(item.url, `theme_media_${user.uid}`);
              if (res?.url) {
                updatedMedia.push({ ...item, url: res.url });
                mediaChanged = true;
                totalMigrated++;
              } else {
                updatedMedia.push(item);
              }
            } catch (e) {
              updatedMedia.push(item);
            }
          } else {
            updatedMedia.push(item);
          }
        }
        if (mediaChanged) {
          themeUpdates.media = updatedMedia;
          profileNeedsUpdate = true;
        }
      }

      if (profileNeedsUpdate) {
        profileUpdates.custom_theme = themeUpdates;
        profileUpdates.updated_at = new Date().toISOString();

        const { error: profErr } = await supabaseClient
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.uid);

        if (!profErr) {
          const merged = { ...currentProfile, ...profileUpdates };
          callbacks?.setProfile?.(merged);
          try {
            localStorage.setItem('cached_profile', JSON.stringify(merged));
          } catch (e) {}
          console.log('[Base64Migration] Profile successfully migrated to CDN URLs');
        }
      }
    }

    // ==========================================
    // 2. MIGRATE PROFILE MEDIA (profile_media table in feed)
    // For Admins: Scans ALL profile_media items regardless of author
    // ==========================================
    try {
      let mediaQuery = supabaseClient
        .from('profile_media')
        .select('id, media_url, media_type, user_id')
        .order('created_at', { ascending: false })
        .limit(isUserAdmin ? 200 : 50);

      if (!isUserAdmin) {
        mediaQuery = mediaQuery.eq('user_id', user.uid);
      }

      const { data: mediaList, error: mediaErr } = await mediaQuery;

      if (!mediaErr && mediaList && mediaList.length > 0) {
        for (const mediaItem of mediaList) {
          if (mediaItem.media_url && containsBase64DataUrl(mediaItem.media_url)) {
            // If it is a video, delete the item entirely because it is no longer supported
            if (mediaItem.media_url.startsWith('data:video/')) {
              try {
                const { error: delErr } = await supabaseClient
                  .from('profile_media')
                  .delete()
                  .eq('id', mediaItem.id);
                if (!delErr) {
                  totalMigrated++;
                  callbacks?.setProfileMedia?.(prev => prev.filter(m => m.id !== mediaItem.id));
                  callbacks?.setFeedMedia?.(prev => prev.filter(m => m.id !== mediaItem.id));
                }
              } catch (e) {}
              continue;
            }

            try {
              const res = await uploadImageToImgBB(mediaItem.media_url, `media_${mediaItem.id}`);
              if (res?.url) {
                const { error: upErr } = await supabaseClient
                  .from('profile_media')
                  .update({ media_url: res.url })
                  .eq('id', mediaItem.id);

                if (!upErr) {
                  totalMigrated++;
                  callbacks?.setProfileMedia?.(prev => 
                    prev.map(m => m.id === mediaItem.id ? { ...m, media_url: res.url } : m)
                  );
                  callbacks?.setFeedMedia?.(prev =>
                    prev.map(m => m.id === mediaItem.id ? { ...m, media_url: res.url } : m)
                  );
                }
              }
            } catch (mErr) {
              console.warn('[Base64Migration] Failed migrating profile_media item:', mErr);
            }
          }
        }
      }
    } catch (pmErr) {
      console.warn('[Base64Migration] Note on profile_media query:', pmErr);
    }

    // ==========================================
    // 3. MIGRATE POSTS (posts table)
    // For Admins: Scans ALL posts regardless of author
    // ==========================================
    try {
      let postsQuery = supabaseClient
        .from('posts')
        .select('id, content, author_id, author_photo, created_at')
        .order('created_at', { ascending: false })
        .limit(isUserAdmin ? 200 : 60);

      if (!isUserAdmin) {
        postsQuery = postsQuery.eq('author_id', user.uid);
      }

      const { data: userPosts, error: postErr } = await postsQuery;

      if (!postErr && userPosts && userPosts.length > 0) {
        for (const post of userPosts) {
          let postChanged = false;
          const postUpdates: Partial<Post> = {};

          // Check author_photo
          if (post.author_photo && containsBase64DataUrl(post.author_photo)) {
            try {
              const res = await uploadImageToImgBB(post.author_photo, `author_photo_${post.id}`);
              if (res?.url) {
                postUpdates.author_photo = res.url;
                postChanged = true;
                totalMigrated++;
              }
            } catch (e) {}
          }

          // Check post content (decrypt first)
          const decrypted = decryptGeneralChat(post.content || '');
          if (containsBase64DataUrl(decrypted)) {
            const { text: cleanText, count } = await migrateDataUrlsInText(decrypted, `post_${post.id}`);
            if (count > 0 && cleanText !== decrypted) {
              postUpdates.content = encryptGeneralChat(cleanText);
              postChanged = true;
              totalMigrated += count;
            }
          }

          if (postChanged) {
            const { error: updateErr } = await supabaseClient
              .from('posts')
              .update(postUpdates)
              .eq('id', post.id);

            if (!updateErr) {
              const cleanContent = postUpdates.content ? decryptGeneralChat(postUpdates.content) : decrypted;
              callbacks?.setPosts?.(prev => 
                prev.map(p => p.id === post.id ? { 
                  ...p, 
                  ...(postUpdates.author_photo ? { author_photo: postUpdates.author_photo } : {}),
                  content: cleanContent 
                } : p)
              );
            }
          }
        }
      }
    } catch (postsErr) {
      console.warn('[Base64Migration] Note on posts query:', postsErr);
    }

    // ==========================================
    // 4. MIGRATE DIRECT MESSAGES (messages table)
    // ==========================================
    try {
      let dmQuery = supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at')
        .order('created_at', { ascending: false })
        .limit(isUserAdmin ? 150 : 60);

      if (!isUserAdmin) {
        dmQuery = dmQuery.eq('sender_id', user.uid);
      }

      const { data: userDMs, error: dmErr } = await dmQuery;

      if (!dmErr && userDMs && userDMs.length > 0) {
        for (const msg of userDMs) {
          const decrypted = decryptGeneralChat(msg.text || '');
          if (containsBase64DataUrl(decrypted)) {
            const { text: cleanText, count } = await migrateDataUrlsInText(decrypted, `dm_${msg.id}`);
            if (count > 0 && cleanText !== decrypted) {
              const encryptedClean = encryptGeneralChat(cleanText);
              const { error: msgUpErr } = await supabaseClient
                .from('messages')
                .update({ text: encryptedClean })
                .eq('id', msg.id);

              if (!msgUpErr) {
                totalMigrated += count;
                callbacks?.setMessages?.(prev =>
                  prev.map(m => m.id === msg.id ? { ...m, text: cleanText } : m)
                );
              }
            }
          }
        }
      }
    } catch (dmErr) {
      console.warn('[Base64Migration] Note on messages query:', dmErr);
    }

    // ==========================================
    // 5. MIGRATE FORUM THREADS & COMMENTS
    // ==========================================
    try {
      // 5a. Forum Threads
      let threadsQuery = supabaseClient
        .from('forum_threads')
        .select('id, content, author_id, author_photo')
        .limit(isUserAdmin ? 100 : 40);

      if (!isUserAdmin) {
        threadsQuery = threadsQuery.eq('author_id', user.uid);
      }

      const { data: forumThreads } = await threadsQuery;

      if (forumThreads && forumThreads.length > 0) {
        for (const thread of forumThreads) {
          let threadChanged = false;
          const updates: any = {};

          if (thread.author_photo && containsBase64DataUrl(thread.author_photo)) {
            try {
              const res = await uploadImageToImgBB(thread.author_photo, `thread_author_${thread.id}`);
              if (res?.url) {
                updates.author_photo = res.url;
                threadChanged = true;
                totalMigrated++;
              }
            } catch (e) {}
          }

          if (thread.content && containsBase64DataUrl(thread.content)) {
            const { text: cleanText, count } = await migrateDataUrlsInText(thread.content, `thread_${thread.id}`);
            if (count > 0) {
              updates.content = cleanText;
              threadChanged = true;
              totalMigrated += count;
            }
          }

          if (threadChanged) {
            await supabaseClient.from('forum_threads').update(updates).eq('id', thread.id);
          }
        }
      }

      // 5b. Forum Comments
      let commentsQuery = supabaseClient
        .from('forum_comments')
        .select('id, content, author_id, author_photo')
        .limit(isUserAdmin ? 100 : 40);

      if (!isUserAdmin) {
        commentsQuery = commentsQuery.eq('author_id', user.uid);
      }

      const { data: forumComments } = await commentsQuery;

      if (forumComments && forumComments.length > 0) {
        for (const comment of forumComments) {
          let commentChanged = false;
          const updates: any = {};

          if (comment.author_photo && containsBase64DataUrl(comment.author_photo)) {
            try {
              const res = await uploadImageToImgBB(comment.author_photo, `comment_author_${comment.id}`);
              if (res?.url) {
                updates.author_photo = res.url;
                commentChanged = true;
                totalMigrated++;
              }
            } catch (e) {}
          }

          if (comment.content && containsBase64DataUrl(comment.content)) {
            const { text: cleanText, count } = await migrateDataUrlsInText(comment.content, `comment_${comment.id}`);
            if (count > 0) {
              updates.content = cleanText;
              commentChanged = true;
              totalMigrated += count;
            }
          }

          if (commentChanged) {
            await supabaseClient.from('forum_comments').update(updates).eq('id', comment.id);
          }
        }
      }
    } catch (forumErr) {
      console.warn('[Base64Migration] Note on forum query:', forumErr);
    }

    if (totalMigrated > 0) {
      console.log(`[Base64Migration] Migration complete! Converted ${totalMigrated} Base64 media items to ImgBB/server CDN.`);
      toast.success('Media conversie voltooid', {
        description: `${totalMigrated} oude Base64 afbeelding(en)/media succesvol omgezet naar snelle ImgBB/server CDN links.`,
        duration: 5000,
      });
    } else {
      console.log('[Base64Migration] Scan complete: All media already clean CDN URLs.');
    }
  } catch (err) {
    console.error('[Base64Migration] Unexpected error during migration:', err);
  }

  return totalMigrated;
};

/**
 * Dedicated helper to migrate feed items containing Base64 data URLs to permanent CDN URLs.
 * Works for all items in the feed regardless of authorship.
 */
export const migrateFeedMediaList = async (
  supabaseClient: any,
  mediaItems: any[],
  setFeedMedia?: React.Dispatch<React.SetStateAction<any[]>>,
  setProfileMedia?: React.Dispatch<React.SetStateAction<any[]>>
): Promise<number> => {
  if (!supabaseClient || !Array.isArray(mediaItems) || mediaItems.length === 0) return 0;
  let migrated = 0;

  for (const item of mediaItems) {
    if (item && item.media_url && containsBase64DataUrl(item.media_url)) {
      if (item.media_url.startsWith('data:video/')) {
        try {
          const { error } = await supabaseClient
            .from('profile_media')
            .delete()
            .eq('id', item.id);
          if (!error) {
            migrated++;
            setFeedMedia?.(prev => prev.filter(m => m.id !== item.id));
            setProfileMedia?.(prev => prev.filter(m => m.id !== item.id));
          }
        } catch (e) {}
        continue;
      }

      try {
        const res = await uploadImageToImgBB(item.media_url, `feed_${item.id || Date.now()}`);
        if (res?.url) {
          const { error } = await supabaseClient
            .from('profile_media')
            .update({ media_url: res.url })
            .eq('id', item.id);

          if (!error) {
            migrated++;
            setFeedMedia?.(prev =>
              prev.map(m => m.id === item.id ? { ...m, media_url: res.url } : m)
            );
            setProfileMedia?.(prev =>
              prev.map(m => m.id === item.id ? { ...m, media_url: res.url } : m)
            );
          }
        }
      } catch (err) {
        console.warn('[migrateFeedMediaList] Error migrating feed item:', item.id, err);
      }
    }
  }

  if (migrated > 0) {
    console.log(`[migrateFeedMediaList] Successfully migrated ${migrated} feed items to CDN.`);
  }

  return migrated;
};
