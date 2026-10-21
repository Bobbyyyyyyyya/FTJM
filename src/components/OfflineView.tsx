import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, Gamepad2, Play, Trophy, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Home } from 'lucide-react';

export interface OfflineViewProps {
  onRetry?: () => void;
  onOpenLocalArchive?: () => void;
  className?: string;
  customTheme?: any;
}

// 8-bit Web Audio Retro Sound Generator (zero external assets needed)
const playRetroSound = (type: 'jump' | 'hit' | 'score' | 'ping') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'score') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy
  }
};

export const OfflineView: React.FC<OfflineViewProps> = ({
  onRetry,
  onOpenLocalArchive,
  className = '',
  customTheme
}) => {
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'offline' | 'online'; ms?: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Chrome Dino-style Game State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('ftjm_dino_highscore') || 0);
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);

  // Connection Ping Test
  const handleCheckConnection = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      // Ping timestamped request to verify live internet
      const res = await fetch(`/favicon.ico?_ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store'
      });
      const ms = Math.round(performance.now() - start);
      if (res.ok || res.type === 'opaque' || res.status < 500) {
        if (soundEnabled) playRetroSound('score');
        setPingResult({ status: 'online', ms });
        setTimeout(() => {
          if (onRetry) onRetry();
          else window.location.reload();
        }, 1200);
      } else {
        if (soundEnabled) playRetroSound('hit');
        setPingResult({ status: 'offline', ms });
      }
    } catch {
      const ms = Math.round(performance.now() - start);
      if (soundEnabled) playRetroSound('hit');
      setPingResult({ status: 'offline', ms });
    } finally {
      setIsPinging(false);
    }
  };

  // Google-Style Arcade Dino / Space Cat Runner Logic
  const gameStateRef = useRef({
    running: false,
    dinoY: 0,
    dinoVy: 0,
    isGrounded: true,
    score: 0,
    obstacles: [] as { x: number; width: number; height: number; type: 'cactus' | 'tower' | 'cloud' }[],
    gameSpeed: 6,
    animFrameId: 0,
    lastObstacleTime: 0
  });

  const jump = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isGrounded && s.running) {
      s.dinoVy = -11.5;
      s.isGrounded = false;
      if (soundEnabled) playRetroSound('jump');
    }
  }, [soundEnabled]);

  const startGame = useCallback(() => {
    const s = gameStateRef.current;
    s.running = true;
    s.dinoY = 0;
    s.dinoVy = 0;
    s.isGrounded = true;
    s.score = 0;
    s.obstacles = [];
    s.gameSpeed = 6;
    s.lastObstacleTime = Date.now();
    setScore(0);
    setGameOver(false);
    setIsPlayingGame(true);
    if (soundEnabled) playRetroSound('ping');
  }, [soundEnabled]);

  // Main Canvas Game Loop
  useEffect(() => {
    if (!isPlayingGame) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localRunning = true;
    const groundY = 160;

    const gameLoop = () => {
      if (!localRunning) return;
      const s = gameStateRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid / Google Retro Style Starry Sky
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Horizon Ground Line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Draw ground pebbles / dashed lines
      ctx.fillStyle = '#94a3b8';
      const groundOffset = (Date.now() / 20) % 20;
      for (let x = -groundOffset; x < canvas.width; x += 32) {
        ctx.fillRect(x, groundY + 4, 8, 2);
        ctx.fillRect(x + 16, groundY + 12, 14, 2);
      }

      if (s.running) {
        // Physics: Dino gravity
        s.dinoVy += 0.65;
        s.dinoY += s.dinoVy;
        if (s.dinoY >= 0) {
          s.dinoY = 0;
          s.dinoVy = 0;
          s.isGrounded = true;
        }

        // Increment Score & Speed Scaling
        s.score += 1;
        if (s.score % 5 === 0) {
          setScore(Math.floor(s.score / 5));
        }
        s.gameSpeed = 6 + Math.min(Math.floor(s.score / 250), 7);

        // Spawn Obstacles
        const now = Date.now();
        const minSpawnInterval = Math.max(950 - s.gameSpeed * 40, 550);
        if (now - s.lastObstacleTime > minSpawnInterval && Math.random() < 0.35) {
          const type = Math.random() > 0.45 ? 'cactus' : 'tower';
          s.obstacles.push({
            x: canvas.width + 20,
            width: type === 'cactus' ? 24 : 18,
            height: type === 'cactus' ? 36 : 46,
            type
          });
          s.lastObstacleTime = now;
        }

        // Update Obstacles & Collision Check
        const dinoBox = {
          x: 46,
          y: groundY - 34 + s.dinoY,
          width: 32,
          height: 34
        };

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.gameSpeed;

          // Collision detection box
          const obsBox = {
            x: obs.x,
            y: groundY - obs.height,
            width: obs.width,
            height: obs.height
          };

          // AABB Collision
          if (
            dinoBox.x < obsBox.x + obsBox.width &&
            dinoBox.x + dinoBox.width > obsBox.x &&
            dinoBox.y < obsBox.y + obsBox.height &&
            dinoBox.y + dinoBox.height > obsBox.y
          ) {
            // Hit! Game Over!
            s.running = false;
            localRunning = false;
            setGameOver(true);
            if (soundEnabled) playRetroSound('hit');
            const finalScore = Math.floor(s.score / 5);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              try {
                localStorage.setItem('ftjm_dino_highscore', String(finalScore));
              } catch {}
            }
            break;
          }

          // Remove off-screen obstacles
          if (obs.x < -40) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Draw Dino / Google-Style Space Mascot
      const dinoScreenX = 46;
      const dinoScreenY = groundY - 34 + s.dinoY;

      // Mascot Body (Google playful pixel style)
      ctx.fillStyle = '#0ea5e9'; // Cyan/Blue
      ctx.beginPath();
      ctx.roundRect(dinoScreenX, dinoScreenY + 4, 30, 26, 6);
      ctx.fill();

      // Mascot Visor / Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dinoScreenX + 18, dinoScreenY + 10, 8, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(dinoScreenX + 22, dinoScreenY + 12, 3, 3);

      // Antenna / Ears
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(dinoScreenX + 6, dinoScreenY, 4, 6);
      ctx.fillRect(dinoScreenX + 14, dinoScreenY - 2, 4, 8);

      // Legs animation
      ctx.fillStyle = '#0369a1';
      const legStep = Math.floor(Date.now() / 90) % 2;
      if (s.isGrounded && s.running) {
        if (legStep === 0) {
          ctx.fillRect(dinoScreenX + 5, dinoScreenY + 30, 6, 6);
          ctx.fillRect(dinoScreenX + 20, dinoScreenY + 30, 6, 3);
        } else {
          ctx.fillRect(dinoScreenX + 5, dinoScreenY + 30, 6, 3);
          ctx.fillRect(dinoScreenX + 20, dinoScreenY + 30, 6, 6);
        }
      } else {
        ctx.fillRect(dinoScreenX + 8, dinoScreenY + 30, 5, 5);
        ctx.fillRect(dinoScreenX + 17, dinoScreenY + 30, 5, 5);
      }

      // Draw Obstacles
      s.obstacles.forEach((obs) => {
        if (obs.type === 'cactus') {
          // Playful Google Cactus
          ctx.fillStyle = '#10b981'; // Emerald
          ctx.beginPath();
          ctx.roundRect(obs.x + 8, groundY - obs.height, 8, obs.height, 3);
          ctx.fill();
          // Side arms
          ctx.fillRect(obs.x, groundY - obs.height + 10, 10, 5);
          ctx.fillRect(obs.x, groundY - obs.height + 6, 5, 9);
          ctx.fillRect(obs.x + 14, groundY - obs.height + 14, 10, 5);
          ctx.fillRect(obs.x + 19, groundY - obs.height + 9, 5, 10);
        } else {
          // Disconnected WiFi Tower Obstacle
          ctx.fillStyle = '#f59e0b'; // Amber
          ctx.beginPath();
          ctx.roundRect(obs.x + 5, groundY - obs.height, 8, obs.height, 2);
          ctx.fill();
          // Base
          ctx.fillRect(obs.x, groundY - 8, 18, 8);
          // Red glowing disconnect LED
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(obs.x + 9, groundY - obs.height - 3, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Continue animation loop
      if (localRunning) {
        s.animFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameStateRef.current.animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      localRunning = false;
      cancelAnimationFrame(gameStateRef.current.animFrameId);
    };
  }, [isPlayingGame, soundEnabled, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlayingGame || gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingGame, gameOver, startGame, jump]);

  return (
    <div className={`min-h-[82vh] flex flex-col items-center justify-center p-4 sm:p-8 select-none text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider mb-6 border border-zinc-200 dark:border-zinc-700/60 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-rose-500 -ml-4" />
          <span>Geen Internetverbinding</span>
        </div>

        {/* Google-Inspired Hero Illustration or Mini Game */}
        {!isPlayingGame ? (
          <div className="relative mb-6 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 380 200"
              className="w-full max-w-[340px] sm:max-w-[400px] h-auto overflow-visible select-none drop-shadow-md"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="offlineHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="offlineShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Floor Shadow */}
              <ellipse cx="190" cy="180" rx="90" ry="10" fill="url(#offlineShadow)" />

              {/* Background Ambient Glow & Dotted Orbit */}
              <circle cx="190" cy="95" r="80" fill="url(#offlineHalo)" />
              <circle
                cx="190"
                cy="95"
                r="88"
                stroke="#06b6d4"
                strokeOpacity="0.2"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />

              {/* Floating Orbiting Satellite (Right side) */}
              <g transform="translate(305, 52)">
                <motion.g
                  animate={{ y: [-5, 6, -5], rotate: [-4, 4, -4] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <rect x="-16" y="-12" width="32" height="24" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  {/* Solar Wings */}
                  <rect x="-26" y="-7" width="10" height="14" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  <rect x="16" y="-7" width="10" height="14" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  {/* Blinking Signal Beacon */}
                  <circle cx="0" cy="0" r="3.5" fill="#f43f5e">
                    <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <line x1="0" y1="-12" x2="0" y2="-18" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="0" cy="-19" r="2" fill="#38bdf8" />
                </motion.g>
              </g>

              {/* LEFT: Floating Disconnected Plug with Cable */}
              <g transform="translate(95, 115)">
                <motion.g
                  animate={{ x: [-3, 3, -3], y: [2, -3, 2] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Cable Curve */}
                  <path d="M -45 28 C -30 28, -25 15, -12 6" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                  {/* Plug Body */}
                  <rect x="-12" y="-9" width="22" height="18" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  {/* Prongs */}
                  <rect x="10" y="-6" width="12" height="3.5" rx="1" fill="#cbd5e1" />
                  <rect x="10" y="2.5" width="12" height="3.5" rx="1" fill="#cbd5e1" />
                </motion.g>
              </g>

              {/* RIGHT: Floating Socket Receptacle */}
              <g transform="translate(170, 115)">
                <motion.g
                  animate={{ x: [3, -3, 3], y: [-2, 3, -2] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Socket Body */}
                  <rect x="0" y="-12" width="24" height="24" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  {/* Socket Holes */}
                  <circle cx="8" cy="-4" r="2" fill="#0f172a" />
                  <circle cx="8" cy="4" r="2" fill="#0f172a" />
                  {/* Cable Curve */}
                  <path d="M 24 0 C 36 0, 42 18, 55 24" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                </motion.g>
              </g>

              {/* Electric Sparks Jumping Between Plugs */}
              <motion.path
                d="M 125 112 L 132 106 L 136 114 L 144 108 L 140 117 L 148 113 L 138 122 L 133 115 Z"
                fill="#38bdf8"
                animate={{
                  opacity: [0, 1, 0, 0.9, 0],
                  scale: [0.7, 1.2, 0.7]
                }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />

              {/* CENTER: Google-Style Cloud with Disconnected WiFi Arcs */}
              <g transform="translate(190, 72)">
                <motion.g
                  animate={{ y: [-4, 5, -4] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Cloud Silhouette */}
                  <path
                    d="M -35 15 C -46 15, -55 5, -55 -6 C -55 -17, -47 -26, -36 -26 C -34 -38, -22 -48, -7 -48 C 6 -48, 17 -40, 21 -29 C 30 -29, 38 -21, 38 -12 C 38 -2, 30 6, 21 6 Z"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  {/* Soft Cloud Inner Gradient */}
                  <path
                    d="M -32 12 C -42 12, -50 3, -50 -6 C -50 -15, -43 -23, -33 -23 C -31 -34, -20 -44, -7 -44 C 5 -44, 14 -37, 18 -27 C 27 -27, 34 -20, 34 -12 C 34 -3, 27 3, 19 3 Z"
                    fill="#1e293b"
                  />

                  {/* Disconnected WiFi Arcs */}
                  <g transform="translate(-8, -14)">
                    {/* Outer Broken Arc */}
                    <path
                      d="M -16 -12 A 20 20 0 0 1 16 -12"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Middle Broken Arc */}
                    <path
                      d="M -10 -6 A 12 12 0 0 1 10 -6"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Center Point */}
                    <circle cx="0" cy="0" r="2.5" fill="#f43f5e" />
                    {/* Diagonal Disconnect Strike Through */}
                    <line x1="-14" y1="-16" x2="14" y2="4" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </motion.g>
              </g>
            </svg>

            {/* Play Dino Button (cleanly positioned below the SVG) */}
            <button
              onClick={startGame}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-zinc-200 dark:border-white/10 group"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-500 group-hover:rotate-12 transition-transform" />
              <span>Speel Offline Runner</span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 dark:bg-zinc-900/10 text-[10px] font-mono font-bold">
                SPATIE
              </span>
            </button>
          </div>
        ) : (
          /* Playable Google Dino / Arcade Runner Canvas */
          <div className="relative mb-6 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 shadow-inner">
            {/* Game Canvas */}
            <canvas
              ref={canvasRef}
              width={600}
              height={190}
              onClick={gameOver ? startGame : jump}
              className="w-full h-auto cursor-pointer block touch-none"
            />

            {/* Score & Controls HUD */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs font-mono font-bold pointer-events-none">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200">
                <span>SCORE:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-black">{score.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>TOP: {highScore.toString().padStart(5, '0')}</span>
              </div>
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-zinc-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white z-20"
              >
                <p className="text-xl font-black uppercase tracking-wider text-rose-400 mb-1">Game Over!</p>
                <p className="text-xs text-zinc-300 font-mono mb-4">Eindscore: <strong className="text-white text-sm">{score}</strong></p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={startGame}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Opnieuw Spelen</span>
                  </button>
                  <button
                    onClick={() => setIsPlayingGame(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Sluiten
                  </button>
                </div>
              </motion.div>
            )}

            {/* Jump Touch Trigger on Mobile */}
            <div className="sm:hidden p-2 bg-zinc-100 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
              <span>Tik op het scherm of druk op spatie om te springen</span>
            </div>
          </div>
        )}

        {/* Title & Google Description */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
          Je bent momenteel offline
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
          Controleer je wifi- of mobiele verbinding. Zodra je weer online bent, verbindt het forum automatisch opnieuw.
        </p>

        {/* Live Diagnostics & Reconnect Radar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-8 text-left text-xs">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pingResult?.status === 'online' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Verbindingsstatus</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {pingResult ? (pingResult.status === 'online' ? `Online (${pingResult.ms}ms)` : `Niet bereikbaar (${pingResult.ms}ms)`) : 'Geen internet gedetecteerd'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Offline Geheugen</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Lokale cache & sessie actief
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
          <button
            onClick={handleCheckConnection}
            disabled={isPinging}
            className="h-12 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Verbinding testen...' : 'Verbinding Opnieuw Testen'}</span>
          </button>

          {!isPlayingGame && (
            <button
              onClick={startGame}
              className="h-12 px-5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Speel Runner Game</span>
            </button>
          )}

          {onOpenLocalArchive && (
            <button
              onClick={onOpenLocalArchive}
              className="h-12 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Offline Berichten</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
