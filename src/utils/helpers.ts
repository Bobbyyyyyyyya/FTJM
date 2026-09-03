import { toast } from 'sonner';
import { AudioLog, SupabaseErrorInfo, AdminNotesData } from '../types';
import { supabase } from './supabase';
import { compressVideo } from './videoCompressor';
import { PROTECTED_NAMES_LIST } from '../constants/protectedNames';

export { compressVideo };

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
    // Presets & Old Sounds mapped to new sounds
    '/audio/sounds/ping.mp3': '/audio/sounds/notification_o14egLP.mp3',
    '/audio/sounds/notification.mp3': '/audio/sounds/notification_o14egLP.mp3',
    '/audio/sounds/chime.mp3': '/audio/sounds/fears-to-fathom-notification-sound.mp3',
    '/audio/sounds/alert.wav': '/audio/sounds/yt1s_nijLeKo.mp3',
    '/audio/sounds/pop.mp3': '/audio/sounds/007_Text_Message-3875438.mp3',
    '/audio/sounds/success.mp3': '/audio/sounds/notification_o14egLP.mp3',
    '/audio/sounds/bling.mp3': '/audio/sounds/007_Text_Message-3875438.mp3',
    '/audio/sounds/default_old.mp3': '/audio/sounds/notification_o14egLP.mp3',
    '/audio/sounds/notification_old.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://image2url.com/r2/default/audio/1775756671546-6f36bf87-4347-477b-a2da-1af03009fdcf.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://www.image2url.com/r2/default/audio/1775756671546-6f36bf87-4347-477b-a2da-1af03009fdcf.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://image2url.com/r2/default/audio/1775755636867-f3aa78d1-03e7-48c2-b75a-a5f990f517e9.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://www.image2url.com/r2/default/audio/1775755636867-f3aa78d1-03e7-48c2-b75a-a5f990f517e9.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://image2url.com/r2/default/audio/1775756302748-a840da24-e9d3-47a0-9e14-2a582fc0e093.mp3': '/audio/sounds/fears-to-fathom-notification-sound.mp3',
    'https://www.image2url.com/r2/default/audio/1775756302748-a840da24-e9d3-47a0-9e14-2a582fc0e093.mp3': '/audio/sounds/fears-to-fathom-notification-sound.mp3',
    'https://image2url.com/r2/default/audio/1775754319337-0525bbd3-8adb-4c26-ae70-842ba5769e7f.wav': '/audio/sounds/yt1s_nijLeKo.mp3',
    'https://www.image2url.com/r2/default/audio/1775754319337-0525bbd3-8adb-4c26-ae70-842ba5769e7f.wav': '/audio/sounds/yt1s_nijLeKo.mp3',
    'https://image2url.com/r2/default/audio/1775755973661-157bd979-8f6e-4d86-9e32-74761db166d9.mp3': '/audio/sounds/007_Text_Message-3875438.mp3',
    'https://www.image2url.com/r2/default/audio/1775755973661-157bd979-8f6e-4d86-9e32-74761db166d9.mp3': '/audio/sounds/007_Text_Message-3875438.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2366/2366-preview.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2372/2372-preview.mp3': '/audio/sounds/007_Text_Message-3875438.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3': '/audio/sounds/notification_o14egLP.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3': '/audio/sounds/notification_o14egLP.mp3',

    // Ringtones mapped to new ringtones
    '/audio/ringtones/classic.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    '/audio/ringtones/ringtone1.mp3': '/audio/ringtones/iphone-ringtone-remix.mp3',
    '/audio/ringtones/ringtone2.mp3': '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3',
    '/audio/ringtones/nokia.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    '/audio/ringtones/digital.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    '/audio/ringtones/synthesizer.mp3': '/audio/ringtones/iphone-ringtone-remix.mp3',
    '/audio/ringtones/zen.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    '/audio/ringtones/siren.mp3': '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3',
    'https://www.image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    'https://image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    'https://www.image2url.com/r2/default/audio/1779892149416-1b7cd84d-217e-48d2-8263-4867b8800b27.mp3': '/audio/ringtones/iphone-ringtone-remix.mp3',
    'https://image2url.com/r2/default/audio/1779892149416-1b7cd84d-217e-48d2-8263-4867b8800b27.mp3': '/audio/ringtones/iphone-ringtone-remix.mp3',
    'https://www.image2url.com/r2/default/audio/1779892243173-6df7f26d-7f4e-4060-ba80-c0ed72a81f99.mp3': '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3',
    'https://image2url.com/r2/default/audio/1779892243173-6df7f26d-7f4e-4060-ba80-c0ed72a81f99.mp3': '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1230/1230-preview.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3': '/audio/ringtones/iphone-ringtone-remix.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3': '/audio/ringtones/skype_ringtone_new.mp3',
    'https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3': '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3',

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
  
  if (error?.code === '42501' || error?.message?.includes('insufficient permissions') || errorMessage?.includes('RLS')) {
    toast.error(`Toegang geweigerd (RLS): ${errorMessage}`);
  } else {
    // Show a simplified message for common users, detailed for admins or RLS errors
    const displayMessage = (isAdmin || errorMessage.includes('RLS'))
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

export const parseAdminNotes = (notesStr: string | null | undefined, customTheme?: any): AdminNotesData => {
  const fallback: AdminNotesData = {
    telemetry: [],
    warnings: [],
    banned_until: null,
    ban_reason: null
  };
  
  // Helper to parse a single admin notes string or object safely
  const parseSingle = (input: any): AdminNotesData | null => {
    if (!input) return null;
    if (typeof input === 'object') {
      return {
        telemetry: Array.isArray(input.telemetry) ? input.telemetry : (Array.isArray(input.user_telemetry) ? input.user_telemetry : []),
        warnings: Array.isArray(input.warnings) ? input.warnings : [],
        banned_until: input.banned_until || null,
        ban_reason: input.ban_reason || null
      };
    }
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return {
          ...fallback,
          telemetry: parsed
        };
      } else if (parsed && typeof parsed === 'object') {
        return {
          telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : (Array.isArray(parsed.user_telemetry) ? parsed.user_telemetry : []),
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
          banned_until: parsed.banned_until || null,
          ban_reason: parsed.ban_reason || null
        };
      }
    } catch (e) {
      console.warn('[parseAdminNotes] Error parsing input:', e);
    }
    return null;
  };

  const fromTheme = customTheme && typeof customTheme === 'object' && customTheme.admin_notes
    ? parseSingle(customTheme.admin_notes)
    : null;
    
  const fromNotes = parseSingle(notesStr);

  if (fromNotes && fromTheme) {
    // Merge them! Give precedence to whatever has warnings/bans, or the one with more telemetry
    return {
      telemetry: fromNotes.telemetry.length >= fromTheme.telemetry.length ? fromNotes.telemetry : fromTheme.telemetry,
      warnings: fromNotes.warnings.length >= fromTheme.warnings.length ? fromNotes.warnings : fromTheme.warnings,
      banned_until: fromNotes.banned_until || fromTheme.banned_until || null,
      ban_reason: fromNotes.ban_reason || fromTheme.ban_reason || null
    };
  }

  return fromNotes || fromTheme || fallback;
};

