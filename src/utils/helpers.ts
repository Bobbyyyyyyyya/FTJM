import { toast } from 'sonner';
import { AudioLog, SupabaseErrorInfo, AdminNotesData } from '../types';
import { supabase } from './supabase';

export const audioCache = new Map<string, HTMLAudioElement>();

// Local storage for audio logs to avoid database bloat and respect user request
export let localAudioLogs: AudioLog[] = [];

export const logAudioEvent = async (url: string, status: 'success' | 'error' | 'warning', message: string, userId?: string, userName?: string) => {
  const newLog: AudioLog = {
    id: Math.random().toString(36).substring(2, 11),
    url,
    status,
    message,
    user_id: userId,
    user_name: userName,
    created_at: new Date().toISOString()
  };

  // Add to local memory (keep last 100)
  localAudioLogs = [newLog, ...localAudioLogs].slice(0, 100);
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('audio-log-added', { detail: newLog }));
  
  // Log to console for debugging
  console.log(`[AudioLog] ${status.toUpperCase()}: ${message}`, { url, userId, userName });
};

// Robust Web Audio synthesizer fallback for browsers / OSs (like Chrome OS) missing codecs
export const playSyntheticSound = (typeOrUrl: string) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const lower = typeOrUrl.toLowerCase();
    
    if (lower.includes('ringtone') || lower.includes('classic') || lower.includes('bell') || lower.includes('nokia')) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.connect(ctx.destination);

      const gain = ctx.createGain();
      gain.connect(filter);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.frequency.value = 853;
      osc2.frequency.value = 960;
      osc1.connect(gain);
      osc2.connect(gain);

      gain.gain.setValueAtTime(0, now);
      for (let i = 0; i < 2; i++) {
        const start = now + i * 0.4;
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.setValueAtTime(0.15, start + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
      
    } else if (lower.includes('alert') || lower.includes('siren')) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.25);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);

    } else if (lower.includes('success') || lower.includes('bling')) {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const noteStart = now + i * 0.08;
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);
        
        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });

    } else if (lower.includes('pop')) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.1);

    } else {
      // Default: Sweet high-pitched dual chime / ping
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1100, now); // C#6
      osc2.frequency.exponentialRampToValueAtTime(1650, now + 0.15); // A6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    }
  } catch (e) {
    console.error('AudioContext synthesis failed:', e);
  }
};

