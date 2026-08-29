import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Clock, MessageSquare, History, ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import { CustomTheme } from '../types';
import { hexToRgba } from '../utils/helpers';

export type FeedSortOption = 'recommended' | 'latest' | 'popular' | 'discussed' | 'oldest';

interface FeedSortDropdownProps {
  sortOption: FeedSortOption;
  onChangeSortOption: (option: FeedSortOption) => void;
  useCustomTheme?: boolean;
  customTheme?: CustomTheme;
}

interface SortOptionDef {
  id: FeedSortOption;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  badgeBg: string;
}

const SORT_OPTIONS: SortOptionDef[] = [
  {
    id: 'recommended',
    label: 'Voor Jou (Algoritme)',
    shortLabel: 'Voor Jou',
    description: 'Slimme mix van likes, recente activiteit en reacties',
    icon: Sparkles,
    iconColor: 'text-cyan-500',
    badgeBg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
  },
  {
    id: 'popular',
    label: 'Populair',
    shortLabel: 'Populair',
    description: 'Meeste likes & interacties als eerste',
    icon: Flame,
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  {
    id: 'latest',
    label: 'Nieuwste',
    shortLabel: 'Nieuwste',
    description: 'Meest recente uploads bovenaan',
    icon: Clock,
    iconColor: 'text-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  {
    id: 'discussed',
    label: 'Meest Besproken',
    shortLabel: 'Besproken',
    description: 'Media met de meeste community reacties',
    icon: MessageSquare,
    iconColor: 'text-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  {
    id: 'oldest',
    label: 'Oudste Eerst',
    shortLabel: 'Oudste',
    description: 'Klassieke en eerste uploads van de feed',
    icon: History,
    iconColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
];

export const FeedSortDropdown: React.FC<FeedSortDropdownProps> = ({
  sortOption,
  onChangeSortOption,
  useCustomTheme,
  customTheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find(opt => opt.id === sortOption) || SORT_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: FeedSortOption) => {
    onChangeSortOption(option);
    setIsOpen(false);
    try {
      localStorage.setItem('ftjm_feed_sort_option', option);
    } catch {}
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-app-card border border-app-border hover:border-app-ink/30 text-app-ink shadow-sm transition-all duration-200 cursor-pointer active:scale-95 ${
          isOpen ? 'ring-2 ring-cyan-500/40 border-cyan-500/50' : ''
        } ${useCustomTheme && customTheme?.glass_effect ? 'custom-glass' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 text-xs font-black text-app-muted">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Sorteren:</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-app-accent/60 font-bold text-xs">
          <ActiveIcon className={`w-3.5 h-3.5 ${activeOption.iconColor}`} />
          <span className="text-app-ink font-black">{activeOption.shortLabel}</span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-app-muted transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-app-ink' : 'group-hover:text-app-ink'
          }`}
        />
      </button>

      {/* Floating Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] z-50 p-2 bg-app-card/95 backdrop-blur-2xl rounded-3xl border border-app-border shadow-2xl overflow-hidden ${
              useCustomTheme && customTheme?.glass_effect ? 'custom-glass' : ''
            }`}
            style={
              useCustomTheme && !customTheme?.glass_effect && customTheme?.card_bg_color
                ? {
                    backgroundColor: hexToRgba(customTheme.card_bg_color, 0.95),
                    borderColor: hexToRgba(customTheme.card_bg_color, 0.25)
                  }
                : {}
            }
          >
            <div className="px-3 py-2 border-b border-app-border/60 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-app-muted">
                Kies sorteervolgorde
              </span>
              <span className="text-[9px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">
                Live Feed
              </span>
            </div>

            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = opt.id === sortOption;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-app-ink text-app-bg shadow-sm'
                        : 'hover:bg-app-accent/70 text-app-ink'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-app-bg text-app-ink border-white/20'
                          : `${opt.badgeBg} border`
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-app-ink' : opt.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-black truncate ${isSelected ? 'text-app-bg' : 'text-app-ink'}`}>
                          {opt.label}
                        </p>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </div>
                      <p
                        className={`text-[10px] line-clamp-1 mt-0.5 leading-tight ${
                          isSelected ? 'text-app-bg/80' : 'text-app-muted'
                        }`}
                      >
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
