import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Zap, Play } from 'lucide-react';
import { toast } from 'sonner';

// Props for the Game component
interface HamsterGameProps {
  onBack: () => void;
  isFullscreen?: boolean;
  userProfile?: any;
  onSaveHighScore?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster', score: number) => Promise<void>;
  onShareHighScoreOpen?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster', score: number) => void;
}

// Direction Type
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;

// Actor Interface (Hamster & Colas)
interface GameActor {
  x: number;               // Current canvas pixel x
  y: number;               // Current canvas pixel y
  gridX: number;           // Current grid column
  gridY: number;           // Current grid row
  targetGridX: number;     // Target grid column
  targetGridY: number;     // Target grid row
  speed: number;           // Movement speed in pixels per frame
  currentDir: Direction;
  nextDir: Direction;
  isFrightened: boolean;   // Activated when Power Peanut is active
  color: string;           // styling color highlight
  emoji: string;           // Visual character emoji
  name: string;
  isLocked?: boolean;
  teleportCooldown?: number;
}

let CELL_SIZE = 24;
let COLS = 15;
let ROWS = 15;

// Maze layout representation
// 1 = Wall (solid blocks)
// 0 = Vodka Bottle (🍾)
// 2 = Power Peanut (🥜)
// 3 = Empty/Safe walk path (respawn or tunnel corridor)
// 6 = Wet spot (Brewery)
// 7 = Portal (Cosmic)
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 2, 1],
  [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1, 3, 3, 3, 3, 3, 1, 1, 0, 1, 1],
  [3, 0, 0, 0, 0, 3, 1, 1, 1, 3, 0, 0, 0, 0, 3], // Maze tunnel warp zones at row index 6!
  [1, 1, 0, 1, 1, 3, 1, 3, 1, 3, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 1, 3, 1, 3, 1, 3, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 3, 3, 3, 3, 3, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1],
  [1, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const DEVIL_MAZE_21 = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 2, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 1, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 1, 0, 1],
  [3, 0, 0, 0, 1, 0, 3, 3, 3, 1, 1, 1, 3, 3, 3, 0, 1, 0, 0, 0, 3], // Warp row index 10!
  [1, 0, 1, 0, 1, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 3, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 3, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 2, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const isCellGhostCage = (x: number, y: number, cols: number, level: number) => {
  if (cols === 21) {
    // 21x21 map (Level 3 - Devil's Cave) cage: Rows 7 to 13, Cols 6 to 14
    return (y >= 7 && y <= 13) && (x >= 6 && x <= 14);
  } else if (level === 2) {
    // Level 2 - Brewery: No cage at all!
    return false;
  } else {
    // Standard 15x15 map cage: Rows 4 and 5, Cols 5 to 9
    return (y === 4 && x >= 6 && x <= 8) || (y === 5 && x >= 5 && x <= 9);
  }
};

const getMazeForLevel = (lvl: number): { maze: number[][]; cols: number; rows: number; cellSize: number } => {
  if (lvl === 1) {
    return {
      maze: JSON.parse(JSON.stringify(INITIAL_MAZE)),
      cols: 15,
      rows: 15,
      cellSize: 24
    };
  } else if (lvl === 2) {
    const BREWERY_MAZE = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 3, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 3, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 3, 3, 3, 3, 3, 1, 0, 0, 0, 1],
      [3, 0, 1, 0, 1, 1, 1, 3, 1, 1, 1, 0, 1, 0, 3],
      [1, 0, 1, 0, 0, 0, 1, 3, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    const mazeCloned = JSON.parse(JSON.stringify(BREWERY_MAZE));
    // Plassen met nat bier dat de hamster vertraagt (waarde 6)
    mazeCloned[3][3] = 6;
    mazeCloned[3][11] = 6;
    mazeCloned[9][3] = 6;
    mazeCloned[9][11] = 6;
    mazeCloned[11][7] = 6;
    return {
      maze: mazeCloned,
      cols: 15,
      rows: 15,
      cellSize: 24
    };
  } else if (lvl === 3) {
    return {
      maze: JSON.parse(JSON.stringify(DEVIL_MAZE_21)),
      cols: 21,
      rows: 21,
      cellSize: 17
    };
  } else if (lvl === 4) {
    const TUNDRA_MAZE = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 2, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 3, 3, 3, 3, 3, 1, 1, 0, 1, 1],
      [3, 0, 0, 0, 0, 3, 1, 1, 1, 3, 0, 0, 0, 0, 3],
      [1, 1, 0, 1, 1, 3, 1, 3, 1, 3, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1, 3, 1, 3, 1, 3, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 3, 3, 3, 3, 3, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    return {
      maze: JSON.parse(JSON.stringify(TUNDRA_MAZE)),
      cols: 15,
      rows: 15,
      cellSize: 24
    };
  } else {
    const COSMIC_MAZE = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 7, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 7, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 3, 3, 3, 3, 3, 1, 1, 0, 1, 1],
      [3, 0, 0, 0, 0, 3, 1, 1, 1, 3, 0, 0, 0, 0, 3],
      [1, 1, 0, 1, 1, 3, 1, 3, 1, 3, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1, 3, 1, 3, 1, 3, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 3, 3, 3, 3, 3, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1],
      [1, 7, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 7, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    return {
      maze: JSON.parse(JSON.stringify(COSMIC_MAZE)),
      cols: 15,
      rows: 15,
      cellSize: 24
    };
  }
};

export function HamsterGame({ onBack, isFullscreen, userProfile, onSaveHighScore, onShareHighScoreOpen }: HamsterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playStateRef = useRef<'idle' | 'playing' | 'gameover'>('idle');
  const [gameState, setGameStateInner] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // React State for display
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  const [highScore, setHighScore] = useState(() => {
    const cloudScore = userProfile?.custom_theme?.game_high_scores?.hamster;
    return typeof cloudScore === 'number' ? cloudScore : Number(localStorage.getItem('ftjm_hamster_highscore') || '0');
  });

  // Synchronise high scores to cloud on Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('ftjm_hamster_highscore', String(score));
      }
      onSaveHighScore?.('hamster', score);
    }
  }, [gameState, score]);

  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [frightenedTimer, setFrightenedTimer] = useState(0);
  const [devilModeTimer, setDevilModeTimer] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<{ type: string; name: string; icon: string; desc: string; durationSec: number } | null>(null);
  const currentEventRef = useRef<{ type: string; name: string; icon: string; desc: string; durationSec: number } | null>(null);

  // Shared ref to avoid creating a new AudioContext on every sound play
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Clean up AudioContext on unmount to release resources
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Web Audio Hook For Synthesized Retro Atmosphere using a single cached context
  const playTone = (type: 'eat' | 'power' | 'eat_cola' | 'die' | 'victory' | 'start' | 'devil_chili' | 'eat_peanut') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      
      // Auto-resume if context was suspended by browser autoplay policy
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'power' || type === 'eat_peanut') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(450, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.32);
        osc.start();
        osc.stop(ctx.currentTime + 0.33);
      } else if (type === 'eat_cola') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
      } else if (type === 'die') {
        // Falling retro sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.46);
        osc.start();
        osc.stop(ctx.currentTime + 0.46);
      } else if (type === 'start') {
        // Upbeat little retro theme
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          noteGain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
          noteOsc.start(ctx.currentTime + i * 0.1);
          noteOsc.stop(ctx.currentTime + i * 0.1 + 0.18);
        });
      } else if (type === 'victory') {
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          noteGain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
          noteOsc.start(ctx.currentTime + i * 0.08);
          noteOsc.stop(ctx.currentTime + i * 0.08 + 0.28);
        });
      } else if (type === 'devil_chili') {
        const notes = [220, 330, 440, 660, 880];
        notes.forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'sawtooth';
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
          noteOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + i * 0.05 + 0.12);
          noteGain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.12);
          noteOsc.start(ctx.currentTime + i * 0.05);
          noteOsc.stop(ctx.currentTime + i * 0.05 + 0.15);
        });
      }
    } catch (err) {
      console.warn('Synth sound was blocked or failed:', err);
    }
  };

  const setGameState = (s: 'idle' | 'playing' | 'gameover') => {
    playStateRef.current = s;
    setGameStateInner(s);
  };

  // Game Engine Coordinates and Instances kept in reference for the requestAnimationFrame loop
  const engineRef = useRef({
    score: 0,
    lives: 3,
    level: 1,
    frightenedTimer: 0,
    maze: JSON.parse(JSON.stringify(INITIAL_MAZE)) as number[][],
    keysPressed: {
      UP: false,
      DOWN: false,
      LEFT: false,
      RIGHT: false
    },
    // Player Hamster
    hamster: {
      x: 7 * CELL_SIZE,
      y: 13 * CELL_SIZE,
      gridX: 7,
      gridY: 13,
      targetGridX: 7,
      targetGridY: 13,
      speed: 2, // Must divide CELL_SIZE (24) cleanly! Standard speed is 2
      currentDir: null as Direction,
      nextDir: null as Direction,
      isFrightened: false,
      color: '#f59e0b',
      emoji: '🐹',
      name: 'Hamster'
    } as GameActor,
    // Ghosts Cola Bottles
    ghosts: [] as GameActor[],
    invulnFrames: 0, // Flash invulnerable frames when caught
    frameCount: 0,
    devilModeTimer: 0,
    eventTimer: 0
  });

  // Init/Spawn the Ghosts
  const initActors = (keepScores = false) => {
    const engine = engineRef.current;
    
    if (!keepScores) {
      engine.score = 0;
      engine.lives = 3;
      engine.level = 1;
    }

    // Load layout dynamically depending on level
    const layout = getMazeForLevel(engine.level);
    engine.maze = layout.maze;
    COLS = layout.cols;
    ROWS = layout.rows;
    CELL_SIZE = layout.cellSize;

    // Reset random event
    currentEventRef.current = null;
    setCurrentEvent(null);

    // 10% chance of a Golden Vodka appearing on a level
    if (Math.random() < 0.10) {
      const vodkaCells: { r: number, c: number }[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (engine.maze[r][c] === 0) {
            vodkaCells.push({ r, c });
          }
        }
      }
      if (vodkaCells.length > 0) {
        const randCell = vodkaCells[Math.floor(Math.random() * vodkaCells.length)];
        engine.maze[randCell.r][randCell.c] = 4; // 4 = Golden Vodka
        toast.success("✨ GELUK! Een zeldzame GOUDEN VODKA is op dit level gespawned! ✨", { duration: 5000 });
      }
    }

    if (!keepScores) {
      setScore(0);
      setLives(3);
      setLevel(1);
    }

    // Position Hamster safely based on the maze columns and rows
    const hamX = COLS === 21 ? 10 : 7;
    const hamY = COLS === 21 ? 17 : 13;
    engine.hamster.gridX = hamX;
    engine.hamster.gridY = hamY;
    engine.hamster.targetGridX = hamX;
    engine.hamster.targetGridY = hamY;
    engine.hamster.x = hamX * CELL_SIZE;
    engine.hamster.y = hamY * CELL_SIZE;
    engine.hamster.currentDir = null;
    engine.hamster.nextDir = null;

    // Reset keyboard states
    engine.keysPressed = {
      UP: false,
      DOWN: false,
      LEFT: false,
      RIGHT: false
    };

    // Calculate dynamic ghost speed based on level (starts slower, gets a bit faster per level)
    const isNightmare = engine.level >= 10;
    const baseSpeed = isNightmare 
      ? 4.0 
      : 0.9 + Math.min(engine.level - 1, 8) * 0.125;

    // Determine how many ghosts are active on the field based on Level
    const activeCount = engine.level === 1 ? 1 : (engine.level === 2 ? 5 : (engine.level < 5 ? 4 : 5));

    // Colas setup
    engine.ghosts = [
      {
        x: (COLS === 21 ? 10 : 7) * CELL_SIZE,
        y: (COLS === 21 ? 6 : 3) * CELL_SIZE,
        gridX: COLS === 21 ? 10 : 7,
        gridY: COLS === 21 ? 6 : 3,
        targetGridX: COLS === 21 ? 10 : 7,
        targetGridY: COLS === 21 ? 6 : 3,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#ef4444',
        emoji: '🥤', // Classic Red Cola
        name: 'Kersen Cola',
        isLocked: false
      },
      {
        x: (COLS === 21 ? 9 : 6) * CELL_SIZE,
        y: (COLS === 21 ? 8 : 5) * CELL_SIZE,
        gridX: COLS === 21 ? 9 : 6,
        gridY: COLS === 21 ? 8 : 5,
        targetGridX: COLS === 21 ? 9 : 6,
        targetGridY: COLS === 21 ? 8 : 5,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#06b6d4',
        emoji: '🥤', // Blue Diet Cola Cup
        name: 'Diet Cola',
        isLocked: true
      },
      {
        x: (COLS === 21 ? 11 : 8) * CELL_SIZE,
        y: (COLS === 21 ? 8 : 5) * CELL_SIZE,
        gridX: COLS === 21 ? 11 : 8,
        gridY: COLS === 21 ? 8 : 5,
        targetGridX: COLS === 21 ? 11 : 8,
        targetGridY: COLS === 21 ? 8 : 5,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#eab308', // Amber Yellow
        emoji: '🥤', // Lemon Cola Cup
        name: 'Citroen Cola',
        isLocked: true
      },
      {
        x: (COLS === 21 ? 8 : 5) * CELL_SIZE,
        y: (COLS === 21 ? 8 : 5) * CELL_SIZE,
        gridX: COLS === 21 ? 8 : 5,
        gridY: COLS === 21 ? 8 : 5,
        targetGridX: COLS === 21 ? 8 : 5,
        targetGridY: COLS === 21 ? 8 : 5,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#a855f7', // Cassis Purple
        emoji: '🥤',
        name: 'Cassis Soda',
        isLocked: true
      },
      {
        x: (COLS === 21 ? 12 : 9) * CELL_SIZE,
        y: (COLS === 21 ? 8 : 5) * CELL_SIZE,
        gridX: COLS === 21 ? 12 : 9,
        gridY: COLS === 21 ? 8 : 5,
        targetGridX: COLS === 21 ? 12 : 9,
        targetGridY: COLS === 21 ? 8 : 5,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#22c55e', // Lime Green
        emoji: '🥤',
        name: 'Lime Soda',
        isLocked: true
      }
    ];

    // Assign active positions and locks dynamically
    engine.ghosts.forEach((ghost, idx) => {
      const isActive = idx < activeCount;
      ghost.isLocked = !isActive;

      if (isActive) {
        let startX = COLS === 21 ? 10 : 7;
        let startY = COLS === 21 ? 6 : 3;
        if (COLS === 21) {
          if (idx === 1) { startX = 6; startY = 6; }
          else if (idx === 2) { startX = 14; startY = 6; }
          else if (idx === 3) { startX = 3; startY = 6; }
          else if (idx === 4) { startX = 17; startY = 6; }
        } else {
          if (idx === 1) { startX = 4; startY = 3; }
          else if (idx === 2) { startX = 10; startY = 3; }
          else if (idx === 3) { startX = 2; startY = 3; }
          else if (idx === 4) { startX = 12; startY = 3; }
        }

        ghost.gridX = startX;
        ghost.gridY = startY;
        ghost.targetGridX = startX;
        ghost.targetGridY = startY;
        ghost.x = startX * CELL_SIZE;
        ghost.y = startY * CELL_SIZE;
        ghost.currentDir = 'UP';
        ghost.nextDir = 'UP';
      } else {
        let cageX = COLS === 21 ? 10 : 7;
        let cageY = COLS === 21 ? 8 : 5;
        if (COLS === 21) {
          if (idx === 1) { cageX = 9; cageY = 8; }
          else if (idx === 2) { cageX = 11; cageY = 8; }
          else if (idx === 3) { cageX = 8; cageY = 8; }
          else if (idx === 4) { cageX = 12; cageY = 8; }
        } else {
          if (idx === 1) { cageX = 6; cageY = 5; }
          else if (idx === 2) { cageX = 8; cageY = 5; }
          else if (idx === 3) { cageX = 5; cageY = 5; }
          else if (idx === 4) { cageX = 9; cageY = 5; }
        }

        ghost.gridX = cageX;
        ghost.gridY = cageY;
        ghost.targetGridX = cageX;
        ghost.targetGridY = cageY;
        ghost.x = cageX * CELL_SIZE;
        ghost.y = cageY * CELL_SIZE;
        ghost.currentDir = 'UP';
        ghost.nextDir = 'UP';
      }
    });

    engine.invulnFrames = 0;
    engine.frightenedTimer = 0;
    setFrightenedTimer(0);
    engine.devilModeTimer = 0;
    setDevilModeTimer(0);
    engine.hamster.speed = 2;

    // Spawn Devil Chili Peppers
    const vodkaCells: { r: number, c: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (engine.maze[r][c] === 0) {
          vodkaCells.push({ r, c });
        }
      }
    }
    
    const targetChilis = engine.level < 3 ? 0 : 3;
    const chiliCount = Math.min(targetChilis, vodkaCells.length);
    for (let i = 0; i < chiliCount; i++) {
      if (vodkaCells.length === 0) break;
      const randIdx = Math.floor(Math.random() * vodkaCells.length);
      const cell = vodkaCells.splice(randIdx, 1)[0];
      engine.maze[cell.r][cell.c] = 5;
    }

    if (engine.level === 1) {
      toast.success("🥤 WELKOM BIJ DE KLASSIEKE FRISDRANK EXPANSIE! Eet colaflessen en ontwijk de gevaren! Hamster Vodka Run! 🐹", { duration: 6000 });
    } else if (engine.level === 2) {
      toast.success("🍺 BROUWERIJ EXPANSIE ACTIEF! Pas op voor de trage bierplassen! 🍺", { duration: 6000 });
    } else if (engine.level === 3) {
      toast.error("😈 DUIVELSGROT EXPANSIE: DE KAART IS NU GIGANTISCH GROOT! 🌶️ Ontwijk de cola's in deze mega-grot! 🔥", { duration: 7000 });
    } else if (engine.level === 4) {
      toast.success("❄️ FROZEN TUNDRA EXPANSIE: IJsgladde banen! De hamster glijdt door! ❄️", { duration: 6000 });
    } else {
      toast.success("🌌 KOSMISCHE PORTALEN EXPANSIE: Gebruik de sterrenportalen op de hoeken om te teleporteren! 🌌", { duration: 6000 });
    }
  };

  const handleStartGame = () => {
    initActors(false);
    playTone('start');
    setGameState('playing');
  };

  // Keyboard controls listener with held-key down tracking
  useEffect(() => {
    const engine = engineRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (keys.includes(e.key)) {
        e.preventDefault(); // Stop page scrolling
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (playStateRef.current === 'playing') {
          playTone('start');
          setIsPaused(prev => !prev);
          return;
        }
      }

      if (playStateRef.current !== 'playing' || isPausedRef.current) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engine.keysPressed.UP = true;
        engine.hamster.nextDir = 'UP';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.keysPressed.DOWN = true;
        engine.hamster.nextDir = 'DOWN';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keysPressed.LEFT = true;
        engine.hamster.nextDir = 'LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keysPressed.RIGHT = true;
        engine.hamster.nextDir = 'RIGHT';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (playStateRef.current !== 'playing') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engine.keysPressed.UP = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.keysPressed.DOWN = false;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keysPressed.LEFT = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keysPressed.RIGHT = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Quick Mobile Steering Utility Helper
  const steerMobile = (dir: Direction) => {
    if (playStateRef.current !== 'playing') return;
    engineRef.current.hamster.nextDir = dir;
  };

  // Main Logic loops inside RequestAnimationFrame
  useEffect(() => {
    let animationId: number;
    
    const isOppositeDirection = (dir1: Direction, dir2: Direction): boolean => {
      if (!dir1 || !dir2) return false;
      return (
        (dir1 === 'UP' && dir2 === 'DOWN') ||
        (dir1 === 'DOWN' && dir2 === 'UP') ||
        (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
        (dir1 === 'RIGHT' && dir2 === 'LEFT')
      );
    };

    const updateLoop = () => {
      if (playStateRef.current !== 'playing') {
        animationId = requestAnimationFrame(updateLoop);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (isPausedRef.current) {
        // Draw pause overlay over the current maze
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPEL GEPAUZEERD ⏸️', canvas.width / 2, canvas.height / 2 - 15);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.fillText("Druk op 'P' of Hervatten om door te gaan", canvas.width / 2, canvas.height / 2 + 15);

        animationId = requestAnimationFrame(updateLoop);
        return;
      }

      const engine = engineRef.current;
      const player = engine.hamster;
      engine.frameCount++;

      if (player.teleportCooldown && player.teleportCooldown > 0) {
        player.teleportCooldown--;
      }

      const isNightmare = engine.level >= 10;
      const normalGhostSpeed = isNightmare 
        ? 4.0 
        : 0.9 + Math.min(engine.level - 1, 8) * 0.125;

      // 1. TIMERS UPDATE
      if (engine.devilModeTimer > 0) {
        engine.devilModeTimer--;
        if (engine.frameCount % 30 === 0) {
          setDevilModeTimer(Math.ceil(engine.devilModeTimer / 60));
        }
        if (engine.devilModeTimer === 0) {
          player.speed = 2;
          setDevilModeTimer(0);
          if (engine.frightenedTimer === 0) {
            engine.ghosts.forEach(g => {
              g.isFrightened = false;
              g.speed = normalGhostSpeed;
            });
          }
        }
      }

      if (engine.frightenedTimer > 0) {
        engine.frightenedTimer--;
        if (engine.frameCount % 30 === 0) {
          setFrightenedTimer(Math.ceil(engine.frightenedTimer / 60));
        }
        if (engine.frightenedTimer === 0) {
          if (engine.devilModeTimer === 0) {
            engine.ghosts.forEach(g => {
              g.isFrightened = false;
              g.speed = normalGhostSpeed;
            });
          }
          setFrightenedTimer(0);
        }
      }

      if (engine.invulnFrames > 0) {
        engine.invulnFrames--;
      }

      // Compute dynamic speed for the hamster
      let targetHamsterSpeed = (engine.devilModeTimer > 0) ? 4.0 : 2.0;
      
      // Calculate current grid coordinate based on hamster's physical center
      const centerX = Math.floor((player.x + CELL_SIZE / 2) / CELL_SIZE);
      const centerY = Math.floor((player.y + CELL_SIZE / 2) / CELL_SIZE);
      const currentGridType = engine.maze[centerY]?.[centerX];
      
      if (currentGridType === 6) {
        targetHamsterSpeed *= 0.50; // slow down by 50% on wet beer puddles (very noticeable!)
      }
      if (currentEventRef.current?.type === 'sober_hour') {
        targetHamsterSpeed *= 0.70; // -30% slow down
      }
      player.speed = targetHamsterSpeed;

      // Random Events engine
      if (!currentEventRef.current) {
        if (engine.frameCount > 180 && Math.random() < 0.0015) {
          const eventsPool = [
            { type: 'vodka_storm', name: 'VODKASTORM 🍾⚡', desc: 'Dubbele punten voor alle verzamelde wodka!', icon: '⚡' },
            { type: 'police_raid', name: 'POLITIE INVAL 👮🚓', desc: 'Cola-flessen worden agressief en sneller (+25%)!', icon: '🚓' },
            { type: 'drunken_hamster', name: 'DRONKEN HAMSTER 😵💫', desc: 'Omgekeerde besturing, maar ALLES geeft 3x punten!', icon: '😵' },
            { type: 'peanut_rain', name: 'PINDA REGEN 🥜🌧️', desc: 'Extra pinda-power-ups vallen uit de lucht!', icon: '🌧️' },
            { type: 'sober_hour', name: 'SOBER UURTJE 🧊⏰', desc: 'Kater slaat toe! Je beweegt 30% trager!', icon: '🧊' },
            { type: 'beer_bonus', name: 'GRATIS BIER 🍺✨', desc: 'Er is een bonus koud biertje ergens verschenen! (+500 ptn)', icon: '🍺' },
            { type: 'ice_shock', name: 'IJSSCHOK ❄️🧊', desc: 'De cola-flessen zijn bevroren en bewegen 50% trager!', icon: '❄️' },
            { type: 'devil_rage', name: 'DUIVEL WOEDE 😈🔥', desc: 'Instant duivelsmodus! Beweeg supersnel en vreet cola-flessen!', icon: '🔥' },
            { type: 'ghost_panic', name: 'COLAPANIEK 😰🥤', desc: 'Alle cola-flessen worden direct bang en kwetsbaar!', icon: '😰' },
            { type: 'golden_hour', name: 'GOUDEN UURTJE 👑💰', desc: 'Tijdelijke goudkoorts! Dubbele punten voor ALLES!', icon: '👑' }
          ];
          const selected = eventsPool[Math.floor(Math.random() * eventsPool.length)];
          const duration = 8 * 60; // 8 seconds
          currentEventRef.current = { ...selected, durationSec: 8 };
          setCurrentEvent(currentEventRef.current);
          engine.eventTimer = duration;

          if (selected.type === 'beer_bonus') {
            const emptyCells: { r: number, c: number }[] = [];
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (engine.maze[r][c] === 3 && (r !== player.gridY || c !== player.gridX)) {
                  emptyCells.push({ r, c });
                }
              }
            }
            if (emptyCells.length > 0) {
              const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
              engine.maze[cell.r][cell.c] = 8;
            }
          } else if (selected.type === 'peanut_rain') {
            const emptyCells: { r: number, c: number }[] = [];
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (engine.maze[r][c] === 3) emptyCells.push({ r, c });
              }
            }
            for (let i = 0; i < 3; i++) {
              if (emptyCells.length === 0) break;
              const idx = Math.floor(Math.random() * emptyCells.length);
              const cell = emptyCells.splice(idx, 1)[0];
              engine.maze[cell.r][cell.c] = 2;
            }
          } else if (selected.type === 'devil_rage') {
            engine.devilModeTimer = duration;
            setDevilModeTimer(8);
            engine.ghosts.forEach(g => {
              g.isFrightened = true;
              g.speed = 0.5;
            });
          } else if (selected.type === 'ghost_panic') {
            engine.frightenedTimer = duration;
            setFrightenedTimer(8);
            engine.ghosts.forEach(g => {
              g.isFrightened = true;
              g.speed = 0.8;
            });
          }

          toast.success(`🎉 EVENT ACTIEF: ${selected.name} - ${selected.desc}`, { duration: 5000 });
          playTone('eat_peanut');
        }
      } else {
        engine.eventTimer--;
        if (engine.frameCount % 60 === 0) {
          const nextSec = Math.ceil(engine.eventTimer / 60);
          if (currentEventRef.current) {
            currentEventRef.current.durationSec = nextSec;
            setCurrentEvent({ ...currentEventRef.current });
          }
        }
        if (engine.eventTimer <= 0) {
          toast(`Het event "${currentEventRef.current?.name}" is afgelopen.`, { icon: '⏰' });
          currentEventRef.current = null;
          setCurrentEvent(null);
        }
      }

      // Adjust normal ghost speed based on "police_raid" event (+25% speed)
      const isPoliceRaidActive = currentEventRef.current?.type === 'police_raid';
      const activeGhostSpeed = isPoliceRaidActive ? (normalGhostSpeed * 1.25) : normalGhostSpeed;

      // 2. PLAYERS ENGINE (HAMSTER SMOOTH GRID-ALIGNMENT MOVEMENT)

      // Poll current keysPressed state to continuously feed player.nextDir response instantly, with reverse control support!
      if (currentEventRef.current?.type === 'drunken_hamster') {
        if (engine.keysPressed.UP) player.nextDir = 'DOWN';
        else if (engine.keysPressed.DOWN) player.nextDir = 'UP';
        else if (engine.keysPressed.LEFT) player.nextDir = 'RIGHT';
        else if (engine.keysPressed.RIGHT) player.nextDir = 'LEFT';
      } else {
        if (engine.keysPressed.UP) player.nextDir = 'UP';
        else if (engine.keysPressed.DOWN) player.nextDir = 'DOWN';
        else if (engine.keysPressed.LEFT) player.nextDir = 'LEFT';
        else if (engine.keysPressed.RIGHT) player.nextDir = 'RIGHT';
      }

      // Verify move helper to prevent going through walls under any turning conditions
      const isValidPlayerMove = (gridX: number, gridY: number, dir: Direction): boolean => {
        if (!dir) return false;
        let checkX = gridX;
        let checkY = gridY;
        if (dir === 'UP') checkY--;
        else if (dir === 'DOWN') checkY++;
        else if (dir === 'LEFT') checkX--;
        else if (dir === 'RIGHT') checkX++;

        // Warp portals wrapping row index 6
        if (checkX < 0 || checkX >= COLS) {
          return gridY === 6 && (dir === 'LEFT' || dir === 'RIGHT');
        }
        if (checkY < 0 || checkY >= ROWS) {
          return false;
        }

        // Prevent the player from entering the central ghost cage
        const isCage = isCellGhostCage(checkX, checkY, COLS, engine.level);
        if (isCage) return false;

        return engine.maze[checkY][checkX] !== 1;
      };

      // Check if hamster arrived at target grid tile center
      const targetX = player.targetGridX * CELL_SIZE;
      const targetY = player.targetGridY * CELL_SIZE;

      if (Math.abs(player.x - targetX) < 0.1 && Math.abs(player.y - targetY) < 0.1) {
        // Snap exactly to target
        player.x = targetX;
        player.y = targetY;
        player.gridX = player.targetGridX;
        player.gridY = player.targetGridY;

        // Warp portals wrapping
        if (player.gridX < 0) {
          player.gridX = COLS - 1;
          player.targetGridX = player.gridX;
          player.x = player.gridX * CELL_SIZE;
        } else if (player.gridX >= COLS) {
          player.gridX = 0;
          player.targetGridX = player.gridX;
          player.x = 0;
        }

        let decidedDir: Direction = null;

        // Try to handle next steers buffered from keyboard presses
        if (player.nextDir && isValidPlayerMove(player.gridX, player.gridY, player.nextDir)) {
          decidedDir = player.nextDir;
          player.nextDir = null; // consume
        }

        // Try to continue in current heading directory
        if (!decidedDir && player.currentDir && isValidPlayerMove(player.gridX, player.gridY, player.currentDir)) {
          decidedDir = player.currentDir;
        }

        // Apply new verified target if allowed, otherwise halt safely at wall
        if (decidedDir) {
          player.currentDir = decidedDir;
          if (decidedDir === 'UP') player.targetGridY = player.gridY - 1;
          else if (decidedDir === 'DOWN') player.targetGridY = player.gridY + 1;
          else if (decidedDir === 'LEFT') player.targetGridX = player.gridX - 1;
          else if (decidedDir === 'RIGHT') player.targetGridX = player.gridX + 1;
        } else {
          player.currentDir = null;
        }
      }

      // INSTANT Turnaround / Reverse Direction capability mid-corridor
      if (player.nextDir && isOppositeDirection(player.nextDir, player.currentDir)) {
        const tempX = player.gridX;
        const tempY = player.gridY;
        player.gridX = player.targetGridX;
        player.gridY = player.targetGridY;
        player.targetGridX = tempX;
        player.targetGridY = tempY;
        player.currentDir = player.nextDir;
        player.nextDir = null;
      }

      // Linear motion progress towards target grid tile coordinates
      if (player.currentDir) {
        const finalTargetX = player.targetGridX * CELL_SIZE;
        const finalTargetY = player.targetGridY * CELL_SIZE;
        const dx = finalTargetX - player.x;
        const dy = finalTargetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= player.speed) {
          player.x = finalTargetX;
          player.y = finalTargetY;
        } else {
          player.x += (dx / dist) * player.speed;
          player.y += (dy / dist) * player.speed;
        }
      }

      // 3. DETECT ITEMS COLLECTION (VODKA BOTTLES, NUTS, PORTALS)
      const checkCollectGridX = Math.floor((player.x + CELL_SIZE / 2) / CELL_SIZE);
      const checkCollectGridY = Math.floor((player.y + CELL_SIZE / 2) / CELL_SIZE);

      if (checkCollectGridX >= 0 && checkCollectGridX < COLS && checkCollectGridY >= 0 && checkCollectGridY < ROWS) {
        const item = engine.maze[checkCollectGridY][checkCollectGridX];
        
        // Multiplier based on event
        let scoreMult = 1;
        if (currentEventRef.current?.type === 'drunken_hamster') {
          scoreMult = 3;
        } else if (currentEventRef.current?.type === 'golden_hour') {
          scoreMult = 2;
        }

        if (item === 0) {
          // Collected vodka!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          const bonus = (currentEventRef.current?.type === 'vodka_storm') ? 50 : 25;
          engine.score += bonus * scoreMult;
          setScore(engine.score);
          playTone('eat');
        } else if (item === 2) {
          // Collected Power Peanut!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          engine.score += 100 * scoreMult;
          setScore(engine.score);
          playTone('power');
          
          // Activate frightened mode for all ghosts (shorter duration on higher levels so they become killer again faster!)
          const durationSec = Math.max(2, 6 - Math.min(engine.level - 1, 6) * 0.7);
          engine.frightenedTimer = Math.round(durationSec * 60);
          setFrightenedTimer(Math.round(durationSec));
          engine.ghosts.forEach(g => {
            g.isFrightened = true;
            g.speed = 0.8; // vulnerable state is slower
          });
        } else if (item === 4) {
          // Collected Golden Vodka!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          engine.score += 500 * scoreMult; // Large score reward
          setScore(engine.score);
          playTone('victory');
          engine.lives = 3; // Regenerate all health/lives!
          setLives(3);
          toast.success("✨ SPECTACULAIR! Je hebt de GOUDEN VODKA gedronken! Al je health is hersteld! 🍾✨", { duration: 5000 });
        } else if (item === 5) {
          // Collected Devil's Chili Pepper! 🌶️
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          engine.score += 1000 * scoreMult; // Big point reward!
          setScore(engine.score);
          playTone('devil_chili');

          // Activate Devil mode for 6 seconds (360 frames)
          engine.devilModeTimer = 360; 
          setDevilModeTimer(6);

          // Give player double speed
          player.speed = 4;

          // Scare all ghosts immediately
          engine.ghosts.forEach(g => {
            g.isFrightened = true;
            g.speed = 0.5; // Even slower for Devil Hamster chase!
          });

          toast.success("👿 DUIVELHAMSTER MODE GEACTIVEERD! +1000 ptn! Je rent nu supersnel en verdient bonuspunten per cola! 🔥⚔️🌶️", {
            duration: 5000,
            icon: '🔥'
          });
        } else if (item === 7) {
          if (!player.teleportCooldown || player.teleportCooldown === 0) {
            // STEPPED ON A COSMIC PORTAL! Teleport to opposite diagonal portal corner
            let destR = 1;
            let destC = 1;
            if (checkCollectGridY === 1 && checkCollectGridX === 1) {
              destR = ROWS - 2; destC = COLS - 2;
            } else if (checkCollectGridY === 1 && checkCollectGridX === COLS - 2) {
              destR = ROWS - 2; destC = 1;
            } else if (checkCollectGridY === ROWS - 2 && checkCollectGridX === 1) {
              destR = 1; destC = COLS - 2;
            } else if (checkCollectGridY === ROWS - 2 && checkCollectGridX === COLS - 2) {
              destR = 1; destC = 1;
            }
            player.gridX = destC;
            player.gridY = destR;
            player.targetGridX = destC;
            player.targetGridY = destR;
            player.x = destC * CELL_SIZE;
            player.y = destR * CELL_SIZE;
            player.teleportCooldown = 45; // 45 frames (~0.75 seconds) cooldown to prevent instant loops
            playTone('eat_cola'); // teleport sound
            toast.success("🌌 DIMENSIONELE TELEPORTATIE! Je bent naar de andere kant van het heelal geworpen! ✨", { duration: 3000 });
          }
        } else if (item === 8) {
          // Collected beer mug bonus!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3;
          engine.score += 500 * scoreMult;
          setScore(engine.score);
          playTone('victory');
          toast.success("🍺 PROOST! Je hebt het koude biertje opgedronken! +500 ptn! 🍻", { duration: 4000 });
        }
      }

      // Check level cleared condition (any 0s, 2s, 4s, 5s or 8s left in maze?)
      let itemsRemaining = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (engine.maze[r][c] === 0 || engine.maze[r][c] === 2 || engine.maze[r][c] === 4 || engine.maze[r][c] === 5 || engine.maze[r][c] === 8) {
            itemsRemaining++;
          }
        }
      }

      if (itemsRemaining === 0) {
        // LEVEL WIN CHIME!
        playTone('victory');
        engine.level++;
        setLevel(engine.level);
        
        // Reset/load next level maze dynamically
        const nextLayout = getMazeForLevel(engine.level);
        engine.maze = nextLayout.maze;
        COLS = nextLayout.cols;
        ROWS = nextLayout.rows;
        CELL_SIZE = nextLayout.cellSize;

        // 10% chance of a Golden Vodka appearing on a level
        const isGoldenVodkaLevel = Math.random() < 0.10;
        if (isGoldenVodkaLevel) {
          const vodkaCells: { r: number, c: number }[] = [];
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (engine.maze[r][c] === 0) {
                vodkaCells.push({ r, c });
              }
            }
          }
          if (vodkaCells.length > 0) {
            const randomCell = vodkaCells[Math.floor(Math.random() * vodkaCells.length)];
            engine.maze[randomCell.r][randomCell.c] = 4; // 4 = Golden Vodka
            toast.success("✨ GELUK! Een zeldzame GOUDEN VODKA is op dit level gespawned! ✨", { duration: 5000 });
          }
        }

        if (engine.level >= 10) {
          toast.error("💀 NIGHTMARE MODE GEACTIVEERD! De cola flessen bewegen nu super snel! 💀", { duration: 5000 });
        } else {
          toast.success(`Level ${engine.level} Behaald! De cola flessen bewegen sneller! 🍾⚡`);
        }
        
        initActors(true);
      }

      // 4. GHOST ENGINE (COLA BOTTLES GRID-TARGET INTERSECTION CHASE ACTION)
      engine.ghosts.forEach((ghost, idx) => {
        // Dynamically compute ghost frightened state and speed
        const isFrightenedModeActive = engine.devilModeTimer > 0 || engine.frightenedTimer > 0 || currentEventRef.current?.type === 'ghost_panic';
        ghost.isFrightened = isFrightenedModeActive;

        if (isFrightenedModeActive) {
          if (engine.devilModeTimer > 0) {
            ghost.speed = 0.5;
          } else {
            ghost.speed = 0.8;
          }
        } else {
          let baseSpeed = normalGhostSpeed;
          if (currentEventRef.current?.type === 'police_raid') {
            baseSpeed *= 1.25;
          } else if (currentEventRef.current?.type === 'ice_shock') {
            baseSpeed *= 0.50;
          }
          ghost.speed = baseSpeed;
        }

        const gTargetX = ghost.targetGridX * CELL_SIZE;
        const gTargetY = ghost.targetGridY * CELL_SIZE;

        if (Math.abs(ghost.x - gTargetX) < 0.1 && Math.abs(ghost.y - gTargetY) < 0.1) {
          // Snap exactly to target tiles
          ghost.x = gTargetX;
          ghost.y = gTargetY;
          ghost.gridX = ghost.targetGridX;
          ghost.gridY = ghost.targetGridY;

          // Warp portal wrapping
          if (ghost.gridX < 0) {
            ghost.gridX = COLS - 1;
            ghost.targetGridX = ghost.gridX;
            ghost.x = ghost.gridX * CELL_SIZE;
          } else if (ghost.gridX >= COLS) {
            ghost.gridX = 0;
            ghost.targetGridX = ghost.gridX;
            ghost.x = 0;
          }

          // Calculate possible valid directions at this intersection (excluding opposite direction to prevent flipping back immediately)
          const oppositeDirMap: Record<string, string> = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
          };
          const opp = ghost.currentDir ? oppositeDirMap[ghost.currentDir] : '';

          const directions: { dir: Direction, x: number, y: number }[] = [
            { dir: 'UP', x: ghost.gridX, y: ghost.gridY - 1 },
            { dir: 'DOWN', x: ghost.gridX, y: ghost.gridY + 1 },
            { dir: 'LEFT', x: ghost.gridX - 1, y: ghost.gridY },
            { dir: 'RIGHT', x: ghost.gridX + 1, y: ghost.gridY }
          ];

          // Cage boundaries checker
          const isInsideCage = (x: number, y: number) => {
            return isCellGhostCage(x, y, COLS, engine.level);
          };

          const wasInside = isInsideCage(ghost.gridX, ghost.gridY);

          const validDirs = directions.filter(d => {
            if (d.dir === opp) return false; // avoid reversing directly
            if (d.x < 0 || d.x >= COLS) {
              return ghost.gridY === 6; // only escape tunnel row 6 is escape valid
            }
            if (d.y < 0 || d.y >= ROWS) return false;
            if (engine.maze[d.y][d.x] === 1) return false; // Not a wall

            const isNewInside = isInsideCage(d.x, d.y);
            if (ghost.isLocked) {
              // Locked ghosts must stay inside the cage
              return isNewInside;
            } else {
              // Active ghosts: if they were outside already, they cannot wander back inside!
              if (!wasInside && isNewInside) {
                return false;
              }
            }
            return true;
          });

          if (validDirs.length > 0) {
            // Pick a completely random direction from the available valid directions - no player targeting!
            const selectedDirObj = validDirs[Math.floor(Math.random() * validDirs.length)];
            ghost.currentDir = selectedDirObj.dir;
            ghost.targetGridX = selectedDirObj.x;
            ghost.targetGridY = selectedDirObj.y;
          } else {
            // Dead end trap, allow reverse fallback
            ghost.currentDir = opp as Direction;
            if (ghost.currentDir === 'UP') { ghost.targetGridX = ghost.gridX; ghost.targetGridY = ghost.gridY - 1; }
            else if (ghost.currentDir === 'DOWN') { ghost.targetGridX = ghost.gridX; ghost.targetGridY = ghost.gridY + 1; }
            else if (ghost.currentDir === 'LEFT') { ghost.targetGridX = ghost.gridX - 1; ghost.targetGridY = ghost.gridY; }
            else if (ghost.currentDir === 'RIGHT') { ghost.targetGridX = ghost.gridX + 1; ghost.targetGridY = ghost.gridY; }
          }
        }

        // Apply physical motion towards currently selected target tile
        if (ghost.currentDir) {
          const finalGTargetX = ghost.targetGridX * CELL_SIZE;
          const finalGTargetY = ghost.targetGridY * CELL_SIZE;
          const dx = finalGTargetX - ghost.x;
          const dy = finalGTargetY - ghost.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const stepAmt = ghost.speed;
          if (dist <= stepAmt) {
            ghost.x = finalGTargetX;
            ghost.y = finalGTargetY;
          } else {
            ghost.x += (dx / dist) * stepAmt;
            ghost.y += (dy / dist) * stepAmt;
          }
        }
      });

      // 5. COLLISION CHECK BETWEEN GHOST BOTTLES AND HAMSTER
      engine.ghosts.forEach(ghost => {
        // Skip locked/decorative ghosts inside the cage to avoid any inadvertent collisions
        if (ghost.isLocked) {
          return;
        }

        // If ghost is in the central spawn cage area, ignore collision to prevent spawn camping / instant killing on respawn
        const isGhostInCage = isCellGhostCage(ghost.gridX, ghost.gridY, COLS, engine.level);
        if (isGhostInCage) {
          return;
        }

        // L1 overlap distance check
        const distX = Math.abs(player.x - ghost.x);
        const distY = Math.abs(player.y - ghost.y);

        if (distX < 14 && distY < 14) {
          if (ghost.isFrightened) {
            // Hamster drinks/devours the Cola Ghost! 🍾💥
            playTone('eat_cola');
            const isDevil = engine.devilModeTimer > 0;
            const pts = isDevil ? 400 : 200;
            if (isDevil) {
              toast.success(`😈 VERNIETIGD! De Duivelhamster verorberde ${ghost.name}! +400 ptn 🔥🥤`, { icon: '😈' });
            } else {
              toast.success(`Je dronk de ${ghost.name} op! +200 ptn 🐹🥤`);
            }
            engine.score += pts;
            setScore(engine.score);

            // Send ghost back to central cage / spawn spot dynamically
            const spawnX = COLS === 21 ? 10 : 7;
            const spawnY = COLS === 21 ? 8 : 5;
            ghost.gridX = spawnX;
            ghost.gridY = spawnY;
            ghost.targetGridX = spawnX;
            ghost.targetGridY = spawnY;
            ghost.x = spawnX * CELL_SIZE;
            ghost.y = spawnY * CELL_SIZE;
            
            // Retain frightened status if global frightened power mode is still active
            if (engine.devilModeTimer > 0) {
              ghost.isFrightened = true;
              ghost.speed = 0.5;
            } else if (engine.frightenedTimer > 0) {
              ghost.isFrightened = true;
              ghost.speed = 0.8;
            } else {
              ghost.isFrightened = false;
              ghost.speed = normalGhostSpeed;
            }
            ghost.currentDir = 'UP';
          } else if (engine.invulnFrames === 0) {
            // Caught by aggressive Cola ghost bottle!
            playTone('die');
            engine.lives--;
            setLives(engine.lives);
            
            if (engine.lives <= 0) {
              setGameState('gameover');
              // Save Highscore check
              if (engine.score > highScore) {
                localStorage.setItem('ftjm_hamster_highscore', String(engine.score));
                setHighScore(engine.score);
                toast.success('🎉 NIEUWE Arcade Record Score voor Hamster Vodka Run!');
              } else {
                toast.error('Je bent dronken of de cola heeft je gevat! Spel over!');
              }
            } else {
              toast.error('Oei! Een Cola Fles te pakken gekregen! Leven kwijt! 💥');
              initActors(true);
              engine.invulnFrames = 120; // 2 seconds of blinking invulnerability grace
            }
          }
        }
      });

      // 6. CANVAS RETRO DRAW ENGINE
      const dpr = window.devicePixelRatio || 1;
      const desiredWidth = COLS * CELL_SIZE;
      const desiredHeight = ROWS * CELL_SIZE;
      if (canvas.width !== desiredWidth * dpr || canvas.height !== desiredHeight * dpr) {
        canvas.width = desiredWidth * dpr;
        canvas.height = desiredHeight * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, desiredWidth, desiredHeight);

      // Themes based on level expansions
      let bgStyle = '#020617'; // default dark blue
      let wallBg = '#0f172a';
      let wallStroke = '#2563eb';

      if (engine.level === 2) {
        // Brewery Expansion
        bgStyle = '#1c0d02'; // deep dark beer brown
        wallBg = '#3c1c04'; // wooden brown
        wallStroke = '#b45309'; // copper orange
      } else if (engine.level === 3) {
        // Devil's Cave
        bgStyle = '#0f0202'; // deep blood red
        wallBg = '#220000';
        wallStroke = '#ef4444'; // fiery red
      } else if (engine.level === 4) {
        // Frozen Tundra
        bgStyle = '#082f49'; // deep icy blue
        wallBg = '#0c4a6e';
        wallStroke = '#38bdf8'; // icy sky blue
      } else if (engine.level >= 5) {
        // Cosmic Portals
        bgStyle = '#150020'; // deep star purple
        wallBg = '#2b0040';
        wallStroke = '#ec4899'; // neon space pink
      }

      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, desiredWidth, desiredHeight);

      // Render custom level backgrounds (e.g. rising embers for lvl 3, falling snowflakes for lvl 4, glittering stars for lvl 5+)
      if (engine.level === 3) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        for (let i = 0; i < 6; i++) {
          const px = ((engine.frameCount + i * 60) * 0.5) % desiredWidth;
          const py = (Math.sin(engine.frameCount * 0.01 + i) * 50 + i * 60) % desiredHeight;
          ctx.beginPath();
          ctx.arc(px, desiredHeight - py, 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (engine.level === 4) {
        // Falling snowflakes
        ctx.fillStyle = 'rgba(125, 211, 252, 0.3)';
        for (let i = 0; i < 8; i++) {
          const px = (i * 50 + engine.frameCount * 0.3) % desiredWidth;
          const py = (i * 45 + engine.frameCount * 0.5) % desiredHeight;
          ctx.font = '10px sans-serif';
          ctx.fillText('❄️', px, py);
        }
      } else if (engine.level >= 5) {
        // Cosmic stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 10; i++) {
          const px = (Math.sin(i * 9) * desiredWidth) % desiredWidth;
          const py = (Math.cos(i * 12) * desiredHeight) % desiredHeight;
          const alpha = 0.2 + 0.3 * Math.sin(engine.frameCount * 0.05 + i);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw beautiful grid walls and items
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const type = engine.maze[r][c];
          
          if (type === 1) {
            // Solid retro wall decor
            ctx.fillStyle = wallBg;
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Neon grid accent border
            ctx.strokeStyle = wallStroke;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(c * CELL_SIZE + 1.5, r * CELL_SIZE + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
          } else if (type === 0) {
            // DRAW VODKA BOTTLES (item to collect)
            const pulse = 1 + 0.12 * Math.sin(engine.frameCount * 0.1 + (r + c) * 0.5);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);

            ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍾', 0, 0.5);
            ctx.restore();
          } else if (type === 2) {
            // DRAW POWER PEANUT / SEED
            const pulse = 1 + 0.2 * Math.sin(engine.frameCount * 0.15 + (r + c) * 0.5);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);

            ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🥜', 0, 1);
            ctx.restore();
          } else if (type === 4) {
            // DRAW GOLDEN VODKA (Special health regen item)
            const pulse = 1 + 0.25 * Math.sin(engine.frameCount * 0.2 + (r + c) * 0.8);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);

            ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍾', 0, 0.5);
            ctx.font = '10px sans-serif';
            ctx.fillText('✨', 8, -6);
            ctx.fillText('✨', -8, 6);
            ctx.restore();
          } else if (type === 5) {
            // DRAW DEVIL'S CHILI PEPPER 🌶️
            const pulse = 1 + 0.25 * Math.sin(engine.frameCount * 0.2 + (r + c) * 0.8);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);

            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌶️', 0, 0.5);
            ctx.font = '10px sans-serif';
            ctx.fillText('🔥', 8, -6);
            ctx.fillText('🔥', -8, 6);
            ctx.restore();
          } else if (type === 6) {
            // DRAW WET BEER PUDDLE (Brewery)
            ctx.fillStyle = 'rgba(180, 83, 9, 0.25)';
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
            ctx.stroke();
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍺', c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2 + 1);
          } else if (type === 7) {
            // DRAW COSMIC PORTALS 🌌
            const pulse = 1 + 0.15 * Math.sin(engine.frameCount * 0.1 + (r + c) * 0.6);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#db2777';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌌', 0, 0);
            ctx.restore();
          } else if (type === 8) {
            // DRAW BONUS COLD BEER 🍺 (Free Beer Event)
            const pulse = 1 + 0.2 * Math.sin(engine.frameCount * 0.15);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍺', 0, 0);
            ctx.restore();
          }
        }
      }

      // Draw tunnel indicators (small sparkles)
      const warpRowY = Math.floor(ROWS / 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(0, warpRowY * CELL_SIZE, 8, CELL_SIZE);
      ctx.fillRect(desiredWidth - 8, warpRowY * CELL_SIZE, 8, CELL_SIZE);

      // Draw beautiful glows and outline of the ghost cage (kooi) in the center
      ctx.save();
      ctx.strokeStyle = engine.level === 3 ? '#ef4444' : '#f43f5e'; // Vibrant pink/rose or devil red
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      if (COLS === 21) {
        // 21x21 cage at col 8-13, row 7-9
        ctx.moveTo(8 * CELL_SIZE, 8 * CELL_SIZE);
        ctx.lineTo(8 * CELL_SIZE, 9 * CELL_SIZE); // Down left edge
        ctx.lineTo(13 * CELL_SIZE, 9 * CELL_SIZE); // Bottom edge
        ctx.lineTo(13 * CELL_SIZE, 8 * CELL_SIZE); // Up right edge
        ctx.lineTo(12 * CELL_SIZE, 8 * CELL_SIZE); // Step in horizontally
        ctx.lineTo(12 * CELL_SIZE, 7 * CELL_SIZE); // Up row 7 edge
        ctx.lineTo(11 * CELL_SIZE, 7 * CELL_SIZE); // Top right roof of cage
        
        ctx.moveTo(10 * CELL_SIZE, 7 * CELL_SIZE); // Gap for dashed gate!
        ctx.lineTo(9 * CELL_SIZE, 7 * CELL_SIZE); // Top left roof of cage 
        ctx.lineTo(9 * CELL_SIZE, 8 * CELL_SIZE); // Down row 7 edge
        ctx.lineTo(8 * CELL_SIZE, 8 * CELL_SIZE); // Step out horizontally
        ctx.stroke();

        // Draw dashed laser gate for cage top opening
        ctx.strokeStyle = '#38bdf8'; // Sky blue laser beam gate
        ctx.lineWidth = 3.5;
        ctx.setLineDash([4, 4]); // Dashed line style
        ctx.beginPath();
        ctx.moveTo(10 * CELL_SIZE - 2, 7 * CELL_SIZE);
        ctx.lineTo(11 * CELL_SIZE + 2, 7 * CELL_SIZE);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      } else {
        // Standard cage at col 5-10, row 4-6
        ctx.moveTo(5 * CELL_SIZE, 5 * CELL_SIZE);
        ctx.lineTo(5 * CELL_SIZE, 6 * CELL_SIZE); // Down left edge
        ctx.lineTo(10 * CELL_SIZE, 6 * CELL_SIZE); // Bottom edge
        ctx.lineTo(10 * CELL_SIZE, 5 * CELL_SIZE); // Up right edge
        ctx.lineTo(9 * CELL_SIZE, 5 * CELL_SIZE); // Step in horizontally
        ctx.lineTo(9 * CELL_SIZE, 4 * CELL_SIZE); // Up row 4 edge
        ctx.lineTo(8 * CELL_SIZE, 4 * CELL_SIZE); // Top right roof of cage
        
        ctx.moveTo(7 * CELL_SIZE, 4 * CELL_SIZE); // Gap for dashed gate!
        ctx.lineTo(6 * CELL_SIZE, 4 * CELL_SIZE); // Top left roof of cage 
        ctx.lineTo(6 * CELL_SIZE, 5 * CELL_SIZE); // Down row 4 edge
        ctx.lineTo(5 * CELL_SIZE, 5 * CELL_SIZE); // Step out horizontally
        ctx.stroke();

        // Draw dashed laser gate for cage top opening
        ctx.strokeStyle = '#38bdf8'; // Sky blue laser beam gate
        ctx.lineWidth = 3.5;
        ctx.setLineDash([4, 4]); // Dashed line style
        ctx.beginPath();
        ctx.moveTo(7 * CELL_SIZE - 2, 4 * CELL_SIZE);
        ctx.lineTo(8 * CELL_SIZE + 2, 4 * CELL_SIZE);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }
      ctx.restore();

      // Draw Ghosts (Cola Bottles)
      engine.ghosts.forEach(ghost => {
        ctx.save();
        ctx.translate(ghost.x + CELL_SIZE / 2, ghost.y + CELL_SIZE / 2);
        
        if (ghost.isFrightened) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🥶', 0, 0);
          
          // Flash white in last 3 seconds
          if (engine.frightenedTimer < 180 && Math.floor(engine.frameCount / 10) % 2 === 0) {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-12, -12, 24, 24);
          }
        } else {
          ctx.fillStyle = `${ghost.color}35`; 
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = ghost.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ghost.emoji, 0, 0);
        }
        ctx.restore();
      });

      // Draw Hamster Player
      if (engine.invulnFrames === 0 || Math.floor(engine.frameCount / 8) % 2 === 0) {
        ctx.save();
        ctx.translate(player.x + CELL_SIZE / 2, player.y + CELL_SIZE / 2);
        
        // Check if player is on a sticky beer puddle
        const playerCenterX = Math.floor((player.x + CELL_SIZE / 2) / CELL_SIZE);
        const playerCenterY = Math.floor((player.y + CELL_SIZE / 2) / CELL_SIZE);
        const isOnBeer = engine.maze[playerCenterY]?.[playerCenterX] === 6;

        if (isOnBeer) {
          // Wobble the hamster from side to side
          const wobble = Math.sin(engine.frameCount * 0.25) * 0.15;
          ctx.rotate(wobble);

          // Draw splash bubbles/foam around the hamster
          ctx.fillStyle = 'rgba(217, 119, 6, 0.6)';
          for (let i = 0; i < 4; i++) {
            const angle = (engine.frameCount * 0.1 + i * Math.PI / 2) % (Math.PI * 2);
            const r = 10 + 4 * Math.sin(engine.frameCount * 0.15 + i);
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        if (engine.devilModeTimer > 0) {
          // Flame aura red circles
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 17, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (player.currentDir === 'LEFT' || player.nextDir === 'LEFT') {
          ctx.scale(-1, 1);
        }
        
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const emojiToUse = engine.devilModeTimer > 0 ? '😈' : player.emoji;
        ctx.fillText(emojiToUse, 0, 0);
        
        if (engine.devilModeTimer > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (engine.frightenedTimer > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();

      animationId = requestAnimationFrame(updateLoop);
    };

    animationId = requestAnimationFrame(updateLoop);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center select-none" id="hamster_arcade_root">
      
      {/* Game Dashboard details */}
      <div className="w-full flex items-center justify-between bg-app-card/60 rounded-2xl p-4 border border-app-border mb-4">
        <div className="flex gap-4 items-center">
          <div>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">Score</span>
            <span className="text-xl font-black text-amber-500 font-mono tracking-tight">{score}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">Top Score</span>
            <span className="text-xl font-black text-app-ink font-mono tracking-tight flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" /> {highScore}
            </span>
          </div>
          {gameState === 'playing' && (
            <button
              onClick={() => { playTone('start'); setIsPaused(p => !p); }}
              className="ml-2 px-3 py-1.5 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 border border-app-border leading-none"
            >
              {isPaused ? '▶ Hervatten' : '⏸️ Pauze'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block text-right">Moeilijkheid</span>
            {level >= 10 ? (
              <span className="text-sm font-black text-rose-500 uppercase block text-right animate-pulse">💀 NIGHTMARE {level}</span>
            ) : level >= 3 ? (
              <span className="text-sm font-black text-red-500 uppercase block text-right animate-pulse">👿 DUIVELSGROT {level}</span>
            ) : (
              <span className="text-sm font-black text-cyan-500 uppercase block text-right">Lvl {level}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 pt-1.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span 
                key={idx} 
                className={`text-lg transition-opacity duration-300 ${idx < lives ? 'opacity-100' : 'opacity-20'}`}
              >
                🐹
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`relative border-4 border-slate-700 rounded-[2rem] bg-[#000411] overflow-hidden p-2 shadow-2xl shadow-cyan-500/10 origin-center transition-all duration-300 ${isFullscreen ? 'scale-110 sm:scale-[1.22] my-8 shadow-cyan-500/20' : ''}`}>
        {/* Game Canvas Board */}
        <canvas 
          ref={canvasRef} 
          width={360} 
          height={360} 
          className="block rounded-2xl cursor-default"
        />

        {/* Overlay screens */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div 
              key="start"
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-500/20 text-3xl mb-4 animate-[bounce_3s_infinite]">
                🐹
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Hamster Vodka Run</h3>
              <p className="text-xs text-slate-300 mt-2 max-w-[280px] leading-relaxed">
                Ren door het doolhof en help de hamster alle <span className="text-amber-400 font-bold">Vodka flessen (🍾)</span> op te drinken!
              </p>
              
              <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mt-4 text-[11px] text-rose-300 max-w-[260px] text-center">
                ⚠️ <span className="font-bold">Pas op!</span> De jagende <span className="text-rose-400 font-bold">Cola flessen (🥤)</span> kosten je een hamsterleven!
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" /> Start Spel
              </motion.button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              key="over"
              className="absolute inset-0 bg-rose-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl mb-4">🥴😵</div>
              <h3 className="text-3xl font-black text-rose-400 uppercase tracking-tight">Game Over</h3>
              <p className="text-xs text-rose-200 mt-2">De frisdrank heeft de overhand genomen!</p>
              
              <div className="mt-4 p-3 bg-black/40 rounded-xl border border-rose-500/20 min-w-[140px]">
                <span className="text-[10px] text-rose-300 uppercase block font-bold">Jouw Score</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{score}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Nogmaals Proberen
                </motion.button>

                {onShareHighScoreOpen && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onShareHighScoreOpen('hamster', score)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-md shadow-yellow-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🏆 Deel Highscore
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vulnerable peanut / devil chili super timer banners */}
        {devilModeTimer > 0 && gameState === 'playing' ? (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white border border-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-600/40">
            <span className="animate-[bounce_1s_infinite]">🔥</span> Duivelmodus: {devilModeTimer}s! 😈🌶️
          </div>
        ) : frightenedTimer > 0 && gameState === 'playing' ? (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
            <Zap className="w-3.5 h-3.5 fill-current" /> Peanut Power: {frightenedTimer}s! 🐹⚡
          </div>
        ) : null}
      </div>

      {/* Touch steering controls layout for mobile screens */}
      {gameState === 'playing' && (
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <button 
            onClick={() => steerMobile('UP')}
            className="w-14 h-12 bg-app-card hover:bg-app-accent border border-app-border rounded-xl flex items-center justify-center active:bg-amber-400 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowUp className="w-6 h-6 text-app-ink" />
          </button>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => steerMobile('LEFT')}
              className="w-14 h-12 bg-app-card hover:bg-app-accent border border-app-border rounded-xl flex items-center justify-center active:bg-amber-400 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-app-ink" />
            </button>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest w-12 text-center">Steer</span>
            <button 
              onClick={() => steerMobile('RIGHT')}
              className="w-14 h-12 bg-app-card hover:bg-app-accent border border-app-border rounded-xl flex items-center justify-center active:bg-amber-400 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowRight className="w-6 h-6 text-app-ink" />
            </button>
          </div>

          <button 
            onClick={() => steerMobile('DOWN')}
            className="w-14 h-12 bg-app-card hover:bg-app-accent border border-app-border rounded-xl flex items-center justify-center active:bg-amber-400 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowDown className="w-6 h-6 text-app-ink" />
          </button>
        </div>
      )}

      {/* Guide/Instucties element */}
      <div className="w-full mt-6 bg-app-card/30 rounded-2xl p-4 border border-app-border/40 text-left">
        <h4 className="text-xs font-black text-app-ink uppercase tracking-wider flex items-center gap-1">
          📖 Spelregels & Besturing
        </h4>
        <p className="text-[11px] text-app-muted mt-1 leading-relaxed">
          Bestuur de hamster (🐹) door het netwerk! Drink alle <span className="text-amber-500 font-bold">Vodka flessen (🍾)</span> leeg om punten te verzamelen en de ronde te winnen. Het spel is gewonnen wanneer de hele kaart leeggedronken is!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-[11px]">
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🥜</span>
              <div>
                <span className="font-bold text-app-ink block">Power Pinda:</span>
                <span className="text-amber-500">Word tijdelijk gigantisch en supersterk! Je kunt nu Cola flessen (ghosts) opdrinken voor <span className="font-bold text-emerald-500">+200 ptn</span>!</span>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <div>
                <span className="font-bold text-app-ink block">Warp Tunnels:</span>
                <span className="text-cyan-500">Loop de linker- of rechterrand van het scherm uit om onmiddellijk aan de overkant te verschijnen!</span>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🌶️</span>
              <div>
                <span className="font-bold text-app-ink block">Lvl 3+: Duivelsgrot!</span>
                <span className="text-red-500">Eet pepers om te veranderen in de <span className="font-bold">Duivelhamster 😈</span>: loop supersnel, word onkwetsbaar, verdien <span className="font-bold text-emerald-500">+1000 ptn</span> en win <span className="font-bold">+400 ptn</span> per opgedronken Cola!</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-app-muted font-bold uppercase tracking-wider text-center">
          🕹️ Toetsenborden: gebruik W/A/S/D of de Pijltjestoetsen.
        </p>
      </div>

    </div>
  );
}
