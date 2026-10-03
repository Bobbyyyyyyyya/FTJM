import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, TrendingUp, Sparkles, Award } from 'lucide-react';

interface CatClickerStageProps {
  cursorCount: number;
  onCatClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isClickingCat: boolean;
  skinEmoji: string;
  skinName: string;
  skinBgGlow: string;
  purrMultiplier: number;
  treats: number;
  tps: number;
  clickPower: number;
  floatingTexts: { id: number; text: string; color: string; x: number; y: number }[];
  formatTreatsDisplay: (n: number) => string;
  formatRate: (n: number) => string;
  t: (s: string) => string;
  onOpenStore?: () => void;
}

interface RingDef {
  capacity: number;
  radius: number;
  speed: number; // positive = clockwise, negative = counter-clockwise (seconds per revolution)
}

// Expanded ring capacities so each ring holds significantly more kattenpootjes
const BASE_RING_DEFS: RingDef[] = [
  { capacity: 24, radius: 68, speed: 40 },    // Ring 1 (24 pootjes)
  { capacity: 36, radius: 96, speed: -50 },   // Ring 2 (36 pootjes)
  { capacity: 50, radius: 124, speed: 60 },   // Ring 3 (50 pootjes)
  { capacity: 68, radius: 152, speed: -70 },  // Ring 4 (68 pootjes)
  { capacity: 88, radius: 180, speed: 80 },   // Ring 5 (88 pootjes)
  { capacity: 110, radius: 208, speed: -90 }, // Ring 6 (110 pootjes)
  { capacity: 136, radius: 236, speed: 100 }, // Ring 7 (136 pootjes)
  { capacity: 164, radius: 264, speed: -110 },// Ring 8 (164 pootjes)
  { capacity: 196, radius: 292, speed: 120 }, // Ring 9 (196 pootjes)
  { capacity: 232, radius: 320, speed: -130 },// Ring 10 (232 pootjes)
];

// Dynamically generate extra rings if player has more pootjes so it never stops adding
function getRingDefs(count: number): RingDef[] {
  const defs = [...BASE_RING_DEFS];
  let totalCap = defs.reduce((sum, r) => sum + r.capacity, 0);
  let idx = defs.length;
  while (count > totalCap && idx < 20) {
    const prev = defs[idx - 1];
    const capacity = prev.capacity + 36;
    const radius = prev.radius + 28;
    const speed = (idx % 2 === 0 ? 1 : -1) * (130 + idx * 8);
    defs.push({ capacity, radius, speed });
    totalCap += capacity;
    idx++;
  }
  return defs;
}

