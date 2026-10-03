const fs = require('fs');
let content = fs.readFileSync('src/components/CatClickerGame.tsx', 'utf8');

const mouseSpawnLogic = `
      // Spawn Mystic Mouse
      const hasLuckyCat = ascensionUpgrades.find(u => u.id === 'lucky_cat')?.purchased;
      const mouseSpawnChance = hasLuckyCat ? 0.003 : 0.001; // ~0.1% or 0.3% chance per tick (every 1s)
      if (!mysticMouse && Math.random() < mouseSpawnChance) {
        setMysticMouse({
          id: Date.now(),
          y: Math.floor(20 + Math.random() * 60),
          direction: Math.random() > 0.5 ? 'left' : 'right',
          expiresAt: Date.now() + 12000 // alive for 12 seconds
        });
        catAudio.playSparkle(); // Play a sound indicating something spawned
      }

      // Remove expired mystic mouse
      if (mysticMouse && Date.now() > mysticMouse.expiresAt) {
        setMysticMouse(null);
      }
`;

content = content.replace(/\/\/ Remove expired golden yarn/, mouseSpawnLogic + "\n      // Remove expired golden yarn");

fs.writeFileSync('src/components/CatClickerGame.tsx', content);
