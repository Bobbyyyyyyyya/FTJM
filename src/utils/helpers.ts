import { toast } from 'sonner';
import { SupabaseErrorInfo } from '../types';

export const audioCache = new Map<string, HTMLAudioElement>();

export const playSound = (url: string, enabled: boolean) => {
  if (!enabled || !url) {
    console.log('Sound skipped:', { enabled, hasUrl: !!url });
    return;
  }
  
  try {
    // YouTube detection (including shorts)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(ytRegex);

    if (ytMatch) {
      const videoId = ytMatch[1];
      console.log('YouTube sound detected:', videoId);
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

    console.log('Attempting to play sound:', url);
    let audio = audioCache.get(url);
    
    if (!audio) {
      console.log('Audio not in cache, creating new instance');
      audio = new Audio(url);
      audio.preload = 'auto';
      audioCache.set(url, audio);
    }
    
    // Reset and play
    audio.volume = 0.5;
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Sound played successfully');
      }).catch(error => {
        console.warn('Audio play failed:', error);
        
        if (error.name === 'NotAllowedError') {
          toast.info('Klik ergens om geluiden te activeren', {
            id: 'audio-unlock-toast',
            duration: 5000,
            action: {
              label: 'Activeer',
              onClick: () => {
                const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
                silent.play().then(() => {
                  toast.success('Geluiden geactiveerd!');
                  audio?.play();
                });
              }
            }
          });
        } else if (error.name === 'NotSupportedError' || error.message?.includes('supported source')) {
          console.error('Audio format not supported or invalid URL:', url);
          // Don't toast every time to avoid spam, but log it clearly
        } else {
          // Only try fallback for other types of errors (like transient network issues)
          console.log('Attempting one-time fallback for transient error');
          const fallback = new Audio(url);
          fallback.volume = 0.5;
          fallback.play().catch(e => {
            if (!e.message?.includes('supported source')) {
              console.error('Fallback audio also failed:', e);
            }
          });
        }
      });
    }
  } catch (err) {
    console.error('Error in playSound:', err);
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

export async function handleSupabaseError(error: any, operation: string, user?: any) {
  console.error(`Supabase Error during ${operation}:`, error);
  
  if (error && typeof error === 'object') {
    console.log('Full Error Object:', JSON.stringify(error, null, 2));
  }

  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    operation,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
    }
  };
  
  if (error?.code === '42501' || error?.message?.includes('insufficient permissions')) {
    toast.error(`Geen toestemming voor ${operation}. Controleer of je bent ingelogd.`);
  } else {
    toast.error(`Er is een fout opgetreden tijdens ${operation}: ${error?.message || 'Onbekende fout'}`);
  }
}