export const playSound = (url: string, enabled: boolean, userId?: string, userName?: string) => {
  if (!enabled || !url || typeof url !== 'string') {
    console.log('Sound skipped:', { enabled, urlType: typeof url, hasUrl: !!url });
    return;
  }
  
  // Dynamic fallback mapping for old/remote audio URLs to local downloaded assets
  const urlMapping: Record<string, string> = {
    // Presets
    'https://image2url.com/r2/default/audio/1775756671546-6f36bf87-4347-477b-a2da-1af03009fdcf.mp3': '/audio/sounds/ping.mp3',
    'https://www.image2url.com/r2/default/audio/1775756671546-6f36bf87-4347-477b-a2da-1af03009fdcf.mp3': '/audio/sounds/ping.mp3',
    'https://image2url.com/r2/default/audio/1775755636867-f3aa78d1-03e7-48c2-b75a-a5f990f517e9.mp3': '/audio/sounds/notification.mp3',
    'https://www.image2url.com/r2/default/audio/1775755636867-f3aa78d1-03e7-48c2-b75a-a5f990f517e9.mp3': '/audio/sounds/notification.mp3',
    'https://image2url.com/r2/default/audio/1775756302748-a840da24-e9d3-47a0-9e14-2a582fc0e093.mp3': '/audio/sounds/chime.mp3',
    'https://www.image2url.com/r2/default/audio/1775756302748-a840da24-e9d3-47a0-9e14-2a582fc0e093.mp3': '/audio/sounds/chime.mp3',
    'https://image2url.com/r2/default/audio/1775754319337-0525bbd3-8adb-4c26-ae70-842ba5769e7f.wav': '/audio/sounds/alert.wav',
    'https://www.image2url.com/r2/default/audio/1775754319337-0525bbd3-8adb-4c26-ae70-842ba5769e7f.wav': '/audio/sounds/alert.wav',
    'https://image2url.com/r2/default/audio/1775755973661-157bd979-8f6e-4d86-9e32-74761db166d9.mp3': '/audio/sounds/pop.mp3',
    'https://www.image2url.com/r2/default/audio/1775755973661-157bd979-8f6e-4d86-9e32-74761db166d9.mp3': '/audio/sounds/pop.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2366/2366-preview.mp3': '/audio/sounds/success.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2372/2372-preview.mp3': '/audio/sounds/bling.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3': '/audio/sounds/default_old.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3': '/audio/sounds/notification_old.mp3',

    // Ringtones
    'https://www.image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3': '/audio/ringtones/classic.mp3',
    'https://image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3': '/audio/ringtones/classic.mp3',
    'https://www.image2url.com/r2/default/audio/1779892149416-1b7cd84d-217e-48d2-8263-4867b8800b27.mp3': '/audio/ringtones/ringtone1.mp3',
    'https://image2url.com/r2/default/audio/1779892149416-1b7cd84d-217e-48d2-8263-4867b8800b27.mp3': '/audio/ringtones/ringtone1.mp3',
    'https://www.image2url.com/r2/default/audio/1779892243173-6df7f26d-7f4e-4060-ba80-c0ed72a81f99.mp3': '/audio/ringtones/ringtone2.mp3',
    'https://image2url.com/r2/default/audio/1779892243173-6df7f26d-7f4e-4060-ba80-c0ed72a81f99.mp3': '/audio/ringtones/ringtone2.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3': '/audio/ringtones/nokia.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1230/1230-preview.mp3': '/audio/ringtones/digital.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3': '/audio/ringtones/synthesizer.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3': '/audio/ringtones/zen.mp3',
    'https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3': '/audio/ringtones/siren.mp3',

    // Calls
    'https://www.image2url.com/r2/default/audio/1778251393856-e7883015-89e0-4fdd-b691-55e72fa929c6.mp3': '/audio/calls/dialing.mp3',
    'https://image2url.com/r2/default/audio/1778251393856-e7883015-89e0-4fdd-b691-55e72fa929c6.mp3': '/audio/calls/dialing.mp3',
    'https://www.image2url.com/r2/default/audio/1778154897391-0eb0695d-b4bc-41be-bf5d-a09441cc3af6.mp3': '/audio/calls/end_call.mp3',
    'https://image2url.com/r2/default/audio/1778154897391-0eb0695d-b4bc-41be-bf5d-a09441cc3af6.mp3': '/audio/calls/end_call.mp3',
    'https://www.image2url.com/r2/default/audio/1778155099351-512c1936-e820-4e67-8af0-a035a92a54ea.mp3': '/audio/calls/start_call.mp3',
    'https://image2url.com/r2/default/audio/1778155099351-512c1936-e820-4e67-8af0-a035a92a54ea.mp3': '/audio/calls/start_call.mp3',

    // Maintenance countdowns
    'https://www.image2url.com/r2/default/audio/1781271903929-83f9346b-b078-42d0-b5c0-fda9beeab9af.m4a': '/audio/maintenance/maintenance_5m.m4a',
    'https://image2url.com/r2/default/audio/1781271903929-83f9346b-b078-42d0-b5c0-fda9beeab9af.m4a': '/audio/maintenance/maintenance_5m.m4a',
    'https://www.image2url.com/r2/default/audio/1781272139776-42f7b69d-b732-4e34-bf93-225487e9e0d0.m4a': '/audio/maintenance/maintenance_4m.m4a',
    'https://image2url.com/r2/default/audio/1781272139776-42f7b69d-b732-4e34-bf93-225487e9e0d0.m4a': '/audio/maintenance/maintenance_4m.m4a',
    'https://www.image2url.com/r2/default/audio/1781272207070-d21eced7-6568-46f2-ace7-9b81f20ae234.m4a': '/audio/maintenance/maintenance_3m.m4a',
    'https://image2url.com/r2/default/audio/1781272207070-d21eced7-6568-46f2-ace7-9b81f20ae234.m4a': '/audio/maintenance/maintenance_3m.m4a',
    'https://www.image2url.com/r2/default/audio/1781272257523-22f80b01-edd0-411f-9f43-b2164518db71.m4a': '/audio/maintenance/maintenance_2m.m4a',
    'https://image2url.com/r2/default/audio/1781272257523-22f80b01-edd0-411f-9f43-b2164518db71.m4a': '/audio/maintenance/maintenance_2m.m4a',
    'https://www.image2url.com/r2/default/audio/1781272318128-306ce73b-c458-4980-8433-b2c0ef0ff36c.m4a': '/audio/maintenance/maintenance_1m.m4a',
    'https://image2url.com/r2/default/audio/1781272318128-306ce73b-c458-4980-8433-b2c0ef0ff36c.m4a': '/audio/maintenance/maintenance_1m.m4a',
  };

  let resolvedUrl = urlMapping[url] || url;

  // Add cache-busting to bypass browser-level corrupt/incomplete cached ranges
  if (resolvedUrl && typeof resolvedUrl === 'string' && !resolvedUrl.startsWith('data:')) {
    const isYt = /(?:youtube\.com|youtu\.be)/i.test(resolvedUrl);
    if (!isYt) {
      if (resolvedUrl.startsWith('/')) {
        resolvedUrl += (resolvedUrl.includes('?') ? '&' : '?') + 'v=3.2';
      } else {
        try {
          const urlObj = new URL(resolvedUrl);
          if (urlObj.protocol.startsWith('http')) {
            urlObj.searchParams.set('v', '3.2');
            resolvedUrl = urlObj.toString();
          }
        } catch (e) {
          if (!resolvedUrl.includes('youtube.com') && !resolvedUrl.includes('youtu.be')) {
            resolvedUrl += (resolvedUrl.includes('?') ? '&' : '?') + 'v=3.2';
          }
        }
      }
    }
  }

  try {
    // YouTube detection (including shorts)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = resolvedUrl.match(ytRegex);

    if (ytMatch) {
      const videoId = ytMatch[1];
      console.log('YouTube sound detected:', videoId);
      logAudioEvent(resolvedUrl, 'success', `YouTube audio gestart: ${videoId}`, userId, userName);
      let iframe = document.getElementById('yt-audio-player') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'yt-audio-player';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.position = 'absolute';
        iframe.style.visibility = 'hidden';
        iframe.allow = "autoplay";
        document.body.appendChild(iframe);
      }
      // Use a random param to force reload and autoplay
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=0&rel=0&origin=${window.location.origin}&v=${Date.now()}`;
      return;
    }

    console.log('Attempting to play sound:', resolvedUrl);
    
    // For standard audio, we'll try to use the cache but be more careful
    let audio = audioCache.get(resolvedUrl);
    
    // If audio exists but has an error or is in a broken state, recreate it
    if (audio && (audio.error || isNaN(audio.duration) && audio.networkState === 3)) {
      console.log('Cached audio is in error state, recreating:', resolvedUrl);
      audioCache.delete(resolvedUrl);
      audio = undefined;
    }

    if (!audio) {
      console.log('Audio not in cache, creating new instance');
      audio = new Audio(resolvedUrl);
      audio.preload = 'auto';
      audioCache.set(resolvedUrl, audio);
    }
    
    // Set fallback on error as a final failsafe
    let fallbackTriggered = false;
    const triggerFallback = (reason: string) => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      console.log(`Fallback triggered due to: ${reason}`);
      playSyntheticSound(resolvedUrl);
      logAudioEvent(resolvedUrl, 'success', `Geluid succesvol gesynthetiseerd via Web Audio API (${reason})`, userId, userName);
    };
    
    // Reset and play
    audio.volume = 0.5;
    
    // Reset time to start
    try {
      if (audio.readyState > 0) {
        audio.currentTime = 0;
      }
    } catch (e) {
      console.warn('Could not reset audio currentTime:', e);
    }
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Sound played successfully');
        logAudioEvent(resolvedUrl, 'success', 'Geluid succesvol afgespeeld', userId, userName);
      }).catch(error => {
        console.warn('Audio play failed:', error);
        
        if (error.name === 'NotAllowedError') {
          logAudioEvent(resolvedUrl, 'error', `Afspelen mislukt: ${error.message || error.name}`, userId, userName);
          toast.info('Klik op het luidspreker-icoon bovenin om geluiden te activeren', {
            id: 'audio-unlock-toast',
            duration: 8000,
            action: {
              label: 'Herstel Audio',
              onClick: () => {
                const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
                silent.play().then(() => {
                  toast.success('Geluiden geactiveerd!');
                  const retryAudio = new Audio(resolvedUrl);
                  retryAudio.volume = 0.5;
                  retryAudio.play().catch(() => {});
                }).catch(() => {});
              }
            }
          });
        } else {
          // Robust fallback for missing codecs / format error
          triggerFallback(`Play promise catch: ${error.message || error.name}`);
        }
      });
    }
  } catch (err) {
    console.error('Error in playSound:', err);
    logAudioEvent(resolvedUrl, 'error', `Systeemfout in playSound: ${err instanceof Error ? err.message : String(err)}`, userId, userName);
    // Ultimate fallback if even setup crashes
    try {
      playSyntheticSound(resolvedUrl);
    } catch (e) {}
  }
};

export const formatDate = (isoString: string | undefined | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('nl-NL', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export const formatTime = (isoString: string | undefined | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('nl-NL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

export async function handleSupabaseError(error: any, operation: string, user?: any, isAdmin: boolean = false) {
  console.error(`Supabase Error during ${operation}:`, error);
  
  const errorMessage = error?.message || String(error);
  logAudioEvent('system', 'error', `Database fout (${operation}): ${errorMessage}`, user?.uid, user?.displayName || 'Anoniem');

  // Log details only to developer console, not to user toasts if sensitive
  if (error && typeof error === 'object') {
    console.group(`Detailed Supabase Error: ${operation}`);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    console.groupEnd();
  }

  const errInfo: SupabaseErrorInfo = {
    error: errorMessage,
    operation,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
    }
  };
  
  if (error?.code === '42501' || error?.message?.includes('insufficient permissions')) {
    toast.error(`Toegang geweigerd: Je hebt onvoldoende rechten voor ${operation}.`);
  } else {
    // Show a simplified message for common users, detailed for admins
    const displayMessage = isAdmin 
      ? `Fout bij ${operation}: ${errorMessage}`
      : `Er is een systeemfout opgetreden. Probeer het later opnieuw.`;
    
    toast.error(displayMessage);
  }
}

export const convertEmoticons = (text: string): string => {
  const EMOJI_MAP: Record<string, string> = {
    ':D': '😀',
    ':-D': '😀',
    'XD': '😆',
    'xD': '😆',
    'xd': '😆',
    ':)': '🙂',
    ':-)': '🙂',
    ':(': '☹️',
    ':-(': '☹️',
    ';)': '😉',
    ';-)': '😉',
    ':P': '😛',
    ':p': '😛',
    ':-P': '😛',
    ':-p': '😛',
    '<3': '❤️',
    'B)': '😎',
    'B-)': '😎',
    ':/': '😕',
    ':-/': '😕',
    ':O': '😮',
    ':o': '😮',
    ':-O': '😮',
    ':-o': '😮',
    ":'(": '😢',
    ':-*': '😘',
    ':*': '😘',
    ':-|': '😐',
    ':|': '😐',
    ':-$': '😳',
    ':$': '😳',
    '(y)': '👍',
    '(n)': '👎',
  };

  let newText = text;
  Object.entries(EMOJI_MAP).forEach(([emoticon, emoji]) => {
    // Escape special characters for regex
    const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace emoticons that are either at the start, end, or surrounded by whitespace/punctuation
    // Using lookahead for the trailing boundary to avoid consuming it
    const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escapedEmoticon}(?=\\s|$|[^a-zA-Z0-9])`, 'g');
    newText = newText.replace(regex, (match, p1) => `${p1}${emoji}`);
  });
  return newText;
};

