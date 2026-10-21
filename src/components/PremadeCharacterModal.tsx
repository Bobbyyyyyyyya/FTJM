import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Search, 
  Check, 
  Dice5, 
  ShieldCheck, 
  Gamepad2, 
  Bot, 
  Cat, 
  Wand2, 
  Glasses, 
  Flame, 
  Filter,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PREMADE_CHARACTERS, CHARACTER_CATEGORIES, PremadeCharacter } from '../data/premadeCharacters';
import { toast } from 'sonner';

interface PremadeCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string | null;
  onSelectCharacter: (avatarUrl: string, characterName: string) => Promise<void> | void;
}

export const PremadeCharacterModal: React.FC<PremadeCharacterModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSelectCharacter
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChar, setSelectedChar] = useState<PremadeCharacter | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Auto pre-select current character when opening modal
  React.useEffect(() => {
    if (isOpen) {
      if (currentPhotoUrl) {
        const currentMatch = PREMADE_CHARACTERS.find(c => c.avatarUrl === currentPhotoUrl);
        if (currentMatch) {
          setSelectedChar(currentMatch);
          setSelectedCategory(currentMatch.category);
        }
      }
    }
  }, [isOpen, currentPhotoUrl]);

  // Handle keyboard shortcuts (Escape to close, Enter to submit)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selectedChar && !isApplying) {
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedChar, isApplying]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PREMADE_CHARACTERS.length };
    PREMADE_CHARACTERS.forEach(char => {
      counts[char.category] = (counts[char.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered characters
  const filteredCharacters = useMemo(() => {
    return PREMADE_CHARACTERS.filter(char => {
      const matchesCategory = selectedCategory === 'all' || char.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Roll random character
  const handleRandomize = () => {
    const list = filteredCharacters.length > 0 ? filteredCharacters : PREMADE_CHARACTERS;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    setSelectedChar(chosen);
    toast.success(`🎲 Willekeurig gekozen: "${chosen.name}"!`);
  };

  // Confirm selection
  const handleApply = async () => {
    if (!selectedChar) return;
    setIsApplying(true);
    try {
      await onSelectCharacter(selectedChar.avatarUrl, selectedChar.name);
      toast.success(`Karakter "${selectedChar.name}" succesvol ingesteld als je profielfoto! 🎉`);
      onClose();
    } catch (err) {
      console.error('Error selecting character:', err);
      toast.error('Kon karakter niet instellen.');
    } finally {
      setIsApplying(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cat': return <Cat className="w-3.5 h-3.5" />;
      case 'Gamepad2': return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'Bot': return <Bot className="w-3.5 h-3.5" />;
      case 'Wand2': return <Wand2 className="w-3.5 h-3.5" />;
      case 'Glasses': return <Glasses className="w-3.5 h-3.5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
            className="relative w-full max-w-4xl bg-zinc-950 text-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh] z-10"
          >
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Header */}
            <div className="relative p-6 sm:p-8 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-fuchsia-500/20 shrink-0 flex items-center justify-center">
                    <div className="w-full h-full bg-zinc-950/80 rounded-[0.9rem] flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-sm">
                        {PREMADE_CHARACTERS.length} Premade Karakters
                      </span>
                      <span className="text-[11px] font-medium text-zinc-400">
                        Geen upload nodig • 100% Direct Actief
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                      Karakter Galerij & Avatar Selector
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-white/10 active:scale-95 shrink-0 cursor-pointer"
                  title="Sluiten (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls Bar: Search + Randomize + Category Pills */}
              <div className="mt-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Zoek een karakter op naam, dier, sci-fi of stijl..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Dice5 className="w-4 h-4 animate-spin-slow" />
                    <span>Kies Willekeurig</span>
                  </button>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {CHARACTER_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat.id;
                    const count = categoryCounts[cat.id] ?? 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/30'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {getCategoryIcon(cat.icon)}
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          active ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid of Characters */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              {filteredCharacters.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto text-zinc-500 border border-white/10">
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">Geen karakters gevonden</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Geen karakters die overeenkomen met "{searchQuery}". Probeer een andere zoekterm of categorie.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Toon Alle Karakters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                  {filteredCharacters.map((char) => {
                    const isSelected = selectedChar?.id === char.id || (currentPhotoUrl === char.avatarUrl && !selectedChar);
                    return (
                      <div
                        key={char.id}
                        onClick={() => setSelectedChar(char)}
                        className={`group relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between border select-none ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/25 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Selected Indicator Check */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/50 z-10 animate-scale-in">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Top Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r ${char.gradient} text-white shadow-sm`}>
                            {char.tag}
                          </span>
                        </div>

                        {/* Avatar Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto my-2 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner">
                          <img 
                            src={char.avatarUrl} 
                            alt={char.name}
                            className="w-full h-full object-cover rounded-xl"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Info */}
                        <div className="text-center mt-2">
                          <h4 className="font-extrabold text-xs sm:text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                            {char.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {char.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="relative p-5 sm:p-6 bg-zinc-900/90 border-t border-white/10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedChar ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedChar.avatarUrl} 
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover border border-cyan-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Geselecteerd:</span>
                        <span className="text-cyan-300">{selectedChar.name}</span>
                      </p>
                      <p className="text-[10px] text-zinc-400">{selectedChar.tag}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Klik op een karakter om te selecteren.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold border border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  Annuleren
                </button>

                <button
                  type="button"
                  disabled={!selectedChar || isApplying}
                  onClick={handleApply}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/25"
                >
                  {isApplying ? (
                    <span>Instellen...</span>
                  ) : (
                    <>
                      <span>Dit Karakter Instellen</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
