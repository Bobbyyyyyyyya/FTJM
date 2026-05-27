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
        speed: 1.5, // Divides 24 cleanly! (1.5 divides 24: 16 steps)
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
        speed: 1.5,
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
        speed: 1.5,
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

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (keys.includes(e.key)) {
        e.preventDefault(); // Stop page scrolling
      }

      if (playStateRef.current !== 'playing') return;

      const engine = engineRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engine.hamster.nextDir = 'UP';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.hamster.nextDir = 'DOWN';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.hamster.nextDir = 'LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.hamster.nextDir = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

      // 1. TIMERS UPDATE
      if (engine.frightenedTimer > 0) {
        engine.frightenedTimer--;
        if (engine.frameCount % 30 === 0) {
          setFrightenedTimer(Math.ceil(engine.frightenedTimer / 60));
        }
        if (engine.frightenedTimer === 0) {
          // Revert frightening status
          engine.ghosts.forEach(g => {
            g.isFrightened = false;
            g.speed = 1.5;
          });
          setFrightenedTimer(0);
        }
      }

      if (engine.invulnFrames > 0) {
        engine.invulnFrames--;
      }

      // 2. PLAYERS ENGINE (HAMSTER SMOOTH MOVEMENT)
      const player = engine.hamster;

      // Helper to check alignment with a small tolerance to prevent floating point drift
      const checkAndAlignActor = (actor: GameActor) => {
        const modX = actor.x % CELL_SIZE;
        const modY = actor.y % CELL_SIZE;
        
        const normModX = modX < 0 ? modX + CELL_SIZE : modX;
        const normModY = modY < 0 ? modY + CELL_SIZE : modY;

        const tolerance = actor.speed + 0.05;
        const nearX = (normModX < tolerance) || (CELL_SIZE - normModX < tolerance);
        const nearY = (normModY < tolerance) || (CELL_SIZE - normModY < tolerance);

        if (nearX && nearY) {
          actor.x = Math.round(actor.x / CELL_SIZE) * CELL_SIZE;
          actor.y = Math.round(actor.y / CELL_SIZE) * CELL_SIZE;
          return true;
        }
        return false;
      };

      // Check if player is near a grid alignment point (within speed range) with tolerance
      const isAligned = checkAndAlignActor(player);

      if (isAligned) {
        player.gridX = Math.round(player.x / CELL_SIZE);
        player.gridY = Math.round(player.y / CELL_SIZE);

        // Adjust for tunnel warping (infinite loop escapes)
        // If we move LEFT and reach -CELL_SIZE, wrap to COLS * CELL_SIZE
        if (player.gridX < 0) {
          player.gridX = COLS;
          player.x = COLS * CELL_SIZE;
        } 
        // If we move RIGHT and reach COLS, wrap to -CELL_SIZE
        else if (player.gridX >= COLS) {
          player.gridX = -1;
          player.x = -CELL_SIZE;
        }

        player.targetGridX = player.gridX;
        player.targetGridY = player.gridY;

        // Try to handle next steers buffered of arrow presses
        if (player.nextDir) {
          let checkX = player.gridX;
          let checkY = player.gridY;
          if (player.nextDir === 'UP') checkY--;
          if (player.nextDir === 'DOWN') checkY++;
          if (player.nextDir === 'LEFT') checkX--;
          if (player.nextDir === 'RIGHT') checkX++;

          // Wrap boundaries checks
          if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
            // Check wall collision
            if (engine.maze[checkY][checkX] !== 1) {
              player.currentDir = player.nextDir;
            }
          } else if (player.gridY === 6 && (player.nextDir === 'LEFT' || player.nextDir === 'RIGHT')) {
            // Tunnel allows going off-screen
            player.currentDir = player.nextDir;
          }
        }

        // Apply constant velocity heading in general current direction
        if (player.currentDir) {
          let testX = player.gridX;
          let testY = player.gridY;
          if (player.currentDir === 'UP') testY--;
          if (player.currentDir === 'DOWN') testY++;
          if (player.currentDir === 'LEFT') testX--;
          if (player.currentDir === 'RIGHT') testX++;

          if (testX >= 0 && testX < COLS && testY >= 0 && testY < ROWS) {
            if (engine.maze[testY][testX] !== 1) {
              player.targetGridX = testX;
              player.targetGridY = testY;
            } else {
              // Hit wall, halts
              player.currentDir = null;
            }
          } else if (player.gridY === 6 && (player.currentDir === 'LEFT' || player.currentDir === 'RIGHT')) {
            player.targetGridX = testX;
            player.targetGridY = testY;
          } else {
            player.currentDir = null;
          }
        }
      }

      // Execute actual physical step motion
      if (player.currentDir) {
        if (player.currentDir === 'UP') player.y -= player.speed;
        if (player.currentDir === 'DOWN') player.y += player.speed;
        if (player.currentDir === 'LEFT') player.x -= player.speed;
        if (player.currentDir === 'RIGHT') player.x += player.speed;
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

      // 4. GHOST ENGINE (COLA BOTTLES CHASE ENEMY LOGIC)
      engine.ghosts.forEach((ghost, idx) => {
        const isGhostAligned = checkAndAlignActor(ghost);

        if (isGhostAligned) {
          ghost.gridX = Math.round(ghost.x / CELL_SIZE);
          ghost.gridY = Math.round(ghost.y / CELL_SIZE);

          // Wrap index for portal
          // If moving LEFT and reach -CELL_SIZE, wrap to COLS * CELL_SIZE
          if (ghost.gridX < 0) {
            ghost.gridX = COLS;
            ghost.x = COLS * CELL_SIZE;
          } 
          // If moving RIGHT and reach COLS, wrap to -CELL_SIZE
          else if (ghost.gridX >= COLS) {
            ghost.gridX = -1;
            ghost.x = -CELL_SIZE;
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
              let targetX = player.gridX;
              let targetY = player.gridY;

              if (idx === 1) {
                // Diet Blue Cola intercepts 3 steps ahead
                if (player.currentDir === 'UP') targetY -= 3;
                if (player.currentDir === 'DOWN') targetY += 3;
                if (player.currentDir === 'LEFT') targetX -= 3;
                if (player.currentDir === 'RIGHT') targetX += 3;
              } else if (idx === 2) {
                // Lemon Cola is curious and wanders off to target the corners if too close
                const distToPlayer = Math.abs(ghost.gridX - player.gridX) + Math.abs(ghost.gridY - player.gridY);
                if (distToPlayer < 4) {
                  // Run away to top-right corner
                  targetX = COLS - 2;
                  targetY = 1;
                }
              }

              // Evaluate which cell minimises taxicab distance (L1 norm) to the target coordinates
              let minDist = Infinity;
              validDirs.forEach(d => {
                const dist = Math.abs(d.x - targetX) + Math.abs(d.y - targetY);
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

        // Apply physical motion towards target coordinates
        const stepAmt = ghost.speed;
        if (ghost.currentDir === 'UP') ghost.y -= stepAmt;
        if (ghost.currentDir === 'DOWN') ghost.y += stepAmt;
        if (ghost.currentDir === 'LEFT') ghost.x -= stepAmt;
        if (ghost.currentDir === 'RIGHT') ghost.x += stepAmt;
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
            ghost.x = 7 * CELL_SIZE;
            ghost.y = 5 * CELL_SIZE;
            ghost.isFrightened = false;
            ghost.speed = 1.5;
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
              // Briefly reset positions
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
      // Double resolution high-DPI scaling for ultra crisp rendering!
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
            // Draw a shiny golden circular glow behind the bottle to make it extremely visible
            ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();

            // Render bigger bottle
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍾', c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2 + 1);
          } else if (type === 2) {
            // DRAW POWER PEANUT / SEED
            // Make peanut shine / pulse animation
            const pulse = 1 + 0.18 * Math.sin(engine.frameCount * 0.15);
            ctx.save();
            ctx.translate(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            ctx.scale(pulse, pulse);

            // Draw a beautiful white/amber pulse glow behind it
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '22px sans-serif';
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
          // Blue frightened cola shape with warning circular glow
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
          // GORGEOUS HIGH-CONTRAST CHICK COLA DESIGN
          // Glowing aura behind matching their distinct flavor color so it pops against pitch black
          ctx.fillStyle = `${ghost.color}35`; 
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          // Render light name tag / thick accent glow circle
          ctx.strokeStyle = ghost.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Standard full-power enemy bottle
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Ensure we draw the custom soda/drink cups
          ctx.fillText(ghost.emoji, 0, 0);
        }
        ctx.restore();
      });

      // Draw Hamster Player
      if (engine.invulnFrames === 0 || Math.floor(engine.frameCount / 8) % 2 === 0) {
        ctx.save();
        ctx.translate(player.x + CELL_SIZE / 2, player.y + CELL_SIZE / 2);
        
        // Cozy golden ring background behind hamster so it is ALWAYS instantly found
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Flip hamster based on steer heading
        if (player.currentDir === 'LEFT' || player.nextDir === 'LEFT') {
          ctx.scale(-1, 1);
        }
        
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.emoji, 0, 0);
        
        // Shiny energy shield border when supercharged
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