export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]{2,}$/i.test(tld)) return false;

  return true;
};

export const VERIFIED_EMAILS = [
  'markohoksen@gmail.com',
  'zwedenguy@gmail.com'
];

export const BETA_TESTER_EMAILS = [
  'samleeuw803@gmail.com'
];

export const isVerifiedEmail = (
  emailOrProfile?: string | { email?: string | null; is_verified?: boolean | null } | null,
  isVerifiedCol?: boolean | null
): boolean => {
  if (!emailOrProfile) return isVerifiedCol === true;
  if (typeof emailOrProfile === 'object') {
    if (emailOrProfile.is_verified === true) return true;
    if (emailOrProfile.email) {
      return VERIFIED_EMAILS.includes(emailOrProfile.email.toLowerCase().trim());
    }
    return false;
  }
  if (isVerifiedCol === true) return true;
  return VERIFIED_EMAILS.includes(emailOrProfile.toLowerCase().trim());
};

export const isBetaTester = (
  userOrEmail?: string | { email?: string | null; role?: string | null } | null
): boolean => {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'object') {
    if ((userOrEmail as any).is_beta_tester === true) return true;
    if (userOrEmail.email) {
      return BETA_TESTER_EMAILS.includes(userOrEmail.email.toLowerCase().trim());
    }
    return false;
  }
  return BETA_TESTER_EMAILS.includes(userOrEmail.toLowerCase().trim());
};

