const fs = require('fs');
let content = fs.readFileSync('src/components/CatClickerGame.tsx', 'utf8');

const mysticMouseClickHandler = `
  const handleMysticMouseClick = () => {
    if (!mysticMouse) return;

    // A massive reward: 5 minutes of current TPS or 100,000 cookies (whichever is greater)
    const tps = calculateTps();
    const reward = Math.max(100000, Math.floor(tps * 300));
    
    setTreats(prev => prev + reward);
    setStats(prev => ({
      ...prev,
      allTimeTreats: prev.allTimeTreats + reward,
      mysticMiceCaught: prev.mysticMiceCaught + 1
    }));
    
    setFloatingTexts(prev => [
      ...prev,
      { id: nextParticleId.current++, x: 50, y: mysticMouse.y, text: \`🐭 +\${formatTreatsDisplay(reward)}\`, color: 'text-fuchsia-400' }
    ]);
    
    toast('🐭 MYSTIEKE MUIS GEVANGEN!', {
      description: \`Je katten kregen een gigantische bonus van +\${reward.toLocaleString('nl-NL')} brokjes!\`,
      duration: 5000
    });
    
    catAudio.playSparkle();
    setMysticMouse(null);
  };
`;

content = content.replace(/\/\/ Reset Game Confirmation/, mysticMouseClickHandler + "\n  // Reset Game Confirmation");

const mysticMouseRender = `
      {/* Floating Mystic Mouse Event */}
      <AnimatePresence>
        {mysticMouse && (
          <motion.div
            initial={{ x: mysticMouse.direction === 'right' ? '-10vw' : '110vw' }}
            animate={{ x: mysticMouse.direction === 'right' ? '110vw' : '-10vw' }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 12, ease: 'linear' }}
            onClick={handleMysticMouseClick}
            style={{ top: \`\${mysticMouse.y}%\`, position: 'absolute', zIndex: 50 }}
            className="cursor-crosshair group"
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
`;

content = content.replace(/\{(\/\* Ascension Modal \*\/)\}/, mysticMouseRender + "\n      {$1}");

fs.writeFileSync('src/components/CatClickerGame.tsx', content);
