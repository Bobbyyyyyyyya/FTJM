import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Share2, 
  Zap, 
  Award, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Info,
  CheckCircle2,
  Lock,
  ChevronRight,
  Maximize2,
  Minimize2,
  CloudUpload,
  ArrowUpCircle,
  Heart,
  Moon,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Mitten, 
  AscensionUpgrade, 
  INITIAL_ASCENSION_UPGRADES, 
  syncMittensList, 
  calculateKittyPointsForTreats,
  getMittenUpgradeCost,
  getMittenTpsBonus,
  getAscensionMinTreats,
  getAscensionTierLabel
} from './catclicker/catClickerData';
import { AscensionModal } from './catclicker/AscensionModal';
import { MittensList } from './catclicker/MittensList';
import { CatClickerStage } from './catclicker/CatClickerStage';
import { PantheonView, PantheonSlots, PANTHEON_SPIRITS } from './catclicker/PantheonView';
import { GrimoireView, MEOW_SPELLS, MeowSpell } from './catclicker/GrimoireView';
import { Upgrade, INITIAL_UPGRADES } from './catclicker/expandedUpgrades';
import { t } from '../utils/translations';

// Sound Synthesizer for Cat Clicker using Web Audio API
class CatAudioSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private secondaryMeowAudio: HTMLAudioElement[] = [];
  private secondaryMeowIndex: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      for (let i = 0; i < 10; i++) {
        const audio = new Audio('/audio/Secondary Meow - QuickSounds.com.mp3');
        audio.volume = 0.6;
        this.secondaryMeowAudio.push(audio);
      }
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSecondaryMeow() {
    if (!this.enabled) return;
    try {
      const audio = this.secondaryMeowAudio[this.secondaryMeowIndex];
      audio.currentTime = 0;
      audio.play().catch(() => {});
      this.secondaryMeowIndex = (this.secondaryMeowIndex + 1) % this.secondaryMeowAudio.length;
    } catch {}
  }

  // Cute Cat Meow sound synthesis
  playMeow(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Formant-like filter for feline voice
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.12);
      filter.frequency.linearRampToValueAtTime(600, now + 0.3);
      filter.Q.value = 3.0;

      // Pitch glide: starts low, swoops up, drifts down
      const baseFreq = 420 * pitchMultiplier;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 0.8, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.32);

      // Volume envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // Soft purr sound
  playPurr() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(65, now + 0.25);

      // Amplitude flutter
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 24; // purr frequency
      lfoGain.gain.value = 0.06;

      lfo.connect(lfoGain.gain);
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Crunch / Eat biscuit click
  playCrunch() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // Purchase / Cash chime
  playBuy() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const notes = [659.25, 987.77]; // E5, B5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.07, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } catch {}
  }

  // Golden Yarn / Special Event Sparkle
  playSparkle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch {}
  }

  // Heavenly Ascension Chord Arpeggio
  playAscension() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5 to C7 arpeggio
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch {}
  }

  // Mystical Spell Casting Sound
  playSpellCast() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const freqs = [587.33, 739.99, 880.00, 1174.66]; // D5 major harmonic
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.38);
      });
    } catch {}
  }
}

const catAudio = new CatAudioSynthesizer();

// Building Definition Interface
interface Building {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseTps: number; // Treats Per Second
  count: number;
  description: string;
  requiresAscensionUpgrade?: string;
  isAscensionExclusive?: boolean;
}

// Achievement Definition Interface
interface Achievement {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  condition: (stats: GameStats, treats: number, buildings: Building[], upgrades?: Upgrade[], mittens?: Mitten[]) => boolean;
}