/**
 * Anti-Name Piracy & Impersonation Shield
 * Detects unauthorized use or impersonation variations of protected identities:
 * - Jonatech / Jonatek / Jonathech
 * - Marko / Marko Hoksen / Marco Hoksen / Hoksen
 */
export const isProtectedNameOrImpersonation = (
  nameOrEmail: string | null | undefined,
  currentAuthenticatedEmail?: string | null
): { isPirated: boolean; matchedPattern?: string; reason?: string } => {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') {
    return { isPirated: false };
  }

  const authenticatedEmail = (currentAuthenticatedEmail || '').toLowerCase().trim();
  // The verified genuine administrator / owner account is authorized
  if (authenticatedEmail === 'markohoksen@gmail.com') {
    return { isPirated: false };
  }

  const raw = nameOrEmail.trim().toLowerCase();

  // If email passed, also test the local username part (e.g. markohoksen@other.com)
  const parts = raw.split('@');
  const textToTest = parts.length > 1 ? parts[0] : raw;

  // 1. Normalize diacritics / accents (e.g., márkò -> marko)
  const normalized = textToTest
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Leetspeak & symbol substitution mapping
  const deLeeted = normalized
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/8/g, 'b')
    .replace(/v/g, 'u')
    .replace(/c/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/ph/g, 'f');

  // 3. Stripped alphanumeric version
  const strippedAlpha = deLeeted.replace(/[^a-z0-9]/g, '');
  const originalStripped = normalized.replace(/[^a-z0-9]/g, '');

  // Protected core roots and exhaustive list of 170+ variations
  const protectedRoots = [
    'jonatech',
    'jonatek',
    'jonathech',
    'jonatec',
    'jonathck',
    'markohoksen',
    'markohoxen',
    'marcohoksen',
    'marcohoxen',
    'hoksenmarko',
    'hoxenmarko',
    'marko',
    'marco',
    'hoksen',
    'hoxen',
    ...PROTECTED_NAMES_LIST
  ];

  // Specific strict root tokens and comprehensive list check
  const wordTokens = normalized.split(/[\s_.-]+/);
  for (const root of protectedRoots) {
    const rootClean = root.replace(/[^a-z0-9]/g, '').toLowerCase();
    if (!rootClean) continue;

    // For full names/longer variations (4+ chars), check substring and token containment
    if (rootClean.length >= 4) {
      if (
        strippedAlpha.includes(rootClean) ||
        originalStripped.includes(rootClean) ||
        raw.includes(root.toLowerCase()) ||
        normalized.includes(root.toLowerCase())
      ) {
        return {
          isPirated: true,
          matchedPattern: root,
          reason: 'Gereserveerde merknaam of beheerder-identiteit (Jonatech / Marko Hoksen)'
        };
      }
    } else {
      // For very short roots (< 4 chars, e.g. "hox"), require exact matching on word token or stripped input
      if (
        strippedAlpha === rootClean ||
        originalStripped === rootClean ||
        wordTokens.some(tok => tok.replace(/[^a-z0-9]/g, '').toLowerCase() === rootClean) ||
        raw === root.toLowerCase()
      ) {
        return {
          isPirated: true,
          matchedPattern: root,
          reason: 'Gereserveerde merknaam of beheerder-identiteit (Jonatech / Marko Hoksen)'
        };
      }
    }
  }

  // Check spaced words (e.g. "jona tech", "marko h", "m hoksen", "real marko")
  for (const token of wordTokens) {
    const cleanToken = token.replace(/[^a-z0-9]/g, '');
    if (cleanToken && (
      ['jonatech', 'jonatek', 'marko', 'marco', 'hoksen', 'hoxen', 'maarko', 'maarco', 'marcko', 'markko', 'marcco', 'markos', 'marcos', 'marcus', 'markus', 'marqo'].includes(cleanToken) ||
      PROTECTED_NAMES_LIST.includes(cleanToken)
    )) {
      return {
        isPirated: true,
        matchedPattern: cleanToken,
        reason: 'Gereserveerde merknaam of beheerder-identiteit (Jonatech / Marko Hoksen)'
      };
    }
  }

  return { isPirated: false };
};

