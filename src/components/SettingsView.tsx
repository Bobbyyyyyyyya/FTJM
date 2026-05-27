import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Bell, Palette, Shield, User as UserIcon, Camera, Save, Loader2, Sparkles, Volume2, Upload, Play, Trash2, ShieldCheck, UserPlus, AlertTriangle, CloudOff, X, Plus, Flag, Layout, Activity, Check, Lock as LockIcon, Zap, Moon, Type, Monitor, ShieldAlert, UserMinus, Search, Leaf, Clock, Sun, Link } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, CustomTheme, NotificationSettings, User } from '../types';
import { SOUND_OPTIONS, RINGTONE_OPTIONS, PATTERNS } from '../constants';
import { formatDate, convertEmoticons, maskEmail } from '../utils/helpers';
import { AudioLogsView } from './AudioLogsView';

interface SettingsViewProps {
  user: User;
  profile: UserProfile | null;
  settingsTab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs';
  setSettingsTab: (tab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs') => void;
  isAdmin: boolean;
  displayNameInput: string;
  setDisplayNameInput: (input: string) => void;
  photoURLInput: string;
  setPhotoURLInput: (input: string) => void;
  bioInput: string;
  setBioInput: (input: string) => void;
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
  saving: boolean;
  uploadingSound: boolean;
  showInstallButton: boolean;
  handleInstallClick: () => void;
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
      pattern: 'grid',
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
      border_radius: 16,
      font_family: 'display',
      pattern: 'dots'
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
      border_radius: 0,
      font_family: 'mono'
    }
  }
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  settingsTab,
  setSettingsTab,
  isAdmin,
  displayNameInput,
  setDisplayNameInput,
  photoURLInput,
  setPhotoURLInput,
  bioInput,
  setBioInput,
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
  saving,
  uploadingSound,
  showInstallButton,
  handleInstallClick
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Settings Sidebar */}
      <div className="lg:col-span-1 space-y-2">
        {[
          { id: 'profile', icon: UserCog, label: 'Profiel' },
          { id: 'notifications', icon: Bell, label: 'Notificaties' },
          { id: 'theme', icon: Palette, label: 'Thema' },
          { id: 'app', icon: Layout, label: 'App' },
          { id: 'audiologs', icon: Activity, label: 'Audio Logs' },
          ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Beheer' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id as any)}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
              settingsTab === tab.id 
                ? 'bg-app-ink text-app-bg shadow-lg shadow-app-ink/10' 
                : 'text-app-muted hover:bg-app-accent hover:text-app-ink'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
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
                    {(photoURLInput || profile?.photo_url || user.photoURL) ? (
                      <img 
                        src={photoURLInput || profile?.photo_url || user.photoURL || ''} 
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
                        <a 
                          href="https://www.image2url.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-cyan-500 hover:text-cyan-400 font-bold transition-colors uppercase tracking-wider flex items-center gap-1 ml-1 sm:ml-0"
                        >
                          <Link className="w-3 h-3" /> Foto uploaden (image2url.com)
                        </a>
                      </div>
                      <input 
                        type="text"
                        value={photoURLInput}
                        onChange={(e) => setPhotoURLInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink"
                      />
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
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Weergavenaam</label>
                    <input 
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Je naam"
                      className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold"
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
                  <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Bio / Status</label>
                  <textarea 
                    value={bioInput}
                    onChange={(e) => setBioInput(convertEmoticons(e.target.value))}
                    placeholder="Vertel iets over jezelf..."
                    className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink min-h-[120px] resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-app-border flex justify-end">
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Profiel Opslaan
                  </button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input 
                        type="text"
                        value={newSoundName}
                        onChange={(e) => setNewSoundName(e.target.value)}
                        placeholder="Naam geluid"
                        className="px-4 py-3 bg-app-card border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink transition-all"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newSoundUrl}
                          onChange={(e) => setNewSoundUrl(e.target.value)}
                          placeholder="Directe URL (mp3/wav)"
                          className="flex-1 px-4 py-3 bg-app-card border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink transition-all"
                        />
                        <button 
                          onClick={() => playSound(newSoundUrl, true)}
                          disabled={!newSoundUrl.startsWith('http')}
                          className="p-3 bg-app-ink text-app-bg rounded-xl hover:opacity-90 disabled:opacity-30 transition-all"
                          title="Test URL"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddCustomSound}
                      disabled={uploadingSound || !newSoundName || !newSoundUrl}
                      className="w-full py-3 bg-app-ink text-app-bg rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {uploadingSound ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Geluid Toevoegen
                    </button>
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

                <div className="pt-6 border-t border-app-border flex justify-end">
                  <button 
                    onClick={handleUpdateNotifications}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Instellingen Opslaan
                  </button>
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
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wide">Custom Theme</span>
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

              {!useCustomTheme ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-app-accent/50 rounded-full flex items-center justify-center mx-auto">
                    <Monitor className="w-10 h-10 text-app-muted" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-app-ink uppercase tracking-tight">Standaard Thema Actief</h4>
                    <p className="text-sm text-app-muted max-w-xs mx-auto">Activeer 'Custom Theme' bovenaan om je eigen kleuren en achtergronden in te stellen.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* Theme Presets */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Quick Presets
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      {Object.entries(THEME_PRESETS).map(([id, preset]) => (
                        <button
                          key={id}
                          onClick={() => setCustomTheme(preset.theme)}
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
                        <h4 className="text-xs font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                          <Type className="w-4 h-4" /> Typography & Shapes
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide ml-1">Font Family</label>
                            <select 
                              value={customTheme.font_family || 'sans'}
                              onChange={(e) => setCustomTheme({...customTheme, font_family: e.target.value as any})}
                              className="w-full px-3 py-2 bg-app-card border border-app-border rounded-xl text-xs font-bold text-app-ink"
                            >
                              <option value="sans">Modern Sans</option>
                              <option value="serif">Classic Serif</option>
                              <option value="mono">Technical Mono</option>
                              <option value="display">Display Grotesk</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[8px] font-bold text-app-muted uppercase tracking-wide ml-1">Corner Rounding ({customTheme.border_radius || 12}px)</label>
                            <input 
                              type="range" 
                              min="0" 
                              max="40" 
                              value={customTheme.border_radius || 12} 
                              onChange={(e) => setCustomTheme({...customTheme, border_radius: parseInt(e.target.value)})} 
                              className="w-full accent-app-ink h-2 bg-app-accent rounded-full appearance-none cursor-pointer"
                            />
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
                      </div>

                      {/* Wallpaper & Pattern */}
                      <div className="p-6 bg-app-bg rounded-2xl border border-app-border space-y-6">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2 ml-1">Wallpaper Backdrop</label>
                          <input 
                            type="text"
                            value={customTheme.wallpaper || ''}
                            onChange={(e) => setCustomTheme({...customTheme, wallpaper: e.target.value})}
                            placeholder="Direct Image URL (png/jpg/webp)"
                            className="w-full px-4 py-3 bg-app-card border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink"
                          />
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
                <button 
                  onClick={handleUpdateTheme}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-app-ink text-app-bg rounded-2xl font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-all shadow-xl active:scale-95 group"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  Confirm Customization
                </button>
              </div>
            </motion.div>
          )}


          {settingsTab === 'app' && (
            <motion.div
              key="app-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center">
                  <Layout className="w-8 h-8 text-app-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">App Instellingen</h3>
                  <p className="text-app-muted text-sm font-medium">Beheer hoe de app op je apparaat werkt.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                  <h4 className="font-bold text-app-ink mb-2">Desktop App Installeren</h4>
                  <p className="text-sm text-app-muted mb-4">
                    Installeer FTJM als een zelfstandige app op je computer of ChromeOS apparaat voor een snellere ervaring en directe toegang vanaf je bureaublad.
                  </p>
                  
                  <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                      Belangrijk: Zorg ervoor dat pop-ups zijn toegestaan in je browser voor een optimale werking van de app en verificaties.
                    </p>
                  </div>
                  
                  {showInstallButton ? (
                    <button 
                      onClick={handleInstallClick}
                      className="w-full py-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Nu Installeren
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5" />
                      <p className="text-xs font-bold">De app is al geïnstalleerd of je browser ondersteunt dit momenteel niet.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-app-accent/10 rounded-3xl border border-app-border border-dashed">
                  <h4 className="text-xs font-bold text-app-muted uppercase tracking-wide mb-2">App Info</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-app-muted">Versie</span>
                      <span className="font-bold text-app-ink">1.8.0</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-app-muted">Platform</span>
                      <span className="font-bold text-app-ink">Progressive Web App</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistration().then(reg => {
                          if (reg) {
                            reg.update().then(() => {
                              toast.success('Gecontroleerd op updates', {
                                description: 'Als er een update is, verschijnt er zo een melding.'
                              });
                            });
                          }
                        });
                      }
                    }}
                    className="w-full mt-4 py-2 bg-app-accent text-app-ink rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-app-accent/80 transition-all"
                  >
                    Controleer op updates
                  </button>
                </div>
              </div>
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
          )}

          {settingsTab === 'admin' && isAdmin && (
            <motion.div
              key="admin-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm space-y-10"
            >
              <div className="flex items-center gap-4 border-b border-app-border pb-6">
                <div className="w-16 h-16 bg-app-ink rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-app-bg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-app-ink uppercase tracking-tight">Beheerderspaneel</h3>
                  <p className="text-app-muted text-sm font-medium">Beheer toegang, status en veiligheid.</p>
                </div>
              </div>

              {/* Security Auditor Checklist */}
              <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-200/50 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Veiligheids Audit Checklist</h4>
                </div>
                <p className="text-[10px] font-bold text-emerald-800 opacity-80 leading-relaxed uppercase tracking-tight">
                  Controleer in je Supabase Dashboard of de volgende Row Level Security (RLS) policies actief zijn voor maximale veiligheid.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'profiles: Alleen admins mogen role/is_blocked wijzigen', icon: LockIcon },
                    { label: 'reports: Alleen admins mogen rapportages inzien/verwijderen', icon: Flag },
                    { label: 'whitelist: Alleen admins mogen whitelists beheren', icon: UserPlus },
                    { label: 'threads/posts: Alleen auteurs mogen hun eigen berichten verwijderen', icon: Trash2 },
                    { label: 'Database: Forceer SSL/HTTPS voor alle verbindingen', icon: Zap },
                    { label: 'Auth: Rate limiting ingeschakeld voor inlogpogingen', icon: Activity }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-emerald-100">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-emerald-600" />
                       </div>
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-tight leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {/* Whitelist Management */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Whitelist Beheer
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={whitelistInput}
                      onChange={(e) => setWhitelistInput(e.target.value)}
                      placeholder="E-mailadres toevoegen..."
                      className="flex-1 px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink"
                    />
                    <button 
                      onClick={handleAddWhitelist}
                      disabled={saving || !whitelistInput.trim()}
                      className="px-6 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                    >
                      Toevoegen
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {whitelist.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-app-bg border border-app-border rounded-xl group">
                        <span className="text-xs font-bold text-app-ink truncate mr-2">
                          {isAdmin ? item.email : maskEmail(item.email)}
                        </span>
                        <button onClick={() => handleRemoveWhitelist(item.email)} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Blocking Management */}
                <div className="space-y-6 pt-8 border-t border-app-border">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Gebruikersbeheer
                    </h4>
                    <div className="flex flex-col gap-2 p-3 bg-app-accent rounded-2xl border border-app-border mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-app-muted">Jouw Rol</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{profile?.role || 'User'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-app-muted">Whitelist Status</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Actief</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      Let op: RLS in Supabase moet een Admin-policy hebben op de 'profiles' tabel om anderen te kunnen blokkeren. 
                      Als het blokkeren mislukt, wordt de gebruiker als fallback alleen uit de whitelist verwijderd.
                    </p>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {users.filter(u => u.id !== user.uid).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-app-bg border border-app-border rounded-2xl">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name)}&background=random`} 
                            className="w-10 h-10 rounded-xl object-cover"
                            alt=""
                          />
                          <div>
                            <p className="text-xs font-bold text-app-ink uppercase tracking-tight">{u.display_name}</p>
                            <p className="text-[10px] font-bold text-app-muted">{u.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                          disabled={saving}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
                            saving ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            u.is_blocked 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {saving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
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
                      </div>
                    ))}
                  </div>
                </div>
                {/* System Status */}
                <div className="space-y-6 pt-8 border-t border-app-border">
                  <h4 className="text-sm font-bold text-app-ink uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Systeem Status
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      placeholder={websiteStatus}
                      className="flex-1 px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink"
                    />
                    <button 
                      onClick={handleUpdateStatus}
                      disabled={saving || !statusInput.trim()}
                      className="px-6 py-3 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                    >
                      Update Status
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setStatusInput('Online');
                        handleUpdateStatus();
                      }}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-100 transition-all"
                    >
                      Zet Online
                    </button>
                    <button 
                      onClick={() => {
                        setStatusInput('Onderhoud');
                        handleUpdateStatus();
                      }}
                      className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-amber-100 transition-all"
                    >
                      Zet Onderhoud
                    </button>
                    <button 
                      onClick={() => {
                        setStatusInput('Offline');
                        handleUpdateStatus();
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-red-100 transition-all"
                    >
                      Zet Offline
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
