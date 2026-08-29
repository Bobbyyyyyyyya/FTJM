import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Bell, Palette, Shield, User as UserIcon, Users, Camera, Save, Sparkles, Volume2, Upload, Play, Trash2, ShieldCheck, UserPlus, AlertTriangle, X, Plus, Flag, Layout, Activity, Check, Lock as LockIcon, Zap, Moon, Type, Monitor, ShieldAlert, UserMinus, Search, Leaf, Clock, Sun, Link, Info, Fingerprint, Key, Eye, EyeOff, FlaskConical, Download, ExternalLink, ChevronDown, ChevronUp, RefreshCw, HardDrive, Smartphone, Globe, MessageSquare, PanelLeft, PanelRight, LayoutList, LogOut, Sliders, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { rateLimiter } from '../utils/rateLimiter';
import CryptoJS from 'crypto-js';
import { UserProfile, CustomTheme, NotificationSettings, User, Report, Conversation, ModernUICustomization } from '../types';
import { SOUND_OPTIONS, RINGTONE_OPTIONS, PATTERNS, isVerifiedEmail, isBetaTester } from '../constants';
import { formatDate, convertEmoticons, maskEmail, parseAdminNotes, getDeviceOSInfo } from '../utils/helpers';
import { AudioLogsView } from './AudioLogsView';
import { getLocalArchiveStats, clearLocalArchive } from '../utils/localMessageArchive';
import { runAutoBase64Migration } from '../utils/base64Migration';
import { supabase } from '../utils/supabase';
import { Language, t } from '../utils/translations';
import { CustomFontManagerModal } from './CustomFontManagerModal';
import { DatabaseSecurityShield } from './DatabaseSecurityShield';
import { useLocalModernUI, getAccentHex } from '../utils/modernUICustom';
import { ModernUICustomizerModal } from './ModernUICustomizerModal';
import { 
  AnimatedMailIcon, 
  AnimatedChatIcon, 
  AnimatedMenuIcon, 
  AnimatedMediaIcon, 
  AnimatedBellIcon, 
  AnimatedThemeIcon, 
  AnimatedArcadeIcon, 
  AnimatedKeyboardIcon, 
  AnimatedForumIcon, 
  AnimatedNewsIcon, 
  useIconAnimationMode, 
  setIconAnimationMode, 
  IconAnimationMode 
} from './AnimatedIcons';
import { 
  PRESET_FONTS, 
  getLocalCustomFonts, 
  processUploadedFontFile, 
  createGoogleFontItem, 
  resolveFontFamilyString,
  injectGoogleFont
} from '../utils/fontManager';
import { ThemedSpinner } from './ThemedLoadingScreen';