export const isTestUser = (
  userOrEmail?: string | { email?: string | null; display_name?: string | null; role?: string | null } | null
): boolean => {
  if (!userOrEmail) return false;
  let email = '';
  let name = '';
  let role = '';

  if (typeof userOrEmail === 'string') {
    email = userOrEmail.toLowerCase().trim();
    name = userOrEmail.toLowerCase().trim();
  } else {
    email = (userOrEmail.email || '').toLowerCase().trim();
    name = (userOrEmail.display_name || '').toLowerCase().trim();
    role = (userOrEmail.role || '').toLowerCase().trim();
  }

  // Check emails indicating test accounts
  if (
    email.includes('test@') ||
    email.endsWith('@test.com') ||
    email.endsWith('@example.com') ||
    email.includes('testuser') ||
    email.startsWith('test_') ||
    email.startsWith('test.') ||
    email.startsWith('dummy') ||
    email.startsWith('mock') ||
    email.startsWith('fake')
  ) {
    return true;
  }

  // Check display names indicating test users
  if (
    name === 'test' ||
    name === 'tester' ||
    name === 'test user' ||
    name === 'test user 1' ||
    name === 'test user 2' ||
    name === 'test account' ||
    name === 'testaccount' ||
    name === 'testuser' ||
    name.startsWith('test user') ||
    name.startsWith('testuser') ||
    name.startsWith('test account') ||
    name.startsWith('dummy user') ||
    name.startsWith('mock user')
  ) {
    return true;
  }

  if (role === 'test' || role === 'tester_dummy' || role === 'test_user') {
    return true;
  }

  return false;
};

/**
 * Generates a public share URL pointing to the production preview (ais-pre-) instead of dev (ais-dev-)
 */
export const getMediaShareUrl = (mediaIdOrUrl: string): string => {
  if (typeof window === 'undefined') return '';
  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  const pathname = window.location.pathname || '';
  return `${origin}${pathname}?media=${encodeURIComponent(mediaIdOrUrl)}`;
};

export interface DeviceOSInfo {
  name: 'Chrome OS' | 'macOS' | 'Windows' | 'Linux' | 'iOS' | 'iPadOS' | 'Android' | 'Onbekend';
  isChromeOS: boolean;
  icon: string;
  badgeClass: string;
  browserName: string;
  formattedLabel: string;
}

/**
 * Accurately detects the operating system, with full precedence for Chrome OS (CrOS)
 * to prevent Chromebooks / Chrome OS devices from being wrongly classified as Linux.
 */
