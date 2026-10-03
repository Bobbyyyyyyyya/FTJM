const fs = require('fs');
let content = fs.readFileSync('src/components/CatClickerGame.tsx', 'utf8');

// 1. Synergy Kittens in getBuildingTpsSingle
const synergyKittensLogic = `
    // Ascension Synergy Kittens (+1% per scratching post)
    if (bId === 'kitten' && ascensionUpgrades.find(u => u.id === 'synergy_kittens')?.purchased) {
      const postsCount = buildings.find(b => b.id === 'scratching_post')?.count || 0;
      tps *= (1 + postsCount * 0.01);
    }`;

content = content.replace(/tps \*= 1\.5;\n    \}/, "tps *= 1.5;\n    }\n" + synergyKittensLogic);
content = content.replace(/useCallback\(\(bId: string, bBaseTps: number\) => \{/, "useCallback((bId: string, bBaseTps: number) => {");
content = content.replace(/\}?, \[upgrades, ascensionUpgrades\]\);/, "}, [upgrades, ascensionUpgrades, buildings]);");

// 2. Heavenly Paws 2 in calculateTps
const hp2LogicTps = `
    // Ascension Heavenly Paws 2 boost (+50% global TPS)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws_2')?.purchased) {
      tps *= 1.50;
    }`;
content = content.replace(/tps \*= 1\.20;\n    \}/, "tps *= 1.20;\n    }\n" + hp2LogicTps);

// 3. Heavenly Paws 2 & Click God in calculateClickPower
const clickGodLogic = `
    // Ascension Heavenly Paws 2 boost (+50%)
    if (ascensionUpgrades.find(u => u.id === 'heavenly_paws_2')?.purchased) {
      power *= 1.50;
    }
    // Ascension Click God (x10)
    if (ascensionUpgrades.find(u => u.id === 'click_god')?.purchased) {
      power *= 10;
    }`;
content = content.replace(/power \*= 1\.20;\n    \}/, "power *= 1.20;\n    }\n" + clickGodLogic);

// 4. Initial Treats start_cookies_2 in handleAscend
content = content.replace(/const initialTreats = hasStarterTreats \? 50000 : 0;/, "const hasStarterTreats2 = ascensionUpgrades.find(u => u.id === 'start_cookies_2')?.purchased;\n    const initialTreats = hasStarterTreats2 ? 1000000 : (hasStarterTreats ? 50000 : 0);");

// 5. Golden Frenzy multiplier in handleGoldenYarnClick
const frenzyDurationVars = `
    const hasGoldenFrenzy = ascensionUpgrades.find(u => u.id === 'golden_frenzy')?.purchased;
    const frenzyMult = hasGoldenFrenzy ? 1.5 : 1;
`;
content = content.replace(/if \(goldenYarn\.type === 'frenzy'\) \{/, frenzyDurationVars + "\n    if (goldenYarn.type === 'frenzy') {");
content = content.replace(/setFrenzyUntil\(Date\.now\(\) \+ 25000\);/, "setFrenzyUntil(Date.now() + 25000 * frenzyMult);");
content = content.replace(/setClickFrenzyUntil\(Date\.now\(\) \+ 15000\);/, "setClickFrenzyUntil(Date.now() + 15000 * frenzyMult);");

fs.writeFileSync('src/components/CatClickerGame.tsx', content);
