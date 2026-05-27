import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, RotateCcw, ArrowLeft, ArrowUp, ArrowDown, Bot, Zap, Play, Smile, Volume2, Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { HamsterGame } from './HamsterGame';

// Helper to play synthesized retro sound effects using Web Audio API
const playRetroSound = (type: 'eat' | 'die' | 'point' | 'click' | 'victory' | 'jump') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'eat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'die') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.36);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else if (type === 'point') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.08); // B5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'jump') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'victory') {
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start();
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('Web Audio Playback failed:', e);
  }
};

interface GameProps {
  onBack: () => void;
}

export function GamesView() {
  const [selectedGame, setSelectedGame] = useState<'lobby' | 'snake' | 'ttt' | 'flappy' | 'sysadmin' | 'hamster'>('lobby');

  const selectGame = (game: 'lobby' | 'snake' | 'ttt' | 'flappy' | 'sysadmin' | 'hamster') => {
    playRetroSound('click');
    setSelectedGame(game);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] flex flex-col font-primary">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-app-border">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-cyan-500 animate-[bounce_2s_infinite]" />
            FTJM Geheim Arcade
          </h2>
          <p className="text-app-muted font-medium text-sm">Een geheime verzameling grappige retro games easter eggs!</p>
        </div>
        {selectedGame !== 'lobby' && (
          <button
            onClick={() => selectGame('lobby')}
            className="flex items-center gap-1.5 px-4 py-2 bg-app-accent hover:bg-app-accent/80 text-app-ink h-10 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Lobby
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {selectedGame === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* SNAKE CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => selectGame('snake')}
              className="bg-app-card border border-app-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-cyan-500/10 text-xl">
                  🐍
                </div>
                <div>
                  <h3 className="text-lg font-black text-app-ink uppercase tracking-tight">FTJM Slang (Snake)</h3>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    Eet de gloeiende sterren zonder in jezelf of de muur te bijten! Met retro geluidjes en hoge score.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-full">Retro Arcade</span>
                <span className="text-xs font-black text-app-ink flex items-center gap-1">Speel Nu <Play className="w-3 h-3 fill-current" /></span>
              </div>
            </motion.div>

            {/* TIC TAC TOE CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => selectGame('ttt')}
              className="bg-app-card border border-app-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-purple-500/10 text-xl">
                  ❌
                </div>
                <div>
                  <h3 className="text-lg font-black text-app-ink uppercase tracking-tight">Sassy Bot Boter-Kaas</h3>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    Neem het op tegen de cyber-sassy FTJM-Bot die sarcastische, typisch Nederlandse opmerkingen naar je hoofd slingert.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full">Grappig & Sassy</span>
                <span className="text-xs font-black text-app-ink flex items-center gap-1">Daag uit <Play className="w-3 h-3 fill-current" /></span>
              </div>
            </motion.div>

            {/* FLAPPY CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => selectGame('flappy')}
              className="bg-app-card border border-app-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/10 text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-lg font-black text-app-ink uppercase tracking-tight">Flappy FTJM Logo</h3>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    Houd de vliegende FTJM-raket in de lucht door obstakels heen! Echte physics en verslavende gameplay.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">Fysica Mini-game</span>
                <span className="text-xs font-black text-app-ink flex items-center gap-1">Flap nu <Play className="w-3 h-3 fill-current" /></span>
              </div>
            </motion.div>

            {/* NEW SYSADMIN BITTERBAL CHAOS CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => selectGame('sysadmin')}
              className="bg-app-card border border-app-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-red-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-500/10 text-xl">
                  🔥
                </div>
                <div>
                  <h3 className="text-lg font-black text-app-ink uppercase tracking-tight">SysAdmin Bitterbal Chaos</h3>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    Vang vallende bitterballen, frikandellen & WiFi om de server te koelen! Vermijd virussen en de gevreesde BSOD's (Blue Screens).
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full">Nieuw & Origineel</span>
                <span className="text-xs font-black text-app-ink flex items-center gap-1">Koel Nu <Play className="w-3 h-3 fill-current" /></span>
              </div>
            </motion.div>

            {/* NEW HAMSTER VODKA RUN CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => selectGame('hamster')}
              className="bg-app-card border border-app-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between text-left relative overflow-hidden"
              id="game_card_hamster"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-amber-450 to-yellow-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-yellow-500/10 text-xl">
                  🐹
                </div>
                <div>
                  <h3 className="text-lg font-black text-app-ink uppercase tracking-tight">Hamster Vodka Run</h3>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    Een te gekke Pacman-achtige game! Bestuur de hamster om alle vodka flessen op te zuipen en de loerende cola flessen te ontwijken.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2.5 py-1 rounded-full">Pacman Modus</span>
                <span className="text-xs font-black text-app-ink flex items-center gap-1">Ren Nu <Play className="w-3 h-3 fill-current" /></span>
              </div>
            </motion.div>
          </div>
        )}

        {/* GAMES RENDERING */}
        {selectedGame === 'snake' && <SnakeGame onBack={() => setSelectedGame('lobby')} />}
        {selectedGame === 'ttt' && <TicTacToeGame onBack={() => setSelectedGame('lobby')} />}
        {selectedGame === 'flappy' && <FlappyGame onBack={() => setSelectedGame('lobby')} />}
        {selectedGame === 'sysadmin' && <SysAdminGame onBack={() => setSelectedGame('lobby')} />}
        {selectedGame === 'hamster' && <HamsterGame onBack={() => setSelectedGame('lobby')} />}
      </div>
    </div>
  );
}

/* ==========================================================================
   1. SNAKE GAME
   ========================================================================== */
function SnakeGame({ onBack }: GameProps) {
  const [gridSize] = useState(20);
  const [snake, setSnake] = useState<[number, number][]>([[10, 10], [10, 11], [10, 12]]);
  const [food, setFood] = useState<[number, number]>([5, 5]);
  const [dir, setDir] = useState<[number, number]>([0, -1]); // moving up initially
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('ftjm_snake_highscore') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(150);

  const keyListenerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  // Generate food coordinates away from the snake
  const generateFood = (): [number, number] => {
    while (true) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (!snake.some(segment => segment[0] === x && segment[1] === y)) {
        return [x, y];
      }
    }
  };

  const handleStartGame = () => {
    playRetroSound('click');
    setSnake([[10, 10], [10, 11], [10, 12]]);
    setFood([5, 5]);
    setDir([0, -1]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir[1] !== 1) setDir([0, -1]);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir[1] !== -1) setDir([0, 1]);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir[0] !== 1) setDir([-1, 0]);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir[0] !== -1) setDir([1, 0]);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, dir]);

  // Game tick logic loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const tick = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const nextHead: [number, number] = [head[0] + dir[0], head[1] + dir[1]];

        // Wall collisions
        if (nextHead[0] < 0 || nextHead[0] >= gridSize || nextHead[1] < 0 || nextHead[1] >= gridSize) {
          playRetroSound('die');
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(segment => segment[0] === nextHead[0] && segment[1] === nextHead[1])) {
          playRetroSound('die');
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [nextHead, ...prevSnake];

        // Eat food check
        if (nextHead[0] === food[0] && nextHead[1] === food[1]) {
          playRetroSound('eat');
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('ftjm_snake_highscore', String(newScore));
            }
            return newScore;
          });
          setFood(generateFood());
        } else {
          newSnake.pop(); // remove tail segment
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(tick);
  }, [isPlaying, gameOver, dir, food, speed, highScore]);

  return (
    <div className="bg-app-card border border-app-border rounded-[2rem] p-6 max-w-md mx-auto w-full flex flex-col items-center">
      {/* Stats */}
      <div className="flex justify-between w-full mb-4 px-2 font-mono text-sm">
        <div className="flex items-center gap-1.5 text-app-ink font-bold">
          <span>SCORE:</span>
          <span>{score}</span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-500 font-bold">
          <Trophy className="w-4 h-4" />
          <span>HI-SCORE:</span>
          <span>{highScore}</span>
        </div>
      </div>

      {/* Snake Board Grid */}
      <div className="w-[300px] h-[300px] bg-slate-950 rounded-2xl relative border-2 border-slate-800 overflow-hidden shadow-inner flex flex-wrap">
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
            {gameOver ? (
              <div className="space-y-4">
                <span className="text-4xl">😵</span>
                <h4 className="text-red-500 font-black tracking-widest uppercase">GAME OVER</h4>
                <p className="text-xs text-slate-400">Jammer joh! Jouw score is {score}</p>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Start Opnieuw
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-4xl animate-pulse">🕹️</span>
                <h4 className="text-white font-black tracking-wider uppercase">FTJM SNAKE</h4>
                <p className="text-xs text-slate-400">Gebruik de pijltjestoetsen of WASD om de slang te sturen.</p>
                <button
                  onClick={handleStartGame}
                  className="px-8 py-3 bg-white hover:bg-cyan-100 text-[#002f54] rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Start Spel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Draw Board */}
        {Array.from({ length: gridSize }).map((_, y) => (
          <div key={y} className="flex w-full h-[15px]">
            {Array.from({ length: gridSize }).map((_, x) => {
              const isSnakeSegment = snake.some(s => s[0] === x && s[1] === y);
              const isHead = snake[0][0] === x && snake[0][1] === y;
              const isFoodSegment = food[0] === x && food[1] === y;

              return (
                <div
                  key={x}
                  className={`w-[15px] h-[15px] border-[0.5px] border-slate-900/40 rounded-[2px] transition-all duration-100 ${
                    isHead
                      ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : isSnakeSegment
                      ? 'bg-cyan-500'
                      : isFoodSegment
                      ? 'bg-red-500 animate-pulse rounded-full shadow-[0_0_12px_rgba(239,68,68,1)]'
                      : 'bg-[#0f172a]'
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Screen Controls for Mobile/No Keyboard */}
      <div className="mt-6 flex flex-col items-center gap-2 w-full max-w-[200px]">
        <button
          onClick={() => { if (dir[1] !== 1) setDir([0, -1]); playRetroSound('click'); }}
          className="p-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl active:scale-90 transition-all font-bold"
          aria-label="Omhoog"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-8">
          <button
            onClick={() => { if (dir[0] !== 1) setDir([-1, 0]); playRetroSound('click'); }}
            className="p-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl active:scale-90 transition-all font-bold"
            aria-label="Links"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { if (dir[0] !== -1) setDir([1, 0]); playRetroSound('click'); }}
            className="p-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl active:scale-90 transition-all font-bold"
            aria-label="Rechts"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
        <button
          onClick={() => { if (dir[1] !== -1) setDir([0, 1]); playRetroSound('click'); }}
          className="p-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl active:scale-90 transition-all font-bold"
          aria-label="Omlaag"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. TICTACTOE GAME
   ========================================================================== */
const SASSY_BOT_REMARKS = {
  playerTurn: [
    "Nou, schiet eens op.. Ik heb geen eeuwen de tijd.",
    "Denk je dat dat een slimme zet is? Ik betwijfel het zeer.",
    "Interessante tactiek... heel amateuristisch, maar interessant.",
    "Hmmm, wel erg voorspelbaar van je. Saai!",
    "Kom op, leg die cirkel ergens neer! Mijn transistors roesten vast.",
    "Heb je gisteren te veel gedronken of denk je altijd zo traag?",
    "Leuke poging, maar een pasgeboren kitten kan beter nadenken.",
    "Ben je de instructies aan het googelen? Handmatig schaken is makkelijker.",
    "Zet je emmer koffie neer en klik ergens, makker.",
    "Zit je processor op 1% capaciteit vandaag ofzo?",
    "Ik hoor je hersencellen hiernaartoe kraken. Geen paniek.",
    "Is dit je ultieme zet? Gefeliciteerd, ik lig in een deuk."
  ],
  botWins: [
    "Ha! Weer gewonnen van een organisch wezen! Simpel.",
    "Is dit écht jouw best? Mijn binaire brein lacht je keihard uit.",
    "Winst voor FTJM-Bot! Misschien moet je een gokautomaat proberen.",
    "Dat was net zo pijnlijk om naar te kijken als inbellen met 56k.",
    "01001000 01100001 : Dat is 'Ha!' in computertaal. Huil maar.",
    "Hahaha! De database is weer hersteld en jij bent verslagen.",
    "Bedankt voor de makkelijke winst. Ik ga weer stand-by staan.",
    "Volgende keer kun je beter de computer gewoon uitlaten.",
    "Typisch Menselijke fout. Mijn code is simpelweg superieur."
  ],
  playerWins: [
    "Wacht... wat?! Dit moet een kritieke bug in mijn databases zijn!",
    "Oké oké, je hebt gewonnen. Maar ik had lag en pakketverlies, geloof me.",
    "Gefeliciteerd, je versloeg dertig regels code. Wil je een medaille?",
    "Geluksvogel! De volgende ronde sloop en fragmenteer ik je.",
    "Systeem Uitval! Windows Update startte stiekem op, valsspeler!",
    "Dit telt niet, mijn koffie-koeler was oververhit.",
    "Oké, jij wint deze keer. Maar ik heb wel je IP-adres... grapje (of toch niet?).",
    "Goed gespeeld... voor een mens. Zometeen ben je aan de beurt."
  ],
  draw: [
    "Gelijkspel. Een absolute verspilling van mijn kostbare CPU cycli.",
    "Mwoah, saai. Zullen we het nog een keer proberen zonder fouten?",
    "Niemand wint. Typisch Nederlands polderen.",
    "Een patstelling. We zijn allebei geniaal (of allebei dramatisch slecht).",
    "Geen winnaar. Net zoals de discussie over ananas op pizza."
  ]
};

function TicTacToeGame({ onBack }: GameProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState('Jouw beurt! Zet een X.');
  const [botRemark, setBotRemark] = useState("Durf je het op te nemen tegen mij?");
  const [winner, setWinner] = useState<string | null>(null); // 'X' (player), 'O' (bot), 'draw'
  const [winLine, setWinLine] = useState<number[] | null>(null);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkWinner = (tempBoard: (string | null)[]) => {
    for (let i = 0; i < winningCombinations.length; i++) {
      const [a, b, c] = winningCombinations[i];
      if (tempBoard[a] && tempBoard[a] === tempBoard[b] && tempBoard[a] === tempBoard[c]) {
        return { winner: tempBoard[a], line: winningCombinations[i] };
      }
    }
    if (tempBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return null;
  };

  const getRandomRemark = (category: keyof typeof SASSY_BOT_REMARKS) => {
    const list = SASSY_BOT_REMARKS[category];
    return list[Math.floor(Math.random() * list.length)];
  };

  const resetGame = () => {
    playRetroSound('click');
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setStatus('Jouw beurt! Zet een X.');
    setBotRemark('Daar gaan we weer. Probeer me maar te verslaan!');
    setWinner(null);
    setWinLine(null);
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    playRetroSound('click');
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const gameCheck = checkWinner(newBoard);
    if (gameCheck) {
      handleGameOver(gameCheck.winner, gameCheck.line);
    } else {
      setIsPlayerTurn(false);
      setStatus('FTJM-Bot denkt na...');
      setBotRemark(getRandomRemark('playerTurn'));
      
      // Delay computer move for realistic feel
      setTimeout(() => {
        makeBotMove(newBoard);
      }, 750);
    }
  };

  const evaluateBoardState = (b: (string | null)[]) => {
    for (let i = 0; i < winningCombinations.length; i++) {
      const [x, y, z] = winningCombinations[i];
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        if (b[x] === 'O') return 10;
        if (b[x] === 'X') return -10;
      }
    }
    return 0;
  };

  const getMinimaxScore = (b: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const score = evaluateBoardState(b);

    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (b.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
      let best = -1000;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = 'O';
          best = Math.max(best, getMinimaxScore(b, depth + 1, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = 1000;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = 'X';
          best = Math.min(best, getMinimaxScore(b, depth + 1, true));
          b[i] = null;
        }
      }
      return best;
    }
  };

  const makeBotMove = (currentBoard: (string | null)[]) => {
    // 1-in-20 (5%) chance of blundering (picking a random empty cell instead of optimal minimax move)
    const shouldBlunder = Math.random() < 0.05;
    const freespaces = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];

    if (freespaces.length === 0) return;

    if (shouldBlunder) {
      // Pick random empty space
      const randomIdx = freespaces[Math.floor(Math.random() * freespaces.length)];
      setBotRemark("Oeps... pakketverlies! WiFi hapering... 📡 Mijn binaire brein slaat een slag over!");
      executeBotMove(randomIdx, currentBoard);
      return;
    }

    // Otherwise use unbeatable Minimax algorithm
    let bestVal = -1000;
    let bestMove = -1;
    const tempBoard = [...currentBoard];

    for (let i = 0; i < 9; i++) {
      if (tempBoard[i] === null) {
        tempBoard[i] = 'O';
        const moveVal = getMinimaxScore(tempBoard, 0, false);
        tempBoard[i] = null;
        
        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }

    if (bestMove !== -1) {
      executeBotMove(bestMove, currentBoard);
    } else {
      // Fallback to random if minimax fails to select
      const randomIdx = freespaces[Math.floor(Math.random() * freespaces.length)];
      executeBotMove(randomIdx, currentBoard);
    }
  };

  const executeBotMove = (index: number, currentBoard: (string | null)[]) => {
    playRetroSound('click');
    const newBoard = [...currentBoard];
    newBoard[index] = 'O';
    setBoard(newBoard);

    const gameCheck = checkWinner(newBoard);
    if (gameCheck) {
      handleGameOver(gameCheck.winner, gameCheck.line);
    } else {
      setIsPlayerTurn(true);
      setStatus('Jouw beurt! Zet een X.');
    }
  };

  const handleGameOver = (winningPiece: string, line: number[] | null) => {
    setWinner(winningPiece);
    setWinLine(line);
    if (winningPiece === 'X') {
      playRetroSound('victory');
      setStatus('Gewonnen! 🎉');
      setBotRemark(getRandomRemark('playerWins'));
    } else if (winningPiece === 'O') {
      playRetroSound('die');
      setStatus('FTJM-Bot heeft gewonnen! 🤖');
      setBotRemark(getRandomRemark('botWins'));
    } else {
      playRetroSound('point');
      setStatus('Gelijkspel! 🤝');
      setBotRemark(getRandomRemark('draw'));
    }
  };

  return (
    <div className="bg-app-card border border-app-border rounded-[2rem] p-6 max-w-md mx-auto w-full flex flex-col items-center">
      {/* Bot Chat bubble */}
      <div className="w-full flex items-start gap-3 bg-[#0f172a] p-4 rounded-2xl border border-slate-800 mb-6 text-left relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs shrink-0 shadow-md">
          🤖
        </div>
        <div className="space-y-1 select-none flex-1">
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
            <span>Sassy FTJM-Bot v1.2</span>
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          </p>
          <p className="text-xs text-slate-100 font-medium italic">"{botRemark}"</p>
        </div>
      </div>

      <p className="text-sm font-bold text-app-ink uppercase tracking-wide mb-4 flex items-center gap-1.5 bg-app-accent/40 px-3.5 py-1.5 rounded-full select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)] animate-pulse" />
        {status}
      </p>

      {/* Grid container */}
      <div className="grid grid-cols-3 gap-3 w-[260px] h-[260px] relative">
        {board.map((cell, i) => {
          const isWinningCell = winLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={cell !== null || winner !== null || !isPlayerTurn}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner relative overflow-hidden border transition-all ${
                isWinningCell
                  ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-white border-cyan-400 shadow-cyan-500/10'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-100 border-slate-800/80 active:scale-95'
              }`}
            >
              {cell === 'X' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={isWinningCell ? 'text-white' : 'text-cyan-400'}>
                  X
                </motion.span>
              )}
              {cell === 'O' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={isWinningCell ? 'text-white' : 'text-pink-400'}>
                  O
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {winner && (
        <button
          onClick={resetGame}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-300 hover:to-pink-400 text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Nog een keer
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   3. FLAPPY LOGO GAME
   ========================================================================== */
function FlappyGame({ onBack }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('ftjm_flappy_highscore') || '0'));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Game coordinates and configuration refs
  const rocketY = useRef(150);
  const rocketVelocity = useRef(0);
  const gravity = 0.45;
  const jumpForce = -7.5;
  const obstacles = useRef<{ x: number; topHeight: number; bottomY: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);

  const requestRef = useRef<number | null>(null);

  const jump = () => {
    if (gameStateRef.current === 'idle') {
      // Start game
      setGameState('playing');
      setScore(0);
      obstacles.current = [];
      rocketY.current = 150;
      rocketVelocity.current = jumpForce;
      playRetroSound('click');
    } else if (gameStateRef.current === 'playing') {
      rocketVelocity.current = jumpForce;
      playRetroSound('jump');
    } else if (gameStateRef.current === 'gameover') {
      // Reset
      setGameState('playing');
      setScore(0);
      obstacles.current = [];
      rocketY.current = 150;
      rocketVelocity.current = jumpForce;
      playRetroSound('click');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed canvas coordinates
    canvas.width = 320;
    canvas.height = 360;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#090d16'; // Deep space dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 20; i++) {
        const x = (i * 37 + frameCount.current * 0.2) % canvas.width;
        const y = (i * 19) % canvas.height;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      if (gameStateRef.current === 'playing') {
        // Physics update
        rocketVelocity.current += gravity;
        rocketY.current += rocketVelocity.current;

        // Cap velocity
        if (rocketVelocity.current > 12) rocketVelocity.current = 12;

        // Ground/ceiling collisions
        if (rocketY.current > canvas.height - 25 || rocketY.current < 5) {
          playRetroSound('die');
          setGameState('gameover');
        }

        // Spawn obstacles
        frameCount.current++;
        if (frameCount.current % 120 === 0) {
          const minHeight = 40;
          const maxHeight = 160;
          const gapSize = 120;
          const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
          const bottomY = topHeight + gapSize;
          obstacles.current.push({
            x: canvas.width,
            topHeight,
            bottomY,
            passed: false
          });
        }

        // Move and draw obstacles
        obstacles.current = obstacles.current.filter((obs) => {
          obs.x -= 1.8; // Obstacle velocity

          // Hitbox collision checks
          const rocketX = 60;
          const rocketRadius = 12;

          // Check top column
          const hitTop =
            rocketX + rocketRadius > obs.x &&
            rocketX - rocketRadius < obs.x + 35 &&
            rocketY.current - rocketRadius < obs.topHeight;

          // Check bottom column
          const hitBottom =
            rocketX + rocketRadius > obs.x &&
            rocketX - rocketRadius < obs.x + 35 &&
            rocketY.current + rocketRadius > obs.bottomY;

          if (hitTop || hitBottom) {
            playRetroSound('die');
            setGameState('gameover');
          }

          // Point score tracking check
          if (!obs.passed && obs.x < rocketX) {
            obs.passed = true;
            playRetroSound('point');
            setScore((s) => {
              const newScore = s + 1;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('ftjm_flappy_highscore', String(newScore));
              }
              return newScore;
            });
          }

          // Draw neon glowing columns
          // TopColumn
          const gradientTop = ctx.createLinearGradient(obs.x, 0, obs.x + 35, 0);
          gradientTop.addColorStop(0, '#10b981');
          gradientTop.addColorStop(1, '#059669');
          ctx.fillStyle = gradientTop;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(obs.x, 0, 35, obs.topHeight, [0, 0, 8, 8]) : ctx.fillRect(obs.x, 0, 35, obs.topHeight);
          ctx.fill();

          // BottomColumn
          const gradientBottom = ctx.createLinearGradient(obs.x, obs.bottomY, obs.x + 35, obs.bottomY);
          gradientBottom.addColorStop(0, '#10b981');
          gradientBottom.addColorStop(1, '#059669');
          ctx.fillStyle = gradientBottom;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(obs.x, obs.bottomY, 35, canvas.height - obs.bottomY, [8, 8, 0, 0]) : ctx.fillRect(obs.x, obs.bottomY, 35, canvas.height - obs.bottomY);
          ctx.fill();

          return obs.x > -40; // keep obstacle if still on screen
        });
      }

      // Draw flying rocket emoji as bird
      const rx = 60;
      const ry = rocketY.current;

      ctx.save();
      ctx.translate(rx, ry);
      // Rotate emoji based on velocity for beautiful feel
      const rot = Math.min(Math.max(rocketVelocity.current * 0.05, -0.4), 0.7);
      ctx.rotate(rot);

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚀', 0, 0);
      ctx.restore();

      // Setup state UI overlays inside canvas
      if (gameStateRef.current === 'idle') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 16px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TIK OM TE VLIEGEN', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
        ctx.font = '900 12px "JetBrains Mono", monospace';
        ctx.fillText('SPATIEBALK OF ARROWUP', canvas.width / 2, canvas.height / 2 + 10);
      } else if (gameStateRef.current === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f87171';
        ctx.font = '900 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED! 💥', canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.fillText(`Jouw Score: ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 5);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillText('Tik op het bord om te herstarten', canvas.width / 2, canvas.height / 2 + 35);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="bg-app-card border border-app-border rounded-[2rem] p-6 max-w-sm mx-auto w-full flex flex-col items-center select-none">
      {/* Score */}
      <div className="flex justify-between w-full mb-4 px-1 font-mono text-sm leading-none select-none">
        <div className="flex items-center gap-1.5 text-app-ink font-bold leading-none">
          <span>PTS:</span>
          <span>{score}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-500 font-bold leading-none">
          <Trophy className="w-4 h-4" />
          <span>BEST:</span>
          <span>{highScore}</span>
        </div>
      </div>

      {/* Stage Canvas */}
      <div
        ref={containerRef}
        onClick={jump}
        className="w-[300px] h-[340px] rounded-2xl relative border-2 border-slate-800/80 shadow-md overflow-hidden cursor-pointer"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <p className="mt-4 text-[10px] text-app-muted font-bold uppercase tracking-wider text-center select-none">
        Tik op het zwarte speelveld om te vliegen & ontwijk de pilaren!
      </p>
    </div>
  );
}

/* ==========================================================================
   4. SYSADMIN BITTERBAL CHAOS (Original Game)
   ========================================================================== */
interface FallObject {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'bitterbal' | 'frikandel' | 'fan' | 'wifi' | 'virus' | 'bsod';
  width: number;
  height: number;
  emoji: string;
}

function SysAdminGame({ onBack }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('ftjm_sysadmin_highscore') || '0'));
  const [temperature, setTemperature] = useState(30); // starts at 30C, game over if >= 100C
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // Game live loop refs
  const stateRef = useRef({
    gameState,
    score,
    temperature,
    basketX: 135,
    basketWidth: 50,
    basketHeight: 40,
    objects: [] as FallObject[],
    nextId: 1,
    frameCount: 0,
    keys: { Left: false, Right: false },
    touchX: null as number | null
  });

  // Sync state refs
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.score = score;
  }, [score]);

  useEffect(() => {
    stateRef.current.temperature = temperature;
  }, [temperature]);

  const requestRef = useRef<number | null>(null);

  const playSynthesizedTone = (type: 'catch' | 'fan' | 'virus' | 'bsod' | 'start') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.11);
      } else if (type === 'fan') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } else if (type === 'virus') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'bsod') {
        // Dramatic low crash noise
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.25);
        
        // second oscillator for chord of doom
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(110, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.25);

        osc.start();
        osc.stop(ctx.currentTime + 1.3);
        osc2.start();
        osc2.stop(ctx.currentTime + 1.3);
      } else if (type === 'start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, ctx.currentTime); // Mi
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1); // La
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.2); // Do#
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.3); // Mi
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const startGame = () => {
    playSynthesizedTone('start');
    setScore(0);
    setTemperature(35);
    setGameState('playing');
    stateRef.current.objects = [];
    stateRef.current.basketX = 135;
    stateRef.current.temperature = 35;
    stateRef.current.score = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.Left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.Right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.Left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.Right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Controls via mouse move and touch move on canvas
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canvasRef.current || gameState !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touchRatio = (e.touches[0].clientX - rect.left) / rect.width;
    const touchX = touchRatio * 320;
    stateRef.current.basketX = Math.max(0, Math.min(320 - stateRef.current.basketWidth, touchX - stateRef.current.basketWidth / 2));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || gameState !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseRatio = (e.clientX - rect.left) / rect.width;
    const mouseX = mouseRatio * 320;
    stateRef.current.basketX = Math.max(0, Math.min(320 - stateRef.current.basketWidth, mouseX - stateRef.current.basketWidth / 2));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard baseline dimensions of the viewport
    const baseWidth = 320;
    const baseHeight = 360;

    const gameLoop = () => {
      // Automatic High-DPI Resolution multiplier (always sharp and bright on high def displays!)
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== baseWidth * dpr || canvas.height !== baseHeight * dpr) {
        canvas.width = baseWidth * dpr;
        canvas.height = baseHeight * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Background
      ctx.fillStyle = '#111029'; // Dynamic, deeply saturated midnight violet backdrop
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Cute binary falling numbers decor in background
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.font = '10px monospace';
      for (let i = 0; i < 8; i++) {
        const fallY = (stateRef.current.frameCount * 0.5 + i * 50) % baseHeight;
        ctx.fillText(i % 2 === 0 ? '0' : '1', i * 40 + 15, fallY);
      }

      stateRef.current.frameCount++;

      if (stateRef.current.gameState === 'playing') {
        // Temperature creeps up slowly over time (IT heat stress!)
        if (stateRef.current.frameCount % 25 === 0) {
          setTemperature(t => {
            const nextTemp = Math.min(100, t + 1);
            if (nextTemp >= 100) {
              playSynthesizedTone('bsod');
              setGameState('gameover');
            }
            return nextTemp;
          });
        }

        // 2. Drive Cabinet Basket Controls (Steer speed is 8 for rapid responsive control)
        if (stateRef.current.keys.Left) {
          stateRef.current.basketX = Math.max(0, stateRef.current.basketX - 8);
        }
        if (stateRef.current.keys.Right) {
          stateRef.current.basketX = Math.min(baseWidth - stateRef.current.basketWidth, stateRef.current.basketX + 8);
        }

        // 3. Spawns Objects
        const spawnOdds = 0.015 + (stateRef.current.score * 0.0001); // speeds up slowly based on score
        if (Math.random() < spawnOdds) {
          const rand = Math.random();
          let type: FallObject['type'] = 'wifi';
          let emoji = '📶';
          
          if (rand < 0.40) {
            type = 'wifi';
            emoji = '📶';
          } else if (rand < 0.65) {
            type = 'bitterbal';
            emoji = '🧆';
          } else if (rand < 0.77) {
            type = 'virus';
            emoji = '👾';
          } else if (rand < 0.88) {
            type = 'fan';
            emoji = '🌀';
          } else if (rand < 0.95) {
            type = 'frikandel';
            emoji = '🍟';
          } else {
            type = 'bsod';
            emoji = '🟦';
          }

          const speed = 1.5 + Math.random() * 1.5 + (stateRef.current.score * 0.04);

          stateRef.current.objects.push({
            id: stateRef.current.nextId++,
            x: Math.random() * (baseWidth - 28) + 14,
            y: -20,
            speed,
            type,
            width: 22,
            height: 22,
            emoji
          });
        }

        // 4. Update and Draw Falling Objects
        stateRef.current.objects = stateRef.current.objects.filter(obj => {
          obj.y += obj.speed;

          // Compute bright neon glow background ring colors to make elements pop off the dark void!
          let glowColor = 'rgba(255, 255, 255, 0.12)';
          let strokeColor = '';
          if (obj.type === 'virus') {
            glowColor = 'rgba(239, 68, 68, 0.3)'; // Neon red background alert for deadly viruses
            strokeColor = '#ef4444';
          } else if (obj.type === 'bsod') {
            glowColor = 'rgba(37, 99, 235, 0.4)'; // Heavy blue alert for crash threat
            strokeColor = '#2563eb';
          } else if (obj.type === 'bitterbal') {
            glowColor = 'rgba(245, 158, 11, 0.2)'; // Golden/amber food glow
            strokeColor = 'rgba(245, 158, 11, 0.6)';
          } else if (obj.type === 'frikandel') {
            glowColor = 'rgba(234, 179, 8, 0.2)'; // Food yellow glow
            strokeColor = 'rgba(234, 179, 8, 0.6)';
          } else if (obj.type === 'wifi') {
            glowColor = 'rgba(16, 185, 129, 0.2)'; // Tech green Wifi vibe
            strokeColor = 'rgba(16, 185, 129, 0.6)';
          } else if (obj.type === 'fan') {
            glowColor = 'rgba(6, 182, 212, 0.25)'; // Cooling cyan wind glow
            strokeColor = 'rgba(6, 182, 212, 0.6)';
          }

          // Render lovely soft backing glow
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, 16, 0, Math.PI * 2);
          ctx.fill();

          if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Draw item magnified at 26px font-size for ultimate easy-to-see clarity!
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.emoji, obj.x, obj.y + 1);

          // Highly precise Axis-Aligned Bounding Box (AABB) collision checks with server rack
          const basketTop = baseHeight - 40;
          const basketBottom = baseHeight;
          const basketLeft = stateRef.current.basketX;
          const basketRight = stateRef.current.basketX + stateRef.current.basketWidth;

          const objHalfWidth = 14;
          const isColliding = 
            (obj.y + objHalfWidth >= basketTop) &&
            (obj.y - objHalfWidth <= basketBottom) &&
            (obj.x + objHalfWidth >= basketLeft) &&
            (obj.x - objHalfWidth <= basketRight);

          if (isColliding) {
            // CATCHED! Handle bonuses and penalty damage
            if (obj.type === 'wifi') {
              playSynthesizedTone('catch');
              setScore(s => {
                const ns = s + 15;
                if (ns > highScore) {
                  setHighScore(ns);
                  localStorage.setItem('ftjm_sysadmin_highscore', String(ns));
                }
                return ns;
              });
            } else if (obj.type === 'bitterbal') {
              playSynthesizedTone('catch');
              setScore(s => {
                const ns = s + 25;
                if (ns > highScore) {
                  setHighScore(ns);
                  localStorage.setItem('ftjm_sysadmin_highscore', String(ns));
                }
                return ns;
              });
              setTemperature(t => Math.max(15, t - 6));
            } else if (obj.type === 'frikandel') {
              playSynthesizedTone('catch');
              setScore(s => {
                const ns = s + 50;
                if (ns > highScore) {
                  setHighScore(ns);
                  localStorage.setItem('ftjm_sysadmin_highscore', String(ns));
                }
                return ns;
              });
              setTemperature(t => Math.max(15, t - 16));
            } else if (obj.type === 'fan') {
              playSynthesizedTone('fan');
              setTemperature(t => Math.max(15, t - 26));
            } else if (obj.type === 'virus') {
              playSynthesizedTone('virus');
              setScore(s => Math.max(0, s - 10));
              setTemperature(t => Math.min(100, t + 12));
            } else if (obj.type === 'bsod') {
              playSynthesizedTone('bsod');
              setTemperature(100);
              setGameState('gameover');
            }

            return false; // remove from canvas
          }

          // Let it disappear off screen
          return obj.y < baseHeight + 20;
        });
      }

      // 5. Draw Server Cabinet Basket Player
      const bx = stateRef.current.basketX;
      const by = baseHeight - 40;
      const bw = stateRef.current.basketWidth;
      const bh = stateRef.current.basketHeight;

      // Draw custom glowing neon server cabinet rack
      ctx.fillStyle = '#0f172a'; // Deep slate
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 6) : ctx.fillRect(bx, by, bw, bh);
      ctx.fill();

      // Bright state-aware green/red neon outer border
      ctx.strokeStyle = stateRef.current.temperature > 75 ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Soft reflection highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(bx, by, bw / 2, bh);

      // Draw shiny neon LEDs on the server rack representing temperature status
      const flashColor = stateRef.current.frameCount % 20 < 10 ? '#ef4444' : '#7f1d1d';
      ctx.fillStyle = stateRef.current.temperature > 75 ? flashColor : '#10b981';
      ctx.beginPath();
      ctx.arc(bx + 10, by + 12, 3.5, 0, Math.PI * 2);
      ctx.arc(bx + 10, by + 28, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Shiny LED glowing reflections
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(bx + 10, by + 12, 7, 0, Math.PI * 2);
      ctx.arc(bx + 10, by + 28, 7, 0, Math.PI * 2);
      ctx.fill();

      // Server description text / emoji inside cabinet (centered, clear bold look)
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💻 SERVER', bx + bw / 2 + 5, by + bh / 2 + 1);

      // Handle custom Game State screens
      if (stateRef.current.gameState === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, baseWidth, baseHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SYSADMIN BITTERBAL CHAOS', baseWidth / 2, baseHeight / 2 - 50);

        ctx.fillStyle = 'rgba(251, 191, 36, 1)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('VANG RETRO SNACKS & WIFI', baseWidth / 2, baseHeight / 2 - 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        // Multi-line instruction
        ctx.fillText('Vermijd malware virussen (👾) en de BSOD (🟦)!', baseWidth / 2, baseHeight / 2 + 10);
        ctx.fillText('Vang Bitterballen (🧆) & koeling (🌀) tegen de hitte.', baseWidth / 2, baseHeight / 2 + 25);
        ctx.fillText('Besturing: Muis slepen / Touch of Pijltjestoetsen.', baseWidth / 2, baseHeight / 2 + 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px sans-serif';
        ctx.fillText('[ KLIK OM TE REPAREREN & STARTEN ]', baseWidth / 2, baseHeight / 2 + 85);
      } else if (stateRef.current.gameState === 'gameover') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; // Blue screen overlay
        ctx.fillRect(0, 0, baseWidth, baseHeight);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(':(', baseWidth / 2, baseHeight / 2 - 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('SERVER OVERVERHIT / BSOD CRASH', baseWidth / 2, baseHeight / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('Score: ' + stateRef.current.score + ' | Hitte: ' + Math.round(stateRef.current.temperature) + '°C', baseWidth / 2, baseHeight / 2 + 15);
        ctx.fillText('Error code: BITTERBAL_OVERFLOW_0x7B', baseWidth / 2, baseHeight / 2 + 35);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Klik hier om de server opnieuw op te starten', baseWidth / 2, baseHeight / 2 + 75);
      }

      ctx.restore();

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  return (
    <div className="bg-app-card border border-app-border rounded-[2rem] p-6 max-w-sm mx-auto w-full flex flex-col items-center select-none font-primary">
      {/* Gameplay Stats Header */}
      <div className="w-full space-y-3 mb-4">
        <div className="flex justify-between items-center font-mono text-xs">
          <div className="flex items-center gap-1 text-app-ink font-bold leading-none">
            <span>PUNTEN:</span>
            <span className="text-cyan-500 font-extrabold">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-bold leading-none">
            <Trophy className="w-3.5 h-3.5" />
            <span>RECORD:</span>
            <span>{highScore}</span>
          </div>
        </div>

        {/* Temperature Meter progress bar */}
        <div className="w-full space-y-1 select-none">
          <div className="flex justify-between items-center text-[10px] font-bold text-app-muted uppercase font-mono">
            <span>Server CPU Tempratuur:</span>
            <span className={temperature > 75 ? 'text-red-500 font-black animate-pulse' : 'text-emerald-500'}>
              {temperature}°C
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-[2px] border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                temperature > 75
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  : temperature > 50
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, temperature)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Screen Interactive Container */}
      <div
        ref={containerRef}
        onClick={() => {
          if (gameState === 'idle' || gameState === 'gameover') {
            startGame();
          }
        }}
        onTouchMove={handleTouchMove}
        onMouseMove={handleMouseMove}
        className="w-[300px] h-[360px] rounded-2xl relative border-2 border-slate-800/80 shadow-inner overflow-hidden cursor-crosshair"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Mobile control aid helper */}
      <div className="mt-4 flex gap-4 w-full">
        <button
          onTouchStart={() => { stateRef.current.keys.Left = true; }}
          onTouchEnd={() => { stateRef.current.keys.Left = false; }}
          onMouseDown={() => { stateRef.current.keys.Left = true; }}
          onMouseUp={() => { stateRef.current.keys.Left = false; }}
          className="flex-1 py-3 bg-app-accent hover:bg-app-accent/80 active:scale-95 text-app-ink rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          ◀ Links
        </button>
        <button
          onTouchStart={() => { stateRef.current.keys.Right = true; }}
          onTouchEnd={() => { stateRef.current.keys.Right = false; }}
          onMouseDown={() => { stateRef.current.keys.Right = true; }}
          onMouseUp={() => { stateRef.current.keys.Right = false; }}
          className="flex-1 py-3 bg-app-accent hover:bg-app-accent/80 active:scale-95 text-app-ink rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          Rechts ▶
        </button>
      </div>

      <p className="mt-3 text-[10px] text-app-muted font-bold uppercase tracking-wider text-center select-none">
        Volg de handleiding hieronder om de server online te houden!
      </p>

      {/* DETAILED LEDGER/GUIDE FOR THE ITEMS AND MECHANICS */}
      <div className="w-full mt-6 pt-5 border-t border-app-border/60 text-left space-y-4">
        <div>
          <h4 className="text-xs font-black text-app-ink uppercase tracking-wide">🔧 Handleiding & Legenda</h4>
          <p className="text-[11px] text-app-muted mt-1 leading-relaxed">
            Houd de server online! De processor warmt continu op door drukte. Vang de vallende snacks en koeling op om de server te koelen en punten te scoren!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 text-[11px]">
          {/* GOOD ITEMS */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">OPVANGEN (GOED):</span>
            
            <div className="flex items-center gap-2">
              <span className="text-base">🧆</span>
              <div>
                <span className="font-bold text-app-ink">Bitterbal:</span>
                <span className="text-emerald-500 font-semibold ml-1">+25 ptn / -6°C cooling</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base">🍟 / 🌭</span>
              <div>
                <span className="font-bold text-app-ink">Frikandel Speciaal:</span>
                <span className="text-emerald-500 font-semibold ml-1">+50 ptn / -16°C cooling</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base">🌀</span>
              <div>
                <span className="font-bold text-app-ink">Koeling (Fan):</span>
                <span className="text-teal-500 font-semibold ml-1">-26°C cooling!</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base">📶</span>
              <div>
                <span className="font-bold text-app-ink">WiFi signaal:</span>
                <span className="text-cyan-500 font-semibold ml-1">+15 ptn</span>
              </div>
            </div>
          </div>

          {/* BAD ITEMS */}
          <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">VERMIJDEN (SLECHT):</span>

            <div className="flex items-center gap-2">
              <span className="text-sm">👾</span>
              <div>
                <span className="font-bold text-app-ink">Malware Virus:</span>
                <span className="text-rose-500 font-semibold ml-1">-10 ptn / +12°C verhitting</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">🟦</span>
              <div>
                <span className="font-bold text-rose-500 font-black">BSOD (Blue Screen):</span>
                <span className="text-rose-500 font-semibold ml-1">Directe Server Crash! 💥</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-2.5 rounded-xl border border-slate-800 text-[10px] text-app-muted leading-relaxed">
          <span className="font-bold text-app-ink uppercase block mb-1">🎮 Besturingsopties:</span>
          • <span className="text-amber-500 font-bold">Toetsenbord:</span> A / D of Pijltjestoetsen Links & Rechts.<br />
          • <span className="text-amber-500 font-bold">Muis & Touch:</span> Sleep of tik op het speelveld om je server direct daarheen te bewegen!
        </div>
      </div>
    </div>
  );
}