export const maskEmail = (email: string | undefined | null) => {
  if (!email) return 'anoniem@ftjm.app';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  if (user.length <= 2) return `*@${domain}`;
  return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
};

export const isDarkColor = (color: string): boolean => {
  if (!color) return false;
  
  // Convert hex to RGB
  let r, g, b;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    } else {
      return false;
    }
  } else {
    return false;
  }

  // Calculate perceived brightness (HSP color model)
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  return hsp < 127.5;
};

export const parseAdminNotes = (notesStr: string | null | undefined): AdminNotesData => {
  const fallback: AdminNotesData = {
    telemetry: [],
    warnings: [],
    banned_until: null,
    ban_reason: null
  };
  if (!notesStr) return fallback;
  try {
    const parsed = JSON.parse(notesStr);
    if (Array.isArray(parsed)) {
      return {
        ...fallback,
        telemetry: parsed
      };
    } else if (parsed && typeof parsed === 'object') {
      if ('telemetry' in parsed || 'warnings' in parsed || 'banned_until' in parsed) {
        return {
          telemetry: parsed.telemetry || [],
          warnings: parsed.warnings || [],
          banned_until: parsed.banned_until || null,
          ban_reason: parsed.ban_reason || null
        };
      }
      return {
        ...fallback,
        telemetry: [parsed]
      };
    }
  } catch (e) {
    console.warn('[parseAdminNotes] Error parsing admin notes:', e);
  }
  return fallback;
};
