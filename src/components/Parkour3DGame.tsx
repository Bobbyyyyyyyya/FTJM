import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Camera, 
  Share2, 
  Pause, 
  HelpCircle,
  Sparkles,
  Zap,
  Flag,
  CheckCircle2,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export interface Parkour3DGameProps {
  onBack: () => void;
  isFullscreen?: boolean;
  userProfile?: any;
  onSaveHighScore?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout' | 'catclicker' | 'parkour3d', score: number) => Promise<void>;
  onShareHighScoreOpen?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout' | 'catclicker' | 'parkour3d', score: number) => void;
}

// Sound Synthesizer using Web Audio API
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  jump() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  dash() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  bounce() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  coin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.06, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.07 + 0.12);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.12);
    });
  }

  checkpoint() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.08, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.06 + 0.2);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  fall() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  victory() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.1, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.09 + 0.35);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.35);
    });
  }
}

const sounds = new SoundEngine();

interface PlatformData {
  mesh: THREE.Mesh | THREE.Group;
  bbox: THREE.Box3;
  type: 'normal' | 'bounce' | 'crumble' | 'moving' | 'speed';
  moveAxis?: 'x' | 'y' | 'z';
  moveRange?: number;
  moveSpeed?: number;
  initialPos?: THREE.Vector3;
  prevPos?: THREE.Vector3;
  deltaPos?: THREE.Vector3;
  crumbleTimer?: number;
  isCrumbling?: boolean;
  isFallen?: boolean;
}

interface CrystalData {
  mesh: THREE.Mesh;
  collected: boolean;
  pos: THREE.Vector3;
}

interface CheckpointData {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  activated: boolean;
  index: number;
}

interface HazardLaser {
  mesh: THREE.Group;
  center: THREE.Vector3;
  rotationSpeed: number;
  length: number;
}

