const fs = require('fs');
let content = fs.readFileSync('src/components/catclicker/catClickerData.ts', 'utf8');

content = content.replace(/\| 'mitten_power';/, `| 'mitten_power'\n    | 'synergy_kittens'\n    | 'heavenly_paws_2'\n    | 'click_god'\n    | 'lucky_cat'\n    | 'start_cookies_2'\n    | 'golden_frenzy';`);

fs.writeFileSync('src/components/catclicker/catClickerData.ts', content);
