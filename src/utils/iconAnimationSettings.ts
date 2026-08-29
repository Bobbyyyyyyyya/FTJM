import { useState, useEffect } from 'react';

export type IconAnimationMode = 'all' | 'hover_only' | 'disabled';

const STORAGE_KEY = 'ftjm_icon_animation_mode';
const EVENT_NAME = 'ftjm_icon_animation_mode_change';

/**
 * Gets the current icon animation mode from localStorage or memory.
 */
export const getIconAnimationMode = (): IconAnimationMode => {
  if (typeof window === 'undefined') return 'all';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'all' || stored === 'hover_only' || stored === 'disabled') {
      return stored;
    }
  } catch (e) {
    // localStorage might be blocked
  }
  return 'all';
};

/**
 * Updates the icon animation mode in localStorage and notifies all components.
 */
export const setIconAnimationMode = (mode: IconAnimationMode) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    // ignore
  }

  // Dispatch custom event for real-time reactivity in all mounted components
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: mode }));
  } catch (e) {
    // ignore
  }
};

/**
 * React hook to reactively subscribe to changes in icon animation mode.
 */
export const useIconAnimationMode = (): IconAnimationMode => {
  const [mode, setMode] = useState<IconAnimationMode>(() => getIconAnimationMode());

  useEffect(() => {
    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<IconAnimationMode>;
      if (customEvent.detail) {
        setMode(customEvent.detail);
      } else {
        setMode(getIconAnimationMode());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setMode(getIconAnimationMode());
      }
    };

    window.addEventListener(EVENT_NAME, handleModeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleModeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return mode;
};
