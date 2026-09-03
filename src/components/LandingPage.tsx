import React, { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { LogIn, ArrowRight, MessageSquare, Zap, Lock, Users, Globe, ChevronRight, FileText, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

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
      {/* Dynamic Original Blue Background with subtle animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#002f54]">
        {/* Subtle Ambient Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: ['-5%', '5%', '-5%'],
            y: ['-5%', '5%', '-5%']
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#004276]/40 blur-[120px]"
        />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: ['5%', '-5%', '5%'],
            y: ['5%', '-10%', '5%']
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[100px]"
        />

        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            x: ['0%', '10%', '0%'],
            y: ['10%', '0%', '10%']
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-blue-500/10 blur-[150px]"
        />

        {/* Flying Data Pulses / Shooting Stars */}
        <motion.div
          animate={{
            x: ['100vw', '-50vw'],
            y: ['-20vh', '120vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 6,
            ease: "linear"
          }}
          className="absolute top-0 right-[10%] w-[150px] h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent rotate-[35deg] blur-[1px]"
        />
        <motion.div
          animate={{
            x: ['120vw', '-20vw'],
            y: ['10vh', '150vh'],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 9,
            ease: "linear",
            delay: 4
          }}
          className="absolute top-0 right-[30%] w-[250px] h-[3px] bg-gradient-to-r from-transparent via-blue-300 to-transparent rotate-[35deg] blur-[2px]"
        />

        {/* Elegant noise texture */}
        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)]" />

        {/* Top/Bottom Vignette for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001E36]/80 via-transparent to-[#001E36]/90 z-0" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-50"
      >
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-10 h-10 bg-[#001E36] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform overflow-hidden border border-white/10">
            <Logo className="w-full h-full object-contain p-0.5" fallbackTextSize="text-xs font-black tracking-tighter" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white leading-none">FTJM</span>
            <span className="text-[9px] font-bold text-cyan-400 tracking-[0.2em] uppercase mt-0.5">Enterprise</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">
          <a href="#doel" className="hover:text-white transition-colors">Doel</a>
          <a href="#features" className="hover:text-white transition-colors">Platform</a>
          <a href="#visie" className="hover:text-white transition-colors">Visie</a>
          <a href="#juridisch" className="hover:text-white transition-colors">Juridisch</a>
        </div>

        <button 
          onClick={onLogin}
          className="group relative px-6 py-2.5 bg-white text-[#002f54] rounded-lg font-black text-xs hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-95 uppercase tracking-wider"
        >
          <span className="flex items-center gap-2">
            Inloggen
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </motion.nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 py-20 min-h-[85vh]">
        <motion.div style={{ y, opacity }} className="max-w-4xl mx-auto w-full flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white/90 border border-white/10 shadow-lg uppercase tracking-widest"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${websiteStatus.toLowerCase() === 'online' ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${websiteStatus.toLowerCase() === 'online' ? 'bg-cyan-500' : 'bg-amber-500'}`}></span>
            </span>
            Systeem Status: <span className="text-white font-black">{websiteStatus}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-7xl lg:text-[6rem] font-black tracking-tighter text-white mb-6 leading-[1.05]"
          >
            Veilig bouwen <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-200 to-white/40">aan de toekomst</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-blue-100/80 mb-12 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Het FTJM Netwerk is een gesloten, zwaar beveiligde omgeving. Ontworpen voor compromisloze communicatie, end-to-end encryptie en geverifieerde toegang.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#002f54] rounded-xl font-black text-xs hover:bg-cyan-50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl"
            >
              <LogIn className="w-4 h-4" />
              Systeem Toegang
            </button>
            <a 
              href="#doel"
              className="group w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-white/20 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              Ontdek Meer
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* Doel Section */}
      <section id="doel" className="py-24 relative z-20 border-t border-white/5 bg-[#001A30]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-md text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> De Missie
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Waarom het <br />
                FTJM Netwerk?
              </h2>
              <p className="text-lg text-blue-100/70 leading-relaxed">
                We leven in een tijdperk van data-exploitatie. Het FTJM platform is opgericht als tegenreactie: een <strong>volledig onafhankelijke, afgeschermde digitale haven</strong>.
              </p>
              <p className="text-base text-blue-100/50 leading-relaxed">
                Geen tracking, geen datamining, en geen externe pottenkijkers. Dit platform verbindt geverifieerde leden via versleutelde kanalen om innovatie en diepgaande discussies in alle rust mogelijk te maken.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                <Users className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Gesloten Kring</h3>
                <p className="text-sm text-blue-100/60 leading-relaxed">Alleen op uitnodiging. Een netwerk dat uitsluitend bestaat uit geverifieerde leden.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                <Lock className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Absolute Privacy</h3>
                <p className="text-sm text-blue-100/60 leading-relaxed">Militaire standaard encryptie garandeert dat jouw data uitsluitend van jou blijft.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Directe Communicatie</h3>
                  <p className="text-sm text-blue-100/60">Real-time chats en gestructureerde archieven voor optimale productiviteit.</p>
                </div>
                <button onClick={onLogin} className="shrink-0 w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-[#001526] relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">Professionele Architectuur</h2>
            <p className="text-blue-100/60">Gebouwd op moderne webtechnologie voor ongeëvenaarde snelheid, betrouwbaarheid en veiligheid op elk apparaat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-br from-[#002f54] to-[#001E36] border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Zap className="w-32 h-32" />
              </div>
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Zero-Knowledge Ontwerp</h3>
              <p className="text-blue-100/60 max-w-md">De architectuur is zo gebouwd dat zelfs de serverbeheerders geen toegang hebben tot de inhoud van versleutelde berichten of persoonlijke bestanden.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Overal Toegang</h3>
              <p className="text-blue-100/60 text-sm">Volledig responsief ontwerp met native desktop applicatie ondersteuning voor Windows, macOS en Linux.</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Synchronisatie</h3>
              <p className="text-blue-100/60 text-sm">State-of-the-art WebSockets zorgen voor instant berichtgeving en live status updates in het hele netwerk.</p>
            </div>

            <div className="md:col-span-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-white/10 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
              <h3 className="text-2xl font-black text-white mb-2">Klaar om in te loggen?</h3>
              <p className="text-blue-100/60 mb-6">Log in om toegang te krijgen tot het beveiligde netwerk.</p>
              <button onClick={onLogin} className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-bold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                Start Sessie
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visie Section */}
      <section id="visie" className="py-24 relative z-20 bg-[#001A30] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marko&backgroundColor=002f54" alt="Marko Hoksen" className="w-12 h-12 rounded-xl" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Geleid door visie.</h2>
              <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-6">Marko Hoksen — Directeur</h3>
              <div className="relative">
                <span className="text-6xl text-white/10 absolute -top-4 -left-4 font-serif leading-none">"</span>
                <p className="text-lg text-blue-100/80 font-medium leading-relaxed relative z-10 italic">
                  Innovatie gedijt uitsluitend in een veilige haven. We hebben het FTJM netwerk gebouwd omdat de huidige standaard voor privacy onvoldoende is. Wij leggen de macht en data terug bij het individu en het collectief.
                </p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-full h-full bg-[#002f54] border border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
                  <Lock className="w-12 h-12 text-cyan-400 mb-4" />
                  <span className="text-white font-black text-xl tracking-widest uppercase">Secured</span>
                  <span className="text-blue-100/50 text-xs mt-1">Network Infrastructure</span>
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
      <footer className="py-12 bg-[#001526] relative z-10 overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-transparent rounded-xl flex items-center justify-center border border-white/10 mb-6 opacity-50 relative overflow-hidden">
            <Logo className="w-full h-full object-contain p-0.5" fallbackTextSize="text-[10px] font-black tracking-tighter" />
          </div>
          <div className="flex items-center gap-6 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
            <a href="#doel" className="hover:text-white transition-colors">Doel</a>
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#visie" className="hover:text-white transition-colors">Visie</a>
            <a href="#juridisch" className="hover:text-white transition-colors">Documentatie</a>
          </div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
            © {new Date().getFullYear()} FTJM Enterprise.
          </p>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500/70 tracking-widest uppercase">End-to-End Encrypted Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
