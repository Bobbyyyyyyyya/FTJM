import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Bell, Palette, Shield, User as UserIcon, Camera, Save, Loader2, Sparkles, Volume2, Upload, Play, Trash2, ShieldCheck, UserPlus, AlertTriangle, CloudOff, X, Plus, Flag, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, CustomTheme, NotificationSettings } from '../types';
import { SOUND_OPTIONS, PATTERNS } from '../constants';
import { formatDate, convertEmoticons } from '../utils/helpers';
import { User } from '../lib/firebase';

interface SettingsViewProps {
  user: User;
  profile: UserProfile | null;
  settingsTab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app';
  setSettingsTab: (tab: 'profile' | 'notifications' | 'theme' | 'admin' | 'app') => void;
  isAdmin: boolean;
  displayNameInput: string;
  setDisplayNameInput: (input: string) => void;
  photoURLInput: string;
  setPhotoURLInput: (input: string) => void;
  bioInput: string;
  setBioInput: (input: string) => void;
  handleUpdateProfile: () => void;
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
  playSound: (url: string, enabled: boolean) => void;
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
  reports: any[];
  handleDeleteReport: (id: string) => void;
  saving: boolean;
  uploadingSound: boolean;
  showInstallButton: boolean;
  handleInstallClick: () => void;
}

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
  reports,
  handleDeleteReport,
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
                  <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">Profiel Instellingen</h3>
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
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Profielfoto URL</label>
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
                    <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Weergavenaam</label>
                    <input 
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Je naam"
                      className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">E-mailadres (Alleen lezen)</label>
                    <input 
                      type="text"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-app-accent/50 border border-app-border rounded-xl text-sm text-app-muted font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Bio / Status</label>
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
                  <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">Notificaties</h3>
                  <p className="text-app-muted text-sm font-medium">Bepaal hoe en wanneer je meldingen ontvangt.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'enable_sounds', label: 'Geluidssignalen inschakelen' },
                    { id: 'notify_new_posts', label: 'Nieuwe posts in de chat' },
                    { id: 'notify_new_messages', label: 'Nieuwe privéberichten' },
                    { id: 'notify_mentions', label: 'Wanneer je wordt genoemd (@)' }
                  ].map(toggle => (
                    <button
                      key={toggle.id}
                      onClick={() => setNotificationSettings({
                        ...notificationSettings,
                        [toggle.id]: !notificationSettings[toggle.id as keyof NotificationSettings]
                      })}
                      className={`flex items-center justify-center p-4 rounded-2xl border transition-all ${
                        notificationSettings[toggle.id as keyof NotificationSettings]
                          ? 'bg-app-ink text-app-bg border-app-ink shadow-lg scale-[1.02]'
                          : 'bg-app-bg text-app-muted border-app-border hover:border-app-ink/30'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{toggle.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-6 pt-6 border-t border-app-border">
                  <h4 className="text-sm font-black text-app-ink uppercase tracking-widest flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Geluid Voorkeuren
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Bericht Geluid</label>
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
                        className="mt-2 text-[10px] font-black text-app-ink uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Test geluid
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Post Geluid</label>
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
                        className="mt-2 text-[10px] font-black text-app-ink uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Test geluid
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-app-border">
                  <h4 className="text-sm font-black text-app-ink uppercase tracking-widest flex items-center gap-2">
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
                      <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Jouw Geluiden</label>
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
                <div>
                  <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">Thema & Stijl</h3>
                  <p className="text-app-muted text-sm font-medium">Personaliseer je forum ervaring.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                  <div>
                    <h4 className="font-bold text-app-ink">Custom Thema Inschakelen</h4>
                    <p className="text-xs text-app-muted mt-1">Gebruik je eigen kleuren en achtergronden.</p>
                  </div>
                  <button
                    onClick={() => setUseCustomTheme(!useCustomTheme)}
                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
                      useCustomTheme ? 'bg-app-ink' : 'bg-app-muted/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      useCustomTheme ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {useCustomTheme && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Achtergrond Afbeelding (URL)</label>
                        <input 
                          type="text"
                          value={customTheme.wallpaper}
                          onChange={(e) => setCustomTheme({...customTheme, wallpaper: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink transition-all text-sm text-app-ink"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-app-muted uppercase tracking-[0.2em] mb-1 ml-1">X-Positie ({customTheme.wallpaper_x}%)</label>
                            <input type="range" min="0" max="100" value={customTheme.wallpaper_x} onChange={(e) => setCustomTheme({...customTheme, wallpaper_x: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-app-muted uppercase tracking-[0.2em] mb-1 ml-1">Y-Positie ({customTheme.wallpaper_y}%)</label>
                            <input type="range" min="0" max="100" value={customTheme.wallpaper_y} onChange={(e) => setCustomTheme({...customTheme, wallpaper_y: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Patroon Overlay</label>
                        <div className="grid grid-cols-3 gap-2">
                          {PATTERNS.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setCustomTheme({...customTheme, pattern: p.id})}
                              className={`p-2 text-[10px] font-bold rounded-xl border transition-all ${
                                customTheme.pattern === p.id 
                                  ? 'bg-app-ink text-app-bg border-app-ink' 
                                  : 'bg-app-bg text-app-muted border-app-border hover:border-app-ink/30'
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { id: 'primary_color', label: 'Primair' },
                        { id: 'secondary_color', label: 'Secundair' },
                        { id: 'accent_color', label: 'Accent' },
                        { id: 'text_color', label: 'Tekst' },
                        { id: 'card_bg_color', label: 'Kaart BG' },
                        { id: 'sidebar_bg_color', label: 'Sidebar BG' },
                        { id: 'header_bg_color', label: 'Header BG' },
                        { id: 'body_bg_color', label: 'Body BG' }
                      ].map(color => (
                        <div key={color.id}>
                          <label className="block text-[8px] font-black text-app-muted uppercase tracking-[0.2em] mb-1 ml-1">{color.label}</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={customTheme[color.id as keyof CustomTheme] as string} 
                              onChange={(e) => setCustomTheme({...customTheme, [color.id]: e.target.value})}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-app-border cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={customTheme[color.id as keyof CustomTheme] as string} 
                              onChange={(e) => setCustomTheme({...customTheme, [color.id]: e.target.value})}
                              className="flex-1 min-w-0 text-[10px] font-mono bg-app-bg border border-app-border rounded-lg px-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-app-border">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">Glass Effect</label>
                          <button
                            onClick={() => setCustomTheme({...customTheme, glass_effect: !customTheme.glass_effect})}
                            className={`w-10 h-5 rounded-full relative transition-all ${
                              customTheme.glass_effect ? 'bg-app-ink' : 'bg-app-muted/30'
                            }`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
                              customTheme.glass_effect ? 'right-1' : 'left-1'
                            }`} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-app-muted uppercase tracking-widest">
                            <span>Blur ({customTheme.blur_amount}px)</span>
                          </div>
                          <input type="range" min="0" max="40" value={customTheme.blur_amount} onChange={(e) => setCustomTheme({...customTheme, blur_amount: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-app-muted uppercase tracking-widest">
                            <span>Transparantie ({customTheme.opacity}%)</span>
                          </div>
                          <input type="range" min="10" max="100" value={customTheme.opacity} onChange={(e) => setCustomTheme({...customTheme, opacity: parseInt(e.target.value)})} className="w-full accent-app-ink" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">App Instellingen</h3>
                  <p className="text-app-muted text-sm font-medium">Beheer hoe de app op je apparaat werkt.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                  <h4 className="font-bold text-app-ink mb-2">Desktop App Installeren</h4>
                  <p className="text-sm text-app-muted mb-6">
                    Installeer FTJM als een zelfstandige app op je computer of ChromeOS apparaat voor een snellere ervaring en directe toegang vanaf je bureaublad.
                  </p>
                  
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
                  <h4 className="text-xs font-black text-app-muted uppercase tracking-widest mb-2">App Info</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-app-muted">Versie</span>
                      <span className="font-bold text-app-ink">1.7.9.6</span>
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
                    className="w-full mt-4 py-2 bg-app-accent text-app-ink rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-app-accent/80 transition-all"
                  >
                    Controleer op updates
                  </button>
                </div>
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
                  <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">Beheerderspaneel</h3>
                  <p className="text-app-muted text-sm font-medium">Beheer toegang, status en veiligheid.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Whitelist Management */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-app-ink uppercase tracking-widest flex items-center gap-2">
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
                        <span className="text-xs font-bold text-app-ink truncate mr-2">{item.email}</span>
                        <button onClick={() => handleRemoveWhitelist(item.email)} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Status */}
                <div className="space-y-6 pt-8 border-t border-app-border">
                  <h4 className="text-sm font-black text-app-ink uppercase tracking-widest flex items-center gap-2">
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
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                    >
                      Zet Online
                    </button>
                    <button 
                      onClick={() => {
                        setStatusInput('Onderhoud');
                        handleUpdateStatus();
                      }}
                      className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
                    >
                      Zet Onderhoud
                    </button>
                    <button 
                      onClick={() => {
                        setStatusInput('Offline');
                        handleUpdateStatus();
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Zet Offline
                    </button>
                  </div>
                </div>

                {/* Reports Management */}
                <div className="space-y-6 pt-8 border-t border-app-border">
                  <h4 className="text-sm font-black text-app-ink uppercase tracking-widest flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Rapportages ({reports.length})
                  </h4>
                  <div className="space-y-3">
                    {reports.length === 0 ? (
                      <div className="p-10 text-center bg-app-accent/20 rounded-3xl border border-dashed border-app-border">
                        <ShieldCheck className="w-10 h-10 text-app-muted mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-app-muted font-bold uppercase tracking-widest">Geen actieve meldingen</p>
                      </div>
                    ) : (
                      reports.map(report => (
                        <div key={report.id} className="p-5 bg-app-card border border-app-border rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                report.target_type === 'user' ? 'bg-blue-100 text-blue-600' : report.target_type === 'post' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {report.target_type}
                              </span>
                              <span className="text-[10px] font-bold text-app-muted">{formatDate(report.created_at)}</span>
                            </div>
                            <button onClick={() => handleDeleteReport(report.id)} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-app-ink">Rapporteur: <span className="text-app-muted">{report.reporter_name}</span></p>
                          <p className="text-xs font-bold text-app-ink">Doelwit: <span className="text-app-muted">{report.target_name}</span></p>
                          <div className="p-3 bg-app-accent/30 rounded-xl">
                            <p className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-1">Reden: {report.reason}</p>
                            <p className="text-xs text-app-ink italic">"{report.details}"</p>
                          </div>
                        </div>
                      ))
                    )}
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