interface GameStats {
  allTimeTreats: number;
  runTreats?: number;
  totalClicks: number;
  goldenYarnCaught: number;
  rainbowYarnCaught?: number;
  startTime: number;
  ascensionCount: number;
  totalKittyPoints: number;
  mysticMiceCaught: number;
  cosmicCarpsCaught?: number;
  pantheonSlotsFilled?: number;
  spellsCast?: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface MysticMouse {
  id: number;
  y: number;
  direction: 'left' | 'right';
  expiresAt: number;
}

interface CosmicCarp {
  id: number;
  y: number;
  direction: 'left' | 'right';
  expiresAt: number;
}

interface GoldenYarn {
  id: number;
  x: number;
  y: number;
  type: 'frenzy' | 'lucky' | 'click_frenzy' | 'rainbow';
  expiresAt: number;
}

interface CatClickerGameProps {
  onBack: () => void;
  isFullscreen?: boolean;
  userProfile?: any;
  onSaveHighScore?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout' | 'catclicker', score: number) => Promise<void>;
  onShareHighScoreOpen?: (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout' | 'catclicker', score: number) => void;
}

// Initial Buildings Data
const INITIAL_BUILDINGS: Building[] = [
  { id: 'kitten', name: 'Kattenpootjes', emoji: '🐾', baseCost: 15, baseTps: 0.5, count: 0, description: 'Lieve kattenpootjes die in draaiende ringen rond de kat automatisch brokjes aantikken.' },
  { id: 'scratching_post', name: 'Krabpaal Luxe', emoji: '🪵', baseCost: 100, baseTps: 4, count: 0, description: 'Scherpe nagels schrapen continu brokjes los.' },
  { id: 'catnip_garden', name: 'Kattenkruid Tuin', emoji: '🌿', baseCost: 1100, baseTps: 32, count: 0, description: 'Verse catnip zorgt voor dolblije, hyperactieve katten!' },
  { id: 'milk_bar', name: 'Romige Melk Bar', emoji: '🥛', baseCost: 12000, baseTps: 180, count: 0, description: 'Luxe schoteltjes warme melk stimuleren de brokjesproductie.' },
  { id: 'kibble_factory', name: 'Visbrokjes Fabriek', emoji: '🏭', baseCost: 130000, baseTps: 950, count: 0, description: 'Geautomatiseerde lopende banden vol zalmkoekjes.' },
  { id: 'laser_robot', name: 'Laser Pointer Bot', emoji: '🔴', baseCost: 1400000, baseTps: 5200, count: 0, description: 'Rode laserstippen houden legioenen katten in volle sprint.' },
  { id: 'cat_vlogger', name: 'MeowTube Vlogger', emoji: '🎥', baseCost: 15000000, baseTps: 65000, count: 0, description: 'Beroemde kattenvloggers die gesponsorde brokjes binnenharken.' },
  { id: 'cat_temple', name: 'Katten Tempel', emoji: '🏛️', baseCost: 200000000, baseTps: 1250000, count: 0, description: 'Oud-Egyptische heiligdommen gewijd aan de Heilige Kat.' },
  { id: 'fish_mine', name: 'Gouden Vismijn', emoji: '⛏️', baseCost: 3300000000, baseTps: 4200000, count: 0, description: 'Diepe mijnen waar katten gouden vissen opgraven.' },
  { id: 'space_station', name: 'Kosmisch Kattenstation', emoji: '🚀', baseCost: 51000000000, baseTps: 23000000, count: 0, description: 'Astronaut-katten oogsten brokjes uit stellaire visnevels.' },
  { id: 'alien_cat', name: 'Buitenaardse Kat', emoji: '👽', baseCost: 750000000000, baseTps: 150000000, count: 0, description: 'Katten van planeet Meow-9 brengen oneindig veel brokjes.' },
  { id: 'dimension_portal', name: 'Meow Dimensieportaal', emoji: '🌌', baseCost: 12000000000000, baseTps: 950000000, count: 0, description: 'Opent portalen naar oneindige dimensies van spinnende katten.' },
  { id: 'ai_server', name: 'Meow A.I. Server', emoji: '🖥️', baseCost: 180000000000000, baseTps: 8000000000, count: 0, description: 'Artificiële Intelligentie die de ultieme brokjesformule berekent.' },
  { id: 'time_machine', name: 'Tijdreizende Kattenmachine', emoji: '⏳', baseCost: 999000000000000, baseTps: 50000000000, count: 0, description: 'Haalt miljoenen brokjes rechtstreeks uit het verre kattentoekomst.' },
  { id: 'antimatter_laser', name: 'Antimaterie Kattenstraler', emoji: '⚛️', baseCost: 15000000000000000, baseTps: 3000000000000, count: 0, description: 'Zet pure antimaterie om in oneindige stromen van knapperige brokjes.' },
  { id: 'rainbow_prism', name: 'Prismatische Regenboog Kat', emoji: '🌈', baseCost: 300000000000000000, baseTps: 180000000000000, count: 0, description: 'Breking van puur kattengeluk in alle kleuren van het spectrum.' },
  { id: 'chancemaker_cat', name: 'Maneki-Neko Fortuinkat', emoji: '🧧', baseCost: 7500000000000000000, baseTps: 10000000000000000, count: 0, description: 'Zwaait onophoudelijk met haar gouden poot en creëert brokjes uit pure waarschijnlijkheid.' },
  { id: 'fractal_cat', name: 'Fractale Katten Generator', emoji: '🌀', baseCost: 200000000000000000000, baseTps: 650000000000000000, count: 0, description: 'Katten gemaakt van kleinere katten, die nog kleinere katten bevatten. Oneindige brokjes-recursie.' },
  { id: 'multiverse_nexus', name: 'Kosmisch Katten Multiversum', emoji: '🌐', baseCost: 6000000000000000000000, baseTps: 45000000000000000000, count: 0, description: 'Verbindt ontelbare parallelle kattenwerelden tot één gigantisch brokjesnetwerk.' },
  { id: 'cortex_cat', name: 'Alwetend Kattenbrein', emoji: '🧠', baseCost: 250000000000000000000000, baseTps: 3200000000000000000000, count: 0, description: 'Een gigantisch superintelligent kosmisch brein dat de brokjesrealiteit herschrijft.' },
  { id: 'supreme_cat_god', name: 'De Opperste Katten God', emoji: '👑', baseCost: 10000000000000000000000000, baseTps: 250000000000000000000000, count: 0, description: 'De schepper van alle brokjes in het universum. Een enkele knipoog vult hele melkwegstelsels met zalm.' },
  // --- Hemelse Heiligdommen (Ascension Exclusive Gebouwen) ---
  { 
    id: 'celestial_cathedral', 
    name: 'Hemelse Kathedraal', 
    emoji: '⛪', 
    baseCost: 25000000000, // 25 Miljard
    baseTps: 8500000000,   // 8.5 Miljard / sec
    count: 0, 
    description: 'Een majestueuze gouden kathedraal badend in eeuwig engelenlicht. Koor van engelenkatten produceert miljarden brokjes!',
    requiresAscensionUpgrade: 'unlock_cathedral',
    isAscensionExclusive: true
  },
  { 
    id: 'seraphim_galaxy', 
    name: 'Seraphim Melkweg Fontein', 
    emoji: '🌌', 
    baseCost: 500000000000000, // 500 Biljoen
    baseTps: 120000000000000,  // 120 Biljoen / sec
    count: 0, 
    description: 'Een kosmische spiraal van zuivere hemelse melk die miljoenen spinnende engelenkatten voedt met oneindige brokjes.',
    requiresAscensionUpgrade: 'unlock_seraphim_galaxy',
    isAscensionExclusive: true
  },
  { 
    id: 'archangel_throne', 
    name: 'Aartsengel Katten Troon', 
    emoji: '🪽', 
    baseCost: 15000000000000000, // 15 Biljard
    baseTps: 4500000000000000,   // 4.5 Biljard / sec
    count: 0, 
    description: 'De troon der Allerheiligste Katten, omringd door gouden leeuwen en eeuwige stralen van goddelijke brokjes.',
    requiresAscensionUpgrade: 'unlock_archangel_throne',
    isAscensionExclusive: true
  }
];

// Initial Achievements (Expanded Trophy Collection)
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // 1. Clicks Milestones
  { id: 'first_click', title: 'Eerste Pootje', emoji: '🐾', description: 'Klik 1 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 1 },
  { id: 'clicks_50', title: 'Speelse Klauwtjes', emoji: '🐈', description: 'Klik 50 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 50 },
  { id: 'clicks_100', title: 'Snelle Aai', emoji: '⚡', description: 'Klik 100 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 100 },
  { id: 'clicks_500', title: 'Aai Kampioen', emoji: '😻', description: 'Klik 500 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 500 },
  { id: 'clicks_1000', title: 'Spinnend Geweld', emoji: '🌀', description: 'Klik 1.000 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 1000 },
  { id: 'clicks_2500', title: 'Poot van Staal', emoji: '🥊', description: 'Klik 2.500 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 2500 },
  { id: 'clicks_5000', title: 'Klik Maestro', emoji: '🎹', description: 'Klik 5.000 keer op de kat.', unlocked: false, condition: (s) => s.totalClicks >= 5000 },
  { id: 'clicks_10000', title: 'Klik Legende', emoji: '🌟', description: 'Klik 10.000 keer op de kat!', unlocked: false, condition: (s) => s.totalClicks >= 10000 },
  { id: 'clicks_25000', title: 'Snelle Klauwtjes Meester', emoji: '🌪️', description: 'Klik 25.000 keer op de kat!', unlocked: false, condition: (s) => s.totalClicks >= 25000 },
  { id: 'clicks_50000', title: 'Onuitputtelijke Aai', emoji: '👑', description: 'Klik 50.000 keer op de kat!', unlocked: false, condition: (s) => s.totalClicks >= 50000 },

  // 2. Treats Milestones
  { id: 'treats_100', title: 'Brokjes Starter', emoji: '🍪', description: 'Verzamel 100 kattenbrokjes in totaal.', unlocked: false, condition: (s) => s.allTimeTreats >= 100 },
  { id: 'treats_1k', title: 'Brokjes Smikkel', emoji: '😋', description: 'Verzamel 1.000 kattenbrokjes.', unlocked: false, condition: (s) => s.allTimeTreats >= 1000 },
  { id: 'treats_10k', title: 'Katten Fluisteraar', emoji: '🐱', description: 'Verzamel 10.000 kattenbrokjes.', unlocked: false, condition: (s) => s.allTimeTreats >= 10000 },
  { id: 'treats_50k', title: 'Katten Bakker', emoji: '🧑‍🍳', description: 'Verzamel 50.000 kattenbrokjes.', unlocked: false, condition: (s) => s.allTimeTreats >= 50000 },
  { id: 'treats_250k', title: 'Katten Pakhuis', emoji: '🏠', description: 'Verzamel 250.000 kattenbrokjes.', unlocked: false, condition: (s) => s.allTimeTreats >= 250000 },
  { id: 'treats_1m', title: 'Katten Miljonair', emoji: '💰', description: 'Verzamel 1.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 1000000 },
  { id: 'treats_10m', title: 'Katten Multimiljonair', emoji: '💎', description: 'Verzamel 10.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 10000000 },
  { id: 'treats_100m', title: 'Katten Keizer', emoji: '👑', description: 'Bereik 100.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 100000000 },
  { id: 'treats_1b', title: 'Katten Godheid', emoji: '🌌', description: 'Bereik 1.000.000.000 (1 Miljard) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 1000000000 },
  { id: 'treats_10b', title: 'Kosmische Kat', emoji: '🪐', description: 'Bereik 10.000.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 10000000000 },
  { id: 'treats_100b', title: 'Oneindige Oogst', emoji: '✨', description: 'Bereik 100.000.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 100000000000 },
  { id: 'treats_500b', title: 'Hemelse Berg Brokjes', emoji: '🏔️', description: 'Bereik 500.000.000.000 kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 500000000000 },
  { id: 'treats_1t', title: 'Katten Trillionair', emoji: '💸', description: 'Bereik 1.000.000.000.000 (1 Biljoen) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 1000000000000 },
  { id: 'treats_10t', title: 'Brokjes Zwart Gat', emoji: '🕳️', description: 'Bereik 10.000.000.000.000 (10 Biljoen) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 10000000000000 },
  { id: 'treats_100t', title: 'Multiversum Brokjes', emoji: '🌠', description: 'Bereik 100.000.000.000.000 (100 Biljoen) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 100000000000000 },
  
  // Ascension Achievements
  { id: 'ascend_1', title: 'Verlichting', emoji: '👼', description: 'Onderga je eerste Hemelvaart.', unlocked: false, condition: (s) => s.ascensionCount >= 1 },
  { id: 'ascend_5', title: 'Negen Levens', emoji: '✨', description: 'Onderga minstens 5 keer een Hemelvaart.', unlocked: false, condition: (s) => s.ascensionCount >= 5 },
  { id: 'ascend_10', title: 'Meester van Reïncarnatie', emoji: '🌟', description: 'Onderga minstens 10 keer een Hemelvaart.', unlocked: false, condition: (s) => s.ascensionCount >= 10 },
  { id: 'ascend_25', title: 'Goddelijke Katten Geest', emoji: '🔮', description: 'Onderga minstens 25 keer een Hemelvaart!', unlocked: false, condition: (s) => s.ascensionCount >= 25 },
  { id: 'kp_5', title: 'Kitty Points Verzamelaar', emoji: '💎', description: 'Verzamel in totaal minstens 5 Kitty Points.', unlocked: false, condition: (s) => (s.totalKittyPoints || 0) >= 5 },
  { id: 'kp_25', title: 'Hemelse Schatkamer', emoji: '🏛️', description: 'Verzamel in totaal minstens 25 Kitty Points.', unlocked: false, condition: (s) => (s.totalKittyPoints || 0) >= 25 },
  
  // Special Rare Event Achievements
  { id: 'mystic_mouse_1', title: 'De Mystieke Vangst', emoji: '🐭', description: 'Vang je allereerste Mystieke Muis.', unlocked: false, condition: (s) => (s.mysticMiceCaught || 0) >= 1 },
  { id: 'mystic_mouse_10', title: 'Muizenvanger', emoji: '🐁', description: 'Vang 10 Mystieke Muizen in totaal.', unlocked: false, condition: (s) => (s.mysticMiceCaught || 0) >= 10 },
  { id: 'mystic_mouse_25', title: 'Kat der Duizend Muizen', emoji: '🪤', description: 'Vang 25 Mystieke Muizen in totaal!', unlocked: false, condition: (s) => (s.mysticMiceCaught || 0) >= 25 },
  { id: 'golden_yarn_1', title: 'Gouden Poot', emoji: '🧶', description: 'Vang een Gouden Bol Wol.', unlocked: false, condition: (s) => s.goldenYarnCaught >= 1 },
  { id: 'golden_yarn_5', title: 'Meester Vanger', emoji: '🌟', description: 'Vang 5 Gouden Bollen Wol.', unlocked: false, condition: (s) => s.goldenYarnCaught >= 5 },
  { id: 'golden_yarn_15', title: 'Gouden Jager', emoji: '🏆', description: 'Vang 15 Gouden Bollen Wol!', unlocked: false, condition: (s) => s.goldenYarnCaught >= 15 },
  { id: 'golden_yarn_30', title: 'Wollen Tycoon', emoji: '💫', description: 'Vang 30 Gouden Bollen Wol!', unlocked: false, condition: (s) => s.goldenYarnCaught >= 30 },
  { id: 'rainbow_yarn_1', title: 'Regenboog Dromer', emoji: '🌈', description: 'Vang je eerste zeldzame Regenboog Bol Wol!', unlocked: false, condition: (s) => (s.rainbowYarnCaught || 0) >= 1 },
  { id: 'cosmic_carp_1', title: 'Kosmische Visser', emoji: '🐟', description: 'Vang een zwemmende Kosmische Gouden Karper!', unlocked: false, condition: (s) => (s.cosmicCarpsCaught || 0) >= 1 },
  { id: 'cosmic_carp_5', title: 'Heer der Zeeën', emoji: '🌊', description: 'Vang 5 Kosmische Gouden Karpers!', unlocked: false, condition: (s) => (s.cosmicCarpsCaught || 0) >= 5 },


  // 3. Buildings & Helpers Milestones
  { id: 'first_kitten', title: 'Kattenpootjes Vriend', emoji: '🐾', description: 'Koop je allereerste speelse kattenpootje.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kitten')?.count || 0) >= 1 },
  { id: 'kittens_10', title: 'Kattenpootjes Club', emoji: '🐾', description: 'Bezit minstens 10 kattenpootjes.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kitten')?.count || 0) >= 10 },
  { id: 'army_kittens', title: 'Kattenpootjes Leger', emoji: '😻', description: 'Bezit 25 kattenpootjes tegelijk.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kitten')?.count || 0) >= 25 },
  { id: 'kittens_50', title: 'Kattenpootjes Armada', emoji: '🚀', description: 'Bezit 50 kattenpootjes tegelijk.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kitten')?.count || 0) >= 50 },

  { id: 'first_scratch', title: 'Krabpaal Poot', emoji: '🪵', description: 'Koop je eerste Luxe Krabpaal.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'scratching_post')?.count || 0) >= 1 },
  { id: 'scratch_25', title: 'Krabparadijs', emoji: '🏰', description: 'Bezit 25 Luxe Krabpalen.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'scratching_post')?.count || 0) >= 25 },

  { id: 'catnip_starter', title: 'Groene Klauwtjes', emoji: '🌱', description: 'Plant je eerste Kattenkruid Tuin.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'catnip_garden')?.count || 0) >= 1 },
  { id: 'catnip_master', title: 'Catnip Koning', emoji: '🌿', description: 'Bezit minstens 10 kattenkruid tuinen.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'catnip_garden')?.count || 0) >= 10 },
  { id: 'catnip_50', title: 'Kruiden Magnifica', emoji: '🍃', description: 'Bezit 50 Kattenkruid Tuinen tegelijk.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'catnip_garden')?.count || 0) >= 50 },

  { id: 'milk_bar_1', title: 'Warme Melk', emoji: '🥛', description: 'Open je eerste Romige Melk Bar.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'milk_bar')?.count || 0) >= 1 },
  { id: 'milk_bar_15', title: 'Melk Walhalla', emoji: '🍶', description: 'Bezit 15 Romige Melk Bars.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'milk_bar')?.count || 0) >= 15 },

  { id: 'factory_1', title: 'Industriële Kat', emoji: '🏭', description: 'Bouw je eerste Visbrokjes Fabriek.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kibble_factory')?.count || 0) >= 1 },
  { id: 'factory_10', title: 'Zalm Lopende Band', emoji: '🍣', description: 'Bezit 10 Visbrokjes Fabrieken.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'kibble_factory')?.count || 0) >= 10 },

  { id: 'laser_master', title: 'Laser Danser', emoji: '🔴', description: 'Activeer 5 Laser Pointer Bots.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'laser_robot')?.count || 0) >= 5 },
  { id: 'laser_25', title: 'Laser Matrix', emoji: '🚨', description: 'Activeer 25 Laser Pointer Bots tegelijk.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'laser_robot')?.count || 0) >= 25 },

  { id: 'vlogger_fame', title: 'Viral Meow', emoji: '🎥', description: 'Huur 10 Katten Vloggers in.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'cat_vlogger')?.count || 0) >= 10 },
  { id: 'vlogger_25', title: 'TikTok Kattenster', emoji: '📱', description: 'Bezit 25 MeowTube Vloggers tegelijk.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'cat_vlogger')?.count || 0) >= 25 },

  { id: 'temple_1', title: 'Bastet Verering', emoji: '🏛️', description: 'Bouw je eerste Katten Tempel.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'cat_temple')?.count || 0) >= 1 },
  { id: 'fish_mine_1', title: 'Goud Graver', emoji: '⛏️', description: 'Open een Gouden Vismijn in de diepte.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'fish_mine')?.count || 0) >= 1 },
  { id: 'space_station_1', title: 'Naar de Sterren', emoji: '🚀', description: 'Lanceer een Kosmisch Kattenstation.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'space_station')?.count || 0) >= 1 },
  { id: 'alien_contact', title: 'First Contact', emoji: '👽', description: 'Maak contact met 1 Buitenaardse Kat.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'alien_cat')?.count || 0) >= 1 },
  { id: 'portal_1', title: 'Dimensie Reiziger', emoji: '🌌', description: 'Open een Meow Dimensieportaal.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'dimension_portal')?.count || 0) >= 1 },
  { id: 'ai_server_1', title: 'Super Kattenbrein', emoji: '🖥️', description: 'Activeer een Meow A.I. Server.', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'ai_server')?.count || 0) >= 1 },
  { id: 'time_machine_1', title: 'Tijd Reiziger', emoji: '⏳', description: 'Bouw een Tijdreizende Kattenmachine!', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'time_machine')?.count || 0) >= 1 },

  // 4. Upgrades & Mittens & Mechanics
  { id: 'upgrades_5', title: 'Handige Kat', emoji: '🔧', description: 'Koop minstens 5 upgrades in de winkel.', unlocked: false, condition: (_, __, ___, u) => (u?.filter(x => x.purchased).length || 0) >= 5 },
  { id: 'upgrades_12', title: 'Katten Uitvinder', emoji: '🔬', description: 'Koop minstens 12 upgrades in de winkel.', unlocked: false, condition: (_, __, ___, u) => (u?.filter(x => x.purchased).length || 0) >= 12 },
  { id: 'upgrades_25', title: 'Meester Uitvinder', emoji: '💎', description: 'Koop minstens 25 upgrades in de winkel.', unlocked: false, condition: (_, __, ___, u) => (u?.filter(x => x.purchased).length || 0) >= 25 },
  { id: 'upgrades_50', title: 'Grootmeester Uitvinder', emoji: '👑', description: 'Koop minstens 50 upgrades in de winkel!', unlocked: false, condition: (_, __, ___, u) => (u?.filter(x => x.purchased).length || 0) >= 50 },
  { id: 'mitten_pal', title: 'Mitten Vriend', emoji: '🧤', description: 'Aai minstens 1 Mitten kitten.', unlocked: false, condition: (_, __, ___, ____, m) => (m?.some(x => x.patsCount >= 1) || false) },
  { id: 'mitten_family', title: 'Mitten Familie', emoji: '🐈', description: 'Bezit minstens 5 Mitten kittens tegelijk.', unlocked: false, condition: (_, __, ___, ____, m) => (m?.length || 0) >= 5 },
  { id: 'mitten_cuddler', title: 'Knuffel Expert', emoji: '💖', description: 'Aai Mitten kittens minstens 10 keer in totaal.', unlocked: false, condition: (_, __, ___, ____, m) => (m?.reduce((acc, curr) => acc + curr.patsCount, 0) || 0) >= 10 },
  { id: 'pantheon_devotee', title: 'Geesten Inwijder', emoji: '🏛️', description: 'Wijd een goddelijke geest in het Pantheon in.', unlocked: false, condition: (s) => (s.pantheonSlotsFilled || 0) >= 1 },
  { id: 'grimoire_mage', title: 'Katten Magiër', emoji: '🧙‍♂️', description: 'Spreek minstens 1 toverspreuk uit het Katten Grimoire.', unlocked: false, condition: (s) => (s.spellsCast || 0) >= 1 },
  { id: 'building_supreme', title: 'De Opperste Godheid', emoji: '👑', description: 'Bezit minstens 1 Opperste Katten God!', unlocked: false, condition: (_, __, b) => (b.find(x => x.id === 'supreme_cat_god')?.count || 0) >= 1 },
];

// Cat Skins based on progression
const CAT_SKINS = [
  { id: 'orange', name: 'Rooie Huiskat', emoji: '🐱', minTreats: 0, color: 'from-amber-400 to-orange-500', bgGlow: 'rgba(251, 146, 60, 0.25)' },
  { id: 'black', name: 'Mystieke Zwarte Kat', emoji: '🐈‍⬛', minTreats: 5000, color: 'from-zinc-800 to-zinc-950', bgGlow: 'rgba(168, 85, 247, 0.25)' },
  { id: 'white', name: 'Sneeuwwitte Pers', emoji: '🤍', minTreats: 50000, color: 'from-slate-100 to-slate-300', bgGlow: 'rgba(56, 189, 248, 0.25)' },
  { id: 'calico', name: 'Lapjeskat', emoji: '😻', minTreats: 500000, color: 'from-amber-300 to-rose-400', bgGlow: 'rgba(244, 63, 94, 0.25)' },
  { id: 'cyber', name: 'Cyber Neon Kat', emoji: '⚡', minTreats: 5000000, color: 'from-cyan-400 to-fuchsia-500', bgGlow: 'rgba(6, 182, 212, 0.35)' },
  { id: 'cosmic', name: 'Galactische Kat', emoji: '🪐', minTreats: 50000000, color: 'from-purple-500 to-indigo-700', bgGlow: 'rgba(147, 51, 234, 0.4)' },
  { id: 'royal', name: 'Koninklijke Gouden Kat', emoji: '👑', minTreats: 500000000, color: 'from-amber-300 to-yellow-500', bgGlow: 'rgba(234, 179, 8, 0.5)' }
];

export function CatClickerGame({
  onBack,
  isFullscreen = false,
  userProfile,
  onSaveHighScore,
  onShareHighScoreOpen
}: CatClickerGameProps) {
  // Primary Game State
  const [treats, setTreats] = useState<number>(0);
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [stats, setStats] = useState<GameStats>({
    allTimeTreats: 0,
    runTreats: 0,
    totalClicks: 0,
    goldenYarnCaught: 0,
    startTime: Date.now(),
    ascensionCount: 0,
    totalKittyPoints: 0,
    mysticMiceCaught: 0
  });

  // Ascension & Mittens System
  const [kittyPoints, setKittyPoints] = useState<number>(0);
  const [ascensionUpgrades, setAscensionUpgrades] = useState<AscensionUpgrade[]>(INITIAL_ASCENSION_UPGRADES);
  const [mittens, setMittens] = useState<Mitten[]>([]);
  const [showAscensionModal, setShowAscensionModal] = useState<boolean>(false);
  const hasMittenOverdrive = ascensionUpgrades.some(u => u.id === 'mitten_overdrive' && u.purchased);

  const [kingdomSubTab, setKingdomSubTab] = useState<'overview' | 'mittens' | 'pantheon' | 'grimoire'>('overview');

  // Pantheon System
  const [pantheonSlots, setPantheonSlots] = useState<PantheonSlots>({
    diamond: null,
    ruby: null,
    jade: null,
  });

  // Grimoire & Mana System
  const [meowMana, setMeowMana] = useState<number>(100);
  const maxMeowMana = 100;

  // Active Buffs
  const [frenzyUntil, setFrenzyUntil] = useState<number>(0);
  const [clickFrenzyUntil, setClickFrenzyUntil] = useState<number>(0);
  const [carpSurgeUntil, setCarpSurgeUntil] = useState<number>(0);
  const [purrMultiplier, setPurrMultiplier] = useState<number>(1);
  const [purrProgress, setPurrProgress] = useState<number>(0);

  // Active Rare Spawns
  const [goldenYarn, setGoldenYarn] = useState<GoldenYarn | null>(null);
  const [mysticMouse, setMysticMouse] = useState<MysticMouse | null>(null);
  const [cosmicCarp, setCosmicCarp] = useState<CosmicCarp | null>(null);

  // Floating Click Particles
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const nextParticleId = useRef(0);

  // UI state
  const [activeTab, setActiveTab] = useState<'cat' | 'buildings' | 'upgrades' | 'mittens' | 'pantheon' | 'grimoire' | 'achievements' | 'stats' | 'kingdom'>('cat');
  const [desktopCenterTab, setDesktopCenterTab] = useState<'upgrades' | 'mittens' | 'pantheon' | 'grimoire' | 'kingdom' | 'achievements' | 'stats'>('upgrades');
  const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'available' | 'purchased' | 'locked'>('all');
  const [upgradeSearch, setUpgradeSearch] = useState<string>('');
  const [buyMultiplier, setBuyMultiplier] = useState<1 | 10 | 100>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isClickingCat, setIsClickingCat] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [selectedSkinId, setSelectedSkinId] = useState<string>('orange');

  const catContainerRef = useRef<HTMLDivElement>(null);
  const lastTickTime = useRef<number>(Date.now());
  const lastSaveTime = useRef<number>(Date.now());
  // Cooldown timers for rare events (ensures mice and carps never spawn in rapid succession)
  const nextMouseSpawnTime = useRef<number>(Date.now() + 180000 + Math.random() * 120000); // 3 to 5 minutes initial
  const nextCarpSpawnTime = useRef<number>(Date.now() + 270000 + Math.random() * 180000); // 4.5 to 7.5 minutes initial
  const nextGoldenYarnSpawnTime = useRef<number>(Date.now() + 60000 + Math.random() * 60000); // 1 to 2 minutes initial
  const nextRainbowSpawnTime = useRef<number>(Date.now() + 600000 + Math.random() * 300000); // 10 to 15 minutes initial cooldown (ultra-rare)

  // Cloud Highscore & Personal Best Record
  const cloudScore = Number(userProfile?.custom_theme?.game_high_scores?.catclicker || 0);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);

  // Personal High Score Record: persistent across reloads and resets.
  // Represents the highest amount of treats ever achieved.
  const [bestRecord, setBestRecord] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ftjm_cat_clicker_best_record_v1');
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val > 0) return Math.max(val, cloudScore);
      }
      const storedBaseline = localStorage.getItem('ftjm_cat_clicker_past_baseline_v1');
      if (storedBaseline) {
        const val = Number(storedBaseline);
        if (!isNaN(val) && val > 0) return Math.max(val, cloudScore);
      }
      const oldStored = localStorage.getItem('ftjm_cat_clicker_persistent_record_v1');
      if (oldStored) {
        const val = Number(oldStored);
        if (!isNaN(val) && val > 0) return Math.max(val, cloudScore);
      }
      const saved = localStorage.getItem('ftjm_cat_clicker_save_v1');
      if (saved) {
        const data = JSON.parse(saved);
        const sBest = Number(data.bestRecord || 0);
        const sPast = Number(data.pastBaselineRecord || 0);
        const sAllTime = Number(data.stats?.allTimeTreats || 0);
        return Math.max(cloudScore, sBest, sPast, sAllTime);
      }
    } catch {}
    return cloudScore || 0;
  });

  const [pastBaselineRecord, setPastBaselineRecord] = useState<number>(() => bestRecord);

  // True High Score Record:
  // Stays fixed at your personal best record.
  // It does NOT count up live while below the record!
  // It ONLY increases once your current total treats in this run actually surpass the record!
  const currentRunTreats = Math.floor(typeof stats.runTreats === 'number' ? stats.runTreats : (stats.allTimeTreats || 0));
  const allTimeRecord = Math.max(
    cloudScore,
    bestRecord,
    Math.floor(stats.allTimeTreats || 0),
    currentRunTreats,
    Math.floor(treats || 0)
  );

  // Sync bestRecord when the player beats their high score
  useEffect(() => {
    if (allTimeRecord > bestRecord) {
      setBestRecord(allTimeRecord);
      setPastBaselineRecord(allTimeRecord);
      try {
        localStorage.setItem('ftjm_cat_clicker_best_record_v1', allTimeRecord.toString());
        localStorage.setItem('ftjm_cat_clicker_past_baseline_v1', allTimeRecord.toString());
      } catch {}
    }
  }, [allTimeRecord, bestRecord]);

  const handleManualSaveScore = async () => {
    const currentRecord = allTimeRecord;
    if (onSaveHighScore && currentRecord > 0) {
      setIsSavingScore(true);
      try {
        await onSaveHighScore('catclicker', currentRecord);
        toast.success(`Score opgeslagen naar FTJM profiel: ${currentRecord.toLocaleString('nl-NL')} brokjes!`);
      } catch {
        toast.error('Kon score niet opslaan.');
      } finally {
        setIsSavingScore(false);
      }
    }
  };

  // Auto-sync personal record to cloud profile if increased
  const lastSyncedRecord = useRef<number>(cloudScore);
  useEffect(() => {
    if (!onSaveHighScore || allTimeRecord <= 0) return;
    if (allTimeRecord > lastSyncedRecord.current) {
      const timer = setTimeout(() => {
        lastSyncedRecord.current = allTimeRecord;
        onSaveHighScore('catclicker', allTimeRecord).catch(() => {});
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allTimeRecord, onSaveHighScore]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ftjm_cat_clicker_save_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.pastBaselineRecord === 'number') {
          setPastBaselineRecord(data.pastBaselineRecord);
        } else if (typeof data.bestRecord === 'number') {
          const sAllTime = Number(data.stats?.allTimeTreats || 0);
          if (data.bestRecord > sAllTime) {
            setPastBaselineRecord(data.bestRecord);
          }
        }
        if (typeof data.bestRecord === 'number') {
          setBestRecord(prev => Math.max(prev, data.bestRecord));
        } else if (typeof data.persistedPastRecord === 'number') {
          setBestRecord(prev => Math.max(prev, data.persistedPastRecord));
        }
        if (typeof data.treats === 'number') setTreats(data.treats);
        if (Array.isArray(data.buildings)) {
          setBuildings(prev => prev.map(b => {
            const found = data.buildings.find((sb: any) => sb.id === b.id);
            return found ? { ...b, count: found.count } : b;
          }));
        }
        if (Array.isArray(data.upgrades)) {
          setUpgrades(prev => prev.map(u => {
            const found = data.upgrades.find((su: any) => su.id === u.id);
            return found ? { ...u, purchased: found.purchased } : u;
          }));
        }
        if (Array.isArray(data.achievements)) {
          setAchievements(prev => prev.map(a => {
            const found = data.achievements.find((sa: any) => sa.id === a.id);
            return found ? { ...a, unlocked: found.unlocked } : a;
          }));
        }
        if (data.stats) {
          let sAllTime = typeof data.stats.allTimeTreats === 'number' && Number.isFinite(data.stats.allTimeTreats) ? data.stats.allTimeTreats : 0;
          let sTreats = typeof data.treats === 'number' && Number.isFinite(data.treats) ? data.treats : 0;
          let sRunTreats = typeof data.stats.runTreats === 'number' && Number.isFinite(data.stats.runTreats) ? data.stats.runTreats : sTreats;

          // Ensure runTreats and allTimeTreats are never lower than current treats
          if (sTreats > sRunTreats) sRunTreats = sTreats;
          if (sRunTreats > sAllTime) sAllTime = sRunTreats;

          setStats(prev => ({
            ...prev,
            allTimeTreats: sAllTime,
            runTreats: sRunTreats,
            totalClicks: data.stats.totalClicks || 0,
            goldenYarnCaught: data.stats.goldenYarnCaught || 0,
            startTime: data.stats.startTime || Date.now(),
            ascensionCount: data.stats.ascensionCount || 0,
            totalKittyPoints: Math.min(100, data.stats.totalKittyPoints || 0),
            mysticMiceCaught: data.stats.mysticMiceCaught || 0
          }));
        }
        if (typeof data.kittyPoints === 'number') {
          const sAscensionCount = data.stats?.ascensionCount || 0;
          const sAllTime = data.stats?.allTimeTreats || 0;
          const sTreats = typeof data.treats === 'number' ? data.treats : 0;
          const sRunTreats = typeof data.stats?.runTreats === 'number' ? data.stats.runTreats : sTreats;
          // Fix 10 KP starting bug: if the user never ascended and hasn't reached 1B treats in this run, KP starts strictly at 0!
          if (sAscensionCount === 0 && sAllTime < 1000000000 && sTreats < 1000000000 && sRunTreats < 1000000000) {
            setKittyPoints(0);
          } else {
            // Strictly cap stored Kitty Points to 100 max (replaces 200.000 / 12.470 with 100)
            const rawKp = Math.max(0, data.kittyPoints);
            setKittyPoints(Math.min(100, rawKp));
          }
        }
        if (Array.isArray(data.ascensionUpgrades)) {
          setAscensionUpgrades(prev => prev.map(u => {
            const found = data.ascensionUpgrades.find((su: any) => su.id === u.id);
            return found ? { ...u, purchased: found.purchased } : u;
          }));
        }
        if (Array.isArray(data.mittens) && data.mittens.length > 0) {
          setMittens(data.mittens);
        } else {
          // Initialize mittens based on kitten building count
          const kittenBuilding = data.buildings?.find((b: any) => b.id === 'kitten');
          const kittenCount = kittenBuilding ? kittenBuilding.count : 0;
          if (kittenCount > 0) {
            setMittens(syncMittensList([], kittenCount));
          }
        }
        if (data.selectedSkinId) {
          setSelectedSkinId(data.selectedSkinId);
        }
        if (data.pantheonSlots) {
          setPantheonSlots(data.pantheonSlots);
        }
        if (typeof data.meowMana === 'number') {
          setMeowMana(data.meowMana);
        }

        // Offline progress: ONLY if unlocked via Ascension upgrade
        const hasOfflineUnlock = Array.isArray(data.ascensionUpgrades) && data.ascensionUpgrades.some((u: any) => u.id === 'offline_unlock' && u.purchased);
        if (data.lastSavedAt && hasOfflineUnlock) {
          let maxHours = 2;
          let efficiency = 0.25;

          const hasFull = data.ascensionUpgrades.some((u: any) => u.id === 'offline_full' && u.purchased);
          const hasTime2 = data.ascensionUpgrades.some((u: any) => u.id === 'offline_time_2' && u.purchased);
          const hasTime1 = data.ascensionUpgrades.some((u: any) => u.id === 'offline_time_1' && u.purchased);

          if (hasFull) {
            maxHours = 24;
            efficiency = 1.0;
          } else if (hasTime2) {
            maxHours = 14;
            efficiency = 0.70;
          } else if (hasTime1) {
            maxHours = 6;
            efficiency = 0.45;
          }

          const elapsedSec = Math.min((Date.now() - data.lastSavedAt) / 1000, maxHours * 3600);
          if (elapsedSec > 10) {
            let estimatedTps = 0;
            data.buildings?.forEach((b: any) => {
              const base = INITIAL_BUILDINGS.find(ib => ib.id === b.id);
              if (base && b.count > 0) {
                let unitTps = base.baseTps;
                // Apply loaded upgrades to this building unit
                if (Array.isArray(data.upgrades)) {
                  data.upgrades.forEach((u: any) => {
                    if (u.purchased && u.type === 'building' && u.buildingId === b.id) {
                      unitTps *= u.multiplier;
                    }
                  });
                }
                // Apply loaded mitten boost
                if (b.id === 'kitten' && Array.isArray(data.ascensionUpgrades) && data.ascensionUpgrades.some((u: any) => u.id === 'mitten_power' && u.purchased)) {
                  unitTps *= 1.5;
                }
                estimatedTps += unitTps * b.count;
              }
            });

            // Global upgrades
            if (Array.isArray(data.upgrades)) {
              data.upgrades.forEach((u: any) => {
                if (u.purchased && u.type === 'tps') {
                  estimatedTps *= u.multiplier;
                }
              });
            }

            // Heavenly paws boost (+20%)
            if (Array.isArray(data.ascensionUpgrades) && data.ascensionUpgrades.some((u: any) => u.id === 'heavenly_paws' && u.purchased)) {
              estimatedTps *= 1.20;
            }

            // Achievements boost (+1% per loaded achievement)
            if (Array.isArray(data.achievements)) {
              const unlockedCount = data.achievements.filter((a: any) => a.unlocked).length;
              estimatedTps *= (1 + unlockedCount * 0.01);
            }

            const earned = Math.floor(estimatedTps * elapsedSec * efficiency);
            if (earned > 0) {
              setTreats(t => t + earned);
              setStats(s => ({ ...s, allTimeTreats: s.allTimeTreats + earned, runTreats: (s.runTreats || 0) + earned }));
              toast.success(`💤 Slapende Kattenkracht: Je katten hebben ${earned.toLocaleString('nl-NL')} brokjes verzameld tijdens je afwezigheid! (${Math.round(efficiency * 100)}% opbrengst)`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load cat clicker save:', e);
    }
  }, []);

  // Sync sound settings
  useEffect(() => {
    catAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Calculate Global TPS Multiplier (all global multipliers combined)
  const getGlobalTpsMultiplier = useCallback(() => {
    let mult = 1;

    // Global TPS upgrades
    upgrades.forEach(u => {
      if (u.purchased && u.type === 'tps') {
        mult *= u.multiplier;
      }
      // Kitten scaling upgrades: scale with total unlocked achievements
      if (u.purchased && u.type === 'kitten') {
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        mult *= (1 + unlockedCount * u.multiplier);
      }
    });

    // Pantheon Mokalsium (Mother of Milk Cats)
    if (pantheonSlots.diamond === 'mokalsium') mult *= 1.25;
    else if (pantheonSlots.ruby === 'mokalsium') mult *= 1.15;
    else if (pantheonSlots.jade === 'mokalsium') mult *= 1.08;

    // Ascension Heavenly Paws boost (+20% global TPS)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws')?.purchased) {
      mult *= 1.20;
    }

    // Ascension Heavenly Paws 2 boost (+25% global TPS)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws_2')?.purchased) {
      mult *= 1.25;
    }

    // Ascension Eternal Catnip boost (+50% / 1.5x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'eternal_catnip')?.purchased) {
      mult *= 1.5;
    }

    // Ascension Cat Transcendence boost (+50% / 1.5x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'cat_transcendence')?.purchased) {
      mult *= 1.5;
    }

    // Ascension Quantum Catnip (+50% / 1.5x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'quantum_catnip')?.purchased) {
      mult *= 1.5;
    }

    // Ascension Hyper Singularity (+100% / 2x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'hyper_singularity')?.purchased) {
      mult *= 2.0;
    }

    // Ascension Celestial Deity (2.5x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'celestial_deity')?.purchased) {
      mult *= 2.5;
    }

    // Ascension Archangel Ascendance (2.5x global TPS)
    if (ascensionUpgrades.find(u => u.id === 'archangel_ascendance')?.purchased) {
      mult *= 2.5;
    }

    // Achievement boost (+1% per unlocked achievement)
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    mult *= (1 + unlockedCount * 0.01);

    // Frenzy buff (enhanced with frenzy_surge)
    if (Date.now() < frenzyUntil) {
      const hasFrenzySurge = ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased;
      mult *= (hasFrenzySurge ? 10 : 7);
    }

    // Purr meter multiplier
    mult *= purrMultiplier;

    return mult;
  }, [upgrades, achievements, frenzyUntil, purrMultiplier, ascensionUpgrades, pantheonSlots]);

  // Calculate the current active TPS of a single helper unit, including its specific upgrades (and optionally global multipliers)
  const getBuildingTpsSingle = useCallback((bId: string, bBaseTps: number, includeGlobal = false) => {
    let tps = bBaseTps;

    // Check specific building upgrades & synergies
    upgrades.forEach(u => {
      if (u.purchased && u.type === 'building' && u.buildingId === bId) {
        tps *= u.multiplier;
      }
      if (u.purchased && u.type === 'synergy' && u.buildingId === bId && u.synergyBuildingId) {
        const partnerCount = buildings.find(b => b.id === u.synergyBuildingId)?.count || 0;
        tps *= (1 + partnerCount * u.multiplier);
      }
    });

    // Ascension Mitten power boost (+50% for kittens)
    if (bId === 'kitten' && ascensionUpgrades.find(u => u.id === 'mitten_power')?.purchased) {
      tps *= 1.5;
    }

    // Ascension Synergy Kittens (+1% per scratching post)
    if (bId === 'kitten' && ascensionUpgrades.find(u => u.id === 'synergy_kittens')?.purchased) {
      const postsCount = buildings.find(b => b.id === 'scratching_post')?.count || 0;
      tps *= (1 + postsCount * 0.01);
    }

    // Ascension Cathedral Sanctuary perk
    if (ascensionUpgrades.find(u => u.id === 'cathedral_sanctuary')?.purchased) {
      if (bId === 'celestial_cathedral') tps *= 2.0; // +100%
      if (bId === 'cat_temple') tps *= 1.25; // +25%
    }

    // Ascension Seraphim Blessing perk
    if (ascensionUpgrades.find(u => u.id === 'seraphim_blessing')?.purchased) {
      if (bId === 'seraphim_galaxy') tps *= 1.5; // +50% (balanced from +150%)
      if (bId === 'milk_bar') tps *= 2.0; // 2x (balanced from 3x)
    }

    if (includeGlobal) {
      tps *= getGlobalTpsMultiplier();
    }

    return tps;
  }, [upgrades, ascensionUpgrades, buildings, getGlobalTpsMultiplier]);

  // Calculate Treats Per Second (TPS)
  const calculateTps = useCallback(() => {
    let baseBuildingsTps = 0;

    // Building contributions (with celestial_empire bonus: +25% for 25+ buildings)
    const hasCelestialEmpire = ascensionUpgrades.find(u => u.id === 'celestial_empire')?.purchased;
    buildings.forEach(b => {
      if (b.count <= 0) return;
      let buildingTps = getBuildingTpsSingle(b.id, b.baseTps, false) * b.count;
      if (hasCelestialEmpire && b.count >= 25) {
        buildingTps *= 1.25;
      }
      baseBuildingsTps += buildingTps;
    });

    // Apply global TPS multiplier
    const globalMultiplier = getGlobalTpsMultiplier();
    let tps = baseBuildingsTps * globalMultiplier;

    // Mittens passive TPS contribution
    const hasMittenPower = ascensionUpgrades.find(u => u.id === 'mitten_power')?.purchased;
    const hasMittenOverdrive = ascensionUpgrades.find(u => u.id === 'mitten_overdrive')?.purchased;
    const mittenMult = (hasMittenPower ? 2 : 1) * (hasMittenOverdrive ? 3 : 1);
    const mittenTps = mittens.reduce((acc, m) => acc + getMittenTpsBonus(m.level || 1, mittenMult), 0);
    tps += mittenTps;

    return tps;
  }, [buildings, getBuildingTpsSingle, getGlobalTpsMultiplier, ascensionUpgrades, mittens]);

  // Calculate Click Value
  const calculateClickPower = useCallback(() => {
    let baseMultiplier = 1;
    let clickUpgradesCount = 0;

    upgrades.forEach(u => {
      if (u.purchased && u.type === 'click') {
        baseMultiplier *= u.multiplier;
        clickUpgradesCount++;
      }
    });

    // Kitten synergy: each 5 kittens gives +1 click power
    const kittenCount = buildings.find(b => b.id === 'kitten')?.count || 0;
    const kittenBonus = Math.floor(kittenCount / 5);

    // Base manual click power with manual click upgrades
    let power = (1 + kittenBonus) * baseMultiplier;

    // Scaling mechanics: Each click upgrade makes your click worth an extra 1% of your total TPS
    // Additive contribution so it scales cleanly with TPS without runaway multiplication
    if (clickUpgradesCount > 0) {
      const currentTps = calculateTps();
      power += currentTps * 0.01 * clickUpgradesCount;
    }

    // Ascension Heavenly Paws boost (+20%)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws')?.purchased) {
      power *= 1.20;
    }

    // Ascension Heavenly Paws 2 boost (+25%)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws_2')?.purchased) {
      power *= 1.25;
    }
    // Ascension Click God (x3)
    if (ascensionUpgrades.find(u => u.id === 'click_god')?.purchased) {
      power *= 3;
    }

    // Ascension Eternal Catnip (+50% / 1.5x click power)
    if (ascensionUpgrades.find(u => u.id === 'eternal_catnip')?.purchased) {
      power *= 1.5;
    }

    // Ascension Cat Transcendence (+50% / 1.5x click power)
    if (ascensionUpgrades.find(u => u.id === 'cat_transcendence')?.purchased) {
      power *= 1.5;
    }

    // Ascension Quantum Catnip (+50% / 1.5x click power)
    if (ascensionUpgrades.find(u => u.id === 'quantum_catnip')?.purchased) {
      power *= 1.5;
    }

    // Ascension Celestial Deity (2.5x click power)
    if (ascensionUpgrades.find(u => u.id === 'celestial_deity')?.purchased) {
      power *= 2.5;
    }

    // Ascension Archangel Ascendance (2.5x click power)
    if (ascensionUpgrades.find(u => u.id === 'archangel_ascendance')?.purchased) {
      power *= 2.5;
    }

    // Ascension Divine Click Conduit (+2% of active TPS to each manual click)
    if (ascensionUpgrades.find(u => u.id === 'divine_click_conduit')?.purchased) {
      const currentTps = calculateTps();
      power += currentTps * 0.02;
    }

    // Mitten level synergy with clicks (applies to trained Mitten levels above level 1)
    const hasMittenOverdrive = ascensionUpgrades.find(u => u.id === 'mitten_overdrive')?.purchased;
    const upgradedMittenLevels = mittens.reduce((acc, m) => acc + Math.max(0, (m.level || 1) - 1), 0);
    if (upgradedMittenLevels > 0) {
      power += upgradedMittenLevels * (hasMittenOverdrive ? 10 : 3);
    }

    // Achievement boost (+1% per unlocked achievement)
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    power *= (1 + unlockedCount * 0.01);

    // Click Frenzy buff (enhanced with frenzy_surge)
    if (Date.now() < clickFrenzyUntil) {
      const hasFrenzySurge = ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased;
      power *= (hasFrenzySurge ? 111 : 77);
    }

    // Karper Vloedgolf buff (+25x click power)
    if (Date.now() < carpSurgeUntil) {
      power *= 25;
    }

    // Purr multiplier
    power *= purrMultiplier;

    // Pantheon Skruukie (The Hungry Claw)
    if (pantheonSlots.diamond === 'skruukie') power *= 1.60;
    else if (pantheonSlots.ruby === 'skruukie') power *= 1.35;
    else if (pantheonSlots.jade === 'skruukie') power *= 1.18;

    return Math.max(1, Math.round(power));
  }, [upgrades, buildings, achievements, clickFrenzyUntil, carpSurgeUntil, purrMultiplier, calculateTps, ascensionUpgrades, mittens, pantheonSlots]);

  // Game Loop (Ticks every 100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      const tps = calculateTps();
      let addedTreats = tps * deltaSec;

      // Auto-clicker from Ascension
      const hasAutoClicker = ascensionUpgrades.find(u => u.id === 'auto_clicker')?.purchased;
      if (hasAutoClicker) {
        const clickVal = calculateClickPower();
        addedTreats += clickVal * 2 * deltaSec;
      }

      if (addedTreats > 0) {
        setTreats(prev => prev + addedTreats);
        setStats(prev => ({
          ...prev,
          allTimeTreats: prev.allTimeTreats + addedTreats,
          runTreats: (prev.runTreats || 0) + addedTreats
        }));
      }

      // Purr meter decay over time
      setPurrProgress(prev => {
        if (prev > 0) {
          const next = Math.max(0, prev - (deltaSec * 12));
          if (next < 100 && purrMultiplier > 1) {
            setPurrMultiplier(1);
          }
          return next;
        }
        return 0;
      });

      // Passive Mana Regeneration for Grimoire Spells (1 mana every 2 seconds, full mana in ~3.3 min)
      setMeowMana(prev => Math.min(maxMeowMana, prev + deltaSec * 0.5));

      // Golden Yarn & Rainbow Yarn spawning (controlled timer, no spam)
      const hasGoldenMagnet = ascensionUpgrades.find(u => u.id === 'golden_magnet')?.purchased;
      const hasRainbowUpgrade = ascensionUpgrades.find(u => u.id === 'rainbow_yarn')?.purchased;
      const hasTranscendence = ascensionUpgrades.find(u => u.id === 'cat_transcendence')?.purchased;
      const durationBonus = hasGoldenMagnet ? 22000 : 15000;

      if (!goldenYarn && now >= nextGoldenYarnSpawnTime.current) {
        let minYarnSec = 75;
        let maxYarnSec = 130;
        if (hasGoldenMagnet) {
          minYarnSec = 45;
          maxYarnSec = 80;
        }
        if (hasTranscendence) {
          minYarnSec *= 0.8;
          maxYarnSec *= 0.8;
        }
        // Pantheon Rigidel (The Cosmic Yarn Weaver)
        if (pantheonSlots.diamond === 'rigidel') {
          minYarnSec *= 0.60;
          maxYarnSec *= 0.60;
        } else if (pantheonSlots.ruby === 'rigidel') {
          minYarnSec *= 0.75;
          maxYarnSec *= 0.75;
        } else if (pantheonSlots.jade === 'rigidel') {
          minYarnSec *= 0.88;
          maxYarnSec *= 0.88;
        }
        nextGoldenYarnSpawnTime.current = now + (minYarnSec + Math.random() * (maxYarnSec - minYarnSec)) * 1000;

        // Rainbow Yarn is an ultra-rare mythic variant:
        // - Requires a strict cooldown of at least 15 to 20 minutes between appearances
        // - Without the 'rainbow_yarn' ascension upgrade: 0% chance (locked until purchased)
        // - With the 'rainbow_yarn' ascension upgrade: only a 3% chance when a yarn spawns AND cooldown has elapsed
        const canSpawnRainbow = now >= nextRainbowSpawnTime.current;
        const rainbowChance = hasRainbowUpgrade ? 0.03 : 0;
        const isRainbow = canSpawnRainbow && Math.random() < rainbowChance;

        let chosenType: 'frenzy' | 'lucky' | 'click_frenzy' | 'rainbow';
        if (isRainbow) {
          chosenType = 'rainbow';
          nextRainbowSpawnTime.current = now + (15 + Math.random() * 5) * 60 * 1000;
        } else {
          const types: ('frenzy' | 'lucky' | 'click_frenzy')[] = ['frenzy', 'lucky', 'click_frenzy'];
          chosenType = types[Math.floor(Math.random() * types.length)];
        }
        setGoldenYarn({
          id: Date.now(),
          x: Math.floor(10 + Math.random() * 75), // percentage
          y: Math.floor(20 + Math.random() * 60), // percentage
          type: chosenType,
          expiresAt: Date.now() + durationBonus
        });
        catAudio.playSparkle();
      }

      // Spawn Mystic Mouse (Rare Event: spaced out every 4-7 min, or 2-3.5 min with upgrade)
      const hasLuckyCat = ascensionUpgrades.find(u => u.id === 'lucky_cat')?.purchased;
      if (!mysticMouse && now >= nextMouseSpawnTime.current) {
        let minMouseSec = 240; // 4 minutes
        let maxMouseSec = 420; // 7 minutes
        if (hasLuckyCat) {
          minMouseSec = 120; // 2 minutes with upgrade
          maxMouseSec = 210; // 3.5 minutes
        }
        if (hasTranscendence) {
          minMouseSec *= 0.75;
          maxMouseSec *= 0.75;
        }
        nextMouseSpawnTime.current = now + (minMouseSec + Math.random() * (maxMouseSec - minMouseSec)) * 1000;

        setMysticMouse({
          id: Date.now(),
          y: Math.floor(20 + Math.random() * 60),
          direction: Math.random() > 0.5 ? 'left' : 'right',
          expiresAt: Date.now() + 12000 // alive for 12 seconds
        });
        catAudio.playSparkle();
      }

      // Spawn Cosmic Golden Carp (Mythic Event: spaced out every 6-10 min, or 3-5 min with upgrade)
      const hasCosmicCarp = ascensionUpgrades.find(u => u.id === 'cosmic_carp')?.purchased;
      if (!cosmicCarp && now >= nextCarpSpawnTime.current) {
        let minCarpSec = 360; // 6 minutes base
        let maxCarpSec = 600; // 10 minutes base
        if (hasCosmicCarp) {
          minCarpSec = 180; // 3 minutes with ascension upgrade
          maxCarpSec = 300; // 5 minutes
        }
        if (hasTranscendence) {
          minCarpSec *= 0.75;
          maxCarpSec *= 0.75;
        }
        nextCarpSpawnTime.current = now + (minCarpSec + Math.random() * (maxCarpSec - minCarpSec)) * 1000;

        setCosmicCarp({
          id: Date.now(),
          y: Math.floor(15 + Math.random() * 65),
          direction: Math.random() > 0.5 ? 'left' : 'right',
          expiresAt: Date.now() + 14000
        });
        catAudio.playSparkle();
      }

      // Remove expired mystic mouse & ensure cooldown is enforced
      if (mysticMouse && Date.now() > mysticMouse.expiresAt) {
        setMysticMouse(null);
        nextMouseSpawnTime.current = Math.max(nextMouseSpawnTime.current, Date.now() + (hasLuckyCat ? 120000 : 240000));
      }

      // Remove expired golden yarn & ensure cooldown is enforced
      if (goldenYarn && Date.now() > goldenYarn.expiresAt) {
        if (goldenYarn.type === 'rainbow') {
          nextRainbowSpawnTime.current = Math.max(nextRainbowSpawnTime.current, Date.now() + 15 * 60 * 1000);
        }
        setGoldenYarn(null);
        nextGoldenYarnSpawnTime.current = Math.max(nextGoldenYarnSpawnTime.current, Date.now() + (hasGoldenMagnet ? 45000 : 70000));
      }

      // Remove expired cosmic carp & ensure cooldown is enforced
      if (cosmicCarp && Date.now() > cosmicCarp.expiresAt) {
        setCosmicCarp(null);
        nextCarpSpawnTime.current = Math.max(nextCarpSpawnTime.current, Date.now() + (hasCosmicCarp ? 180000 : 360000));
      }

      // Auto-save every 5 seconds to local storage
      if (now - lastSaveTime.current > 5000) {
        lastSaveTime.current = now;
        try {
          const currentRecord = allTimeRecord;
          const currentStats = {
            ...stats,
            runTreats: Math.max(stats.runTreats || 0, treats),
            allTimeTreats: Math.max(stats.allTimeTreats || 0, stats.runTreats || 0, treats),
          };
          const saveData = {
            treats,
            buildings,
            upgrades,
            achievements,
            stats: currentStats,
            kittyPoints,
            ascensionUpgrades,
            mittens,
            selectedSkinId,
            pantheonSlots,
            meowMana,
            bestRecord: currentRecord,
            pastBaselineRecord,
            lastSavedAt: now
          };
          localStorage.setItem('ftjm_cat_clicker_save_v1', JSON.stringify(saveData));
          localStorage.setItem('ftjm_cat_clicker_past_baseline_v1', pastBaselineRecord.toString());
          if (currentRecord > bestRecord) {
            localStorage.setItem('ftjm_cat_clicker_best_record_v1', currentRecord.toString());
          }
        } catch {}
      }
    }, 100);

    return () => clearInterval(interval);
  }, [calculateTps, calculateClickPower, goldenYarn, mysticMouse, cosmicCarp, treats, buildings, upgrades, achievements, stats, kittyPoints, ascensionUpgrades, mittens, selectedSkinId, purrMultiplier, bestRecord, cloudScore, allTimeRecord, pastBaselineRecord, pantheonSlots, meowMana]);

  // Check achievements on stats, treats, buildings, upgrades, or mittens update
  useEffect(() => {
    setAchievements(prev => {
      let changed = false;
      const next = prev.map(ach => {
        if (!ach.unlocked && ach.condition(stats, treats, buildings, upgrades, mittens)) {
          changed = true;
          catAudio.playSparkle();
          toast.success(`🏆 Prestatie Ontgrendeld: ${ach.title}!`, {
            description: `${ach.emoji} ${ach.description} (+1% bonus)`,
            duration: 4000
          });
          return { ...ach, unlocked: true };
        }
        return ach;
      });
      return changed ? next : prev;
    });
  }, [stats, treats, buildings, upgrades, mittens]);

  // Handle Clicking the Main Cat
  const handleCatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickPower = calculateClickPower();

    // Check critical hit chance (15% if crit upgrade bought, 25% with lucky_crit ascension)
    const hasCrit = upgrades.find(u => u.id === 'crit_claws')?.purchased;
    const hasLuckyCrit = ascensionUpgrades.find(u => u.id === 'lucky_crit')?.purchased;
    const critChance = hasLuckyCrit ? 0.25 : (hasCrit ? 0.15 : 0);
    const critMultiplier = hasLuckyCrit ? 12 : 7;
    const isCrit = (hasCrit || hasLuckyCrit) && Math.random() < critChance;
    const finalTreats = isCrit ? clickPower * critMultiplier : clickPower;

    setTreats(prev => prev + finalTreats);
    setStats(prev => ({
      ...prev,
      allTimeTreats: prev.allTimeTreats + finalTreats,
      runTreats: (prev.runTreats || 0) + finalTreats,
      totalClicks: prev.totalClicks + 1
    }));

    // Audio
    if (isCrit) {
      catAudio.playMeow(1.4);
    } else {
      catAudio.playSecondaryMeow();
    }

    // Squish animation state
    setIsClickingCat(true);
    setTimeout(() => setIsClickingCat(false), 120);

    // Increase Purr meter (2x faster with purr_mastery)
    const hasPurrMastery = ascensionUpgrades.find(u => u.id === 'purr_mastery')?.purchased;
    const purrIncrement = hasPurrMastery ? 7.0 : 3.5;
    const maxPurrMult = hasPurrMastery ? 3 : 2;

    setPurrProgress(prev => {
      const next = Math.min(100, prev + purrIncrement);
      if (next >= 100 && purrMultiplier === 1) {
        setPurrMultiplier(maxPurrMult);
        catAudio.playPurr();
        toast('😻 SUPER SPINNEN ACTIEF!', {
          description: `${maxPurrMult}x Brokjes bonus zolang de purr-meter hoog blijft!`,
          duration: 3000
        });
      }
      return next;
    });

    // Create floating text at click location - clean centered relative coords that never spill over columns
    const particleId = nextParticleId.current++;
    const text = isCrit ? `🔥 +${finalTreats.toLocaleString()} CRIT (${critMultiplier}x)!` : `+${finalTreats.toLocaleString()}`;
    const color = isCrit ? 'text-amber-300 font-black scale-110' : 'text-cyan-300 font-bold';
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 16;

    setFloatingTexts(prev => [
      ...prev.slice(-12),
      { id: particleId, x, y, text, color }
    ]);

    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(p => p.id !== particleId));
    }, 750);
  };

  // Building Cost with Multiplier
  const getBuildingCost = (building: Building, countToBuy = buyMultiplier) => {
    let total = 0;
    for (let i = 0; i < countToBuy; i++) {
      total += Math.floor(building.baseCost * Math.pow(1.15, building.count + i));
    }
    return total;
  };

  // Buy Building with bulk multiplier
  const handleBuyBuilding = (buildingId: string, countToBuy = buyMultiplier) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    if (building.requiresAscensionUpgrade) {
      const isUnlocked = ascensionUpgrades.find(u => u.id === building.requiresAscensionUpgrade)?.purchased;
      if (!isUnlocked) {
        toast.error(`🔒 ${building.name} is een Hemels Heiligdom! Ontgrendel dit gebouw eerst in de Hemelse Boom via Hemelvaart.`);
        return;
      }
    }

    let totalCost = 0;
    for (let i = 0; i < countToBuy; i++) {
      totalCost += Math.floor(building.baseCost * Math.pow(1.15, building.count + i));
    }

    if (treats < totalCost) {
      toast.error(`Niet genoeg brokjes! Je hebt er ${totalCost.toLocaleString('nl-NL')} nodig.`);
      return;
    }

    setTreats(prev => prev - totalCost);
    setBuildings(prev => prev.map(b => {
      if (b.id === buildingId) {
        const newCount = b.count + countToBuy;
        if (buildingId === 'kitten') {
          setMittens(prevMittens => syncMittensList(prevMittens, newCount));
        }
        return { ...b, count: newCount };
      }
      return b;
    }));

    catAudio.playBuy();
  };

