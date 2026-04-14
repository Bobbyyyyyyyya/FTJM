import { toast } from 'sonner';
import { AudioLog, SupabaseErrorInfo } from '../types';
import { supabase } from './supabase';

export const audioCache = new Map<string, HTMLAudioElement>();

export const logAudioEvent = async (url: string, status: 'success' | 'error' | 'warning', message: string, userId?: string, userName?: string) => {
  try {
    // We use the default supabase client for logging
    await supabase.from('audio_logs').insert({
      url,
      status,
      message,
      user_id: userId,
      user_name: userName,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log audio event:', err);
  }
};

export const playSound = (url: string, enabled: boolean, userId?: string, userName?: string) => {
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
      logAudioEvent(url, 'success', `YouTube audio gestart: ${videoId}`, userId, userName);
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
        logAudioEvent(url, 'success', 'Geluid succesvol afgespeeld', userId, userName);
      }).catch(error => {
        console.warn('Audio play failed:', error);
        logAudioEvent(url, 'error', `Afspelen mislukt: ${error.message || error.name}`, userId, userName);
        
        if (error.name === 'NotAllowedError') {
          toast.info('Klik op het luidspreker-icoon bovenin om geluiden te activeren', {
            id: 'audio-unlock-toast',
            duration: 8000,
            action: {
              label: 'Herstel Audio',
              onClick: () => {
                const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
                silent.play().then(() => {
                  toast.success('Geluiden geactiveerd!');
                  audio?.play();
                });
              }
            }
          });
        } else {
          // Attempt a more aggressive fallback: create a completely new instance
          console.log('Attempting aggressive fallback with new Audio instance');
          const fallback = new Audio(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now());
          fallback.volume = 0.5;
          fallback.play().then(() => {
            logAudioEvent(url, 'warning', 'Afgespeeld via agressieve fallback na initiële fout', userId, userName);
          }).catch(e => {
            console.error('Aggressive fallback also failed:', e);
            logAudioEvent(url, 'error', `Agressieve fallback ook mislukt: ${e.message}`, userId, userName);
          });
        }
      });
    }
  } catch (err) {
    console.error('Error in playSound:', err);
    logAudioEvent(url, 'error', `Systeemfout in playSound: ${err instanceof Error ? err.message : String(err)}`, userId, userName);
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
    console.group(`Detailed Supabase Error: ${operation}`);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    console.log('Full Object:', JSON.stringify(error, null, 2));
    console.groupEnd();
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
