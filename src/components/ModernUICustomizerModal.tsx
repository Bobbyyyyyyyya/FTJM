import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sliders, 
  Palette, 
  Layout, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Download, 
  Upload, 
  Eye, 
  SunMedium, 
  ShieldCheck, 
  PanelLeft, 
  PanelRight, 
  LayoutList, 
  EyeOff,
  Copy,
  Layers,
  Flame,
  Zap,
  Radio
} from 'lucide-react';
import { ModernUICustomization } from '../types';
import { 
  getAccentHex, 
  getGlassEffectClasses, 
  getRadiusValue, 
  DEFAULT_MODERN_UI_CUSTOM,
  useLocalModernUI,
  resetLocalModernUI
} from '../utils/modernUICustom';
import { toast } from 'sonner';

interface ModernUICustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: ModernUICustomization;
  onUpdate?: (updates: Partial<ModernUICustomization>) => void;
  onReset?: () => void;
  customTheme?: any;
  setCustomTheme?: (theme: any) => void;
  onChangeProfileListPosition?: (pos: 'left' | 'right' | 'sidebar' | 'hidden') => void;
}

type TabType = 'layout' | 'appearance' | 'effects' | 'advanced';

export const ModernUICustomizerModal: React.FC<ModernUICustomizerModalProps> = ({
  isOpen,
  onClose,
  settings: propSettings,
  onUpdate: propOnUpdate,
  onReset: propOnReset,
  customTheme,
  setCustomTheme,
  onChangeProfileListPosition,
}) => {
  const [localSettings, setLocalSettings] = useLocalModernUI();
  const [activeTab, setActiveTab] = useState<TabType>('layout');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const settings = propSettings || localSettings;
  const onUpdate = propOnUpdate || ((updates: Partial<ModernUICustomization>) => {
    setLocalSettings({ ...settings, ...updates });
  });
  const onReset = propOnReset || (() => {
    resetLocalModernUI();
    toast.success('Modern UI hersteld naar standaardwaarden');
  });

  if (!isOpen) return null;

  const activeAccent = getAccentHex(settings, customTheme);

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      toast.success('Modern UI instellingen gekopieerd naar klembord!');
    } catch {
      toast.error('Kon klembord niet openen');
    }
  };

  const handleApplyImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      onUpdate(parsed);
      setShowImportBox(false);
      setImportJsonText('');
      toast.success('Instellingen succesvol geïmporteerd!');
    } catch (e) {
      toast.error('Ongeldige JSON code.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-app-card/95 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-app-card/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all"
                style={{ backgroundColor: `${activeAccent}25`, color: activeAccent }}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-app-ink">Modern UI Customizer</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Lokaal Actief
                  </span>
                </div>
                <p className="text-xs text-app-muted">Personaliseer navigatie, effecten, lay-out en accentkleuren lokaal op dit apparaat.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 py-2 border-b border-white/10 shrink-0 bg-app-accent/30 overflow-x-auto no-scrollbar">
            {[
              { id: 'layout', label: 'Layout & Positie', icon: Layout },
              { id: 'appearance', label: 'Kleur & Stijl', icon: Palette },
              { id: 'effects', label: 'Glas & Effecten', icon: Layers },
              { id: 'advanced', label: 'Beheer & Backup', icon: Zap }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-app-ink text-app-bg shadow-sm' 
                      : 'text-app-muted hover:text-app-ink hover:bg-app-card/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Live Preview Strip */}
          <div className="px-6 py-3 bg-app-accent/20 border-b border-white/10 shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-app-muted" />
              <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Live Voorbeeld:</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sample Live Nav Icon */}
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold transition-all shadow-md"
                style={{ 
                  backgroundColor: activeAccent, 
                  boxShadow: settings.glow_active_items ? `0 0 12px ${activeAccent}80` : undefined,
                  borderRadius: getRadiusValue(settings.card_radius)
                }}
              >
                <Flame className="w-4 h-4" />
              </div>

              {/* Sample Live Badge */}
              <div 
                className="px-3 py-1 text-[11px] font-bold transition-all"
                style={{ 
                  backgroundColor: `${activeAccent}20`, 
                  color: activeAccent,
                  borderColor: `${activeAccent}40`,
                  borderWidth: '1px',
                  borderRadius: getRadiusValue(settings.card_radius)
                }}
              >
                Accent Voorbeeld
              </div>

              {/* Position Pill */}
              <span className="text-[10px] text-app-muted font-mono uppercase bg-app-card/80 px-2 py-0.5 rounded-lg border border-white/10">
                {settings.sidebar_position === 'bottom_dock' ? 'Zwevende Dock' : settings.sidebar_position === 'compact' ? 'Compact' : settings.sidebar_position === 'right' ? 'Rechts' : 'Links'}
              </span>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Unified Theme Integration Notice */}
            <div className="p-3.5 rounded-2xl bg-app-accent/30 border border-white/10 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <p className="text-xs text-app-muted leading-relaxed">
                <strong className="text-app-ink font-bold">Standaard Thema Presets Compatibel:</strong> Alle normale thema presets (Cyberpunk, Midnight, Forest, OLED, etc.) in de algemene Instellingen passen automatisch direct de Modern UI stijl, kleuren en afronding aan.
              </p>
            </div>

            {/* 1. LAYOUT & POSITION TAB */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                {/* Sidebar Position */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-2">
                    Modern Navigatiebalk Positie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'left', label: 'Links (Standaard)', icon: PanelLeft },
                      { id: 'right', label: 'Rechts', icon: PanelRight },
                      { id: 'bottom_dock', label: 'Zwevende Dock', icon: Layout },
                      { id: 'compact', label: 'Compact Mini', icon: LayoutList },
                    ].map(pos => {
                      const Icon = pos.icon;
                      const isSelected = (settings.sidebar_position || 'left') === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => onUpdate({ sidebar_position: pos.id as any })}
                          className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.02]'
                              : 'bg-app-card text-app-ink border-white/10 hover:bg-app-accent/60'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-bold text-center">{pos.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile List Position */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-2">
                    Leden / Profielenlijst Plaatsing
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'right', label: 'Rechts Paneel', icon: PanelRight },
                      { id: 'left', label: 'Links Paneel', icon: PanelLeft },
                      { id: 'sidebar', label: 'In Sidebar', icon: LayoutList },
                      { id: 'hidden', label: 'Verborgen', icon: EyeOff },
                    ].map(pos => {
                      const Icon = pos.icon;
                      const isSelected = (customTheme?.profile_list_position || 'right') === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => {
                            if (onChangeProfileListPosition) {
                              onChangeProfileListPosition(pos.id as any);
                            }
                          }}
                          className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md scale-[1.02]'
                              : 'bg-app-card text-app-ink border-white/10 hover:bg-app-accent/60'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-bold text-center">{pos.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Density */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-2">
                    Lay-out Dichtheid & Afstanden
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'compact', label: 'Compact', desc: 'Minimale marges voor maximale chatruimte' },
                      { id: 'balanced', label: 'Gebalanceerd', desc: 'Optimale verhouding voor dagelijks gebruik' },
                      { id: 'spacious', label: 'Ruim', desc: 'Luchtig en ontspannen met extra ademruimte' },
                    ].map(d => {
                      const isSelected = (settings.density || 'balanced') === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onUpdate({ density: d.id as any })}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md'
                              : 'bg-app-card text-app-ink border-white/10 hover:bg-app-accent/60'
                          }`}
                        >
                          <div className="text-xs font-bold mb-1">{d.label}</div>
                          <div className={`text-[10px] leading-tight ${isSelected ? 'opacity-80' : 'text-app-muted'}`}>{d.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. COLOR & STYLING TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-3">
                    Modern UI Accentkleur
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'theme', label: 'Volg Thema Preset', color: 'transparent' },
                      { id: 'cyan', label: 'Cyber Cyan', color: '#06b6d4' },
                      { id: 'emerald', label: 'Emerald Matrix', color: '#10b981' },
                      { id: 'violet', label: 'Royal Violet', color: '#8b5cf6' },
                      { id: 'amber', label: 'Sunset Amber', color: '#f59e0b' },
                      { id: 'rose', label: 'Rose Quartz', color: '#f43f5e' },
                      { id: 'monochrome', label: 'Slate Titanium', color: '#71717a' },
                      { id: 'custom', label: 'Aangepast HEX', color: settings.custom_accent_color || '#06b6d4' },
                    ].map(acc => {
                      const isSelected = (settings.accent_style || 'theme') === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => onUpdate({ accent_style: acc.id as any })}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-app-ink bg-app-accent/80 shadow-md ring-2 ring-app-ink/20'
                              : 'border-white/10 bg-app-card hover:bg-app-accent/50'
                          }`}
                        >
                          <span 
                            className={`w-5 h-5 rounded-xl shadow-inner border border-white/20 shrink-0 ${acc.id === 'theme' ? 'bg-gradient-to-tr from-purple-500 to-cyan-500' : ''}`}
                            style={acc.id !== 'theme' ? { backgroundColor: acc.color } : {}}
                          />
                          <span className="text-xs font-bold text-app-ink truncate">{acc.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {settings.accent_style === 'custom' && (
                    <div className="mt-4 p-4 rounded-2xl bg-app-accent/40 border border-white/10 flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.custom_accent_color || '#06b6d4'}
                        onChange={(e) => onUpdate({ custom_accent_color: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-app-muted">Custom Hex Kleurcode</label>
                        <input
                          type="text"
                          value={settings.custom_accent_color || '#06b6d4'}
                          onChange={(e) => onUpdate({ custom_accent_color: e.target.value })}
                          className="mt-1 w-full bg-app-card px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono font-bold text-app-ink"
                          placeholder="#06b6d4"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Glowing Active Items Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-app-card border border-white/10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${activeAccent}20`, color: activeAccent }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-app-ink">Lichtgloed op Actieve Iconen</div>
                      <div className="text-[11px] text-app-muted">Laat actieve knoppen zachtjes oplichten met een neon aura.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ glow_active_items: !settings.glow_active_items })}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner p-1 ${
                      settings.glow_active_items ? 'bg-app-ink' : 'bg-app-muted/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      settings.glow_active_items ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {settings.glow_active_items && <Check className="w-2.5 h-2.5 text-app-ink" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 4. GLASS & EFFECTS TAB */}
            {activeTab === 'effects' && (
              <div className="space-y-6">
                {/* Glass Intensity */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-2">
                    Glasmorfisme & Doorzichtigheid
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'none', label: 'Effen / Schoon', desc: 'Geen blur, maximale batterijduur' },
                      { id: 'subtle', label: 'Subtiel Glas', desc: 'Lichte backdrop-filter' },
                      { id: 'frosted', label: 'Frosted Glass', desc: 'Standaard Modern UI matglas' },
                      { id: 'deep', label: 'Diep Atmosferisch', desc: 'Diepe 32px blur met zachte randen' },
                      { id: 'cyber', label: 'Cyber Neon Gloed', desc: 'Gloeiende randen met neon finish' },
                    ].map(g => {
                      const isSelected = (settings.glass_intensity || 'frosted') === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => onUpdate({ glass_intensity: g.id as any })}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md'
                              : 'bg-app-card text-app-ink border-white/10 hover:bg-app-accent/60'
                          }`}
                        >
                          <div className="text-xs font-bold mb-1">{g.label}</div>
                          <div className={`text-[10px] leading-tight ${isSelected ? 'opacity-80' : 'text-app-muted'}`}>{g.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Corner Radius */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-app-muted mb-2">
                    Hoekafronding van Kaarten & Zijbalk
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { id: 'crisp', label: 'Strak', rad: '8px' },
                      { id: 'modern', label: 'Modern', rad: '16px' },
                      { id: 'squircle', label: 'Squircle', rad: '24px' },
                      { id: 'pill', label: 'Volle Pil', rad: '32px' },
                    ].map(r => {
                      const isSelected = (settings.card_radius || 'modern') === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onUpdate({ card_radius: r.id as any })}
                          className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-md'
                              : 'bg-app-card text-app-ink border-white/10 hover:bg-app-accent/60'
                          }`}
                        >
                          <span className="text-xs font-bold">{r.label}</span>
                          <span className="text-[10px] opacity-70 font-mono">{r.rad}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ambient Aura Background */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-app-card border border-white/10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${activeAccent}20`, color: activeAccent }}
                    >
                      <SunMedium className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-app-ink">Sfeervolle Achtergrond Aura</div>
                      <div className="text-[11px] text-app-muted">Zachte gloeiende lichtnevel op de achtergrond die meebeweegt.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ ambient_aura: !settings.ambient_aura })}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner p-1 ${
                      settings.ambient_aura ? 'bg-app-ink' : 'bg-app-muted/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      settings.ambient_aura ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {settings.ambient_aura && <Check className="w-2.5 h-2.5 text-app-ink" />}
                    </div>
                  </button>
                </div>

                {/* Show Offline Users Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-app-card border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-app-accent flex items-center justify-center text-app-ink">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-app-ink">Toon Offline Leden in Ledenlijst</div>
                      <div className="text-[11px] text-app-muted">Schakel uit om alleen momenteel actieve leden weer te geven.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ show_offline_users: !settings.show_offline_users })}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner p-1 ${
                      settings.show_offline_users !== false ? 'bg-app-ink' : 'bg-app-muted/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      settings.show_offline_users !== false ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {settings.show_offline_users !== false && <Check className="w-2.5 h-2.5 text-app-ink" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 5. ADVANCED & BACKUP TAB */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-app-muted mb-2">Lokale Instellingen Beheren</h4>
                  <p className="text-xs text-app-muted leading-relaxed">
                    Al deze voorkeuren worden direct lokaal in je browser opgeslagen. Je kunt ze kopiëren naar een ander apparaat of herstellen.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="p-4 rounded-2xl bg-app-card border border-white/10 hover:bg-app-accent/60 flex items-center gap-3 text-left transition-all"
                  >
                    <div className="p-2.5 rounded-xl bg-app-ink text-app-bg">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-app-ink">Kopieer Configuratie</div>
                      <div className="text-[10px] text-app-muted">Kopieer JSON naar klembord</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportBox(!showImportBox)}
                    className="p-4 rounded-2xl bg-app-card border border-white/10 hover:bg-app-accent/60 flex items-center gap-3 text-left transition-all"
                  >
                    <div className="p-2.5 rounded-xl bg-app-ink text-app-bg">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-app-ink">Importeer JSON</div>
                      <div className="text-[10px] text-app-muted">Plak bestaande instellingen</div>
                    </div>
                  </button>
                </div>

                {showImportBox && (
                  <div className="p-4 rounded-2xl bg-app-card border border-white/10 space-y-3">
                    <label className="block text-xs font-bold text-app-ink">Plak Modern UI JSON</label>
                    <textarea
                      rows={4}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder='{ "sidebar_position": "left", "accent_style": "cyan" ... }'
                      className="w-full bg-app-accent/50 p-3 rounded-xl border border-white/15 text-xs font-mono text-app-ink resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImportBox(false)}
                        className="px-3 py-1.5 text-xs font-bold text-app-muted hover:text-app-ink"
                      >
                        Annuleren
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyImportJson}
                        className="px-4 py-1.5 bg-app-ink text-app-bg rounded-xl text-xs font-bold shadow-md"
                      >
                        Toepassen
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-app-ink">Herstel naar Standaard</div>
                    <div className="text-[10px] text-app-muted">Zet alle Modern UI lokale opties terug naar standaardwaarden.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      toast.success('Modern UI hersteld naar standaard!');
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Herstellen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-app-card/60 shrink-0">
            <div className="text-[11px] text-app-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Wijzigingen worden live opgeslagen</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-app-ink text-app-bg rounded-xl text-xs font-black hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              Klaar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
