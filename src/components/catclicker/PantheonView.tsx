import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, X, Lock } from 'lucide-react';
import { t } from '../../utils/translations';

export interface PantheonSlots {
  diamond: string | null;
  ruby: string | null;
  jade: string | null;
}

export interface SpiritDeity {
  id: string;
  name: string;
  title: string;
  emoji: string;
  quote: string;
  description: string;
  diamondEffect: string;
  rubyEffect: string;
  jadeEffect: string;
}

export const PANTHEON_SPIRITS: SpiritDeity[] = [
  {
    id: 'mokalsium',
    name: 'Mokalsium',
    title: 'Moeder der Melkkatten',
    emoji: '🥛',
    quote: '"Vloei voort, witte nectar van het universum."',
    description: 'Versterkt alle passieve brokjesproductie door goddelijke melkstromen.',
    diamondEffect: '+25% Totale Passieve TPS',
    rubyEffect: '+15% Totale Passieve TPS',
    jadeEffect: '+8% Totale Passieve TPS'
  },
  {
    id: 'rigidel',
    name: 'Rigidel',
    title: 'De Kosmische Garen Wever',
    emoji: '🧶',
    quote: '"Tijd is slechts een wollen draad die wacht om afgerold te worden."',
    description: 'Laat magische Gouden en Regenboog Garenbollen sneller verschijnen.',
    diamondEffect: 'Garenbollen verschijnen 40% sneller',
    rubyEffect: 'Garenbollen verschijnen 25% sneller',
    jadeEffect: 'Garenbollen verschijnen 12% sneller'
  },
  {
    id: 'skruukie',
    name: 'Skruukie',
    title: 'De Hongerige Klauw',
    emoji: '🐾',
    quote: '"Geen aai blijft onbeloond, geen brokje onaangeroerd."',
    description: 'Verhoogt klikkracht enorm en zorgt dat de spinteller sneller volloopt.',
    diamondEffect: '+60% Klikkracht & 50% sneller Spinnen',
    rubyEffect: '+35% Klikkracht & 30% sneller Spinnen',
    jadeEffect: '+18% Klikkracht & 15% sneller Spinnen'
  },
  {
    id: 'vomitrax',
    name: 'Vomitrax',
    title: 'De Hyperactieve Kat',
    emoji: '⚡',
    quote: '"Waarom rusten als je met lichtsnelheid door de gang kan rennen?!"',
    description: 'Verlengt de tijdsduur van Frenzy, Klik Frenzy en Karper Vloedgolven.',
    diamondEffect: 'Alle tijdelijke buffs duren +75% langer',
    rubyEffect: 'Alle tijdelijke buffs duren +40% langer',
    jadeEffect: 'Alle tijdelijke buffs duren +20% langer'
  },
  {
    id: 'jeremy',
    name: 'Jeremy',
    title: 'De Diepzee Karper Kat',
    emoji: '🐟',
    quote: '"In de diepste nevels glinsteren de sappigste vissen."',
    description: 'Vergroot de brokjesbeloning van Mystieke Muizen en Kosmische Karpers.',
    diamondEffect: 'Muis & Karper beloningen 3.0x zo hoog',
    rubyEffect: 'Muis & Karper beloningen 2.0x zo hoog',
    jadeEffect: 'Muis & Karper beloningen 1.5x zo hoog'
  },
  {
    id: 'muridal',
    name: 'Muridal',
    title: 'De Siësta Meester',
    emoji: '😴',
    quote: '"Slaap zacht, kleine kat. De brokjes stapelen zich vanzelf op."',
    description: 'Verhoogt brokjesproductie tijdens inactieve en offline momenten.',
    diamondEffect: '+50% Offline & Inactieve brokjes',
    rubyEffect: '+30% Offline & Inactieve brokjes',
    jadeEffect: '+15% Offline & Inactieve brokjes'
  }
];

interface PantheonViewProps {
  templeCount: number;
  slots: PantheonSlots;
  onAssignSlot: (slot: 'diamond' | 'ruby' | 'jade', spiritId: string | null) => void;
  onOpenStore: () => void;
}