export function Parkour3DGame({ onBack, isFullscreen, userProfile, onSaveHighScore, onShareHighScoreOpen }: Parkour3DGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game States - Starts directly into Level 1 action!
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'paused' | 'won' | 'gameover'>('playing');
  const [level, setLevel] = useState<number>(1);
  const [gameMode, setGameMode] = useState<'campaign' | 'endless'>('campaign');
  const [score, setScore] = useState<number>(0);
  const [crystals, setCrystals] = useState<number>(0);
  const [totalCrystalsInLevel, setTotalCrystalsInLevel] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<'third' | 'first'>('third');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState<number>(0);
  const [dashAvailable, setDashAvailable] = useState<boolean>(true);
  const [isSpeedBoosted, setIsSpeedBoosted] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showLevelIntro, setShowLevelIntro] = useState<boolean>(true);

  // Sync state refs so the 3D loop never breaks across renders
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const cameraModeRef = useRef(cameraMode);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const gameModeRef = useRef(gameMode);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    if (showLevelIntro) {
      const t = setTimeout(() => setShowLevelIntro(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showLevelIntro, level, gameMode]);

  // Highscore loading
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ftjm_parkour3d_highscore');
      if (stored) setHighScore(parseInt(stored, 10));
    } catch {}
  }, []);

  const saveScoreRecord = useCallback((finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('ftjm_parkour3d_highscore', finalScore.toString());
      } catch {}
      onSaveHighScore?.('parkour3d', finalScore);
    }
  }, [highScore, onSaveHighScore]);

  // Keys ref
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Mobile virtual controls state
  const touchControls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
  });

  // Game loop engine refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const startTimeRef = useRef<number>(performance.now());

  // Player physics
  const playerRef = useRef({
    group: new THREE.Group(),
    shadowMesh: new THREE.Mesh(),
    bodyParts: {
      head: new THREE.Mesh(),
      torso: new THREE.Mesh(),
      leftArm: new THREE.Mesh(),
      rightArm: new THREE.Mesh(),
      leftLeg: new THREE.Mesh(),
      rightLeg: new THREE.Mesh(),
      thruster: new THREE.Mesh(),
    },
    pos: new THREE.Vector3(0, 3, 0),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    isGrounded: false,
    canDoubleJump: true,
    dashCooldown: 0,
    coyoteTimer: 0,
    jumpBuffer: 0,
    speedBoostTimer: 0,
    lastCheckpoint: new THREE.Vector3(0, 3, 0),
    runAnimTime: 0,
    radius: 0.5,
    height: 1.6,
  });

  // Level elements refs
  const platformsRef = useRef<PlatformData[]>([]);
  const crystalsRef = useRef<CrystalData[]>([]);
  const checkpointsRef = useRef<CheckpointData[]>([]);
  const lasersRef = useRef<HazardLaser[]>([]);
  const finishPortalRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<{ mesh: THREE.Points; count: number; geo: THREE.BufferGeometry } | null>(null);
  const particleData = useRef<{ pos: Float32Array; vel: Float32Array; life: Float32Array }>({
    pos: new Float32Array(300),
    vel: new Float32Array(300),
    life: new Float32Array(100),
  });

  // Endless mode generation cursor
  const endlessCursorZ = useRef<number>(0);

  // Spawn visual particles
  const spawnParticles = (pos: THREE.Vector3, color: THREE.Color, count = 20, speed = 4) => {
    const data = particleData.current;
    let spawned = 0;
    for (let i = 0; i < 100 && spawned < count; i++) {
      if (data.life[i] <= 0) {
        data.pos[i * 3] = pos.x;
        data.pos[i * 3 + 1] = pos.y;
        data.pos[i * 3 + 2] = pos.z;

        data.vel[i * 3] = (Math.random() - 0.5) * speed;
        data.vel[i * 3 + 1] = Math.random() * speed + 1;
        data.vel[i * 3 + 2] = (Math.random() - 0.5) * speed;

        data.life[i] = 1.0;
        spawned++;
      }
    }
  };

  // Build 3D City Backdrop with Cosmic Stars & Illuminated Cyber Towers
  const buildCityBackdrop = (scene: THREE.Scene) => {
    // 1. Cosmic Starfield overhead and around horizon
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 140 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.48); // upper hemisphere
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) + 10;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9be8ff,
      size: 1.4,
      transparent: true,
      opacity: 0.9,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // 2. City buildings with glowing neon window bands & beacon spires
    const cityGroup = new THREE.Group();
    const buildingColors = [0x16223e, 0x1d2c52, 0x22183b, 0x142845];
    const windowColors = [0x00f3ff, 0xff007f, 0xffdd00, 0x7000ff];

    for (let i = 0; i < 55; i++) {
      const width = 10 + Math.random() * 16;
      const depth = 10 + Math.random() * 16;
      const height = 40 + Math.random() * 110;
      const bGeo = new THREE.BoxGeometry(width, height, depth);
      const bMat = new THREE.MeshStandardMaterial({
        color: buildingColors[i % buildingColors.length],
        roughness: 0.45,
        metalness: 0.35,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);

      const angle = (i / 55) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const dist = 75 + Math.random() * 85;
      bMesh.position.set(Math.cos(angle) * dist, height / 2 - 35, Math.sin(angle) * dist);

      // Add 2-3 vibrant glowing neon window rings per skyscraper
      for (let w = 0; w < 3; w++) {
        if (Math.random() > 0.25) {
          const winBandGeo = new THREE.BoxGeometry(width + 0.2, 1.4, depth + 0.2);
          const winMat = new THREE.MeshBasicMaterial({
            color: windowColors[(i + w) % windowColors.length],
          });
          const winMesh = new THREE.Mesh(winBandGeo, winMat);
          winMesh.position.y = (w * 0.28 - 0.2) * (height / 2);
          bMesh.add(winMesh);
        }
      }

      // Rooftop antenna beacons
      if (Math.random() > 0.5) {
        const beaconGeo = new THREE.CylinderGeometry(0.12, 0.22, 9, 4);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0066 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = height / 2 + 4.5;
        bMesh.add(beacon);
      }

      cityGroup.add(bMesh);
    }
    scene.add(cityGroup);
  };

  // Build Player Model - High-contrast futuristic cyber runner
  const buildPlayer = (scene: THREE.Scene) => {
    const playerGroup = new THREE.Group();

    // High-visibility materials so the runner clearly pops against any background
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xeff6ff, // Bright white-silver composite armor
      roughness: 0.2,
      metalness: 0.5,
    });
    const suitUnderMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark slate tactical undersuit
      roughness: 0.4,
      metalness: 0.3,
    });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const neonPink = new THREE.MeshBasicMaterial({ color: 0xff007f });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.38);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Glowing cyan reactor core on chest
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.08), neonCyan);
    chestPlate.position.set(0, 0.9, 0.2);
    playerGroup.add(chestPlate);

    // Head
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeo, armorMat);
    head.position.y = 1.42;
    head.castShadow = true;
    playerGroup.add(head);

    // Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.38, 0.18, 0.12);
    const visor = new THREE.Mesh(visorGeo, neonCyan);
    visor.position.set(0, 1.42, 0.2);
    playerGroup.add(visor);

    // Thruster backpack
    const thrusterGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.42, 8);
    const thruster = new THREE.Mesh(thrusterGeo, neonPink);
    thruster.rotation.x = Math.PI / 8;
    thruster.position.set(0, 0.85, -0.24);
    playerGroup.add(thruster);

    // Limbs
    const limbMat = suitUnderMat;
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.46, 0.8, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.46, 0.8, 0);
    playerGroup.add(rightArm);

    const legGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.2, 0.32, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.2, 0.32, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    // Landing target shadow decal (visible glowing cyan projection on platforms)
    const shadowGeo = new THREE.CircleGeometry(0.55, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    scene.add(shadowMesh);

    scene.add(playerGroup);

    playerRef.current.group = playerGroup;
    playerRef.current.shadowMesh = shadowMesh;
    playerRef.current.bodyParts = {
      head,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      thruster,
    };
  };

  // Helper: Create Platform with High-Contrast Glowing Landing Plates
  const createPlatformMesh = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    type: 'normal' | 'bounce' | 'crumble' | 'moving' | 'speed' = 'normal',
    options?: { moveAxis?: 'x' | 'y' | 'z'; moveRange?: number; moveSpeed?: number }
  ): PlatformData => {
    const group = new THREE.Group();

    let mainColor = 0x223254; // Crisp slate navy body
    let edgeColor = 0x00f3ff; // Vivid cyan
    let topPlateColor = 0x2d436e; // Clearly visible landing face

    if (type === 'bounce') {
      mainColor = 0x481552;
      edgeColor = 0xff00bb;
      topPlateColor = 0x6e1f7c;
    } else if (type === 'crumble') {
      mainColor = 0x54290d;
      edgeColor = 0xff7700;
      topPlateColor = 0x7c3c13;
    } else if (type === 'moving') {
      mainColor = 0x14403d;
      edgeColor = 0x00ffaa;
      topPlateColor = 0x1f5c58;
    } else if (type === 'speed') {
      mainColor = 0x52480e;
      edgeColor = 0xffdd00;
      topPlateColor = 0x796a14;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.3,
      metalness: 0.45,
    });

    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Glowing top landing panel - makes platforms super clear and easy to aim for!
    const topGeo = new THREE.BoxGeometry(w * 0.92, 0.05, d * 0.92);
    const topMat = new THREE.MeshStandardMaterial({
      color: topPlateColor,
      roughness: 0.25,
      metalness: 0.3,
      emissive: edgeColor,
      emissiveIntensity: 0.25,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = h / 2 + 0.025;
    group.add(topMesh);

    // Glowing rim / border lines
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeLine = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: edgeColor })
    );
    group.add(edgeLine);

    // Additional visuals for special platform types
    if (type === 'bounce') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, Math.min(w, d) * 0.42, 24),
        new THREE.MeshBasicMaterial({ color: 0xff00bb, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = h / 2 + 0.06;
      group.add(ring);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 0.12, 16),
        new THREE.MeshStandardMaterial({
          color: 0xff00bb,
          emissive: 0xff00bb,
          emissiveIntensity: 0.8,
          roughness: 0.2
        })
      );
      core.position.y = h / 2 + 0.08;
      group.add(core);
    } else if (type === 'speed') {
      // Speed arrow
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.9, 4),
        new THREE.MeshBasicMaterial({ color: 0xffdd00 })
      );
      arrow.rotation.x = -Math.PI / 2;
      arrow.rotation.z = Math.PI;
      arrow.position.y = h / 2 + 0.06;
      group.add(arrow);
    }

    group.position.set(x, y, z);
    const bbox = new THREE.Box3().setFromObject(group);

    return {
      mesh: group,
      bbox,
      type,
      moveAxis: options?.moveAxis,
      moveRange: options?.moveRange,
      moveSpeed: options?.moveSpeed,
      initialPos: new THREE.Vector3(x, y, z),
      crumbleTimer: 0,
      isCrumbling: false,
      isFallen: false,
    };
  };

  // Helper: Create Crystal
  const createCrystal = (x: number, y: number, z: number): CrystalData => {
    const geo = new THREE.OctahedronGeometry(0.4, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x007799,
      metalness: 0.9,
      roughness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return {
      mesh,
      collected: false,
      pos: new THREE.Vector3(x, y, z),
    };
  };

  // Helper: Create Checkpoint
  const createCheckpoint = (x: number, y: number, z: number, index: number): CheckpointData => {
    const group = new THREE.Group();

    // Arch pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: 0.5 });
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.2, 8);

    const left = new THREE.Mesh(pillarGeo, pillarMat);
    left.position.set(-1.2, 1.6, 0);
    group.add(left);

    const right = new THREE.Mesh(pillarGeo, pillarMat);
    right.position.set(1.2, 1.6, 0);
    group.add(right);

    // Glowing banner ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00a2ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 2.4;
    group.add(ring);

    group.position.set(x, y, z);

    return {
      mesh: group,
      pos: new THREE.Vector3(x, y, z),
      activated: false,
      index,
    };
  };

  // Helper: Create Hazard Laser
  const createHazardLaser = (cx: number, cy: number, cz: number, length = 6, speed = 1.5): HazardLaser => {
    const group = new THREE.Group();
    // Center post
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x441122 })
    );
    group.add(post);

    // Laser beam
    const beamGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 0.5;
    group.add(beam);

    group.position.set(cx, cy, cz);

    return {
      mesh: group,
      center: new THREE.Vector3(cx, cy, cz),
      rotationSpeed: speed,
      length,
    };
  };

  // Helper: Create Finish Portal
  const createFinishPortal = (x: number, y: number, z: number): THREE.Group => {
    const group = new THREE.Group();

    // Outer portal arch
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x112244,
      metalness: 0.8,
      roughness: 0.2,
    });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2, 0.25, 12, 32), archMat);
    arch.position.y = 2.2;
    group.add(arch);

    // Swirling inner vortex
    const vortexGeo = new THREE.CircleGeometry(1.9, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.position.y = 2.2;
    group.add(vortex);

    group.position.set(x, y, z);
    return group;
  };

  // Build Specific Level
  const loadLevel = (lvl: number, scene: THREE.Scene, mode?: 'campaign' | 'endless') => {
    const activeMode = mode || gameModeRef.current;

    // Clear old elements
    platformsRef.current.forEach(p => scene.remove(p.mesh));
    crystalsRef.current.forEach(c => scene.remove(c.mesh));
    checkpointsRef.current.forEach(cp => scene.remove(cp.mesh));
    lasersRef.current.forEach(l => scene.remove(l.mesh));
    if (finishPortalRef.current) scene.remove(finishPortalRef.current);

    platformsRef.current = [];
    crystalsRef.current = [];
    checkpointsRef.current = [];
    lasersRef.current = [];

    const startSpawn = new THREE.Vector3(0, 3, 0);

    if (activeMode === 'endless') {
      // Endless procedural initialization
      endlessCursorZ.current = 0;
      // Starting platform
      const pStart = createPlatformMesh(8, 2, 8, 0, 0, 0, 'normal');
      scene.add(pStart.mesh);
      platformsRef.current.push(pStart);

      // Generate initial 25 platforms
      for (let i = 0; i < 25; i++) {
        appendEndlessPlatform(scene);
      }

      playerRef.current.pos.copy(startSpawn);
      playerRef.current.vel.set(0, 0, 0);
      playerRef.current.lastCheckpoint.copy(startSpawn);
      setTotalCrystalsInLevel(9999);

      if (cameraRef.current) {
        cameraRef.current.position.set(startSpawn.x, startSpawn.y + 3.2, startSpawn.z - 6.5);
        cameraRef.current.lookAt(startSpawn.x, startSpawn.y + 1.2, startSpawn.z + 5);
      }
      return;
    }

    if (lvl === 1) {
      // LEVEL 1: Rooftop Rush (Introductory, fluid jumps, bounce pads)
      const pData: PlatformData[] = [
        // Start platform
        createPlatformMesh(8, 2, 8, 0, 0, 0),
        // First jump
        createPlatformMesh(5, 2, 5, 0, 0, 9),
        // Step up
        createPlatformMesh(4, 2, 4, 0, 1.2, 17),
        // Bounce pad onto high rooftop
        createPlatformMesh(4, 1.5, 4, 0, 1.2, 24, 'bounce'),
        // High rooftop
        createPlatformMesh(8, 2, 8, 0, 7.5, 34),
        // Checkpoint 1
        createPlatformMesh(6, 2, 6, 0, 7.5, 45),
        // Moving platform horizontally
        createPlatformMesh(4, 1.5, 4, 0, 7.5, 54, 'moving', { moveAxis: 'x', moveRange: 4, moveSpeed: 2 }),
        // Next rooftop
        createPlatformMesh(6, 2, 6, 0, 7.5, 64),
        // Speed booster jump
        createPlatformMesh(4, 1.5, 6, 0, 7.5, 73, 'speed'),
        // Far landing rooftop
        createPlatformMesh(9, 2, 9, 0, 7.5, 87),
        // Finish platform
        createPlatformMesh(8, 2, 8, 0, 7.5, 99),
      ];

      pData.forEach(p => {
        scene.add(p.mesh);
        platformsRef.current.push(p);
      });

      // Crystals
      const cData = [
        createCrystal(0, 2.5, 9),
        createCrystal(0, 3.7, 17),
        createCrystal(0, 6, 28), // In the air from bounce pad
        createCrystal(0, 9.8, 34),
        createCrystal(2, 9.8, 54),
        createCrystal(-2, 9.8, 54),
        createCrystal(0, 9.8, 64),
        createCrystal(0, 10, 80),
        createCrystal(0, 9.8, 87),
      ];
      cData.forEach(c => {
        scene.add(c.mesh);
        crystalsRef.current.push(c);
      });

      // Checkpoints
      const cp1 = createCheckpoint(0, 8.5, 45, 1);
      scene.add(cp1.mesh);
      checkpointsRef.current.push(cp1);

      // Finish Portal
      const finish = createFinishPortal(0, 8.5, 99);
      scene.add(finish);
      finishPortalRef.current = finish;

      setTotalCrystalsInLevel(cData.length);
    } else if (lvl === 2) {
      // LEVEL 2: De Neon Hoogtes (Moving platforms, crumbling tiles & speed jumps)
      const pData: PlatformData[] = [
        createPlatformMesh(7, 2, 7, 0, 0, 0),
        // Double moving platforms
        createPlatformMesh(4, 1.5, 4, -3, 0.5, 8, 'moving', { moveAxis: 'x', moveRange: 3, moveSpeed: 2.5 }),
        createPlatformMesh(4, 1.5, 4, 3, 1.5, 16, 'moving', { moveAxis: 'z', moveRange: 3, moveSpeed: 2 }),
        // Crumbling bridge
        createPlatformMesh(3, 1, 3, 0, 2.2, 23, 'crumble'),
        createPlatformMesh(3, 1, 3, 0, 2.2, 28, 'crumble'),
        // Rest platform + Checkpoint
        createPlatformMesh(6, 2, 6, 0, 2.5, 36),
        // Vertical elevator platform
        createPlatformMesh(4, 1.5, 4, 0, 2.5, 45, 'moving', { moveAxis: 'y', moveRange: 4, moveSpeed: 2 }),
        // High platform with spinning laser
        createPlatformMesh(7, 2, 7, 0, 7.5, 54),
        // Bounce pad launching over void
        createPlatformMesh(4, 1.5, 4, 0, 7.5, 64, 'bounce'),
        // Floating pillar
        createPlatformMesh(3, 8, 3, 0, 8.5, 77),
        // Final long speed sprint
        createPlatformMesh(4, 2, 10, 0, 8.5, 90, 'speed'),
        createPlatformMesh(8, 2, 8, 0, 8.5, 105),
      ];

      pData.forEach(p => {
        scene.add(p.mesh);
        platformsRef.current.push(p);
      });

      // Crystals
      const cData = [
        createCrystal(-3, 2.5, 8),
        createCrystal(3, 3.5, 16),
        createCrystal(0, 4, 25),
        createCrystal(0, 5, 36),
        createCrystal(0, 10, 54),
        createCrystal(0, 15, 70), // High in bounce arc
        createCrystal(0, 13.5, 77),
        createCrystal(0, 11, 90),
      ];
      cData.forEach(c => {
        scene.add(c.mesh);
        crystalsRef.current.push(c);
      });

      // Hazard Laser
      const laser1 = createHazardLaser(0, 9.5, 54, 6.5, 1.8);
      scene.add(laser1.mesh);
      lasersRef.current.push(laser1);

      // Checkpoint
      const cp1 = createCheckpoint(0, 3.5, 36, 1);
      scene.add(cp1.mesh);
      checkpointsRef.current.push(cp1);

      // Finish Portal
      const finish = createFinishPortal(0, 9.5, 105);
      scene.add(finish);
      finishPortalRef.current = finish;

      setTotalCrystalsInLevel(cData.length);
    } else {
      // LEVEL 3: Cyber Matrix Abyss (Precision & master parkour)
      const pData: PlatformData[] = [
        createPlatformMesh(7, 2, 7, 0, 0, 0),
        // Staggered small pillars
        createPlatformMesh(2.5, 5, 2.5, -2.5, 0.5, 8),
        createPlatformMesh(2.5, 5, 2.5, 2.5, 1.5, 15),
        createPlatformMesh(2.5, 5, 2.5, -2, 2.5, 22),
        // Crumbling chain
        createPlatformMesh(2.5, 1, 2.5, 0, 3.5, 28, 'crumble'),
        createPlatformMesh(2.5, 1, 2.5, 0, 4.0, 33, 'crumble'),
        createPlatformMesh(2.5, 1, 2.5, 0, 4.5, 38, 'crumble'),
        // Checkpoint 1
        createPlatformMesh(6, 2, 6, 0, 5.0, 46),
        // Dual spinning lasers platform
        createPlatformMesh(8, 2, 8, 0, 5.0, 58),
        // Mega Bounce pad
        createPlatformMesh(4, 1.5, 4, 0, 5.0, 68, 'bounce'),
        // High sky island
        createPlatformMesh(5, 2, 5, 0, 15.0, 80),
        // Moving platform zigzag
        createPlatformMesh(3.5, 1.5, 3.5, -3, 15.0, 90, 'moving', { moveAxis: 'x', moveRange: 3.5, moveSpeed: 3 }),
        createPlatformMesh(3.5, 1.5, 3.5, 3, 15.0, 100, 'moving', { moveAxis: 'x', moveRange: 3.5, moveSpeed: 3 }),
        // Finish platform
        createPlatformMesh(8, 2, 8, 0, 15.0, 114),
      ];

      pData.forEach(p => {
        scene.add(p.mesh);
        platformsRef.current.push(p);
      });

      // Crystals
      const cData = [
        createCrystal(-2.5, 4, 8),
        createCrystal(2.5, 5, 15),
        createCrystal(-2, 6, 22),
        createCrystal(0, 6.5, 33),
        createCrystal(0, 7.5, 46),
        createCrystal(0, 8, 58),
        createCrystal(0, 20, 74), // Epic apex of mega bounce!
        createCrystal(0, 17.5, 80),
        createCrystal(0, 17.5, 95),
        createCrystal(0, 17.5, 114),
      ];
      cData.forEach(c => {
        scene.add(c.mesh);
        crystalsRef.current.push(c);
      });

      // Lasers
      const laser1 = createHazardLaser(0, 7.0, 58, 7.0, 2.2);
      scene.add(laser1.mesh);
      lasersRef.current.push(laser1);

      // Checkpoint
      const cp1 = createCheckpoint(0, 6.0, 46, 1);
      scene.add(cp1.mesh);
      checkpointsRef.current.push(cp1);

      // Finish Portal
      const finish = createFinishPortal(0, 16.0, 114);
      scene.add(finish);
      finishPortalRef.current = finish;

      setTotalCrystalsInLevel(cData.length);
    }

    // Reset player to start
    playerRef.current.pos.copy(startSpawn);
    playerRef.current.vel.set(0, 0, 0);
    playerRef.current.lastCheckpoint.copy(startSpawn);
    setCurrentCheckpointIndex(0);

    // Aim camera immediately at player spawn
    if (cameraRef.current) {
      cameraRef.current.position.set(startSpawn.x, startSpawn.y + 3.2, startSpawn.z - 6.5);
      cameraRef.current.lookAt(startSpawn.x, startSpawn.y + 1.2, startSpawn.z + 5);
    }
  };

  // Append a platform for Endless Mode
  const appendEndlessPlatform = (scene: THREE.Scene) => {
    endlessCursorZ.current += 7 + Math.random() * 5;
    const z = endlessCursorZ.current;
    const x = (Math.random() - 0.5) * 8;
    const y = Math.sin(z * 0.05) * 4;

    const r = Math.random();
    let type: 'normal' | 'bounce' | 'crumble' | 'moving' | 'speed' = 'normal';
    let opts = undefined;

    if (r < 0.18) {
      type = 'bounce';
    } else if (r < 0.35) {
      type = 'moving';
      opts = { moveAxis: 'x' as const, moveRange: 3, moveSpeed: 2 + Math.random() * 2 };
    } else if (r < 0.5) {
      type = 'crumble';
    } else if (r < 0.65) {
      type = 'speed';
    }

    const w = 3 + Math.random() * 3;
    const d = 3 + Math.random() * 3;
    const p = createPlatformMesh(w, 1.5, d, x, y, z, type, opts);
    scene.add(p.mesh);
    platformsRef.current.push(p);

    // Crystal chance
    if (Math.random() > 0.4) {
      const crystal = createCrystal(x, y + 2, z);
      scene.add(crystal.mesh);
      crystalsRef.current.push(crystal);
    }
  };

  // Respawn player
  const respawnPlayer = useCallback(() => {
    sounds.fall();
    playerRef.current.pos.copy(playerRef.current.lastCheckpoint);
    playerRef.current.vel.set(0, 0, 0);
    playerRef.current.isGrounded = false;
    playerRef.current.canDoubleJump = true;
    playerRef.current.speedBoostTimer = 0;
    setIsSpeedBoosted(false);

    if (cameraRef.current) {
      const cp = playerRef.current.lastCheckpoint;
      cameraRef.current.position.set(cp.x, cp.y + 3.2, cp.z - 6.5);
      cameraRef.current.lookAt(cp.x, cp.y + 1.2, cp.z + 5);
    }

    if (sceneRef.current) {
      spawnParticles(playerRef.current.pos, new THREE.Color(0x00f3ff), 30, 5);
    }
  }, []);

  // Initialize Three.js Scene - Runs once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const width = Math.max(mountRef.current.clientWidth || 0, 800);
    const height = Math.max(mountRef.current.clientHeight || 0, 500);

    // Scene with high-contrast Cyberpunk night sky & soft linear fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1026);
    scene.fog = new THREE.Fog(0x0a1026, 45, 220);
    sceneRef.current = scene;

    // Camera - Initialized immediately behind start spawn looking down the course
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);
    camera.position.set(0, 4.5, -6.5);
    camera.lookAt(0, 2.0, 5);
    cameraRef.current = camera;

    // Renderer with explicit absolute sizing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Bright, rich multi-source illumination so all faces are crisp & visible!
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x70e4ff, 1.8);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -45;
    dirLight.shadow.camera.right = 45;
    dirLight.shadow.camera.top = 45;
    dirLight.shadow.camera.bottom = -45;
    scene.add(dirLight);

    // Rim / fill light for cyberpunk edge glow
    const rimLight = new THREE.DirectionalLight(0xff55cc, 0.9);
    rimLight.position.set(-25, 35, -20);
    scene.add(rimLight);

    // Localized rooftop neon light
    const pointLight = new THREE.PointLight(0x00f3ff, 1.8, 45);
    pointLight.position.set(0, 8, 10);
    scene.add(pointLight);

    // Glowing Matrix Grid Floor below
    const gridHelper = new THREE.GridHelper(500, 100, 0x00f3ff, 0x1a264a);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Particle System
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(300);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const pMesh = new THREE.Points(pGeo, pMat);
    scene.add(pMesh);
    particlesRef.current = { mesh: pMesh, count: 100, geo: pGeo };

    // Build Backdrop & Player
    buildCityBackdrop(scene);
    buildPlayer(scene);

    // Load Initial Level (Level 1)
    loadLevel(1, scene, 'campaign');

    // Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Camera toggle shortcut
      if (e.code === 'KeyC' || e.code === 'KeyV') {
        setCameraMode(prev => (prev === 'third' ? 'first' : 'third'));
      }
      // Restart shortcut
      if (e.code === 'KeyR') {
        respawnPlayer();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 10 && newH > 10 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH, false);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    // Main Game Loop
    lastTimeRef.current = performance.now();
    startTimeRef.current = performance.now();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap delta to avoid physics tunneling
      lastTimeRef.current = now;
      const elapsedTime = (now - startTimeRef.current) / 1000;
      const p = playerRef.current;
      const isPlaying = gameStateRef.current === 'playing';

      if (isPlaying) {
        setTimer(t => t + delta);

        // Input Handling - A and D swapped per user request
        const forward = keysRef.current['KeyW'] || keysRef.current['ArrowUp'] || touchControls.current.forward;
        const backward = keysRef.current['KeyS'] || keysRef.current['ArrowDown'] || touchControls.current.backward;
        const steerLeft = keysRef.current['KeyA'] || keysRef.current['ArrowLeft'] || touchControls.current.left;
        const steerRight = keysRef.current['KeyD'] || keysRef.current['ArrowRight'] || touchControls.current.right;
        const jumpPressed = keysRef.current['Space'] || touchControls.current.jump;
        const dashPressed = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'] || touchControls.current.dash;

        // Speed & Sprint
        const baseSpeed = p.speedBoostTimer > 0 ? 18 : 11;
        const maxSpeed = baseSpeed;

        // Direction calculation relative to camera yaw (+Z is forward, +X is screen left, -X is screen right)
        let moveX = 0;
        let moveZ = 0;

        if (forward) moveZ += 1;
        if (backward) moveZ -= 1;
        if (steerLeft) moveX += 1;   // Inverted per user request so A moves left on screen
        if (steerRight) moveX -= 1;  // Inverted per user request so D moves right on screen

        if (moveX !== 0 || moveZ !== 0) {
          const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
          moveX /= moveLen;
          moveZ /= moveLen;

          // Target movement direction (align forward with +Z)
          const targetVelX = moveX * maxSpeed;
          const targetVelZ = moveZ * maxSpeed;

          // Smooth acceleration
          const accel = p.isGrounded ? 18 : 8;
          p.vel.x += (targetVelX - p.vel.x) * accel * delta;
          p.vel.z += (targetVelZ - p.vel.z) * accel * delta;

          // Character facing rotation
          const targetAngle = Math.atan2(moveX, moveZ);
          p.yaw = targetAngle;
          p.runAnimTime += delta * 12;
        } else {
          // Deceleration
          const friction = p.isGrounded ? 12 : 2;
          p.vel.x *= Math.max(0, 1 - friction * delta);
          p.vel.z *= Math.max(0, 1 - friction * delta);
          p.runAnimTime = 0;
        }

        // Jump & Double Jump
        if (jumpPressed) {
          p.jumpBuffer = 0.15; // buffer jump
        } else {
          p.jumpBuffer = Math.max(0, p.jumpBuffer - delta);
        }

        if (p.jumpBuffer > 0) {
          if (p.isGrounded || p.coyoteTimer > 0) {
            p.vel.y = 13.5;
            p.isGrounded = false;
            p.coyoteTimer = 0;
            p.jumpBuffer = 0;
            sounds.jump();
            spawnParticles(p.pos, new THREE.Color(0x00f3ff), 8, 2);
          } else if (p.canDoubleJump) {
            p.vel.y = 12.5;
            p.canDoubleJump = false;
            p.jumpBuffer = 0;
            sounds.jump();
            spawnParticles(p.pos, new THREE.Color(0xff00bb), 15, 3.5);
          }
        }

        // Air Dash / Speed Dash
        if (p.dashCooldown > 0) {
          p.dashCooldown -= delta;
          if (p.dashCooldown <= 0) setDashAvailable(true);
        }

        if (dashPressed && p.dashCooldown <= 0) {
          p.dashCooldown = 1.2;
          setDashAvailable(false);
          sounds.dash();

          // Forward thrust
          const dashSpeed = 22;
          const dirZ = moveZ !== 0 ? moveZ : 1;
          const dirX = moveX;
          p.vel.x = dirX * dashSpeed;
          p.vel.z = dirZ * dashSpeed;
          p.vel.y = Math.max(p.vel.y, 4);

          spawnParticles(p.pos, new THREE.Color(0xffaa00), 25, 6);
        }

        // Speed boost timer
        if (p.speedBoostTimer > 0) {
          p.speedBoostTimer -= delta;
          if (p.speedBoostTimer <= 0) setIsSpeedBoosted(false);
        }

        // Gravity
        p.vel.y -= 32 * delta;

        // Apply velocities
        p.pos.x += p.vel.x * delta;
        p.pos.y += p.vel.y * delta;
        p.pos.z += p.vel.z * delta;

        // Platforms collision & updates
        let landed = false;
        let groundY = -999;

        const playerBBox = new THREE.Box3(
          new THREE.Vector3(p.pos.x - p.radius, p.pos.y, p.pos.z - p.radius),
          new THREE.Vector3(p.pos.x + p.radius, p.pos.y + p.height, p.pos.z + p.radius)
        );

        for (const plat of platformsRef.current) {
          // Update moving platforms with real matrix updates & delta tracking
          if (plat.type === 'moving' && plat.initialPos && plat.moveAxis && plat.moveRange && plat.moveSpeed) {
            if (!plat.prevPos) plat.prevPos = plat.mesh.position.clone();
            plat.prevPos.copy(plat.mesh.position);

            const t = elapsedTime * plat.moveSpeed;
            const offset = Math.sin(t) * plat.moveRange;
            if (plat.moveAxis === 'x') plat.mesh.position.x = plat.initialPos.x + offset;
            if (plat.moveAxis === 'y') plat.mesh.position.y = plat.initialPos.y + offset;
            if (plat.moveAxis === 'z') plat.mesh.position.z = plat.initialPos.z + offset;

            // CRITICAL: Update matrix world so children and bbox reflect exact position!
            plat.mesh.updateMatrixWorld(true);
            plat.bbox.setFromObject(plat.mesh);

            if (!plat.deltaPos) plat.deltaPos = new THREE.Vector3();
            plat.deltaPos.subVectors(plat.mesh.position, plat.prevPos);
          }

          // Update crumbling platforms
          if (plat.type === 'crumble' && plat.isCrumbling && !plat.isFallen) {
            plat.crumbleTimer = (plat.crumbleTimer || 0) + delta;
            // Shake visual
            plat.mesh.position.x += (Math.random() - 0.5) * 0.08;
            if (plat.crumbleTimer > 0.85) {
              plat.isFallen = true;
              plat.mesh.visible = false;
              // Respawn after 3.5s
              setTimeout(() => {
                plat.isFallen = false;
                plat.isCrumbling = false;
                plat.crumbleTimer = 0;
                plat.mesh.visible = true;
                if (plat.initialPos) plat.mesh.position.copy(plat.initialPos);
                plat.mesh.updateMatrixWorld(true);
                plat.bbox.setFromObject(plat.mesh);
              }, 3500);
            }
          }

          if (plat.isFallen) continue;

          // 1. BOUNCE PADS ("SPRING DINGENS"): Ultra-reliable trigger zone from top and sides
          if (plat.type === 'bounce') {
            const margin = 0.5;
            const inBounceX = p.pos.x + p.radius >= plat.bbox.min.x - margin && p.pos.x - p.radius <= plat.bbox.max.x + margin;
            const inBounceZ = p.pos.z + p.radius >= plat.bbox.min.z - margin && p.pos.z - p.radius <= plat.bbox.max.z + margin;
            const platTop = plat.bbox.max.y;
            const platBottom = plat.bbox.min.y;

            // Trigger bounce if player lands on or contacts spring pad
            if (inBounceX && inBounceZ && p.pos.y >= platBottom - 0.6 && p.pos.y <= platTop + 1.2) {
              p.pos.y = platTop;
              p.vel.y = 26; // High launch arc!
              // Impart forward thrust along Z if moving forward or stationary so player reaches next rooftop
              p.vel.z = Math.max(p.vel.z, 14);
              p.canDoubleJump = true;
              landed = false; // Player is launched in the air!
              sounds.bounce();
              spawnParticles(new THREE.Vector3(plat.mesh.position.x, platTop + 0.3, plat.mesh.position.z), new THREE.Color(0xff00bb), 30, 6);

              // Spring squash-and-stretch visual
              plat.mesh.scale.set(1.15, 0.45, 1.15);
              setTimeout(() => {
                if (plat.mesh) plat.mesh.scale.set(1, 1, 1);
              }, 180);
              continue;
            }
          }

          // 2. NORMAL, MOVING, CRUMBLE, AND SPEED PLATFORMS
          const platTop = plat.bbox.max.y;
          const inBoundsX = p.pos.x + p.radius >= plat.bbox.min.x && p.pos.x - p.radius <= plat.bbox.max.x;
          const inBoundsZ = p.pos.z + p.radius >= plat.bbox.min.z && p.pos.z - p.radius <= plat.bbox.max.z;

          // Top landing detection
          if (inBoundsX && inBoundsZ && p.vel.y <= 3.0 && p.pos.y >= platTop - 0.9 && p.pos.y <= platTop + 0.7) {
            p.pos.y = platTop;
            p.vel.y = 0;
            landed = true;
            groundY = Math.max(groundY, platTop);

            // CARRY PLAYER WITH MOVING PLATFORM
            if (plat.type === 'moving' && plat.deltaPos) {
              p.pos.x += plat.deltaPos.x;
              p.pos.y += plat.deltaPos.y;
              p.pos.z += plat.deltaPos.z;
            }

            if (plat.type === 'speed') {
              p.speedBoostTimer = 2.5;
              setIsSpeedBoosted(true);
              sounds.dash();
              spawnParticles(p.pos, new THREE.Color(0xffdd00), 20, 5);
            } else if (plat.type === 'crumble' && !plat.isCrumbling) {
              plat.isCrumbling = true;
              plat.crumbleTimer = 0;
            }
          } else if (playerBBox.intersectsBox(plat.bbox)) {
            // Side wall collision: block player from phasing through solid platform walls
            const overlapX1 = (p.pos.x + p.radius) - plat.bbox.min.x;
            const overlapX2 = plat.bbox.max.x - (p.pos.x - p.radius);
            const overlapZ1 = (p.pos.z + p.radius) - plat.bbox.min.z;
            const overlapZ2 = plat.bbox.max.z - (p.pos.z - p.radius);

            const minOverlapX = Math.min(overlapX1, overlapX2);
            const minOverlapZ = Math.min(overlapZ1, overlapZ2);

            if (minOverlapX < minOverlapZ) {
              if (overlapX1 < overlapX2) {
                p.pos.x = plat.bbox.min.x - p.radius - 0.02;
                p.vel.x = Math.min(0, p.vel.x);
              } else {
                p.pos.x = plat.bbox.max.x + p.radius + 0.02;
                p.vel.x = Math.max(0, p.vel.x);
              }
            } else {
              if (overlapZ1 < overlapZ2) {
                p.pos.z = plat.bbox.min.z - p.radius - 0.02;
                p.vel.z = Math.min(0, p.vel.z);
              } else {
                p.pos.z = plat.bbox.max.z + p.radius + 0.02;
                p.vel.z = Math.max(0, p.vel.z);
              }
            }
          }
        }

        p.isGrounded = landed;
        if (landed) {
          p.canDoubleJump = true;
          p.coyoteTimer = 0.12;
        } else {
          p.coyoteTimer = Math.max(0, p.coyoteTimer - delta);
        }

        // Void Falling Check
        if (p.pos.y < -12) {
          respawnPlayer();
        }

        // Collectibles check
        for (const crystal of crystalsRef.current) {
          if (!crystal.collected) {
            crystal.mesh.rotation.y += delta * 3;
            crystal.mesh.rotation.x += delta * 1.5;

            if (p.pos.distanceTo(crystal.pos) < 1.4) {
              crystal.collected = true;
              crystal.mesh.visible = false;
              setCrystals(c => c + 1);
              setScore(s => s + 100);
              sounds.coin();
              spawnParticles(crystal.pos, new THREE.Color(0x00f3ff), 20, 4);
            }
          }
        }

        // Checkpoints
        for (const cp of checkpointsRef.current) {
          if (!cp.activated && p.pos.distanceTo(cp.pos) < 2.2) {
            cp.activated = true;
            p.lastCheckpoint.copy(cp.pos).add(new THREE.Vector3(0, 1.5, 0));
            setCurrentCheckpointIndex(cp.index);
            sounds.checkpoint();
            spawnParticles(cp.pos, new THREE.Color(0x00ff88), 35, 5);

            // Change ring color to green
            const ring = cp.mesh.children[2] as THREE.Mesh;
            if (ring && ring.material) {
              (ring.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88);
            }
          }
        }

        // Hazard Lasers
        for (const laser of lasersRef.current) {
          laser.mesh.rotation.y += delta * laser.rotationSpeed;
          // Simple proximity damage/knockback check
          if (p.pos.distanceTo(laser.center) < laser.length / 2 + 0.5 && Math.abs(p.pos.y - laser.center.y) < 1.2) {
            // Laser hit!
            sounds.fall();
            p.vel.y = 8;
            p.vel.z -= 10;
            spawnParticles(p.pos, new THREE.Color(0xff0044), 25, 4);
          }
        }

        // Finish Portal Check
        if (finishPortalRef.current && p.pos.distanceTo(finishPortalRef.current.position) < 2.5) {
          sounds.victory();
          setGameState('won');
          const finalScore = score + Math.max(0, Math.floor(1000 - timer * 10)) + crystals * 50;
          setScore(finalScore);
          saveScoreRecord(finalScore);
        }

        // Endless mode procedural generation & cleanup
        if (gameMode === 'endless') {
          setScore(Math.floor(p.pos.z * 5 + crystals * 100));
          if (p.pos.z > endlessCursorZ.current - 90) {
            appendEndlessPlatform(scene);
          }
          // Remove old platforms behind
          if (platformsRef.current.length > 50) {
            const old = platformsRef.current.shift();
            if (old) scene.remove(old.mesh);
          }
        }

        // Update 3D Character Mesh & Limbs Animation
        p.group.position.copy(p.pos);
        p.group.rotation.y = p.yaw;

        // Running swing
        if (p.isGrounded && (moveX !== 0 || moveZ !== 0)) {
          const swing = Math.sin(p.runAnimTime) * 0.4;
          p.bodyParts.leftLeg.rotation.x = swing;
          p.bodyParts.rightLeg.rotation.x = -swing;
          p.bodyParts.leftArm.rotation.x = -swing * 0.8;
          p.bodyParts.rightArm.rotation.x = swing * 0.8;
        } else if (!p.isGrounded) {
          // Jump pose
          p.bodyParts.leftLeg.rotation.x = 0.3;
          p.bodyParts.rightLeg.rotation.x = 0.5;
          p.bodyParts.leftArm.rotation.x = -0.5;
          p.bodyParts.rightArm.rotation.x = -0.5;
        } else {
          p.bodyParts.leftLeg.rotation.x = 0;
          p.bodyParts.rightLeg.rotation.x = 0;
          p.bodyParts.leftArm.rotation.x = 0;
          p.bodyParts.rightArm.rotation.x = 0;
        }

        // Shadow update
        if (groundY > -900) {
          p.shadowMesh.position.set(p.pos.x, groundY + 0.05, p.pos.z);
          p.shadowMesh.visible = true;
          const heightDiff = p.pos.y - groundY;
          const shadowScale = Math.max(0.2, 1 - heightDiff * 0.15);
          p.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
        } else {
          p.shadowMesh.visible = false;
        }
      }

      // Update Camera (Runs in ALL game states so the 3D scene is ALWAYS visible and focused!)
      if (cameraRef.current) {
        if (cameraModeRef.current === 'third') {
          p.group.visible = true;
          const camOffset = new THREE.Vector3(0, 3.2, -6.5);
          const targetCamPos = p.pos.clone().add(camOffset);
          cameraRef.current.position.lerp(targetCamPos, isPlaying ? 0.15 : 0.08);
          cameraRef.current.lookAt(p.pos.x, p.pos.y + 1.2, p.pos.z + 5);
        } else {
          // First-person mode
          p.group.visible = false;
          cameraRef.current.position.set(p.pos.x, p.pos.y + 1.4, p.pos.z + 0.2);
          cameraRef.current.lookAt(p.pos.x, p.pos.y + 1.4, p.pos.z + 10);
        }
      }

      // Update particle effects
      const pData = particleData.current;
      for (let i = 0; i < 100; i++) {
        if (pData.life[i] > 0) {
          pData.life[i] -= delta * 1.8;
          pData.pos[i * 3] += pData.vel[i * 3] * delta;
          pData.pos[i * 3 + 1] += pData.vel[i * 3 + 1] * delta;
          pData.pos[i * 3 + 2] += pData.vel[i * 3 + 2] * delta;
        } else {
          pData.pos[i * 3 + 1] = -999;
        }
      }
      if (particlesRef.current) {
        particlesRef.current.geo.attributes.position.needsUpdate = true;
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      resizeObserver.disconnect();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []); // Initialized ONCE on mount so state changes never destroy the WebGL canvas

  // Start / Restart game
  const startGame = (lvl: number, mode: 'campaign' | 'endless' = 'campaign') => {
    setLevel(lvl);
    setGameMode(mode);
    gameModeRef.current = mode;
    setScore(0);
    setCrystals(0);
    setTimer(0);
    setGameState('playing');
    gameStateRef.current = 'playing';
    setShowLevelIntro(true);
    if (sceneRef.current) {
      loadLevel(lvl, sceneRef.current, mode);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070914] text-white select-none overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        {/* Left: Back & Level details */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Arcade</span>
          </button>

          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-cyan-400 uppercase">
              {gameMode === 'endless' ? 'Eindeloos' : `Level ${level}`}
            </span>
          </div>

          {/* Quick Level Switchers */}
          <div className="hidden md:flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => startGame(1, 'campaign')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${gameMode === 'campaign' && level === 1 ? 'bg-cyan-500 text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Lvl 1
            </button>
            <button
              onClick={() => startGame(2, 'campaign')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${gameMode === 'campaign' && level === 2 ? 'bg-cyan-500 text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Lvl 2
            </button>
            <button
              onClick={() => startGame(3, 'campaign')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${gameMode === 'campaign' && level === 3 ? 'bg-cyan-500 text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Lvl 3
            </button>
            <button
              onClick={() => startGame(1, 'endless')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${gameMode === 'endless' ? 'bg-amber-400 text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              ∞ Eindeloos
            </button>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
          {/* Crystals */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-mono">
            <span className="text-cyan-400">💎</span>
            <span className="font-bold text-white">
              {crystals}
              {gameMode === 'campaign' && ` / ${totalCrystalsInLevel}`}
            </span>
          </div>

          {/* Stopwatch / Timer */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
            <span className="text-yellow-400">⏱️</span>
            <span className="font-bold text-white">{timer.toFixed(1)}s</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-bold text-yellow-400">{score}</span>
          </div>
        </div>

        {/* Right: Camera Toggle, Sound & Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Speed Boost Badge */}
          {isSpeedBoosted && (
            <span className="hidden sm:flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono animate-bounce">
              <Zap className="w-3 h-3" /> BOOST!
            </span>
          )}

          {/* Dash Ready Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black font-mono uppercase border transition-all ${
              dashAvailable
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            <Zap className="w-3 h-3" /> {dashAvailable ? 'DASH KLAAR' : 'OPLADEN...'}
          </div>

          {/* Restart Button */}
          <button
            onClick={() => respawnPlayer()}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Herstart vanaf checkpoint (R)"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline text-[11px] font-bold">R</span>
          </button>

          {/* Camera View Mode */}
          <button
            onClick={() => setCameraMode(c => (c === 'third' ? 'first' : 'third'))}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all cursor-pointer"
            title={`Camera wisselen (C): ${cameraMode === 'third' ? '3rd Person' : '1st Person'}`}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Sound Mute */}
          <button
            onClick={() => {
              sounds.enabled = soundMuted;
              setSoundMuted(!soundMuted);
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all cursor-pointer"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowHelp(h => !h)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Pause */}
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Start / Lobby Screen */}
      {gameState === 'lobby' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-[#0d1224] border border-cyan-500/30 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/25">
              🏃‍♂️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-primary">
              Cyber Parkour 3D
            </h2>
            <p className="text-xs text-cyan-200/70 mt-2 font-medium">
              Ren, spring en stuiter over de neon daken van de FTJM Cyber Metropool in volle 3D!
            </p>

            {highScore > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-yellow-400 font-mono">
                <Trophy className="w-3.5 h-3.5" /> High Score: {highScore}
              </div>
            )}

            {/* Level Selection */}
            <div className="mt-6 space-y-2 text-left font-mono">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block px-1">Kies Level:</span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => startGame(lvl, 'campaign')}
                    className="p-3 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black text-white group-hover:text-cyan-400">LVL {lvl}</span>
                    <span className="text-[9px] text-white/40">
                      {lvl === 1 ? 'Daken' : lvl === 2 ? 'Hoogtes' : 'Abyss'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Endless Mode Button */}
              <button
                onClick={() => startGame(1, 'endless')}
                className="w-full mt-2 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 rounded-xl flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-black text-white group-hover:text-pink-300">Eindeloze Modus</span>
                </div>
                <span className="text-[10px] text-pink-400 font-bold">PROCEDURAAL →</span>
              </button>
            </div>

            {/* Controls Guide */}
            <div className="mt-6 p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] text-white/60 text-left font-mono space-y-1">
              <p className="font-bold text-white/80">Besturing:</p>
              <p>• <span className="text-cyan-400">WASD / Pijltjes</span> = Bewegen & Rennen</p>
              <p>• <span className="text-cyan-400">Spatie</span> = Springen & Dubbele Sprong</p>
              <p>• <span className="text-cyan-400">Shift</span> = Air Dash / Sprint</p>
              <p>• <span className="text-cyan-400">C</span> = Wissel 1st/3rd Person Camera</p>
              <p>• <span className="text-cyan-400">R</span> = Herstart vanaf Checkpoint</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Paused Screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full bg-[#0d1224] border border-white/10 rounded-[2rem] p-6 text-center shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Spel Gepauzeerd</h3>
            <div className="space-y-2">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Verder Spelen
              </button>
              <button
                onClick={() => respawnPlayer()}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Herstart Checkpoint (R)
              </button>
              <button
                onClick={() => setGameState('lobby')}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Hoofdmenu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Victory / Level Won Screen */}
      {gameState === 'won' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-[#0d1224] border border-yellow-500/40 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] relative overflow-hidden"
          >
            <div className="w-16 h-16 mx-auto mb-3 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl flex items-center justify-center text-3xl">
              🏆
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Level Voltooid!</h2>
            <p className="text-xs text-yellow-400/80 font-mono mt-1 font-bold">Geweldige parkour run!</p>

            {/* Score Breakdown */}
            <div className="my-6 p-4 bg-black/50 border border-white/10 rounded-2xl space-y-2 font-mono text-xs text-left">
              <div className="flex justify-between">
                <span className="text-white/60">Tijd:</span>
                <span className="font-bold text-white">{timer.toFixed(2)} seconden</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Verzamelde Diamanten:</span>
                <span className="font-bold text-cyan-400">
                  {crystals} / {totalCrystalsInLevel} (+{crystals * 50})
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="font-black text-yellow-400">TOTALE SCORE:</span>
                <span className="font-black text-yellow-400">{score}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2.5">
              {level < 3 && gameMode === 'campaign' && (
                <button
                  onClick={() => startGame(level + 1, 'campaign')}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
                >
                  Volgend Level (Level {level + 1}) <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {onShareHighScoreOpen && score > 0 && (
                <button
                  onClick={() => onShareHighScoreOpen('parkour3d', score)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Share2 className="w-4 h-4" /> Deel Score in Chat
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startGame(level, gameMode)}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Opnieuw
                </button>
                <button
                  onClick={() => setGameState('lobby')}
                  className="py-3 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Menu
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="max-w-md w-full bg-[#0d1224] border border-cyan-500/30 rounded-[2rem] p-6 text-left shadow-2xl relative font-mono text-xs">
            <h3 className="text-base font-black text-cyan-400 uppercase tracking-tight mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Parkour Handleiding
            </h3>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-xl">🦘</span>
                <div>
                  <p className="font-bold text-white">Dubbele Sprong & Coyote Time</p>
                  <p className="text-[11px] text-white/60">Druk een tweede keer op Spatie in de lucht voor een extra sprong!</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="font-bold text-white">Air Dash (Shift)</p>
                  <p className="text-[11px] text-white/60">Gebruik Shift om horizontaal vooruit te schieten over grote ravijnen.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xl">🟣</span>
                <div>
                  <p className="font-bold text-white">Bounce Pads (Roze Ringen)</p>
                  <p className="text-[11px] text-white/60">Lanceert je hoog in de lucht om torenhoge daken te bereiken.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xl">🟧</span>
                <div>
                  <p className="font-bold text-white">Afbrokkelende Tegels (Oranje)</p>
                  <p className="text-[11px] text-white/60">Blijf niet stilstaan! Deze blokken storten na een fractie van een seconde in.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-cyan-400 transition-all text-xs"
            >
              Begrepen!
            </button>
          </div>
        </div>
      )}

      {/* Mobile Touch Virtual Controls */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex justify-between items-end pointer-events-none md:hidden">
        {/* Virtual D-Pad */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 grid grid-cols-3 gap-1">
          <div />
          <button
            onTouchStart={() => { touchControls.current.forward = true; }}
            onTouchEnd={() => { touchControls.current.forward = false; }}
            className="w-12 h-12 bg-white/10 active:bg-cyan-500/50 rounded-xl flex items-center justify-center text-lg font-bold"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={() => { touchControls.current.left = true; }}
            onTouchEnd={() => { touchControls.current.left = false; }}
            className="w-12 h-12 bg-white/10 active:bg-cyan-500/50 rounded-xl flex items-center justify-center text-lg font-bold"
          >
            ◀
          </button>
          <button
            onTouchStart={() => { touchControls.current.backward = true; }}
            onTouchEnd={() => { touchControls.current.backward = false; }}
            className="w-12 h-12 bg-white/10 active:bg-cyan-500/50 rounded-xl flex items-center justify-center text-lg font-bold"
          >
            ▼
          </button>
          <button
            onTouchStart={() => { touchControls.current.right = true; }}
            onTouchEnd={() => { touchControls.current.right = false; }}
            className="w-12 h-12 bg-white/10 active:bg-cyan-500/50 rounded-xl flex items-center justify-center text-lg font-bold"
          >
            ▶
          </button>
        </div>

        {/* Action Buttons: Jump & Dash */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Dash button */}
          <button
            onTouchStart={() => { touchControls.current.dash = true; }}
            onTouchEnd={() => { touchControls.current.dash = false; }}
            className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-400 active:scale-90 text-black rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-yellow-500/20"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[9px] font-black">DASH</span>
          </button>

          {/* Jump button */}
          <button
            onTouchStart={() => { touchControls.current.jump = true; }}
            onTouchEnd={() => { touchControls.current.jump = false; }}
            className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-500 active:scale-90 text-black rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-cyan-500/30"
          >
            <span className="text-xl">🦘</span>
            <span className="text-[9px] font-black">SPRONG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
