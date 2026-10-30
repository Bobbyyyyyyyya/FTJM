import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Gamepad2, 
  Bell, 
  Lock, 
  ChevronRight, 
  ArrowRight,
  Newspaper,
  Terminal,
  History,
  Check,
  Flame,
  Palette,
  Eye,
  PhoneCall,
  SlidersHorizontal,
  Mic
} from 'lucide-react';
import { APP_VERSION, APP_VERSION_NAME, NEWS_ITEMS } from '../constants';
import { NewsItem } from '../types';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNews?: () => void;
  version?: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  onOpenNews,
  version = APP_VERSION
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'changelog' | 'history'>('highlights');
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentNews: NewsItem | undefined = NEWS_ITEMS.find(n => n.version === version) || NEWS_ITEMS[0];
  const previousNews: NewsItem[] = NEWS_ITEMS.filter(n => n.id !== currentNews?.id).slice(0, 5);

  const featureCards = [
    {
      icon: PhoneCall,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      shadowColor: 'shadow-emerald-500/20',
      badge: 'Call UI Revamp',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      title: "Gestroomlijnde Call UI 📞",
      description: "Alle nutteloze, verwarrende en niet-werkende dummy-knoppen (zoals loze kanaalwissels en inactieve placeholders) zijn resoluut verwijderd voor een rustige, betrouwbare bel-ervaring."
    },
    {
      icon: SlidersHorizontal,
      gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      shadowColor: 'shadow-cyan-500/20',
      badge: 'Ergonomische Dock',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      title: "Zwevende Glazen Bedieningsdock 🎛️",
      description: "Eén centrale ergonomische dock met duidelijke actieve statussen voor microfoon dempen, camera inschakelen, scherm delen en ophangen. Geen rommelige bedieningsknoppen meer!"
    },
    {
      icon: Mic,
      gradient: 'from-purple-500 via-indigo-600 to-cyan-500',
      shadowColor: 'shadow-purple-500/20',
      badge: 'Mini-Speler & Audio',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      title: "Direct Muten in Mini-Beller 🎙️",
      description: "Schakel je microfoon direct in of uit vanuit de compacte mini-speler onderin het scherm zonder het venster te maximaliseren, compleet met levendige spraakgolf-animaties."
    },
    {
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
      badge: 'Groepsgesprekken',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      title: "Overzichtelijke Groepscalls 👥",
      description: "Rustige en overzichtelijke deelnemersrasters met compacte statuschips en kristalheldere spraakdetectie, zonder afleidende badges of visuele ruis."
    },
    {
      icon: Palette,
      gradient: 'from-fuchsia-500 to-pink-600',
      shadowColor: 'shadow-pink-500/20',
      badge: 'Identiteit & Security',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      title: "35+ Karakters & Crystal AES Decryptie 💎",
      description: "Kies razendsnel uit tientallen kant-en-klare avatars en dynamische letter-monogrammen, gecombineerd met de geteste Crystal AES-decryptie voor foutloze chatberichten."
    }
  ];

  const changelogCategories = [
    {
      name: 'Call UI & Gesprekken',
      badge: 'Nieuw',
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      items: [
        "Volledig vernieuwde zwevende bedieningsbalk met dynamische microfoon-, camera- en schermdeelknoppen.",
        "Definitief verwijderen van nutteloze dummy- en placeholder-knoppen (geen loze kanaalknoppen of dode knoppen meer).",
        "Directe mute-schakelaar toegevoegd aan de geminimaliseerde zwevende mini-speler.",
        "Realtime dynamische audiogolven die reageren op spraakactiviteit van jou en je gesprekspartners."
      ]
    },
    {
      name: 'Verbeteringen & Ergonomie',
      badge: 'Verbeterd',
      color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      items: [
        "Discrete en compacte statuschips in plaats van grote, storende overlays tijdens groeps- en videogesprekken.",
        "Geoptimaliseerd schermdeel- en videoraamwerk met soepelere overgangen bij in- en uitklappen.",
        "Verbeterde responsive weergave en contrasten van gespreksknoppen op zowel mobiele schermen als desktop."
      ]
    },
    {
      name: 'Stabiliteit & Netwerk',
      badge: 'Opgelost',
      color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      items: [
        "Verbeterde gespreksstatus-synchronisatie bij inkomende en beëindigde oproepen.",
        "Verwijdering van spook-notificaties bij het minimaliseren van actieve voice-sessies.",
        "Betrouwbaardere WebRTC/audio status synchronisatie zonder haperingen in het achtergrondproces."
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop with rich blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-zinc-950 text-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh] z-10"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header Section */}
            <div className="relative p-6 sm:p-8 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0 flex items-center justify-center">
                    <div className="w-full h-full bg-zinc-950/80 rounded-[0.9rem] flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm">
                        {version} • NIEUW
                      </span>
                      <span className="text-[11px] font-medium text-cyan-300/80">
                        {currentNews?.date ? '23 Oktober 2026' : '23 Oktober 2026'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                      {APP_VERSION_NAME}
                    </h2>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-white/10 active:scale-95 shrink-0 cursor-pointer"
                  title="Sluiten (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-5 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('highlights')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'highlights'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hoogtepunten</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('changelog')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'changelog'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Changelog</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Geschiedenis</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* TAB 1: HIGHLIGHTS */}
              {activeTab === 'highlights' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Highlights Bullet Summary */}
                  {currentNews?.highlights && currentNews.highlights.length > 0 && (
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Belangrijkste Hoogtepunten in {version}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentNews.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {featureCards.map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div 
                          key={idx}
                          className="group relative p-4 sm:p-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-md ${card.shadowColor} group-hover:scale-110 transition-transform`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${card.badgeColor}`}>
                                {card.badge}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                              {card.title}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white">Altijd beschermd & up-to-date</h5>
                      <p className="text-[11px] text-zinc-400">
                        Alle updates worden naadloos geïnstalleerd zonder dataverlies van je opgeslagen berichten, thema's of voortgang.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CHANGELOG */}
              {activeTab === 'changelog' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {changelogCategories.map((cat, idx) => (
                    <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <span>{cat.name}</span>
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                          {cat.badge}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {cat.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* TAB 3: HISTORY */}
              {activeTab === 'history' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-zinc-400 mb-2">
                    Overzicht van recente updates en eerdere versies van het FTJM platform:
                  </p>
                  {previousNews.map((item) => {
                    const isExpanded = expandedHistoryId === item.id;
                    return (
                      <div 
                        key={item.id}
                        className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30">
                                {item.version}
                              </span>
                              <span className="text-[11px] text-zinc-500">{item.date}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1 truncate">
                              {item.title}
                            </h4>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2"
                            >
                              <p className="text-zinc-400 leading-relaxed">{item.content}</p>
                              {item.highlights && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Kernpunten:</span>
                                  {item.highlights.map((h, hIdx) => (
                                    <div key={hIdx} className="flex items-center gap-2 text-zinc-300 text-[11px]">
                                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                                      <span>{h}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="relative p-5 sm:p-6 bg-zinc-900/90 border-t border-white/10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              {onOpenNews ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNews();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold border border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <Newspaper className="w-4 h-4 text-cyan-400" />
                  <span>Volledig Nieuwsoverzicht</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/25"
              >
                <span>Aan de slag!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
