// Cat Clicker Data & Ascension Types

export interface Mitten {
  id: string;
  name: string;
  title: string;
  personality: string;
  avatar: string;
  favoriteTreat: string;
  patsCount: number;
  level?: number; // Level starts at 1 and can be upgraded
}

export type AscensionBranch = 'all' | 'buildings' | 'powers' | 'luck' | 'serenity' | 'transcendence';

export interface AscensionUpgrade {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  effectType: 
    | 'offline_unlock' 
    | 'offline_time_1' 
    | 'offline_time_2' 
    | 'offline_full' 
    | 'global_multiplier' 
    | 'golden_boost' 
    | 'start_cookies' 
    | 'auto_clicker' 
    | 'mitten_power'
    | 'mitten_overdrive'
    | 'mitten_claws_divine'
    | 'synergy_kittens'
    | 'heavenly_paws_2'
    | 'click_god'
    | 'lucky_cat'
    | 'start_cookies_2'
    | 'golden_frenzy'
    | 'frenzy_surge'
    | 'purr_mastery'
    | 'rainbow_yarn'
    | 'cosmic_carp'
    | 'lucky_crit'
    | 'celestial_empire'
    | 'eternal_catnip'
    | 'cat_transcendence'
    | 'quantum_catnip'
    | 'hyper_singularity'
    | 'celestial_deity'
    | 'unlock_cathedral'
    | 'cathedral_sanctuary'
    | 'unlock_seraphim_galaxy'
    | 'seraphim_blessing'
    | 'unlock_archangel_throne'
    | 'divine_click_conduit'
    | 'archangel_purr'
    | 'celestial_net'
    | 'angelic_mittens';
  value: number;
  purchased: boolean;
  requiredUpgradeId?: string;
  branch?: 'buildings' | 'powers' | 'luck' | 'serenity' | 'transcendence';
  tier?: number; // 1 (Starter) to 5 (Apex)
  unlocksBuildingId?: string;
}

const MITTEN_FIRST_NAMES = [
  'Pluisje', 'Snorrebaard', 'Barnaby', 'Milo', 'Luna', 'Simba', 'Nala', 'Oreo',
  'Felix', 'Snickers', 'Waffles', 'Cleo', 'Ziggy', 'Mocha', 'Bagheera', 'Tijger',
  'Muis', 'Snoetje', 'Karel', 'Moppie', 'Puck', 'Bram', 'Droppie', 'Boris',
  'Minoes', 'Garfield', 'Kasper', 'Binkie', 'Tommy', 'Mimi', 'Loki', 'Bella',
  'Gizmo', 'Shadow', 'Oliver', 'Pip', 'Guusje', 'Zorro', 'Vlekje', 'Kruimel',
  'Teddy', 'Bowie', 'Pixel', 'Dexter', 'Coco', 'Sushi', 'Mochi', 'Nori', 'Wasabi', 'Pinda'
];

const MITTEN_TITLES = [
  'de Dappere', 'de Luilak', 'de Brokjeskoning', 'de Spinnende', 'Klauwenvriend',
  'de Vlugge', 'Snoepjesdief', 'de Schootzitter', 'de Grote', 'de Muisvanger',
  'de Nachtwaker', 'de Snelle Poot', 'de Zonnestraler', 'de Kartonnen Doos Ridder',
  'Laserjager', 'de Koninklijke', 'de Slapende Meester', 'de Brokjesvreter', 'de Mystieke',
  'Super Mitten', 'de Zachte Poot', 'de Wolbolliefhebber'
];

const MITTEN_PERSONALITIES = [
  'Houdt van kartonnen dozen en luie dutjes in het zonnetje',
  'Rent om 3 uur \'s nachts vol energie door de gang',
  'Eet het liefst alleen gourmet zalmsnoepjes',
  'Jakkert achter onzichtbare vliegjes aan',
  'Spint zo hard als een kleine straaljager',
  'Knuffelt het liefst de hele dag op schoot',
  'Verstopt stiekem sokken onder de bank',
  'Kijkt intens gefocust naar rode laserstippen',
  'Glijdt uit op gladde vloeren van puur enthousiasme',
  'Steelt stiekem brokjes van de andere katten'
];