  // Pet a specific Mitten kitten
  const handlePetMitten = (mittenId: string) => {
    const mitten = mittens.find(m => m.id === mittenId);
    if (!mitten) return;

    const lvl = mitten.level || 1;
    const hasOverdrive = ascensionUpgrades.some(u => u.id === 'mitten_overdrive' && u.purchased);
    const hasDivine = ascensionUpgrades.some(u => u.id === 'mitten_claws_divine' && u.purchased);

    // Reward scales with mitten level, click power, and TPS
    const currentTps = calculateTps();
    let bonus = Math.max(15, Math.round(calculateClickPower() * 2 * lvl * (hasOverdrive ? 2 : 1)));
    if (hasDivine) {
      bonus += Math.floor(currentTps * 20); // 20 seconds of TPS surge!
    }

    setTreats(t => t + bonus);
    setStats(s => ({ ...s, allTimeTreats: s.allTimeTreats + bonus, runTreats: (s.runTreats || 0) + bonus }));

    setMittens(prev => prev.map(m => {
      if (m.id === mittenId) {
        return { ...m, patsCount: (m.patsCount || 0) + 1 };
      }
      return m;
    }));

    catAudio.playSecondaryMeow();
    toast(`😻 ${mitten.name}: "${mitten.personality}"`, {
      description: `Je hebt ${mitten.name} (Lvl ${lvl}) geknuffeld! +${bonus.toLocaleString('nl-NL')} brokjes`,
      duration: 2500
    });
  };

