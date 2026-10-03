import React from 'react';
import { Sparkles, Zap, Lock, Wand2 } from 'lucide-react';
import { t } from '../../utils/translations';

export interface MeowSpell {
  id: string;
  name: string;
  emoji: string;
  manaCost: number;
  description: string;
  type: 'golden_yarn' | 'frenzy' | 'summon_rare' | 'treat_burst' | 'rainbow_yarn';
}

export const MEOW_SPELLS: MeowSpell[] = [
  {
    id: 'conjure_yarn',
    name: 'Gouden Garen Bezweren',
    emoji: '🧶',
    manaCost: 35,
    description: 'Manifesteert onmiddellijk een glinsterende Gouden Garenbol op het speelveld.',
    type: 'golden_yarn'
  },
  {
    id: 'turbo_frenzy',
    name: 'Turbo Pootjes Frenzy',
    emoji: '⚡',
    manaCost: 45,
    description: 'Activeert direct 20 seconden lang 7x Frenzy voor je hele brokjesrijk!',
    type: 'frenzy'
  },
  {
    id: 'treat_burst',
    name: 'Brokjes Uitbarsting',
    emoji: '🍪',
    manaCost: 30,
    description: 'Tovert in één flits 15 minuten aan passieve brokjesproductie direct in je pot.',
    type: 'treat_burst'
  },
  {
    id: 'summon_beast',
    name: 'Kosmische Lokroep',
    emoji: '🐟',
    manaCost: 50,
    description: 'Lokt met mystieke frequenties direct een Mystieke Muis of Kosmische Gouden Karper.',
    type: 'summon_rare'
  },
  {
    id: 'rainbow_surge',
    name: 'Regenboog Katten Harmonie',
    emoji: '🌈',
    manaCost: 80,
    description: 'Ontketent een zeldzame Regenboogbol Wol en zet je spinteller direct op 100%!',
    type: 'rainbow_yarn'
  }
];

interface GrimoireViewProps {
  portalCount: number;
  mana: number;
  maxMana: number;
  onCastSpell: (spell: MeowSpell) => void;
  onOpenStore: () => void;
  formatRate: (val: number) => string;
}

export const GrimoireView: React.FC<GrimoireViewProps> = ({
  portalCount,
  mana,
  maxMana,
  onCastSpell,
  onOpenStore
}) => {
  const isUnlocked = portalCount >= 1;

  if (!isUnlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl mb-4 text-purple-400 animate-pulse">
          📖
        </div>
        <h3 className="text-base font-black text-app-ink mb-1.5 font-mono">
          Het Magische Meow Spreukenboek
        </h3>
        <p className="text-xs text-app-muted max-w-sm mb-4 leading-relaxed">
          Bouw minimaal <span className="text-purple-400 font-bold">1 Meow Dimensieportaal</span> in de winkel om de occulte kattenmagie en het Meow Spreukenboek te ontgrendelen.
        </p>
        <button
          onClick={onOpenStore}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>🛒</span>
          <span>Open Katten Winkel</span>
        </button>
      </div>
    );
  }

  const manaPercentage = Math.min(100, Math.floor((mana / maxMana) * 100));

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
      {/* Header Banner with Mana Meter */}
      <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-fuchsia-950/40 border border-purple-500/30 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight font-mono">
                Het Meow Spreukenboek (Grimoire)
              </h3>
              <p className="text-[11px] text-purple-200/80">
                Spendeer Meow Mana om realiteit-veranderende kattenmagie uit te voeren.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-400/30">
            {Math.floor(mana)} / {maxMana} Mana
          </span>
        </div>

        {/* Animated Mana Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Meow Mana Resonantie</span>
            </span>
            <span>+1 Mana per 3 sec</span>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-purple-400/30">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
              style={{ width: `${manaPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spells Grid */}
      <div>
        <h4 className="text-xs font-black text-app-muted uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Beschikbare Spreuken ({MEOW_SPELLS.length})</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MEOW_SPELLS.map(spell => {
            const canCast = mana >= spell.manaCost;

            return (
              <div
                key={spell.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  canCast
                    ? 'border-purple-400/40 bg-purple-950/20 hover:border-purple-300 hover:bg-purple-950/30 shadow-sm'
                    : 'border-app-border/50 bg-app-card/30 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{spell.emoji}</span>
                      <div>
                        <h5 className="text-xs font-black text-app-ink font-mono">{spell.name}</h5>
                        <span className="text-[10px] text-purple-400 font-bold">
                          {spell.manaCost} Mana Kost
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-app-muted mb-3 leading-relaxed">
                    {spell.description}
                  </p>
                </div>

                <button
                  onClick={() => canCast && onCastSpell(spell)}
                  disabled={!canCast}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    canCast
                      ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white shadow-md active:scale-95'
                      : 'bg-app-accent/50 text-app-muted cursor-not-allowed border border-app-border/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {canCast ? `Spreek Uit (${spell.manaCost} Mana)` : `Niet Genoeg Mana (${Math.floor(mana)}/${spell.manaCost})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
