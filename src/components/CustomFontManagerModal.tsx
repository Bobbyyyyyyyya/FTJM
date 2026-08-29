import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Upload, 
  Globe, 
  Check, 
  Trash2, 
  X, 
  Plus, 
  Sparkles, 
  Sliders, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  Layers
} from 'lucide-react';
import { CustomFontItem, CustomTheme } from '../types';
import { 
  PRESET_FONTS, 
  getLocalCustomFonts, 
  saveLocalCustomFont, 
  deleteLocalCustomFont, 
  processUploadedFontFile, 
  createGoogleFontItem, 
  injectGoogleFont,
  resolveFontFamilyString
} from '../utils/fontManager';
import { toast } from 'sonner';

interface CustomFontManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFont?: string;
  onSelectFont: (fontIdOrFamily: string) => void;
  customTheme: CustomTheme;
  setCustomTheme: React.Dispatch<React.SetStateAction<CustomTheme>>;
}

export const CustomFontManagerModal: React.FC<CustomFontManagerModalProps> = ({
  isOpen,
  onClose,
  currentFont = 'sans',
  onSelectFont,
  customTheme,
  setCustomTheme
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewText, setPreviewText] = useState('FTJM Forum — Snel, Veilig & Modern 123');
  const [previewSize, setPreviewSize] = useState<number>(18);
  const [localFonts, setLocalFonts] = useState<CustomFontItem[]>(() => getLocalCustomFonts());
  
  // Import tabs & inputs
  const [importTab, setImportTab] = useState<'upload' | 'google'>('upload');
  const [googleFontInput, setGoogleFontInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local fonts when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFonts(getLocalCustomFonts());
    }
  }, [isOpen]);

  // Pre-load all preset fonts when browsing so previews look authentic immediately
  useEffect(() => {
    if (isOpen) {
      PRESET_FONTS.forEach(font => {
        if (font.url) injectGoogleFont(font.url);
      });
      localFonts.forEach(font => {
        if (font.url) injectGoogleFont(font.url);
      });
    }
  }, [isOpen, localFonts]);

  if (!isOpen) return null;

  const allFonts: CustomFontItem[] = [
    ...localFonts,
    ...PRESET_FONTS
  ];

  const categories = [
    { id: 'all', label: 'Alle Lettertypes', count: allFonts.length },
    { id: 'custom', label: 'Mijn Geïmporteerd', count: localFonts.length },
    { id: 'sans', label: 'Modern Sans', count: PRESET_FONTS.filter(f => f.category === 'sans').length },
    { id: 'serif', label: 'Klassiek Serif', count: PRESET_FONTS.filter(f => f.category === 'serif').length },
    { id: 'mono', label: 'Code & Mono', count: PRESET_FONTS.filter(f => f.category === 'mono').length },
    { id: 'display', label: 'Display & Futurism', count: PRESET_FONTS.filter(f => f.category === 'display').length },
    { id: 'retro', label: 'Retro & Pixel', count: PRESET_FONTS.filter(f => f.category === 'retro').length },
    { id: 'script', label: 'Handgeschreven', count: PRESET_FONTS.filter(f => f.category === 'script').length },
  ];

  const filteredFonts = allFonts.filter(font => {
    const matchesCategory = 
      selectedCategory === 'all' || 
      (selectedCategory === 'custom' ? (font.source === 'upload' || font.source === 'google') : font.category === selectedCategory);

    const matchesSearch = 
      font.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      font.family.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const newFont = await processUploadedFontFile(file);
      const updated = getLocalCustomFonts();
      setLocalFonts(updated);
      
      // Update custom theme
      setCustomTheme(prev => ({
        ...prev,
        font_family: newFont.id,
        custom_fonts: updated
      }));
      onSelectFont(newFont.id);
      
      toast.success(`Lettertype "${newFont.name}" succesvol lokaal geïmporteerd en geactiveerd!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Font upload error:', err);
      setUploadError(err.message || 'Fout bij het importeren van het lettertypebestand.');
      toast.error(err.message || 'Fout bij het importeren van het font.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleFontImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleFontInput.trim()) return;

    setUploadError(null);
    try {
      const newFont = createGoogleFontItem(googleFontInput.trim());
      const updated = getLocalCustomFonts();
      setLocalFonts(updated);

      setCustomTheme(prev => ({
        ...prev,
        font_family: newFont.id,
        custom_fonts: updated
      }));
      onSelectFont(newFont.id);

      toast.success(`Google Font "${newFont.name}" succesvol geïmporteerd!`);
      setGoogleFontInput('');
    } catch (err: any) {
      setUploadError('Kon het Google Font niet toevoegen. Controleer de naam of URL.');
      toast.error('Fout bij importeren van Google Font.');
    }
  };

  const handleDeleteCustomFont = (fontId: string, fontName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Weet je zeker dat je het lettertype "${fontName}" wilt verwijderen?`)) {
      const updated = deleteLocalCustomFont(fontId);
      setLocalFonts(updated);
      
      // If deleted font was active, fallback to Inter (sans)
      if (currentFont === fontId) {
        onSelectFont('sans');
        setCustomTheme(prev => ({
          ...prev,
          font_family: 'sans',
          custom_fonts: updated
        }));
      } else {
        setCustomTheme(prev => ({
          ...prev,
          custom_fonts: updated
        }));
      }
      toast.info(`Lettertype "${fontName}" verwijderd.`);
    }
  };

  const isFontActive = (font: CustomFontItem) => {
    if (currentFont === font.id) return true;
    if (currentFont === font.family) return true;
    if (currentFont === 'sans' && font.id === 'inter') return true;
    if (currentFont === 'mono' && font.id === 'jetbrains') return true;
    if (currentFont === 'serif' && font.id === 'playfair') return true;
    if (currentFont === 'display' && font.id === 'plus_jakarta') return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-app-card border border-app-border rounded-3xl w-full max-w-5xl h-[92vh] max-h-[860px] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-app-border flex items-center justify-between bg-app-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-app-ink text-app-bg flex items-center justify-center shadow-md">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-app-ink tracking-tight flex items-center gap-2">
                Lettertype Bibliotheek & Custom Font Importer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-extrabold uppercase tracking-wider border border-cyan-500/20">
                  {allFonts.length} Fonts
                </span>
              </h3>
              <p className="text-xs text-app-muted">
                Kies uit meer dan 28 ingebouwde moderne lettertypes of importeer direct je eigen lokale .ttf / .otf / .woff2 bestanden of Google Fonts.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-app-accent text-app-muted hover:text-app-ink transition-colors cursor-pointer"
            title="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top: Category & Importer Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-app-border p-4 bg-app-bg/30 flex flex-col gap-4 overflow-y-auto shrink-0">
            {/* Category Filter Pills */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-app-muted mb-2 ml-1">
                Categorieën
              </label>
              <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-app-ink text-app-bg shadow-sm scale-[1.01]'
                        : 'text-app-muted hover:text-app-ink hover:bg-app-accent'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      selectedCategory === cat.id
                        ? 'bg-app-bg/20 text-app-bg'
                        : 'bg-app-accent text-app-muted'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Font Importer Box */}
            <div className="mt-auto pt-4 border-t border-app-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Eigen Font Importeren
                </label>
              </div>

              {/* Import Sub-Tabs */}
              <div className="grid grid-cols-2 p-1 bg-app-accent rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportTab('upload')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    importTab === 'upload' ? 'bg-app-card text-app-ink shadow-xs' : 'text-app-muted hover:text-app-ink'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Bestand (.ttf)
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('google')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    importTab === 'google' ? 'bg-app-card text-app-ink shadow-xs' : 'text-app-muted hover:text-app-ink'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Google Font
                </button>
              </div>

              {/* Tab 1: Local File Upload (.ttf, .otf, .woff, .woff2) */}
              {importTab === 'upload' && (
                <div className="space-y-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".ttf,.otf,.woff,.woff2" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full p-4 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/70 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-app-ink">
                        {isUploading ? 'Bezig met inlezen...' : 'Kies of sleep fontbestand'}
                      </p>
                      <p className="text-[10px] text-app-muted mt-0.5">
                        Ondersteunt .ttf, .otf, .woff, .woff2 (max 8MB)
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Tab 2: Google Font Input */}
              {importTab === 'google' && (
                <form onSubmit={handleGoogleFontImport} className="space-y-2">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Bijv. Audiowide, Rubik Glitch..."
                      value={googleFontInput}
                      onChange={(e) => setGoogleFontInput(e.target.value)}
                      className="w-full px-3 py-2 bg-app-card border border-app-border rounded-xl text-xs font-bold text-app-ink placeholder-app-muted focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!googleFontInput.trim()}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Toevoegen & Toepassen
                  </button>
                </form>
              )}

              {uploadError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Search, Live Tester & Grid of Fonts */}
          <div className="flex-1 flex flex-col overflow-hidden bg-app-bg/10">
            {/* Top Toolbar: Search & Live Preview Playground Bar */}
            <div className="p-4 border-b border-app-border bg-app-bg/70 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Zoek lettertype..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-app-card border border-app-border rounded-xl text-xs font-medium text-app-ink placeholder-app-muted focus:outline-none focus:border-app-ink"
                />
              </div>

              {/* Interactive Live Preview Size & Text Controller */}
              <div className="w-full sm:w-auto flex-1 flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Typ een testzin..."
                    className="w-full px-3 py-1.5 bg-app-card border border-app-border rounded-xl text-xs text-app-ink font-medium focus:outline-none"
                    title="Pas de voorbeeldzin aan"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-app-card border border-app-border px-2.5 py-1.5 rounded-xl text-xs font-mono text-app-muted">
                  <span>{previewSize}px</span>
                  <input
                    type="range"
                    min="14"
                    max="32"
                    value={previewSize}
                    onChange={(e) => setPreviewSize(parseInt(e.target.value))}
                    className="w-16 accent-cyan-500 h-1.5 bg-app-accent rounded-full appearance-none cursor-pointer"
                    title="Voorbeeldlettergrootte"
                  />
                </div>
              </div>
            </div>

            {/* Font Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFonts.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center text-app-muted mb-3">
                    <Type className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-app-ink">Geen lettertypes gevonden</p>
                  <p className="text-xs text-app-muted mt-1 max-w-sm">
                    Geen resultaten voor "{searchQuery}". Importeer een nieuw lettertype of wis de zoekopdracht.
                  </p>
                </div>
              ) : (
                filteredFonts.map((font) => {
                  const active = isFontActive(font);
                  const isLocal = font.source === 'upload' || font.source === 'google';

                  return (
                    <motion.div
                      key={font.id}
                      onClick={() => {
                        onSelectFont(font.id);
                        setCustomTheme(prev => ({
                          ...prev,
                          font_family: font.id
                        }));
                        toast.success(`Lettertype ingesteld op "${font.name}"`);
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                        active
                          ? 'border-cyan-500 bg-cyan-500/5 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                          : 'border-app-border bg-app-card hover:border-app-muted/60'
                      }`}
                    >
                      {/* Top Row: Name, Badges & Delete */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-app-ink tracking-tight">
                            {font.name}
                          </span>
                          {font.source === 'upload' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/20">
                              Lokaal Bestand
                            </span>
                          )}
                          {font.source === 'google' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-md border border-blue-500/20">
                              Google Font
                            </span>
                          )}
                          {font.source === 'preset' && (
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-app-accent text-app-muted rounded-md">
                              {font.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isLocal && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomFont(font.id, font.name, e)}
                              className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Lettertype verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {active ? (
                            <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-app-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Check className="w-3.5 h-3.5 text-app-muted" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Live Sample Text Rendered in the Font */}
                      <div className="py-2.5 overflow-hidden">
                        <p
                          style={{
                            fontFamily: font.family,
                            fontSize: `${previewSize}px`,
                            lineHeight: 1.3
                          }}
                          className="text-app-ink select-none truncate transition-all"
                        >
                          {previewText || font.name}
                        </p>
                        <p
                          style={{
                            fontFamily: font.family,
                            fontSize: '11px'
                          }}
                          className="text-app-muted mt-1 tracking-widest uppercase select-none opacity-80"
                        >
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ • 0123456789
                        </p>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="mt-3 pt-2.5 border-t border-app-border/40 flex items-center justify-between text-[10px] text-app-muted">
                        <span className="font-mono truncate max-w-[200px]">
                          {font.family.split(',')[0].replace(/"/g, '')}
                        </span>
                        {active ? (
                          <span className="text-cyan-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" /> Actief Gekozen
                          </span>
                        ) : (
                          <span className="group-hover:text-app-ink transition-colors font-bold">
                            Klik om te activeren →
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border bg-app-bg/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-app-muted flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>
              Actief lettertype: <strong className="text-app-ink">{allFonts.find(f => isFontActive(f))?.name || currentFont}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            Klaar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