export const CatClickerStage: React.FC<CatClickerStageProps> = ({
  cursorCount,
  onCatClick,
  isClickingCat,
  skinEmoji,
  skinName,
  skinBgGlow,
  purrMultiplier,
  treats,
  tps,
  clickPower,
  floatingTexts,
  formatTreatsDisplay,
  formatRate,
  t,
  onOpenStore
}) => {
  // Periodic tap animation for all orbiting kattenpootjes
  const [cursorTapState, setCursorTapState] = useState(false);
  const [cursorSparks, setCursorSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const sparkIdCounter = useRef(0);

  useEffect(() => {
    if (cursorCount === 0) return;
    const interval = setInterval(() => {
      setCursorTapState(true);
      // Spawn subtle tap sparks near the cat
      if (Math.random() > 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const sparkDist = 44 + Math.random() * 8;
        const newSpark = {
          id: sparkIdCounter.current++,
          x: Math.cos(angle) * sparkDist,
          y: Math.sin(angle) * sparkDist,
        };
        setCursorSparks(prev => [...prev.slice(-6), newSpark]);
      }
      setTimeout(() => setCursorTapState(false), 240);
    }, 1600);

    return () => clearInterval(interval);
  }, [cursorCount]);

  const ringDefs = useMemo(() => getRingDefs(cursorCount), [cursorCount]);

  // Distribute cursorCount across concentric rings
  const ringsData = useMemo(() => {
    let remaining = cursorCount;
    return ringDefs.map((ring, ringIndex) => {
      const inThisRing = Math.max(0, Math.min(remaining, ring.capacity));
      remaining = Math.max(0, remaining - ring.capacity);
      const isFull = inThisRing >= ring.capacity;

      const cursors = Array.from({ length: inThisRing }).map((_, i) => {
        // Place pootjes evenly around the circle
        const angleDeg = (i / ring.capacity) * 360;
        return {
          id: `${ringIndex}-${i}`,
          index: i,
          angleDeg,
        };
      });

      return {
        ringIndex,
        ...ring,
        count: inThisRing,
        isFull,
        cursors,
      };
    });
  }, [cursorCount, ringDefs]);

  const activeRings = useMemo(() => ringsData.filter(r => r.count > 0), [ringsData]);
  const activeRingsCount = activeRings.length;
  const currentRing = ringsData.find(r => r.count < r.capacity && r.count > 0) || (cursorCount === 0 ? ringsData[0] : ringsData[Math.min(activeRingsCount, ringsData.length - 1)]);
  const isAllFull = activeRingsCount >= ringDefs.length && activeRings.every(r => r.isFull);

  // Dynamic scale so that if multiple outer rings exist, they smoothly scale to fit the stage container
  const maxActiveRadius = activeRingsCount > 0 ? ringDefs[Math.min(activeRingsCount - 1, ringDefs.length - 1)].radius + 16 : 70;
  const stageScale = Math.max(0.42, Math.min(1.15, 175 / maxActiveRadius));

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2.5 sm:p-3.5 select-none relative overflow-hidden bg-gradient-to-b from-amber-500/5 via-app-card to-app-card/60 rounded-3xl border border-app-border/80 shadow-sm">
      
      {/* 1. Header: Stage Title & Active Stats */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2 pb-2 border-b border-app-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{skinEmoji}</span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-app-ink uppercase tracking-tight truncate">
              {skinName}
            </h3>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-500 font-bold">
              <span>{formatTreatsDisplay(treats)}</span>
              <span>🍪</span>
              {purrMultiplier > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[9px] border border-rose-500/30 animate-pulse">
                  😻 {purrMultiplier}x
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CPS & Click Power stats */}
        <div className="flex flex-col items-end text-right font-mono shrink-0">
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{formatRate(tps)}</span>/s
          </div>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-bold mt-0.5">
            <Zap className="w-3 h-3" />
            <span>+{formatRate(clickPower)}</span>/klik
          </div>
        </div>
      </div>

      {/* 2. Main Arena: The Clickable Cat with Concentric Rotating Cursor Rings */}
      <div className="relative w-full flex-1 flex items-center justify-center my-1 min-h-[200px] overflow-hidden">
        
        {/* Ambient celestial background halo */}
        <div 
          className="absolute w-64 h-64 xl:w-72 xl:h-72 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
          style={{ background: skinBgGlow || 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        {/* Scaled Cursor Rings & Center Cat Container */}
        <div 
          className="relative w-[300px] h-[300px] flex items-center justify-center transition-transform duration-500"
          style={{ transform: `scale(${stageScale})` }}
        >
          {/* Circular Orbit Guide Lines */}
          {ringsData.map((ring, idx) => (
            <div
              key={`orbit-line-${idx}`}
              className={`absolute rounded-full border pointer-events-none transition-all duration-500 ${
                idx < activeRingsCount
                  ? 'border-amber-500/25 border-dashed shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                  : idx === activeRingsCount && cursorCount > 0
                  ? 'border-white/10 border-dotted'
                  : 'border-transparent'
              }`}
              style={{
                width: ring.radius * 2,
                height: ring.radius * 2,
              }}
            />
          ))}

          {/* Concentric Rotating Rings with Cursors */}
          {activeRings.map(ring => {
            const isClockwise = ring.speed > 0;
            const durationSec = Math.abs(ring.speed);

            return (
              <motion.div
                key={`ring-${ring.ringIndex}`}
                animate={{ rotate: isClockwise ? 360 : -360 }}
                transition={{
                  repeat: Infinity,
                  duration: durationSec,
                  ease: 'linear'
                }}
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  width: ring.radius * 2,
                  height: ring.radius * 2,
                }}
              >
                {ring.cursors.map(c => {
                  const rad = (c.angleDeg * Math.PI) / 180;
                  // Base position along circle
                  const baseX = Math.cos(rad) * ring.radius;
                  const baseY = Math.sin(rad) * ring.radius;

                  // Tap offset towards center (0,0)
                  const tapDistance = cursorTapState ? 8 : 0;
                  const tapX = -Math.cos(rad) * tapDistance;
                  const tapY = -Math.sin(rad) * tapDistance;

                  // Rotation angle: cat paw toes point straight at the central cat (0, 0)
                  const inwardRotation = c.angleDeg - 90;

                  return (
                    <div
                      key={c.id}
                      className="absolute transition-transform duration-200 ease-out"
                      style={{
                        transform: `translate(${baseX + tapX}px, ${baseY + tapY}px) rotate(${inwardRotation}deg)`,
                      }}
                    >
                      {/* Kattenpootje (Cute animated cat paw with soft pads & toe beans) */}
                      <div className="relative filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] cursor-pointer group">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="transform hover:scale-130 transition-transform"
                        >
                          {/* Cat paw wrist/pad base - soft warm cream fur */}
                          <path
                            d="M7 21C6.5 16 6 12 7.5 9.5C9 7 15 7 16.5 9.5C18 12 17.5 16 17 21C14 22 10 22 7 21Z"
                            fill="#fef3c7"
                            stroke="#78350f"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                          {/* Big central paw pad (heart/oval bean) - pink */}
                          <ellipse cx="12" cy="13.8" rx="3.5" ry="2.8" fill="#f472b6" stroke="#db2777" strokeWidth="0.6" />
                          {/* 4 Cute toe beans */}
                          <ellipse cx="7.8" cy="8.8" rx="1.25" ry="1.55" transform="rotate(-15 7.8 8.8)" fill="#f472b6" stroke="#db2777" strokeWidth="0.5" />
                          <ellipse cx="10.6" cy="7.3" rx="1.3" ry="1.65" fill="#f472b6" stroke="#db2777" strokeWidth="0.5" />
                          <ellipse cx="13.4" cy="7.3" rx="1.3" ry="1.65" fill="#f472b6" stroke="#db2777" strokeWidth="0.5" />
                          <ellipse cx="16.2" cy="8.8" rx="1.25" ry="1.55" transform="rotate(15 16.2 8.8)" fill="#f472b6" stroke="#db2777" strokeWidth="0.5" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            );
          })}

          {/* Micro sparks on cursor tap */}
          {cursorSparks.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 1, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute pointer-events-none text-[10px] text-amber-300 font-bold"
              style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
            >
              ✨
            </motion.div>
          ))}

          {/* THE CENTRAL CLICKABLE BIG CAT BUTTON */}
          <div
            onClick={onCatClick}
            role="button"
            tabIndex={0}
            title={t("Klik op de kat om brokjes te oogsten!")}
            className="relative cursor-pointer select-none group z-20"
          >
            {/* Pulsing ring around cat */}
            <div 
              className={`absolute -inset-3 rounded-full transition-opacity duration-300 blur-md pointer-events-none ${
                isClickingCat ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-80'
              }`}
              style={{ background: skinBgGlow }}
            />

            {/* Cat Avatar Circle Button */}
            <motion.div
              animate={isClickingCat ? { scale: [1, 0.88, 1.1, 1], rotate: [0, -4, 4, 0] } : { scale: [1, 1.03, 1] }}
              transition={isClickingCat ? { duration: 0.16 } : { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full border-3 border-amber-400 bg-gradient-to-b from-amber-500/25 via-app-accent to-black/40 flex items-center justify-center relative shadow-[0_0_28px_rgba(245,158,11,0.28)] hover:border-amber-300 group-active:scale-95 transition-all"
            >
              <span className="text-5xl sm:text-6xl xl:text-7xl filter drop-shadow-lg select-none transform group-hover:scale-115 transition-transform">
                {skinEmoji}
              </span>

              {/* Tactile Click Badge */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md font-mono whitespace-nowrap border border-white/60">
                KLIK! 🐾
              </span>
            </motion.div>

            {/* Floating Numbers on Click - Centered over the cat, never spilling over other columns */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-visible">
              {floatingTexts.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 1, y: item.y || 0, x: item.x || 0, scale: 0.85 }}
                  animate={{ opacity: 0, y: (item.y || 0) - 70, scale: 1.2 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                  className={`absolute pointer-events-none text-sm sm:text-base font-mono font-black drop-shadow-md whitespace-nowrap select-none ${item.color}`}
                >
                  {item.text}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer: Kattenpootjes Rings Progress & Store Teaser */}
      <div className="w-full shrink-0 z-20 relative bg-app-card/90 backdrop-blur-sm p-2 rounded-2xl border border-app-border/70 shadow-sm flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
            🐾
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-app-ink truncate">
                {cursorCount} Kattenpootjes
              </span>
              {activeRingsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {activeRingsCount} {activeRingsCount === 1 ? 'ring' : 'ringen'} actief
                </span>
              )}
            </div>
            <p className="text-[10px] text-app-muted truncate">
              {cursorCount === 0 ? (
                <span>Koop kattenpootjes in de winkel om ringen rond de kat te vullen!</span>
              ) : isAllFull ? (
                <span className="text-amber-400">✨ Alle hemelse ringen zijn compleet gevuld met kattenpootjes!</span>
              ) : (
                <span>Ring {activeRingsCount > 0 ? (currentRing.isFull ? activeRingsCount : activeRingsCount) : 1}: {currentRing.count}/{currentRing.capacity} gevuld ({currentRing.capacity - currentRing.count} nodig)</span>
              )}
            </p>
          </div>
        </div>

        {onOpenStore && (
          <button
            onClick={onOpenStore}
            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0 font-mono flex items-center gap-1"
          >
            <span>+ Koop 🐾</span>
          </button>
        )}
      </div>

    </div>
  );
};
