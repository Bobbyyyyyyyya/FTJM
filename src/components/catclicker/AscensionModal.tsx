import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  X, 
  Award, 
  ArrowUpCircle, 
  Zap, 
  Star, 
  Crown, 
  Layers, 
  Building2, 
  ChevronRight,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { 
  AscensionUpgrade, 
  AscensionBranch,
  ASCENSION_MIN_TREATS, 
  calculateTreatsForKittyPoints, 
  calculateKittyPointsForTreats 
} from './catClickerData';
import { t } from '../../utils/translations';

interface AscensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  kittyPoints: number;
  potentialKittyPoints: number;
  totalAscensions: number;
  currentTreats: number;
  allTimeTreats: number;
  ascensionUpgrades: AscensionUpgrade[];
  onAscend: () => void;
  onBuyAscensionUpgrade: (upgradeId: string) => void;
  formatRate: (val: number) => string;
}

const BRANCH_CONFIG: Record<AscensionBranch, { label: string; icon: string; desc: string; color: string; bgBadge: string }> = {
  all: {
    label: 'Volledige Boom',
    icon: '🌟',
    desc: 'Overzicht van alle hemelse takken en paden',
    color: 'from-amber-300 via-yellow-200 to-amber-400',
    bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
  },
  buildings: {
    label: 'Hemelse Heiligdommen',
    icon: '🏛️',
    desc: 'Exclusieve gebouwen die je ontgrendelt voor in de kattenwinkel',
    color: 'from-yellow-400 via-amber-300 to-orange-400',
    bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  powers: {
    label: 'Goddelijke Pootjes',
    icon: '⚡',
    desc: 'Actieve aaikracht, automatische spookklauwen en klik-synergie',
    color: 'from-cyan-300 via-sky-200 to-blue-400',
    bgBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  luck: {
    label: 'Mythische Wonderen',
    icon: '🌈',
    desc: 'Gouden Bollen, Mystieke Muizen en Kosmische Karpers',
    color: 'from-fuchsia-300 via-pink-300 to-purple-400',
    bgBadge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
  },
  serenity: {
    label: 'Eeuwige Rust',
    icon: '💤',
    desc: 'Offline verzameling, Mitten engelen en start-voorraden',
    color: 'from-emerald-300 via-teal-200 to-green-400',
    bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  transcendence: {
    label: 'Kosmische Orde',
    icon: '👑',
    desc: 'De allerhoogste goddelijke krachten van het kattenrijk',
    color: 'from-violet-300 via-amber-200 to-yellow-300',
    bgBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
};

export const AscensionModal: React.FC<AscensionModalProps> = ({
  isOpen,
  onClose,
  kittyPoints,
  potentialKittyPoints,
  totalAscensions,
  currentTreats,
  allTimeTreats,
  ascensionUpgrades,
  onAscend,
  onBuyAscensionUpgrade,
  formatRate
}) => {
  const [selectedBranch, setSelectedBranch] = useState<AscensionBranch>('all');
  const [isAscendingAnimation, setIsAscendingAnimation] = useState(false);
  const [activeInfoTooltip, setActiveInfoTooltip] = useState<string | null>(null);

  // Fixed threshold: 1 Kitty Point per 1 Miljard / 1 Billion (1,000,000,000 brokjes)
  const currentThreshold = ASCENSION_MIN_TREATS;
  const hasReachedMinThreshold = allTimeTreats >= currentThreshold;
  
  // Progress calculations based on run KP
  const runKittyPoints = calculateKittyPointsForTreats(allTimeTreats);
  let thresholdProgress = 0;
  let nextKpCost = currentThreshold;
  let currentKpBase = 0;

  if (!hasReachedMinThreshold) {
    thresholdProgress = Math.min(100, Math.floor((allTimeTreats / currentThreshold) * 100));
    nextKpCost = currentThreshold;
  } else {
    currentKpBase = calculateTreatsForKittyPoints(runKittyPoints);
    nextKpCost = calculateTreatsForKittyPoints(runKittyPoints + 1);
    const range = Math.max(1, nextKpCost - currentKpBase);
    const progressInRange = Math.max(0, allTimeTreats - currentKpBase);
    thresholdProgress = Math.min(100, Math.floor((progressInRange / range) * 100));
  }

  // Count active / purchased upgrades
  const purchasedCount = useMemo(() => {
    return ascensionUpgrades.filter(u => u.purchased).length;
  }, [ascensionUpgrades]);

  // Group filtered upgrades by tier or branch
  const filteredUpgrades = useMemo(() => {
    if (selectedBranch === 'all') {
      return ascensionUpgrades;
    }
    return ascensionUpgrades.filter(u => u.branch === selectedBranch);
  }, [ascensionUpgrades, selectedBranch]);

  // Group by Tier for visual tree tier layers
  const tieredGroups = useMemo(() => {
    const map = new Map<number, AscensionUpgrade[]>();
    for (const up of filteredUpgrades) {
      const tier = up.tier || 1;
      if (!map.has(tier)) {
        map.set(tier, []);
      }
      map.get(tier)!.push(up);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredUpgrades]);

  const handleTriggerAscend = () => {
    if (!hasReachedMinThreshold || potentialKittyPoints <= 0) return;
    setIsAscendingAnimation(true);
    setTimeout(() => {
      onAscend();
      setIsAscendingAnimation(false);
      onClose(); // Automatically close modal when ascension finishes
    }, 1600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Full-Screen Heavenly Ascension Transition Sequence */}
        {isAscendingAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-gradient-to-b from-amber-100 via-amber-400 to-yellow-600 flex flex-col items-center justify-center p-6 text-center text-black overflow-hidden"
          >
            {/* Spinning Radiant Sunburst */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(251,191,36,0.5)_40%,transparent_70%)] opacity-80 pointer-events-none"
            />

            {/* Ascending Angel Cats */}
            <motion.div
              initial={{ y: 240, scale: 0.5, opacity: 0 }}
              animate={{ y: -140, scale: 1.4, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="text-8xl sm:text-9xl mb-4 filter drop-shadow-[0_0_40px_rgba(255,255,255,1)] relative z-10"
            >
              🪽✨🐱✨🪽
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-10 space-y-3"
            >
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-amber-950 font-mono drop-shadow-lg">
                ✨ {t("HEMELVAART VOLTOOID")} ✨
              </h1>
              <p className="text-base sm:text-xl font-black text-amber-900 max-w-lg mx-auto leading-relaxed">
                {t("Je kattenrijk stijgt op naar het Hemels Paradijs! +")}{potentialKittyPoints.toLocaleString('nl-NL')} {t("Kitty Points ontvangen!")}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/60 font-mono text-sm font-black text-amber-950">
                <span>🌟 {ascensionUpgrades.filter(u => u.purchased).length} Hemelse Zegeningen Actief</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Main Heavenly Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 25 }}
          className="bg-gradient-to-b from-slate-950 via-[#0d131f] to-[#1a1208] border-2 border-amber-400/60 rounded-3xl w-full max-w-5xl text-white shadow-[0_0_100px_rgba(245,158,11,0.35)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Top Heavenly Clouds Decoration */}
          <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-transparent pointer-events-none z-10 flex justify-around items-start opacity-70">
            <span className="text-2xl animate-pulse">☁️</span>
            <span className="text-3xl -mt-1">☁️</span>
            <span className="text-2xl animate-pulse delay-300">☁️</span>
            <span className="text-3xl -mt-1">☁️</span>
            <span className="text-2xl animate-pulse delay-700">☁️</span>
          </div>

          {/* Ambient Celestial Light Halos */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-amber-400/20 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* Close Button - Enhanced Touch & Click Target */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={t("Sluiten")}
            title={t("Sluiten")}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-zinc-900/90 hover:bg-amber-500 active:scale-95 border border-amber-400/50 hover:border-amber-300 text-amber-200 hover:text-black shadow-2xl transition-all cursor-pointer z-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Heavenly Modal Header & Mascot */}
          <div className="pt-4 sm:pt-5 pb-3 px-4 sm:px-8 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-black/60 to-amber-950/40 shrink-0 relative z-20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              {/* Left: Angel Cat Mascot & Title */}
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div
                  animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative shrink-0 text-3xl sm:text-4xl filter drop-shadow-[0_0_18px_rgba(251,191,36,0.9)]"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm text-yellow-300 animate-spin">✨</span>
                  <div className="flex items-center">
                    <span className="text-xl">🪽</span>
                    <span className="p-2 bg-gradient-to-tr from-amber-400/30 via-yellow-300/40 to-amber-500/30 rounded-full border border-amber-300/70 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      🐱
                    </span>
                    <span className="text-xl">🪽</span>
                  </div>
                </motion.div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                      <span>{t("DE HEMELSE BOOM")}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {purchasedCount} / {ascensionUpgrades.length} Zegeningen
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 uppercase tracking-tight font-mono drop-shadow">
                    {t("Hemelvaart & Goddelijke Zegeningen")}
                  </h2>
                  <p className="text-[11px] text-zinc-300 hidden sm:block max-w-md">
                    {t("Beklim de hemelse boom. Ontgrendel exclusieve kathedralen, seraphim melkwegen en goddelijke krachten!")}
                  </p>
                </div>
              </div>

              {/* Right: Quick Kitty Points Counter Badge */}
              <div className="flex items-center gap-2 bg-black/60 p-2 sm:p-2.5 rounded-2xl border border-amber-400/40 shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-black font-black text-base shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                  KP
                </div>
                <div className="text-left pr-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                    {t("Beschikbare Kracht")}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-white font-mono leading-none">
                    {kittyPoints.toLocaleString('nl-NL')} <span className="text-xs text-amber-400 font-bold">KP</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Drempel / Requirement & Progress Bar */}
            <div className="mt-3 p-2.5 bg-black/50 border border-amber-500/30 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-amber-200 font-bold">
                  {hasReachedMinThreshold ? (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>
                    {!hasReachedMinThreshold
                      ? `${t("Hemelvaart Drempel")}: Pas na 1 Miljard (1 Billion) brokjes ontgrendeld (${thresholdProgress}%)`
                      : `${t("Klaar voor Hemelvaart!")} (+${potentialKittyPoints.toLocaleString('nl-NL')} KP verdiend)`}
                  </span>
                </div>

                <div className="text-zinc-400 text-[10px]">
                  <span>{Math.floor(allTimeTreats).toLocaleString('nl-NL')}</span> / <span>{nextKpCost.toLocaleString('nl-NL')} 🍪</span>
                </div>
              </div>

              {/* Glowing Progress Bar */}
              <div className="h-2 w-full bg-zinc-950 rounded-full border border-amber-500/30 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${thresholdProgress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full relative overflow-hidden ${
                    hasReachedMinThreshold
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 shadow-[0_0_12px_rgba(245,158,11,1)]'
                      : 'bg-gradient-to-r from-amber-700 to-yellow-600'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                </motion.div>
              </div>
            </div>

            {/* Branch Navigation Filter Tabs (The Tree Selector) */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
              {(Object.keys(BRANCH_CONFIG) as AscensionBranch[]).map((branchKey) => {
                const config = BRANCH_CONFIG[branchKey];
                const isSelected = selectedBranch === branchKey;
                const branchCount = branchKey === 'all' 
                  ? ascensionUpgrades.length 
                  : ascensionUpgrades.filter(u => u.branch === branchKey).length;
                const branchPurchased = branchKey === 'all'
                  ? purchasedCount
                  : ascensionUpgrades.filter(u => u.branch === branchKey && u.purchased).length;

                return (
                  <button
                    key={branchKey}
                    onClick={() => setSelectedBranch(branchKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.6)] font-black'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60 hover:border-amber-400/60 hover:text-white'
                    }`}
                  >
                    <span>{config.icon}</span>
                    <span>{t(config.label)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-black/30 text-black' : 'bg-black/40 text-amber-300'
                    }`}>
                      {branchPurchased}/{branchCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heavenly Tree Body: Scrollable Tiered Canvas */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-6 relative z-10 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06)_0%,transparent_70%)]">
            
            {/* Branch Description Banner */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{BRANCH_CONFIG[selectedBranch].icon}</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 font-mono">
                    {t(BRANCH_CONFIG[selectedBranch].label)}
                  </h3>
                  <p className="text-[11px] text-zinc-300">
                    {t(BRANCH_CONFIG[selectedBranch].desc)}
                  </p>
                </div>
              </div>

              {/* Ascension Action Button Embedded in Canvas Header */}
              <div className="shrink-0">
                <button
                  onClick={handleTriggerAscend}
                  disabled={!hasReachedMinThreshold || potentialKittyPoints <= 0}
                  className={`px-3.5 py-2 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    hasReachedMinThreshold && potentialKittyPoints > 0
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-black shadow-[0_0_22px_rgba(245,158,11,0.9)] cursor-pointer active:scale-95 animate-pulse ring-2 ring-amber-300'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/80 shadow-inner'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>
                    {hasReachedMinThreshold && potentialKittyPoints > 0
                      ? `Hemelvaart Voltrekken (+${potentialKittyPoints} KP)`
                      : `Pas na 1 Miljard (1 Billion)`}
                  </span>
                </button>
              </div>
            </div>

            {/* Tiered Tree Levels */}
            {tieredGroups.map(([tierNum, upgradesInTier]) => {
              const tierTitles: Record<number, string> = {
                1: 'Tier I: Hemelse Genesis & Startkracht',
                2: 'Tier II: De Goddelijke Ontwaking',
                3: 'Tier III: Heiligdommen & Wonderen',
                4: 'Tier IV: Aartsengelen & Meesterschap',
                5: 'Tier V: Kosmische Transcendentie & Apex'
              };

              return (
                <div key={tierNum} className="space-y-3 relative">
                  {/* Tier Header Line with Angel Wing Accents */}
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                    <div className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-200 font-mono text-xs font-black tracking-wider flex items-center gap-1.5 shadow-md">
                      <span>🪽</span>
                      <span>{tierTitles[tierNum] || `Tier ${tierNum}`}</span>
                      <span>🪽</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                  </div>

                  {/* Nodes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {upgradesInTier.map((upgrade) => {
                      const canAfford = !upgrade.purchased && kittyPoints >= upgrade.cost;
                      const reqUpgrade = upgrade.requiredUpgradeId 
                        ? ascensionUpgrades.find(u => u.id === upgrade.requiredUpgradeId) 
                        : null;
                      const isLocked = reqUpgrade && !reqUpgrade.purchased;
                      const isExclusiveBuilding = Boolean(upgrade.unlocksBuildingId);

                      return (
                        <motion.div
                          key={upgrade.id}
                          layout
                          whileHover={{ y: -2 }}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group select-none ${
                            upgrade.purchased
                              ? 'bg-gradient-to-b from-emerald-950/40 to-black/60 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                              : isLocked
                              ? 'bg-zinc-950/70 border-zinc-800/80 opacity-60'
                              : canAfford
                              ? 'bg-gradient-to-b from-zinc-900/95 via-amber-950/30 to-black border-amber-400/70 hover:border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/30'
                              : 'bg-zinc-900/60 border-zinc-800 opacity-80'
                          }`}
                        >
                          {/* Ambient glow on affordable or exclusive nodes */}
                          {canAfford && !isLocked && !upgrade.purchased && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 blur-xl pointer-events-none rounded-full" />
                          )}

                          {/* Node Header */}
                          <div>
                            <div className="flex items-start gap-3">
                              {/* Node Icon Box */}
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 relative transition-transform group-hover:scale-105 ${
                                upgrade.purchased 
                                  ? 'bg-emerald-500/20 border-2 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.4)] text-emerald-300' 
                                  : isLocked
                                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                                  : canAfford
                                  ? 'bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-amber-300/30 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                  : 'bg-zinc-800 border border-zinc-700'
                              }`}>
                                {isLocked ? <Lock className="w-5 h-5 text-zinc-500" /> : upgrade.emoji}
                                
                                {upgrade.purchased && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              {/* Title, Category & Badges */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs sm:text-sm font-black text-white truncate font-mono tracking-tight">
                                    {t(upgrade.name)}
                                  </h4>
                                </div>

                                {/* Exclusive Building Unlock Badge! */}
                                {isExclusiveBuilding && (
                                  <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] font-black text-amber-300 uppercase tracking-wide">
                                    <Building2 className="w-3 h-3 text-yellow-300" />
                                    <span>{t("Exclusief Gebouw")}</span>
                                  </div>
                                )}

                                {upgrade.purchased ? (
                                  <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                                    <span>✨ {t("Goddelijke Zegen Actief")}</span>
                                  </span>
                                ) : (
                                  <p className="text-[10px] font-mono text-amber-300/80 mt-0.5">
                                    {BRANCH_CONFIG[upgrade.branch || 'powers'].label}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Node Description */}
                            <p className="text-[11px] text-zinc-300 mt-2.5 leading-relaxed">
                              {t(upgrade.description)}
                            </p>

                            {/* Prerequisite Indicator (Tree Dependency Chain) */}
                            {reqUpgrade && (
                              <div className={`mt-2 p-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1.5 ${
                                reqUpgrade.purchased 
                                  ? 'bg-emerald-950/40 text-emerald-300/90 border border-emerald-500/20' 
                                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                              }`}>
                                <ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">
                                  {reqUpgrade.purchased ? '✓ ' : '🔒 '}
                                  {t("Vereist")}: <strong className="text-amber-300">{reqUpgrade.name}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Node Footer: Cost & Action Button */}
                          {!upgrade.purchased ? (
                            <div className="mt-3.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-yellow-400" />
                                  {upgrade.cost} KP
                                </span>
                              </div>

                              <button
                                disabled={!canAfford || Boolean(isLocked)}
                                onClick={() => onBuyAscensionUpgrade(upgrade.id)}
                                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer ${
                                  canAfford && !isLocked
                                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-black shadow-[0_0_14px_rgba(245,158,11,0.6)] active:scale-95 font-black ring-1 ring-amber-200'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                                }`}
                              >
                                {isLocked ? t('Vergrendeld') : t('Koop Zegen')}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {t("Geactiveerd")}
                              </span>
                              <span className="text-zinc-400 font-bold">{upgrade.cost} KP</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Heavenly Footer Info Bar */}
          <div className="p-3 bg-gradient-to-r from-black via-zinc-950 to-black border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-zinc-300 shrink-0 relative z-20">
            <div className="flex items-center gap-2">
              <span className="text-base">🪽</span>
              <span>
                💡 <strong className="text-amber-300">{t("Hemelse Tip:")}</strong> {t("Exclusieve gebouwen zoals de Hemelse Kathedraal verschijnen direct in je winkel zodra je ze in deze boom ontgrendelt!")}
              </span>
            </div>

            <div className="font-mono text-xs text-amber-300 font-black shrink-0">
              {totalAscensions}x {t("Opstijgingen Voltooid")}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
