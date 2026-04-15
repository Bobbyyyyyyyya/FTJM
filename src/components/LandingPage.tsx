import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Shield, ArrowRight, MessageSquare, Zap } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  websiteStatus: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, websiteStatus }) => {
  return (
    <div className="min-h-screen bg-[#004276] flex flex-col relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
            <Shield className="w-6 h-6 text-[#004276]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white leading-none">FTJM</span>
            <span className="text-[8px] font-bold text-white/50 tracking-[0.3em] uppercase mt-1">Enterprise</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[9px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-[0.3em]">Features</a>
          <a href="#tos" className="text-[9px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-[0.3em]">Voorwaarden</a>
          <button 
            onClick={onLogin}
            className="px-6 py-2.5 bg-white text-[#004276] rounded-lg font-black text-[10px] hover:bg-zinc-100 transition-all active:scale-95 shadow-2xl shadow-black/20 uppercase tracking-widest"
          >
            Inloggen
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-xl rounded-full text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.3em]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'} animate-pulse`} />
            Systeem Status: {websiteStatus}
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9] uppercase">
            Samen bouwen <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/40 to-white/10">aan de toekomst</span>
          </h1>
          
          <p className="text-base sm:text-xl text-white/50 mb-12 leading-relaxed max-w-xl mx-auto font-medium">
            Welkom bij het officiële FTJM Besloten Forum. <br className="hidden sm:block" /> 
            Een exclusieve omgeving voor professionele samenwerking.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLogin}
              className="group w-full sm:w-auto px-10 py-5 bg-white text-[#004276] rounded-xl font-black text-base hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              TOEGANG KRIJGEN
            </button>
            <a 
              href="#about"
              className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white border border-white/10 rounded-xl font-black text-base hover:bg-white/10 transition-all active:scale-[0.98] backdrop-blur-sm flex items-center justify-center gap-3"
            >
              ONTDEK MEER
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-app-bg relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-app-ink mb-6 uppercase leading-none">
                Ontworpen voor <br /> <span className="text-[#004276]">Professionals</span>
              </h2>
              <p className="text-lg text-app-muted font-medium leading-relaxed">
                Ons platform biedt de tools die nodig zijn voor effectieve communicatie binnen een beveiligde bedrijfsomgeving.
              </p>
            </div>
            <div className="hidden md:block h-px flex-1 bg-app-border mx-12 mb-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'BEVEILIGD', desc: 'End-to-end encryptie en strikte whitelist-gebaseerde toegang voor alle leden.' },
              { icon: MessageSquare, title: 'REAL-TIME', desc: 'Directe interactie met collega\'s via ons geoptimaliseerde forum en DM-systeem.' },
              { icon: Zap, title: 'EFFICIËNT', desc: 'Snel informatie delen en beslissingen nemen in een gestroomlijnde omgeving.' }
            ].map((f, i) => (
              <div key={i} className="group p-10 rounded-[2rem] bg-app-card border border-app-border hover:shadow-xl transition-all duration-500">
                <div className="w-14 h-14 bg-app-accent rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#004276] group-hover:text-white transition-colors duration-500">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-app-ink mb-4 tracking-tight uppercase">{f.title}</h3>
                <p className="text-sm text-app-muted leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section id="about" className="py-24 bg-app-card relative z-10 border-t border-app-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#004276] rounded-[3rem] p-10 sm:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.3em] mb-8">
                  Leiderschap
                </div>
                <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white mb-8 uppercase leading-none">
                  Visie van de <br /> <span className="text-white/40">Directeur</span>
                </h2>
                <p className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed font-medium">
                  "Bij FTJM streven we naar een cultuur van openheid en innovatie. Dit forum is het hart van onze interne community."
                </p>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marko&backgroundColor=004276" alt="Marko Hoksen" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight">Marko Hoksen</h4>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[8px] mt-1">Directeur FTJM</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center p-10 shadow-2xl">
                  <Shield className="w-32 h-32 text-white/10 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-7xl font-black text-white/5 tracking-tighter uppercase">FTJM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Service Section */}
      <section id="tos" className="py-24 bg-app-bg relative z-10 border-t border-app-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-app-accent rounded-full text-[9px] font-black text-app-ink border border-app-border uppercase tracking-[0.3em] mb-6">
              Juridisch
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-app-ink uppercase leading-none">
              Terms of <span className="text-[#004276]">Service</span>
            </h2>
          </div>

          <div className="bg-app-card rounded-[2.5rem] p-8 sm:p-12 border border-app-border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#004276] uppercase tracking-widest">1. Gebruikersgedrag</h4>
                <p className="text-sm text-app-muted leading-relaxed font-medium">
                  De eigenaar van FTJM Enterprise is <span className="text-app-ink font-bold">niet verantwoordelijk</span> voor het gedrag, de uitspraken of de acties van gebruikers op dit platform. Gebruikers worden geacht zich professioneel en respectvol te gedragen.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#004276] uppercase tracking-widest">2. Inhoud & Aansprakelijkheid</h4>
                <p className="text-sm text-app-muted leading-relaxed font-medium">
                  Alle inhoud geplaatst door gebruikers is de exclusieve verantwoordelijkheid van de betreffende gebruiker. De eigenaar aanvaardt geen aansprakelijkheid voor onjuiste, lasterlijke of schadelijke informatie die door derden wordt gedeeld.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#004276] uppercase tracking-widest">3. Moderatie & Toegang</h4>
                <p className="text-sm text-app-muted leading-relaxed font-medium">
                  De eigenaar behoudt zich het recht voor om op elk moment, zonder voorafgaande kennisgeving en zonder opgaaf van redenen, de toegang van gebruikers te ontzeggen of geplaatste inhoud te verwijderen.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#004276] uppercase tracking-widest">4. Gegevens & Privacy</h4>
                <p className="text-sm text-app-muted leading-relaxed font-medium">
                  Gebruikers zijn zelf verantwoordelijk voor de beveiliging van hun account en inloggegevens. FTJM Enterprise is niet aansprakelijk voor schade voortvloeiend uit ongeautoriseerde toegang tot gebruikersaccounts.
                </p>
              </div>
            </div>
            
            <div className="pt-8 border-t border-app-border">
              <p className="text-[10px] text-app-muted italic text-center font-medium">
                Door gebruik te maken van dit platform stemt u in met deze voorwaarden. Het gebruik van FTJM Enterprise is geheel op eigen risico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-app-bg border-t border-app-border relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#004276] rounded-lg flex items-center justify-center shadow-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter text-[#004276]">FTJM</span>
            </div>
            <div className="flex items-center gap-10">
              <a href="#" className="text-[9px] font-black text-app-muted hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Privacy</a>
              <a href="#tos" className="text-[9px] font-black text-app-muted hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Voorwaarden</a>
              <a href="#" className="text-[9px] font-black text-app-muted hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Contact</a>
            </div>
          </div>
          <div className="pt-8 border-t border-app-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-bold text-app-muted uppercase tracking-widest">© 2026 FTJM Enterprise. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-app-accent flex items-center justify-center text-app-muted hover:bg-[#004276] hover:text-white transition-all cursor-pointer">
                <span className="text-[10px] font-black">LN</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-app-accent flex items-center justify-center text-app-muted hover:bg-[#004276] hover:text-white transition-all cursor-pointer">
                <span className="text-[10px] font-black">TW</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
