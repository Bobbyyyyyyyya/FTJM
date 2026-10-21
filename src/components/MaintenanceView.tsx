import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Clock, LogOut, Lock, Gamepad2, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { OfflineView } from './OfflineView';

export interface MaintenanceViewProps {
  websiteStatus?: string;
  maintenanceTimeLeft?: number | null;
  scheduledTargetTime?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
  onAdminLogin?: () => void;
  onCheckStatus?: () => Promise<void> | void;
  className?: string;
  customTheme?: any;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  websiteStatus = 'Onderhoud',
  maintenanceTimeLeft,
  scheduledTargetTime,
  isAdmin = false,
  onLogout,
  onAdminLogin,
  onCheckStatus,
  className = '',
  customTheme
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [showGame, setShowGame] = useState(false);

  // Auto-check status every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (onCheckStatus) {
        onCheckStatus();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [onCheckStatus]);

  const handleManualPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      if (onCheckStatus) {
        await onCheckStatus();
      } else {
        await fetch(`/favicon.ico?_ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      }
      const ms = Math.round(performance.now() - start);
      setPingLatency(ms);
    } catch {
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  // Format remaining countdown
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-8 select-none text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white dark:bg-[#0c1322] backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-gradient-to-b from-amber-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top Status Capsule */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 dark:border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Systeemupdate & Onderhoud Actief</span>
        </div>

        {/* Cohesive Google-Style Animated SVG Vector Illustration (Zero collisions, pristine layout) */}
        {!showGame ? (
          <div className="relative mb-6 flex items-center justify-center">
            <svg
              viewBox="0 0 380 210"
              className="w-full max-w-[340px] sm:max-w-[420px] h-auto overflow-visible select-none drop-shadow-md"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Ambient Server Halo */}
                <radialGradient id="serverHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                  <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>

                {/* Server Body Gradient */}
                <linearGradient id="serverBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* Laser Scanline Gradient */}
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>

                {/* Base Shadow Gradient */}
                <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Floor Shadow */}
              <ellipse cx="190" cy="186" rx="100" ry="12" fill="url(#shadowGrad)" />

              {/* Background Ambient Glow & Orbital Ring */}
              <circle cx="190" cy="100" r="85" fill="url(#serverHalo)" />
              <circle
                cx="190"
                cy="100"
                r="95"
                stroke="#38bdf8"
                strokeOpacity="0.2"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />

              {/* LEFT SIDE: Smooth Animated Mechanical Gears (generous spacing, no collisions) */}
              <g transform="translate(68, 92)">
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  {/* Gear 1 Base */}
                  <circle cx="0" cy="0" r="28" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  {/* Gear 1 Teeth */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <rect
                      key={angle}
                      x="-4"
                      y="-33"
                      width="8"
                      height="8"
                      rx="2"
                      fill="#f59e0b"
                      transform={`rotate(${angle} 0 0)`}
                    />
                  ))}
                </motion.g>

                {/* Smaller Counter-Rotating Interlocking Gear */}
                <motion.g
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '-34px 34px' }}
                >
                  <circle cx="-34" cy="34" r="18" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="2" />
                  <circle cx="-34" cy="34" r="7" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <rect
                      key={angle}
                      x="-37"
                      y="11"
                      width="6"
                      height="6"
                      rx="1.5"
                      fill="#06b6d4"
                      transform={`rotate(${angle} -34 34)`}
                    />
                  ))}
                </motion.g>
              </g>

              {/* RIGHT SIDE: Levitating Google-Style Wrench & Cloud Sync Node */}
              <g transform="translate(305, 95)">
                {/* Floating Sync Capsule Node */}
                <motion.g
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <rect x="-42" y="-36" width="70" height="26" rx="13" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="-28" cy="-23" r="3" fill="#22d3ee">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <text x="-18" y="-19" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    v3.2 Sync
                  </text>
                </motion.g>

                {/* Floating Mechanical Spanner/Wrench */}
                <motion.g
                  animate={{
                    y: [4, -6, 4],
                    rotate: [0, 12, 0, -8, 0]
                  }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <g transform="translate(-15, 12) rotate(35)">
                    {/* Wrench Shaft */}
                    <rect x="-4" y="-20" width="8" height="40" rx="3" fill="#f59e0b" />
                    {/* Top Head */}
                    <path
                      d="M -12 -20 C -12 -30, 12 -30, 12 -20 L 5 -20 L 5 -24 L -5 -24 L -5 -20 Z"
                      fill="#f59e0b"
                    />
                    {/* Bottom Head */}
                    <path
                      d="M -10 20 C -10 28, 10 28, 10 20 L 4 20 L 4 23 L -4 23 L -4 20 Z"
                      fill="#f59e0b"
                    />
                  </g>
                </motion.g>

                {/* Little Sparkle Stars */}
                <motion.path
                  d="M -30 25 L -28 30 L -23 32 L -28 34 L -30 39 L -32 34 L -37 32 L -32 30 Z"
                  fill="#fbbf24"
                  animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </g>

              {/* CENTER: Google-Style Main Server Tower */}
              <g transform="translate(138, 38)">
                {/* Server Cabinet Main Body */}
                <rect
                  x="0"
                  y="0"
                  width="104"
                  height="142"
                  rx="18"
                  fill="url(#serverBodyGrad)"
                  stroke="#334155"
                  strokeWidth="2.5"
                />

                {/* High-tech top bevel highlight */}
                <rect x="12" y="5" width="80" height="2" rx="1" fill="#475569" />

                {/* Bay 1 (Top Drawer) */}
                <g transform="translate(10, 16)">
                  <rect x="0" y="0" width="84" height="34" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  {/* Grill Slots */}
                  <line x1="12" y1="12" x2="48" y2="12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="42" y2="18" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="12" y1="24" x2="48" y2="24" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Activity LEDs */}
                  <circle cx="62" cy="17" r="3.5" fill="#10b981">
                    <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="72" cy="17" r="3.5" fill="#38bdf8">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Bay 2 (Middle Drawer - Active Maintenance Core) */}
                <g transform="translate(10, 56)">
                  <rect x="0" y="0" width="84" height="34" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Pulsing Core Chip */}
                  <rect x="12" y="8" width="34" height="18" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1" />
                  <text x="17" y="21" fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">CORE</text>
                  {/* LEDs */}
                  <circle cx="62" cy="17" r="3.5" fill="#f59e0b">
                    <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="72" cy="17" r="3.5" fill="#ef4444">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Bay 3 (Bottom Drawer - Database Storage) */}
                <g transform="translate(10, 96)">
                  <rect x="0" y="0" width="84" height="34" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  <line x1="12" y1="12" x2="48" y2="12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="38" y2="18" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="12" y1="24" x2="48" y2="24" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="62" cy="17" r="3.5" fill="#10b981">
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="72" cy="17" r="3.5" fill="#22d3ee">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="1.1s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Animated Cyber Laser Scanline passing up and down */}
                <motion.rect
                  x="2"
                  y="10"
                  width="100"
                  height="3"
                  rx="1.5"
                  fill="url(#laserGrad)"
                  animate={{ y: [8, 126, 8] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 0 4px #38bdf8)' }}
                />
              </g>
            </svg>
          </div>
        ) : (
          /* While-You-Wait Runner Game Embedded */
          <div className="mb-6">
            <OfflineView onRetry={handleManualPing} />
            <button
              onClick={() => setShowGame(false)}
              className="mt-3 px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Terug naar Onderhoud Status
            </button>
          </div>
        )}

        {/* Headline & Body Copy */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2.5">
          We voeren momenteel onderhoud uit
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300/90 max-w-lg mx-auto leading-relaxed mb-6 font-medium">
          Het <span className="font-bold text-zinc-900 dark:text-white">FTJM Besloten Netwerk</span> wordt tijdelijk bijgewerkt met de nieuwste beveiligingspatches en database optimalisaties.
        </p>

        {/* Live Countdown if available */}
        {typeof maintenanceTimeLeft === 'number' && maintenanceTimeLeft > 0 && (
          <div className="max-w-xs mx-auto mb-6 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 dark:border-amber-400/30 flex items-center justify-center gap-3 shadow-sm">
            <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Geschatte herstart over</p>
              <p className="text-xl font-black font-mono text-zinc-900 dark:text-white">
                {formatCountdown(maintenanceTimeLeft)}
              </p>
            </div>
          </div>
        )}

        {/* Real-Time Maintenance Stage Roadmap (High-Contrast, Clean & Spacious) */}
        <div className="max-w-md mx-auto mb-8 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 text-left text-xs space-y-3.5 shadow-sm">
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Voortgang van het onderhoud
          </p>

          <div className="flex items-center gap-3 text-zinc-800 dark:text-zinc-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs leading-snug">Database snapshot & gegevensback-up veiliggesteld</span>
          </div>

          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300 font-bold">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span className="text-xs leading-snug">Beveiligingskern & database optimalisaties uitrollen</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
            <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 text-[11px] font-bold border border-zinc-300 dark:border-zinc-700">
              3
            </div>
            <span className="text-xs leading-snug font-medium">Cache heropbouwen & automatische herstart</span>
          </div>
        </div>

        {/* Action Buttons (Consistent Height, Clean Padding, High Contrast) */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
          <button
            onClick={handleManualPing}
            disabled={isPinging}
            className="h-12 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>
              {isPinging ? 'Status controleren...' : pingLatency ? `Online! (${pingLatency}ms)` : 'Server Status Controleren'}
            </span>
          </button>

          {!showGame && (
            <button
              onClick={() => setShowGame(true)}
              className="h-12 px-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Speel Spelletje Tussendoor</span>
            </button>
          )}

          {onAdminLogin && (
            <button
              onClick={onAdminLogin}
              className="h-12 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Beheerders Inlog</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="h-12 px-5 rounded-2xl bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Uitloggen</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
