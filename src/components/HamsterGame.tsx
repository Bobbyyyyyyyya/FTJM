import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, RotateCcw, ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Zap, Play, Volume2, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Props for the Game component
interface HamsterGameProps {
  onBack: () => void;
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
}

const CELL_SIZE = 24;
const COLS = 15;
const ROWS = 15;

// Maze layout representation
// 1 = Wall (solid blocks)
// 0 = Vodka Bottle (🍾)
// 2 = Power Peanut (🥜)
// 3 = Empty/Safe walk path (respawn or tunnel corridor)
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

export function HamsterGame({ onBack }: HamsterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playStateRef = useRef<'idle' | 'playing' | 'gameover'>('idle');
  const [gameState, setGameStateInner] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // React State for display
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('ftjm_hamster_highscore') || '0'));
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [frightenedTimer, setFrightenedTimer] = useState(0);

  // Dynamic Maze structure states
  const [maze, setMaze] = useState<number[][]>(() => JSON.parse(JSON.stringify(INITIAL_MAZE)));

  // Web Audio Hook For Synthesized Retro Atmosphere
  const playTone = (type: 'eat' | 'power' | 'eat_cola' | 'die' | 'victory' | 'start') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
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
      } else if (type === 'power') {
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
    frameCount: 0
  });

  // Init/Spawn the Ghosts
  const initActors = (keepScores = false) => {
    const engine = engineRef.current;
    
    // Position Hamster safely
    engine.hamster.gridX = 7;
    engine.hamster.gridY = 13;
    engine.hamster.targetGridX = 7;
    engine.hamster.targetGridY = 13;
    engine.hamster.x = 7 * CELL_SIZE;
    engine.hamster.y = 13 * CELL_SIZE;
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
    const baseSpeed = 0.9 + Math.min(engine.level - 1, 6) * 0.15;

    // Colas (Pacman Ghosts behavior setup)
    // 1. Red Cola - Chases Hamster closely
    // 2. Teal Pepsi/Inky - Predicts ahead or wanders
    // 3. Yellow Lemon-Cola - Circles and acts randomly
    engine.ghosts = [
      {
        x: 6 * CELL_SIZE,
        y: 5 * CELL_SIZE,
        gridX: 6,
        gridY: 5,
        targetGridX: 6,
        targetGridY: 5,
        speed: baseSpeed,
        currentDir: 'UP',
        nextDir: 'UP',
        isFrightened: false,
        color: '#ef4444',
        emoji: '🥤', // Classic Red Cola
        name: 'Red Cherry Cola'
      },
      {
        x: 7 * CELL_SIZE,
        y: 5 * CELL_SIZE,
        gridX: 7,
        gridY: 5,
        targetGridX: 7,
        targetGridY: 5,
        speed: baseSpeed,
        currentDir: 'RIGHT',
        nextDir: 'RIGHT',
        isFrightened: false,
        color: '#06b6d4',
        emoji: '🥤', // Blue Diet Cola Cup
        name: 'Blue Diet Cola'
      },
      {
        x: 8 * CELL_SIZE,
        y: 5 * CELL_SIZE,
        gridX: 8,
        gridY: 5,
        targetGridX: 8,
        targetGridY: 5,
        speed: baseSpeed,
        currentDir: 'LEFT',
        nextDir: 'LEFT',
        isFrightened: false,
        color: '#eab308', // pure gold amber yellow
        emoji: '🥤', // Lemon Cola Cup
        name: 'Lemon Cola'
      }
    ];

    engine.invulnFrames = 0;
    engine.frightenedTimer = 0;
    setFrightenedTimer(0);

    if (!keepScores) {
      engine.score = 0;
      engine.lives = 3;
      engine.level = 1;
      engine.maze = JSON.parse(JSON.stringify(INITIAL_MAZE));
      setScore(0);
      setLives(3);
      setLevel(1);
      setMaze(JSON.parse(JSON.stringify(INITIAL_MAZE)));
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

      if (playStateRef.current !== 'playing') return;

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

      const engine = engineRef.current;
      engine.frameCount++;

      const normalGhostSpeed = 0.9 + Math.min(engine.level - 1, 6) * 0.15;

      // 1. TIMERS UPDATE
      if (engine.frightenedTimer > 0) {
        engine.frightenedTimer--;
        if (engine.frameCount % 30 === 0) {
          setFrightenedTimer(Math.ceil(engine.frightenedTimer / 60));
        }
        if (engine.frightenedTimer === 0) {
          // Revert frightening status back to dynamic level difficulty speed
          engine.ghosts.forEach(g => {
            g.isFrightened = false;
            g.speed = normalGhostSpeed;
          });
          setFrightenedTimer(0);
        }
      }

      if (engine.invulnFrames > 0) {
        engine.invulnFrames--;
      }

      // 2. PLAYERS ENGINE (HAMSTER SMOOTH GRID-ALIGNMENT MOVEMENT)
      const player = engine.hamster;

      // Poll current keysPressed state to continuously feed player.nextDir response instantly!
      if (engine.keysPressed.UP) player.nextDir = 'UP';
      else if (engine.keysPressed.DOWN) player.nextDir = 'DOWN';
      else if (engine.keysPressed.LEFT) player.nextDir = 'LEFT';
      else if (engine.keysPressed.RIGHT) player.nextDir = 'RIGHT';

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
        if (player.nextDir) {
          let checkX = player.gridX;
          let checkY = player.gridY;
          if (player.nextDir === 'UP') checkY--;
          else if (player.nextDir === 'DOWN') checkY++;
          else if (player.nextDir === 'LEFT') checkX--;
          else if (player.nextDir === 'RIGHT') checkX++;

          // Exception: tunnel escape path warping
          if (player.gridY === 6 && (player.nextDir === 'LEFT' || player.nextDir === 'RIGHT')) {
            decidedDir = player.nextDir;
          } else if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
            if (engine.maze[checkY][checkX] !== 1) {
              decidedDir = player.nextDir;
              player.nextDir = null; // consume
            }
          }
        }

        // Try to continue in current heading directory
        if (!decidedDir && player.currentDir) {
          let checkX = player.gridX;
          let checkY = player.gridY;
          if (player.currentDir === 'UP') checkY--;
          else if (player.currentDir === 'DOWN') checkY++;
          else if (player.currentDir === 'LEFT') checkX--;
          else if (player.currentDir === 'RIGHT') checkX++;

          if (player.gridY === 6 && (player.currentDir === 'LEFT' || player.currentDir === 'RIGHT')) {
            decidedDir = player.currentDir;
          } else if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
            if (engine.maze[checkY][checkX] !== 1) {
              decidedDir = player.currentDir;
            }
          }
        }

        // Apply new verified target
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

      // 3. DETECT ITEMS COLLECTION (VODKA BOTTLES & NUTS)
      const checkCollectGridX = Math.floor((player.x + CELL_SIZE / 2) / CELL_SIZE);
      const checkCollectGridY = Math.floor((player.y + CELL_SIZE / 2) / CELL_SIZE);

      if (checkCollectGridX >= 0 && checkCollectGridX < COLS && checkCollectGridY >= 0 && checkCollectGridY < ROWS) {
        const item = engine.maze[checkCollectGridY][checkCollectGridX];
        if (item === 0) {
          // Collected vodka!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          engine.score += 25;
          setScore(engine.score);
          playTone('eat');
          
          // Re-trigger static state update for UI render occasionally
          setMaze([...engine.maze]);
        } else if (item === 2) {
          // Collected Power Peanut!
          engine.maze[checkCollectGridY][checkCollectGridX] = 3; // Clear item cell
          engine.score += 100;
          setScore(engine.score);
          playTone('power');
          
          // Activate frightened mode for all ghosts
          engine.frightenedTimer = 480; // 8 seconds of absolute power
          setFrightenedTimer(8);
          engine.ghosts.forEach(g => {
            g.isFrightened = true;
            g.speed = 0.8; // vulnerable state is slower
          });

          setMaze([...engine.maze]);
        }
      }

      // Check level cleared condition (any 0s or 2s left in maze?)
      let itemsRemaining = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (engine.maze[r][c] === 0 || engine.maze[r][c] === 2) {
            itemsRemaining++;
          }
        }
      }

      if (itemsRemaining === 0) {
        // LEVEL WIN CHIME!
        playTone('victory');
        engine.level++;
        setLevel(engine.level);
        toast.success(`Level ${engine.level} Behaald! De cola flessen bewegen sneller! 🍾⚡`);
        
        // Reset maze but preserve score/lives
        engine.maze = JSON.parse(JSON.stringify(INITIAL_MAZE));
        setMaze(JSON.parse(JSON.stringify(INITIAL_MAZE)));
        initActors(true);
      }

      // 4. GHOST ENGINE (COLA BOTTLES GRID-TARGET INTERSECTION CHASE ACTION)
      engine.ghosts.forEach((ghost, idx) => {
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

          const validDirs = directions.filter(d => {
            if (d.dir === opp) return false; // avoid reversing directly
            if (d.x < 0 || d.x >= COLS) {
              return ghost.gridY === 6; // only escape tunnel row 6 is escape valid
            }
            if (d.y < 0 || d.y >= ROWS) return false;
            return engine.maze[d.y][d.x] !== 1; // Not a wall
          });

          if (validDirs.length > 0) {
            let selectedDirObj = validDirs[0];

            if (ghost.isFrightened) {
              // Absolute randomized movement at intersection when scared
              selectedDirObj = validDirs[Math.floor(Math.random() * validDirs.length)];
            } else {
              // Pathfinding goal selector depending on ghost profile identity:
              let targetXPoint = player.gridX;
              let targetYPoint = player.gridY;

              if (idx === 1) {
                // Diet Blue Cola intercepts 3 steps ahead
                if (player.currentDir === 'UP') targetYPoint -= 3;
                if (player.currentDir === 'DOWN') targetYPoint += 3;
                if (player.currentDir === 'LEFT') targetXPoint -= 3;
                if (player.currentDir === 'RIGHT') targetXPoint += 3;
              } else if (idx === 2) {
                // Lemon Cola is curious and wanders off to target the corners if too close
                const distToPlayer = Math.abs(ghost.gridX - player.gridX) + Math.abs(ghost.gridY - player.gridY);
                if (distToPlayer < 4) {
                  // Run away to top-right corner
                  targetXPoint = COLS - 2;
                  targetYPoint = 1;
                }
              }

              // Evaluate which cell minimises taxicab distance (L1 norm) to the target coordinates
              let minDist = Infinity;
              validDirs.forEach(d => {
                const dist = Math.abs(d.x - targetXPoint) + Math.abs(d.y - targetYPoint);
                if (dist < minDist) {
                  minDist = dist;
                  selectedDirObj = d;
                }
              });
            }

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
        // L1 overlap distance check
        const distX = Math.abs(player.x - ghost.x);
        const distY = Math.abs(player.y - ghost.y);

        if (distX < 14 && distY < 14) {
          if (ghost.isFrightened) {
            // Hamster drinks/devours the Cola Ghost! 🍾💥
            playTone('eat_cola');
            toast.success(`Je dronk de ${ghost.name} op! +200 ptn 🐹🥤`);
            engine.score += 200;
            setScore(engine.score);

            // Send ghost back to central cage / spawn spot
            ghost.gridX = 7;
            ghost.gridY = 5;
            ghost.targetGridX = 7;
            ghost.targetGridY = 5;
            ghost.x = 7 * CELL_SIZE;
            ghost.y = 5 * CELL_SIZE;
            ghost.isFrightened = false;
            ghost.speed = normalGhostSpeed;
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
              // Briefly reset positions safely back to grid coordinates
              player.gridX = 7;
              player.gridY = 13;
              player.targetGridX = 7;
              player.targetGridY = 13;
              player.x = 7 * CELL_SIZE;
              player.y = 13 * CELL_SIZE;
              player.currentDir = null;
              player.nextDir = null;

              engine.invulnFrames = 120; // 2 seconds of blinking invulnerability grace
            }
          }
        }
      });

      // 6. CANVAS RETRO DRAW ENGINE
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== 360 * dpr || canvas.height !== 360 * dpr) {
        canvas.width = 360 * dpr;
        canvas.height = 360 * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, 360, 360);

      // Draw beautiful Pacman grid walls and items
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const type = engine.maze[r][c];
          
          if (type === 1) {
            // Solid retro wall decor
            ctx.fillStyle = '#0f172a'; // Deeper dark wall center
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Neon grid blue accent border
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(c * CELL_SIZE + 1.5, r * CELL_SIZE + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
          } else if (type === 0) {
            // DRAW VODKA BOTTLES (item to collect)
            // Vibrant pulsing background ring and bright stroke glow to make it stand out beautifully
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

            // Bright amber glowing aura ring
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
          }
        }
      }

      // Draw tunnel indicators (small sparkles)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(0, 6 * CELL_SIZE, 8, CELL_SIZE);
      ctx.fillRect(360 - 8, 6 * CELL_SIZE, 8, CELL_SIZE);

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
        
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (player.currentDir === 'LEFT' || player.nextDir === 'LEFT') {
          ctx.scale(-1, 1);
        }
        
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.emoji, 0, 0);
        
        if (engine.frightenedTimer > 0) {
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
        <div className="flex gap-4">
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
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block text-right">Moeilijkheid</span>
            <span className="text-sm font-black text-cyan-500 uppercase block text-right">Lvl {level}</span>
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

      <div className="relative border-4 border-slate-700 rounded-[2rem] bg-[#000411] overflow-hidden p-2 shadow-2xl shadow-cyan-500/10">
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
              
              <div className="mt-4 p-3 bg-black/40 rounded-xl border border-rose-500/20">
                <span className="text-[10px] text-rose-300 uppercase block font-bold">Jouw Score</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{score}</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Nogmaals Proberen
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vulnerable peanut super timer banner */}
        {frightenedTimer > 0 && gameState === 'playing' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
            <Zap className="w-3.5 h-3.5 fill-current" /> Peanut Power: {frightenedTimer}s! 🐹⚡
          </div>
        )}
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
              <ArrowLeftIcon className="w-6 h-6 text-app-ink" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-[11px]">
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
        </div>

        <p className="mt-4 text-[10px] text-app-muted font-bold uppercase tracking-wider text-center">
          🕹️ Toetsenborden: gebruik W/A/S/D of de Pijltjestoetsen.
        </p>
      </div>

    </div>
  );
}
