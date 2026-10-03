const fs = require('fs');
let content = fs.readFileSync('src/components/catclicker/catClickerData.ts', 'utf8');

content = content.replace(/\| 'mitten_power';/, `| 'mitten_power'\n    | 'synergy_kittens'\n    | 'heavenly_paws_2'\n    | 'click_god'\n    | 'lucky_cat'\n    | 'start_cookies_2'\n    | 'golden_frenzy';`);

const newUpgrades = `
  {
    id: 'golden_frenzy',
    name: 'Gouden Razernij',
    emoji: '🔥',
    cost: 5,
    description: 'Klik Frenzy en normale Frenzy duren 50% langer.',
    effectType: 'golden_frenzy',
    value: 1.5,
    purchased: false,
    requiredUpgradeId: 'golden_magnet'
  },
  {
    id: 'synergy_kittens',
    name: 'Krabpaal Kittens',
    emoji: '🐈',
    cost: 10,
    description: 'Kittens geven +1% TPS voor elke Luxe Krabpaal die je bezit.',
    effectType: 'synergy_kittens',
    value: 0.01,
    purchased: false
  },
  {
    id: 'heavenly_paws_2',
    name: 'Goddelijke Pootjes',
    emoji: '💫',
    cost: 15,
    description: '+50% permanente multiplier op alle brokjes en kliks!',
    effectType: 'heavenly_paws_2',
    value: 0.50,
    purchased: false,
    requiredUpgradeId: 'heavenly_paws'
  },
  {
    id: 'click_god',
    name: 'Klik Godheid',
    emoji: '👆',
    cost: 20,
    description: 'Klikken is permanent 10x zo krachtig.',
    effectType: 'click_god',
    value: 10,
    purchased: false
  },
  {
    id: 'lucky_cat',
    name: 'Zeldzame Bezoeker',
    emoji: '🐭',
    cost: 12,
    description: 'De Mystieke Muis verschijnt 3x zo vaak voor enorme bonussen.',
    effectType: 'lucky_cat',
    value: 3,
    purchased: false
  },
  {
    id: 'start_cookies_2',
    name: 'Kosmische Start',
    emoji: '🌠',
    cost: 10,
    description: 'Start elke ronde direct na Hemelvaart met 1.000.000 gratis brokjes!',
    effectType: 'start_cookies_2',
    value: 1000000,
    purchased: false,
    requiredUpgradeId: 'starter_treats'
  }
];`;

content = content.replace(/\];\n\nexport const ASCENSION_MIN_TREATS/, newUpgrades + '\n\nexport const ASCENSION_MIN_TREATS');
fs.writeFileSync('src/components/catclicker/catClickerData.ts', content);