interface SettingsViewProps {
  user: User;
  profile: UserProfile | null;
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  settingsTab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs' | 'security' | 'discord';
  setSettingsTab: (tab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs' | 'security' | 'discord') => void;
  isAdmin: boolean;
  displayNameInput: string;
  setDisplayNameInput: (input: string) => void;
  photoURLInput: string;
  setPhotoURLInput: (input: string) => void;
  bioInput: string;
  setBioInput: (input: string) => void;
  bannerURLInput: string;
  setBannerURLInput: (input: string) => void;
  handleUpdateProfile: () => void;
  handleUpdateNotifications: () => void;
  handleUpdateTheme: () => void;
  handleResetToGoogle: () => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  customSounds: { name: string, url: string }[];
  newSoundName: string;
  setNewSoundName: (input: string) => void;
  newSoundUrl: string;
  setNewSoundUrl: (input: string) => void;
  handleAddCustomSound: () => void;
  handleDeleteCustomSound: (index: number) => void;
  playSound: (url: string, enabled: boolean, userId?: string, userName?: string) => void;
  customTheme: CustomTheme;
  setCustomTheme: (theme: CustomTheme) => void;
  useCustomTheme: boolean;
  setUseCustomTheme: (use: boolean) => void;
  whitelist: { email: string, added_at: string }[];
  whitelistInput: string;
  setWhitelistInput: (input: string) => void;
  handleAddWhitelist: () => void;
  handleRemoveWhitelist: (email: string) => void;
  websiteStatus: string;
  statusInput: string;
  setStatusInput: (input: string) => void;
  handleUpdateStatus: () => void;
  fetchAdminData: () => Promise<void>;
  users: UserProfile[];
  handleBlockUser: (userId: string, isBlocked: boolean) => void;
  handleLockUserField: (userId: string, field: 'name' | 'bio', isLocked: boolean) => void;
  handleWarnUser: (userId: string, reason: string, details: string) => Promise<void>;
  handleTempBanUser: (userId: string, durationMinutes: number, reason: string) => Promise<void>;
  saving: boolean;
  uploadingSound: boolean;
  showInstallButton: boolean;
  handleInstallClick: () => void;
  scheduledMaintenance?: { isActive: boolean; targetTime: string } | null;
  maintenanceTimeLeft?: number | null;
  handleScheduleMaintenance?: (target: number | Date) => void;
  handleCancelMaintenance?: () => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  reports?: Report[];
  onUpdateReportStatus?: (reportId: string, status: string) => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onClearAllNotifications?: () => Promise<void>;
  notificationsCount?: number;
  conversations?: Conversation[];
  profiles?: UserProfile[];
  hiddenConversationIds?: string[];
  onToggleHideConversation?: (conversationId: string) => void;
  onUnhideAllConversations?: () => void;
  handleLogout?: () => void;
}

const THEME_PRESETS: Record<string, { name: string, theme: CustomTheme, icon: any }> = {
  'cyberpunk': {
    name: 'Cyberpunk',
    icon: Zap,
    theme: {
      primary_color: '#ff00ff',
      secondary_color: '#00ffff',
      accent_color: '#330033',
      text_color: '#ffffff',
      card_bg_color: '#1a001a',
      sidebar_bg_color: '#0d000d',
      header_bg_color: '#000000',
      body_bg_color: '#050005',
      glass_effect: true,
      blur_amount: 12,
      opacity: 20,
      chat_opacity: 30,
      profile_card_opacity: 40,
      pattern: 'none',
      border_radius: 12,
      font_family: 'mono',
      wallpaper: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'
    }
  },
  'midnight': {
    name: 'Midnight',
    icon: Moon,
    theme: {
      primary_color: '#3b82f6',
      secondary_color: '#1e3a8a',
      accent_color: '#1e293b',
      text_color: '#f8fafc',
      card_bg_color: '#0f172a',
      sidebar_bg_color: '#020617',
      header_bg_color: '#020617',
      body_bg_color: '#020617',
      glass_effect: true,
      blur_amount: 10,
      opacity: 10,
      chat_opacity: 15,
      profile_card_opacity: 20,
      pattern: 'none',
      border_radius: 20,
      font_family: 'sans'
    }
  },
  'forest': {
    name: 'Forest',
    icon: Leaf,
    theme: {
      primary_color: '#10b981',
      secondary_color: '#064e3b',
      accent_color: '#ecfdf5',
      text_color: '#064e3b',
      card_bg_color: '#ffffff',
      sidebar_bg_color: '#f0fdf4',
      header_bg_color: '#ffffff',
      body_bg_color: '#f0fdf4',
      glass_effect: true,
      blur_amount: 15,
      opacity: 10,
      chat_opacity: 20,
      profile_card_opacity: 15,
      pattern: 'none',
      border_radius: 16,
      font_family: 'sans'
    }
  },
  'retro': {
    name: 'Retro',
    icon: Clock,
    theme: {
      primary_color: '#f43f5e',
      secondary_color: '#fbbf24',
      accent_color: '#fef3c7',
      text_color: '#451a03',
      card_bg_color: '#fffbeb',
      sidebar_bg_color: '#fef3c7',
      header_bg_color: '#fef3c7',
      body_bg_color: '#fef3c7',
      glass_effect: false,
      pattern: 'none',
      border_radius: 0,
      font_family: 'serif'
    }
  },
  'lavender': {
    name: 'Lavender',
    icon: Sparkles,
    theme: {
      primary_color: '#a78bfa',
      secondary_color: '#7c3aed',
      accent_color: '#f5f3ff',
      text_color: '#2e1065',
      card_bg_color: '#ffffff',
      sidebar_bg_color: '#faf5ff',
      header_bg_color: '#ffffff',
      body_bg_color: '#f5f3ff',
      glass_effect: true,
      blur_amount: 15,
      opacity: 10,
      chat_opacity: 20,
      profile_card_opacity: 15,
      pattern: 'none',
      border_radius: 20,
      font_family: 'display'
    }
  },
  'oled': {
    name: 'OLED',
    icon: Sun,
    theme: {
      primary_color: '#ffffff',
      secondary_color: '#666666',
      accent_color: '#111111',
      text_color: '#ffffff',
      card_bg_color: '#000000',
      sidebar_bg_color: '#000000',
      header_bg_color: '#000000',
      body_bg_color: '#000000',
      glass_effect: false,
      pattern: 'none',
      border_radius: 8,
      font_family: 'sans'
    }
  },
  'lavender-oled': {
    name: 'Lavender OLED',
    icon: Sparkles,
    theme: {
      primary_color: '#4c1d95',
      secondary_color: '#2e1065',
      accent_color: '#0a0008',
      text_color: '#8b5cf6',
      card_bg_color: '#000000',
      sidebar_bg_color: '#000000',
      header_bg_color: '#000000',
      body_bg_color: '#000000',
      glass_effect: true,
      blur_amount: 20,
      opacity: 20,
      chat_opacity: 30,
      profile_card_opacity: 40,
      pattern: 'none',
      border_radius: 16,
      font_family: 'display'
    }
  },
  'matrix': {
    name: 'Matrix',
    icon: Monitor,
    theme: {
      primary_color: '#00ff41',
      secondary_color: '#008f11',
      accent_color: '#003b00',
      text_color: '#00ff41',
      card_bg_color: '#000000',
      sidebar_bg_color: '#000000',
      header_bg_color: '#000000',
      body_bg_color: '#000000',
      glass_effect: false,
      pattern: 'none',
      border_radius: 0,
      font_family: 'mono'
    }
  },
  'sunset': {
    name: 'Sunset',
    icon: Sun,
    theme: {
      primary_color: '#f97316',
      secondary_color: '#db2777',
      accent_color: '#fff1f2',
      text_color: '#881337',
      card_bg_color: '#ffffff',
      sidebar_bg_color: '#fff7ed',
      header_bg_color: '#ffffff',
      body_bg_color: '#fff1f2',
      glass_effect: true,
      blur_amount: 10,
      opacity: 15,
      chat_opacity: 25,
      profile_card_opacity: 30,
      pattern: 'none',
      border_radius: 24,
      font_family: 'display'
    }
  },
  'nord': {
    name: 'Nord',
    icon: Moon,
    theme: {
      primary_color: '#88c0d0',
      secondary_color: '#4c566a',
      accent_color: '#eceff4',
      text_color: '#2e3440',
      card_bg_color: '#ffffff',
      sidebar_bg_color: '#f8fafc',
      header_bg_color: '#ffffff',
      body_bg_color: '#e5e9f0',
      glass_effect: true,
      blur_amount: 10,
      opacity: 10,
      chat_opacity: 20,
      profile_card_opacity: 15,
      pattern: 'none',
      border_radius: 12,
      font_family: 'sans'
    }
  },
  'coffee': {
    name: 'Coffee',
    icon: Moon,
    theme: {
      primary_color: '#78350f',
      secondary_color: '#d97706',
      accent_color: '#fef3c7',
      text_color: '#451a03',
      card_bg_color: '#fffbeb',
      sidebar_bg_color: '#faf7ed',
      header_bg_color: '#fffbeb',
      body_bg_color: '#f3f4f6',
      glass_effect: false,
      pattern: 'none',
      border_radius: 12,
      font_family: 'serif'
    }
  },
  'bubblegum': {
    name: 'Bubblegum',
    icon: Sparkles,
    theme: {
      primary_color: '#f472b6',
      secondary_color: '#f0abfc',
      accent_color: '#fdf4ff',
      text_color: '#701a75',
      card_bg_color: '#ffffff',
      sidebar_bg_color: '#fdf4ff',
      header_bg_color: '#ffffff',
      body_bg_color: '#fdf4ff',
      glass_effect: true,
      blur_amount: 15,
      opacity: 15,
      chat_opacity: 25,
      profile_card_opacity: 20,
      pattern: 'none',
      border_radius: 40,
      font_family: 'display'
    }
  },
  'emerald': {
    name: 'Emerald',
    icon: Leaf,
    theme: {
      primary_color: '#10b981',
      secondary_color: '#059669',
      accent_color: '#064e3b',
      text_color: '#ecfdf5',
      card_bg_color: '#064e3b',
      sidebar_bg_color: '#022c22',
      header_bg_color: '#022c22',
      body_bg_color: '#022c22',
      glass_effect: true,
      blur_amount: 10,
      opacity: 10,
      chat_opacity: 20,
      profile_card_opacity: 15,
      pattern: 'none',
      border_radius: 12,
      font_family: 'sans'
    }
  },
  'deepsea': {
    name: 'Deep Sea',
    icon: Moon,
    theme: {
      primary_color: '#0ea5e9',
      secondary_color: '#1e40af',
      accent_color: '#1e3a8a',
      text_color: '#eff6ff',
      card_bg_color: '#172554',
      sidebar_bg_color: '#082f49',
      header_bg_color: '#082f49',
      body_bg_color: '#082f49',
      glass_effect: true,
      blur_amount: 20,
      opacity: 20,
      chat_opacity: 30,
      profile_card_opacity: 25,
      pattern: 'none',
      border_radius: 16,
      font_family: 'sans'
    }
  },
  'vaporwave': {
    name: 'Vaporwave',
    icon: Zap,
    theme: {
      primary_color: '#ff71ce',
      secondary_color: '#01cdfe',
      accent_color: '#05ffa1',
      text_color: '#b967ff',
      card_bg_color: '#1b0335',
      sidebar_bg_color: '#0d0221',
      header_bg_color: '#0d0221',
      body_bg_color: '#0d0221',
      glass_effect: true,
      blur_amount: 10,
      opacity: 70,
      pattern: 'none',
      border_radius: 0,
      font_family: 'mono'
    }
  }
};

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  setProfile,
  settingsTab,
  setSettingsTab,
  isAdmin,
  displayNameInput,
  setDisplayNameInput,
  photoURLInput,
  setPhotoURLInput,
  bioInput,
  setBioInput,
  bannerURLInput,
  setBannerURLInput,
  handleUpdateProfile,
  handleUpdateNotifications,
  handleUpdateTheme,
  handleResetToGoogle,
  notificationSettings,
  setNotificationSettings,
  customSounds,
  newSoundName,
  setNewSoundName,
  newSoundUrl,
  setNewSoundUrl,
  handleAddCustomSound,
  handleDeleteCustomSound,
  playSound,
  customTheme,
  setCustomTheme,
  useCustomTheme,
  setUseCustomTheme,
  whitelist,
  whitelistInput,
  setWhitelistInput,
  handleAddWhitelist,
  handleRemoveWhitelist,
  websiteStatus,
  statusInput,
  setStatusInput,
  handleUpdateStatus,
  fetchAdminData,
  users,
  handleBlockUser,
  handleLockUserField,
  handleWarnUser,
  handleTempBanUser,
  saving,
  uploadingSound,
  showInstallButton,
  handleInstallClick,
  scheduledMaintenance,
  maintenanceTimeLeft,
  handleScheduleMaintenance,
  handleCancelMaintenance,
  language,
  onChangeLanguage,
  reports = [],
  onUpdateReportStatus,
  onDeleteReport,
  onClearAllNotifications,
  notificationsCount = 0,
  conversations = [],
  profiles = [],
  hiddenConversationIds = [],
  onToggleHideConversation,
  onUnhideAllConversations,
  handleLogout,
}) => {
  const [clearingNotifications, setClearingNotifications] = React.useState(false);
  const [adminSubTab, setAdminSubTab] = React.useState<'overview' | 'users' | 'reports' | 'security'>('overview');
  const [adminUserSearch, setAdminUserSearch] = React.useState('');
  const [adminWhitelistSearch, setAdminWhitelistSearch] = React.useState('');
  const [reportFilter, setReportFilter] = React.useState<'all' | 'open' | 'reviewed' | 'resolved'>('all');
  const [showInstallGuide, setShowInstallGuide] = React.useState(false);
  const [installGuideOS, setInstallGuideOS] = React.useState<'chromebook' | 'ios' | 'android'>('chromebook');
  const [migratingBase64, setMigratingBase64] = React.useState(false);
  const iconAnimationMode = useIconAnimationMode();
  const [modernCustom, setModernCustom] = useLocalModernUI();
  const [showModernCustomizer, setShowModernCustomizer] = useState(false);

  const handleApplyThemePreset = (presetKey: string, preset: { name: string, theme: CustomTheme, icon: any }) => {
    // Merge theme preset while preserving active user customization & modern UI settings
    const updatedTheme: CustomTheme = {
      ...customTheme,
      ...preset.theme,
      pattern: preset.theme.pattern || 'none',
      // Maintain modern UI flag and custom modern UI settings
      modern_ui: customTheme.modern_ui ?? true,
      modern_ui_custom: customTheme.modern_ui_custom,
      profile_list_position: customTheme.profile_list_position || preset.theme.profile_list_position || 'right',
      custom_fonts: customTheme.custom_fonts || [],
      font_family: customTheme.font_family || preset.theme.font_family,
      icon_animation_mode: customTheme.icon_animation_mode || 'all',
      wallpaper: preset.theme.wallpaper || customTheme.wallpaper,
    };

    setCustomTheme(updatedTheme);
    if (!useCustomTheme) {
      setUseCustomTheme(true);
    }

    // Automatically synchronize Modern UI styling from the normal preset:
    const primary = preset.theme.primary_color || '#06b6d4';
    const radiusSetting: ModernUICustomization['card_radius'] = 
      (preset.theme.border_radius ?? 12) <= 6 ? 'crisp' :
      (preset.theme.border_radius ?? 12) <= 16 ? 'modern' :
      (preset.theme.border_radius ?? 12) <= 24 ? 'squircle' : 'pill';

    const glassSetting: ModernUICustomization['glass_intensity'] =
      preset.theme.glass_effect === false ? 'none' :
      presetKey === 'cyberpunk' || presetKey === 'matrix' || presetKey === 'vaporwave' ? 'cyber' :
      (preset.theme.blur_amount ?? 10) >= 14 ? 'deep' : 'frosted';

    setModernCustom({
      ...modernCustom,
      accent_style: 'theme',
      custom_accent_color: primary,
      glass_intensity: glassSetting,
      card_radius: radiusSetting,
      ambient_aura: true,
      ambient_aura_color: `${primary}33`,
      glow_active_items: true,
    });

    if (user) {
      try {
        supabase.from('profiles').update({
          custom_theme: updatedTheme,
          use_custom_theme: true
        }).eq('id', user.uid);
      } catch (e) {
        console.warn('Auto-save preset failed:', e);
      }
    }

    toast.success(`Preset '${preset.name}' geactiveerd voor thema & Modern UI!`);
  };

  const handleSetIconAnimationMode = (mode: IconAnimationMode) => {
    setIconAnimationMode(mode);
    setCustomTheme({ ...customTheme, icon_animation_mode: mode });
    toast.success(
      mode === 'all' 
        ? t("Micro-animaties volledig ingeschakeld") 
        : mode === 'hover_only'
          ? t("Micro-animaties alleen actief bij muis-hover")
          : t("Micro-animaties uitgeschakeld"),
      {
        description: t("Je voorkeur is lokaal opgeslagen en direct toegepast op alle knoppen en menu's.")
      }
    );
  };

  const handleManualBase64Migration = async () => {
    if (migratingBase64) return;
    setMigratingBase64(true);
    try {
      try {
        sessionStorage.removeItem(`ftjm_b64_migrated_${user.uid}_v2`);
        sessionStorage.removeItem(`ftjm_b64_migrated_${user.uid}_v2_admin`);
      } catch {}
      toast.info(t(isAdmin ? "Beheerder media-optimalisatie gestart (alle gebruikers & feed)..." : "Media-optimalisatie gestart..."), {
        description: t("Oude Base64 afbeeldingen en media worden omgezet naar snelle CDN URLs.")
      });
      const count = await runAutoBase64Migration(supabase, user, profile, {
        setProfile
      }, isAdmin);
      if (count > 0) {
        toast.success(t(`${count} media-item(s) succesvol omgezet naar CDN!`), {
          description: t(isAdmin ? "Alle feed-, profiel- en forumposts zijn succesvol geoptimaliseerd naar snelle CDN links." : "Je profiel en mediagegevens laden nu veel sneller zonder Base64 data.")
        });
      } else {
        toast.success(t("Alle media is al up-to-date en geoptimaliseerd!"), {
          description: t("Er zijn geen resterende Base64 data URLs gevonden.")
        });
      }
    } catch (err) {
      console.error("Manual migration error:", err);
      toast.error(t("Fout bij optimaliseren van media"));
    } finally {
      setMigratingBase64(false);
    }
  };

  // Custom Font Management States
  const [isFontModalOpen, setIsFontModalOpen] = React.useState(false);
  const [localCustomFonts, setLocalCustomFonts] = React.useState<any[]>(() => getLocalCustomFonts());
  const [quickGoogleFontInput, setQuickGoogleFontInput] = React.useState('');
  const [showQuickGoogleInput, setShowQuickGoogleInput] = React.useState(false);
  const quickFontFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleQuickFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newFont = await processUploadedFontFile(file);
      const updated = getLocalCustomFonts();
      setLocalCustomFonts(updated);
      setCustomTheme({
        ...customTheme,
        font_family: newFont.id,
        custom_fonts: updated
      });
      toast.success(`Lettertype "${newFont.name}" succesvol lokaal geïmporteerd en ingesteld!`);
      if (quickFontFileInputRef.current) quickFontFileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.message || 'Fout bij het uploaden van het fontbestand.');
    }
  };

  const handleQuickGoogleFontSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGoogleFontInput.trim()) return;
    try {
      const newFont = createGoogleFontItem(quickGoogleFontInput.trim());
      const updated = getLocalCustomFonts();
      setLocalCustomFonts(updated);
      setCustomTheme({
        ...customTheme,
        font_family: newFont.id,
        custom_fonts: updated
      });
      toast.success(`Google Font "${newFont.name}" succesvol toegevoegd en ingesteld!`);
      setQuickGoogleFontInput('');
      setShowQuickGoogleInput(false);
    } catch (err: any) {
      toast.error('Kon Google Font niet toevoegen. Controleer de naam.');
    }
  };



  // Warning Modal State
  const [showWarnModal, setShowWarnModal] = React.useState(false);
  const [warnUserId, setWarnUserId] = React.useState('');
  const [warnDisplayName, setWarnDisplayName] = React.useState('');
  const [warnReason, setWarnReason] = React.useState('');
  const [warnDetails, setWarnDetails] = React.useState('');
  const [warningSending, setWarningSending] = React.useState(false);

  // Temp Ban Modal State
  const [showBanModal, setShowBanModal] = React.useState(false);
  const [banUserId, setBanUserId] = React.useState('');
  const [banDisplayName, setBanDisplayName] = React.useState('');
  const [banDuration, setBanDuration] = React.useState('60'); // default 1 hour in minutes
  const [banReasonText, setBanReasonText] = React.useState('');
  const [banSending, setBanSending] = React.useState(false);

  const submitWarning = async () => {
    if (!warnUserId || !warnReason.trim() || !warnDetails.trim()) {
      toast.error('Vul alle velden in.');
      return;
    }
    setWarningSending(true);
    try {
      await handleWarnUser(warnUserId, warnReason, warnDetails);
      setShowWarnModal(false);
      setWarnUserId('');
      setWarnReason('');
      setWarnDetails('');
    } catch (e) {
      console.error(e);
    } finally {
      setWarningSending(false);
    }
  };

  const submitTempBan = async () => {
    if (!banUserId || !banReasonText.trim()) {
      toast.error('Vul een reden in.');
      return;
    }
    setBanSending(true);
    try {
      await handleTempBanUser(banUserId, parseInt(banDuration), banReasonText);
      setShowBanModal(false);
      setBanUserId('');
      setBanReasonText('');
    } catch (e) {
      console.error(e);
    } finally {
      setBanSending(false);
    }
  };

  const isNameLocked = !!(profile?.name_locked_until && new Date(profile.name_locked_until) > new Date());
  const isBioLocked = !!(profile?.bio_locked_until && new Date(profile.bio_locked_until) > new Date());

  const [passkeys, setPasskeys] = React.useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('ftjm_device_passkeys');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = React.useState(false);
  const [registeringPasskey, setRegisteringPasskey] = React.useState(false);

  const [archiveStats, setArchiveStats] = React.useState({ dmsCount: 0, postsCount: 0, bookmarksCount: 0 });
  const [loadingArchiveStats, setLoadingArchiveStats] = React.useState(false);

  const refreshArchiveStats = React.useCallback(async () => {
    setLoadingArchiveStats(true);
    try {
      const stats = await getLocalArchiveStats();
      setArchiveStats(stats);
    } catch (e) {
      console.warn('Error loading archive stats:', e);
    } finally {
      setLoadingArchiveStats(false);
    }
  }, []);

  React.useEffect(() => {
    if (settingsTab === 'app') {
      refreshArchiveStats();
    }
  }, [settingsTab, refreshArchiveStats]);

  const handleAddPasskey = async () => {
    if (!passwordConfirm.trim()) {
      toast.error("Voer je wachtwoord in ter verduidelijking.");
      return;
    }

    setRegisteringPasskey(true);
    try {
      // 1. Double check password using Supabase silent login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordConfirm,
      });

      if (error) {
        toast.error("Wachtwoord verificatie mislukt: " + (error.message || "Onjuist wachtwoord"));
        setRegisteringPasskey(false);
        return;
      }

      // 2. Browser WebAuthn registration
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn wordt niet ondersteund in deze browser.");
      }

      const rpId = window.location.hostname;
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = crypto.getRandomValues(new Uint8Array(16));

      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "FTJM Enterprise",
            id: rpId === "localhost" || rpId.includes("127.0.0.1") ? undefined : rpId,
          },
          user: {
            id: userIdBytes,
            name: user.email!,
            displayName: profile?.display_name || user.email!,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          timeout: 60000,
          attestation: "none",
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required",
            requireResidentKey: true
          }
        }
      };

      const credential = await navigator.credentials.create(creationOptions) as any;
      if (!credential) {
        throw new Error("WebAuthn registratie is geannuleerd.");
      }

      // 3. Encrypt password and store
      const credentialId = credential.id;
      const secretKey = credentialId + "_secure_passkey";
      const encryptedPayload = CryptoJS.AES.encrypt(
        JSON.stringify({ email: user.email, password: passwordConfirm }),
        secretKey
      ).toString();

      const newPasskey = {
        credentialId: credentialId,
        email: user.email!,
        userName: profile?.display_name || user.email!,
        payload: encryptedPayload,
        createdAt: new Date().toISOString()
      };

      // Get current lists, find and filter out any existing passkey for this email, and append the new one
      const rawKeys = localStorage.getItem('ftjm_device_passkeys');
      const existingList = rawKeys ? JSON.parse(rawKeys) : [];
      const filteredList = existingList.filter((pk: any) => pk.email.toLowerCase() !== user.email!.toLowerCase());
      const updatedList = [...filteredList, newPasskey];

      localStorage.setItem('ftjm_device_passkeys', JSON.stringify(updatedList));
      setPasskeys(updatedList);
      
      toast.success("Passkey succesvol geregistreerd op dit apparaat!");
      setPasswordConfirm('');
      setShowPasswordPrompt(false);
    } catch (err: any) {
      console.error("Passkey error:", err);
      toast.error(err.message || "Er is een fout opgetreden bij het registreren van de passkey.");
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRemovePasskeyForEmail = (emailToRemove: string) => {
    const rawKeys = localStorage.getItem('ftjm_device_passkeys');
    const existingList = rawKeys ? JSON.parse(rawKeys) : [];
    const updatedList = existingList.filter((pk: any) => pk.email.toLowerCase() !== emailToRemove.toLowerCase());
    localStorage.setItem('ftjm_device_passkeys', JSON.stringify(updatedList));
    setPasskeys(updatedList);
    toast.success("Passkey is verwijderd van dit apparaat.");
  };

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = React.useState('');
  const [newPasswordInput, setNewPasswordInput] = React.useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = React.useState(false);
  const [changingPassword, setChangingPassword] = React.useState(false);

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentTrimmed = currentPasswordInput.trim();
    const newTrimmed = newPasswordInput.trim();
    const confirmTrimmed = confirmNewPasswordInput.trim();

    if (!currentTrimmed) {
      toast.error("Voer eerst je huidige wachtwoord in.");
      return;
    }
    if (!newTrimmed) {
      toast.error("Voer een nieuw wachtwoord in.");
      return;
    }
    if (newTrimmed.length < 6) {
      toast.error("Het nieuwe wachtwoord moet minimaal 6 tekens lang zijn.");
      return;
    }
    if (newTrimmed !== confirmTrimmed) {
      toast.error("De nieuwe wachtwoorden komen niet overeen.");
      return;
    }
    if (currentTrimmed === newTrimmed) {
      toast.error("Het nieuwe wachtwoord moet anders zijn dan je huidige wachtwoord.");
      return;
    }

    setChangingPassword(true);
    try {
      // 1. Controleer eerst of het huidige wachtwoord correct is
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentTrimmed,
      });

      if (authError) {
        toast.error("Huidig wachtwoord is onjuist: " + (authError.message || "Verificatie mislukt"));
        setChangingPassword(false);
        return;
      }

      // 2. Controleer of er een Passkey actief is voor deze gebruiker op dit apparaat
      const rawKeys = localStorage.getItem('ftjm_device_passkeys');
      const passkeyList = rawKeys ? JSON.parse(rawKeys) : [];
      const userPasskey = passkeyList.find((pk: any) => pk.email?.toLowerCase() === user.email?.toLowerCase());

      if (userPasskey) {
        toast.info("Huidig wachtwoord geverifieerd. Bevestig nu met je Passkey...");
        if (!window.PublicKeyCredential) {
          throw new Error("WebAuthn (Passkeys) wordt niet ondersteund in deze browser om de biometrische controle te voltooien.");
        }

        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            timeout: 60000,
            userVerification: "required"
          }
        }) as PublicKeyCredential | null;

        if (!assertion) {
          throw new Error("Passkey verificatie geannuleerd.");
        }

        const matchingRecord = passkeyList.find(
          (pk: any) => pk.credentialId === assertion.id && pk.email?.toLowerCase() === user.email?.toLowerCase()
        );

        if (!matchingRecord) {
          throw new Error("Deze passkey hoort niet bij dit account.");
        }
      }

      // 3. Update het wachtwoord in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newTrimmed,
      });

      if (updateError) {
        throw new Error(updateError.message || "Fout bij het updaten van het wachtwoord.");
      }

      // 4. Als er een passkey gekoppeld is, update de versleutelde credentials in localStorage zodat inloggen met passkey blijft werken
      if (userPasskey) {
        const secretKey = userPasskey.credentialId + "_secure_passkey";
        const newEncryptedPayload = CryptoJS.AES.encrypt(
          JSON.stringify({ email: user.email, password: newTrimmed }),
          secretKey
        ).toString();

        const updatedList = passkeyList.map((pk: any) => {
          if (pk.credentialId === userPasskey.credentialId) {
            return { ...pk, payload: newEncryptedPayload, updatedAt: new Date().toISOString() };
          }
          return pk;
        });
        localStorage.setItem('ftjm_device_passkeys', JSON.stringify(updatedList));
        setPasskeys(updatedList);
      }

      toast.success("Wachtwoord succesvol gewijzigd!");
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
    } catch (err: any) {
      console.error("Change password error:", err);
      toast.error(err.message || "Er is een fout opgetreden bij het wijzigen van je wachtwoord.");
    } finally {
      setChangingPassword(false);
    }
  };

  const [testingWebhook, setTestingWebhook] = React.useState(false);

  const filteredReports = reports.filter(report => {
    if (reportFilter === 'all') return true;
    if (reportFilter === 'open') {
      return report.status === 'open' || report.status === 'pending';
    }
    return report.status === reportFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Settings Sidebar */}
      <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-app-border shrink-0 scrollbar-none">
        {[
          { id: 'profile', icon: UserCog, label: 'Profiel' },
          { id: 'notifications', icon: Bell, label: 'Notificaties' },
          { id: 'theme', icon: Palette, label: 'Custom Thema' },
          { id: 'app', icon: Layout, label: 'App Instellingen' },
          { id: 'audiologs', icon: Activity, label: 'Audio Logs' },
          { id: 'security', icon: Fingerprint, label: 'Beveiliging' },
          ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin opties' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id as any)}
            className={`flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4 rounded-xl lg:rounded-2xl font-bold whitespace-nowrap transition-all shrink-0 ${
              settingsTab === tab.id 
                ? 'bg-app-ink text-app-bg shadow-md lg:shadow-lg shadow-app-ink/10' 
                : 'text-app-muted bg-app-card/65 lg:bg-transparent border border-app-border lg:border-0 hover:bg-app-accent hover:text-app-ink'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {t(tab.label)}
          </button>
        ))}

        {handleLogout && (
          <button
            id="settings-logout-btn"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4 rounded-xl lg:rounded-2xl font-bold whitespace-nowrap transition-all shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-600 border border-red-500/20 lg:mt-4 active:scale-95"
            title={t("Uitloggen")}
          >
            <LogOut className="w-5 h-5" />
            <span>{t("Uitloggen")}</span>
          </button>
        )}
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {settingsTab === 'profile' && (
            <motion.div
              key="profile-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                  <UserCog className="w-8 h-8 text-app-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Profiel Instellingen</h3>
                  <p className="text-app-muted text-sm font-medium">Beheer hoe anderen je zien op het forum.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                  <div className="relative group">
                    {(photoURLInput?.trim() || profile?.photo_url?.trim() || user.photoURL?.trim()) ? (
                      <img 
                        src={photoURLInput || profile?.photo_url || user.photoURL || undefined} 
                        alt="" 
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-app-bg shadow-xl group-hover:opacity-75 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-3xl bg-app-accent flex items-center justify-center border-4 border-app-bg shadow-xl">
                        <UserIcon className="w-10 h-10 text-app-muted" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide ml-1">Profielfoto URL</label>
                        <div className="flex flex-wrap items-center gap-1.5 ml-1 sm:ml-0 text-[10px]">
                          <span className="text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                            <Link className="w-2.5 h-2.5" /> Of via:
                          </span>
                          <a 
                            href="https://imgbb.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30 animate-pulse"
                          >
                            imgbb.com
                          </a>
                          <a 
                            href="https://postimages.org/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                          >
                            postimages.org
                          </a>
                          <a 
                            href="https://imgur.com/upload" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                          >
                            imgur.com
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text"
                            value={photoURLInput}
                            onChange={(e) => setPhotoURLInput(e.target.value)}
                            placeholder="https://example.com/photo.jpg of geüploade foto..."
                            className="w-full pl-4 pr-10 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink"
                          />
                          {photoURLInput && (
                            <button
                              type="button"
                              onClick={() => setPhotoURLInput('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs sm:text-sm shrink-0 select-none">
                          <Upload className="w-4 h-4" />
                          <span>Direct Bestand Uploaden</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              toast.promise(
                                compressImage(file, 200, 200, 0.70).then((dataUrl) => {
                                  setPhotoURLInput(dataUrl);
                                  return "Profielfoto succesvol geladen!";
                                }),
                                {
                                  loading: "Profielfoto verwerken & optimaliseren...",
                                  success: (msg) => msg,
                                  error: "Kon foto niet verwerken."
                                }
                              );
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={handleResetToGoogle}
                      className="text-xs font-bold text-app-ink hover:underline flex items-center gap-2"
                    >
                      <Sparkles className="w-3 h-3" />
                      Gebruik Google profielfoto
                    </button>
                  </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1 flex items-center gap-1.5">
                      Weergavenaam
                      {isNameLocked && (
                        <span className="text-[9px] text-red-500 font-extrabold normal-case bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <LockIcon className="w-2.5 h-2.5 inline" /> Vergrendeld door admin
                        </span>
                      )}
                    </label>
                    <input 
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Je naam"
                      disabled={isNameLocked}
                      className={`w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold ${
                        isNameLocked ? 'opacity-60 bg-app-accent/30 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">E-mailadres (Alleen lezen)</label>
                    <input 
                      type="text"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-app-accent/50 border border-app-border rounded-xl text-sm text-app-muted font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1 flex items-center gap-1.5">
                    Bio / Status
                    {isBioLocked && (
                      <span className="text-[9px] text-red-500 font-extrabold normal-case bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <LockIcon className="w-2.5 h-2.5 inline" /> Vergrendeld door admin
                      </span>
                    )}
                  </label>
                  <textarea 
                    value={bioInput}
                    onChange={(e) => setBioInput(convertEmoticons(e.target.value))}
                    placeholder="Vertel iets over jezelf..."
                    disabled={isBioLocked}
                    className={`w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink min-h-[120px] resize-none ${
                      isBioLocked ? 'opacity-60 bg-app-accent/30 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide ml-1">Profiel Banner URL</label>
                    <div className="flex flex-wrap items-center gap-1.5 ml-1 sm:ml-0 text-[10px]">
                      <span className="text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                        <Link className="w-2.5 h-2.5" /> Of via:
                      </span>
                      <a 
                        href="https://imgbb.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30 animate-pulse"
                      >
                        imgbb.com
                      </a>
                      <a 
                        href="https://postimages.org/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                      >
                        postimages.org
                      </a>
                      <a 
                        href="https://imgur.com/upload" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                      >
                        imgur.com
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={bannerURLInput}
                        onChange={(e) => setBannerURLInput(e.target.value)}
                        placeholder="https://example.com/banner.jpg of geüploade banner..."
                        className="w-full pl-4 pr-10 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink"
                      />
                      {bannerURLInput && (
                        <button
                          type="button"
                          onClick={() => setBannerURLInput('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs sm:text-sm shrink-0 select-none">
                      <Upload className="w-4 h-4" />
                      <span>Direct Bestand Uploaden</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          toast.promise(
                            compressImage(file, 640, 240, 0.60).then((dataUrl) => {
                              setBannerURLInput(dataUrl);
                              return "Profielbanner succesvol geladen!";
                            }),
                            {
                              loading: "Profielbanner verwerken & optimaliseren...",
                              success: (msg) => msg,
                              error: "Kon banner niet verwerken."
                            }
                          );
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* Banner Preview */}
                  <div className="border border-app-border rounded-2xl overflow-hidden bg-app-bg p-2 space-y-2">
                    <span className="block text-[9px] font-bold text-app-muted uppercase tracking-wider px-1">Voorvertoning van je banner</span>
                    <div className="relative h-24 rounded-xl overflow-hidden bg-app-ink flex items-end">
                      {bannerURLInput?.trim() ? (
                        <img 
                          src={bannerURLInput} 
                          alt="Banner Voorvertoning" 
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-app-ink to-[#004276] opacity-90" />
                      )}
                      
                      {/* Avatar preview overlap */}
                      <div className="relative ml-4 -mb-3 z-10 p-1 bg-app-card rounded-[1.2rem] shadow-md">
                        <div className="w-12 h-12 rounded-[1rem] bg-app-accent flex items-center justify-center overflow-hidden">
                          {(photoURLInput?.trim() || profile?.photo_url?.trim() || user.photoURL?.trim()) ? (
                            <img 
                              src={photoURLInput || profile?.photo_url || user.photoURL || undefined} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-app-muted" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="h-4" />
                  </div>
                </div>

                <div className="pt-6 border-t border-app-border flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
                  >
                    {saving ? <ThemedSpinner size="xs" color="currentColor" /> : <Save className="w-5 h-5" />}
                    Profiel Opslaan
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {settingsTab === 'notifications' && (
            <motion.div
              key="notification-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                  <Bell className="w-8 h-8 text-app-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Notificaties</h3>
                  <p className="text-app-muted text-sm font-medium">Bepaal hoe en wanneer je meldingen ontvangt.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'enable_sounds', label: 'Geluidssignalen' },
                    { id: 'notify_new_posts', label: 'Nieuwe posts in chat' },
                    { id: 'notify_new_messages', label: 'Nieuwe privéberichten' },
                    { id: 'notify_mentions', label: 'Mentions (@gebruiker)' }
                  ].map(toggle => {
                    const isActive = notificationSettings[toggle.id as keyof NotificationSettings];
                    return (
                      <div
                        key={toggle.id}
                        className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${
                          isActive 
                            ? 'bg-app-accent/30 border-app-ink shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)]' 
                            : 'bg-app-card border-app-border'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-app-ink uppercase tracking-tight">{toggle.label}</h4>
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-emerald-600' : 'text-app-muted'}`}>
                            {isActive ? 'Ingeschakeld' : 'Uitgeschakeld'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({
                            ...notificationSettings,
                            [toggle.id]: !isActive
                          })}
                          className={`w-16 h-8 rounded-full relative transition-all duration-300 shadow-inner ${
                            isActive ? 'bg-app-ink' : 'bg-app-muted/20'
                          }`}
                        >
                          <div className={`absolute top-1 w-6 h-6 rounded-full shadow-lg transition-all duration-500 ${
                            isActive ? 'right-1 bg-white scale-110' : 'left-1 bg-white/80 scale-90'
                          }`} />
                          <AnimatePresence>
                            {isActive && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute left-2 top-1/2 -translate-y-1/2"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6 pt-6 border-t border-app-border">
                  <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Geluid Voorkeuren
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Bericht Geluid</label>
                      <select 
                        value={notificationSettings.message_sound}
                        onChange={(e) => setNotificationSettings({...notificationSettings, message_sound: e.target.value})}
                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold"
                      >
                        {SOUND_OPTIONS.map(s => <option key={s.url} value={s.url}>{s.name}</option>)}
                        {customSounds.map(s => <option key={s.url} value={s.url}>Custom: {s.name}</option>)}
                      </select>
                      <button 
                        onClick={() => playSound(notificationSettings.message_sound, true)}
                        className="mt-2 text-[10px] font-bold text-app-ink uppercase tracking-wide flex items-center gap-1.5 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Test geluid
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Post Geluid</label>
                      <select 
                        value={notificationSettings.post_sound}
                        onChange={(e) => setNotificationSettings({...notificationSettings, post_sound: e.target.value})}
                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold"
                      >
                        {SOUND_OPTIONS.map(s => <option key={s.url} value={s.url}>{s.name}</option>)}
                        {customSounds.map(s => <option key={s.url} value={s.url}>Custom: {s.name}</option>)}
                      </select>
                      <button 
                        onClick={() => playSound(notificationSettings.post_sound, true)}
                        className="mt-2 text-[10px] font-bold text-app-ink uppercase tracking-wide flex items-center gap-1.5 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Test geluid
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Ringtone Geluid</label>
                      <select 
                        value={notificationSettings.ringtone_url || ''}
                        onChange={(e) => setNotificationSettings({...notificationSettings, ringtone_url: e.target.value})}
                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold"
                      >
                        {RINGTONE_OPTIONS.map(s => <option key={s.url} value={s.url}>{s.name}</option>)}
                        {customSounds.map(s => <option key={s.url} value={s.url}>Custom: {s.name}</option>)}
                        {notificationSettings.ringtone_url && 
                         !RINGTONE_OPTIONS.some(s => s.url === notificationSettings.ringtone_url) && 
                         !customSounds.some(s => s.url === notificationSettings.ringtone_url) && (
                          <option value={notificationSettings.ringtone_url}>Aangepast: {notificationSettings.ringtone_url}</option>
                        )}
                      </select>
                      <button 
                        onClick={() => {
                          if (notificationSettings.ringtone_url) {
                            playSound(notificationSettings.ringtone_url, true);
                          } else {
                            toast.error("Geen ringtone ingesteld");
                          }
                        }}
                        className="mt-2 text-[10px] font-bold text-app-ink uppercase tracking-wide flex items-center gap-1.5 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Test ringtone
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-app-border">
                  <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Eigen Geluiden Toevoegen
                  </h4>
                  
                  <div className="bg-app-accent/30 p-6 rounded-2xl border border-app-border space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-1.5 ml-1">Naam geluid</label>
                        <input 
                          type="text"
                          value={newSoundName}
                          onChange={(e) => setNewSoundName(e.target.value)}
                          placeholder="Bijv. Mijn Favoriete Chime"
                          className="w-full px-4 py-3 bg-app-card border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink transition-all text-app-ink font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-1.5 ml-1">Geluidsbestand URL / Upload</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                              <input 
                                type="text"
                                value={newSoundUrl}
                                onChange={(e) => setNewSoundUrl(e.target.value)}
                                placeholder="Directe URL of geüpload geluid..."
                                className="w-full pl-4 pr-10 py-3 bg-app-card border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink transition-all text-app-ink"
                              />
                              {newSoundUrl && (
                                <button
                                  type="button"
                                  onClick={() => setNewSoundUrl('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                if (newSoundUrl) {
                                  playSound(newSoundUrl, true);
                                } else {
                                  toast.error("Geen geluidsbron ingevoerd.");
                                }
                              }}
                              disabled={!newSoundUrl}
                              className="p-3 bg-app-ink text-app-bg rounded-xl hover:opacity-90 disabled:opacity-30 transition-all shadow-sm"
                              title="Test geluid"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <label className="flex items-center justify-center gap-1.5 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs sm:text-sm shrink-0 select-none">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Kies Bestand</span>
                            <input 
                              type="file" 
                              accept="audio/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 4 * 1024 * 1024) {
                                  toast.error("Geluidsbestand is te groot (maximaal 4MB).");
                                  return;
                                }
                                
                                const reader = new FileReader();
                                toast.promise(
                                  new Promise<string>((resolve, reject) => {
                                    reader.readAsDataURL(file);
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = (err) => reject(err);
                                  }).then((dataUrl) => {
                                    setNewSoundUrl(dataUrl);
                                    if (!newSoundName) {
                                      const cleanName = file.name.replace(/\.[^/.]+$/, "");
                                      setNewSoundName(cleanName);
                                    }
                                    return "Geluidsbestand succesvol geladen!";
                                  }),
                                  {
                                    loading: "Audiobestand inladen...",
                                    success: (msg) => msg,
                                    error: "Geluidsbestand kon niet worden geladen."
                                  }
                                );
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddCustomSound}
                      disabled={uploadingSound || !newSoundName || !newSoundUrl}
                      className="w-full py-3 bg-app-ink text-app-bg rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {uploadingSound ? <ThemedSpinner size="xs" color="currentColor" /> : <Plus className="w-4 h-4" />}
                      Geluid Toevoegen
                    </motion.button>
                  </div>

                  {customSounds.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Jouw Geluiden</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customSounds.map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-app-card border border-app-border rounded-xl">
                            <span className="text-xs font-bold text-app-ink truncate mr-2">{s.name}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => playSound(s.url, true)} className="p-1.5 hover:bg-app-accent rounded-lg text-app-muted hover:text-app-ink transition-all">
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteCustomSound(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-app-muted hover:text-red-500 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                <div className="space-y-4 pt-6 border-t border-app-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Meldingen Geschiedenis & Opslag
                      </h4>
                      <p className="text-xs text-app-muted font-medium">
                        Wis al je ontvangen meldingen en notificaties definitief uit de Supabase database.
                      </p>
                      {notificationsCount > 0 && (
                        <p className="text-[11px] font-bold text-app-ink">
                          Huidig aantal meldingen: <span className="text-cyan-600">{notificationsCount}</span>
                        </p>
                      )}
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      disabled={clearingNotifications || !onClearAllNotifications}
                      onClick={async () => {
                        if (!onClearAllNotifications) return;
                        setClearingNotifications(true);
                        try {
                          await onClearAllNotifications();
                        } finally {
                          setClearingNotifications(false);
                        }
                      }}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      {clearingNotifications ? <ThemedSpinner size="xs" color="#ffffff" /> : <Trash2 className="w-4 h-4" />}
                      <span>Alle Meldingen Wissen</span>
                    </motion.button>
                  </div>
                </div>

                <div className="pt-6 border-t border-app-border flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleUpdateNotifications}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
                  >
                    {saving ? <ThemedSpinner size="xs" color="currentColor" /> : <Save className="w-5 h-5" />}
                    Instellingen Opslaan
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
          {settingsTab === 'theme' && (
            <motion.div
              key="theme-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                  <Palette className="w-8 h-8 text-app-ink" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight leading-none mb-1">Visual Experience</h3>
                  <p className="text-app-muted text-sm font-medium">Design your own digital workspace.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wide">Custom Colors Theme</span>
                  <button
                    onClick={() => setUseCustomTheme(!useCustomTheme)}
                    className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner p-1 ${
                      useCustomTheme ? 'bg-app-ink' : 'bg-app-muted/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${
                      useCustomTheme ? 'translate-x-7 bg-white' : 'translate-x-0 bg-white/60'
                    }`}>
                      {useCustomTheme && <Check className="w-3 h-3 text-app-ink" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Modern UI Layout & Concept Section - ALWAYS VISIBLE */}
              <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-app-accent flex items-center justify-center">
                      <Layout className="w-5 h-5 text-app-ink" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide">Modern UI Concept</h4>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/25">
                          v2.5.5
                        </span>
                      </div>
                      <p className="text-xs text-app-muted">Transformeer de layout naar een futuristisch 'Glass & Float' design met een supersmalle navigatiebar en flexibele profielenlijst.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !customTheme.modern_ui;
                      const updatedTheme = { ...customTheme, modern_ui: next };
                      setCustomTheme(updatedTheme);
                      if (next && !useCustomTheme) {
                        setUseCustomTheme(true);
                      }
                      if (user) {
                        try {
                          await supabase.from('profiles').update({
                            custom_theme: updatedTheme,
                            use_custom_theme: next ? true : useCustomTheme
                          }).eq('id', user.uid);
                        } catch (e) {
                          console.warn('Auto-saving modern_ui state failed:', e);
                        }
                      }
                      toast.success(next ? 'Modern UI ingeschakeld!' : 'Modern UI uitgeschakeld');
                    }}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner p-1 ${
                      customTheme.modern_ui ? 'bg-app-ink' : 'bg-app-muted/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      customTheme.modern_ui ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {customTheme.modern_ui && <Check className="w-2.5 h-2.5 text-app-ink" />}
                    </div>
                  </button>
                </div>

                {customTheme.modern_ui && (
                  <div className="pt-4 border-t border-app-border space-y-4">
                    {/* Direct Local Customizer CTA */}
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-cyan-500" />
                          <h5 className="text-xs font-bold text-app-ink uppercase tracking-wider">Lokale Modern UI Customizer</h5>
                        </div>
                        <p className="text-[11px] text-app-muted mt-0.5">
                          Personaliseer accentkleuren, glasmorfisme-sterkte, zwevende dock & borders lokaal op dit apparaat.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowModernCustomizer(true)}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Aanpassen Openen</span>
                      </button>
                    </div>

                    {/* Unified Preset Info */}
                    <div className="p-3.5 rounded-2xl bg-app-accent/40 border border-app-border flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-app-muted leading-relaxed">
                        <strong className="text-app-ink font-bold">Geünificeerd Thema Systeem:</strong> Alle standaard thema presets (zoals Cyberpunk, Midnight, OLED, etc.) in het gedeelte "Thema Presets" hieronder passen automatisch ook direct de Modern UI stijl, kleuren, afronding en glaseffecten aan.
                      </p>
                    </div>

                    {/* Sidebar / Dock Position */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-wider">
                        Navigatiebalk & Dock Positie (Lokaal)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'left', label: 'Links (Standaard)' },
                          { id: 'right', label: 'Rechts' },
                          { id: 'bottom_dock', label: 'Zwevend Dock' },
                          { id: 'compact', label: 'Compact' },
                        ].map((pos) => {
                          const isSelected = (modernCustom?.sidebar_position || 'left') === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setModernCustom({ ...modernCustom, sidebar_position: pos.id as any })}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                isSelected
                                  ? 'bg-app-ink text-app-bg border-app-ink shadow-sm'
                                  : 'bg-app-card text-app-ink border-app-border hover:bg-app-accent/60'
                              }`}
                            >
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Profile List Position */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-wider">
                        Modern UI Profielenlijst Positie
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setCustomTheme({...customTheme, profile_list_position: 'left'})}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            (customTheme.profile_list_position === 'left')
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.02]'
                              : 'bg-app-card text-app-ink border-app-border hover:bg-app-accent/60'
                          }`}
                        >
                          <PanelLeft className="w-5 h-5" />
                          <span className="text-xs font-bold">Links</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomTheme({...customTheme, profile_list_position: 'sidebar'})}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            customTheme.profile_list_position === 'sidebar'
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.02]'
                              : 'bg-app-card text-app-ink border-app-border hover:bg-app-accent/60'
                          }`}
                        >
                          <LayoutList className="w-5 h-5" />
                          <span className="text-xs font-bold">In Sidebar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomTheme({...customTheme, profile_list_position: 'right'})}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            (!customTheme.profile_list_position || customTheme.profile_list_position === 'right')
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.02]'
                              : 'bg-app-card text-app-ink border-app-border hover:bg-app-accent/60'
                          }`}
                        >
                          <PanelRight className="w-5 h-5" />
                          <span className="text-xs font-bold">Rechts</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-app-muted">
                        Kies of de lijst met online leden links, rechts op het scherm of direct geïntegreerd in de linkersidebar staat.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-app-border pt-6">
                <h4 className="text-xs font-bold text-app-muted uppercase tracking-wide mb-2">Aangepaste Kleuren & Stijlen</h4>
              </div>

              {!useCustomTheme ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-app-accent/50 rounded-full flex items-center justify-center mx-auto">
                    <Monitor className="w-10 h-10 text-app-muted" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-app-ink uppercase tracking-tight">Standaard Kleurenpalet Actief</h4>
                    <p className="text-sm text-app-muted max-w-xs mx-auto">Activeer 'Custom Colors Theme' bovenaan om je eigen kleuren en achtergronden in te stellen.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                    {/* Theme Presets */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Quick Presets (Modern UI Compatibel)
                        </h4>
                        <span className="text-[11px] font-bold text-app-muted">Behoudt Modern UI & persoonlijke instellingen</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {Object.entries(THEME_PRESETS).map(([id, preset]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleApplyThemePreset(id, preset)}
                            className="group relative overflow-hidden p-6 rounded-2xl border border-app-border bg-app-bg hover:border-app-ink transition-all text-left"
                          >
                            <div className="relative z-10 flex flex-col gap-3">
                              <div className="w-10 h-10 rounded-xl bg-app-ink text-app-bg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <preset.icon className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-app-ink uppercase tracking-tight italic font-serif leading-tight">{preset.name}</span>
                            </div>
                            <div 
                              className="absolute right-0 bottom-0 w-24 h-24 opacity-10 blur-xl group-hover:opacity-30 transition-opacity"
                              style={{ backgroundColor: preset.theme.primary_color }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    {/* Controls */}
                    <div className="xl:col-span-3 space-y-8">
                      {/* Font & Style */}
                      <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                            <Type className="w-4 h-4 text-cyan-500" /> Typography & Shapes
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsFontModalOpen(true)}
                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all border border-cyan-500/20 cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Font Bibliotheek ({PRESET_FONTS.length + localCustomFonts.length})
                          </button>
                        </div>

                        {/* Hidden Quick Font Upload Input */}
                        <input
                          type="file"
                          ref={quickFontFileInputRef}
                          onChange={handleQuickFontUpload}
                          accept=".ttf,.otf,.woff,.woff2"
                          className="hidden"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide ml-1">
                                Actief Lettertype
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => quickFontFileInputRef.current?.click()}
                                  className="text-[9px] font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Upload lokaal .ttf/.otf/.woff2 bestand"
                                >
                                  <Upload className="w-3 h-3" /> Upload Font
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowQuickGoogleInput(!showQuickGoogleInput)}
                                  className="text-[9px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Importeer Google Font"
                                >
                                  <Globe className="w-3 h-3" /> Google Font
                                </button>
                              </div>
                            </div>

                            <select 
                              value={customTheme.font_family || 'sans'}
                              onChange={(e) => setCustomTheme({...customTheme, font_family: e.target.value})}
                              className="w-full px-3 py-2.5 bg-app-card border border-app-border rounded-xl text-xs font-bold text-app-ink focus:outline-none focus:border-cyan-500"
                            >
                              {localCustomFonts.length > 0 && (
                                <optgroup label="📂 Mijn Geïmporteerde Fonts">
                                  {localCustomFonts.map(f => (
                                    <option key={f.id} value={f.id}>
                                      ★ {f.name} ({f.source === 'upload' ? 'Lokaal' : 'Google'})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="✨ Modern Sans-Serif">
                                <option value="sans">Standaard Normaal (Inter / Systeem)</option>
                                <option value="plus_jakarta">Plus Jakarta Sans (Ultra Sharp)</option>
                                <option value="poppins">Poppins (Friendly Geometric)</option>
                                <option value="outfit">Outfit (Neo-Grotesk)</option>
                                <option value="montserrat">Montserrat (Urban Modern)</option>
                                <option value="roboto">Roboto (Crisp Neutral)</option>
                                <option value="nunito">Nunito (Soft Rounded)</option>
                              </optgroup>
                              <optgroup label="🏛️ Klassiek & Editorial Serif">
                                <option value="serif">Playfair Display (Editorial Serif)</option>
                                <option value="cinzel">Cinzel (Regal / Luxury)</option>
                                <option value="merriweather">Merriweather (Literary Warm)</option>
                                <option value="lora">Lora (Book Serif)</option>
                                <option value="eb_garamond">EB Garamond (Classical)</option>
                              </optgroup>
                              <optgroup label="💻 Code & Developer Monospace">
                                <option value="mono">JetBrains Mono (Technical Mono)</option>
                                <option value="fira_code">Fira Code (Clean Programming)</option>
                                <option value="space_mono">Space Mono (Sci-Fi Mono)</option>
                                <option value="courier_prime">Courier Prime (Typewriter)</option>
                              </optgroup>
                              <optgroup label="🚀 Display & Futurisme">
                                <option value="display">Space Grotesk (Tech Display)</option>
                                <option value="orbitron">Orbitron (Cyberpunk HUD)</option>
                                <option value="syne">Syne (Avant-Garde Art)</option>
                                <option value="bebas_neue">Bebas Neue (Bold Poster)</option>
                                <option value="comfortaa">Comfortaa (Aesthetic Rounded)</option>
                                <option value="audiowide">Audiowide (Synthwave)</option>
                                <option value="rajdhani">Rajdhani (Mecha Sci-Fi)</option>
                              </optgroup>
                              <optgroup label="🕹️ Retro & Gaming Pixels">
                                <option value="press_start">Press Start 2P (8-Bit Arcade)</option>
                                <option value="silkscreen">Silkscreen (Pixel Gaming)</option>
                                <option value="pixelify">Pixelify Sans (Pixel Sans)</option>
                                <option value="vt323">VT323 (Terminal CRT)</option>
                              </optgroup>
                              <optgroup label="✍️ Handgeschreven & Script">
                                <option value="caveat">Caveat (Handwritten)</option>
                                <option value="dancing_script">Dancing Script (Calligraphy)</option>
                                <option value="pacifico">Pacifico (Retro Surf Script)</option>
                              </optgroup>
                            </select>

                            {/* Quick Google Font Input Popover Form */}
                            {showQuickGoogleInput && (
                              <form onSubmit={handleQuickGoogleFontSubmit} className="pt-2 flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Bijv. Rubik Wet Paint..."
                                  value={quickGoogleFontInput}
                                  onChange={(e) => setQuickGoogleFontInput(e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-app-card border border-app-border rounded-xl text-xs text-app-ink placeholder-app-muted focus:outline-none focus:border-cyan-500"
                                />
                                <button
                                  type="submit"
                                  disabled={!quickGoogleFontInput.trim()}
                                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  Toevoegen
                                </button>
                              </form>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide ml-1">
                              Corner Rounding ({customTheme.border_radius || 12}px)
                            </label>
                            <input 
                              type="range" 
                              min="0" 
                              max="40" 
                              value={customTheme.border_radius || 12} 
                              onChange={(e) => setCustomTheme({...customTheme, border_radius: parseInt(e.target.value)})} 
                              className="w-full accent-app-ink h-2 bg-app-accent rounded-full appearance-none cursor-pointer mt-3"
                            />
                            <div className="flex justify-between text-[8px] text-app-muted font-mono px-1">
                              <span>0px (Strak)</span>
                              <span>16px (Standaard)</span>
                              <span>40px (Pill)</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Font Rendering Preview Card */}
                        <div className="p-4 bg-app-card rounded-xl border border-app-border/80 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[10px] text-app-muted">
                            <span className="font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-cyan-500" /> Typografisch Voorbeeld
                            </span>
                            <span className="font-mono text-[9px] bg-app-accent px-2 py-0.5 rounded-md">
                              {resolveFontFamilyString(customTheme.font_family, localCustomFonts).split(',')[0].replace(/"/g, '')}
                            </span>
                          </div>
                          <div className="pt-1">
                            <p 
                              style={{ 
                                fontFamily: resolveFontFamilyString(customTheme.font_family, localCustomFonts),
                                fontSize: '18px',
                                fontWeight: 700
                              }}
                              className="text-app-ink tracking-tight"
                            >
                              FTJM Forum — Snel, Veilig & Krachtig
                            </p>
                            <p 
                              style={{ 
                                fontFamily: resolveFontFamilyString(customTheme.font_family, localCustomFonts),
                                fontSize: '12px'
                              }}
                              className="text-app-muted mt-1 leading-relaxed"
                            >
                              Dit is een voorbeeld van hoe artikelen, forumdiscussies en directe berichten eruitzien in jouw geselecteerde lettertype.
                            </p>
                            <p 
                              style={{ 
                                fontFamily: resolveFontFamilyString(customTheme.font_family, localCustomFonts),
                                fontSize: '10px'
                              }}
                              className="text-cyan-500 font-mono mt-1 tracking-wider uppercase opacity-90"
                            >
                              0123456789 • ABCDEFGHIJKLMNOPQRSTUVWXYZ • #!&%$@
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Colors */}
                      <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-6">
                        <h4 className="text-xs font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                          <Palette className="w-4 h-4" /> Core Colors
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {[
                            { id: 'primary_color', label: 'Accent 1' },
                            { id: 'secondary_color', label: 'Accent 2' },
                            { id: 'text_color', label: 'Text' },
                            { id: 'body_bg_color', label: 'Main BG' },
                            { id: 'card_bg_color', label: 'Card' },
                            { id: 'header_bg_color', label: 'Header' }
                          ].map(color => (
                            <div key={color.id} className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide ml-1">{color.label}</label>
                              <div className="flex gap-2">
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-app-border flex-shrink-0">
                                  <input 
                                    type="color" 
                                    value={customTheme[color.id as keyof CustomTheme] as string || '#000000'} 
                                    onChange={(e) => setCustomTheme({...customTheme, [color.id]: e.target.value})}
                                    className="absolute inset-x-[-50%] inset-y-[-50%] w-[200%] h-[200%] cursor-pointer"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  value={customTheme[color.id as keyof CustomTheme] as string || ''} 
                                  onChange={(e) => setCustomTheme({...customTheme, [color.id]: e.target.value})}
                                  className="flex-1 min-w-0 text-[10px] font-mono bg-app-card border border-app-border rounded-lg px-2 py-1.5"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Effects */}
                      <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-app-ink uppercase tracking-wide">Glass & Effects</h4>
                          <button
                            onClick={() => setCustomTheme({...customTheme, glass_effect: !customTheme.glass_effect})}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              customTheme.glass_effect ? 'bg-app-ink text-app-bg' : 'bg-app-accent text-app-muted'
                            }`}
                          >
                            {customTheme.glass_effect ? 'Glass ON' : 'Glass OFF'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <div className="flex justify-between text-[8px] font-bold text-app-muted uppercase tracking-wide">
                              <span>Glass Blur ({customTheme.blur_amount || 0}px)</span>
                            </div>
                            <input type="range" min="0" max="40" value={customTheme.blur_amount || 0} onChange={(e) => setCustomTheme({...customTheme, blur_amount: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[8px] font-bold text-app-muted uppercase tracking-wide">
                              <span>Transparency ({customTheme.opacity || 0}%)</span>
                            </div>
                            <input type="range" min="0" max="100" value={customTheme.opacity || 0} onChange={(e) => setCustomTheme({...customTheme, opacity: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[8px] font-bold text-app-muted uppercase tracking-wide">
                              <span>Chat Transparency ({customTheme.chat_opacity || 0}%)</span>
                            </div>
                            <input type="range" min="0" max="100" value={customTheme.chat_opacity ?? 0} onChange={(e) => setCustomTheme({...customTheme, chat_opacity: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[8px] font-bold text-app-muted uppercase tracking-wide">
                              <span>Profile Card Transparency ({customTheme.profile_card_opacity || 0}%)</span>
                            </div>
                            <input type="range" min="0" max="100" value={customTheme.profile_card_opacity ?? 0} onChange={(e) => setCustomTheme({...customTheme, profile_card_opacity: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                        </div>

                        {/* Icon Micro-Animations quick toggle */}
                        <div className="pt-4 border-t border-app-border/60">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide">Icoon Micro-Animaties</p>
                              <p className="text-xs text-app-muted mt-0.5">Kies hoe iconen in knoppen en navigatie bewegen</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-accent text-app-ink border border-app-border">
                              {iconAnimationMode === 'all' ? '✨ Alles' : iconAnimationMode === 'hover_only' ? '👆 Hover' : '🚫 Uit'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetIconAnimationMode('all')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                iconAnimationMode === 'all'
                                  ? 'bg-app-ink text-app-bg border-app-ink shadow-sm'
                                  : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent hover:text-app-ink'
                              }`}
                            >
                              <p className="text-xs font-bold">✨ Alles</p>
                              <p className="text-[9px] opacity-80 mt-0.5">Actief + Hover</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetIconAnimationMode('hover_only')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                iconAnimationMode === 'hover_only'
                                  ? 'bg-app-ink text-app-bg border-app-ink shadow-sm'
                                  : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent hover:text-app-ink'
                              }`}
                            >
                              <p className="text-xs font-bold">👆 Alleen Hover</p>
                              <p className="text-[9px] opacity-80 mt-0.5">Rustige layout</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetIconAnimationMode('disabled')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                iconAnimationMode === 'disabled'
                                  ? 'bg-app-ink text-app-bg border-app-ink shadow-sm'
                                  : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent hover:text-app-ink'
                              }`}
                            >
                              <p className="text-xs font-bold">🚫 Uit</p>
                              <p className="text-[9px] opacity-80 mt-0.5">Volledig statisch</p>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Wallpaper & Pattern */}
                      <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-6">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                            <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide ml-1">Wallpaper / Achtergrond</label>
                            <div className="flex flex-wrap items-center gap-1.5 ml-1 sm:ml-0 text-[10px]">
                              <span className="text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                                <Link className="w-2.5 h-2.5" /> Of via:
                              </span>
                              <a 
                                href="https://postimages.org/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                              >
                                postimages.org
                              </a>
                              <a 
                                href="https://imgbb.com/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-0.5 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/30"
                              >
                                imgbb.com
                              </a>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <input 
                                type="text"
                                value={customTheme.wallpaper || ''}
                                onChange={(e) => setCustomTheme({...customTheme, wallpaper: e.target.value})}
                                placeholder="Direct Image URL (png/jpg/webp) of upload..."
                                className="w-full pl-4 pr-10 py-3 bg-app-card border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink"
                              />
                              {customTheme.wallpaper && (
                                <button
                                  type="button"
                                  onClick={() => setCustomTheme({ ...customTheme, wallpaper: '' })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-red-500 transition-colors"
                                  title="Achtergrond wissen"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs sm:text-sm shrink-0 select-none">
                              <Upload className="w-4 h-4" />
                              <span>Achtergrond Uploaden</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  toast.promise(
                                    compressImage(file, 1024, 576, 0.60).then((dataUrl) => {
                                      setCustomTheme({ ...customTheme, wallpaper: dataUrl });
                                      return "Achtergrond succesvol geladen!";
                                    }),
                                    {
                                      loading: "Achtergrond optimaliseren...",
                                      success: (msg) => msg,
                                      error: "Kon achtergrond niet verwerken."
                                    }
                                  );
                                }}
                              />
                            </label>
                          </div>
                          {customTheme.wallpaper && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                              <div>
                                <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide mb-1 ml-1">Focus X ({customTheme.wallpaper_x || 50}%)</label>
                                <input type="range" min="0" max="100" value={customTheme.wallpaper_x || 50} onChange={(e) => setCustomTheme({...customTheme, wallpaper_x: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide mb-1 ml-1">Focus Y ({customTheme.wallpaper_y || 50}%)</label>
                                <input type="range" min="0" max="100" value={customTheme.wallpaper_y || 50} onChange={(e) => setCustomTheme({...customTheme, wallpaper_y: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Achtergrond Patroon</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PATTERNS.map((pattern) => (
                              <button
                                key={pattern.id}
                                onClick={() => setCustomTheme({...customTheme, pattern: pattern.id})}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                                  customTheme.pattern === pattern.id || (!customTheme.pattern && pattern.id === 'none')
                                    ? 'border-app-ink bg-app-ink text-app-bg' 
                                    : 'border-app-border bg-app-card text-app-ink hover:border-app-ink'
                                }`}
                              >
                                <div className="w-full h-8 rounded-lg overflow-hidden border border-white/10" style={
                                  pattern.id !== 'none' ? {
                                    backgroundColor: customTheme.pattern === pattern.id ? 'transparent' : customTheme.body_bg_color,
                                    backgroundImage: pattern.style,
                                    backgroundSize: pattern.size,
                                    // Make pattern visible by forcing a generic visible color in the preview
                                    ['--custom-accent' as any]: customTheme.pattern === pattern.id ? 'rgba(255,255,255,0.5)' : 'rgba(128,128,128,0.5)'
                                  } : { backgroundColor: customTheme.body_bg_color || '#ffffff' }
                                } />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{pattern.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="xl:col-span-2 space-y-4 flex flex-col">
                      <h4 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> Live Device Preview
                      </h4>
                      <div 
                        className="flex-1 rounded-[2.5rem] border-4 border-app-ink overflow-hidden p-4 relative min-h-[400px] shadow-2xl"
                        style={{ 
                          backgroundColor: customTheme.body_bg_color,
                          borderRadius: `${(customTheme.border_radius || 12) * 1.5}px`
                        }}
                      >
                        {/* Fake Wallpaper */}
                        {customTheme.wallpaper && (
                          <div 
                            className="absolute inset-0 z-0 bg-cover bg-no-repeat"
                            style={{ 
                              backgroundImage: `url(${customTheme.wallpaper})`,
                              backgroundPosition: `${customTheme.wallpaper_x || 50}% ${customTheme.wallpaper_y || 50}%`,
                              filter: `blur(${customTheme.blur_amount || 0}px)`,
                              opacity: (customTheme.opacity || 100) / 100,
                            }}
                          />
                        )}

                        <div className="relative z-10 space-y-4">
                          {/* Fake Header */}
                          <div 
                            className="h-12 rounded-2xl flex items-center px-4 justify-between"
                            style={{ 
                              backgroundColor: customTheme.glass_effect ? 'rgba(255,255,255,0.1)' : customTheme.header_bg_color,
                              backdropFilter: customTheme.glass_effect ? `blur(${customTheme.blur_amount || 0}px)` : 'none',
                              borderRadius: `${customTheme.border_radius || 12}px`,
                              border: `1px solid rgba(255,255,255,0.1)`
                            }}
                          >
                            <div className="w-4 h-4 rounded bg-white/20" />
                            <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-white/30" />
                              <div className="w-3 h-3 rounded-full bg-white/30" />
                              <div className="w-3 h-3 rounded-full bg-white/30" />
                            </div>
                          </div>

                          {/* Fake Card */}
                          <div 
                            className="p-6 space-y-4 shadow-xl"
                            style={{ 
                              backgroundColor: customTheme.glass_effect ? 'rgba(255,255,255,0.15)' : customTheme.card_bg_color,
                              backdropFilter: customTheme.glass_effect ? `blur(${customTheme.blur_amount || 0}px)` : 'none',
                              color: customTheme.text_color,
                              borderRadius: `${customTheme.border_radius || 12}px`,
                              border: `1px solid rgba(255,255,255,0.1)`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: customTheme.primary_color }} />
                              <div className="space-y-1">
                                <div className="h-3 w-24 rounded" style={{ backgroundColor: customTheme.primary_color, opacity: 0.8 }} />
                                <div className="h-2 w-16 rounded opacity-40" style={{ backgroundColor: customTheme.text_color }} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2 w-full rounded opacity-30" style={{ backgroundColor: customTheme.text_color }} />
                              <div className="h-2 w-4/5 rounded opacity-30" style={{ backgroundColor: customTheme.text_color }} />
                            </div>
                            <div 
                              className="h-10 w-full rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wide"
                              style={{ 
                                backgroundColor: customTheme.primary_color, 
                                color: customTheme.card_bg_color,
                                borderRadius: `${(customTheme.border_radius || 12) * 0.8}px`
                              }}
                            >
                              Action Button
                            </div>
                          </div>

                          {/* Fake DM */}
                          <div className="flex flex-col gap-2">
                             <div 
                                className="self-end max-w-[80%] p-3 text-xs"
                                style={{ 
                                  backgroundColor: customTheme.primary_color, 
                                  color: '#fff',
                                  borderRadius: `${customTheme.border_radius || 12}px ${(customTheme.border_radius || 12) * 0.8}px 0 ${(customTheme.border_radius || 12) * 0.8}px`
                                }}
                             >
                               Hello! This is a preview.
                             </div>
                             <div 
                                className="self-start max-w-[80%] p-3 text-xs"
                                style={{ 
                                  backgroundColor: customTheme.accent_color, 
                                  color: customTheme.text_color,
                                  borderRadius: `${(customTheme.border_radius || 12) * 0.8}px ${(customTheme.border_radius || 12) * 0.8}px ${(customTheme.border_radius || 12) * 0.8}px 0`
                                }}
                             >
                               Looks great!
                             </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-app-muted font-bold uppercase tracking-wide italic">Voorbeeld weergave</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-app-border flex justify-end">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleUpdateTheme}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-app-ink text-app-bg rounded-2xl font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-all shadow-xl group cursor-pointer"
                >
                  {saving ? <ThemedSpinner size="xs" color="currentColor" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  Confirm Customization
                </motion.button>
              </div>
            </motion.div>
          )}





          {settingsTab === 'app' && (
            <motion.div
              key="app-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-6 sm:p-8 border border-app-border shadow-sm space-y-8"
            >
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-14 h-14 bg-app-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Layout className="w-7 h-7 text-app-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">{t("App Instellingen")}</h3>
                  <p className="text-app-muted text-sm font-medium">{t("Beheer taal, privégesprekken, installatie en app-prestaties.")}</p>
                </div>
              </div>

              {/* Grid or Sectional Cards */}
              <div className="space-y-6">

                {/* 1. Taal & Weergave */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("Taal & Weergave")}</h4>
                        <p className="text-xs text-app-muted">{t("Kies de gewenste weergavetaal van het forum.")}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-app-accent text-[11px] font-bold text-app-ink border border-app-border">
                      {language === 'nl' ? 'Nederlands' : 'English'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => onChangeLanguage('nl')}
                      type="button"
                      className={`p-4 rounded-xl font-bold border text-left transition-all flex items-center justify-between ${
                        language === 'nl'
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.01]'
                          : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent/50 hover:text-app-ink'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇳🇱</span>
                        <div>
                          <p className="text-sm font-bold">Nederlands</p>
                          <p className={`text-[11px] font-medium ${language === 'nl' ? 'text-app-bg/80' : 'text-app-muted'}`}>Standaardtaal</p>
                        </div>
                      </div>
                      {language === 'nl' && <Check className="w-5 h-5" />}
                    </button>

                    <button 
                      onClick={() => onChangeLanguage('en')}
                      type="button"
                      className={`p-4 rounded-xl font-bold border text-left transition-all flex items-center justify-between ${
                        language === 'en'
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.01]'
                          : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent/50 hover:text-app-ink'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇬🇧</span>
                        <div>
                          <p className="text-sm font-bold">English</p>
                          <p className={`text-[11px] font-medium ${language === 'en' ? 'text-app-bg/80' : 'text-app-muted'}`}>International</p>
                        </div>
                      </div>
                      {language === 'en' && <Check className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 2. Verborgen Privégesprekken (Hidden DMs) */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <EyeOff className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("Privégesprekken & Verborgen DM's")}</h4>
                        <p className="text-xs text-app-muted">{t("Verberg specifieke privéchats uit je actieve inbox om je berichtenoverzicht overzichtelijk en privé te houden.")}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-app-accent text-[11px] font-mono font-bold text-app-ink border border-app-border">
                      {hiddenConversationIds.length} {t("Verborgen")}
                    </span>
                  </div>

                  {(() => {
                    const hiddenConvs = (conversations || []).filter(c => hiddenConversationIds.includes(c.id));
                    if (hiddenConvs.length === 0) {
                      return (
                        <div className="p-5 bg-app-card rounded-xl border border-app-border/80 text-center">
                          <div className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center mx-auto mb-2 text-app-muted">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-app-ink">{t("Geen verborgen gesprekken")}</p>
                          <p className="text-[11px] text-app-muted mt-1 max-w-md mx-auto">
                            {t("Je hebt momenteel geen verborgen DM's. Klik in de inbox op het oog-icoontje naast een gesprek om het te verbergen.")}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-app-border/60 bg-app-card rounded-xl border border-app-border">
                          {hiddenConvs.map(conv => {
                            const otherUid = !conv.is_group ? conv.participants?.find(uid => uid !== user.uid) : null;
                            const otherProfile = otherUid ? profiles?.find(p => p.id === otherUid) : null;
                            const name = conv.is_group 
                              ? (conv.name || 'Groepsgesprek') 
                              : (otherProfile?.display_name || (otherUid ? conv.participant_names?.[otherUid] : null) || 'Onbekend');
                            const photo = conv.is_group 
                              ? null 
                              : (otherProfile?.photo_url || (otherUid ? conv.participant_photos?.[otherUid] : null) || null);

                            return (
                              <div key={conv.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-app-accent/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-app-accent overflow-hidden flex-shrink-0 flex items-center justify-center border border-app-border">
                                    {photo ? (
                                      <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      conv.is_group ? (
                                        <Users className="w-5 h-5 text-app-muted" />
                                      ) : (
                                        <UserIcon className="w-5 h-5 text-app-muted" />
                                      )
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-xs font-bold text-app-ink truncate">{name}</p>
                                      {conv.is_group && (
                                        <span className="text-[9px] font-bold bg-app-accent px-1.5 py-0.5 rounded-md text-app-muted border border-app-border">
                                          {conv.participants?.length || 0} leden
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-app-muted truncate font-medium">
                                      {conv.last_message || 'Geen berichten'}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onToggleHideConversation?.(conv.id)}
                                  className="px-3 py-1.5 rounded-lg bg-app-accent hover:bg-app-ink hover:text-app-bg text-app-ink text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 border border-app-border"
                                  title="Gesprek weergeven in Inbox"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{t("Zichtbaar maken")}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {hiddenConvs.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => onUnhideAllConversations?.()}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-app-accent hover:bg-app-accent/80 text-app-ink transition-colors flex items-center gap-1.5 border border-app-border"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t("Alle gesprekken zichtbaar maken")}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Icoon Micro-Animaties & Rustige Weergave */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <Sparkles className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("Icoon Micro-Animaties")}</h4>
                        <p className="text-xs text-app-muted">
                          {t("Kies hoe knoppen en navigatie-iconen reageren: continu geanimeerd, alleen bij cursor hover of volledig statisch.")}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-app-accent text-[11px] font-bold text-app-ink border border-app-border">
                      {iconAnimationMode === 'all' ? '✨ ' + t('Alles Geanimeerd') : iconAnimationMode === 'hover_only' ? '👆 ' + t('Alleen bij Hover') : '🚫 ' + t('Animaties Uit')}
                    </span>
                  </div>

                  {/* 3 Interactive Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSetIconAnimationMode('all')}
                      className={`p-4 rounded-xl font-bold border text-left transition-all flex flex-col justify-between gap-3 ${
                        iconAnimationMode === 'all'
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.01]'
                          : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent/50 hover:text-app-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/30 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                        </div>
                        {iconAnimationMode === 'all' && <Check className="w-4 h-4 text-app-bg" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t("Alles Geanimeerd")}</p>
                        <p className={`text-[11px] font-medium mt-0.5 ${iconAnimationMode === 'all' ? 'text-app-bg/80' : 'text-app-muted'}`}>
                          {t("Standaard — continue subtiele animaties op actieve tab en bij hover.")}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetIconAnimationMode('hover_only')}
                      className={`p-4 rounded-xl font-bold border text-left transition-all flex flex-col justify-between gap-3 ${
                        iconAnimationMode === 'hover_only'
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.01]'
                          : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent/50 hover:text-app-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/30 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-amber-400" />
                        </div>
                        {iconAnimationMode === 'hover_only' && <Check className="w-4 h-4 text-app-bg" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t("Alleen bij Hover")}</p>
                        <p className={`text-[11px] font-medium mt-0.5 ${iconAnimationMode === 'hover_only' ? 'text-app-bg/80' : 'text-app-muted'}`}>
                          {t("Rustige interface — animaties triggeren alleen als je erover beweegt.")}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetIconAnimationMode('disabled')}
                      className={`p-4 rounded-xl font-bold border text-left transition-all flex flex-col justify-between gap-3 ${
                        iconAnimationMode === 'disabled'
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.01]'
                          : 'bg-app-card text-app-muted border-app-border hover:bg-app-accent/50 hover:text-app-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/30 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-rose-400" />
                        </div>
                        {iconAnimationMode === 'disabled' && <Check className="w-4 h-4 text-app-bg" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t("Animaties Uit")}</p>
                        <p className={`text-[11px] font-medium mt-0.5 ${iconAnimationMode === 'disabled' ? 'text-app-bg/80' : 'text-app-muted'}`}>
                          {t("Volledig statische iconen zonder beweging of spring-effecten.")}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Live Interactive Test Workbench */}
                  <div className="p-4 bg-app-card rounded-xl border border-app-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-app-ink flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-cyan-500" />
                        {t("Live Voorbeeld & Testbalk")}
                      </p>
                      <p className="text-[11px] text-app-muted mt-0.5">
                        {t("Beweeg met je muis over de iconen hieronder om je geselecteerde modus direct te testen:")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-app-bg rounded-xl border border-app-border self-start sm:self-auto">
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Chat Icon">
                        <AnimatedChatIcon isActive={false} className="w-5 h-5" />
                      </div>
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Berichten Icon">
                        <AnimatedMailIcon isActive={false} className="w-5 h-5" />
                      </div>
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Media Icon">
                        <AnimatedMediaIcon isActive={false} className="w-5 h-5" />
                      </div>
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Notificaties Icon">
                        <AnimatedBellIcon isActive={false} className="w-5 h-5" />
                      </div>
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Arcade Icon">
                        <AnimatedArcadeIcon isActive={false} className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div className="p-2 rounded-lg bg-app-accent/40 text-app-ink hover:bg-app-accent transition-colors cursor-pointer" title="Instellingen Icon">
                        <AnimatedMenuIcon isActive={false} className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Downloads & Standalone App */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <Monitor className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("App Installatie & Downloads")}</h4>
                        <p className="text-xs text-app-muted">{t("Download de app voor snellere prestaties en bureaubladintegratie.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Desktop App Card */}
                    <div className="p-4 bg-app-card rounded-xl border border-app-border flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-app-ink">Desktop App</span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/25">
                            v1.3.1 Release
                          </span>
                        </div>
                        <p className="text-xs text-app-muted mb-4 leading-relaxed">
                          Zelfstandige app voor Windows (.exe), macOS en Linux met native pushnotificaties.
                        </p>
                      </div>
                      <a
                        href="https://github.com/Bobbyyyyyyyya/FTJM-chat/releases/tag/v1.3.1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Desktop App</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    </div>

                    {/* PWA / Browser Card */}
                    <div className="p-4 bg-app-card rounded-xl border border-app-border flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-app-ink">Progressive Web App</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/25">
                            Web Standalone
                          </span>
                        </div>
                        <p className="text-xs text-app-muted mb-4 leading-relaxed">
                          Installeer direct via Chrome, Safari of Edge zonder losse installatiebestanden.
                        </p>
                      </div>

                      {(() => {
                        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
                        if (isInIframe) {
                          return (
                            <div className="p-2.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-500/20 text-[11px] font-medium flex items-center gap-2">
                              <Info className="w-4 h-4 flex-shrink-0" />
                              <span>Open in nieuw tabblad om PWA te installeren</span>
                            </div>
                          );
                        }
                        if (showInstallButton) {
                          return (
                            <button 
                              onClick={handleInstallClick}
                              className="w-full py-2.5 px-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t("Nu Installeren")}</span>
                            </button>
                          );
                        }
                        return (
                          <div className="p-2.5 bg-app-accent text-app-muted rounded-xl text-[11px] font-medium text-center border border-app-border">
                            {t("Geïnstalleerd of gereed in browser")}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Clean Collapsible Manual Guide */}
                  <div className="bg-app-card rounded-xl border border-app-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowInstallGuide(!showInstallGuide)}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-app-ink hover:bg-app-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-app-muted" />
                        <span>{t("Handmatige installatiehandleiding")} (Chromebook, iOS & Android)</span>
                      </div>
                      {showInstallGuide ? <ChevronUp className="w-4 h-4 text-app-muted" /> : <ChevronDown className="w-4 h-4 text-app-muted" />}
                    </button>

                    <AnimatePresence>
                      {showInstallGuide && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-app-border p-4 bg-app-bg/30 space-y-3"
                        >
                          <div className="flex gap-2 border-b border-app-border pb-2">
                            {(['chromebook', 'ios', 'android'] as const).map(os => (
                              <button
                                key={os}
                                type="button"
                                onClick={() => setInstallGuideOS(os)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  installGuideOS === os
                                    ? 'bg-app-ink text-app-bg'
                                    : 'text-app-muted hover:text-app-ink hover:bg-app-accent'
                                }`}
                              >
                                {os === 'chromebook' ? 'Chrome & Chromebook' : os === 'ios' ? 'iPhone & iPad' : 'Android'}
                              </button>
                            ))}
                          </div>

                          {installGuideOS === 'chromebook' && (
                            <ul className="list-disc list-inside space-y-1.5 text-xs text-app-muted font-medium ml-1">
                              <li>{t("Open de webapp in een nieuw tabblad.")}</li>
                              <li>{t("Zoek rechts in de adresbalk naar het installatie-icoontje (PC met pijl omlaag of '+' knop).")}</li>
                              <li>{t("Klik hierop en kies 'Installeren'.")}</li>
                              <li>{t("Of: Drie puntjes rechtsboven -> 'Opslaan en delen' -> 'App installeren'.")}</li>
                            </ul>
                          )}

                          {installGuideOS === 'ios' && (
                            <ul className="list-disc list-inside space-y-1.5 text-xs text-app-muted font-medium ml-1">
                              <li>{t("Open deze site in Safari.")}</li>
                              <li>{t("Tik onderin op de Deel-knop (vierkant met pijl omhoog).")}</li>
                              <li>{t("Kies 'Zet op beginscherm' (Add to Home Screen).")}</li>
                            </ul>
                          )}

                          {installGuideOS === 'android' && (
                            <ul className="list-disc list-inside space-y-1.5 text-xs text-app-muted font-medium ml-1">
                              <li>{t("Tik rechtsboven op het menu (drie puntjes).")}</li>
                              <li>{t("Tik op 'App installeren' of 'Toevoegen aan startscherm'.")}</li>
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 4. Systeem, Opslag & Cache */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("Systeem & Opslag")}</h4>
                        <p className="text-xs text-app-muted">{t("App-versie, status en cache beheer.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-app-card rounded-xl border border-app-border text-center">
                      <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Versie</p>
                      <p className="text-sm font-bold text-app-ink mt-0.5">v2.5.0</p>
                    </div>
                    <div className="p-3 bg-app-card rounded-xl border border-app-border text-center">
                      <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Platform</p>
                      <p className="text-sm font-bold text-app-ink mt-0.5">FTJM PWA</p>
                    </div>
                    <div className="p-3 bg-app-card rounded-xl border border-app-border text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Status</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.getRegistration().then(reg => {
                            if (reg) {
                              reg.update().then(() => {
                                toast.success('Gecontroleerd op updates', {
                                  description: 'Als er een update is, verschijnt er direct een melding.'
                                });
                              });
                            } else {
                              toast.info('Je gebruikt de meest actuele versie.');
                            }
                          });
                        } else {
                          toast.info('Je gebruikt de meest actuele versie.');
                        }
                      }}
                      className="flex-1 py-2.5 px-4 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-app-border"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Controleer op updates</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleManualBase64Migration}
                      disabled={migratingBase64}
                      className="flex-1 py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-cyan-500/20 shadow-sm"
                    >
                      <Zap className={`w-3.5 h-3.5 ${migratingBase64 ? 'animate-spin text-cyan-500' : ''}`} />
                      <span>{migratingBase64 ? t("Optimaliseren...") : t("Media Optimaliseren (CDN)")}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.clear();
                          toast.success(t("Cache opgeschoond"), {
                            description: 'Tijdelijke cache is succesvol geleegd.'
                          });
                        } catch (e) {
                          toast.error('Kon cache niet legen');
                        }
                      }}
                      className="flex-1 py-2.5 px-4 bg-app-card hover:bg-app-accent/50 text-app-muted hover:text-app-ink rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-app-border"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("Lokale cache opschonen")}</span>
                    </button>
                  </div>
                </div>

                {/* 4. Lokale Berichtgeschiedenis & Archief (IndexedDB) */}
                <div className="p-6 bg-app-accent/20 rounded-2xl border border-app-border space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                        <HardDrive className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-app-ink text-base">{t("Lokale Berichtgeschiedenis & Archief")}</h4>
                        <p className="text-xs text-app-muted">
                          {t("Berichten en DM's worden lokaal op je apparaat opgeslagen (IndexedDB) zodat je geschiedenis bewaard blijft, terwijl de server licht en snel blijft.")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={refreshArchiveStats}
                      disabled={loadingArchiveStats}
                      className="px-3 py-1.5 bg-app-card hover:bg-app-accent text-app-ink rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-app-border"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingArchiveStats ? 'animate-spin' : ''}`} />
                      <span>{t("Status Vernieuwen")}</span>
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-app-card rounded-xl border border-app-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-app-ink">{archiveStats.dmsCount} {t("Lokale DM's")}</p>
                          <p className="text-[10px] text-app-muted">{t("Opgeslagen in privé-archief")}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {t("Actief")}
                      </span>
                    </div>

                    <div className="p-4 bg-app-card rounded-xl border border-app-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-app-ink">{archiveStats.postsCount} {t("Chatberichten")}</p>
                          <p className="text-[10px] text-app-muted">{t("Algemene chat geschiedenis")}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {t("Actief")}
                      </span>
                    </div>
                  </div>

                  {/* Clear Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(t("Weet je zeker dat je je lokale berichtgeschiedenis wilt wissen? Je serverberichten blijven intact."))) {
                          await clearLocalArchive('all');
                          await refreshArchiveStats();
                          toast.success(t("Lokaal archief gewist"), {
                            description: t("Je lokale berichtenarchief op dit apparaat is leeggemaakt.")
                          });
                        }
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-red-500/20 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("Lokaal Berichtenarchief Wissen")}</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {settingsTab === 'security' && (
            <motion.div
              key="passkey-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm">
                <div className="flex items-center gap-4 border-b border-app-border pb-6">
                  <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Beveiliging & Wachtwoord</h3>
                    <p className="text-app-muted text-sm font-medium">Beheer je accountwachtwoord en biometrisch inloggen met Passkeys.</p>
                  </div>
                </div>

                {/* Password Change Card */}
                <div className="pt-6 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Key className="w-5 h-5 text-cyan-500" />
                      <h4 className="text-lg font-bold text-app-ink uppercase tracking-tight">Wachtwoord Wijzigen</h4>
                    </div>
                    {passkeys.some(p => p.email.toLowerCase() === user.email?.toLowerCase()) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Fingerprint className="w-3.5 h-3.5" />
                        Passkey Verificatie Actief
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-app-accent text-app-muted border border-app-border">
                        <LockIcon className="w-3.5 h-3.5" />
                        Wachtwoordbeveiliging
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-app-accent/30 border border-app-border text-xs text-app-muted leading-relaxed space-y-1">
                    <p className="font-bold text-app-ink flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-500 shrink-0" />
                      Veiligheidsprocedure
                    </p>
                    <p>
                      Voer ter authenticatie eerst je <strong>huidige wachtwoord</strong> in. {passkeys.some(p => p.email.toLowerCase() === user.email?.toLowerCase()) ? 'Omdat er een biometrische Passkey aan je account is gekoppeld, volgt direct hierna een vingerafdruk- of gezichtsscan om de wijziging definitief te autoriseren.' : 'Nadat je huidige wachtwoord is gevalideerd, wordt je nieuwe wachtwoord direct geactiveerd.'}
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">
                        Huidig Wachtwoord
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm text-app-ink focus:outline-none focus:ring-2 focus:ring-app-ink transition-all font-mono pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink transition-colors p-1"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">
                          Nieuw Wachtwoord (min. 6 tekens)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm text-app-ink focus:outline-none focus:ring-2 focus:ring-app-ink transition-all font-mono pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink transition-colors p-1"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">
                          Herhaal Nieuw Wachtwoord
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmNewPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={confirmNewPasswordInput}
                            onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                            className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm text-app-ink focus:outline-none focus:ring-2 focus:ring-app-ink transition-all font-mono pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink transition-colors p-1"
                          >
                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={changingPassword || !currentPasswordInput.trim() || !newPasswordInput.trim() || !confirmNewPasswordInput.trim()}
                        className="w-full sm:w-auto px-7 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {changingPassword ? (
                          <>
                            <ThemedSpinner size="xs" color="currentColor" />
                            <span>Wachtwoord verifiëren & bijwerken...</span>
                          </>
                        ) : (
                          <>
                            <LockIcon className="w-4 h-4" />
                            <span>Wachtwoord Wijzigen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Passkey (WebAuthn) Card */}
              <div className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-app-border pb-6">
                  <div className="w-12 h-12 bg-app-accent rounded-2xl flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-app-ink uppercase tracking-tight">Biometrische Passkeys (WebAuthn)</h4>
                    <p className="text-app-muted text-xs font-medium">Log in of autoriseer acties met TouchID, FaceID of Windows Hello op dit apparaat.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {!window.PublicKeyCredential ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-bold">Passkeys worden niet ondersteund</p>
                        <p className="text-[11px] text-amber-300/80 mt-0.5">Je huidige browser of netwerkomgeving (zoals een cross-origin iframe) ondersteunt de WebAuthn API niet. Open de applicatie in een nieuw fysiek tabblad via HTTPS om passkeys te registreren.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {passkeys.some(p => p.email.toLowerCase() === user.email?.toLowerCase()) ? (
                        (() => {
                          const userPasskey = passkeys.find(p => p.email.toLowerCase() === user.email?.toLowerCase());
                          return (
                            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-app-ink text-sm flex items-center gap-1.5">
                                    Passkey is Actief
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Dit apparaat</span>
                                  </h4>
                                  <p className="text-xs text-app-muted">Gekoppeld aan e-mailadres: <span className="font-mono text-app-ink font-semibold">{user.email}</span></p>
                                  <p className="text-[11px] text-app-muted">Geregistreerd op: {userPasskey?.createdAt ? new Date(userPasskey.createdAt).toLocaleString('nl-NL') : 'Onbekende datum'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemovePasskeyForEmail(user.email!)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Passkey Verwijderen
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="border border-app-border bg-app-accent/20 rounded-2xl p-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-app-accent rounded-xl flex items-center justify-center shrink-0">
                              <Fingerprint className="w-6 h-6 text-app-ink" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-app-ink text-sm">Geen passkey geactiveerd</h4>
                              <p className="text-xs text-app-muted leading-relaxed">
                                Je hebt momenteel geen passkey geconfigureerd op dit apparaat. Door een passkey te koppelen kun je de volgende keer direct en veilig inloggen met je biometrische gegevens (vingerafdruk of gezichtsscan) zonder handmatig je wachtwoord in te voeren.
                              </p>
                            </div>
                          </div>

                          {!showPasswordPrompt ? (
                            <button
                              onClick={() => {
                                setShowPasswordPrompt(true);
                                setPasswordConfirm('');
                              }}
                              className="px-5 py-3 bg-app-ink text-app-bg hover:bg-app-ink/90 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Passkey registreren op dit apparaat
                            </button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border-t border-app-border pt-4 mt-2 space-y-4"
                            >
                              <div className="bg-app-accent/40 rounded-xl p-4 text-xs text-app-muted leading-relaxed space-y-1.5 border border-app-border">
                                <p className="font-bold text-app-ink flex items-center gap-2">
                                  <Key className="w-4 h-4 text-cyan-500" /> Wachtwoord-verificatie vereist
                                </p>
                                <p>Om je accountgegevens veilig en versleuteld lokaal op te slaan, voer je ter controle je huidige account-wachtwoord in.</p>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1 w-full space-y-1.5">
                                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                                    Voer je huidige wachtwoord in
                                  </label>
                                  <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="w-full px-4 py-3 bg-app-card border border-app-border rounded-xl text-sm text-app-ink focus:outline-none focus:border-cyan-400 transition-all font-mono"
                                  />
                                </div>
                                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                  <button
                                    onClick={() => setShowPasswordPrompt(false)}
                                    className="flex-1 sm:flex-none px-4 py-3 bg-app-accent hover:bg-app-border text-app-ink font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                  >
                                    Annuleren
                                  </button>
                                  <button
                                    disabled={registeringPasskey}
                                    onClick={handleAddPasskey}
                                    className="flex-1 sm:flex-none px-5 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    {registeringPasskey ? (
                                      <>
                                        <ThemedSpinner size="xs" color="#ffffff" />
                                        Registreren...
                                      </>
                                    ) : (
                                      <>
                                        <Fingerprint className="w-4 h-4" />
                                        Scan biometrie & activeer
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* PostgreSQL & Database Exploit Security Shield */}
              <DatabaseSecurityShield />
            </motion.div>
          )}

          {settingsTab === 'audiologs' && (
            <motion.div
              key="audiologs-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                  <Activity className="w-8 h-8 text-app-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Audio Gebeurtenissen</h3>
                  <p className="text-app-muted text-sm font-medium">Bekijk details van afgespeelde geluiden en fouten.</p>
                </div>
              </div>
              <div className="h-[600px] overflow-hidden rounded-2xl border border-app-border">
                <AudioLogsView />
              </div>
            </motion.div>
          )}          {settingsTab === 'admin' && isAdmin && (
            <motion.div
              key="admin-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              {/* Modernized Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-app-border pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-app-ink text-app-bg rounded-2xl flex items-center justify-center shadow-lg shadow-app-ink/10">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Beheerderspaneel</h3>
                    <p className="text-app-muted text-xs font-medium">Beheer toegang, security policies en de actieve applicatiestatus.</p>
                  </div>
                </div>

                {/* Sub-tab selection pillbox */}
                <div className="flex flex-wrap md:flex-nowrap gap-1 bg-app-bg/50 border border-app-border p-1 rounded-xl w-full md:w-auto">
                  {[
                    { id: 'overview', icon: Activity, label: 'Dashboard' },
                    { id: 'users', icon: UserIcon, label: 'Gebruikers' },
                    { id: 'reports', icon: Flag, label: 'Meldingen' },
                    { id: 'security', icon: LockIcon, label: 'Audit & SPF' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSubTab(tab.id as any)}
                      className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                        adminSubTab === tab.id 
                          ? 'bg-app-ink text-app-bg shadow-sm' 
                          : 'text-app-muted hover:text-app-ink'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. OVERVIEW / DASHBOARD TAB */}
              {adminSubTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  {/* Website status & Maintenance controls */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Website status card */}
                    <div className="bg-app-bg/45 border border-app-border rounded-3xl p-6 flex flex-col justify-between space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider font-mono">App Status</span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            websiteStatus.toLowerCase() === 'online'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : websiteStatus.toLowerCase() === 'onderhoud'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {websiteStatus}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-app-ink uppercase tracking-tight">Systeem Status Regeling</h4>
                        <p className="text-xs text-app-muted font-medium mt-1">Hier kun je de openbare status van de website handmatig overrident of tijdelijk in onderhoud modus zetten.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={statusInput}
                            onChange={(e) => setStatusInput(e.target.value)}
                            placeholder={`Huidige status: "${websiteStatus}"`}
                            className="flex-1 px-4 py-2.5 bg-app-card border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink outline-none"
                          />
                          <button 
                            onClick={handleUpdateStatus}
                            disabled={saving || !statusInput.trim()}
                            className="px-5 py-2.5 bg-app-ink text-app-bg rounded-xl text-xs font-extrabold hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                          >
                            Bijwerken
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => { setStatusInput('Online'); handleUpdateStatus(); }}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[9px] font-extrabold uppercase text-emerald-700 text-center transition-all"
                          >
                            Zet Online
                          </button>
                          <button 
                            onClick={() => { setStatusInput('Onderhoud'); handleUpdateStatus(); }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-[9px] font-extrabold uppercase text-amber-700 text-center transition-all"
                          >
                            Onderhoud
                          </button>
                          <button 
                            onClick={() => { setStatusInput('Offline'); handleUpdateStatus(); }}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-[9px] font-extrabold uppercase text-red-700 text-center transition-all"
                          >
                            Offline
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gepland Onderhoud Control Card */}
                    <div className="bg-app-bg/45 border border-app-border rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-app-ink" />
                        <h4 className="text-base font-bold text-app-ink uppercase tracking-tight">Gepland Onderhoud</h4>
                      </div>
                      <p className="text-xs text-app-muted font-medium">
                        Stel gepland onderhoud in met een offline of realtime aftelfunctie. Gebruikers horen geluidsmeldingen 5, 4, 3, 2 en 1 minuut voor aanvang.
                      </p>

                      {scheduledMaintenance && scheduledMaintenance.isActive ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Aftellen Actief
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                              Nog {maintenanceTimeLeft !== undefined && maintenanceTimeLeft !== null ? `${Math.floor(maintenanceTimeLeft / 60)}m ${maintenanceTimeLeft % 60}s` : 'laden...'}
                            </span>
                          </div>
                          <div className="text-xs text-amber-900 leading-tight">
                            Starttijd: <span className="font-bold">{new Date(scheduledMaintenance.targetTime).toLocaleTimeString()}</span> ({new Date(scheduledMaintenance.targetTime).toLocaleDateString()})
                          </div>
                          <button
                            onClick={handleCancelMaintenance}
                            className="w-full py-2 bg-red-610 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Stop / Annuleer Aftelling
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-1 grid-flow-row">
                            <button
                              onClick={() => handleScheduleMaintenance && handleScheduleMaintenance(5)}
                              className="px-1.5 py-2 bg-app-accent hover:bg-app-accent/80 border border-app-border rounded-xl text-[10px] font-bold text-app-ink transition-all active:scale-95"
                            >
                              5 min test
                            </button>
                            <button
                              onClick={() => handleScheduleMaintenance && handleScheduleMaintenance(10)}
                              className="px-1.5 py-2 bg-app-accent hover:bg-app-accent/80 border border-app-border rounded-xl text-[10px] font-bold text-app-ink transition-all active:scale-95"
                            >
                              10 min
                            </button>
                            <button
                              onClick={() => handleScheduleMaintenance && handleScheduleMaintenance(30)}
                              className="px-1.5 py-2 bg-app-accent hover:bg-app-accent/80 border border-app-border rounded-xl text-[10px] font-bold text-app-ink transition-all active:scale-95"
                            >
                              30 min
                            </button>
                          </div>

                          <div className="border-t border-app-border/40 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                            <input
                              type="datetime-local"
                              id="custom-maintenance-time"
                              className="flex-grow px-3 py-1.5 bg-app-card border border-app-border rounded-xl text-xs text-app-ink outline-none outline-0 focus:ring-1 focus:ring-app-ink transition-all font-mono"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById('custom-maintenance-time') as HTMLInputElement;
                                if (input && input.value && handleScheduleMaintenance) {
                                  handleScheduleMaintenance(new Date(input.value));
                                } else {
                                  toast.error('Kies eerst een datum/tijd.');
                                }
                              }}
                              className="px-3 py-1.5 bg-app-ink text-app-bg text-[11px] font-bold rounded-xl hover:opacity-90 transition-all select-none whitespace-nowrap active:scale-95"
                            >
                              Plannen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Telemetry details card */}
                  <div className="lg:col-span-7 bg-app-bg/45 border border-app-border rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-app-ink" />
                      <h4 className="text-base font-bold text-app-ink uppercase tracking-tight">Jouw Beheerder Telemetrie</h4>
                    </div>
                    
                    {(() => {
                      const notesData = parseAdminNotes(profile?.admin_notes, profile?.custom_theme);
                      let ownTelArray: any[] = notesData.telemetry;
                      if (ownTelArray.length === 0 && profile?.custom_theme && (profile.custom_theme as any).user_telemetry) {
                        const ut = (profile.custom_theme as any).user_telemetry;
                        if (Array.isArray(ut)) {
                          ownTelArray = ut;
                        } else if (ut && typeof ut === 'object') {
                          ownTelArray = [ut];
                        }
                      }

                      const ownTel = ownTelArray[0];
                      const ownHistory = ownTelArray.slice(1);

                      return ownTel ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between border-b border-emerald-100 pb-2 mb-2">
                              <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Live Verbinding Telemetrie
                              </span>
                              <span className="text-[8px] font-bold text-emerald-750 uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">Actief</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[90%] font-mono leading-tight">
                              <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm">
                                <span className="font-bold text-emerald-950 text-[10px] uppercase block mb-1">IP ADRES</span>
                                <span className="text-emerald-700 font-extrabold">{ownTel.ip || 'Onbekend'}</span>
                              </div>
                              <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm">
                                <span className="font-bold text-emerald-950 text-[10px] uppercase block mb-1">CITY / REGIO</span>
                                <span className="text-emerald-700 font-bold">{ownTel.location || 'Onbekend'}</span>
                              </div>
                              {(() => {
                                const osInfo = getDeviceOSInfo(ownTel.device);
                                return (
                                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm col-span-1 sm:col-span-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-emerald-950 text-[10px] uppercase block mb-0.5">BESTURINGSSYSTEEM / APPARAAT</span>
                                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                        <span>{osInfo.icon}</span>
                                        <span>{osInfo.formattedLabel}</span>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${osInfo.badgeClass}`}>
                                      {osInfo.name}
                                    </span>
                                  </div>
                                );
                              })()}
                              {ownTel.org && (
                                <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm col-span-2">
                                  <span className="font-bold text-emerald-950 text-[10px] uppercase block mb-1">PROVIDER / ORG</span>
                                  <span className="text-emerald-800 font-bold truncate block">{ownTel.org}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {ownHistory.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold uppercase text-app-muted tracking-wider block">
                                Recent Verbindingslogboek ({ownHistory.length})
                              </span>
                              <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1 font-mono text-[9px]">
                                {ownHistory.map((hist, idx) => (
                                  <div key={idx} className="bg-app-card border border-app-border rounded-xl p-2.5 flex items-start justify-between gap-3 shadow-xs">
                                    <div className="space-y-0.5 animate-fadeIn">
                                      <div><span className="font-bold text-app-ink uppercase mr-1">IP:</span><span className="text-cyan-600 font-bold">{hist.ip}</span></div>
                                      <div><span className="font-bold text-app-muted uppercase mr-1">LOC:</span><span>{hist.location || 'Onbekend'}</span></div>
                                    </div>
                                    <div className="text-[8px] text-app-muted text-right shrink-0">
                                      <div>{hist.timestamp ? new Date(hist.timestamp).toLocaleDateString('nl-NL') : ''}</div>
                                      <div>{hist.timestamp ? new Date(hist.timestamp).toLocaleTimeString('nl-NL') : ''}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-6 bg-app-bg border border-dashed border-app-border rounded-2xl text-center space-y-2">
                          <ThemedSpinner size="md" color="var(--custom-primary, #06b6d4)" />
                          <p className="text-[11px] font-black text-app-ink uppercase tracking-wider">Bezig met verzamelen van beheerder telemetrie...</p>
                          <p className="text-[10px] text-app-muted">Systeemlogs en audit-data worden gesynchroniseerd</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 2. USERS & WHITELIST TAB */}
              {adminSubTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                  {/* Whitelist Panel */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-app-bg/45 border border-app-border rounded-3xl p-6 space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-app-ink uppercase tracking-tight flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Whitelist Systeem
                        </h4>
                        <p className="text-xs text-app-muted font-medium mt-1">E-mailadressen die op deze lijst staan krijgen direct toegang, inclusief admin rollen.</p>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="email"
                          value={whitelistInput}
                          onChange={(e) => setWhitelistInput(e.target.value)}
                          placeholder="E-mailadres toevoegen..."
                          className="flex-1 px-4 py-2.5 bg-app-card border border-app-border rounded-xl text-xs text-app-ink outline-none"
                        />
                        <button 
                          onClick={handleAddWhitelist}
                          disabled={saving || !whitelistInput.trim()}
                          className="px-5 py-2.5 bg-app-ink text-app-bg rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                        >
                          Toevoegen
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-app-muted" />
                        <input 
                          type="text"
                          value={adminWhitelistSearch}
                          onChange={(e) => setAdminWhitelistSearch(e.target.value)}
                          placeholder="Zoek in whitelist..."
                          className="w-full pl-9 pr-4 py-2 bg-app-bg/40 border border-app-border rounded-lg text-xs text-app-ink outline-none"
                        />
                      </div>

                      {/* Whitelisted list */}
                      {(() => {
                        const filteredWhitelist = whitelist.filter(item => 
                          item.email.toLowerCase().includes(adminWhitelistSearch.toLowerCase())
                        );

                        return (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {filteredWhitelist.length > 0 ? (
                              filteredWhitelist.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 bg-app-card border border-app-border rounded-xl group transition-all hover:bg-app-bg/10">
                                  <span className="text-xs font-bold text-app-ink truncate mr-2">
                                    {isAdmin ? item.email : maskEmail(item.email)}
                                  </span>
                                  <button 
                                    onClick={() => handleRemoveWhitelist(item.email)} 
                                    className="p-1 text-app-muted hover:text-red-500 rounded hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    title="Verwijderen uit whitelist"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-[10px] text-app-muted uppercase font-bold py-4">Geen resultaten gevonden</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Users directory panel */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-app-ink uppercase tracking-tight flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Gebruikerslijst ({users.length})
                        </h4>
                        <p className="text-xs text-app-muted font-medium mt-0.5">Blokkeer of deblokkeer accounts en monitor live IP gegevens.</p>
                      </div>

                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-app-muted/60" />
                        <input 
                          type="text"
                          value={adminUserSearch}
                          onChange={(e) => setAdminUserSearch(e.target.value)}
                          placeholder="Zoek gebruiker..."
                          className="w-full pl-8 pr-4 py-2 bg-app-bg/60 border border-app-border rounded-xl text-xs text-app-ink outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                      {(() => {
                        const filteredUsers = users
                          .filter(u => u.id !== user.uid)
                          .filter(u => 
                            u.display_name?.toLowerCase().includes(adminUserSearch.toLowerCase()) || 
                            u.email?.toLowerCase().includes(adminUserSearch.toLowerCase())
                          );

                        if (filteredUsers.length === 0) {
                          return (
                            <div className="text-center p-8 bg-app-bg/20 border border-app-border border-dashed rounded-2xl">
                              <p className="text-xs font-bold text-app-muted uppercase">Geen gebruikers gevonden die voldoen aan het filter</p>
                            </div>
                          );
                        }

                        return filteredUsers.map(u => {
                          const notesData = parseAdminNotes(u.admin_notes, u.custom_theme);
                          let telArray: any[] = notesData.telemetry;
                          if (telArray.length === 0 && u.custom_theme && (u.custom_theme as any).user_telemetry) {
                            const ut = (u.custom_theme as any).user_telemetry;
                            if (Array.isArray(ut)) {
                              telArray = ut;
                            } else if (ut && typeof ut === 'object') {
                              telArray = [ut];
                            }
                          }

                          const tel = telArray[0];
                          const telHistory = telArray.slice(1);

                          return (
                            <div key={u.id} className="p-4 bg-app-bg/50 border border-app-border rounded-2xl space-y-3 flex flex-col justify-between transition-all hover:bg-app-bg/80 animate-fadeIn">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img 
                                    src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name)}&background=random`} 
                                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-app-border"
                                    alt=""
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-app-ink uppercase tracking-tight truncate flex flex-wrap items-center gap-1.5">
                                      <span>{u.display_name}</span>
                                      {isVerifiedEmail(u) && (
                                        <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_6px_rgba(6,182,212,0.4)]" title="Geverifieerd Account">
                                          <Check className="w-2 h-2 stroke-[4]" />
                                        </span>
                                      )}
                                      {isBetaTester(u) && (
                                        <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                          <FlaskConical className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                                        </span>
                                      )}
                                      {u.role === 'admin' && (
                                        <span className="text-[7.5px] font-extrabold uppercase bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded font-sans border border-emerald-100">Admin</span>
                                      )}
                                      {notesData.banned_until && new Date(notesData.banned_until) > new Date() && (
                                        <span className="text-[7.5px] font-extrabold uppercase bg-amber-500/15 text-amber-600 px-1 py-0.2 rounded font-sans border border-amber-500/20 flex items-center gap-1" title={`Banned tot: ${new Date(notesData.banned_until).toLocaleString('nl-NL')}`}>
                                          <Clock className="w-2 h-2" /> Ban
                                        </span>
                                      )}
                                      {notesData.warnings && Array.isArray(notesData.warnings) && notesData.warnings.filter(Boolean).length > 0 && (
                                        <span className="text-[7.5px] font-extrabold uppercase bg-red-500/15 text-red-600 px-1 py-0.2 rounded font-sans border border-red-500/20 flex items-center gap-1" title={`${notesData.warnings.filter(Boolean).length} waarschuwingen (${notesData.warnings.filter(w => w && !w.read).length} ongelezen)`}>
                                          <AlertTriangle className="w-2 h-2" /> {notesData.warnings.filter(Boolean).length}W
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-app-muted truncate">{u.email}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all w-full sm:w-auto ${
                                      saving ? 'opacity-50 cursor-not-allowed' : ''
                                    } ${
                                      u.is_blocked 
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                                        : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    }`}
                                  >
                                    {saving ? (
                                      <ThemedSpinner size="xs" color="currentColor" />
                                    ) : u.is_blocked ? (
                                      <>
                                        <Check className="w-3 h-3" /> Deblokkeren
                                      </>
                                    ) : (
                                      <>
                                        <UserMinus className="w-3 h-3" /> Blokkeren
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => {
                                      const isLocked = u.name_locked_until && new Date(u.name_locked_until) > new Date();
                                      handleLockUserField(u.id, 'name', !isLocked);
                                    }}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all w-full sm:w-auto ${
                                      saving ? 'opacity-50 cursor-not-allowed' : ''
                                    } ${
                                      u.name_locked_until && new Date(u.name_locked_until) > new Date()
                                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 font-black'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 font-bold'
                                    }`}
                                    title="Vergrendel of ontgrendel de naam van deze gebruiker"
                                  >
                                    <LockIcon className="w-2.5 h-2.5" />
                                    {u.name_locked_until && new Date(u.name_locked_until) > new Date() ? 'Naam Ontgrendelen' : 'Naam Vergrendelen'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      const isLocked = u.bio_locked_until && new Date(u.bio_locked_until) > new Date();
                                      handleLockUserField(u.id, 'bio', !isLocked);
                                    }}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all w-full sm:w-auto ${
                                      saving ? 'opacity-50 cursor-not-allowed' : ''
                                    } ${
                                      u.bio_locked_until && new Date(u.bio_locked_until) > new Date()
                                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 font-black'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 font-bold'
                                    }`}
                                    title="Vergrendel of ontgrendel de bio van deze gebruiker"
                                  >
                                    <LockIcon className="w-2.5 h-2.5" />
                                    {u.bio_locked_until && new Date(u.bio_locked_until) > new Date() ? 'Bio Ontgrendelen' : 'Bio Vergrendelen'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setWarnUserId(u.id);
                                      setWarnDisplayName(u.display_name);
                                      setShowWarnModal(true);
                                    }}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all w-full sm:w-auto ${
                                      saving ? 'opacity-50 cursor-not-allowed' : ''
                                    } bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/25`}
                                    title="Stuur een officiële waarschuwing naar deze gebruiker"
                                  >
                                    <Bell className="w-2.5 h-2.5" /> Waarschuwen
                                  </button>

                                  <button
                                    onClick={() => {
                                      const isUserTempBanned = notesData.banned_until && new Date(notesData.banned_until) > new Date();
                                      if (isUserTempBanned) {
                                        handleTempBanUser(u.id, 0, '');
                                      } else {
                                        setBanUserId(u.id);
                                        setBanDisplayName(u.display_name);
                                        setShowBanModal(true);
                                      }
                                    }}
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all w-full sm:w-auto ${
                                      saving ? 'opacity-50 cursor-not-allowed' : ''
                                    } ${
                                      notesData.banned_until && new Date(notesData.banned_until) > new Date()
                                        ? 'bg-rose-500/15 text-rose-600 border border-rose-500/35 hover:bg-rose-500/25 font-black'
                                        : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/25'
                                    }`}
                                    title={notesData.banned_until && new Date(notesData.banned_until) > new Date() ? 'Hef de tijdelijke ban op' : 'Tijdelijke uitsluiting opleggen'}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {notesData.banned_until && new Date(notesData.banned_until) > new Date() ? 'Ban Opheffen' : 'Tijdelijke Ban'}
                                  </button>
                                </div>
                              </div>

                              {tel ? (
                                <div className="p-3 bg-app-card border border-app-border rounded-xl text-[9.5px] text-app-muted font-mono leading-normal space-y-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
                                    <div>
                                      <span className="font-bold text-app-ink uppercase mr-1">IP:</span> 
                                      <span className="text-cyan-500 font-extrabold">{tel.ip || 'Onbekend'}</span>
                                    </div>
                                    <div>
                                      <span className="font-bold text-app-ink uppercase mr-1">LOC:</span> 
                                      <span className="text-rose-500 font-bold truncate inline-block max-w-[120px] align-bottom">{tel.location || 'Onbekend'}</span>
                                    </div>
                                  </div>

                                  {(() => {
                                    const osInfo = getDeviceOSInfo(tel.device);
                                    return (
                                      <div className="flex items-center justify-between border-t border-app-border/40 pt-1">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span>{osInfo.icon}</span>
                                          <span className="font-bold text-app-ink">{osInfo.formattedLabel}</span>
                                        </div>
                                        <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded ${osInfo.badgeClass}`}>
                                          {osInfo.name}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  {tel.mac_address && (
                                    <div>
                                      <span className="font-bold text-app-ink uppercase mr-1">MAC ADDR:</span> 
                                      <span className="text-amber-500 font-extrabold">{tel.mac_address}</span>
                                    </div>
                                  )}

                                  {tel.org && (
                                    <div className="truncate">
                                      <span className="font-bold text-app-ink uppercase mr-1">ISP:</span> 
                                      <span className="text-emerald-500 font-bold">{tel.org}</span>
                                    </div>
                                  )}

                                  {tel.timestamp && (
                                    <div className="text-[7.5px] opacity-70 mt-1 border-t border-app-border/40 pt-1 flex items-center gap-1">
                                      <span>Laatst ingelogd:</span>
                                      <span>{new Date(tel.timestamp).toLocaleString('nl-NL')}</span>
                                    </div>
                                  )}

                                  {telHistory.length > 0 && (
                                    <div className="mt-2 pt-1.5 border-t border-app-border/45">
                                      <span className="text-[8px] font-extrabold uppercase text-app-ink tracking-wider block mb-1">
                                        Eerdere Sessies ({telHistory.length}):
                                      </span>
                                      <div className="space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                                        {telHistory.map((hist, idx) => (
                                          <div key={idx} className="bg-app-bg/50 border border-app-border rounded p-1 text-[7px] leading-snug flex justify-between gap-1">
                                            <span className="text-cyan-600 font-bold">{hist.ip}</span>
                                            <span className="text-rose-500 truncate max-w-[100px]">{hist.location || 'Onbekend'}</span>
                                            <span className="text-[6.5px] text-app-muted">
                                              {hist.timestamp ? new Date(hist.timestamp).toLocaleDateString('nl-NL') : ''}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 bg-app-card/60 border border-dashed border-app-border rounded-xl text-[8px] text-app-muted italic text-center">
                                  Geen telemetrie actief (deze gebruiker heeft deze appversie nog niet ingelogd)
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SECURITY TAB / TRIGGERS */}
              {adminSubTab === 'security' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Security auditor checklist */}
                  <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Veiligheids Audit Checklist (RLS en Policies)</h4>
                    </div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-tight leading-relaxed">
                      Controleer in je Supabase database console of de volgende beveiligingspolicies correct geconfigureerd zijn:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'profiles RLS: Alleen admins mogen role/is_blocked wijzigen', icon: LockIcon },
                        { label: 'reports RLS: Alleen admins mogen rapportages inzien/verwijderen', icon: Flag },
                        { label: 'whitelist RLS: Alleen admins mogen whitelists beheren', icon: UserPlus },
                        { label: 'threads/posts RLS: Alleen auteurs mogen eigen berichten deleten', icon: Trash2 },
                        { label: 'Cloud SSL: Forceer SSL/HTTPS voor alle instantie-queries', icon: Zap },
                        { label: 'Login limit: Auth rates beveiligd', icon: Activity }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-xs">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <item.icon className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-tight leading-normal">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* SQL Exploit Solution section */}
                    <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-200/60 space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-extrabold text-[10px] uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Cruciaal: PATCH role & block hack dichten</span>
                      </div>
                      <p className="text-[10px] text-rose-700 leading-normal">
                        Zonder triggers kan een slimme ingelogde gebruiker rechtstreeks via REST API zijn eigen profile-role updaten naar <code>admin</code> of zijn <code>is_blocked</code> status wijzigen. Voer deze code uit in de <strong>Supabase SQL Editor</strong> om dit lek permanent te dichten:
                      </p>
                      
                      <div className="relative group">
                        <pre className="p-3 bg-stone-900 text-rose-200 rounded-xl text-[9px] font-mono overflow-x-auto max-h-[160px] custom-scrollbar select-all leading-relaxed whitespace-pre font-medium">
{`-- Voorkom dat gebruikers hun eigen rol of blokkadestatus wijzigen
CREATE OR REPLACE FUNCTION secure_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Controleer of een niet-admin de 'role' of 'is_blocked' wijzigt
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_blocked IS DISTINCT FROM NEW.is_blocked) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'VULNERABILITY DETECTED: Alleen administrators mogen "role" of "is_blocked" wijzigen!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_secure_profile_updates ON public.profiles;
CREATE TRIGGER tr_secure_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION secure_profile_updates();`}
                        </pre>
                      </div>

                      <div className="text-[8.5px] font-bold text-rose-800 uppercase flex justify-between items-center bg-rose-150 p-2 rounded-lg">
                        <span>💡 Tip: Selecteer alles in het code-vak en kopieer direct naar de Supabase Console editor!</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. REPORTS TAB */}
              {adminSubTab === 'reports' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Reports Stats Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider">Open Meldingen</span>
                        <h4 className="text-2xl font-black text-amber-900 mt-1">
                          {reports?.filter(r => r.status === 'open' || r.status === 'pending').length || 0}
                        </h4>
                      </div>
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Flag className="w-5 h-5 text-amber-600 animate-pulse" />
                      </div>
                    </div>

                    <div className="bg-blue-50/40 border border-blue-200/60 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-blue-800 tracking-wider">In Behandeling</span>
                        <h4 className="text-2xl font-black text-blue-900 mt-1">
                          {reports?.filter(r => r.status === 'reviewed').length || 0}
                        </h4>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">Afgehandeld</span>
                        <h4 className="text-2xl font-black text-emerald-900 mt-1">
                          {reports?.filter(r => r.status === 'resolved').length || 0}
                        </h4>
                      </div>
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {/* Reports list wrapper */}
                  <div className="bg-app-card rounded-3xl border border-app-border overflow-hidden">
                    <div className="p-5 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-app-bg/10">
                      <div>
                        <h4 className="text-sm font-black text-app-ink uppercase tracking-tight">Rapportages & Meldingen</h4>
                        <p className="text-[10px] text-app-muted mt-0.5">Overzicht van gerapporteerde berichten, media, of gebruikers.</p>
                      </div>
                      {/* Filter dropdown */}
                      <div className="flex gap-2">
                        <select
                          value={reportFilter}
                          onChange={(e) => setReportFilter(e.target.value as any)}
                          className="px-3 py-1.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink font-bold outline-none"
                        >
                          <option value="all">Alle meldingen</option>
                          <option value="open">Alleen open / pending</option>
                          <option value="reviewed">In behandeling</option>
                          <option value="resolved">Afgehandeld</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-app-border max-h-[600px] overflow-y-auto custom-scrollbar">
                      {filteredReports.length === 0 ? (
                        <div className="p-12 text-center">
                          <Flag className="w-10 h-10 text-app-muted/30 mx-auto mb-3" />
                          <p className="text-xs text-app-muted font-bold uppercase tracking-wider">Geen meldingen gevonden</p>
                          <p className="text-[10px] text-app-muted/80 mt-1">Er zijn momenteel geen meldingen die aan dit filter voldoen.</p>
                        </div>
                      ) : (
                        filteredReports.map((report) => {
                          const reporter = users.find(u => u.id === report.reporter_id);
                          const reportedUser = users.find(u => u.id === report.reported_id);
                          
                          return (
                            <div key={report.id} className="p-5 hover:bg-app-bg/25 transition-colors space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                {/* Left Section: Metadata, target, reason */}
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider border ${
                                      report.status === 'open' || report.status === 'pending'
                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                        : report.status === 'reviewed'
                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                      {report.status}
                                    </span>
                                    <span className="px-2 py-0.5 bg-app-accent/80 text-[9px] font-black uppercase text-app-ink border border-app-border rounded-md tracking-wider">
                                      Type: {report.target_type || (report.reported_post_id ? 'post' : 'overig')}
                                    </span>
                                    {report.target_id && (
                                      <span className="text-[9px] text-app-muted font-mono bg-app-bg/60 px-1 py-0.5 rounded border border-app-border">
                                        Target ID: {report.target_id.substring(0, 8)}...
                                      </span>
                                    )}
                                    <span className="text-[9px] text-app-muted font-mono">{formatDate(report.created_at)}</span>
                                  </div>
                                  
                                  <h5 className="text-xs font-extrabold text-app-ink">
                                    Reden: <span className="text-red-500 font-bold">{report.reason || 'Geen reden opgegeven'}</span>
                                  </h5>

                                  {report.details && (
                                    <p className="text-[11px] text-app-ink/80 bg-app-bg/40 p-2.5 rounded-xl border border-app-border leading-relaxed font-medium">
                                      {report.details}
                                    </p>
                                  )}
                                </div>

                                {/* Right Section: Status controls & action buttons */}
                                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-extrabold text-app-muted uppercase">Status aanpassen:</span>
                                    <select
                                      value={report.status}
                                      onChange={(e) => onUpdateReportStatus?.(report.id, e.target.value)}
                                      className="px-2 py-1 bg-app-bg border border-app-border rounded-lg text-[10px] text-app-ink font-bold outline-none"
                                    >
                                      <option value="open">Open</option>
                                      <option value="pending">Pending</option>
                                      <option value="reviewed">In Behandeling</option>
                                      <option value="resolved">Afgehandeld</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-1">
                                    {onDeleteReport && (
                                      <button
                                        onClick={() => {
                                          onDeleteReport(report.id);
                                        }}
                                        className="px-2.5 py-1 text-[10px] font-black uppercase bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" /> Verwijder
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Connections / Parties Involved */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-app-border/40 text-[10px]">
                                {/* Reporter details */}
                                <div className="bg-app-bg/30 p-2.5 rounded-xl border border-app-border/40 space-y-1">
                                  <span className="font-extrabold text-app-muted uppercase tracking-wider text-[8px]">Melder:</span>
                                  <div className="flex items-center gap-2">
                                    {reporter?.photo_url && (
                                      <img src={reporter.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    )}
                                    <div>
                                      <p className="font-black text-app-ink">{reporter?.display_name || 'Onbekend'}</p>
                                      <p className="text-[8.5px] text-app-muted font-mono">{reporter?.email || 'Geen e-mail'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Reported target details */}
                                <div className="bg-app-bg/30 p-2.5 rounded-xl border border-app-border/40 space-y-1">
                                  <span className="font-extrabold text-app-muted uppercase tracking-wider text-[8px]">Gerapporteerde Partij:</span>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {reportedUser?.photo_url && (
                                        <img src={reportedUser.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                                      )}
                                      <div>
                                        <p className="font-black text-app-ink">{reportedUser?.display_name || 'Onbekend'}</p>
                                        <p className="text-[8.5px] text-app-muted font-mono">{reportedUser?.email || 'Geen e-mail'}</p>
                                      </div>
                                    </div>

                                    {reportedUser && (
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setWarnUserId(reportedUser.id);
                                            setWarnDisplayName(reportedUser.display_name);
                                            setWarnReason('Storend gedrag');
                                            setWarnDetails(`Gerapporteerd in melding: ${report.reason || ''}`);
                                            setShowWarnModal(true);
                                          }}
                                          className="p-1 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                                          title="Waarschuw gebruiker"
                                        >
                                          <Bell className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setBanUserId(reportedUser.id);
                                            setBanDisplayName(reportedUser.display_name);
                                            setBanReasonText(`Tijdelijke verbanning n.a.v. melding ID: ${report.id}`);
                                            setShowBanModal(true);
                                          }}
                                          className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                                          title="Ban gebruiker"
                                        >
                                          <ShieldAlert className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- WARN MODAL --- */}
        <AnimatePresence>
          {showWarnModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-app-ink/40 backdrop-blur-sm"
                onClick={() => !warningSending && setShowWarnModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-app-card rounded-[2rem] shadow-2xl border border-app-border overflow-hidden z-10"
              >
                <div className="p-6 border-b border-app-border flex items-center justify-between bg-amber-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-app-ink uppercase tracking-tight">Gebruiker Waarschuwen</h3>
                      <p className="text-[9px] font-bold text-app-muted uppercase">Bestemming: {warnDisplayName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowWarnModal(false)} 
                    disabled={warningSending}
                    className="p-1.5 hover:bg-amber-100 rounded-full transition-colors text-amber-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[9px] font-extrabold text-app-muted uppercase tracking-wider mb-1.5 ml-1">Reden (Kort)</label>
                    <select 
                      value={warnReason}
                      onChange={(e) => setWarnReason(e.target.value)}
                      className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink font-bold outline-none focus:border-amber-500/50"
                    >
                      <option value="">Selecteer een reden...</option>
                      <option value="Ongepast taalgebruik">Ongepast taalgebruik / Belediging</option>
                      <option value="Spammen of flooden">Spammen of flooden in de chat</option>
                      <option value="Profileren met valse info">Valse profielinformatie / Neppe naam</option>
                      <option value="Storend gedrag">Storend gedrag of treiteren</option>
                      <option value="Misinformatie of complotten">Delen van misinformatie</option>
                      <option value="Overig">Overige reden (Vul hieronder in)</option>
                    </select>
                    {warnReason === 'Overig' && (
                      <input 
                        type="text"
                        placeholder="Specificeer overige reden..."
                        className="w-full mt-2 px-3 py-2 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink outline-none"
                        onChange={(e) => setWarnReason(e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-app-muted uppercase tracking-wider mb-1.5 ml-1">Toelichting / Details</label>
                    <textarea 
                      value={warnDetails}
                      onChange={(e) => setWarnDetails(e.target.value)}
                      placeholder="Geef gedetailleerde toelichting over waarom de gebruiker deze waarschuwing krijgt..."
                      className="w-full px-3 py-3 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink min-h-[100px] resize-none outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => setShowWarnModal(false)}
                      disabled={warningSending}
                      className="flex-1 py-3 bg-app-accent hover:bg-app-border text-app-muted rounded-xl text-xs font-bold transition-all"
                    >
                      Annuleren
                    </button>
                    <button 
                      onClick={submitWarning}
                      disabled={warningSending || !warnReason.trim() || !warnDetails.trim()}
                      className="flex-[2] py-3 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                    >
                      {warningSending ? <ThemedSpinner size="xs" color="#ffffff" /> : <Bell className="w-4 h-4" />}
                      Stuur Waarschuwing
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- TEMP BAN MODAL --- */}
        <AnimatePresence>
          {showBanModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-app-ink/40 backdrop-blur-sm"
                onClick={() => !banSending && setShowBanModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-app-card rounded-[2rem] shadow-2xl border border-app-border overflow-hidden z-10"
              >
                <div className="p-6 border-b border-app-border flex items-center justify-between bg-orange-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-app-ink uppercase tracking-tight">Tijdelijke Ban Opleggen</h3>
                      <p className="text-[9px] font-bold text-app-muted uppercase">Doelwit: {banDisplayName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowBanModal(false)} 
                    disabled={banSending}
                    className="p-1.5 hover:bg-orange-100 rounded-full transition-colors text-orange-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[9px] font-extrabold text-app-muted uppercase tracking-wider mb-1.5 ml-1">Duur van Schorsing</label>
                    <select 
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink font-bold outline-none focus:border-orange-500/50"
                    >
                      <option value="5">5 minuten (testbannen)</option>
                      <option value="60">1 uur</option>
                      <option value="180">3 uur</option>
                      <option value="720">12 uur</option>
                      <option value="1440">1 dag (24 uur)</option>
                      <option value="4320">3 dagen</option>
                      <option value="10080">1 week</option>
                      <option value="43200">30 dagen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-app-muted uppercase tracking-wider mb-1.5 ml-1">Reden voor Schorsing</label>
                    <textarea 
                      value={banReasonText}
                      onChange={(e) => setBanReasonText(e.target.value)}
                      placeholder="Voer de reden in waarom deze gebruiker tijdelijk wordt uitgesloten..."
                      className="w-full px-3 py-3 bg-app-bg border border-app-border rounded-xl text-xs text-app-ink min-h-[100px] resize-none outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => setShowBanModal(false)}
                      disabled={banSending}
                      className="flex-1 py-3 bg-app-accent hover:bg-app-border text-app-muted rounded-xl text-xs font-bold transition-all"
                    >
                      Annuleren
                    </button>
                    <button 
                      onClick={submitTempBan}
                      disabled={banSending || !banReasonText.trim()}
                      className="flex-[2] py-3 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                    >
                      {banSending ? <ThemedSpinner size="xs" color="#ffffff" /> : <Clock className="w-4 h-4" />}
                      Leg Schorsing Op
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CustomFontManagerModal
          isOpen={isFontModalOpen}
          onClose={() => setIsFontModalOpen(false)}
          currentFont={customTheme.font_family}
          onSelectFont={(fontIdOrFamily) => setCustomTheme({ ...customTheme, font_family: fontIdOrFamily })}
          customTheme={customTheme}
          setCustomTheme={setCustomTheme}
        />

        <ModernUICustomizerModal
          isOpen={showModernCustomizer}
          onClose={() => setShowModernCustomizer(false)}
          customTheme={customTheme}
          setCustomTheme={setCustomTheme}
        />
      </div>
    </div>
  );
};