  // Upgrade a single Mitten kitten level
  const handleUpgradeMitten = (mittenId: string) => {
    const mitten = mittens.find(m => m.id === mittenId);
    if (!mitten) return;
    const currentLvl = mitten.level || 1;
    const cost = getMittenUpgradeCost(currentLvl);

    if (treats < cost || treats <= 0) {
      toast.error(t(`Niet genoeg brokjes! ${cost.toLocaleString('nl-NL')} nodig.`));
      return;
    }

    setTreats(t => Math.max(0, t - cost));
    setMittens(prev => prev.map(m => {
      if (m.id === mittenId) {
        return { ...m, level: currentLvl + 1 };
      }
      return m;
    }));

    catAudio.playBuy();
    toast.success(`⭐ ${mitten.name} is nu Level ${currentLvl + 1}!`, {
      description: `+${getMittenTpsBonus(currentLvl + 1).toLocaleString('nl-NL')} brokjes/sec`,
      duration: 2000
    });
  };

  // Upgrade all affordable Mitten kittens sequentially based on available balance
  const handleUpgradeAllMittens = () => {
    if (treats <= 0) {
      toast.error(t("Niet genoeg brokjes om kittens te upgraden!"));
      return;
    }

    let currentTreats = treats;
    let upgradedCount = 0;
    let totalCost = 0;

    // Prioritize lowest level mittens first
    const sortedMittens = [...mittens].sort((a, b) => (a.level || 1) - (b.level || 1));
    const upgradedLevels = new Map<string, number>();

    for (const m of sortedMittens) {
      const currentLvl = m.level || 1;
      const cost = getMittenUpgradeCost(currentLvl);
      if (currentTreats >= cost) {
        currentTreats -= cost;
        totalCost += cost;
        upgradedCount++;
        upgradedLevels.set(m.id, currentLvl + 1);
      }
    }

    if (upgradedCount === 0 || totalCost === 0) {
      toast.error(t("Niet genoeg brokjes om kittens te upgraden!"));
      return;
    }

    setTreats(Math.max(0, currentTreats));
    setMittens(prev => prev.map(m => {
      const newLvl = upgradedLevels.get(m.id);
      return newLvl ? { ...m, level: newLvl } : m;
    }));
    catAudio.playBuy();
    toast.success(`🎉 ${upgradedCount} Mittens geüpgraded! (-${totalCost.toLocaleString('nl-NL')} 🍪)`, {
      duration: 2500
    });
  };

