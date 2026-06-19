import React, { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { LogIn, Shield, ArrowRight, MessageSquare, Zap, Lock, Users, Globe, ChevronRight, FileText, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  websiteStatus: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, websiteStatus }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activeLegalTab, setActiveLegalTab] = useState<'tos' | 'privacy'>('tos');

  return (
    <div className="min-h-screen bg-[#002f54] flex flex-col relative overflow-hidden font-sans selection:bg-white/20 selection:text-white scroll-smooth">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[#002f54]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#004276] to-transparent opacity-80" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] -left-64 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ y: [0, 40, 0], opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] -right-64 w-[800px] h-[800px] bg-cyan-400/10 rounded-full blur-[150px]"
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-50"
      >
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)] group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="FTJM Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border border-white/40 rounded-2xl scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white leading-none">FTJM</span>
            <span className="text-[10px] font-bold text-cyan-400 tracking-[0.25em] uppercase mt-1">Enterprise</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1.5 shadow-xl">
          {['Doel', 'Features', 'Visie', 'Juridisch'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`} 
              className="px-6 py-2.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all uppercase tracking-[0.15em]"
            >
              {item}
            </a>
          ))}
        </div>

        <button 
          onClick={onLogin}
          className="group relative px-8 py-3.5 bg-white text-[#002f54] rounded-full font-black text-xs hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all active:scale-95 uppercase tracking-wider overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Inloggen
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>
      </motion.nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 py-24 min-h-[80vh]">
        <motion.div style={{ y, opacity }} className="max-w-5xl mx-auto w-full flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
            className="mb-12 inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/10 shadow-2xl uppercase tracking-[0.2em]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            Netwerk Status: <span className="text-white/90">{websiteStatus}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl lg:text-[6rem] font-black tracking-tighter text-white mb-8 leading-[1.05]"
          >
            Veilig bouwen <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-200 to-white/40">aan de toekomst</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg sm:text-2xl text-blue-100/70 mb-14 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Welkom bij het <strong className="text-white">FTJM Besloten Netwerk</strong>. <br className="hidden sm:block" /> 
            Een ongeschonden, end-to-end encrypted omgeving voor compromisloze samenwerking.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto"
          >
            <button 
              onClick={onLogin}
              className="group relative w-full sm:w-auto px-10 py-5 bg-white text-[#002f54] rounded-2xl font-black text-sm hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.1em] overflow-hidden"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Verifieer Identiteit
            </button>
            <a 
              href="#doel"
              className="group w-full sm:w-auto px-10 py-5 bg-black/20 text-white border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all active:scale-[0.98] backdrop-blur-xl flex items-center justify-center gap-3 uppercase tracking-[0.1em]"
            >
              Doel van het Platform
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* Doel van de app Section */}
      <section id="doel" className="py-24 relative z-20 max-w-7xl mx-auto px-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-cyan-400 border border-white/10 uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Onze Missie
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-[1.1]">
              Waarom bestaat <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white/60">het FTJM Platform?</span>
            </h2>
            <p className="text-lg text-blue-100/70 font-medium leading-relaxed">
              Het FTJM Netwerk is gebouwd met een helder en compromisloos doel: een <strong>exclusieve, uiterst veilige en onafhankelijke digitale haven</strong> creëren voor FTJM-leden.
            </p>
            <p className="text-base text-blue-100/60 leading-relaxed font-normal">
              In een tijdperk waarin publieke netwerken en reguliere communicatie-tools kwetsbaar zijn voor datalekken en ongewenste surveillance, biedt dit platform een ongeschonden toevluchtsoord. Hier kunnen we met volledige gemoedsrust de basis leggen voor de toekomst.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Exclusieve Connectie</h3>
              <p className="text-sm text-blue-100/60 leading-relaxed">
                Het samenbrengen van geverifieerde FTJM-leden in een besloten kring, om synergetische relaties te versterken en hechte interactie te waarborgen.
              </p>
            </div>

            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Diepgaande Discussie</h3>
              <p className="text-sm text-blue-100/60 leading-relaxed">
                Kennis structuren door moyen van gearchiveerde forums en real-time chats, waardoor waardevolle ideeën nooit verloren gaan en direct actiegericht zijn.
              </p>
            </div>

            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Onschendbare Privacy</h3>
              <p className="text-sm text-blue-100/60 leading-relaxed">
                Compromisloze beveiliging op militair niveau, zodat elke uitgewisselde gedachte of strategisch besluit strikt beveiligd binnen ons netwerk blijft.
              </p>
            </div>

            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md flex flex-col justify-center items-start bg-gradient-to-br from-[#004276]/40 to-cyan-500/5">
              <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Focus op Resultaat</h4>
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-wider mb-4">Eén Hub voor alles</p>
              <button 
                onClick={onLogin}
                className="group flex items-center gap-2 px-5 py-3 bg-white text-[#002f54] rounded-xl font-black text-xs uppercase tracking-wider hover:bg-cyan-100 transition-all active:scale-95 cursor-pointer"
              >
                Inloggen en ontdekken
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white relative z-20 rounded-t-[3rem] sm:rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-24 md:text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004276]/5 rounded-full text-[10px] font-black text-[#004276] border border-[#004276]/10 uppercase tracking-[0.2em] mb-6">
              <Zap className="w-3 h-3 text-cyan-600" /> Kernwaarden
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-zinc-900 mb-6 leading-[1.1]">
              Architectuur <br className="md:hidden" /> voor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004276] to-cyan-600">Professionals</span>
            </h2>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
              Ons netwerk combineert militaire beveiliging met een bliksemsnelle gebruikerservaring, specifiek ontworpen voor FTJM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <motion.div whileHover={{ y: -5 }} className="lg:col-span-2 relative group p-10 lg:p-14 rounded-[2.5rem] bg-zinc-50 border border-zinc-200 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-duration-700 pointer-events-none">
                <img 
                  src="/logo.png" 
                  alt="FTJM Logo" 
                  className="w-64 h-64 -rotate-12"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                <div className="w-16 h-16 bg-transparent rounded-2xl flex items-center justify-center mb-12 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="FTJM Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Zero-Knowledge Encryptie</h3>
                  <p className="text-lg text-zinc-500 font-medium max-w-md">
                    Elk bericht wordt versleuteld op uw apparaat voordat het ons netwerk raakt. Wij kunnen uw data niet lezen, zelfs niet als we dat zouden willen.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div whileHover={{ y: -5 }} className="relative group p-10 rounded-[2.5rem] bg-gradient-to-br from-[#004276] to-[#002f54] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-12 backdrop-blur-md border border-white/20 group-hover:bg-white group-hover:text-[#004276] transition-colors text-white">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Real-Time Sync</h3>
                  <p className="text-blue-100/70 font-medium">WebSocket verbindingen zorgen voor milliseconde snelle interactie met collega's.</p>
                </div>
              </div>
            </motion.div>

             {/* Feature 3 */}
             <motion.div whileHover={{ y: -5 }} className="relative group p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:border-[#004276]/20 transition-colors">
                <Users className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">Community Driven</h3>
              <p className="text-zinc-500 font-medium">Samenvoegen van denkkracht door middel van gestructureerde threads in een besloten omgeving.</p>
            </motion.div>

             {/* Feature 4 */}
             <motion.div whileHover={{ y: -5 }} className="relative group p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm hover:shadow-xl transition-shadow lg:col-span-2">
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <div className="shrink-0 w-20 h-20 bg-cyan-50 rounded-3xl flex items-center justify-center border border-cyan-100">
                  <Globe className="w-10 h-10 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Wereldwijd Beschikbaar, Lokaal Beveiligd</h3>
                  <p className="text-zinc-500 font-medium text-lg lg:max-w-lg">
                    Naadloze ervaring op desktop, tablet en mobiel. Blijf overal verbonden zonder concessies te doen aan veiligheid.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visie / Director Section */}
      <section id="visie" className="py-32 bg-zinc-900 relative z-20 overflow-hidden">
        {/* Dark theme background for contrast */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#004276]/30 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full text-[10px] font-bold text-white border border-white/10 uppercase tracking-[0.2em] mb-10 backdrop-blur-md">
                <Lock className="w-3 h-3 text-cyan-400" /> Leiderschap & Visie
              </div>
              
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white mb-10 leading-[1.05]">
                Radicale openheid,<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Volledige controle.</span>
              </h2>
              
              <div className="relative mb-12">
                <div className="absolute -left-8 -top-8 text-8xl text-white/5 font-serif leading-none">"</div>
                <p className="text-xl sm:text-3xl text-zinc-300 leading-tight font-medium relative z-10">
                  Bij FTJM geloven we dat ware innovatie alleen kan plaatsvinden in een omgeving waar ideeën vrijuit kunnen stromen, beschermd door ongeëvenaarde digitale veiligheid. Dit forum is het kloppende hart daarvan.
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-800">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marko&backgroundColor=004276" alt="Marko Hoksen" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Marko Hoksen</h3>
                  <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-[11px] mt-1.5 flex items-center gap-2">
                    Directeur FTJM
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="aspect-[4/5] rounded-[3rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-12 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[#004276] translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
                 <div className="w-32 h-32 mb-10 group-hover:scale-110 transition-transform duration-700 relative z-10 opacity-20 group-hover:opacity-50">
                    <img 
                      src="/logo.png" 
                      alt="FTJM Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                 </div>
                 <div className="relative z-10">
                    <p className="text-4xl font-black text-white/30 tracking-tighter uppercase mb-2 group-hover:text-white transition-colors duration-700">Trust</p>
                    <p className="text-2xl font-bold text-cyan-500/50 group-hover:text-cyan-300 transition-colors duration-700">The Network</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Juridisch / Legal Section */}
      <section id="juridisch" className="py-32 bg-zinc-50 relative z-20 border-t border-zinc-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-200/50 rounded-full text-[10px] font-black text-zinc-600 border border-zinc-300 uppercase tracking-[0.2em] mb-6">
              <Scale className="w-3 h-3" /> Officieel Document
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900">
              Juridisch & <span className="text-[#004276]">Privacy</span>
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-100 bg-zinc-50/50 p-2 gap-2">
              <button
                onClick={() => setActiveLegalTab('tos')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                  activeLegalTab === 'tos' 
                    ? 'bg-white text-[#004276] shadow-sm border border-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50'
                }`}
              >
                <FileText className="w-4 h-4" /> Algemene Voorwaarden
              </button>
              <button
                onClick={() => setActiveLegalTab('privacy')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-sm transition-all ${
                  activeLegalTab === 'privacy' 
                    ? 'bg-white text-[#004276] shadow-sm border border-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Privacybeleid
              </button>
            </div>

            {/* Content Container */}
            <div className="p-8 sm:p-12 h-[600px] overflow-y-auto custom-scrollbar relative">
               <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none sticky z-10" />
               <AnimatePresence mode="wait">
                 {activeLegalTab === 'tos' ? (
                   <motion.div
                     key="tos"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.3 }}
                     className="max-w-none space-y-6"
                   >
                      <h2 className="text-3xl font-black text-[#004276] tracking-tighter mb-4">ALGEMENE VOORWAARDEN EN GEBRUIKSRECHTEN VOOR FTJM ENTERPRISE</h2>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">Opgesteld: 5 mei 2026</p>

                      <section className="space-y-4">
                        <h3 className="text-xl font-bold text-zinc-900">1. Definities</h3>
                        <ul className="space-y-2 list-disc pl-5 text-zinc-600 font-medium">
                          <li><strong className="text-zinc-900">Platform:</strong> alle websites, mobiele apps, diensten, forums, chats, API’s, backend-systemen, databases, communicatiekanalen en overige functionaliteiten beheerd door FTJM Enterprise.</li>
                          <li><strong className="text-zinc-900">Eigenaar:</strong> FTJM Enterprise, de rechtspersoon die het Platform exploiteert.</li>
                          <li><strong className="text-zinc-900">Gebruiker:</strong> natuurlijke persoon of rechtspersoon die toegang heeft tot of gebruikmaakt van het Platform.</li>
                          <li><strong className="text-zinc-900">Inhoud:</strong> alle tekst, berichten, afbeeldingen, video’s, audio, bestanden, links, reacties, profielinformatie, metadata en overige door Gebruikers of de Eigenaar verstrekte data.</li>
                          <li><strong className="text-zinc-900">Diensten:</strong> alle gratis of betaalde functionaliteiten die door het Platform worden aangeboden.</li>
                        </ul>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">2. Toepasselijkheid</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Deze voorwaarden regelen de rechten en plichten tussen de Eigenaar en iedere Gebruiker met betrekking tot het gebruik van het Platform. Door het registreren, inloggen of gebruik van het Platform gaat de Gebruiker akkoord met deze voorwaarden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">3. Toegang en registratie</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">De Eigenaar bepaalt de aangeboden diensten en kan technische eisen vastleggen. Voor onderdelen is registratie vereist. Gebruikers moeten minimaal 13 jaar oud zijn. De Eigenaar kan identiteitsverificatie eisen en accounts weigeren, opschorten of beëindigen.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">4. Gebruikersgedrag en gebruiksregels</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Gebruikers gedragen zich professioneel en respectvol. Verboden gedragingen omvatten:</p>
                        <ul className="space-y-2 list-disc pl-5 text-zinc-600 font-medium">
                          <li>Illegale activiteiten, aanzetten tot haat, discriminatie, intimidatie.</li>
                          <li>Publicatie van lasterlijke, beledigende of onwettige inhoud.</li>
                          <li>Spam, phishing, manipulatie, malware.</li>
                          <li>Schenden van privacy, of schenden van auteursrecht.</li>
                        </ul>
                        <p className="text-zinc-600 font-medium">Sancties: overtredingen kunnen leiden tot waarschuwingen, tijdelijke schorsing, of permanente uitsluiting.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">5. Plaatsen, beheer en moderatie van inhoud</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">De Eigenaar behoudt zich het recht voor inhoud te modereren. Alle door Gebruikers geplaatste Inhoud is volledig voor rekening van die Gebruiker. Door het plaatsen verklaart de Gebruiker dat de Inhoud geen rechten schaadt.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">6. Intellectuele eigendom & Licenties</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Alle rechten van het Platform blijven bij de Eigenaar. Gebruikers behouden auteursrechten op eigen Inhoud, maar verlenen de Eigenaar een wereldwijde, royaltyvrije licentie om die Inhoud te gebruiken voor operationele doeleinden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">7. Betaalde diensten en betalingen</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Bepaalde functionaliteiten kunnen betaald zijn. Bij niet-betaling kan de dienst opgeschort of beëindigd worden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">8. Privacy, Vertrouwelijkheid en Telemetrie</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Persoonsgegevens worden verwerkt conform het Privacybeleid. Vertrouwelijke informatie wordt beschermd en buiten wettelijke uitzonderingen niet openbaar gemaakt. Om de privacy van Gebruikers maximaal te borgen, is het Platform zodanig geconfigureerd dat er <strong>geen IP-adressen (noch IPv4, noch IPv6) worden verzameld of opgeslagen</strong>. Technische metadata wordt uitsluitend en volledig geanoniseerd verwerkt ter beveiliging van het platform en preventie van misbruik.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">9. Beveiliging en accountverantwoordelijkheid</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Gebruikers zijn verantwoordelijk voor hun account. Bij ongeautoriseerde toegang meldt men dit direct. De Eigenaar neemt redelijke maatregelen maar kan volledige beveiliging niet garanderen.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">10. Aansprakelijkheid en vrijwaring</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">De Eigenaar is beperkt aansprakelijk voor directe schade tot maximaal het in 12 maanden gefactureerde bedrag (of EUR 1.000). Er is geen aansprakelijkheid voor indirecte schade. De Gebruiker vrijwaart de Eigenaar tegen aanspraken van derden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">11. Overmacht</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Geen aansprakelijkheid voor omstandigheden buiten controle. Na 60 dagen overmacht kan de overeenkomst beëindigd worden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">12. Duur en Beëindiging</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">De Eigenaar kan accounts beëindigen bij schending. Licenties vervallen en inhoud kan verwijderd worden.</p>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-xl font-bold text-zinc-900">13. Toepasselijk recht en geschillen</h3>
                        <p className="text-zinc-600 font-medium leading-relaxed">Nederlands recht is van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.</p>
                      </section>
                   </motion.div>
                 ) : (
                   <motion.div
                     key="privacy"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.3 }}
                     className="max-w-none space-y-6"
                   >
                     <h2 className="text-3xl font-black text-[#004276] tracking-tighter mb-4">PRIVACYBELEID FTJM ENTERPRISE</h2>
                     <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">Opgesteld: 5 mei 2026</p>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Inleiding</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Dit privacybeleid legt uit hoe FTJM Enterprise persoonsgegevens verzamelt, gebruikt, en deelt in verband met het gebruik van het Platform.</p>
                     </section>

                     <section className="space-y-4">
                       <h3 className="text-xl font-bold text-zinc-900">Welke gegevens we verzamelen en waarom</h3>
                       <ul className="space-y-3 list-disc pl-5 text-zinc-600 font-medium">
                         <li><strong className="text-zinc-900">Accountregistratie:</strong> e-mail, gebruikersnaam voor accountbeheer (Uitvoering overeenkomst).</li>
                         <li><strong className="text-zinc-900">Inhoud en communicatie:</strong> content, berichten, metadata voor dienstverlening (Uitvoering overeenkomst).</li>
                         <li><strong className="text-zinc-900">Gebruik, technische data en telemetrie:</strong> louter volledig geanonimiseerde sessie-identifiers en platform-activiteit, apparaattype, besturingssysteem en browsermetadata. Om uw privacy onvoorwaardelijk te garanderen, slaat ons platform GEEN IP-adressen (IPv4/IPv6), internetproviders (ISP) of geografische locaties op.</li>
                         <li><strong className="text-zinc-900">Betaalgegevens:</strong> transactiedata voor facturatie.</li>
                       </ul>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Cookies</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Wij gebruiken cookies voor essentiële functionaliteit en analytics. U kunt voorkeuren beheren via browserinstellingen.</p>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Delen van gegevens</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Wij delen gegevens met subprocessors (hosting), of autoriteiten bij wettelijke verplichting. Wij contracteren met verwerkers om veiligheid te borgen.</p>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Bewaartermijnen</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Accountgegevens en transacties: tot 7 jaar. Logs en tech data: 12-24 maanden. Content: totdat verwijdering is verzocht of account beeindigd is.</p>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Rechten van betrokkenen</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Onder toepasselijke wetgeving heeft u recht op toegang, rectificatie, verwijdering, en overdraagbaarheid. Verzoeken kunnen naar <strong>markohoksen@gmail.com</strong>.</p>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Beveiligingsmaatregelen</h3>
                       <p className="text-zinc-600 font-medium leading-relaxed">Wij hanteren encryptie (TLS), toegangsbeperkingen, en beveiligde hosting. Volledige veiligheid is helaas nooit 100% te garanderen.</p>
                     </section>

                     <section className="space-y-3">
                       <h3 className="text-xl font-bold text-zinc-900">Contact</h3>
                       <p className="text-zinc-600 font-medium">Functionaris gegevensbescherming: Marko Hoksen<br/>E-mail: markohoksen@gmail.com</p>
                     </section>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
            
            <div className="bg-zinc-50 border-t border-zinc-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500 font-medium">Door ons platform te gebruiken, gaat u akkoord met deze voorwaarden.</p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" /> Actueel en van kracht
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#001f38] relative z-10 overflow-hidden border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center border border-white/20 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="FTJM Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="block text-xl font-black tracking-tighter text-white leading-none">FTJM</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
              <a href="#doel" className="hover:text-white transition-colors">Doel</a>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <a href="#features" className="hover:text-white transition-colors">Platform</a>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <a href="#visie" className="hover:text-white transition-colors">Visie</a>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <a href="#juridisch" className="hover:text-white transition-colors">Documentatie</a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} FTJM Enterprise.
            </p>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-white/40 tracking-widest">ENCRYPTED CONNECTION</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
