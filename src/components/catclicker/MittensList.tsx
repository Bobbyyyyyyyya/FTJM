import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, User, Info, Award, ArrowUpCircle, Zap } from 'lucide-react';
import { Mitten, getMittenUpgradeCost, getMittenTpsBonus } from './catClickerData';
import { t } from '../../utils/translations';

interface MittensListProps {
  mittens: Mitten[];
  treats: number;
  hasMittenOverdrive?: boolean;
  onPetMitten: (mittenId: string) => void;
  onUpgradeMitten: (mittenId: string) => void;
  onUpgradeAllMittens?: () => void;
  formatRate: (val: number) => string;
}

export const MittensList: React.FC<MittensListProps> = ({
  mittens,
  treats,
  hasMittenOverdrive = false,
  onPetMitten,
  onUpgradeMitten,
  onUpgradeAllMittens,
  formatRate
}) => {
  if (mittens.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center opacity-60 p-4">
        <span className="text-4xl mb-3">🐱🍼</span>
        <p className="text-sm font-black text-app-ink">{t("Nog geen Speelse Kittens / Mittens!")}</p>
        <p className="text-xs text-app-muted mt-1 max-w-xs">
          {t("Koop \"Speelse Kittens\" in de winkel om je eigen groep uniek benoemde kittens te adopteren en te upgraden!")}
        </p>
      </div>
    );
  }

  // Calculate total mitten TPS
  const totalMittenTps = mittens.reduce((acc, m) => {
    return acc + getMittenTpsBonus(m.level || 1, hasMittenOverdrive ? 3 : 1);
  }, 0);

  // Calculate realistic sequential affordability:
  // How many mittens can ACTUALLY be upgraded sequentially with the current treats balance?
  let simulatedTreats = Math.max(0, treats);
  const affordableMittens: Mitten[] = [];
  let totalCostAffordable = 0;

  // Prioritize lowest level mittens first for player economy
  const sortedMittens = [...mittens].sort((a, b) => (a.level || 1) - (b.level || 1));
  for (const m of sortedMittens) {
    const cost = getMittenUpgradeCost(m.level || 1);
    if (simulatedTreats >= cost) {
      simulatedTreats -= cost;
      totalCostAffordable += cost;
      affordableMittens.push(m);
    }
  }

  return (
    <div className="space-y-3">
      {/* Mittens Summary Header */}
      <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg font-bold">
            🧤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-app-ink">
                {t("Geadopteerde Mittens")} ({mittens.length})
              </h4>
              {hasMittenOverdrive && (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                  OVERDRIVE 3X
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 fill-emerald-500" />
              <span>
                {totalMittenTps > 0
                  ? `${t("Totale Mitten Training")}: +${formatRate(totalMittenTps)}/sec`
                  : t("Basis: 0,5 brokjes/sec per kitten")}
              </span>
            </p>
          </div>
        </div>

        {/* Upgrade All Button - strictly requiring sufficient balance */}
        {onUpgradeAllMittens && affordableMittens.length > 0 && treats >= totalCostAffordable && totalCostAffordable > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpgradeAllMittens}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs rounded-xl shadow-md shadow-amber-500/25 cursor-pointer transition-all self-start sm:self-center"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>{t("Upgrade Alle")} ({affordableMittens.length})</span>
            <span className="text-[10px] font-mono opacity-80">({formatRate(totalCostAffordable)} 🍪)</span>
          </motion.button>
        )}
      </div>

      {/* Mittens Grid */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2.5">
        {mittens.map((mitten, index) => {
          const currentLevel = mitten.level || 1;
          const upgradeCost = getMittenUpgradeCost(currentLevel);
          const tpsBonus = getMittenTpsBonus(currentLevel, hasMittenOverdrive ? 3 : 1);
          const nextTpsBonus = getMittenTpsBonus(currentLevel + 1, hasMittenOverdrive ? 3 : 1);
          const canUpgrade = treats >= upgradeCost && treats > 0;

          return (
            <div
              key={mitten.id || index}
              className={`p-3 bg-app-card/80 border ${
                canUpgrade
                  ? 'border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-app-card to-app-card'
                  : currentLevel >= 5
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-app-border'
              } rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-2.5 relative overflow-hidden`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with level badge */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-2xl shadow-inner">
                    {mitten.avatar}
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-black border border-amber-300 shadow-sm">
                    L{currentLevel}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-xs font-black text-app-ink truncate">
                      {mitten.name}
                    </h5>
                    <span className="text-[10px] font-bold text-amber-500 font-mono shrink-0">
                      {t(mitten.title)}
                    </span>
                  </div>

                  <p className="text-[10px] text-app-muted line-clamp-1 mt-0.5">
                    {t(mitten.personality)}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono">
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {tpsBonus > 0 ? `+${formatRate(tpsBonus)}/sec bonus` : '0,5/sec (basis)'}
                    </span>
                    <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                      <Heart className="w-2.5 h-2.5 fill-rose-400" />
                      {mitten.patsCount || 0}x {t("geaaid")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pet Mitten & Upgrade Level */}
              <div className="flex items-center gap-2 pt-2 border-t border-app-border/40">
                {/* Pet Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPetMitten(mitten.id)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-app-accent hover:bg-rose-500/15 text-app-ink hover:text-rose-400 border border-app-border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🐾</span>
                  <span>{t("Aai Kitten")}</span>
                </motion.button>

                {/* Upgrade Button */}
                <motion.button
                  whileHover={canUpgrade ? { scale: 1.03 } : {}}
                  whileTap={canUpgrade ? { scale: 0.96 } : {}}
                  disabled={!canUpgrade}
                  onClick={() => canUpgrade && onUpgradeMitten(mitten.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                    canUpgrade
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-md shadow-amber-500/20 cursor-pointer animate-pulse'
                      : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  <span>{t("Upgrade")}</span>
                  <span className="text-[10px] font-mono">({formatRate(upgradeCost)})</span>
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