export const getDeviceOSInfo = (userAgentStr?: string, platformStr?: string): DeviceOSInfo => {
  const ua = userAgentStr || (typeof window !== 'undefined' ? navigator.userAgent : '') || '';
  const platform = platformStr || (typeof window !== 'undefined' ? ((navigator as any).userAgentData?.platform || navigator.platform || '') : '') || '';

  // 1. Detect Chrome OS FIRST (prevents X11/Linux false positives)
  if (/CrOS|Chromebook|ChromeOS|cros/i.test(ua) || /Chrome OS|CrOS/i.test(platform)) {
    return {
      name: 'Chrome OS',
      isChromeOS: true,
      icon: '🌐',
      badgeClass: 'bg-cyan-500/15 text-cyan-600 border border-cyan-500/30',
      browserName: 'Chrome',
      formattedLabel: 'Chrome OS (Chromebook)'
    };
  }

  // 2. iOS / iPadOS
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && typeof window !== 'undefined' && navigator.maxTouchPoints && navigator.maxTouchPoints > 1)) {
    return {
      name: 'iPadOS',
      isChromeOS: false,
      icon: '📱',
      badgeClass: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
      browserName: /CriOS/i.test(ua) ? 'Chrome' : /FxiOS/i.test(ua) ? 'Firefox' : 'Safari',
      formattedLabel: 'iPadOS'
    };
  }

  if (/iPhone|iPod/i.test(ua)) {
    return {
      name: 'iOS',
      isChromeOS: false,
      icon: '📱',
      badgeClass: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
      browserName: /CriOS/i.test(ua) ? 'Chrome' : /FxiOS/i.test(ua) ? 'Firefox' : 'Safari',
      formattedLabel: 'iOS (iPhone)'
    };
  }

  // 3. Android
  if (/Android/i.test(ua) || /Android/i.test(platform)) {
    return {
      name: 'Android',
      isChromeOS: false,
      icon: '🤖',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
      browserName: /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : 'Android Browser',
      formattedLabel: 'Android'
    };
  }

  // 4. macOS
  if (/Mac|Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(ua) || /Mac/i.test(platform)) {
    return {
      name: 'macOS',
      isChromeOS: false,
      icon: '🍎',
      badgeClass: 'bg-purple-500/15 text-purple-600 border border-purple-500/30',
      browserName: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : 'Safari',
      formattedLabel: 'macOS'
    };
  }

  // 5. Windows
  if (/Win|Windows|Win32|Win64|WinCE|Windows NT/i.test(ua) || /Win/i.test(platform)) {
    return {
      name: 'Windows',
      isChromeOS: false,
      icon: '🪟',
      badgeClass: 'bg-sky-500/15 text-sky-600 border border-sky-500/30',
      browserName: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : 'Browser',
      formattedLabel: 'Windows'
    };
  }

  // 6. Generic Linux (only after Chrome OS check!)
  if (/Linux|X11/i.test(ua) || /Linux/i.test(platform)) {
    return {
      name: 'Linux',
      isChromeOS: false,
      icon: '🐧',
      badgeClass: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
      browserName: /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : 'Browser',
      formattedLabel: 'Linux'
    };
  }

  return {
    name: 'Onbekend',
    isChromeOS: false,
    icon: '💻',
    badgeClass: 'bg-zinc-500/15 text-zinc-600 border border-zinc-500/30',
    browserName: 'Browser',
    formattedLabel: 'Onbekend Apparaat'
  };
};

/**
 * Binary Image Compressor: Converts any File, Blob, or Data URL to an ultra-lightweight WebP/JPEG Blob.
 * Eliminates the 33% Base64 inflation and produces clean binary data.
 */
export const compressImageToBlob = (
  fileOrDataUrl: File | Blob | string,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.60,
  preferredMimeType: string = 'image/webp'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const processImg = (src: string, cleanup?: () => void) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (cleanup) cleanup();
          if (fileOrDataUrl instanceof Blob) resolve(fileOrDataUrl);
          else reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        if (cleanup) cleanup();

        // Try WebP first for ultra-light compression, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to jpeg
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) resolve(fallbackBlob);
                  else if (fileOrDataUrl instanceof Blob) resolve(fileOrDataUrl);
                  else reject(new Error('Blob conversion failed'));
                },
                'image/jpeg',
                quality
              );
            }
          },
          preferredMimeType,
          quality
        );
      };
      img.onerror = (e) => {
        if (cleanup) cleanup();
        if (fileOrDataUrl instanceof Blob) resolve(fileOrDataUrl);
        else reject(e);
      };
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImg(fileOrDataUrl);
    } else {
      const objectUrl = URL.createObjectURL(fileOrDataUrl);
      processImg(objectUrl, () => URL.revokeObjectURL(objectUrl));
    }
  });
};

