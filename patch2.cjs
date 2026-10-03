const fs = require('fs');
let content = fs.readFileSync('src/components/CatClickerGame.tsx', 'utf8');

const newAchievements = `
  { id: 'treats_1t', title: 'Katten Trillionair', emoji: '💸', description: 'Bereik 1.000.000.000.000 (1 Biljoen) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 1000000000000 },
  { id: 'treats_10t', title: 'Brokjes Zwart Gat', emoji: '🕳️', description: 'Bereik 10.000.000.000.000 (10 Biljoen) kattenbrokjes!', unlocked: false, condition: (s) => s.allTimeTreats >= 10000000000000 },
  
  // Ascension Achievements
  { id: 'ascend_1', title: 'Verlichting', emoji: '👼', description: 'Onderga je eerste Hemelvaart.', unlocked: false, condition: (s) => s.ascensionCount >= 1 },
  { id: 'ascend_5', title: 'Negen Levens', emoji: '✨', description: 'Onderga minstens 5 keer een Hemelvaart.', unlocked: false, condition: (s) => s.ascensionCount >= 5 },
  
  // Special Event Achievements
  { id: 'mystic_mouse_1', title: 'De Mystieke Vangst', emoji: '🐭', description: 'Vang je allereerste Mystieke Muis.', unlocked: false, condition: (s) => (s).mysticMiceCaught >= 1 },
  { id: 'mystic_mouse_10', title: 'Muizenvanger', emoji: '🐁', description: 'Vang 10 Mystieke Muizen in totaal.', unlocked: false, condition: (s) => (s).mysticMiceCaught >= 10 },
`;

// Insert after 'treats_100b'
content = content.replace(
  /({ id: 'treats_100b'.*condition: \(s\) => s\.allTimeTreats >= 100000000000 \},)/,
  "$1\n" + newAchievements
);

// We need to add 'mysticMiceCaught: number;' to GameStats
content = content.replace(/ascensionCount: number;\n  totalKittyPoints: number;/, "ascensionCount: number;\n  totalKittyPoints: number;\n  mysticMiceCaught: number;");

// Update all occurrences of setStats initializations
content = content.replace(/totalKittyPoints: 0(\n|\r\n|\s)*\}/g, "totalKittyPoints: 0,\n      mysticMiceCaught: 0\n    }");
content = content.replace(/totalKittyPoints: data\.stats\.totalKittyPoints \|\| 0/, "totalKittyPoints: data.stats.totalKittyPoints || 0,\n            mysticMiceCaught: data.stats.mysticMiceCaught || 0");

fs.writeFileSync('src/components/CatClickerGame.tsx', content);
