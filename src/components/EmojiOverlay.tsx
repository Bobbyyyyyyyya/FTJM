import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock } from 'lucide-react';
import { EMOJI_CATEGORIES } from '../constants';

interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiOverlayProps {
  show: boolean;
  results: EmojiItem[];
  position: { top: number, left: number } | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  mode?: 'picker' | 'suggestion';
}

export const EmojiOverlay: React.FC<EmojiOverlayProps> = ({
  show,
  results,
  position,
  onSelect,
  onClose,
  mode = 'picker'
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');
  const [recents, setRecents] = useState<EmojiItem[]>(() => {
    const saved = localStorage.getItem('app-recent-emojis');
    return saved ? JSON.parse(saved) : [];
  });

  const filteredEmojis = useMemo(() => {
    if (mode === 'suggestion') return results;

    if (!search) {
      if (activeCategory === 'recent') {
        return recents.length > 0 ? recents : EMOJI_CATEGORIES[0].emojis.slice(0, 36);
      }
      const category = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return category ? category.emojis : [];
    }

    const searchLower = search.toLowerCase();
    const allEmojis = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
    
    return allEmojis.filter(item => 
      item.name.toLowerCase().includes(searchLower) || 
      item.keywords.some(k => k.toLowerCase().includes(searchLower))
    ).slice(0, 50);
  }, [search, activeCategory, recents, results, mode]);

  const handleEmojiSelectInternal = (item: EmojiItem) => {
    onSelect(item.emoji);
    
    // Save to recents
    const newRecents = [item, ...recents.filter(r => r.emoji !== item.emoji)].slice(0, 36);
    setRecents(newRecents);
    localStorage.setItem('app-recent-emojis', JSON.stringify(newRecents));
    
    if (mode === 'picker') {
      onClose();
    }
  };

  if (!show || !position) return null;

  // Suggestion Mode UI (Vertical list)
  if (mode === 'suggestion' && results.length > 0) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[100]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bg-app-card border border-app-border rounded-xl shadow-xl overflow-hidden min-w-[150px] max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col"
            style={{ 
              top: position.top, 
              left: position.left,
              transform: 'translateY(-100%) translateY(-10px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {results.map((item, index) => (
              <button
                key={`${item.emoji}-${index}`}
                onClick={() => handleEmojiSelectInternal(item)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-app-accent transition-colors text-left"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-xs font-semibold text-app-muted">:{item.name}:</span>
              </button>
            ))}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden w-[280px] flex flex-col h-[320px]"
          style={{ 
            top: position.top, 
            left: Math.min(position.left, window.innerWidth - 300),
            transform: 'translateY(-100%) translateY(-10px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Search */}
          <div className="p-2 border-b border-app-border bg-app-accent/5">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted group-focus-within:text-app-ink transition-colors" />
              <input 
                autoFocus
                type="text"
                placeholder="Zoek emoji..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-app-accent border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-app-muted/10 outline-none transition-all placeholder:text-app-muted"
              />
            </div>
          </div>

          {/* Category Tabs */}
          {!search && (
            <div className="flex items-center gap-1 p-2 border-b border-app-border overflow-x-auto no-scrollbar bg-app-accent/10">
              <button
                onClick={() => setActiveCategory('recent')}
                className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  activeCategory === 'recent' 
                  ? 'bg-app-card shadow-sm border border-app-border scale-110' 
                  : 'hover:bg-app-accent text-app-muted'
                }`}
                title="Recent"
              >
                <Clock className="w-5 h-5" />
              </button>
              {EMOJI_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all text-xl ${
                    activeCategory === category.id 
                    ? 'bg-app-card shadow-sm border border-app-border scale-110' 
                    : 'hover:bg-app-accent grayscale'
                  }`}
                  title={category.name}
                >
                  {category.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {search ? (
              <div className="mb-2 px-2">
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Zoekresultaten</p>
              </div>
            ) : (
              <div className="mb-2 px-2">
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                  {activeCategory === 'recent' ? 'Recent Gebruikt' : EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.name}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-6 gap-1">
              {filteredEmojis.map((item, index) => (
                <button
                  key={`${item.emoji}-${index}`}
                  onClick={() => handleEmojiSelectInternal(item)}
                  className="flex items-center justify-center aspect-square w-full hover:bg-app-accent rounded-xl transition-all text-2xl group active:scale-90"
                  title={item.name}
                >
                  <span className="group-hover:scale-125 transition-transform">{item.emoji}</span>
                </button>
              ))}
            </div>

            {filteredEmojis.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-app-muted space-y-2 opacity-50">
                <Search className="w-8 h-8" />
                <p className="text-sm font-medium">Geen emoji gevonden...</p>
              </div>
            )}
          </div>


        </motion.div>
      </div>
    </AnimatePresence>
  );
};