/**
 * Uploads an image to ImgBB via the backend /api/upload-image route.
 * Returns public direct URL (e.g. https://i.ibb.co/...) with 0% database storage cost.
 */
export const uploadImageToImgBB = async (
  fileOrBlobOrDataUrl: File | Blob | string,
  fileName?: string
): Promise<{ url: string; thumb?: string; display_url?: string } | null> => {
  try {
    let base64String = '';
    let mimeType = 'image/jpeg';
    if (typeof fileOrBlobOrDataUrl === 'string') {
      base64String = fileOrBlobOrDataUrl;
      const match = fileOrBlobOrDataUrl.match(/^data:([^;]+);base64,/);
      if (match) mimeType = match[1];
    } else {
      mimeType = fileOrBlobOrDataUrl.type || 'image/jpeg';
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlobOrDataUrl);
      });
    }

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64String,
        name: fileName || `img_${Date.now()}`,
        mimeType,
      }),
    });

    const json = await res.json();
    if (res.ok && json.success && json.url) {
      return {
        url: json.url,
        thumb: json.thumb || json.display_url || json.url,
        display_url: json.display_url || json.url,
      };
    } else {
      if (json.error) {
        toast.error(`Uploadfout: ${json.error}`);
      }
      return null;
    }
  } catch (err: any) {
    console.error('[uploadImageToImgBB] Error:', err);
    toast.error('Kon afbeelding niet uploaden naar server/CDN.');
    return null;
  }
};

/**
 * Uploads a binary Blob or File directly to Supabase Storage and returns the public CDN URL.
 */