  // Buy Ascension Upgrade
  const handleBuyAscensionUpgrade = (upgradeId: string) => {
    const upgrade = ascensionUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return;

    if (kittyPoints < upgrade.cost) {
      toast.error(`Niet genoeg Kitty Points! Je hebt ${upgrade.cost} KP nodig.`);
      return;
    }

    setKittyPoints(kp => kp - upgrade.cost);
    setAscensionUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        return { ...u, purchased: true };
      }
      return u;
    }));

    catAudio.playSparkle();
    toast.success(`🌟 Hemelse Kracht Ontgrendeld: ${upgrade.name}!`);
  };

  // Assign or unassign a Pantheon spirit to a slot
  const handleAssignPantheonSlot = (slot: 'diamond' | 'ruby' | 'jade', spiritId: string | null) => {
    setPantheonSlots(prev => {
      const next = { ...prev };
      // Clear previous slot if deity was already assigned elsewhere
      if (spiritId) {
        if (next.diamond === spiritId) next.diamond = null;
        if (next.ruby === spiritId) next.ruby = null;
        if (next.jade === spiritId) next.jade = null;
      }
      next[slot] = spiritId;

      const filledCount = Object.values(next).filter(Boolean).length;
      setStats(s => ({ ...s, pantheonSlotsFilled: filledCount }));
      return next;
    });

    catAudio.playSparkle();
    if (spiritId) {
      const spirit = PANTHEON_SPIRITS.find(s => s.id === spiritId);
      toast.success(`🏛️ ${spirit?.name || 'Geest'} ingewijd in het heiligdom (${slot.toUpperCase()})!`);
    } else {
      toast.info(`Heiligdom sokkel leeggemaakt.`);
    }
  };

  // Cast a spell from Grimoire
  const handleCastSpell = (spell: MeowSpell) => {
    if (meowMana < spell.manaCost) {
      toast.error(`Niet genoeg Meow Mana! Je hebt ${spell.manaCost} mana nodig.`);
      return;
    }

    setMeowMana(m => Math.max(0, m - spell.manaCost));
    setStats(s => ({ ...s, spellsCast: (s.spellsCast || 0) + 1 }));
    catAudio.playSpellCast();

    if (spell.type === 'golden_yarn') {
      const types: ('frenzy' | 'lucky' | 'click_frenzy')[] = ['frenzy', 'lucky', 'click_frenzy'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      setGoldenYarn({
        id: Date.now(),
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(25 + Math.random() * 50),
        type: chosenType,
        expiresAt: Date.now() + 20000
      });
      toast.success(`🧶 Gouden Garenbol gemanifesteerd!`, { description: spell.name });
    } else if (spell.type === 'frenzy') {
      const hasFrenzySurge = ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased;
      const frenzyRate = hasFrenzySurge ? '10x' : '7x';
      setFrenzyUntil(Date.now() + 20000);
      toast.success(`⚡ TURBO FRENZY GEACTIVEERD! (${frenzyRate})`, { description: '20 seconden astronomische brokjesregen!' });
    } else if (spell.type === 'treat_burst') {
      const currentTps = calculateTps();
      const burstAmount = Math.max(100, Math.floor(currentTps * 900)); // 15 minutes of TPS
      setTreats(t => t + burstAmount);
      setStats(s => ({ ...s, allTimeTreats: s.allTimeTreats + burstAmount, runTreats: (s.runTreats || 0) + burstAmount }));
      toast.success(`🍪 BROKJES UITBARSTING!`, {
        description: `+${formatTreatsDisplay(burstAmount)} brokjes direct in je pot!`
      });
    } else if (spell.type === 'summon_rare') {
      if (Math.random() > 0.5) {
        setMysticMouse({
          id: Date.now(),
          y: Math.floor(25 + Math.random() * 50),
          direction: Math.random() > 0.5 ? 'left' : 'right',
          expiresAt: Date.now() + 15000
        });
        toast.success(`🐭 Een Mystieke Muis gehoorzaamde je bezwering!`);
      } else {
        setCosmicCarp({
          id: Date.now(),
          y: Math.floor(20 + Math.random() * 55),
          direction: Math.random() > 0.5 ? 'left' : 'right',
          expiresAt: Date.now() + 15000
        });
        toast.success(`🐟 Een Kosmische Gouden Karper doorbrak de waterdimensie!`);
      }
    } else if (spell.type === 'rainbow_yarn') {
      setGoldenYarn({
        id: Date.now(),
        x: 50,
        y: 40,
        type: 'rainbow',
        expiresAt: Date.now() + 25000
      });
      setPurrProgress(100);
      const hasPurrMastery = ascensionUpgrades.find(u => u.id === 'purr_mastery')?.purchased;
      setPurrMultiplier(hasPurrMastery ? 3 : 2);
      toast.success(`🌈 REGENBOOG HARMONIE ONTSTOKEN!`, { description: 'Regenboog Garenbol gemanifesteerd & Purr gemaximaliseerd!' });
    }
  };

  // Perform Ascension (1 KP per 1 Miljard / 1 Billion brokjes)
  const handleAscend = () => {
    const gainedKP = Math.min(100, potentialKittyPoints);
    const currentThreshold = 1000000000; // Pas na 1 Miljard (1 Billion) brokjes

    if (gainedKP <= 0 || currentRunTreatsEarned < currentThreshold) {
      toast.error(`Je hebt minimaal 1.000.000.000 (1 Miljard / 1 Billion) brokjes in deze ronde nodig om op te stijgen en KP te verdienen!`);
      return;
    }

    const hasStarterTreats = ascensionUpgrades.find(u => u.id === 'starter_treats')?.purchased;
    const hasStarterTreats2 = ascensionUpgrades.find(u => u.id === 'start_cookies_2')?.purchased;
    const initialTreats = hasStarterTreats2 ? 1000 : (hasStarterTreats ? 100 : 0);

    // Update KP and stats
    setKittyPoints(kp => Math.min(100, kp + gainedKP));
    setStats(prev => ({
      ...prev,
      ascensionCount: prev.ascensionCount + 1,
      totalKittyPoints: Math.min(100, (prev.totalKittyPoints || 0) + gainedKP),
      runTreats: initialTreats
    }));

    // Reset progress cleanly
    setTreats(initialTreats);
    setBuildings(INITIAL_BUILDINGS.map(b => ({ ...b, count: 0 })));
    setUpgrades(INITIAL_UPGRADES.map(u => ({ ...u, purchased: false })));
    setMittens([]);
    setFrenzyUntil(0);
    setClickFrenzyUntil(0);
    setCarpSurgeUntil(0);
    setPurrMultiplier(1);
    setPurrProgress(0);
    setGoldenYarn(null);
    setMysticMouse(null);
    setCosmicCarp(null);
    nextMouseSpawnTime.current = Date.now() + 180000;
    nextCarpSpawnTime.current = Date.now() + 270000;
    nextGoldenYarnSpawnTime.current = Date.now() + 60000;
    nextRainbowSpawnTime.current = Date.now() + 600000;

    catAudio.playAscension();
    toast.success(`✨ HEMELVAART VOLTOOID! Je ontving +${gainedKP} Kitty Points! Spendeer ze nu in de Hemelse Katten Tempel!`, {
      duration: 6000
    });
  };

  // Buy Upgrade
  const handleBuyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return;

    if (treats < upgrade.cost) {
      toast.error(`Niet genoeg brokjes! Prijs: ${upgrade.cost.toLocaleString('nl-NL')}`);
      return;
    }

    setTreats(prev => prev - upgrade.cost);
    setUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        return { ...u, purchased: true };
      }
      return u;
    }));

    catAudio.playBuy();
    toast.success(`✨ Upgrade gekocht: ${upgrade.name}!`);
  };

  // Buy All Available Upgrades
  const handleBuyAllAvailableUpgrades = () => {
    let curTreats = treats;
    const toBuy = upgrades
      .filter(u => !u.purchased && stats.allTimeTreats >= u.requiredTreats && curTreats >= u.cost)
      .sort((a, b) => a.cost - b.cost);

    if (toBuy.length === 0) {
      toast.info(t('Geen beschikbare upgrades die je momenteel kunt betalen.'));
      return;
    }

    let totalSpent = 0;
    const boughtIds: string[] = [];
    for (const u of toBuy) {
      if (curTreats >= u.cost) {
        curTreats -= u.cost;
        totalSpent += u.cost;
        boughtIds.push(u.id);
      }
    }

    if (boughtIds.length > 0) {
      setTreats(curTreats);
      setUpgrades(prev => prev.map(u => boughtIds.includes(u.id) ? { ...u, purchased: true } : u));
      catAudio.playSparkle();
      toast.success(`✨ ${boughtIds.length} upgrades ontgrendeld! (-${formatRate(totalSpent)} 🍪)`);
    }
  };

  // Click Golden Yarn Ball
  const handleGoldenYarnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!goldenYarn) return;

    catAudio.playSparkle();
    const hasGoldenFrenzy = ascensionUpgrades.find(u => u.id === 'golden_frenzy')?.purchased;
    const hasFrenzySurge = ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased;
    const hasCelestialNet = ascensionUpgrades.find(u => u.id === 'celestial_net')?.purchased;
    const frenzyMult = hasGoldenFrenzy ? 1.5 : 1;
    const eventRewardMult = hasCelestialNet ? 2.5 : 1.0;
    const clicksToAdd = hasCelestialNet ? 5 : 1;

    if (goldenYarn.type === 'rainbow') {
      const tps = calculateTps();
      // Dynamic scaling: 90 seconds of TPS or 20% of bank, minimum 40 treats in early game
      const tpsBonus = Math.floor(tps * 90);
      const bankBonus = Math.floor(treats * 0.20);
      const reward = Math.floor(Math.max(40, Math.max(tpsBonus, bankBonus)) * eventRewardMult);
      const hasPurrMastery = ascensionUpgrades.find(u => u.id === 'purr_mastery')?.purchased;
      const maxPurrMult = hasPurrMastery ? 3 : 2;

      setTreats(prev => prev + reward);
      setPurrProgress(100);
      setPurrMultiplier(maxPurrMult);
      setStats(prev => ({
        ...prev,
        totalClicks: prev.totalClicks + clicksToAdd,
        allTimeTreats: prev.allTimeTreats + reward,
        runTreats: (prev.runTreats || 0) + reward,
        goldenYarnCaught: prev.goldenYarnCaught + 1,
        rainbowYarnCaught: (prev.rainbowYarnCaught || 0) + 1
      }));

      setFloatingTexts(prev => [
        ...prev,
        { id: nextParticleId.current++, x: goldenYarn.x, y: goldenYarn.y, text: `🌈 +${formatTreatsDisplay(reward)} (${clicksToAdd} kliks)`, color: 'text-fuchsia-300 font-black scale-125' }
      ]);

      catAudio.playPurr();
      toast('🌈 REGENBOOG EXPLOSIE!', {
        description: `+${reward.toLocaleString('nl-NL')} brokjes, +${clicksToAdd} kliks én directe 100% Super Spinnen status!`,
        duration: 5000
      });
    } else if (goldenYarn.type === 'frenzy') {
      const frenzyRate = hasFrenzySurge ? '10x' : '7x';
      setFrenzyUntil(Date.now() + 25000 * frenzyMult);
      setStats(prev => ({ 
        ...prev, 
        totalClicks: prev.totalClicks + clicksToAdd,
        goldenYarnCaught: prev.goldenYarnCaught + 1 
      }));
      toast('🌟 GOUDEN BOL: FRENZY PURR!', {
        description: `${frenzyRate} passieve brokjesproductie voor ${Math.round(25 * frenzyMult)} seconden! (+${clicksToAdd} kliks geteld)`,
        duration: 4000
      });
    } else if (goldenYarn.type === 'click_frenzy') {
      const clickRate = hasFrenzySurge ? '111x' : '77x';
      setClickFrenzyUntil(Date.now() + 15000 * frenzyMult);
      setStats(prev => ({ 
        ...prev, 
        totalClicks: prev.totalClicks + clicksToAdd,
        goldenYarnCaught: prev.goldenYarnCaught + 1 
      }));
      toast('⚡ GOUDEN BOL: KLIK EXPLOSIE!', {
        description: `${clickRate} klikkracht voor ${Math.round(15 * frenzyMult)} seconden! Tik zo snel als je kunt! (+${clicksToAdd} kliks geteld)`,
        duration: 4000
      });
    } else {
      // Lucky Treats: 10% of current bank or min 20
      const bonus = Math.floor(Math.max(20, Math.floor(treats * 0.10)) * eventRewardMult);
      setTreats(prev => prev + bonus);
      setStats(prev => ({
        ...prev,
        totalClicks: prev.totalClicks + clicksToAdd,
        allTimeTreats: prev.allTimeTreats + bonus,
        runTreats: (prev.runTreats || 0) + bonus,
        goldenYarnCaught: prev.goldenYarnCaught + 1
      }));
      toast('🍪 GOUDEN BOL: GELUKKIGE VANGST!', {
        description: `+${bonus.toLocaleString('nl-NL')} gratis brokjes direct ontvangen! (+${clicksToAdd} kliks geteld)`,
        duration: 4000
      });
    }

    if (goldenYarn.type === 'rainbow') {
      nextRainbowSpawnTime.current = Math.max(nextRainbowSpawnTime.current, Date.now() + 15 * 60 * 1000);
    }
    setGoldenYarn(null);
    const hasGoldenMagnet = ascensionUpgrades.find(u => u.id === 'golden_magnet')?.purchased;
    nextGoldenYarnSpawnTime.current = Math.max(nextGoldenYarnSpawnTime.current, Date.now() + (hasGoldenMagnet ? 45000 : 70000));
  };

  const handleMysticMouseClick = () => {
    if (!mysticMouse) return;

    const hasCelestialNet = ascensionUpgrades.find(u => u.id === 'celestial_net')?.purchased;
    const eventRewardMult = hasCelestialNet ? 2.5 : 1.0;
    const clicksToAdd = hasCelestialNet ? 5 : 1;

    const tps = calculateTps();
    // Dynamic scaling: 60 seconds of TPS or 15% of bank (whichever is greater), minimum 25 treats in early game
    const tpsBonus = Math.floor(tps * 60);
    const bankBonus = Math.floor(treats * 0.15);
    const reward = Math.floor(Math.max(25, Math.max(tpsBonus, bankBonus)) * eventRewardMult);
    
    setTreats(prev => prev + reward);
    setStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + clicksToAdd,
      allTimeTreats: prev.allTimeTreats + reward,
      runTreats: (prev.runTreats || 0) + reward,
      mysticMiceCaught: prev.mysticMiceCaught + 1
    }));
    
    setFloatingTexts(prev => [
      ...prev,
      { id: nextParticleId.current++, x: 50, y: mysticMouse.y, text: `🐭 +${formatTreatsDisplay(reward)} (+${clicksToAdd} kliks)`, color: 'text-fuchsia-400 font-black' }
    ]);
    
    toast('🐭 MYSTIEKE MUIS GEVANGEN!', {
      description: `Je katten vingen een slimme muis: +${reward.toLocaleString('nl-NL')} brokjes! (+${clicksToAdd} kliks bijgeteld)`,
      duration: 5000
    });
    
    catAudio.playSparkle();
    setMysticMouse(null);
    const hasLuckyCat = ascensionUpgrades.find(u => u.id === 'lucky_cat')?.purchased;
    nextMouseSpawnTime.current = Math.max(nextMouseSpawnTime.current, Date.now() + (hasLuckyCat ? 120000 : 240000));
  };

  // Click Cosmic Golden Carp
  const handleCosmicCarpClick = () => {
    if (!cosmicCarp) return;

    catAudio.playSparkle();
    const hasCelestialNet = ascensionUpgrades.find(u => u.id === 'celestial_net')?.purchased;
    const eventRewardMult = hasCelestialNet ? 2.5 : 1.0;
    const clicksToAdd = hasCelestialNet ? 5 : 1;

    const tps = calculateTps();
    // Dynamic scaling: 120 seconds of TPS or 20% of bank, minimum 50 treats in early game
    const tpsBonus = Math.floor(tps * 120);
    const bankBonus = Math.floor(treats * 0.20);
    const reward = Math.floor(Math.max(50, Math.max(tpsBonus, bankBonus)) * eventRewardMult);

    setTreats(prev => prev + reward);
    setCarpSurgeUntil(Date.now() + 15000); // 15 seconds Karper Vloedgolf (25x click power!)
    setStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + clicksToAdd,
      allTimeTreats: prev.allTimeTreats + reward,
      runTreats: (prev.runTreats || 0) + reward,
      cosmicCarpsCaught: (prev.cosmicCarpsCaught || 0) + 1
    }));

    setFloatingTexts(prev => [
      ...prev,
      { id: nextParticleId.current++, x: 50, y: cosmicCarp.y, text: `🐟 +${formatTreatsDisplay(reward)} (+${clicksToAdd} kliks)`, color: 'text-cyan-300 font-black' }
    ]);

    toast('🐟 KOSMISCHE GOUDEN KARPER GEVANGEN!', {
      description: `+${reward.toLocaleString('nl-NL')} brokjes, +${clicksToAdd} kliks & 25x Klikkracht Vloedgolf voor 15 seconden!`,
      duration: 5000
    });

    setCosmicCarp(null);
    const hasCosmicCarp = ascensionUpgrades.find(u => u.id === 'cosmic_carp')?.purchased;
    nextCarpSpawnTime.current = Math.max(nextCarpSpawnTime.current, Date.now() + (hasCosmicCarp ? 180000 : 360000));
  };

  // Reset Game Confirmation (Preserves personal best record)
  const handleResetGame = () => {
    // Preserve the highest record achieved so far as the new baseline
    const finalRecord = allTimeRecord;
    setPastBaselineRecord(finalRecord);
    setBestRecord(finalRecord);
    try {
      localStorage.setItem('ftjm_cat_clicker_past_baseline_v1', finalRecord.toString());
      localStorage.setItem('ftjm_cat_clicker_best_record_v1', finalRecord.toString());
      localStorage.setItem('ftjm_cat_clicker_persistent_record_v1', finalRecord.toString());
    } catch {}

    setTreats(0);
    setBuildings(INITIAL_BUILDINGS);
    setUpgrades(INITIAL_UPGRADES);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setStats({
      allTimeTreats: 0,
      runTreats: 0,
      totalClicks: 0,
      goldenYarnCaught: 0,
      rainbowYarnCaught: 0,
      cosmicCarpsCaught: 0,
      startTime: Date.now(),
      ascensionCount: 0,
      totalKittyPoints: 0,
      mysticMiceCaught: 0
    });
    setKittyPoints(0);
    setAscensionUpgrades(INITIAL_ASCENSION_UPGRADES);
    setMittens([]);
    setFrenzyUntil(0);
    setClickFrenzyUntil(0);
    setCarpSurgeUntil(0);
    setPurrMultiplier(1);
    setPurrProgress(0);
    setSelectedSkinId('orange');
    setShowResetConfirm(false);
    setGoldenYarn(null);
    setMysticMouse(null);
    setCosmicCarp(null);
    setPantheonSlots({ diamond: null, ruby: null, jade: null });
    setMeowMana(100);
    nextMouseSpawnTime.current = Date.now() + 180000;
    nextCarpSpawnTime.current = Date.now() + 270000;
    nextGoldenYarnSpawnTime.current = Date.now() + 60000;
    nextRainbowSpawnTime.current = Date.now() + 600000;

    try {
      const resetSaveData = {
        treats: 0,
        buildings: INITIAL_BUILDINGS,
        upgrades: INITIAL_UPGRADES,
        achievements: INITIAL_ACHIEVEMENTS,
        stats: {
          allTimeTreats: 0,
          runTreats: 0,
          totalClicks: 0,
          goldenYarnCaught: 0,
          rainbowYarnCaught: 0,
          cosmicCarpsCaught: 0,
          startTime: Date.now(),
          ascensionCount: 0,
          totalKittyPoints: 0,
          mysticMiceCaught: 0,
          pantheonSlotsFilled: 0,
          spellsCast: 0
        },
        kittyPoints: 0,
        ascensionUpgrades: INITIAL_ASCENSION_UPGRADES,
        mittens: [],
        selectedSkinId: 'orange',
        pantheonSlots: { diamond: null, ruby: null, jade: null },
        meowMana: 100,
        bestRecord: finalRecord,
        pastBaselineRecord: finalRecord,
        lastSavedAt: Date.now()
      };
      localStorage.setItem('ftjm_cat_clicker_save_v1', JSON.stringify(resetSaveData));
    } catch {}

    toast.success(`Katten Clicker gereset! Je record blijft behouden op ${finalRecord.toLocaleString('nl-NL')} brokjes!`);
  };

  // Active Skin Object
  const currentSkin = CAT_SKINS.find(s => s.id === selectedSkinId) || CAT_SKINS[0];
  const tps = calculateTps();
  const clickPower = calculateClickPower();
  const totalHelpers = buildings.reduce((acc, b) => acc + b.count, 0);
  const templeCount = buildings.find(b => b.id === 'cat_temple')?.count || 0;
  const portalCount = buildings.find(b => b.id === 'dimension_portal')?.count || 0;
  const availableUpgradesCount = upgrades.filter(u => !u.purchased && treats >= u.cost && stats.allTimeTreats >= u.requiredTreats).length;
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;
  const currentRunTreatsEarned = Math.max(
    typeof stats.runTreats === 'number' ? stats.runTreats : 0,
    treats || 0
  );
  const potentialKittyPoints = calculateKittyPointsForTreats(currentRunTreatsEarned);

  const formatTreatsDisplay = (val: number) => {
    const rounded = Math.floor(val);
    if (rounded < 1_000_000) {
      return rounded.toLocaleString('nl-NL');
    } else if (rounded < 1_000_000_000) {
      return (rounded / 1_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Miljoen';
    } else if (rounded < 1_000_000_000_000) {
      return (rounded / 1_000_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Miljard (Billion)';
    } else if (rounded < 1_000_000_000_000_000) {
      return (rounded / 1_000_000_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Biljoen (Trillion)';
    } else if (rounded < 1e18) {
      return (rounded / 1e15).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Biljard (Quadrillion)';
    } else if (rounded < 1e21) {
      return (rounded / 1e18).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Triljoen (Quintillion)';
    } else if (rounded < 1e24) {
      return (rounded / 1e21).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Triljard (Sextillion)';
    } else {
      return (rounded / 1e24).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Quadriljoen (Septillion)';
    }
  };

  const formatRate = (val: number) => {
    if (val < 1_000) {
      return val.toLocaleString('nl-NL', { maximumFractionDigits: 1 });
    } else if (val < 1_000_000) {
      return val.toLocaleString('nl-NL', { maximumFractionDigits: 0 });
    } else if (val < 1_000_000_000) {
      return (val / 1_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + 'M';
    } else if (val < 1_000_000_000_000) {
      return (val / 1_000_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' B (Miljard)';
    } else if (val < 1e15) {
      return (val / 1e12).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' T (Biljoen)';
    } else if (val < 1e18) {
      return (val / 1e15).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Qa (Biljard)';
    } else {
      return (val / 1e18).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Qi (Triljoen)';
    }
  };

  // RENDER SECTIONS
  const renderBuildingsStore = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
        <div>
          <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span>Katten Hulpjes Winkel</span>
          </h3>
          <p className="text-[10px] text-app-muted font-mono">
            Totaal TPS: +{formatRate(tps)}/sec
          </p>
        </div>

        {/* Bulk Multiplier Switcher */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-app-border/60">
          <span className="text-[10px] text-app-muted font-mono font-bold px-1 hidden sm:inline">Koop:</span>
          {([1, 10, 100] as const).map(mult => (
            <button
              key={mult}
              onClick={() => setBuyMultiplier(mult)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                buyMultiplier === mult
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {mult}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2.5 min-h-0 pb-16 lg:pb-6">
        {(() => {
          const standardList = buildings.filter(b => !b.isAscensionExclusive);
          let shownMysteryTeaser = false;

          return buildings.map(building => {
            // 1. Ascension-Exclusive Buildings:
            if (building.isAscensionExclusive) {
              const isAscensionUnlocked = !building.requiresAscensionUpgrade || ascensionUpgrades.find(u => u.id === building.requiresAscensionUpgrade)?.purchased;

              // Hide endgame celestial buildings completely if player has never ascended yet
              if (stats.ascensionCount === 0 && !isAscensionUnlocked) {
                return null;
              }

              // Locked Ascension Sanctuary Card (only shown for players who have ascended before)
              if (!isAscensionUnlocked) {
                const reqUpgrade = ascensionUpgrades.find(u => u.id === building.requiresAscensionUpgrade);
                return (
                  <div
                    key={building.id}
                    onClick={() => setShowAscensionModal(true)}
                    className="p-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-black/40 to-amber-950/20 shadow-md flex items-center justify-between cursor-pointer hover:border-amber-400/80 transition-all select-none group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner shrink-0 text-amber-300">
                        🔒
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-amber-200 truncate font-mono">
                            {building.emoji} {t(building.name)}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider shrink-0">
                            {t("Hemels Heiligdom")}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {t(building.description)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-amber-300/90">
                          <span>✨ {t("Vereist")}:</span>
                          <strong className="underline decoration-amber-400/60">{reqUpgrade?.name || 'Hemelvaart Upgrade'}</strong>
                          <span className="text-zinc-500 hidden sm:inline">({t("Tik om Hemelse Boom te openen")})</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAscensionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider bg-gradient-to-r from-amber-500/30 to-amber-400/20 hover:from-amber-400 hover:to-yellow-300 hover:text-black text-amber-200 border border-amber-400/60 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      >
                        🪽 {t("Bekijk in Boom")}
                      </button>
                    </div>
                  </div>
                );
              }
            }

            // 2. Standard Progression Buildings (Cookie Clicker Progressive Discovery):
            if (!building.isAscensionExclusive) {
              const stdIdx = standardList.findIndex(b => b.id === building.id);
              const prev = stdIdx > 0 ? standardList[stdIdx - 1] : null;

              // Building is revealed if:
              // - Already owned at least 1
              // - Or is the first or second building (Katten Cursors, Krabpaal)
              // - Or previous building is owned (count > 0)
              // - Or player has earned at least 15% of its baseCost in allTimeTreats
              const isRevealed = building.count > 0 ||
                stdIdx <= 1 ||
                (prev && prev.count > 0) ||
                stats.allTimeTreats >= building.baseCost * 0.15;

              if (!isRevealed) {
                // Exactly ONE mystery building teaser is shown ahead ("???")
                if (!shownMysteryTeaser) {
                  shownMysteryTeaser = true;
                  return (
                    <div
                      key={`mystery-${building.id}`}
                      className="p-3 rounded-2xl border border-dashed border-app-border/80 bg-app-accent/20 opacity-70 flex items-center justify-between select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-app-accent/70 border border-app-border/40 flex items-center justify-center text-xl text-app-muted shadow-inner shrink-0 font-mono">
                          ❓
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-app-muted tracking-widest font-mono">
                              ???
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-app-muted font-mono text-[9px] font-bold border border-app-border/30">
                              {t("Vergrendeld")}
                            </span>
                          </div>
                          <p className="text-[11px] text-app-muted/80 line-clamp-1 mt-0.5">
                            {t("Spaar meer brokjes om dit geheime gebouw te ontdekken...")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <div className="text-xs font-mono font-bold text-app-muted">
                          {formatRate(building.baseCost)} 🍪
                        </div>
                        <span className="inline-block mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-app-accent text-app-muted cursor-not-allowed">
                          🔒 {t("Vergrendeld")}
                        </span>
                      </div>
                    </div>
                  );
                }
                // Later buildings after the first mystery teaser are COMPLETELY HIDDEN!
                return null;
              }
            }

            const cost = getBuildingCost(building, buyMultiplier);
            const canAfford = treats >= cost;
            const currentSingleTps = getBuildingTpsSingle(building.id, building.baseTps, true);
            const totalTpsBuilding = currentSingleTps * buyMultiplier;
            const rawBaseTotal = building.baseTps * buyMultiplier;
            const hasMultipliers = Math.abs(totalTpsBuilding - rawBaseTotal) > 0.05;
            const isAscensionExclusive = building.isAscensionExclusive;

            return (
              <div
                key={building.id}
                onClick={() => handleBuyBuilding(building.id, buyMultiplier)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                  isAscensionExclusive
                    ? canAfford
                      ? 'bg-gradient-to-r from-amber-500/20 via-app-card to-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-300 hover:border-amber-300 active:scale-[0.99]'
                      : 'bg-app-card/60 border-amber-500/40 opacity-80 hover:opacity-95'
                    : canAfford
                    ? 'bg-gradient-to-r from-amber-500/10 via-app-card to-app-card border-amber-500/70 dark:border-amber-400/70 shadow-[0_0_16px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/30 hover:border-amber-400 active:scale-[0.99]'
                    : 'bg-app-card/40 border-app-border/40 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${
                    isAscensionExclusive ? 'bg-amber-500/25 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-app-accent'
                  }`}>
                    {building.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-app-ink truncate">
                        {t(building.name)}
                      </h4>
                      {isAscensionExclusive && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[9px] font-black border border-amber-400/40 shrink-0">
                          ✨ {t("Hemels")}
                        </span>
                      )}
                      {building.count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono text-[10px] font-black border border-cyan-500/20 shrink-0">
                          {building.count}x
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-app-muted line-clamp-1 mt-0.5">
                      {t(building.description)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <p className="text-[10px] text-emerald-500 font-mono font-bold">
                        +{formatRate(totalTpsBuilding)} {t("brokjes/sec")} ({buyMultiplier}x)
                      </p>
                      {hasMultipliers && (
                        <span className="text-[9px] text-app-muted font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.2 rounded" title={`Basis zonder actieve bonussen: +${formatRate(rawBaseTotal)}/sec`}>
                          basis: +{formatRate(rawBaseTotal)}
                        </span>
                      )}
                    </div>
                    {building.id === 'kitten' && building.count > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDesktopCenterTab('mittens');
                          setActiveTab('mittens');
                        }}
                        className="mt-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 w-fit transition-all cursor-pointer"
                      >
                        <span>🧤</span>
                        <span>{t("Open Mittens Lounge")} ({mittens.length}) →</span>
                      </button>
                    )}
                    {building.id === 'cat_temple' && building.count > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDesktopCenterTab('pantheon');
                          setActiveTab('pantheon');
                        }}
                        className="mt-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 w-fit transition-all cursor-pointer"
                      >
                        <span>🏛️</span>
                        <span>{t("Naar Pantheon Geesten")} →</span>
                      </button>
                    )}
                    {building.id === 'dimension_portal' && building.count > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDesktopCenterTab('grimoire');
                          setActiveTab('grimoire');
                        }}
                        className="mt-1 px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1 w-fit transition-all cursor-pointer"
                      >
                        <span>📖</span>
                        <span>{t("Naar Dimensie Grimoire")} ({Math.floor(meowMana)} MP) →</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <div className={`text-xs font-mono font-black ${canAfford ? 'text-amber-500' : 'text-app-muted'}`}>
                    {formatRate(cost)} 🍪
                  </div>
                  <button
                    disabled={!canAfford}
                    className={`mt-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-sm cursor-pointer'
                        : 'bg-app-accent text-app-muted cursor-not-allowed'
                    }`}
                  >
                    {t("Koop")} {buyMultiplier}x
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );

  const renderKingdomContent = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKingdomSubTab('overview')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              kingdomSubTab === 'overview'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
            }`}
          >
            <span>🏰</span>
            <span>{t("Rijk")} ({totalHelpers})</span>
          </button>
          <button
            onClick={() => setKingdomSubTab('mittens')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              kingdomSubTab === 'mittens'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
            }`}
          >
            <span>🐾</span>
            <span>Mittens ({mittens.length})</span>
          </button>
          <button
            onClick={() => setKingdomSubTab('pantheon')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              kingdomSubTab === 'pantheon'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
            }`}
          >
            <span>🏛️</span>
            <span>Pantheon</span>
            {templeCount === 0 && <Lock className="w-3 h-3 text-app-muted/60" />}
          </button>
          <button
            onClick={() => setKingdomSubTab('grimoire')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              kingdomSubTab === 'grimoire'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
            }`}
          >
            <span>📖</span>
            <span>Grimoire</span>
            {portalCount === 0 && <Lock className="w-3 h-3 text-app-muted/60" />}
          </button>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 bg-black/10 rounded-lg border border-app-border/50">
          +{formatRate(tps)}/{t("sec")}
        </span>
      </div>

      {kingdomSubTab === 'mittens' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
          <MittensList 
            mittens={mittens} 
            treats={treats}
            hasMittenOverdrive={ascensionUpgrades.some(u => u.id === 'mitten_overdrive' && u.purchased)}
            onPetMitten={handlePetMitten} 
            onUpgradeMitten={handleUpgradeMitten}
            onUpgradeAllMittens={handleUpgradeAllMittens}
            formatRate={formatRate}
          />
        </div>
      ) : kingdomSubTab === 'pantheon' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
          <PantheonView
            templeCount={templeCount}
            slots={pantheonSlots}
            onAssignSlot={handleAssignPantheonSlot}
            onOpenStore={() => setActiveTab('buildings')}
          />
        </div>
      ) : kingdomSubTab === 'grimoire' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
          <GrimoireView
            portalCount={portalCount}
            mana={meowMana}
            maxMana={maxMeowMana}
            onCastSpell={handleCastSpell}
            onOpenStore={() => setActiveTab('buildings')}
            formatRate={formatRate}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4 min-h-0 pb-16 lg:pb-6">
          {totalHelpers === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-4xl mb-3">🐱💤</span>
              <p className="text-sm font-bold text-app-ink">{t("Je kattenrijk is nog leeg...")}</p>
              <p className="text-xs text-app-muted mt-1">{t("Koop kittens en hulpjes in de winkel om ze hier te zien werken!")}</p>
            </div>
          ) : (
            buildings.map(b => b.count > 0 && (
              <div key={b.id} className="relative group bg-app-card/60 p-3 rounded-2xl border border-app-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black uppercase text-app-muted tracking-wider">{t(b.name)}</span>
                  <div className="h-[1px] flex-1 bg-app-border/50 group-hover:bg-amber-500/30 transition-colors" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-app-accent px-1.5 py-0.5 rounded shadow-sm">
                    +{formatRate(getBuildingTpsSingle(b.id, b.baseTps, true) * b.count)}/{t("sec")}
                  </span>
                  <span className="text-[10px] font-mono text-app-ink font-bold bg-app-accent px-1.5 py-0.5 rounded shadow-sm">
                    {b.count}x
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 bg-black/5 dark:bg-black/20 rounded-xl p-2.5 border border-app-border/30 shadow-inner min-h-[3.5rem] items-center">
                  {Array.from({ length: Math.min(b.count, 48) }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8 + (i % 5) * 0.3,
                        ease: 'easeInOut',
                        delay: (i % 10) * 0.1
                      }}
                      className="text-2xl leading-none drop-shadow-md hover:scale-125 hover:-translate-y-1 transition-transform cursor-pointer"
                      title={`${t(b.name)} ${t("aan het klikken!")}`}
                    >
                      {b.emoji}
                    </motion.div>
                  ))}
                  {b.count > 48 && (
                    <div className="text-xs font-bold text-app-ink flex items-center justify-center px-2 py-1 bg-app-accent rounded-xl shadow-sm border border-app-border/50 ml-1">
                      +{b.count - 48} {t("meer")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderUpgradesContent = () => {
    const purchasedCount = upgrades.filter(u => u.purchased).length;
    const lockedCount = upgrades.filter(u => !u.purchased && stats.allTimeTreats < u.requiredTreats).length;
    
    const filteredUpgrades = upgrades.filter(u => {
      const isUnlocked = stats.allTimeTreats >= u.requiredTreats;
      const canAfford = !u.purchased && isUnlocked && treats >= u.cost;

      if (upgradeFilter === 'available') {
        if (!canAfford) return false;
      } else if (upgradeFilter === 'purchased') {
        if (!u.purchased) return false;
      } else if (upgradeFilter === 'locked') {
        if (isUnlocked || u.purchased) return false;
      }

      if (upgradeSearch.trim()) {
        const q = upgradeSearch.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Header with counts and Quick Buy All */}
        <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-app-ink tracking-tight">
              {t("Katten Upgrades")} ({purchasedCount}/{upgrades.length})
            </h3>
            {availableUpgradesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black font-mono animate-pulse">
                {availableUpgradesCount} {t("beschikbaar")}
              </span>
            )}
          </div>

          {availableUpgradesCount > 0 && (
            <button
              onClick={handleBuyAllAvailableUpgrades}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("Koop Alle Beschikbare")} ({availableUpgradesCount})</span>
            </button>
          )}
        </div>

        {/* Filter Bar & Search */}
        <div className="px-3 py-2 border-b border-app-border bg-app-card/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setUpgradeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                upgradeFilter === 'all'
                  ? 'bg-amber-500 text-black'
                  : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
              }`}
            >
              {t("Alle")} ({upgrades.length})
            </button>
            <button
              onClick={() => setUpgradeFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                upgradeFilter === 'available'
                  ? 'bg-amber-500 text-black font-black shadow-sm'
                  : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
              }`}
            >
              <span>{t("Koopbaar")}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${upgradeFilter === 'available' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-500 font-mono'}`}>
                {availableUpgradesCount}
              </span>
            </button>
            <button
              onClick={() => setUpgradeFilter('purchased')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                upgradeFilter === 'purchased'
                  ? 'bg-amber-500 text-black'
                  : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
              }`}
            >
              {t("Gekocht")} ({purchasedCount})
            </button>
            <button
              onClick={() => setUpgradeFilter('locked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                upgradeFilter === 'locked'
                  ? 'bg-amber-500 text-black'
                  : 'bg-app-accent hover:bg-app-accent/80 text-app-muted'
              }`}
            >
              {t("Vergrendeld")} ({lockedCount})
            </button>
          </div>

          <div className="relative min-w-[140px] max-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
            <input
              type="text"
              placeholder={t("Zoek upgrade...")}
              value={upgradeSearch}
              onChange={(e) => setUpgradeSearch(e.target.value)}
              className="w-full bg-app-accent/60 border border-app-border rounded-lg pl-8 pr-2 py-1 text-xs text-app-ink placeholder:text-app-muted focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Upgrades List Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
          {filteredUpgrades.length === 0 ? (
            <div className="p-8 text-center text-app-muted">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-app-muted/50" />
              <p className="text-xs font-bold">{t("Geen upgrades gevonden voor dit filter.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2.5">
              {filteredUpgrades.map(upgrade => {
                const isUnlocked = stats.allTimeTreats >= upgrade.requiredTreats;
                const canAfford = !upgrade.purchased && isUnlocked && treats >= upgrade.cost;

                if (!isUnlocked && !upgrade.purchased) {
                  return (
                    <div
                      key={upgrade.id}
                      className="p-3 rounded-2xl border border-app-border/40 bg-app-card/20 opacity-50 flex items-center gap-3 select-none"
                    >
                      <div className="w-11 h-11 rounded-xl bg-app-accent flex items-center justify-center text-app-muted shrink-0 text-lg font-mono">
                        🔒
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-app-muted truncate">{t("Vergrendelde Upgrade")}</p>
                        <p className="text-[10px] font-mono text-app-muted/80 mt-0.5 truncate">
                          {t("Vereist")} {upgrade.requiredTreats.toLocaleString('nl-NL')} {t("totale brokjes")}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={upgrade.id}
                    onClick={() => canAfford && handleBuyUpgrade(upgrade.id)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 select-none ${
                      upgrade.purchased
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-500/15 via-app-card to-app-card border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50 cursor-pointer active:scale-[0.99] hover:border-amber-300 hover:shadow-[0_0_26px_rgba(245,158,11,0.4)]'
                        : 'bg-app-card/50 border-app-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-app-accent flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {upgrade.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                          <h4 className="text-xs sm:text-sm font-black text-app-ink truncate">
                            {t(upgrade.name)}
                          </h4>
                          {upgrade.purchased && (
                            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t("Gekocht")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-app-muted mt-0.5 leading-snug line-clamp-2">
                          {t(upgrade.description)}
                        </p>
                      </div>
                    </div>

                    {!upgrade.purchased && (
                      <div className="mt-1 pt-2 border-t border-app-border/40 flex items-center justify-between gap-2">
                        <span className={`text-xs font-mono font-black ${canAfford ? 'text-amber-400' : 'text-amber-500'}`}>
                          {formatRate(upgrade.cost)} 🍪
                        </span>
                        <button
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black shadow-md shadow-amber-500/30 cursor-pointer animate-pulse'
                              : 'bg-app-accent text-app-muted cursor-not-allowed'
                          }`}
                        >
                          ✨ {t("Ontgrendel")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAchievementsContent = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
        <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          <span>{t("Katten Trofeeën")} ({unlockedAchievementsCount}/{achievements.length})</span>
        </h3>
        <span className="text-xs font-mono text-purple-400 font-bold px-2 py-0.5 bg-black/10 rounded-lg border border-purple-500/20">
          +{unlockedAchievementsCount}% {t("Wereldwijde Bonus")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                ach.unlocked
                  ? 'bg-purple-500/10 border-purple-500/30 text-app-ink'
                  : 'bg-app-card/20 border-app-border/30 opacity-40'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                ach.unlocked ? 'bg-purple-500/20 shadow-md shadow-purple-500/10' : 'bg-app-accent'
              }`}>
                {ach.unlocked ? ach.emoji : '🔒'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-app-ink truncate">
                    {t(ach.title)}
                  </h4>
                  {ach.unlocked && (
                    <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                      (+1%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-app-muted mt-0.5 line-clamp-2">
                  {t(ach.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatsContent = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
        <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Statistieken & Leaderboard</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4 min-h-0 pb-16 lg:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-bold">Persoonlijk Record</span>
            <p className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5" title={`${allTimeRecord.toLocaleString('nl-NL')} brokjes`}>
              {formatTreatsDisplay(allTimeRecord)} 🏆
            </p>
          </div>

          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/30">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">Trofeeën Bonus</span>
            <p className="text-sm sm:text-base font-black text-purple-300 font-mono mt-0.5">
              {unlockedAchievementsCount}/{achievements.length} (+{unlockedAchievementsCount}%) 🏆
            </p>
          </div>

          <div className="p-3 bg-app-accent/40 rounded-2xl border border-app-border">
            <span className="text-[10px] font-mono text-app-muted uppercase tracking-wider">Huidige Ronde Brokjes</span>
            <p className="text-sm sm:text-base font-black text-app-ink font-mono mt-0.5" title={`${Math.floor(currentRunTreatsEarned).toLocaleString('nl-NL')} brokjes`}>
              {formatTreatsDisplay(currentRunTreatsEarned)} 🐾
            </p>
          </div>

          <div className="p-3 bg-app-accent/40 rounded-2xl border border-app-border">
            <span className="text-[10px] font-mono text-app-muted uppercase tracking-wider">Aantal Kliks</span>
            <p className="text-sm sm:text-base font-black text-app-ink font-mono mt-0.5">
              {stats.totalClicks.toLocaleString('nl-NL')} 👆
            </p>
          </div>

          <div className="p-3 bg-app-accent/40 rounded-2xl border border-app-border">
            <span className="text-[10px] font-mono text-app-muted uppercase tracking-wider">Gouden Bollen Wol</span>
            <p className="text-sm sm:text-base font-black text-amber-500 font-mono mt-0.5">
              {stats.goldenYarnCaught || 0} 🧶
            </p>
          </div>

          <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/30">
            <span className="text-[10px] font-mono text-pink-400 uppercase tracking-wider">Regenboog Bollen</span>
            <p className="text-sm sm:text-base font-black text-pink-300 font-mono mt-0.5">
              {stats.rainbowYarnCaught || 0} 🌈
            </p>
          </div>

          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Kosmische Karpers</span>
            <p className="text-sm sm:text-base font-black text-cyan-300 font-mono mt-0.5">
              {stats.cosmicCarpsCaught || 0} 🐟
            </p>
          </div>

          <div className="p-3 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/30">
            <span className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-wider">Mystieke Muizen</span>
            <p className="text-sm sm:text-base font-black text-fuchsia-300 font-mono mt-0.5">
              {stats.mysticMiceCaught || 0} 🐭
            </p>
          </div>

          <div className="p-3 bg-app-accent/40 rounded-2xl border border-app-border">
            <span className="text-[10px] font-mono text-app-muted uppercase tracking-wider">Hemelvaarten</span>
            <p className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">
              {stats.ascensionCount || 0} ✨
            </p>
          </div>
        </div>

        {/* Cloud High Score Sync Card */}
        <div className="p-4 bg-app-card border border-app-border rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black text-app-ink uppercase tracking-wide">
                FTJM High Score Synchronisatie
              </h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-500 font-bold">
              Arcade Leaderboard
            </span>
          </div>
          
          <p className="text-xs text-app-muted">
            Je persoonlijke recordscore ({formatTreatsDisplay(allTimeRecord)} brokjes) blijft altijd bewaard, zelfs na een reset! Verbreek je record door in een run nog meer brokjes te oogsten.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            {onSaveHighScore && (
              <button
                onClick={handleManualSaveScore}
                disabled={isSavingScore || allTimeRecord === 0}
                className="w-full sm:flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSavingScore ? 'animate-bounce' : ''}`} />
                {isSavingScore ? 'Opslaan...' : 'Sla Score Handmatig Op'}
              </button>
            )}

            {onShareHighScoreOpen && (
              <button
                onClick={() => onShareHighScoreOpen('catclicker', allTimeRecord)}
                className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Deel in Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col font-primary select-none overflow-hidden relative rounded-2xl sm:rounded-3xl border border-app-border bg-app-bg shadow-sm">
      {/* 1. Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-app-card border-b border-app-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">🐱</span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-app-ink tracking-tight uppercase leading-none">
                Katten Clicker
              </h2>
              <p className="text-[10px] text-app-muted font-mono mt-0.5">Cat Empire Pro</p>
            </div>
          </div>
        </div>

        {/* Header Right: Stats & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Ascension / Hemelvaart Button with Heavenly Glow & Particle FX */}
          <div className="relative group">
            {/* Heavenly Radiant Gold Halo Aura (Active when 1 Billion / potential Kitty Points reached in this run) */}
            {(potentialKittyPoints > 0 || currentRunTreatsEarned >= 1000000000) && (
              <>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 blur-md opacity-85 animate-pulse pointer-events-none" />
                
                {/* Floating Heavenly Sparkles */}
                <motion.span
                  animate={{ y: [-2, -14, -2], opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                  className="absolute -top-2 left-1 text-xs pointer-events-none z-20"
                >
                  ✨
                </motion.span>
                <motion.span
                  animate={{ y: [-1, -16, -1], opacity: [0, 1, 0], scale: [0.5, 1.1, 0.5] }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                  className="absolute -top-3 right-2 text-xs pointer-events-none z-20"
                >
                  ⭐
                </motion.span>
                <motion.span
                  animate={{ y: [0, -12, 0], opacity: [0, 0.9, 0], scale: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                  className="absolute -bottom-2 right-1 text-[10px] pointer-events-none z-20"
                >
                  🪽
                </motion.span>
              </>
            )}

            <button
              onClick={() => setShowAscensionModal(true)}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer border ${
                potentialKittyPoints > 0 && currentRunTreatsEarned >= 1000000000
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] font-black hover:scale-105 active:scale-95 ring-2 ring-amber-300/80 ring-offset-1 ring-offset-zinc-950'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 border-purple-400/40 shadow-sm hover:shadow-md'
              }`}
              title={
                currentRunTreatsEarned < 1000000000 && kittyPoints === 0
                  ? "Hemelvaart ontgrendelt pas na 1 Miljard (1 Billion) brokjes!"
                  : "Hemelvaart & Katten Tempel (Kitty Points)"
              }
            >
              {currentRunTreatsEarned < 1000000000 && kittyPoints === 0 ? (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Sparkles className={`w-3.5 h-3.5 ${potentialKittyPoints > 0 ? 'text-black animate-spin' : 'text-amber-300 animate-pulse'}`} />
              )}
              <span className="hidden sm:inline">{t("Hemelvaart")}</span>
              {kittyPoints > 0 ? (
                <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded-lg text-[10px] font-black shadow-inner">
                  {kittyPoints.toLocaleString('nl-NL')} KP
                </span>
              ) : potentialKittyPoints > 0 ? (
                <span className="bg-black text-amber-300 border border-amber-400 px-1.5 py-0.5 rounded-lg text-[10px] font-black animate-pulse shadow-md">
                  +{potentialKittyPoints.toLocaleString('nl-NL')} KP
                </span>
              ) : (
                <span className="bg-black/40 text-amber-300/80 px-1.5 py-0.5 rounded-lg text-[9px] font-mono">
                  1B 🔒
                </span>
              )}
            </button>
          </div>

          {/* High Score Badge & Manual Sync (Always visible and counts continuously) */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span
              className="text-[11px] sm:text-xs font-mono font-bold text-amber-500 whitespace-nowrap"
              title={`${allTimeRecord.toLocaleString('nl-NL')} brokjes`}
            >
              Record: {formatTreatsDisplay(allTimeRecord)}
            </span>
            {onSaveHighScore && allTimeRecord > 0 && (
              <button
                onClick={handleManualSaveScore}
                disabled={isSavingScore}
                className="ml-1 p-1 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                title="Sla je record handmatig op naar profiel"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSavingScore ? "animate-bounce" : ""}`} />
              </button>
            )}
          </div>

          {/* Share Highscore */}
          {onShareHighScoreOpen && allTimeRecord > 0 && (
            <button
              onClick={() => onShareHighScoreOpen('catclicker', allTimeRecord)}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Deel je highscore in chat"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Deel Score</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl text-xs font-bold transition-all cursor-pointer"
            title={soundEnabled ? 'Geluid dempen' : 'Geluid aanzetten'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4 text-app-muted" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Spel opnieuw beginnen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STEADY TOP STAGE: Cat Click Button & Live Cookie Display */}
      <div className="w-full bg-app-card/95 border-b border-app-border shrink-0 px-3 sm:px-6 py-2.5 shadow-sm relative z-20 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Steady Click Button & Cookies Display */}
          <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
            
            {/* THE CAT CLICKER BUTTON (Only on mobile/tablet; desktop has the big stage cat in column 1) */}
            <div
              ref={catContainerRef}
              onClick={handleCatClick}
              role="button"
              tabIndex={0}
              title="Klik op de kat om brokjes te oogsten!"
              className="relative group cursor-pointer select-none shrink-0 lg:hidden"
            >
              {/* Pulsing ring around cat */}
              <div 
                className={`absolute -inset-1 rounded-full transition-opacity duration-300 blur-md pointer-events-none ${
                  isClickingCat ? 'opacity-90 scale-110' : 'opacity-40 group-hover:opacity-75'
                }`}
                style={{ background: currentSkin.bgGlow }}
              />

              {/* Cat Avatar Circle Button */}
              <motion.div
                animate={isClickingCat ? { scale: [1, 0.88, 1.08, 1], rotate: [0, -4, 4, 0] } : { scale: [1, 1.02, 1] }}
                transition={isClickingCat ? { duration: 0.16 } : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 via-app-accent to-black/30 flex items-center justify-center relative shadow-lg overflow-visible"
              >
                {/* Mini orbiting cursors on top stage avatar */}
                {(buildings.find(b => b.id === 'kitten')?.count || 0) > 0 && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                    className="absolute -inset-2.5 rounded-full pointer-events-none flex items-center justify-center"
                  >
                    <span className="absolute -top-1 text-[11px] filter drop-shadow">🐾</span>
                    <span className="absolute -bottom-1 text-[11px] filter drop-shadow">🐾</span>
                    <span className="absolute -left-1 text-[11px] filter drop-shadow">🐾</span>
                    <span className="absolute -right-1 text-[11px] filter drop-shadow">🐾</span>
                  </motion.div>
                )}

                <span className="text-3xl sm:text-4xl filter drop-shadow-md select-none transform group-hover:scale-110 transition-transform">
                  {currentSkin.emoji}
                </span>

                {/* Tactile Click Badge */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full shadow-md font-mono whitespace-nowrap border border-white/40">
                  KLIK!
                </span>
              </motion.div>

              {/* Floating Numbers floating upward from cat avatar */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-visible">
                {floatingTexts.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1, y: item.y || 0, x: item.x || 0, scale: 0.85 }}
                    animate={{ opacity: 0, y: (item.y || 0) - 60, scale: 1.2 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className={`absolute pointer-events-none text-sm font-mono font-black drop-shadow-md whitespace-nowrap select-none ${item.color}`}
                  >
                    {item.text}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* LIVE COOKIE BALANCE & RATES */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1">
                  <span>VOORRAAD BROKJES</span>
                  <span className="text-sm">🍪</span>
                </span>
                {purrMultiplier > 1 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold font-mono border border-rose-500/30 animate-pulse">
                    😻 {purrMultiplier}x Purr!
                  </span>
                )}
              </div>

              {/* Cookie Counter Number */}
              <div className="flex items-baseline gap-2 mt-0.5">
                <h1 
                  title={`${Math.floor(treats).toLocaleString("nl-NL")} brokjes`}
                  className="text-2xl sm:text-3xl md:text-4xl font-black text-app-ink tracking-tight font-mono whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {formatTreatsDisplay(treats)}
                </h1>
                <span className="text-xs sm:text-sm font-bold text-amber-500 font-mono shrink-0">
                  cookies
                </span>
              </div>

              {/* Production Rates */}
              <div className="flex items-center gap-3 text-xs font-mono mt-0.5 text-app-muted">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-bold">+{formatRate(tps)}</span>/sec
                </span>
                <span className="text-app-border">•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-400 font-bold">+{formatRate(clickPower)}</span>/klik
                </span>
              </div>
            </div>
          </div>

          {/* Right: Active Buffs, Purr Meter, Skin Switcher & Golden Yarn */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Golden or Rainbow Yarn Catch Button (when active) */}
            {goldenYarn && (
              <motion.button
                initial={{ scale: 0.85 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                onClick={handleGoldenYarnClick}
                className={`px-3 py-1.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 border border-white/60 cursor-pointer animate-pulse shrink-0 ${
                  goldenYarn.type === 'rainbow'
                    ? 'bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 text-black shadow-pink-500/40'
                    : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-amber-500/30'
                }`}
              >
                <span className="text-base">{goldenYarn.type === 'rainbow' ? '🌈' : '🧶'}</span>
                <span>{goldenYarn.type === 'rainbow' ? 'VANG REGENBOOG BOL!' : 'VANG GOUDEN BOL!'}</span>
              </motion.button>
            )}

            {/* Cosmic Carp Catch Button (when active) */}
            {cosmicCarp && (
              <motion.button
                initial={{ scale: 0.85 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                onClick={handleCosmicCarpClick}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-1.5 border border-white/60 cursor-pointer animate-pulse shrink-0"
              >
                <span className="text-base">🐟</span>
                <span>VANG KARPER!</span>
              </motion.button>
            )}

            {/* Mystic Mouse Catch Button (when active) */}
            {mysticMouse && (
              <motion.button
                initial={{ scale: 0.85 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                onClick={handleMysticMouseClick}
                className="px-3 py-1.5 bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-fuchsia-500/30 flex items-center justify-center gap-1.5 border border-white/60 cursor-pointer animate-pulse shrink-0"
              >
                <span className="text-base">🐭</span>
                <span>VANG MUIS!</span>
              </motion.button>
            )}

            {/* Active Frenzy & Buff Badges */}
            <div className="flex items-center gap-1.5 empty:hidden flex-wrap">
              {Date.now() < frenzyUntil && (
                <span className="px-2 py-1 rounded-xl bg-amber-500/20 text-amber-400 text-[10px] font-bold font-mono border border-amber-500/30 animate-pulse">
                  ⚡ {ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased ? '10x' : '7x'} Frenzy ({Math.ceil((frenzyUntil - Date.now()) / 1000)}s)
                </span>
              )}
              {Date.now() < clickFrenzyUntil && (
                <span className="px-2 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 text-[10px] font-bold font-mono border border-cyan-500/30 animate-pulse">
                  🔥 {ascensionUpgrades.find(u => u.id === 'frenzy_surge')?.purchased ? '111x' : '77x'} Klik ({Math.ceil((clickFrenzyUntil - Date.now()) / 1000)}s)
                </span>
              )}
              {Date.now() < carpSurgeUntil && (
                <span className="px-2 py-1 rounded-xl bg-cyan-400/20 text-cyan-300 text-[10px] font-bold font-mono border border-cyan-400/40 animate-pulse shadow-sm">
                  🐟 25x Vloedgolf ({Math.ceil((carpSurgeUntil - Date.now()) / 1000)}s)
                </span>
              )}
            </div>

            {/* Purr Bonus Meter */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-app-accent/40 border border-app-border rounded-xl">
              <span className="text-xs">😻</span>
              <div className="w-16 sm:w-20 bg-black/20 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${purrProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-400">
                {purrProgress}%
              </span>
            </div>

            {/* Quick Skin Switcher */}
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-app-border/40">
              {CAT_SKINS.map(skin => {
                const isUnlocked = stats.allTimeTreats >= skin.minTreats;
                const isSelected = skin.id === selectedSkinId;
                return (
                  <button
                    key={skin.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedSkinId(skin.id);
                        catAudio.playPurr();
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold shadow scale-105'
                        : isUnlocked
                        ? 'hover:bg-white/10 text-white/80 cursor-pointer'
                        : 'opacity-25 text-white/30 cursor-not-allowed'
                    }`}
                    title={isUnlocked ? skin.name : `Ontgrendelt bij ${skin.minTreats.toLocaleString('nl-NL')} brokjes`}
                  >
                    {skin.emoji}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 3. MAIN GAME CONTENT: FULL PAGE HEIGHT */}
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-app-bg">
        
        {/* DESKTOP 3-COLUMN LAYOUT: 
            1. LINKER KOLOM: De Grote Kat Arena (Volledige Hoogte!)
            2. MIDDELSTE KOLOM: Upgrades, Mittens & Minigames (GROOT & NAAST DE GAME!)
            3. RECHTER KOLOM: Katten Hulpjes Winkel (Volledige Hoogte!)
        */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 xl:gap-4 p-3 xl:p-4 h-full min-h-0">
          
          {/* 1. Linker Kolom: De Grote Kat Arena (Volledige Hoogte!) */}
          <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 flex flex-col h-full min-h-0">
            <CatClickerStage
              cursorCount={buildings.find(b => b.id === 'kitten')?.count || 0}
              onCatClick={handleCatClick}
              isClickingCat={isClickingCat}
              skinEmoji={currentSkin.emoji}
              skinName={currentSkin.name}
              skinBgGlow={currentSkin.bgGlow}
              purrMultiplier={purrMultiplier}
              treats={treats}
              tps={tps}
              clickPower={calculateClickPower()}
              floatingTexts={floatingTexts}
              formatTreatsDisplay={formatTreatsDisplay}
              formatRate={formatRate}
              t={t}
              onOpenStore={() => setDesktopCenterTab('upgrades')}
            />
          </div>

          {/* 2. Middelste Kolom: Upgrades, Mittens & Minigames (GROOT & NAAST DE GAME!) */}
          <div className="lg:col-span-4 xl:col-span-5 2xl:col-span-6 flex flex-col h-full min-h-0 bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-sm">
            {/* Desktop Center Tab Bar */}
            <div className="flex border-b border-app-border bg-app-accent/30 p-1.5 gap-1 shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setDesktopCenterTab('upgrades')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'upgrades'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrades</span>
                {availableUpgradesCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    desktopCenterTab === 'upgrades' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black animate-pulse'
                  }`}>
                    {availableUpgradesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDesktopCenterTab('mittens')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'mittens'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <span>🧤</span>
                <span>Mittens ({mittens.length})</span>
              </button>

              <button
                onClick={() => setDesktopCenterTab('pantheon')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'pantheon'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <span>🏛️</span>
                <span>Pantheon</span>
                {templeCount === 0 && <Lock className="w-3 h-3 text-app-muted/60" />}
              </button>

              <button
                onClick={() => setDesktopCenterTab('grimoire')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'grimoire'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <span>📖</span>
                <span>Grimoire</span>
                {portalCount === 0 && <Lock className="w-3 h-3 text-app-muted/60" />}
              </button>

              <button
                onClick={() => setDesktopCenterTab('kingdom')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'kingdom'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <span>🏰</span>
                <span>Rijk ({totalHelpers})</span>
              </button>

              <button
                onClick={() => setDesktopCenterTab('achievements')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'achievements'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Trofeeën</span>
              </button>

              <button
                onClick={() => setDesktopCenterTab('stats')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  desktopCenterTab === 'stats'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stats</span>
              </button>
            </div>

            {/* Snelle Upgrades Balk (bovenin als een andere tab open staat) */}
            {availableUpgradesCount > 0 && desktopCenterTab !== 'upgrades' && (
              <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
                  <span className="text-[10px] font-bold font-mono text-amber-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Koopbaar:
                  </span>
                  {upgrades
                    .filter(u => !u.purchased && treats >= u.cost && stats.allTimeTreats >= u.requiredTreats)
                    .slice(0, 6)
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleBuyUpgrade(u.id)}
                        className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm hover:scale-105"
                        title={`${u.name}: ${u.description} (${formatRate(u.cost)} brokjes)`}
                      >
                        <span>{u.emoji}</span>
                        <span className="font-mono text-[10px]">{formatRate(u.cost)}</span>
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setDesktopCenterTab('upgrades')}
                  className="text-[10px] font-bold text-amber-500 hover:underline shrink-0 whitespace-nowrap"
                >
                  Bekijk alle ({availableUpgradesCount}) →
                </button>
              </div>
            )}

            {/* Desktop Center Body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {desktopCenterTab === 'upgrades' && renderUpgradesContent()}
              
              {desktopCenterTab === 'mittens' && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10 gap-2 flex-wrap">
                    <div>
                      <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                        <span>🧤</span>
                        <span>Mittens Katten Lounge & Speeltuin</span>
                      </h3>
                      <p className="text-[11px] text-app-muted font-mono">
                        Aai en verzorg je eigen groep lieve kittens voor krachtige permanente TPS bonussen!
                      </p>
                    </div>
                    {mittens.length > 0 && (
                      <button
                        onClick={handleUpgradeAllMittens}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>Upgrade Alle Mittens</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
                    <MittensList
                      mittens={mittens}
                      treats={treats}
                      hasMittenOverdrive={hasMittenOverdrive}
                      onPetMitten={handlePetMitten}
                      onUpgradeMitten={handleUpgradeMitten}
                      onUpgradeAllMittens={handleUpgradeAllMittens}
                      formatRate={formatRate}
                    />
                  </div>
                </div>
              )}

              {desktopCenterTab === 'pantheon' && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
                    <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                      <span>🏛️</span>
                      <span>Het Katten Pantheon (Tempel der Geesten)</span>
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
                    <PantheonView
                      templeCount={templeCount}
                      slots={pantheonSlots}
                      onAssignSlot={handleAssignPantheonSlot}
                      onOpenStore={() => {}}
                    />
                  </div>
                </div>
              )}

              {desktopCenterTab === 'grimoire' && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
                    <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                      <span>📖</span>
                      <span>Dimensie Portalen Grimoire</span>
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0 pb-16 lg:pb-6">
                    <GrimoireView
                      portalCount={portalCount}
                      mana={meowMana}
                      maxMana={maxMeowMana}
                      onCastSpell={handleCastSpell}
                      onOpenStore={() => {}}
                      formatRate={formatRate}
                    />
                  </div>
                </div>
              )}

              {desktopCenterTab === 'kingdom' && renderKingdomContent()}
              {desktopCenterTab === 'achievements' && renderAchievementsContent()}
              {desktopCenterTab === 'stats' && renderStatsContent()}
            </div>
          </div>

          {/* 3. Rechter Kolom: Katten Hulpjes Winkel (Volledige Hoogte) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex flex-col h-full min-h-0 bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-sm">
            {renderBuildingsStore()}
          </div>
        </div>

        {/* MOBILE VIEW: TABS BAR SWITCHER */}
        <div className="lg:hidden flex flex-col flex-1 min-h-0 bg-app-card overflow-hidden">
          {/* Mobile Tab Bar */}
          <div className="flex border-b border-app-border bg-app-accent/30 p-1 gap-1 shrink-0 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('cat')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'cat'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <span className="text-sm">🐾</span>
              <span>Kat & Pootjes</span>
            </button>

            <button
              onClick={() => setActiveTab('buildings')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'buildings'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>Winkel</span>
            </button>

            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'upgrades'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Upgrades</span>
              {availableUpgradesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-1.5 right-1.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('mittens')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'mittens'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <span className="text-sm">🧤</span>
              <span>Mittens ({mittens.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pantheon')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'pantheon'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <span className="text-sm">🏛️</span>
              <span>Pantheon</span>
            </button>

            <button
              onClick={() => setActiveTab('grimoire')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'grimoire'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <span className="text-sm">📖</span>
              <span>Grimoire</span>
            </button>

            <button
              onClick={() => setActiveTab('kingdom')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'kingdom'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <span className="text-sm">🏰</span>
              <span>Rijk ({totalHelpers})</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'achievements'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Trofeeën</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-app-card text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stats</span>
            </button>
          </div>

          {/* Mobile Tab Body */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'cat' && (
              <div className="h-full p-2.5 sm:p-3 flex flex-col">
                <CatClickerStage
                  cursorCount={buildings.find(b => b.id === 'kitten')?.count || 0}
                  onCatClick={handleCatClick}
                  isClickingCat={isClickingCat}
                  skinEmoji={currentSkin.emoji}
                  skinName={currentSkin.name}
                  skinBgGlow={currentSkin.bgGlow}
                  purrMultiplier={purrMultiplier}
                  treats={treats}
                  tps={tps}
                  clickPower={calculateClickPower()}
                  floatingTexts={floatingTexts}
                  formatTreatsDisplay={formatTreatsDisplay}
                  formatRate={formatRate}
                  t={t}
                  onOpenStore={() => setActiveTab('buildings')}
                />
              </div>
            )}
            {activeTab === 'buildings' && renderBuildingsStore()}
            {activeTab === 'upgrades' && renderUpgradesContent()}
            {activeTab === 'mittens' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10 gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                      <span>🧤</span>
                      <span>Mittens Katten Lounge</span>
                    </h3>
                  </div>
                  {mittens.length > 0 && (
                    <button
                      onClick={handleUpgradeAllMittens}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-xs font-black shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>Upgrade Alle</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0 pb-16">
                  <MittensList
                    mittens={mittens}
                    treats={treats}
                    hasMittenOverdrive={hasMittenOverdrive}
                    onPetMitten={handlePetMitten}
                    onUpgradeMitten={handleUpgradeMitten}
                    onUpgradeAllMittens={handleUpgradeAllMittens}
                    formatRate={formatRate}
                  />
                </div>
              </div>
            )}
            {activeTab === 'pantheon' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
                  <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                    <span>🏛️</span>
                    <span>Het Katten Pantheon</span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0 pb-16">
                  <PantheonView
                    templeCount={templeCount}
                    slots={pantheonSlots}
                    onAssignSlot={handleAssignPantheonSlot}
                    onOpenStore={() => setActiveTab('buildings')}
                  />
                </div>
              </div>
            )}
            {activeTab === 'grimoire' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="p-3 border-b border-app-border bg-app-accent/30 flex items-center justify-between shrink-0 z-10">
                  <h3 className="text-sm font-black text-app-ink tracking-tight flex items-center gap-2">
                    <span>📖</span>
                    <span>Dimensie Portalen Grimoire</span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0 pb-16">
                  <GrimoireView
                    portalCount={portalCount}
                    mana={meowMana}
                    maxMana={maxMeowMana}
                    onCastSpell={handleCastSpell}
                    onOpenStore={() => setActiveTab('buildings')}
                    formatRate={formatRate}
                  />
                </div>
              </div>
            )}
            {activeTab === 'kingdom' && renderKingdomContent()}
            {activeTab === 'achievements' && renderAchievementsContent()}
            {activeTab === 'stats' && renderStatsContent()}
          </div>
        </div>

      </div>

      {/* Floating Golden / Rainbow Yarn Event */}
      <AnimatePresence>
        {goldenYarn && (
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [1, 1.15, 1], rotate: 360 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: 'linear' }, scale: { repeat: Infinity, duration: 1.5 } }}
            onClick={handleGoldenYarnClick}
            style={{ left: `${goldenYarn.x}%`, top: `${goldenYarn.y}%` }}
            className="absolute z-50 cursor-pointer -translate-x-1/2 -translate-y-1/2 group select-none"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-white animate-pulse ${
              goldenYarn.type === 'rainbow'
                ? 'bg-gradient-to-tr from-pink-500 via-yellow-400 to-cyan-400 shadow-[0_0_35px_rgba(244,114,182,0.95)]'
                : 'bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.9)]'
            }`}>
              <span className="text-2xl">{goldenYarn.type === 'rainbow' ? '🌈' : '🧶'}</span>
            </div>
            <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              goldenYarn.type === 'rainbow'
                ? 'text-pink-300 border-pink-400/50'
                : 'text-amber-300 border-amber-400/40'
            }`}>
              {goldenYarn.type === 'rainbow' ? 'REGENBOOG BOL!' : 'GOUDEN BOL!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mystic Mouse Event */}
      <AnimatePresence>
        {mysticMouse && (
          <motion.div
            initial={{ x: mysticMouse.direction === 'right' ? '-10vw' : '110vw' }}
            animate={{ x: mysticMouse.direction === 'right' ? '110vw' : '-10vw' }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 12, ease: 'linear' }}
            onClick={handleMysticMouseClick}
            style={{ top: `${mysticMouse.y}%`, position: 'absolute', zIndex: 50 }}
            className="cursor-crosshair group select-none"
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-fuchsia-300 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.8)] border-2 border-white animate-bounce">
              <span className="text-2xl transform" style={{ transform: mysticMouse.direction === 'left' ? 'scaleX(-1)' : 'none' }}>🐭</span>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded-full text-[9px] font-black text-fuchsia-300 uppercase tracking-widest border border-fuchsia-400/40">
              VANG MIJ!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cosmic Golden Carp Event */}
      <AnimatePresence>
        {cosmicCarp && (
          <motion.div
            initial={{ x: cosmicCarp.direction === 'right' ? '-12vw' : '112vw', y: 0 }}
            animate={{ 
              x: cosmicCarp.direction === 'right' ? '112vw' : '-12vw',
              y: [0, -12, 0, 12, 0]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              x: { duration: 14, ease: 'linear' },
              y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
            }}
            onClick={handleCosmicCarpClick}
            style={{ top: `${cosmicCarp.y}%`, position: 'absolute', zIndex: 50 }}
            className="cursor-crosshair group select-none"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 via-blue-500 to-amber-300 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.9)] border-2 border-white animate-pulse">
              <span 
                className="text-3xl inline-block drop-shadow-md transform transition-transform group-hover:scale-125" 
                style={{ transform: cosmicCarp.direction === 'left' ? 'scaleX(-1)' : 'none' }}
              >
                🐟
              </span>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 px-2.5 py-0.5 rounded-full text-[9px] font-black text-cyan-300 uppercase tracking-widest border border-cyan-400/50 shadow-md">
              KOSMISCHE KARPER!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ascension Modal */}
      <AscensionModal
        isOpen={showAscensionModal}
        onClose={() => setShowAscensionModal(false)}
        kittyPoints={kittyPoints}
        potentialKittyPoints={potentialKittyPoints}
        totalAscensions={stats.ascensionCount}
        currentTreats={treats}
        allTimeTreats={currentRunTreatsEarned}
        ascensionUpgrades={ascensionUpgrades}
        onAscend={handleAscend}
        onBuyAscensionUpgrade={handleBuyAscensionUpgrade}
        formatRate={formatRate}
      />

      {/* Reset Game Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Spel Voortgang Resetten?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Weet je zeker dat je alle verzamelde kattenbrokjes, hulpjes en upgrades wilt wissen? Dit kan niet ongedaan worden gemaakt!
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleResetGame}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  Ja, Wis Alles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