const MITTEN_AVATARS = ['🐱', '😺', '😸', '😻', '😽', '🐾', '🐈', '🐈‍⬛'];
const MITTEN_TREATS = ['Zalmsnoepjes', 'Kippenreepjes', 'Tonijncrème', 'Kattenmelk', 'Kattenkruidballetjes', 'Gedroogde Kaasblokjes', 'Gourmet Brokjes'];

export function generateRandomMitten(index: number): Mitten {
  const firstName = MITTEN_FIRST_NAMES[Math.floor(Math.random() * MITTEN_FIRST_NAMES.length)];
  const title = MITTEN_TITLES[Math.floor(Math.random() * MITTEN_TITLES.length)];
  const personality = MITTEN_PERSONALITIES[Math.floor(Math.random() * MITTEN_PERSONALITIES.length)];
  const avatar = MITTEN_AVATARS[Math.floor(Math.random() * MITTEN_AVATARS.length)];
  const favoriteTreat = MITTEN_TREATS[Math.floor(Math.random() * MITTEN_TREATS.length)];

  return {
    id: `mitten_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
    name: firstName,
    title: title,
    personality,
    avatar,
    favoriteTreat,
    patsCount: 0,
    level: 1
  };
}

// Mitten upgrade cost calculation
export function getMittenUpgradeCost(level: number = 1): number {
  const currentLvl = Math.max(1, Math.floor(level || 1));
  return Math.floor(1500 * Math.pow(1.65, currentLvl - 1));
}

// Mitten TPS contribution: Level 1 is the base kitten (produces 0.5 TPS via building).
// Bonus TPS is awarded when actively upgrading a Mitten beyond Level 1 (cost 1.500+ treats).
export function getMittenTpsBonus(level: number = 1, mittenPowerMultiplier: number = 1): number {
  const currentLvl = Math.max(1, Math.floor(level || 1));
  if (currentLvl <= 1) return 0;
  const bonusPerUpgradeLevel = 25;
  return Math.floor((currentLvl - 1) * bonusPerUpgradeLevel * mittenPowerMultiplier);
}

export function syncMittensList(currentMittens: Mitten[], targetCount: number): Mitten[] {
  if (currentMittens.length === targetCount) return currentMittens;
  if (currentMittens.length < targetCount) {
    const needed = targetCount - currentMittens.length;
    const newMittens: Mitten[] = [];
    for (let i = 0; i < needed; i++) {
      newMittens.push(generateRandomMitten(currentMittens.length + i + 1));
    }
    return [...currentMittens, ...newMittens];
  }
  return currentMittens.slice(0, targetCount);
}

export const INITIAL_ASCENSION_UPGRADES: AscensionUpgrade[] = [
  // ==========================================
  // TAK 1: 🏛️ HEMELSE HEILIGDOMMEN & EXCLUSIEVE GEBOUWEN
  // ==========================================
  {
    id: 'unlock_cathedral',
    name: 'Hemelse Kathedraal',
    emoji: '⛪',
    cost: 8,
    description: 'Ontgrendelt een exclusief nieuw gebouw in de winkel: de Hemelse Kathedraal! Brengt astronomische brokjesstromen.',
    effectType: 'unlock_cathedral',
    value: 1,
    purchased: false,
    branch: 'buildings',
    tier: 2,
    unlocksBuildingId: 'celestial_cathedral'
  },
  {
    id: 'cathedral_sanctuary',
    name: 'Gewijde Kathedraal Zegen',
    emoji: '🔔',
    cost: 16,
    description: 'Hemelse Kathedralen produceren +100% extra brokjes én Katten Tempels krijgen +25% productie!',
    effectType: 'cathedral_sanctuary',
    value: 2.0,
    purchased: false,
    requiredUpgradeId: 'unlock_cathedral',
    branch: 'buildings',
    tier: 3
  },
  {
    id: 'unlock_seraphim_galaxy',
    name: 'Seraphim Melkweg Fontein',
    emoji: '🌌',
    cost: 24,
    description: 'Ontgrendelt het mythische gebouw: Seraphim Melkweg Fontein! Een kosmische spiraal van zuivere engelenmelk.',
    effectType: 'unlock_seraphim_galaxy',
    value: 1,
    purchased: false,
    requiredUpgradeId: 'cathedral_sanctuary',
    branch: 'buildings',
    tier: 3,
    unlocksBuildingId: 'seraphim_galaxy'
  },
  {
    id: 'seraphim_blessing',
    name: 'Lactische Kosmische Zegen',
    emoji: '🥛',
    cost: 36,
    description: 'Seraphim Melkweg Fonteinen zijn +50% effectiever en Romige Melk Bars produceren 2x zoveel!',
    effectType: 'seraphim_blessing',
    value: 1.5,
    purchased: false,
    requiredUpgradeId: 'unlock_seraphim_galaxy',
    branch: 'buildings',
    tier: 4
  },
  {
    id: 'unlock_archangel_throne',
    name: 'Aartsengel Katten Troon',
    emoji: '🪽',
    cost: 48,
    description: 'Ontgrendelt het ultieme hemelse heiligdom: de Aartsengel Katten Troon! Schenkt miljoenen miljarden brokjes per seconde.',
    effectType: 'unlock_archangel_throne',
    value: 1,
    purchased: false,
    requiredUpgradeId: 'seraphim_blessing',
    branch: 'buildings',
    tier: 5,
    unlocksBuildingId: 'archangel_throne'
  },

  // ==========================================
  // TAK 2: ⚡ GODDELIJKE POOTJES & KRACHTEN
  // ==========================================
  {
    id: 'heavenly_paws',
    name: 'Hemelse Pootjes',
    emoji: '🐾',
    cost: 3,
    description: '+20% permanente multiplier op alle brokjes en handmatige kliks!',
    effectType: 'global_multiplier',
    value: 0.20,
    purchased: false,
    branch: 'powers',
    tier: 1
  },
  {
    id: 'auto_clicker',
    name: 'Hemelse Spookpoot',
    emoji: '✨',
    cost: 7,
    description: 'Een mystieke kattenpoot klikt automatisch 3 keer per seconde voor je.',
    effectType: 'auto_clicker',
    value: 3,
    purchased: false,
    requiredUpgradeId: 'heavenly_paws',
    branch: 'powers',
    tier: 2
  },
  {
    id: 'heavenly_paws_2',
    name: 'Goddelijke Pootjes',
    emoji: '💫',
    cost: 18,
    description: '+25% permanente multiplier op alle brokjes en handmatige kliks!',
    effectType: 'heavenly_paws_2',
    value: 0.25,
    purchased: false,
    requiredUpgradeId: 'heavenly_paws',
    branch: 'powers',
    tier: 3
  },
  {
    id: 'divine_click_conduit',
    name: 'Hemelse Klik Geleider',
    emoji: '⚡',
    cost: 20,
    description: 'Elke handmatige klik levert direct +2% van je TOTALE actieve brokjes per seconde (TPS) op!',
    effectType: 'divine_click_conduit',
    value: 0.02,
    purchased: false,
    requiredUpgradeId: 'heavenly_paws_2',
    branch: 'powers',
    tier: 3
  },
  {
    id: 'lucky_crit',
    name: 'Goddelijke Klauwen',
    emoji: '🗡️',
    cost: 22,
    description: 'Kritieke klikkans stijgt naar 25% en doet 12x brokjes per aai!',
    effectType: 'lucky_crit',
    value: 12,
    purchased: false,
    requiredUpgradeId: 'divine_click_conduit',
    branch: 'powers',
    tier: 3
  },
  {
    id: 'click_god',
    name: 'Klik Godheid',
    emoji: '👆',
    cost: 28,
    description: 'Handmatig klikken is permanent 3x zo krachtig.',
    effectType: 'click_god',
    value: 3,
    purchased: false,
    requiredUpgradeId: 'lucky_crit',
    branch: 'powers',
    tier: 4
  },
  {
    id: 'archangel_purr',
    name: 'Eeuwige Spin-Aura',
    emoji: '😻',
    cost: 34,
    description: 'Je Purr-meter zakt nooit meer onder 25% en Super Spinnen duurt dubbel zo lang!',
    effectType: 'archangel_purr',
    value: 2,
    purchased: false,
    requiredUpgradeId: 'click_god',
    branch: 'powers',
    tier: 4
  },

  // ==========================================
  // TAK 3: 🌈 MYTHISCHE WEZENS & WONDEREN
  // ==========================================
  {
    id: 'golden_magnet',
    name: 'Gouden Garen Magneet',
    emoji: '🧶',
    cost: 5,
    description: 'Gouden Bollen Wol verschijnen 1.5x vaker en duren 25% langer.',
    effectType: 'golden_boost',
    value: 1.5,
    purchased: false,
    branch: 'luck',
    tier: 1
  },
  {
    id: 'frenzy_surge',
    name: 'Frenzy Surge',
    emoji: '⚡',
    cost: 6,
    description: 'Frenzy geeft 10x brokjes (i.p.v. 7x) en Klik Frenzy 111x (i.p.v. 77x)!',
    effectType: 'frenzy_surge',
    value: 1.4,
    purchased: false,
    requiredUpgradeId: 'golden_magnet',
    branch: 'luck',
    tier: 2
  },
  {
    id: 'golden_frenzy',
    name: 'Gouden Razernij',
    emoji: '🔥',
    cost: 8,
    description: 'Klik Frenzy en normale Frenzy duren 25% langer.',
    effectType: 'golden_frenzy',
    value: 1.25,
    purchased: false,
    requiredUpgradeId: 'golden_magnet',
    branch: 'luck',
    tier: 2
  },
  {
    id: 'rainbow_yarn',
    name: 'Regenboog Garen',
    emoji: '🌈',
    cost: 12,
    description: 'Ontgrendelt de zeldzame Regenboog Bol Wol met directe brokjesregen en instant Super Spinnen!',
    effectType: 'rainbow_yarn',
    value: 1,
    purchased: false,
    requiredUpgradeId: 'golden_magnet',
    branch: 'luck',
    tier: 2
  },
  {
    id: 'lucky_cat',
    name: 'Zeldzame Bezoeker',
    emoji: '🐭',
    cost: 30,
    description: 'De Mystieke Muis verschijnt vaker en geeft massale hoeveelheden brokjes.',
    effectType: 'lucky_cat',
    value: 3,
    purchased: false,
    requiredUpgradeId: 'rainbow_yarn',
    branch: 'luck',
    tier: 3
  },
  {
    id: 'cosmic_carp',
    name: 'Kosmische Karper',
    emoji: '🐟',
    cost: 32,
    description: 'Laat een mythische Gouden Karper door het heelal zwemmen die een gigantische brokjesgolf en 25x klikkracht schenkt!',
    effectType: 'cosmic_carp',
    value: 1,
    purchased: false,
    requiredUpgradeId: 'lucky_cat',
    branch: 'luck',
    tier: 3
  },
  {
    id: 'celestial_net',
    name: 'Goddelijk Vangnet',
    emoji: '🕸️',
    cost: 38,
    description: 'Beloningen van Gouden Bollen, Mystieke Muizen en Karpers worden +50% groter én elke vangst telt als 2 aaikliks!',
    effectType: 'celestial_net',
    value: 1.5,
    purchased: false,
    requiredUpgradeId: 'cosmic_carp',
    branch: 'luck',
    tier: 4
  },

  // ==========================================
  // TAK 4: 💤 EEUWIGE RUST, MITTENS & SYNERGIE
  // ==========================================
  {
    id: 'offline_unlock',
    name: 'Slapende Kattenkracht',
    emoji: '💤',
    cost: 2,
    description: 'Ontgrendelt offline voortgang! Je katten verzamelen brokjes terwijl je weg bent (tot 2 uur, 25% opbrengst).',
    effectType: 'offline_unlock',
    value: 0.25,
    purchased: false,
    branch: 'serenity',
    tier: 1
  },
  {
    id: 'starter_treats',
    name: 'Hemelse Starter Voorraad',
    emoji: '🍪',
    cost: 2,
    description: 'Start elke ronde direct na Hemelvaart met 100 gratis brokjes om direct te starten!',
    effectType: 'start_cookies',
    value: 100,
    purchased: false,
    branch: 'serenity',
    tier: 1
  },
  {
    id: 'offline_time_1',
    name: 'Diepe Kattennap',
    emoji: '⏰',
    cost: 3,
    description: 'Verlengt offline tijd naar 6 uur en verhoogt opbrengst naar 45%.',
    effectType: 'offline_time_1',
    value: 0.45,
    purchased: false,
    requiredUpgradeId: 'offline_unlock',
    branch: 'serenity',
    tier: 2
  },
  {
    id: 'mitten_power',
    name: 'Mitten Broederschap',
    emoji: '👑',
    cost: 4,
    description: 'Elke Mitten kitten geeft +50% extra brokjesproductie en level-kracht.',
    effectType: 'mitten_power',
    value: 0.5,
    purchased: false,
    branch: 'serenity',
    tier: 2
  },
  {
    id: 'offline_time_2',
    name: 'Nachtelijke Muizenjacht',
    emoji: '🌙',
    cost: 9,
    description: 'Verlengt offline tijd naar 14 uur en verhoogt opbrengst naar 70%.',
    effectType: 'offline_time_2',
    value: 0.70,
    purchased: false,
    requiredUpgradeId: 'offline_time_1',
    branch: 'serenity',
    tier: 2
  },
  {
    id: 'purr_mastery',
    name: 'Spinkracht Meester',
    emoji: '😻',
    cost: 10,
    description: 'De Purr-meter vult 2x sneller en geeft een 3x brokjes bonus tijdens Super Spinnen!',
    effectType: 'purr_mastery',
    value: 3.0,
    purchased: false,
    branch: 'serenity',
    tier: 2
  },
  {
    id: 'synergy_kittens',
    name: 'Krabpaal Kittens',
    emoji: '🐈',
    cost: 14,
    description: 'Kittens geven +2% TPS voor elke Luxe Krabpaal die je bezit.',
    effectType: 'synergy_kittens',
    value: 0.02,
    purchased: false,
    branch: 'serenity',
    tier: 2
  },
  {
    id: 'mitten_overdrive',
    name: 'Mitten Overdrive',
    emoji: '🧤',
    cost: 15,
    description: 'Verdrievoudigt de TPS en aaibonus van alle Mitten levels (+200% Mitten effectiviteit)!',
    effectType: 'mitten_overdrive',
    value: 3.0,
    purchased: false,
    requiredUpgradeId: 'mitten_power',
    branch: 'serenity',
    tier: 3
  },
  {
    id: 'start_cookies_2',
    name: 'Kosmische Start',
    emoji: '🌠',
    cost: 15,
    description: 'Start elke ronde direct na Hemelvaart met 1.000 gratis brokjes!',
    effectType: 'start_cookies_2',
    value: 1000,
    purchased: false,
    requiredUpgradeId: 'starter_treats',
    branch: 'serenity',
    tier: 3
  },
  {
    id: 'offline_full',
    name: 'Kosmische Kattenslaap',
    emoji: '🌌',
    cost: 20,
    description: 'Tot 24 uur offline tijd met 100% volledige brokjesopbrengst!',
    effectType: 'offline_full',
    value: 1.0,
    purchased: false,
    requiredUpgradeId: 'offline_time_2',
    branch: 'serenity',
    tier: 3
  },
  {
    id: 'mitten_claws_divine',
    name: 'Goddelijke Handschoenen',
    emoji: '✨',
    cost: 25,
    description: 'Elke keer dat je een Mitten aait, ontketen je een brokjesgolf ter waarde van 20 seconden TPS!',
    effectType: 'mitten_claws_divine',
    value: 20,
    purchased: false,
    requiredUpgradeId: 'mitten_overdrive',
    branch: 'serenity',
    tier: 4
  },
  {
    id: 'angelic_mittens',
    name: 'Engelen Kittens',
    emoji: '🪽',
    cost: 30,
    description: 'Mittens krijgen gouden engelenkransen: hun actieve level-TPS wordt 4x krachtiger en elke aai vult direct 5% Purr!',
    effectType: 'angelic_mittens',
    value: 4.0,
    purchased: false,
    requiredUpgradeId: 'mitten_claws_divine',
    branch: 'serenity',
    tier: 4
  },

  // ==========================================
  // TAK 5: 👑 KOSMISCHE TRANSCENDENTIE & GODHEDEN
  // ==========================================
  {
    id: 'celestial_empire',
    name: 'Hemels Keizerrijk',
    emoji: '🏛️',
    cost: 35,
    description: 'Elk gebouwtype waarvan je minstens 25 stuks bezit produceert permanent +25% extra brokjes.',
    effectType: 'celestial_empire',
    value: 0.25,
    purchased: false,
    branch: 'transcendence',
    tier: 3
  },
  {
    id: 'quantum_catnip',
    name: 'Kwantum Kattenkruid',
    emoji: '⚛️',
    cost: 40,
    description: '+50% permanente all-time multiplier op ALLE brokjes en kliks!',
    effectType: 'quantum_catnip',
    value: 0.50,
    purchased: false,
    requiredUpgradeId: 'heavenly_paws_2',
    branch: 'transcendence',
    tier: 4
  },
  {
    id: 'eternal_catnip',
    name: 'Eeuwig Kattenkruid',
    emoji: '🌿',
    cost: 45,
    description: '+50% permanente bonus op ALLE brokjes en kliks voor altijd!',
    effectType: 'eternal_catnip',
    value: 0.50,
    purchased: false,
    requiredUpgradeId: 'quantum_catnip',
    branch: 'transcendence',
    tier: 4
  },
  {
    id: 'hyper_singularity',
    name: 'Brokjes Zwart Gat',
    emoji: '🕳️',
    cost: 50,
    description: 'Trekt continu brokjes aan vanuit parallelle universums: +100% totale passieve brokjesproductie!',
    effectType: 'hyper_singularity',
    value: 2.0,
    purchased: false,
    requiredUpgradeId: 'celestial_empire',
    branch: 'transcendence',
    tier: 5
  },
  {
    id: 'cat_transcendence',
    name: 'Katten Transcendentie',
    emoji: '👑',
    cost: 55,
    description: 'Bereik de hoogste kattenstaat: +50% extra brokjes én alle zeldzame gebeurtenissen verschijnen 1.5x vaker!',
    effectType: 'cat_transcendence',
    value: 1.5,
    purchased: false,
    requiredUpgradeId: 'eternal_catnip',
    branch: 'transcendence',
    tier: 5
  },
  {
    id: 'celestial_deity',
    name: 'Almachtige Katten Avatar',
    emoji: '🌟',
    cost: 60,
    description: 'De ultieme kattenverlichting: 2.5x alle productie, en gouden bollen en kosmische karpers spawnen 2x sneller!',
    effectType: 'celestial_deity',
    value: 2.5,
    purchased: false,
    requiredUpgradeId: 'cat_transcendence',
    branch: 'transcendence',
    tier: 5
  }
];

// Fixed threshold: Minimum 1 Miljard / 1 Billion brokjes to ascend
export const ASCENSION_MIN_TREATS = 1000000000; // 1 Miljard / 1 Billion
export const TREATS_PER_KITTY_POINT = 1000000000; // Reference 1 Billion base

export function getAscensionMinTreats(_ascensionCount: number = 0): number {
  return ASCENSION_MIN_TREATS;
}

export function getAscensionTierLabel(_ascensionCount: number = 0): string {
  return '1 Miljard (1 Billion)';
}

// Kitty Points Calculation: Balanced prestige curve
// - 1 Miljard (1 Billion) = 1 KP
// - At 40 Quintillion (40e18) = exactly 100 KP
// - Capped strictly at 100 KP max per user request ("bij 40 quintillion heb ik 12470 punten fix dat... 2000 00000 is veel te veel meot echt 100 worden")
export function calculateKittyPointsForTreats(treatsThisRun: number, _ascensionCount: number = 0): number {
  if (!treatsThisRun || treatsThisRun < ASCENSION_MIN_TREATS) return 0;
  
  // Logarithmic progression from 1B to 40 Quintillion (4e19)
  const minTreats = 1e9;
  const targetMaxTreats = 4e19;
  
  if (treatsThisRun <= minTreats) return 1;
  if (treatsThisRun >= targetMaxTreats) return 100;
  
  const progressRatio = Math.log10(treatsThisRun / minTreats) / Math.log10(targetMaxTreats / minTreats);
  const calculatedKp = Math.floor(1 + progressRatio * 99);
  
  return Math.max(1, Math.min(100, calculatedKp));
}

export function calculateTreatsForKittyPoints(kp: number, _ascensionCount: number = 0): number {
  if (kp <= 0) return 0;
  if (kp >= 100) return 4e19;
  const progressRatio = (kp - 1) / 99;
  return Math.round(1e9 * Math.pow(4e10, progressRatio));
}