export const uploadBinaryToStorage = async (
  blob: Blob | File,
  pathPrefix: string = 'media',
  userId?: string
): Promise<string | null> => {
  try {
    const ext = blob.type.includes('webp') ? 'webp' : blob.type.includes('png') ? 'png' : blob.type.includes('video') ? 'webm' : 'jpg';
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId ? `${userId}/` : ''}${Date.now()}_${randomId}.${ext}`;
    const possibleBuckets = ['media', 'profile_media', 'uploads', 'public', 'avatars', 'wallpapers', 'files'];

    for (const bucket of possibleBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, blob, {
            cacheControl: '31536000', // 1 year cached egress on Supabase Storage CDN and edge
            upsert: true,
            contentType: blob.type
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        // Try next bucket
      }
    }
  } catch (err) {
    console.warn('[uploadBinaryToStorage] Storage upload note:', err);
  }
  return null;
};

/**
 * Client-side image compressor using HTML5 Canvas to keep base64 payloads minimal.
 */
export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth: number = 1024,
  maxHeight: number = 576,
  quality: number = 0.65
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:image')) {
        processImg(fileOrDataUrl);
      } else {
        resolve(fileOrDataUrl);
      }
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrDataUrl);
      reader.onload = (e) => {
        processImg(e.target?.result as string);
      };
      reader.onerror = (err) => reject(err);
    }
  });
};

/**
 * Automatically detects and uploads all data:image/audio/video URLs embedded inside a text payload to CDN/server.
 */
export const autoCompressAllDataUrlsInText = async (text: string): Promise<string> => {
  if (!text || (!text.includes('data:image/') && !text.includes('data:audio/') && !text.includes('data:video/'))) return text;
  const dataUrlRegex = /data:(image|audio|video)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = text.match(dataUrlRegex);
  if (!matches || matches.length === 0) return text;

  let newText = text;
  for (const match of matches) {
    try {
      const uploadRes = await uploadImageToImgBB(match, 'attachment');
      if (uploadRes?.url) {
        newText = newText.replace(match, uploadRes.url);
      }
    } catch (err) {
      console.warn('Auto-upload of data URL to CDN/server failed:', err);
    }
  }
  return newText;
};

export const hexToRgb = (hex?: string, defaultRgb = { r: 24, g: 24, b: 27 }): { r: number; g: number; b: number } => {
  if (!hex || typeof hex !== 'string') return defaultRgb;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  } else if (clean.length === 4) {
    clean = clean.slice(0, 3).split('').map(c => c + c).join('');
  } else if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  if (clean.length !== 6) return defaultRgb;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return defaultRgb;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

export const hexToRgba = (hex?: string, alpha: number = 1, fallback = 'transparent'): string => {
  if (!hex || typeof hex !== 'string') return fallback;
  const { r, g, b } = hexToRgb(hex);
  const clampedAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

/**
 * Strips obsolete, empty, or heavy bloat from custom_theme payloads before DB sync.
 */
export const sanitizeCustomTheme = (theme: any): any => {
  if (!theme || typeof theme !== 'object') return {};

  const clean: Record<string, any> = {};

  const allowedKeys = [
    'modern_ui',
    'modern_ui_custom',
    'profile_list_position',
    'wallpaper',
    'pattern',
    'primary_color',
    'secondary_color',
    'accent_color',
    'text_color',
    'card_bg_color',
    'sidebar_bg_color',
    'header_bg_color',
    'body_bg_color',
    'glass_effect',
    'blur_amount',
    'opacity',
    'chat_opacity',
    'profile_card_opacity',
    'wallpaper_x',
    'wallpaper_y',
    'border_radius',
    'font_family',
    'custom_font_name',
    'custom_font_url',
    'custom_font_data',
    'custom_fonts',
    'agreed_terms_v2',
    'game_high_scores',
    'following',
    'icon_animation_mode',
    'banner_url',
    'user_telemetry',
    'discord_id',
    'discord_username',
    'discord_link_code',
    'media'
  ];

  for (const key of allowedKeys) {
    if (theme[key] !== undefined && theme[key] !== null && theme[key] !== '') {
      clean[key] = theme[key];
    }
  }

  // Ensure game_high_scores is clean
  if (clean.game_high_scores && typeof clean.game_high_scores === 'object') {
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(clean.game_high_scores)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        scores[k] = Math.round(v);
      }
    }
    clean.game_high_scores = scores;
  }

  // Ensure following array is clean and bounded
  if (Array.isArray(clean.following)) {
    clean.following = Array.from(new Set(clean.following.filter((id: any) => typeof id === 'string' && id.length > 0))).slice(0, 100);
  }

  return clean;
};

/**
 * Safely formats any image URL to ensure 100% display reliability across all devices,
 * browser adblockers (uBlock, Brave Shields), and restricted school/corporate firewalls.
 * Automatically routes ImgBB (ibb.co & i.ibb.co) through the server image-proxy.
 */
export const getSafeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean;
  if (clean.startsWith('/api/image-proxy')) return clean;

  // ImgBB (both direct i.ibb.co CDN and ibb.co viewer links)
  if (clean.includes('ibb.co')) {
    return `/api/image-proxy?url=${encodeURIComponent(clean)}`;
  }

  // Handle local uploaded files that might be missing leading slash
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    return `/uploads/${clean}`;
  }

  return clean;
};

/**
 * Image error handler fallback: if a direct third-party image fails to load,
 * automatically retries once via the server-side image-proxy before giving up.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc?: string
) => {
  const target = e.currentTarget;
  const currentSrc = target.src;
  if (!currentSrc.includes('/api/image-proxy') && (currentSrc.startsWith('http://') || currentSrc.startsWith('https://'))) {
    target.src = `/api/image-proxy?url=${encodeURIComponent(currentSrc)}`;
    return;
  }
  if (fallbackSrc) {
    target.src = fallbackSrc;
  }
};



