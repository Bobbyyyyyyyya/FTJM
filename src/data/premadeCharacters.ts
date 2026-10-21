export interface PremadeCharacter {
  id: string;
  name: string;
  category: 'animals' | 'gaming' | 'scifi' | 'fantasy' | 'cool' | 'exclusive';
  avatarUrl: string;
  tag: string;
  description: string;
  gradient: string;
}

export const CHARACTER_CATEGORIES = [
  { id: 'all', label: 'Alle Karakters', icon: 'Sparkles' },
  { id: 'animals', label: '🐾 Dieren & Katten', icon: 'Cat' },
  { id: 'gaming', label: '🎮 Gaming & Pixel', icon: 'Gamepad2' },
  { id: 'scifi', label: '🤖 Sci-Fi & Cyberpunk', icon: 'Bot' },
  { id: 'fantasy', label: '🧙 Fantasy & Magie', icon: 'Wand2' },
  { id: 'cool', label: '🕶️ Cool & Minimal', icon: 'Glasses' },
  { id: 'exclusive', label: '💎 FTJM Exclusief', icon: 'ShieldCheck' },
] as const;

export const PREMADE_CHARACTERS: PremadeCharacter[] = [
  // 🐾 DIEREN & KATTEN
  {
    id: 'char_cat_cyber',
    name: 'Cyber Kat 🐱',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCat&backgroundColor=0284c7,0ea5e9,38bdf8',
    tag: 'Populair',
    description: 'Een futuristische neonkat met laser-oogjes en cyber-snorharen.',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'char_cat_golden',
    name: 'Gouden Kat 🐾',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=GoldenKitty&backgroundColor=f59e0b,fbbf24',
    tag: 'Arcade Legend',
    description: 'De legendarische mascotte uit de FTJM Katten Klikker.',
    gradient: 'from-amber-400 to-orange-500'
  },
  {
    id: 'char_cat_ninja',
    name: 'Ninja Kat 🥷',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NinjaCat2026&backgroundColor=1e1b4b,312e81',
    tag: 'Stealth',
    description: 'Sluipt ongemerkt door de nachtelijke steegjes.',
    gradient: 'from-indigo-600 to-purple-800'
  },
  {
    id: 'char_cat_cosmic',
    name: 'Kosmische Kat 🌌',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CosmicCat&backgroundColor=4c1d95,581c87',
    tag: 'Magisch',
    description: 'Reist tussen de sterrenstelsels op zoek naar brokjes.',
    gradient: 'from-violet-600 to-fuchsia-600'
  },
  {
    id: 'char_fox_mystic',
    name: 'Mystieke Vos 🦊',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MysticFox&backgroundColor=ea580c,f97316',
    tag: 'Sluw',
    description: 'Vlug, intelligent en altijd een stap voor op de rest.',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    id: 'char_wolf_shadow',
    name: 'Schaduw Wolf 🐺',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowWolf&backgroundColor=334155,475569',
    tag: 'Krachtig',
    description: 'Leider van de roedel met onwrikbare loyaliteit.',
    gradient: 'from-slate-700 to-zinc-900'
  },
  {
    id: 'char_panda_zen',
    name: 'Zen Panda 🐼',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ZenPanda&backgroundColor=059669,10b981',
    tag: 'Relaxed',
    description: 'Meester in kalmte, bamboe en strategisch gamen.',
    gradient: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'char_hamster_speed',
    name: 'Turbo Hamster 🐹',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=TurboHamster&backgroundColor=d97706,b45309',
    tag: 'Snel',
    description: 'De onverslaanbare kampioen van het looprad.',
    gradient: 'from-amber-500 to-yellow-600'
  },
  {
    id: 'char_snow_leopard',
    name: 'Sneeuwpanter ❄️',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SnowLeopardFrost&backgroundColor=0284c7,38bdf8',
    tag: 'Arctisch',
    description: 'Statig en geluidloos op de ijzige bergtoppen.',
    gradient: 'from-sky-400 to-blue-600'
  },
  {
    id: 'char_galaxy_otter',
    name: 'Galaxy Otter 🦦',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=GalaxyOtter&backgroundColor=6366f1,818cf8',
    tag: 'Kosmisch',
    description: 'Drijft ontspannen door de nevels van het heelal.',
    gradient: 'from-indigo-500 to-violet-600'
  },
  {
    id: 'char_cyber_dragon',
    name: 'Cyber Draakje 🐲',
    category: 'animals',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberDragonWhelp&backgroundColor=059669,10b981',
    tag: 'Mythic',
    description: 'Klein van stuk, maar spuwt plasma-vuur.',
    gradient: 'from-emerald-500 to-teal-700'
  },

  // 🎮 GAMING & PIXEL
  {
    id: 'char_retro_hero',
    name: '8-Bit Held 🕹️',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=RetroHero8Bit&backgroundColor=dc2626,ef4444',
    tag: 'Classic',
    description: 'Originele pixelheld rechtstreeks uit het arcadetijdperk.',
    gradient: 'from-red-500 to-rose-600'
  },
  {
    id: 'char_pixel_mage',
    name: 'Pixel Tovenaar 🔮',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelMage2026&backgroundColor=7c3aed,8b5cf6',
    tag: 'Mage',
    description: 'Werpt 8-bit vuurballen en genezende spreuken.',
    gradient: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'char_cyber_ninja',
    name: 'Arcade Ninja ⚔️',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=ArcadeNinjaX&backgroundColor=0f172a,1e293b',
    tag: 'Stealth',
    description: 'Vlijmscherpe combo’s en ultieme reflexen.',
    gradient: 'from-blue-600 to-slate-900'
  },
  {
    id: 'char_speedrunner',
    name: 'Speedrunner ⚡',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=SpeedRunnerPro&backgroundColor=2563eb,3b82f6',
    tag: 'Pro Gamer',
    description: 'Verbreekt elk levelrecord binnen enkele seconden.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'char_pixel_knight',
    name: 'Dungeon Ridder 🛡️',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=DungeonKnight&backgroundColor=b45309,d97706',
    tag: 'Tank',
    description: 'Onbreekbare pantseruitrusting en een gouden zwaard.',
    gradient: 'from-amber-600 to-orange-700'
  },
  {
    id: 'char_ghost_hunter',
    name: 'Spook Jager 👻',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=GhostHunter99&backgroundColor=047857,059669',
    tag: 'Retro',
    description: 'Uitgerust met een proton blaster en retro goggles.',
    gradient: 'from-emerald-600 to-teal-800'
  },

  // 🤖 SCI-FI & CYBERPUNK
  {
    id: 'char_neon_cyborg',
    name: 'Neon Cyborg 🦾',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonCyborg2077&backgroundColor=06b6d4,0891b2',
    tag: 'Cyberpunk',
    description: 'Geavanceerde neurale interface met neon oplichtende circuits.',
    gradient: 'from-cyan-400 to-teal-600'
  },
  {
    id: 'char_mecha_unit',
    name: 'Mecha Unit-01 🤖',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaUnit01&backgroundColor=4338ca,3730a3',
    tag: 'Robotics',
    description: 'Zware pantsergevechtsrobot met geautomatiseerde AI-core.',
    gradient: 'from-indigo-600 to-violet-700'
  },
  {
    id: 'char_hologram_bot',
    name: 'Holo Bot 🌐',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=HoloBotAI&backgroundColor=9333ea,7e22ce',
    tag: 'AI Core',
    description: 'Puur holografisch bewustzijn levend in de cloud.',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'char_astro_pilot',
    name: 'Astro Piloot 🚀',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstroPilotFTJM&backgroundColor=0284c7,0369a1',
    tag: 'Space',
    description: 'Navigeert hyperspace routes met lichtsnelheid.',
    gradient: 'from-sky-500 to-blue-700'
  },
  {
    id: 'char_matrix_hacker',
    name: 'Cyber Hacker 💻',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MatrixHackerCore&backgroundColor=15803d,166534',
    tag: 'Security',
    description: 'Beveiligt databases en omzeilt complexe firewalls.',
    gradient: 'from-emerald-500 to-green-700'
  },
  {
    id: 'char_quantum_android',
    name: 'Quantum Android ⚛️',
    category: 'scifi',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumAndroidX&backgroundColor=db2777,be185d',
    tag: 'Quantum',
    description: 'Berekent alle mogelijke toekomsten gelijktijdig.',
    gradient: 'from-pink-500 to-rose-700'
  },

  // 🧙 FANTASY & MAGIE
  {
    id: 'char_arch_mage',
    name: 'Aartsmagiër 🧙‍♂️',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ArchMageGrand&backgroundColor=1e1b4b,312e81',
    tag: 'Mystiek',
    description: 'Opperste magiër met controle over elementaire energie.',
    gradient: 'from-indigo-600 to-violet-900'
  },
  {
    id: 'char_elf_ranger',
    name: 'Elfen Schutter 🏹',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ElfRangerForest&backgroundColor=14532d,166534',
    tag: 'Natuur',
    description: 'Beschermer van het woud met onfeilbare precisie.',
    gradient: 'from-green-600 to-emerald-800'
  },
  {
    id: 'char_dragon_rider',
    name: 'Drakenrijder 🐉',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DragonRiderFlame&backgroundColor=991b1b,7f1d1d',
    tag: 'Vuur',
    description: 'Vliegt over vulkanen op de rug van een vuurspuwende draak.',
    gradient: 'from-red-600 to-orange-800'
  },
  {
    id: 'char_shadow_assassin',
    name: 'Schaduw Sluipmoordenaar 🗡️',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowAssassinNight&backgroundColor=0f172a,1e293b',
    tag: 'Schaduw',
    description: 'Verdwijnt in het niets en slaat toe op het juiste moment.',
    gradient: 'from-slate-800 to-zinc-950'
  },
  {
    id: 'char_alchemist',
    name: 'Meester Alchemist 🧪',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MasterAlchemistElixir&backgroundColor=0e7490,155e75',
    tag: 'Elixers',
    description: 'Brouwt onoverwinnelijke toverdranken en levenselixers.',
    gradient: 'from-cyan-600 to-blue-800'
  },

  // 🕶️ COOL & MINIMAL
  {
    id: 'char_synth_pilot',
    name: 'Synthwave Coureur 🕶️',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=SynthPilotNeon&backgroundColor=e11d48,be123c',
    tag: 'Retro Wave',
    description: 'Rijdt met neon lichten de zonsondergang tegemoet.',
    gradient: 'from-rose-500 to-pink-700'
  },
  {
    id: 'char_street_samurai',
    name: 'Street Samurai 👺',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=StreetSamuraiKatana&backgroundColor=4f46e5,4338ca',
    tag: 'Stijlvol',
    description: 'Traditionele eer gecombineerd met moderne streetwear.',
    gradient: 'from-indigo-500 to-purple-700'
  },
  {
    id: 'char_chill_coder',
    name: 'Chill Developer 🎧',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=ChillDeveloperCode&backgroundColor=3b82f6,2563eb',
    tag: 'Dev',
    description: 'Bouwt vliegensvlugge webapps met lofi beats op de achtergrond.',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'char_lofi_girl',
    name: 'Lofi Artiest ☕',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=LofiArtistCoffee&backgroundColor=f59e0b,d97706',
    tag: 'Relax',
    description: 'Geniet van warme koffie, regenachtig weer en rustgevende beats.',
    gradient: 'from-amber-400 to-orange-600'
  },
  {
    id: 'char_monochrome_mask',
    name: 'Phantom Noir 🎭',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PhantomNoirMask&backgroundColor=18181b,27272a',
    tag: 'Noir',
    description: 'Strak, minimalistisch en tijdloos mysterieus.',
    gradient: 'from-zinc-700 to-zinc-950'
  },

  // 💎 FTJM EXCLUSIEF
  {
    id: 'char_ftjm_gold_vip',
    name: 'FTJM Gold VIP 👑',
    category: 'exclusive',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=FTJMGoldVIPElite&backgroundColor=eab308,ca8a04',
    tag: 'Exclusief',
    description: 'Speciale gouden editie voor gewaardeerde FTJM VIP leden.',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600'
  },
  {
    id: 'char_ftjm_core_guard',
    name: 'Core Shield Guard 🛡️',
    category: 'exclusive',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CoreShieldGuard&backgroundColor=0284c7,0369a1',
    tag: 'Security',
    description: 'De ultieme bewaker van de beveiligde FTJM encryptie-engine.',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-700'
  },
  {
    id: 'char_ftjm_crystal_phoenix',
    name: 'Crystal Phoenix 💎',
    category: 'exclusive',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CrystalPhoenixDiamond&backgroundColor=06b6d4,0891b2',
    tag: 'Legendarisch',
    description: 'Herrijst met vlammen van puur kristal en diamant.',
    gradient: 'from-cyan-400 via-teal-500 to-emerald-600'
  },
  {
    id: 'char_ftjm_developer_master',
    name: 'Enterprise Architect ⚡',
    category: 'exclusive',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=EnterpriseArchitectDev&backgroundColor=7c3aed,6d28d9',
    tag: 'Dev Tier',
    description: 'Ontwerpt schaalbare, veilige cloudnetwerken en realtime systemen.',
    gradient: 'from-purple-600 via-violet-700 to-indigo-800'
  },
  {
    id: 'char_ftjm_diamond_titan',
    name: 'Diamond Titan 💠',
    category: 'exclusive',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DiamondTitanFTJM&backgroundColor=0284c7,38bdf8',
    tag: 'Titan Tier',
    description: 'Onbreekbare kracht en beschermer van het platform.',
    gradient: 'from-cyan-400 via-sky-500 to-blue-700'
  },
  {
    id: 'char_retro_glitch',
    name: 'Glitch Entity 👾',
    category: 'gaming',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=GlitchEntity88&backgroundColor=18181b,27272a',
    tag: 'Glitch',
    description: 'Bestaat tussen de frames en code-lagen van de arcade.',
    gradient: 'from-fuchsia-600 to-pink-600'
  },
  {
    id: 'char_time_traveler',
    name: 'Tijdreiziger ⏳',
    category: 'fantasy',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ChronoTraveler2026&backgroundColor=78350f,92400e',
    tag: 'Tijdloos',
    description: 'Reist moeiteloos tussen verleden, heden en de toekomst.',
    gradient: 'from-amber-600 to-yellow-800'
  },
  {
    id: 'char_tokyo_rider',
    name: 'Tokyo Midnight 🏍️',
    category: 'cool',
    avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TokyoMidnightRider&backgroundColor=0f172a,1e293b',
    tag: 'Speed',
    description: 'Rijdt door de neonverlichte straten van Shinjuku.',
    gradient: 'from-purple-600 to-slate-900'
  }
];