export const PantheonView: React.FC<PantheonViewProps> = ({
  templeCount,
  slots,
  onAssignSlot,
  onOpenStore
}) => {
  const isUnlocked = templeCount >= 1;

  if (!isUnlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4 text-amber-500 animate-pulse">
          🏛️
        </div>
        <h3 className="text-base font-black text-app-ink mb-1.5 font-mono">
          Het Katten Tempel Pantheon
        </h3>
        <p className="text-xs text-app-muted max-w-sm mb-4 leading-relaxed">
          Bouw minimaal <span className="text-amber-500 font-bold">1 Katten Tempel</span> in de winkel om de 6 heilige Katten Geesten te ontwaken en in te wijden in je heiligdom.
        </p>
        <button
          onClick={onOpenStore}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>🛒</span>
          <span>Open Katten Winkel</span>
        </button>
      </div>
    );
  }

  const getSpirit = (id: string | null) => PANTHEON_SPIRITS.find(s => s.id === id);

  const isSpiritSlotted = (id: string) => {
    return slots.diamond === id || slots.ruby === id || slots.jade === id;
  };

  const getSlotForSpirit = (id: string): 'diamond' | 'ruby' | 'jade' | null => {
    if (slots.diamond === id) return 'diamond';
    if (slots.ruby === id) return 'ruby';
    if (slots.jade === id) return 'jade';
    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏛️</span>
            <h3 className="text-sm font-black text-app-ink tracking-tight font-mono">
              Het Katten Tempel Pantheon
            </h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              3 Heilige Slots
            </span>
          </div>
          <p className="text-[11px] text-app-muted leading-relaxed">
            Wijs Katten Geesten toe aan de heiligdom-slots voor krachtige permanente effecten.
          </p>
        </div>
      </div>

      {/* 3 Pantheon Worship Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Diamond Slot */}
        <div className="p-3 rounded-2xl border-2 border-cyan-400/50 bg-cyan-950/20 dark:bg-cyan-950/30 flex flex-col justify-between relative shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">💎</span>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider font-mono">
                Diamant Slot
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded-md">
              100% Kracht
            </span>
          </div>

          {slots.diamond ? (
            (() => {
              const spirit = getSpirit(slots.diamond)!;
              return (
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{spirit.emoji}</span>
                    <button
                      onClick={() => onAssignSlot('diamond', null)}
                      className="p-1 text-cyan-400 hover:text-red-400 rounded-lg hover:bg-black/20 transition-all cursor-pointer"
                      title="Verwijder uit slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-cyan-200">{spirit.name}</span>
                  <span className="text-[11px] text-cyan-300 font-bold mt-1">
                    {spirit.diamondEffect}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="h-20 rounded-xl border border-dashed border-cyan-400/40 flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs text-cyan-400/80 font-bold">Leeg Diamant Slot</span>
              <span className="text-[10px] text-cyan-400/60 mt-0.5">Klik hieronder op een Katten Geest</span>
            </div>
          )}
        </div>

        {/* Ruby Slot */}
        <div className="p-3 rounded-2xl border-2 border-rose-400/50 bg-rose-950/20 dark:bg-rose-950/30 flex flex-col justify-between relative shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔴</span>
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider font-mono">
                Robijn Slot
              </span>
            </div>
            <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-md">
              60% Kracht
            </span>
          </div>

          {slots.ruby ? (
            (() => {
              const spirit = getSpirit(slots.ruby)!;
              return (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{spirit.emoji}</span>
                    <button
                      onClick={() => onAssignSlot('ruby', null)}
                      className="p-1 text-rose-400 hover:text-red-400 rounded-lg hover:bg-black/20 transition-all cursor-pointer"
                      title="Verwijder uit slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-rose-200">{spirit.name}</span>
                  <span className="text-[11px] text-rose-300 font-bold mt-1">
                    {spirit.rubyEffect}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="h-20 rounded-xl border border-dashed border-rose-400/40 flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs text-rose-400/80 font-bold">Leeg Robijn Slot</span>
              <span className="text-[10px] text-rose-400/60 mt-0.5">Klik hieronder op een Katten Geest</span>
            </div>
          )}
        </div>

        {/* Jade Slot */}
        <div className="p-3 rounded-2xl border-2 border-emerald-400/50 bg-emerald-950/20 dark:bg-emerald-950/30 flex flex-col justify-between relative shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🟢</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono">
                Jade Slot
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
              30% Kracht
            </span>
          </div>

          {slots.jade ? (
            (() => {
              const spirit = getSpirit(slots.jade)!;
              return (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{spirit.emoji}</span>
                    <button
                      onClick={() => onAssignSlot('jade', null)}
                      className="p-1 text-emerald-400 hover:text-red-400 rounded-lg hover:bg-black/20 transition-all cursor-pointer"
                      title="Verwijder uit slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-emerald-200">{spirit.name}</span>
                  <span className="text-[11px] text-emerald-300 font-bold mt-1">
                    {spirit.jadeEffect}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="h-20 rounded-xl border border-dashed border-emerald-400/40 flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs text-emerald-400/80 font-bold">Leeg Jade Slot</span>
              <span className="text-[10px] text-emerald-400/60 mt-0.5">Klik hieronder op een Katten Geest</span>
            </div>
          )}
        </div>
      </div>

      {/* Available Spirits List */}
      <div>
        <h4 className="text-xs font-black text-app-muted uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
          <span>✨</span>
          <span>Beschikbare Katten Geesten (Klik om toe te wijzen)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PANTHEON_SPIRITS.map(spirit => {
            const currentSlot = getSlotForSpirit(spirit.id);
            const isSlotted = currentSlot !== null;

            return (
              <div
                key={spirit.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isSlotted
                    ? 'border-amber-400/40 bg-amber-500/10 shadow-sm'
                    : 'border-app-border/70 bg-app-card hover:border-amber-400/50 hover:bg-app-accent/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{spirit.emoji}</span>
                    <div>
                      <h5 className="text-xs font-black text-app-ink font-mono">{spirit.name}</h5>
                      <span className="text-[10px] text-app-muted italic">{spirit.title}</span>
                    </div>
                  </div>
                  {isSlotted && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      currentSlot === 'diamond'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30'
                        : currentSlot === 'ruby'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-400/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                    }`}>
                      {currentSlot === 'diamond' ? '💎 Diamant' : currentSlot === 'ruby' ? '🔴 Robijn' : '🟢 Jade'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-app-muted mb-2.5 line-clamp-2">
                  {spirit.description}
                </p>

                {/* Quick Slot Assign Buttons */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-app-border/40">
                  <span className="text-[10px] text-app-muted font-bold mr-1">Wijs toe:</span>
                  <button
                    onClick={() => onAssignSlot('diamond', spirit.id)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentSlot === 'diamond'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    <span>💎</span>
                    <span>Diamant</span>
                  </button>
                  <button
                    onClick={() => onAssignSlot('ruby', spirit.id)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentSlot === 'ruby'
                        ? 'bg-rose-400 text-black'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span>🔴</span>
                    <span>Robijn</span>
                  </button>
                  <button
                    onClick={() => onAssignSlot('jade', spirit.id)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentSlot === 'jade'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <span>🟢</span>
                    <span>Jade</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
