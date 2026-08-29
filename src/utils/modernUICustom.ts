import { useState, useEffect, useCallback } from 'react';
import { ModernUICustomization, CustomTheme } from '../types';
import { secureLocalStorage } from './encryption';

export const MODERN_UI_STORAGE_KEY = 'ftjm_modern_ui_custom_v1';

export const DEFAULT_MODERN_UI_CUSTOM: ModernUICustomization = {
  enabled: true,
  sidebar_position: 'left',
  accent_style: 'theme',
  custom_accent_color: '#06b6d4',
  glass_intensity: 'frosted',
  card_radius: 'modern',
  density: 'balanced',
  ambient_aura: true,
  ambient_aura_color: 'rgba(6, 182, 212, 0.15)',
  glow_active_items: true,
  show_offline_users: true,
  dock_position: 'bottom',
  sidebar_blur: 24,
  sidebar_opacity: 80,
  auto_hide_top_bar: false,
};

/**
 * Automatically synchronizes Modern UI styling with any standard theme preset.
 * Modern UI automatically adopts the preset's primary color, border radiuses, and glass styling.
 */
export function syncModernUIWithThemePreset(presetKey: string, theme: Partial<CustomTheme>): Partial<ModernUICustomization> {
  const primary = theme.primary_color || '#06b6d4';
  const radiusSetting: ModernUICustomization['card_radius'] = 
    (theme.border_radius ?? 12) <= 6 ? 'crisp' :
    (theme.border_radius ?? 12) <= 16 ? 'modern' :
    (theme.border_radius ?? 12) <= 24 ? 'squircle' : 'pill';

  const glassSetting: ModernUICustomization['glass_intensity'] =
    theme.glass_effect === false ? 'none' :
    presetKey === 'cyberpunk' || presetKey === 'matrix' || presetKey === 'vaporwave' ? 'cyber' :
    (theme.blur_amount ?? 10) >= 14 ? 'deep' : 'frosted';

  return {
    accent_style: 'theme',
    custom_accent_color: primary,
    glass_intensity: glassSetting,
    card_radius: radiusSetting,
    ambient_aura: true,
    ambient_aura_color: `${primary}33`,
    glow_active_items: true,
  };
}

export function getLocalModernUICustom(): ModernUICustomization {
  try {
    const raw = secureLocalStorage.getItem(MODERN_UI_STORAGE_KEY) || localStorage.getItem(MODERN_UI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MODERN_UI_CUSTOM };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MODERN_UI_CUSTOM, ...parsed };
  } catch (e) {
    console.error('Failed to load local modern UI settings:', e);
    return { ...DEFAULT_MODERN_UI_CUSTOM };
  }
}

export function saveLocalModernUICustom(updates: Partial<ModernUICustomization>): ModernUICustomization {
  try {
    const current = getLocalModernUICustom();
    const updated = { ...current, ...updates };
    const serialized = JSON.stringify(updated);
    secureLocalStorage.setItem(MODERN_UI_STORAGE_KEY, serialized);
    localStorage.setItem(MODERN_UI_STORAGE_KEY, serialized);
    
    // Broadcast custom event so active windows & components update in real-time
    window.dispatchEvent(new CustomEvent('ftjm_modern_ui_changed', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to save local modern UI settings:', e);
    return { ...DEFAULT_MODERN_UI_CUSTOM, ...updates };
  }
}

export function resetLocalModernUICustom(): ModernUICustomization {
  try {
    const serialized = JSON.stringify(DEFAULT_MODERN_UI_CUSTOM);
    secureLocalStorage.setItem(MODERN_UI_STORAGE_KEY, serialized);
    localStorage.setItem(MODERN_UI_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent('ftjm_modern_ui_changed', { detail: DEFAULT_MODERN_UI_CUSTOM }));
    return { ...DEFAULT_MODERN_UI_CUSTOM };
  } catch (e) {
    console.error('Failed to reset modern UI settings:', e);
    return { ...DEFAULT_MODERN_UI_CUSTOM };
  }
}

export const resetLocalModernUI = resetLocalModernUICustom;

export function getAccentHex(custom?: ModernUICustomization | null, theme?: CustomTheme | null): string {
  // If the user explicitly chose a custom color
  if (custom?.accent_style === 'custom' && custom.custom_accent_color) {
    return custom.custom_accent_color;
  }
  // If set to follow theme preset (or default), prefer the theme's primary color
  if (!custom?.accent_style || custom.accent_style === 'theme') {
    if (theme?.primary_color) return theme.primary_color;
    if (theme?.accent_color) return theme.accent_color;
  }
  // If user selected a specific preset accent
  if (custom?.accent_style && custom.accent_style !== 'custom') {
    switch (custom.accent_style) {
      case 'theme':
        return theme?.primary_color || theme?.accent_color || '#06b6d4';
      case 'cyan': return '#06b6d4';
      case 'emerald': return '#10b981';
      case 'violet': return '#8b5cf6';
      case 'amber': return '#f59e0b';
      case 'rose': return '#f43f5e';
      case 'monochrome': return '#71717a';
      default: 
        return theme?.primary_color || '#06b6d4';
    }
  }
  if (theme?.primary_color) return theme.primary_color;
  if (theme?.accent_color) return theme.accent_color;
  return '#06b6d4';
}

export function getGlassEffectClasses(intensity?: ModernUICustomization['glass_intensity']): string {
  switch (intensity) {
    case 'none':
      return 'bg-app-card border border-app-border';
    case 'subtle':
      return 'bg-app-card/90 backdrop-blur-md border border-white/10 shadow-lg';
    case 'frosted':
      return 'bg-app-card/75 backdrop-blur-2xl border border-white/15 shadow-2xl';
    case 'deep':
      return 'bg-app-card/60 backdrop-blur-3xl border border-white/20 shadow-2xl';
    case 'cyber':
      return 'bg-app-card/50 backdrop-blur-3xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]';
    default:
      return 'bg-app-card/75 backdrop-blur-2xl border border-white/15 shadow-2xl';
  }
}

export function getRadiusValue(radius?: ModernUICustomization['card_radius'], theme?: CustomTheme | null): string {
  if (radius) {
    switch (radius) {
      case 'crisp': return '0.5rem'; // 8px
      case 'modern': return '1rem'; // 16px
      case 'squircle': return '1.5rem'; // 24px
      case 'pill': return '2rem'; // 32px
      default: return '1.25rem';
    }
  }
  if (theme?.border_radius !== undefined) {
    return `${theme.border_radius}px`;
  }
  return '1.25rem';
}

export function useLocalModernUI(): [ModernUICustomization, (updates: Partial<ModernUICustomization>) => void, () => void] {
  const [settings, setSettings] = useState<ModernUICustomization>(getLocalModernUICustom);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ModernUICustomization>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getLocalModernUICustom());
      }
    };

    window.addEventListener('ftjm_modern_ui_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ftjm_modern_ui_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const update = useCallback((updates: Partial<ModernUICustomization>) => {
    const updated = saveLocalModernUICustom(updates);
    setSettings(updated);
  }, []);

  const reset = useCallback(() => {
    const defaulted = resetLocalModernUICustom();
    setSettings(defaulted);
  }, []);

  return [settings, update, reset];
}
