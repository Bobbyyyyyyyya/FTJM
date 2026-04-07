import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, setSupabaseFirebaseUid, createSupabaseClient } from './utils/supabase';

import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './lib/firebase';
import { UserProfile, Post, Conversation, DirectMessage, CustomTheme, SupabaseErrorInfo } from './types';
import { LogIn, LogOut, User as UserIcon, Save, Loader2, AlertCircle, AlertTriangle, Send, Trash2, MessageSquare, ShieldCheck, UserPlus, X, Settings, Mail, ArrowLeft, Plus, Sparkles, Pencil, Check, Bell, Volume2, VolumeX, Camera, Flag, UserCog, Moon, Sun, Upload, Zap, CloudOff, Palette, ChevronLeft, Lock, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { NotificationSettings, Report } from './types';

// Sound URLs
const SOUND_OPTIONS = [
  { name: 'Standaard (2354)', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  { name: 'Melding (2358)', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { name: 'Ping (2360)', url: 'https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3' },
  { name: 'Chime (2362)', url: 'https://assets.mixkit.co/active_storage/sfx/2362/2362-preview.mp3' },
  { name: 'Alert (2364)', url: 'https://assets.mixkit.co/active_storage/sfx/2364/2364-preview.mp3' },
  { name: 'Success (2366)', url: 'https://assets.mixkit.co/active_storage/sfx/2366/2366-preview.mp3' },
  { name: 'Notification (2368)', url: 'https://assets.mixkit.co/active_storage/sfx/2368/2368-preview.mp3' },
  { name: 'Pop (2370)', url: 'https://assets.mixkit.co/active_storage/sfx/2370/2370-preview.mp3' },
  { name: 'Bling (2372)', url: 'https://assets.mixkit.co/active_storage/sfx/2372/2372-preview.mp3' },
];

const PATTERNS = [
  { id: 'none', name: 'Geen', style: '' },
  { id: 'dots', name: 'Stippen', style: 'radial-gradient(var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'grid', name: 'Raster', style: 'linear-gradient(var(--custom-accent) 1px, transparent 1px), linear-gradient(90deg, var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'stripes', name: 'Strepen', style: 'linear-gradient(45deg, var(--custom-accent) 25%, transparent 25%, transparent 50%, var(--custom-accent) 50%, var(--custom-accent) 75%, transparent 75%, transparent)', size: '20px 20px' },
  { id: 'waves', name: 'Golven', style: 'radial-gradient(circle at 100% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent)', size: '40px 40px' },
  { id: 'diagonal', name: 'Diagonaal', style: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--custom-accent) 10px, var(--custom-accent) 11px)', size: 'auto' },
];

const playSound = (url: string, enabled: boolean) => {
  if (!enabled || !url) return;
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play failed (user interaction required?):', e));
};

const formatDate = (isoString: string | undefined | null) => {
  if (!isoString) return '';
  // Explicitly parse ISO 8601 string (Supabase returns with Z or offset)
  const date = new Date(isoString);
  return date.toLocaleDateString('nl-NL', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

const formatTime = (isoString: string | undefined | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('nl-NL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

const LandingPage = ({ onLogin, websiteStatus }: { onLogin: () => void, websiteStatus: string }) => {
  return (
    <div className="min-h-screen bg-[#004276] flex flex-col relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
            <Shield className="w-8 h-8 text-[#004276]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white leading-none">FTJM</span>
            <span className="text-[10px] font-bold text-white/50 tracking-[0.3em] uppercase mt-1">Enterprise</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[10px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-[0.3em]">Features</a>
          <a href="#about" className="text-[10px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-[0.3em]">Over FTJM</a>
          <button 
            onClick={onLogin}
            className="px-8 py-3 bg-white text-[#004276] rounded-xl font-black text-xs hover:bg-zinc-100 transition-all active:scale-95 shadow-2xl shadow-black/20 uppercase tracking-widest"
          >
            Inloggen
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12 inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 backdrop-blur-xl rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-[0.3em]"
          >
            <span className={`w-2 h-2 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'} animate-pulse`} />
            Systeem Status: {websiteStatus}
          </motion.div>
          
          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-12 leading-[0.85] uppercase">
            Samen bouwen <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/40 to-white/10">aan de toekomst</span>
          </h1>
          
          <p className="text-lg sm:text-2xl text-white/50 mb-16 leading-relaxed max-w-2xl mx-auto font-medium">
            Welkom bij het officiële FTJM Besloten Forum. <br className="hidden sm:block" /> 
            Een exclusieve omgeving voor professionele samenwerking.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onLogin}
              className="group w-full sm:w-auto px-12 py-6 bg-white text-[#004276] rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4"
            >
              <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              TOEGANG KRIJGEN
            </button>
            <a 
              href="#about"
              className="w-full sm:w-auto px-12 py-6 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-[0.98] backdrop-blur-sm flex items-center justify-center gap-3"
            >
              ONTDEK MEER
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#005696] rounded-full blur-3xl pointer-events-none opacity-50" />
      </main>

      {/* Stats/Trust Bar */}
      <div className="w-full bg-black/20 backdrop-blur-md border-y border-white/5 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Actieve Leden', value: '500+' },
            { label: 'Projecten', value: '120+' },
            { label: 'Uptime', value: '99.9%' },
            { label: 'Beveiliging', value: 'SSL+' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-40 bg-zinc-50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-zinc-900 mb-8 uppercase leading-none">
                Ontworpen voor <br /> <span className="text-[#004276]">Professionals</span>
              </h2>
              <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                Ons platform biedt de tools die nodig zijn voor effectieve communicatie binnen een beveiligde bedrijfsomgeving.
              </p>
            </div>
            <div className="hidden md:block h-px flex-1 bg-zinc-200 mx-12 mb-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'BEVEILIGD', desc: 'End-to-end encryptie en strikte whitelist-gebaseerde toegang voor alle leden.' },
              { icon: MessageSquare, title: 'REAL-TIME', desc: 'Directe interactie met collega\'s via ons geoptimaliseerde forum en DM-systeem.' },
              { icon: Zap, title: 'EFFICIËNT', desc: 'Snel informatie delen en beslissingen nemen in een gestroomlijnde omgeving.' }
            ].map((f, i) => (
              <div key={i} className="group p-12 rounded-[2.5rem] bg-white border border-zinc-100 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-[#004276] group-hover:text-white transition-colors duration-500">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-6 tracking-tight uppercase">{f.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section id="about" className="py-40 bg-white relative z-10 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#004276] rounded-[4rem] p-12 sm:p-24 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-[0.3em] mb-12">
                  Leiderschap
                </div>
                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-white mb-10 uppercase leading-none">
                  Visie van de <br /> <span className="text-white/40">Directeur</span>
                </h2>
                <p className="text-xl sm:text-2xl text-white/70 mb-12 leading-relaxed font-medium">
                  "Bij FTJM streven we naar een cultuur van openheid en innovatie. Dit forum is het hart van onze interne community."
                </p>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marko&backgroundColor=004276" alt="Marko Hoksen" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tight">Marko Hoksen</h4>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Directeur FTJM</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center p-12 shadow-2xl">
                  <Shield className="w-40 h-40 text-white/10 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-8xl font-black text-white/5 tracking-tighter uppercase">FTJM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-zinc-50 border-t border-zinc-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#004276] rounded-xl flex items-center justify-center shadow-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-[#004276]">FTJM</span>
            </div>
            <div className="flex items-center gap-12">
              <a href="#" className="text-[10px] font-black text-zinc-400 hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Privacy</a>
              <a href="#" className="text-[10px] font-black text-zinc-400 hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Voorwaarden</a>
              <a href="#" className="text-[10px] font-black text-zinc-400 hover:text-[#004276] transition-colors uppercase tracking-[0.3em]">Contact</a>
            </div>
          </div>
          <div className="pt-12 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">© 2026 FTJM Enterprise. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-[#004276] hover:text-white transition-all cursor-pointer">
                <span className="text-[10px] font-black">LN</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-[#004276] hover:text-white transition-all cursor-pointer">
                <span className="text-[10px] font-black">TW</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RichContent = React.memo(({ content }: { content: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isGif = (url: string) => {
    return url.match(/\.(gif|webp)$/i) || url.includes('giphy.com/media') || url.includes('tenor.com/view');
  };

  return (
    <div className="space-y-2 break-words">
      <div className="whitespace-pre-wrap">{parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}</div>
      
      <div className="flex flex-col gap-4 mt-2">
        {content.match(urlRegex)?.map((url, i) => {
          const youtubeId = getYoutubeId(url);
          if (youtubeId) {
            return (
              <div key={i} className="relative aspect-video w-full max-w-2xl rounded-xl overflow-hidden shadow-lg border border-zinc-200">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            );
          }
          
          if (isGif(url)) {
            return (
              <div key={i} className="max-w-md rounded-xl overflow-hidden shadow-md border border-zinc-200">
                <img 
                  src={url} 
                  alt="Embedded content" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
});

// Error handler for Supabase
async function handleSupabaseError(error: any, operation: string, user?: any) {
  console.error(`Supabase Error during ${operation}:`, error);
  
  // Log full error details for debugging RLS/PostgREST issues
  if (error && typeof error === 'object') {
    console.log('Full Error Object:', JSON.stringify(error, null, 2));
    if (error.code) console.log('Error Code:', error.code);
    if (error.details) console.log('Error Details:', error.details);
    if (error.hint) console.log('Error Hint:', error.hint);
    if (error.message) console.log('Error Message:', error.message);
  }

  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    operation,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
    }
  };
  
  // Provide more specific feedback if it's an RLS error
  if (error?.code === '42501' || error?.message?.includes('insufficient permissions')) {
    toast.error(`Geen toestemming voor ${operation}. Controleer of je bent ingelogd en of de RLS-rechten goed staan.`);
  } else {
    toast.error(`Er is een fout opgetreden tijdens ${operation}: ${error?.message || 'Onbekende fout'}`);
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'enhanced'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'enhanced') || 'light';
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Failed to parse cached_profile', e);
      return null;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const cached = localStorage.getItem('cached_posts');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [whitelist, setWhitelist] = useState<{email: string, added_at: string}[]>(() => {
    const cached = localStorage.getItem('cached_whitelist');
    return cached ? JSON.parse(cached) : [];
  });

  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(() => {
    try {
      const cached = localStorage.getItem('cached_isWhitelisted');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Failed to parse cached_isWhitelisted', e);
      return null;
    }
  });

  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const isPostingRef = useRef(false);

  const [loading, setLoading] = useState(() => {
    // If we have a cached whitelist status, we can skip initial loading screen
    // and let the background check handle updates
    const cached = localStorage.getItem('cached_isWhitelisted');
    return cached === null;
  });
  const [saving, setSaving] = useState(false);
  const isSavingThemeRef = useRef(false);
  const currentUidRef = useRef<string | null>(null);
  const [sending, setSending] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [photoURLInput, setPhotoURLInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'forum' | 'messages' | 'settings' | 'todos'>('forum');
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState<any[]>([]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim() || !user) return;

    try {
      const { error } = await supabaseClient.from('todos').insert({
        name: todoInput.trim(),
        user_id: user.uid,
        is_completed: false
      });

      if (error) {
        handleSupabaseError(error, 'taak toevoegen');
      } else {
        setTodoInput('');
        // Refresh todos
        const { data } = await supabaseClient.from('todos').select('id, task, completed, created_at').eq('user_id', user.uid).order('created_at', { ascending: false });
        if (data) setTodos(data);
        toast.success('Taak toegevoegd!');
      }
    } catch (err) {
      console.error('Add todo error:', err);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseClient
        .from('todos')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'taak bijwerken');
      } else {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Toggle todo error:', err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabaseClient.from('todos').delete().eq('id', id);
      if (error) {
        handleSupabaseError(error, 'taak verwijderen');
      } else {
        setTodos(prev => prev.filter(t => t.id !== id));
        toast.success('Taak verwijderd');
      }
    } catch (err) {
      console.error('Delete todo error:', err);
    }
  };
  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'theme' | 'admin'>('profile');
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = localStorage.getItem('cached_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('Failed to parse cached_conversations', e);
      return [];
    }
  });

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostInput, setEditPostInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageInput, setEditMessageInput] = useState('');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const cached = localStorage.getItem('cached_notifications');
      return cached ? JSON.parse(cached) : {
        enable_sounds: true,
        notify_new_posts: true,
        notify_new_messages: true,
        message_sound: SOUND_OPTIONS[0].url,
        post_sound: SOUND_OPTIONS[1].url
      };
    } catch (e) {
      console.error('Failed to parse cached_notifications', e);
      return {
        enable_sounds: true,
        notify_new_posts: true,
        notify_new_messages: true,
        message_sound: SOUND_OPTIONS[0].url,
        post_sound: SOUND_OPTIONS[1].url
      };
    }
  });
  const [customSounds, setCustomSounds] = useState<{ name: string, url: string }[]>([]);
  const [uploadingSound, setUploadingSound] = useState(false);

  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    try {
      const cached = localStorage.getItem('cached_customTheme');
      return cached ? JSON.parse(cached) : {
        wallpaper: '',
        pattern: 'none',
        primary_color: '#18181b', // zinc-900
        secondary_color: '#27272a', // zinc-800
        accent_color: '#18181b',
        text_color: '#18181b',
        card_bg_color: '#ffffff',
        sidebar_bg_color: '#ffffff',
        header_bg_color: '#ffffff',
        body_bg_color: '#f4f4f5',
        glass_effect: false,
        blur_amount: 10,
        opacity: 100,
        wallpaper_x: 50,
        wallpaper_y: 50
      };
    } catch (e) {
      console.error('Failed to parse cached_customTheme', e);
      return {
        wallpaper: '',
        pattern: 'none',
        primary_color: '#18181b',
        secondary_color: '#27272a',
        accent_color: '#18181b',
        text_color: '#18181b',
        card_bg_color: '#ffffff',
        sidebar_bg_color: '#ffffff',
        header_bg_color: '#ffffff',
        body_bg_color: '#f4f4f5',
        glass_effect: false,
        blur_amount: 10,
        opacity: 100,
        wallpaper_x: 50,
        wallpaper_y: 50
      };
    }
  });

  const [useCustomTheme, setUseCustomTheme] = useState(() => {
    return localStorage.getItem('cached_useCustomTheme') === 'true';
  });

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'post' | 'message', id: string, userId: string, displayName: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [websiteStatus, setWebsiteStatus] = useState<string>(() => {
    return localStorage.getItem('cached_websiteStatus') || 'Online';
  });
  const [statusInput, setStatusInput] = useState('');
  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const cached = localStorage.getItem('cached_reports');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  
  const hasFetchedConversations = useRef(false);
  const hasFetchedPosts = useRef(false);
  const hasFetchedAdminData = useRef(false);
  const hasFetchedStatus = useRef(false);
  const hasFetchedProfile = useRef(false);
  const hasFetchedWhitelist = useRef(false);
  const [typingStatuses, setTypingStatuses] = useState<Record<string, string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingInId, setTypingInId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadTime = useRef(new Date().toISOString());
  const lastPostId = useRef<string | null>(null);
  const lastConversationUpdates = useRef<Record<string, string>>({});
  const notificationSettingsRef = useRef(notificationSettings);
  const activeConversationRef = useRef(activeConversation);
  const viewRef = useRef(view);

  const [supabaseClient, setSupabaseClient] = useState(supabase);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (useCustomTheme) {
      document.documentElement.setAttribute('data-custom-theme', 'true');
    } else {
      document.documentElement.removeAttribute('data-custom-theme');
    }

    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, useCustomTheme]);

  useEffect(() => {
    if (!user || !supabaseClient) return;

    const channel = supabaseClient.channel('online-users', {
      config: {
        presence: {
          key: user.uid,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineIds = new Set(Object.keys(newState));
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.uid,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, supabaseClient]);

  // Caching effects
  useEffect(() => {
    if (profile) {
      localStorage.setItem('cached_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('cached_whitelist', JSON.stringify(whitelist));
  }, [whitelist]);

  useEffect(() => {
    localStorage.setItem('cached_isWhitelisted', JSON.stringify(isWhitelisted));
  }, [isWhitelisted]);

  useEffect(() => {
    localStorage.setItem('cached_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('cached_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('cached_customTheme', JSON.stringify(customTheme));
  }, [customTheme]);

  useEffect(() => {
    localStorage.setItem('cached_useCustomTheme', useCustomTheme.toString());
  }, [useCustomTheme]);

  useEffect(() => {
    localStorage.setItem('cached_websiteStatus', websiteStatus);
  }, [websiteStatus]);

  useEffect(() => {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  useEffect(() => {
    const root = document.documentElement;
    
    if (!useCustomTheme) {
      root.removeAttribute('data-custom-theme');
      // Reset custom theme variables when disabled
      root.style.removeProperty('--custom-primary');
      root.style.removeProperty('--custom-secondary');
      root.style.removeProperty('--custom-accent');
      root.style.removeProperty('--custom-text');
      root.style.removeProperty('--custom-card-bg');
      root.style.removeProperty('--custom-sidebar-bg');
      root.style.removeProperty('--custom-header-bg');
      root.style.removeProperty('--custom-body-bg');
      root.style.removeProperty('--custom-blur');
      root.style.removeProperty('--custom-opacity');
      root.style.removeProperty('--custom-wallpaper-x');
      root.style.removeProperty('--custom-wallpaper-y');
      root.style.removeProperty('--custom-glass-bg');
      root.style.removeProperty('--custom-glass-blur');
      root.style.removeProperty('--custom-pattern');
      root.style.removeProperty('--custom-pattern-size');
      root.style.removeProperty('--custom-main-bg');
      root.style.removeProperty('--custom-main-bg-size');
      root.style.removeProperty('--custom-main-bg-pos');
      return;
    }

    if (useCustomTheme) {
      root.setAttribute('data-custom-theme', 'true');
    }

    if (customTheme.primary_color) root.style.setProperty('--custom-primary', customTheme.primary_color);
    if (customTheme.secondary_color) root.style.setProperty('--custom-secondary', customTheme.secondary_color);
    if (customTheme.accent_color) root.style.setProperty('--custom-accent', customTheme.accent_color);
    if (customTheme.text_color) root.style.setProperty('--custom-text', customTheme.text_color);
    if (customTheme.card_bg_color) root.style.setProperty('--custom-card-bg', customTheme.card_bg_color);
    if (customTheme.sidebar_bg_color) root.style.setProperty('--custom-sidebar-bg', customTheme.sidebar_bg_color);
    if (customTheme.header_bg_color) root.style.setProperty('--custom-header-bg', customTheme.header_bg_color);
    if (customTheme.body_bg_color) root.style.setProperty('--custom-body-bg', customTheme.body_bg_color);
    if (customTheme.blur_amount !== undefined) root.style.setProperty('--custom-blur', `${customTheme.blur_amount}px`);
    if (customTheme.opacity !== undefined) root.style.setProperty('--custom-opacity', `${customTheme.opacity / 100}`);
    if (customTheme.wallpaper_x !== undefined) root.style.setProperty('--custom-wallpaper-x', `${customTheme.wallpaper_x}%`);
    if (customTheme.wallpaper_y !== undefined) root.style.setProperty('--custom-wallpaper-y', `${customTheme.wallpaper_y}%`);
    
    // Glass Effect Variables
    if (customTheme.glass_effect) {
      const r = parseInt(customTheme.card_bg_color?.slice(1,3) || 'ff', 16);
      const g = parseInt(customTheme.card_bg_color?.slice(3,5) || 'ff', 16);
      const b = parseInt(customTheme.card_bg_color?.slice(5,7) || 'ff', 16);
      const a = (customTheme.opacity || 100) / 100;
      root.style.setProperty('--custom-glass-bg', `rgba(${r}, ${g}, ${b}, ${a})`);
      root.style.setProperty('--custom-glass-blur', `blur(${customTheme.blur_amount || 10}px)`);
    } else {
      root.style.setProperty('--custom-glass-bg', customTheme.card_bg_color || '#ffffff');
      root.style.setProperty('--custom-glass-blur', 'none');
    }
    
    // Apply pattern
    const pattern = PATTERNS.find(p => p.id === customTheme.pattern);
    if (pattern) {
      root.style.setProperty('--custom-pattern', pattern.style);
      root.style.setProperty('--custom-pattern-size', pattern.size);
    } else {
      root.style.setProperty('--custom-pattern', 'none');
      root.style.setProperty('--custom-pattern-size', 'auto');
    }

    // Main Background Variables
    const bgImages = [];
    const bgSizes = [];
    const bgPositions = [];
    
    if (pattern && pattern.style) {
      bgImages.push(pattern.style);
      bgSizes.push(pattern.size || 'auto');
      bgPositions.push('center');
    }
    
    if (customTheme.wallpaper) {
      bgImages.push(`url(${customTheme.wallpaper})`);
      bgSizes.push('cover');
      bgPositions.push(`${customTheme.wallpaper_x || 50}% ${customTheme.wallpaper_y || 50}%`);
    }
    
    if (bgImages.length > 0) {
      root.style.setProperty('--custom-main-bg', bgImages.join(', '));
      root.style.setProperty('--custom-main-bg-size', bgSizes.join(', '));
      root.style.setProperty('--custom-main-bg-pos', bgPositions.join(', '));
    } else {
      root.style.setProperty('--custom-main-bg', 'none');
      root.style.setProperty('--custom-main-bg-size', 'auto');
      root.style.setProperty('--custom-main-bg-pos', 'center');
    }
  }, [customTheme, useCustomTheme]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const handleQuotaError = () => setIsQuotaExceeded(true);
    window.addEventListener('firestore-quota-exceeded', handleQuotaError);
    return () => window.removeEventListener('firestore-quota-exceeded', handleQuotaError);
  }, []);

  const isAdmin = user?.email === 'markohoksen@gmail.com';

  // Update Supabase client with custom headers when user changes
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Update Modal Check
  useEffect(() => {
    if (user && isWhitelisted) {
      const hasSeenUpdate = localStorage.getItem('hasSeenBugWarning_1');
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }
  }, [user, isWhitelisted]);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await supabaseClient.from('profiles').select('id').limit(1);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setError("Supabase configuratiefout: De client is offline.");
        }
      }
    }
    testConnection();
  }, [supabaseClient]);

  useEffect(() => {
    if (view === 'todos' && user) {
      const getTodos = async () => {
        const { data } = await supabaseClient.from('todos').select('id, task, completed, created_at').eq('user_id', user.uid).order('created_at', { ascending: false });
        if (data) setTodos(data);
      };
      getTodos();
    }
  }, [view, user, supabaseClient]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        if (currentUidRef.current !== currentUser.uid) {
          currentUidRef.current = currentUser.uid;
          setSupabaseFirebaseUid(currentUser.uid);
          
          // Recreate Supabase client with UID for Realtime headers
          const newClient = createSupabaseClient(currentUser.uid);
          setSupabaseClient(newClient);
          
          // Initial profile fetch
          try {
            const { data, error } = await newClient
              .from('profiles')
              .select('id, display_name, original_name, email, photo_url, bio, role, notification_settings, custom_theme, use_custom_theme, custom_sounds, created_at, updated_at')
              .eq('id', currentUser.uid)
              .single();
              
            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
              handleSupabaseError(error, 'profiel ophalen');
            } else if (data) {
              setProfile(data);
              localStorage.setItem('cached_profile', JSON.stringify(data));
              setDisplayNameInput(data.display_name || currentUser.displayName || '');
              setPhotoURLInput(data.photo_url || currentUser.photoURL || '');
              setBioInput(data.bio || '');
              if (data.notification_settings) {
                setNotificationSettings(data.notification_settings);
              }
              if (data.custom_sounds) {
                setCustomSounds(data.custom_sounds);
              }
              if (data.custom_theme) {
                setCustomTheme(prev => ({ ...prev, ...data.custom_theme }));
              }
              if (data.use_custom_theme !== undefined) {
                setUseCustomTheme(data.use_custom_theme);
              }
            }
          } catch (err) {
            console.error('Initial profile fetch error:', err);
          }
        }
      } else {
        currentUidRef.current = null;
        setSupabaseFirebaseUid(null);
        setSupabaseClient(createSupabaseClient(null));
        setProfile(null);
        setIsWhitelisted(null);
        localStorage.removeItem('cached_profile');
        localStorage.removeItem('cached_isWhitelisted');
        localStorage.removeItem('cached_conversations');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Whitelist check
  useEffect(() => {
    if (!user) return;

    const checkWhitelist = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('whitelist')
          .select('email, added_at')
          .eq('email', user.email)
          .single();
          
        const exists = !!data;
        let whitelisted = exists || isAdmin;

        if (isAdmin && !exists) {
          // Seed admin into whitelist
          try {
            await supabaseClient.from('whitelist').insert({
              email: user.email,
              added_at: new Date().toISOString(),
              added_by: 'system'
            });
            whitelisted = true;
          } catch (e) {
            console.warn('Admin seeding failed, but bypassing locally:', e);
          }
        }
        
        console.log('Whitelist check result:', { whitelisted, exists, isAdmin });
        setIsWhitelisted(whitelisted);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(whitelisted));
      } catch (err) {
        console.error('Whitelist check error:', err);
        handleSupabaseError(err, 'whitelist check');
        setIsWhitelisted(isAdmin);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(isAdmin));
      } finally {
        setLoading(false);
      }
    };

    checkWhitelist();
  }, [user, isAdmin, supabaseClient]);

  // Real-time profile sync
  useEffect(() => {
    if (!user || isWhitelisted === false) return;

    const channel = supabaseClient
      .channel(`profile:${user.uid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.uid}`
      }, (payload) => {
        const data = payload.new as UserProfile;
        setProfile(data);
        localStorage.setItem('cached_profile', JSON.stringify(data));
        setBioInput(data.bio || '');
        setDisplayNameInput(data.display_name || '');
        setPhotoURLInput(data.photo_url || '');
        
        if (!isSavingThemeRef.current && !(view === 'settings' && settingsTab === 'theme')) {
          if (data.notification_settings) {
            setNotificationSettings(data.notification_settings);
          }
          if (data.custom_theme) {
            setCustomTheme(prev => ({ ...prev, ...data.custom_theme }));
          }
          if (data.use_custom_theme !== undefined) {
            setUseCustomTheme(data.use_custom_theme);
          }
        }
      })
      .subscribe((status) => {
        console.log(`Profile subscription status for ${user.uid}:`, status);
      });

    // Create profile if it doesn't exist
    const ensureProfile = async () => {
      if (hasFetchedProfile.current) return;
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, bio, role, notification_settings, updated_at, email, created_at, custom_theme, use_custom_theme')
        .eq('id', user.uid)
        .single();
        
      if (error && error.code === 'PGRST116' && isWhitelisted) {
        const newProfile: UserProfile = {
          id: user.uid,
          display_name: user.displayName || 'Anoniem',
          email: user.email || '',
          photo_url: user.photoURL || undefined,
          use_custom_theme: useCustomTheme,
          notification_settings: notificationSettings,
          custom_theme: customTheme,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user',
          bio: ''
        };
        const { error: insertError } = await supabaseClient.from('profiles').insert(newProfile);
        if (!insertError) {
          setProfile(newProfile);
          localStorage.setItem('cached_profile', JSON.stringify(newProfile));
          hasFetchedProfile.current = true;
        }
      } else if (data) {
        const profileData = data as UserProfile;
        setProfile(profileData);
        localStorage.setItem('cached_profile', JSON.stringify(profileData));
        setBioInput(profileData.bio || '');
        setDisplayNameInput(profileData.display_name || '');
        setPhotoURLInput(profileData.photo_url || '');
        
        if (!isSavingThemeRef.current && !(view === 'settings' && settingsTab === 'theme')) {
          if (profileData.notification_settings) setNotificationSettings(profileData.notification_settings);
          if (profileData.custom_theme) setCustomTheme(prev => ({ ...prev, ...profileData.custom_theme }));
          if (profileData.use_custom_theme !== undefined) setUseCustomTheme(profileData.use_custom_theme);
        }
        hasFetchedProfile.current = true;
      }
    };
    ensureProfile();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, isWhitelisted, supabaseClient]);

  // Real-time whitelist and reports sync for admin
  useEffect(() => {
    if (!isAdmin || !user) return;

    const whitelistChannel = supabaseClient
      .channel('whitelist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whitelist' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          setWhitelist(prev => {
            const updated = [payload.new as any, ...prev];
            localStorage.setItem('cached_whitelist', JSON.stringify(updated));
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
          setWhitelist(prev => {
            const updated = prev.map(w => w.email === payload.new.email ? payload.new as any : w);
            localStorage.setItem('cached_whitelist', JSON.stringify(updated));
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          setWhitelist(prev => {
            const updated = prev.filter(w => w.email !== payload.old.email);
            localStorage.setItem('cached_whitelist', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe();

    const reportsChannel = supabaseClient
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, async (payload) => {
        console.log('Admin: Real-time report change:', payload);
        if (payload.eventType === 'INSERT') {
          setReports(prev => {
            const updated = [payload.new as Report, ...prev];
            localStorage.setItem('cached_reports', JSON.stringify(updated));
            return updated;
          });
          toast.info('Nieuw rapport binnengekomen');
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => {
            const updated = prev.map(r => r.id === payload.new.id ? payload.new as Report : r);
            localStorage.setItem('cached_reports', JSON.stringify(updated));
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => {
            const updated = prev.filter(r => r.id !== payload.old.id);
            localStorage.setItem('cached_reports', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe();

    // Initial fetch if not already done or if in admin view
    if (!hasFetchedAdminData.current || (view === 'settings' && settingsTab === 'admin')) {
      const fetchAdminData = async () => {
        const [wRes, rRes] = await Promise.all([
          supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }),
          supabaseClient.from('reports').select('id, reporter_id, reported_id, target_type, target_id, reason, details, status, created_at').order('created_at', { ascending: false })
        ]);
        
        if (wRes.data) {
          setWhitelist(wRes.data);
          localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
        }
        if (rRes.data) {
          setReports(rRes.data);
          localStorage.setItem('cached_reports', JSON.stringify(rRes.data));
        }
        hasFetchedAdminData.current = true;
      };
      fetchAdminData();
    }

    return () => {
      supabaseClient.removeChannel(whitelistChannel);
      supabaseClient.removeChannel(reportsChannel);
    };
  }, [isAdmin, user, supabaseClient, view, settingsTab]);

  // Website status
  useEffect(() => {
    if (hasFetchedStatus.current) return;
    
    const fetchStatus = async () => {
      const { data, error } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'websiteStatus')
        .single();
        
      if (data) {
        const status = data.value?.status || 'Online';
        setWebsiteStatus(status);
        setStatusInput(status);
        localStorage.setItem('cached_websiteStatus', status);
        hasFetchedStatus.current = true;
      }
    };
    fetchStatus();
  }, [supabaseClient]);

  // Real-time conversations sync
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const channel = supabaseClient
      .channel(`conversations:${user.uid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participants=cs.{${user.uid}}`
      }, async (payload) => {
        console.log('Real-time conversation change:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedConv = payload.new as Conversation;
          
          setConversations(prev => {
            const exists = prev.some(c => c.id === updatedConv.id);
            let newConvs;
            if (exists) {
              newConvs = prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c);
            } else {
              newConvs = [updatedConv, ...prev];
            }
            
            // Notification logic for new messages
            if (updatedConv.updated_at > (lastConversationUpdates.current[updatedConv.id] || '') && 
                updatedConv.last_message_sender_id !== user.uid && 
                updatedConv.updated_at > initialLoadTime.current) {
              
              const otherParticipantUid = updatedConv.participants.find((uid: string) => uid !== user.uid);
              const senderName = otherParticipantUid ? updatedConv.participant_names[otherParticipantUid] : 'Iemand';
              
              if (notificationSettingsRef.current.notify_new_messages && (activeConversationRef.current?.id !== updatedConv.id || viewRef.current !== 'messages')) {
                toast.success(`Nieuw bericht van ${senderName}`, {
                  description: updatedConv.last_message?.substring(0, 50) + (updatedConv.last_message && updatedConv.last_message.length > 50 ? '...' : ''),
                  action: {
                    label: 'Beantwoorden',
                    onClick: () => {
                      setActiveConversation(updatedConv);
                      setView('messages');
                    }
                  }
                });
                playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enable_sounds);
              }
            }
            lastConversationUpdates.current[updatedConv.id] = updatedConv.updated_at;
            
            const sorted = newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
            localStorage.setItem('cached_conversations', JSON.stringify(sorted));
            return sorted;
          });
        } else if (payload.eventType === 'DELETE') {
          setConversations(prev => {
            const filtered = prev.filter(c => c.id !== payload.old.id);
            localStorage.setItem('cached_conversations', JSON.stringify(filtered));
            return filtered;
          });
        }
      })
      .on('broadcast', { event: 'conversation_update' }, (payload) => {
        console.log('Broadcast conversation update received:', payload);
        const update = payload.payload;
        setConversations(prev => {
          const newConvs = prev.map(c => c.id === update.id ? { ...c, ...update } : c);
          return newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        });
      })
      .subscribe((status) => {
        console.log(`Conversations subscription status for ${user.uid}:`, status);
      });

    // Initial fetch if not already done
    if (!hasFetchedConversations.current || view === 'messages') {
      const fetchConversations = async () => {
        const { data } = await supabaseClient
          .from('conversations')
          .select('id, participants, participant_names, participant_photos, last_message, last_message_sender_id, updated_at')
          .contains('participants', [user.uid]);
        if (data) {
          setConversations(data.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')));
          localStorage.setItem('cached_conversations', JSON.stringify(data));
          hasFetchedConversations.current = true;
        }
        setLoading(false);
      };
      fetchConversations();
    }

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, isWhitelisted, supabaseClient, view]);

  // Real-time messages sync
  useEffect(() => {
    if (!user || !activeConversation) {
      setMessages([]);
      return;
    }

    const channel = supabaseClient
      .channel(`messages:${activeConversation.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, (payload) => {
        console.log('Real-time message change:', payload);
        if (payload.eventType === 'INSERT') {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as DirectMessage];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as DirectMessage : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('Broadcast message received:', payload);
        const msg = payload.payload as DirectMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe((status) => {
        console.log(`Messages subscription status for ${activeConversation.id}:`, status);
      });

    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at, updated_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, activeConversation, supabaseClient]);

  // Cleanup typing status on unmount or conversation change
  useEffect(() => {
    return () => {
      if (user && typingInId && isTyping) {
        supabaseClient
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `${typingInId}_${user.uid}`);
      }
    };
  }, [typingInId, user, isTyping, supabaseClient]);

  // Real-time typing indicators sync
  useEffect(() => {
    if (!user) {
      setTypingStatuses({});
      return;
    }

    const channel = supabaseClient.channel('typing_presence');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newStatuses: Record<string, string[]> = {};
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id !== user.uid && p.is_typing) {
              const convId = p.conversation_id;
              const userName = p.user_name || 'Iemand';
              if (!newStatuses[convId]) newStatuses[convId] = [];
              if (!newStatuses[convId].includes(userName)) newStatuses[convId].push(userName);
            }
          });
        });
        setTypingStatuses(newStatuses);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Presence join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Presence leave:', key, leftPresences);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing'
      }, async (payload) => {
        // Use payload for real-time updates instead of refetching
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new as any;
          if (row.user_id !== user.uid) {
            setTypingStatuses(prev => {
              const newStatuses = { ...prev };
              const convId = row.conversation_id;
              const userName = row.user_name || 'Iemand';
              
              if (row.is_typing && (Date.now() - new Date(row.last_updated).getTime()) < 10000) {
                if (!newStatuses[convId]) newStatuses[convId] = [];
                if (!newStatuses[convId].includes(userName)) newStatuses[convId].push(userName);
              } else {
                if (newStatuses[convId]) {
                  newStatuses[convId] = newStatuses[convId].filter(name => name !== userName);
                  if (newStatuses[convId].length === 0) delete newStatuses[convId];
                }
              }
              return newStatuses;
            });
          }
        }
      })
      .subscribe((status) => {
        console.log('Typing subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to typing presence');
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, supabaseClient]);

  // Fetch all users for starting new conversations
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'messages' || !showUserSearch) return;

    const fetchUsers = async () => {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at')
        .neq('id', user.uid);
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [user, isWhitelisted, view, showUserSearch, supabaseClient]);

  // Real-time posts feed
  useEffect(() => {
    if (!user || !isWhitelisted) {
      console.log('Posts sync skipped:', { user: !!user, isWhitelisted });
      return;
    }

    console.log('Starting posts real-time sync...');
    const channel = supabaseClient
      .channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async (payload) => {
        console.log('Real-time post change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          const latestPost = payload.new as Post;
          if (lastPostId.current && latestPost && latestPost.id !== lastPostId.current && 
              latestPost.author_id !== user.uid && 
              latestPost.created_at > initialLoadTime.current) {
            if (notificationSettingsRef.current.notify_new_posts) {
              toast.info(`Nieuw bericht van ${latestPost.author_name}`, {
                description: latestPost.content.substring(0, 50) + (latestPost.content.length > 50 ? '...' : ''),
                action: {
                  label: 'Bekijken',
                  onClick: () => setView('forum')
                }
              });
              playSound(notificationSettingsRef.current.post_sound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enable_sounds);
            }
          }
          if (latestPost) lastPostId.current = latestPost.id;
          
          setPosts((prev) => {
            if (prev.some(p => p.id === latestPost.id)) return prev;
            const newPosts = [latestPost, ...prev].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ).slice(0, 20);
            localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            return newPosts;
          });
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => {
            const newPosts = prev.map(p => p.id === payload.new.id ? payload.new as Post : p);
            localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            return newPosts;
          });
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => {
            const newPosts = prev.filter(p => p.id !== payload.old.id);
            localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            return newPosts;
          });
        }
      })
      .on('broadcast', { event: 'new_post' }, (payload) => {
        console.log('Broadcast post received:', payload);
        const latestPost = payload.payload as Post;
        
        if (lastPostId.current && latestPost && latestPost.id !== lastPostId.current && 
            latestPost.author_id !== user.uid && 
            latestPost.created_at > initialLoadTime.current) {
          if (notificationSettingsRef.current.notify_new_posts) {
            toast.info(`Nieuw bericht van ${latestPost.author_name}`, {
              description: latestPost.content.substring(0, 50) + (latestPost.content.length > 50 ? '...' : ''),
              action: {
                label: 'Bekijken',
                onClick: () => setView('forum')
              }
            });
            playSound(notificationSettingsRef.current.post_sound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enable_sounds);
          }
        }
        if (latestPost) lastPostId.current = latestPost.id;
        
        setPosts((prev) => {
          if (prev.some(p => p.id === latestPost.id)) return prev;
          const newPosts = [latestPost, ...prev].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, 20);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
      })
      .subscribe((status) => {
        console.log('Posts subscription status:', status);
      });

    // Initial fetch
    const fetchPosts = async () => {
      if (isPostingRef.current || hasFetchedPosts.current) return;
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select('id, content, author_id, author_name, author_photo, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setPosts(data);
        localStorage.setItem('cached_posts', JSON.stringify(data));
        hasFetchedPosts.current = true;
      }
      setLoading(false);
    };
    fetchPosts();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, isWhitelisted, supabaseClient]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      handleSupabaseError(err, 'Google inloggen');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om instellingen op te slaan');
      return;
    }
    if (!checkRateLimit()) return;
    setSaving(true);
    setError(null);

    const updatedData: any = {
      id: user.uid,
      display_name: displayNameInput.trim() || user.displayName || 'Anoniem',
      photo_url: photoURLInput.trim() || user.photoURL || null,
      bio: bioInput.trim() || null,
      notification_settings: notificationSettings,
      custom_theme: customTheme,
      use_custom_theme: useCustomTheme,
      custom_sounds: customSounds,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .upsert(updatedData, { onConflict: 'id' });
        
      if (error) throw error;
      
      // Update local profile state
      setProfile(prev => ({ ...prev, ...updatedData } as UserProfile));
      localStorage.setItem('cached_profile', JSON.stringify({ ...profile, ...updatedData }));
      
      toast.success('Instellingen opgeslagen');
    } catch (err) {
      handleSupabaseError(err, 'instellingen opslaan', user);
    } finally {
      setSaving(false);
    }
  };

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabaseClient) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Alleen audiobestanden zijn toegestaan');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bestand is te groot (max 2MB)');
      return;
    }

    setUploadingSound(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}/${Date.now()}.${fileExt}`;
      const filePath = `sounds/${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('public')
        .getPublicUrl(filePath);

      const newSound = { name: file.name.split('.')[0], url: publicUrl };
      const updatedSounds = [...customSounds, newSound];
      setCustomSounds(updatedSounds);
      
      // Update profile immediately
      await supabaseClient
        .from('profiles')
        .update({ custom_sounds: updatedSounds })
        .eq('id', user.uid);

      toast.success('Geluid geüpload!');
    } catch (err) {
      handleSupabaseError(err, 'geluid uploaden');
    } finally {
      setUploadingSound(false);
    }
  };

  const handleResetToGoogle = () => {
    if (!user) return;
    setDisplayNameInput(user.displayName || '');
    setPhotoURLInput(user.photoURL || '');
    toast.info('Google profiel gegevens geladen. Vergeet niet op te slaan!');
  };

  const handleOpenProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, display_name, original_name, email, photo_url, bio, role, created_at, updated_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) setSelectedUser(data);
    } catch (err) {
      handleSupabaseError(err, 'profiel ophalen');
    }
  };

  const handleOpenReport = (type: 'user' | 'post' | 'message', id: string, userId: string, displayName: string) => {
    setReportTarget({ type, id, userId, displayName });
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportTarget || !reportReason.trim()) return;
    if (!checkRateLimit()) return;
    setSending(true);

    try {
      const { error } = await supabaseClient.from('reports').insert({
        reporter_id: user.uid,
        reported_id: reportTarget.userId,
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
        created_at: new Date().toISOString(),
        status: 'pending'
      });
      if (error) throw error;
      toast.success('Rapport ingediend. Bedankt voor je hulp.');
      setReportTarget(null);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      handleSupabaseError(err, 'rapport indienen');
    } finally {
      setSending(false);
    }
  };

  const checkRateLimit = () => {
    const now = Date.now();
    
    // Global 1-second minimum delay between any action
    const lastAction = messageTimestamps[messageTimestamps.length - 1] || 0;
    if (now - lastAction < 1000) {
      toast.error('Wacht een seconde...');
      return false;
    }

    if (cooldownUntil && now < cooldownUntil) {
      toast.error(`Je gaat te snel! Wacht nog ${Math.ceil((cooldownUntil - now) / 1000)} seconden.`);
      return false;
    }
    
    if (cooldownUntil && now >= cooldownUntil) {
      setCooldownUntil(null);
      setCooldownRemaining(0);
    }

    // Burst limit: 3 actions in 5 seconds
    const recentTimestamps = messageTimestamps.filter(t => now - t < 5000);
    
    if (recentTimestamps.length >= 3) {
      const newCooldown = now + 10000;
      setCooldownUntil(newCooldown);
      setCooldownRemaining(10);
      toast.error('Je gaat te snel! Wacht nog 10 seconden.');
      return false;
    }
    
    setMessageTimestamps([...recentTimestamps, now]);
    return true;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleCreatePost triggered', { user: !!user, postInput: !!postInput.trim(), isWhitelisted });
    if (!user || !postInput.trim() || isWhitelisted !== true) {
      if (isWhitelisted === null) {
        toast.error('Wacht even, we controleren je toegang...');
      } else if (isWhitelisted === false) {
        toast.error('Je hebt geen toegang om berichten te plaatsen.');
      }
      return;
    }
    
    if (!checkRateLimit()) return;
    
    isPostingRef.current = true;
    const content = postInput.trim();
    setSending(true);
    setError(null);

    const postPromise = (async () => {
      console.log('Attempting to insert post:', { content, author_id: user.uid });
      const { data: insertData, error } = await supabaseClient.from('posts').insert({
        author_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || undefined,
        content: content,
        created_at: new Date().toISOString()
      }).select().single();

      if (error) {
        console.error('Insert post error:', error);
        isPostingRef.current = false;
        throw error;
      }

      console.log('Post inserted successfully:', insertData);
      setPostInput('');

      // Update state directly with the new post to avoid race conditions
      if (insertData) {
        setPosts((prev) => {
          const alreadyExists = prev.some(p => p.id === insertData.id);
          if (alreadyExists) return prev;
          const newPosts = [insertData, ...prev].slice(0, 20);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
        
        // Broadcast new post to others
        console.log('Broadcasting new post:', insertData);
        const channel = supabaseClient.channel('posts_changes');
        channel.send({
          type: 'broadcast',
          event: 'new_post',
          payload: insertData
        }).then(status => console.log('Post broadcast status:', status));
      }

      // We still do a background refetch just in case, but we don't block on it
      // and we handle the isPostingRef carefully
      setTimeout(async () => {
        try {
          const { data: refetchData } = await supabaseClient
            .from('posts')
            .select('id, content, author_id, author_name, author_photo, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (refetchData) {
            setPosts(refetchData);
            localStorage.setItem('cached_posts', JSON.stringify(refetchData));
          }
        } finally {
          isPostingRef.current = false;
        }
      }, 1000);

      return insertData;
    })();

    toast.promise(postPromise, {
      loading: 'Bericht plaatsen...',
      success: 'Bericht geplaatst!',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet plaatsen'}`
    });

    try {
      await postPromise;
      // Clear typing status
      if (isTyping && typingInId === 'forum') {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        await supabaseClient
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `forum_${user.uid}`);
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht plaatsen', user);
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!checkRateLimit()) return;
    
    isPostingRef.current = true;
    const deletePromise = (async () => {
      console.log('Attempting to delete post:', postId);
      console.log('Current User UID:', user.uid);
      console.log('Is Admin:', isAdmin);
      
      // DIAGNOSE: Check wie de auteur is in de DB voordat we verwijderen
      const { data: checkData } = await supabaseClient
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();
      
      console.log('Post author in database:', checkData?.author_id);

      let query = supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId);
      
      // Alleen filteren op author_id als je GEEN admin bent
      if (!isAdmin) {
        query = query.eq('author_id', user.uid);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Delete post error details:', error);
        isPostingRef.current = false;
        throw error;
      }

      console.log('Delete response data:', data);

      if (!data || data.length === 0) {
        isPostingRef.current = false;
        // If data is empty, it means either the post doesn't exist or RLS blocked it
        throw new Error('Verwijderen mislukt. Controleer of je de auteur bent en of RLS-rechten goed staan.');
      }
      
      // Update local state immediately for better UX
      setPosts(prev => {
        const newPosts = prev.filter(p => p.id !== postId);
        localStorage.setItem('cached_posts', JSON.stringify(newPosts));
        return newPosts;
      });
      
      // Background refetch
      setTimeout(async () => {
        try {
          const { data: refetchedData } = await supabaseClient
            .from('posts')
            .select('id, content, author_id, author_name, author_photo, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(20);
          if (refetchedData) {
            setPosts(refetchedData);
            localStorage.setItem('cached_posts', JSON.stringify(refetchedData));
          }
        } finally {
          isPostingRef.current = false;
        }
      }, 1000);

      return data;
    })();

    toast.promise(deletePromise, {
      loading: 'Bericht verwijderen...',
      success: 'Bericht verwijderd',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet verwijderen'}`
    });

    try {
      await deletePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht verwijderen', user);
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editPostInput.trim()) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    
    isPostingRef.current = true;
    const updatePromise = (async () => {
      console.log('Attempting to update post:', postId);
      console.log('Current User UID:', user.uid);
      console.log('Is Admin:', isAdmin);
      
      let query = supabaseClient
        .from('posts')
        .update({
          content: editPostInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);
      
      // Alleen filteren op author_id als je GEEN admin bent
      if (!isAdmin) {
        query = query.eq('author_id', user.uid);
      }

      const { data, error } = await query.select();
      
      if (error) {
        console.error('Update post error details:', error);
        isPostingRef.current = false;
        throw error;
      }

      console.log('Update response data:', data);

      if (!data || data.length === 0) {
        isPostingRef.current = false;
        throw new Error('Bijwerken mislukt. Controleer of je de auteur bent en of RLS-rechten goed staan.');
      }
      
      // Update local state immediately
      const updatedPost = data[0] as Post;
      setPosts(prev => {
        const newPosts = prev.map(p => p.id === postId ? updatedPost : p);
        localStorage.setItem('cached_posts', JSON.stringify(newPosts));
        return newPosts;
      });
      
      // Background refetch
      setTimeout(async () => {
        try {
          const { data: refetchedData } = await supabaseClient
            .from('posts')
            .select('id, content, author_id, author_name, author_photo, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(20);
          if (refetchedData) {
            setPosts(refetchedData);
            localStorage.setItem('cached_posts', JSON.stringify(refetchedData));
          }
        } finally {
          isPostingRef.current = false;
        }
      }, 1000);

      setEditingPostId(null);
      setEditPostInput('');
      return data;
    })();

    toast.promise(updatePromise, {
      loading: 'Bericht bijwerken...',
      success: 'Bericht bijgewerkt',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet bijwerken'}`
    });

    try {
      await updatePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken', user);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editMessageInput.trim() || !activeConversation) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    
    const updatePromise = (async () => {
      console.log('Attempting to update message:', messageId);
      let query = supabaseClient
        .from('messages')
        .update({
          text: editMessageInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (!isAdmin) {
        query = query.eq('sender_id', user.uid);
      }

      const { data, error } = await query.select();
      
      if (error) {
        console.error('Update message error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Bijwerken mislukt. Controleer of je de auteur bent.');
      }
      
      // Update conversation last_message if this was the last message
      const { data: latestMsg } = await supabaseClient
        .from('messages')
        .select('id')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestMsg && latestMsg.id === messageId) {
        await supabaseClient
          .from('conversations')
          .update({ 
            last_message: editMessageInput.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', activeConversation.id);
      }

      setEditingMessageId(null);

      // Manual refetch
      const { data: newMsgs } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at, updated_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (newMsgs) setMessages(newMsgs);
    })();

    toast.promise(updatePromise, {
      loading: 'Bericht bijwerken...',
      success: 'Bericht bijgewerkt',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet bijwerken'}`
    });

    try {
      await updatePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken', user);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;
    if (!checkRateLimit()) return;
    
    const deletePromise = (async () => {
      console.log('Attempting to delete message:', messageId);
      let query = supabaseClient
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (!isAdmin) {
        query = query.eq('sender_id', user.uid);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Delete message error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Verwijderen mislukt. Controleer of je de auteur bent.');
      }
      
      // Update local state immediately
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // Find new last message
      const { data: newLastMsg } = await supabaseClient
        .from('messages')
        .select('text, sender_id')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      await supabaseClient
        .from('conversations')
        .update({
          last_message: newLastMsg ? newLastMsg.text : null,
          last_message_sender_id: newLastMsg ? newLastMsg.sender_id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversation.id);

      // Manual refetch
      const { data: newMsgs } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at, updated_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (newMsgs) setMessages(newMsgs);
    })();

    toast.promise(deletePromise, {
      loading: 'Bericht verwijderen...',
      success: 'Bericht verwijderd',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet verwijderen'}`
    });

    try {
      await deletePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht verwijderen', user);
    }
  };

  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !whitelistInput.trim()) return;
    if (!checkRateLimit()) return;
    const email = whitelistInput.trim().toLowerCase();
    
    try {
      const { error } = await supabaseClient.from('whitelist').insert({
        email,
        added_at: new Date().toISOString(),
        added_by: user?.email
      });
      if (error) throw error;
      setWhitelistInput('');
    } catch (err) {
      handleSupabaseError(err, 'whitelist toevoegen', user);
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!isAdmin || email === user?.email) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient.from('whitelist').delete().eq('email', email);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'whitelist verwijderen', user);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient
        .from('settings')
        .upsert({ key: 'websiteStatus', value: { status: statusInput } });
      if (error) throw error;
      toast.success('Website status bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'status bijwerken', user);
    }
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error('Afbeelding is te groot (max 800KB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCustomTheme(prev => ({ ...prev, wallpaper: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      toast.error('Profielfoto is te groot (max 100KB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoURLInput(base64String);
      toast.success('Profielfoto geüpload! Vergeet niet op te slaan.');
    };
    reader.readAsDataURL(file);
  };

  const handleResolveReport = async (reportId: string) => {
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      if (error) throw error;
      toast.success('Rapport gemarkeerd als opgelost');
    } catch (err) {
      handleSupabaseError(err, 'rapport oplossen');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient.from('reports').delete().eq('id', reportId);
      if (error) throw error;
      toast.success('Rapport verwijderd');
    } catch (err) {
      handleSupabaseError(err, 'rapport verwijderen');
    }
  };

  const handleStartConversation = async (targetUser: UserProfile | {id: string, display_name: string}) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existing = conversations.find(c => c.participants.includes(targetUser.id));
    if (existing) {
      setActiveConversation(existing);
      setMobileChatView('chat');
      setView('messages');
      return;
    }

    if (!checkRateLimit()) return;

    const newConv = {
      participants: [user.uid, targetUser.id],
      participant_names: {
        [user.uid]: user.displayName || 'Me',
        [targetUser.id]: targetUser.display_name
      },
      participant_photos: {
        [user.uid]: user.photoURL || '',
        [targetUser.id]: (targetUser as any).photo_url || ''
      },
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .insert(newConv)
        .select()
        .single();
        
      if (error) throw error;
      setActiveConversation(data);
      setMobileChatView('chat');
      setView('messages');
    } catch (err) {
      handleSupabaseError(err, 'gesprek starten', user);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !messageInput.trim() || !activeConversation) return;
    
    if (!checkRateLimit()) return;
    
    const text = messageInput.trim();

    try {
      console.log('Attempting to send message:', { text, conversation_id: activeConversation.id });
      const { error: msgError } = await supabaseClient.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_id: user.uid,
        text,
        created_at: new Date().toISOString()
      });
      
      if (msgError) {
        console.error('Insert message error:', msgError);
        throw msgError;
      }
      
      console.log('Message sent successfully');
      setMessageInput('');

      // Update conversation metadata
      console.log('Updating conversation metadata...');
      const { error: convError } = await supabaseClient
        .from('conversations')
        .update({
          last_message: text,
          last_message_sender_id: user.uid,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversation.id);
        
      if (convError) {
        console.error('Update conversation error:', convError);
        throw convError;
      }

      // Broadcast conversation update to others
      const convChannel = supabaseClient.channel(`conversations:${user.uid}`);
      convChannel.send({
        type: 'broadcast',
        event: 'conversation_update',
        payload: {
          id: activeConversation.id,
          last_message: text,
          last_message_sender_id: user.uid,
          updated_at: new Date().toISOString()
        }
      });

      // Manual refetch/update in case real-time is slow/disabled
      console.log('Refetching messages...');
      const { data: newMsgs, error: msgsFetchError } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at, updated_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (msgsFetchError) {
        console.error('Refetch messages error:', msgsFetchError);
      }

      if (newMsgs) {
        console.log('Refetched messages:', newMsgs);
        setMessages(newMsgs);
        
        // Broadcast new message to others in the channel
        const channel = supabaseClient.channel(`messages:${activeConversation.id}`);
        channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsgs[newMsgs.length - 1]
        });
      }

      // Clear typing status
      if (isTyping && typingInId === activeConversation.id) {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        await supabaseClient
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `${activeConversation.id}_${user.uid}`);
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht verzenden', user);
    }
  };

  const typingChannelRef = useRef<any>(null);

  // Clear typing channel ref when client changes
  useEffect(() => {
    if (typingChannelRef.current) {
      supabaseClient.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }
  }, [supabaseClient]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>, conversationId: string) => {
    if (conversationId === 'forum') {
      setPostInput(e.target.value);
    } else {
      setMessageInput(e.target.value);
    }

    if (!user) return;

    const now = Date.now();
    
    if (!isTyping || typingInId !== conversationId || (now - lastTypingUpdateRef.current > 5000)) {
      setIsTyping(true);
      setTypingInId(conversationId);
      lastTypingUpdateRef.current = now;

      // Ensure we have a valid channel and it's subscribed
      if (!typingChannelRef.current) {
        const channel = supabaseClient.channel('typing_presence');
        typingChannelRef.current = channel;
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.uid,
              user_name: profile?.display_name || user.displayName || 'Iemand',
              is_typing: true,
              conversation_id: conversationId
            });
          }
        });
      } else {
        typingChannelRef.current.track({
          user_id: user.uid,
          user_name: profile?.display_name || user.displayName || 'Iemand',
          is_typing: true,
          conversation_id: conversationId
        });
      }

      // Legacy DB update for backward compatibility - only if needed
      supabaseClient
        .from('typing')
        .upsert({
          id: `${conversationId}_${user.uid}`,
          conversation_id: conversationId,
          user_id: user.uid,
          user_name: profile?.display_name || user.displayName || 'Iemand',
          is_typing: true,
          last_updated: new Date().toISOString()
        });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      setTypingInId(null);
      
      // Untrack presence
      if (typingChannelRef.current) {
        await typingChannelRef.current.untrack();
      }
      
      // Legacy DB update for cleanup
      supabaseClient
        .from('typing')
        .update({
          is_typing: false,
          last_updated: new Date().toISOString()
        })
        .eq('id', `${conversationId}_${user.uid}`);
    }, 3000);
  };

  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Laden...</p>
        </div>
      </div>
    );
  }

  if (user && isWhitelisted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Toegang controleren...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {isQuotaExceeded && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium sticky top-0 z-[100] flex items-center justify-center gap-4 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Firebase Quota Overschreden. Sommige functies zijn tijdelijk beperkt.</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Verversen
          </button>
        </div>
      )}
      {/* Global Custom Wallpaper Layer */}
      {useCustomTheme && customTheme.wallpaper && (
        <div 
          className="fixed inset-0 -z-50 bg-cover bg-no-repeat transition-all duration-700 custom-wallpaper"
          style={{ 
            backgroundImage: `url(${customTheme.wallpaper})`,
            filter: `blur(${customTheme.blur_amount || 0}px)`,
            opacity: (customTheme.opacity || 100) / 100,
            backgroundPosition: `${customTheme.wallpaper_x || 50}% ${customTheme.wallpaper_y || 50}%`
          }}
        />
      )}

      <div 
        className="min-h-screen transition-all duration-500 relative" 
        style={useCustomTheme ? { 
          backgroundColor: customTheme.wallpaper ? 'transparent' : customTheme.body_bg_color,
          backgroundImage: 'var(--custom-pattern)',
          backgroundSize: 'var(--custom-pattern-size)',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : {}}
      >
      {user && (
        <nav 
          className={`border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md'}`}
          style={useCustomTheme ? { 
            backgroundColor: customTheme.glass_effect ? undefined : customTheme.header_bg_color,
          } : {}}
        >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('forum')}>
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-semibold tracking-tight text-sm sm:text-base">FTJM Forum</span>
            </div>
            {user && isWhitelisted && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-zinc-100 rounded-full text-[10px] sm:text-xs font-medium text-zinc-600">
                <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {websiteStatus}
              </div>
            )}
          </div>
          
          {user && isWhitelisted && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              <button 
                onClick={() => setView('forum')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'forum' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <MessageSquare className="w-4 h-4" />
                Forum
              </button>
              <button 
                onClick={() => setView('messages')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'messages' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Mail className="w-4 h-4" />
                Berichten
              </button>
              <button 
                onClick={() => setView('settings')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'settings' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Settings className="w-4 h-4" />
                Instellingen
              </button>
              <button 
                onClick={() => setView('todos')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'todos' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Check className="w-4 h-4" />
                Todos
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                if (useCustomTheme) {
                  toast.error('Schakel eerst je Custom Thema uit om de standaard modus te wijzigen.');
                  return;
                }
                setTheme(theme === 'light' ? 'dark' : 'light');
              }}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 relative"
              title={useCustomTheme ? 'Thema vergrendeld door Custom Thema' : (theme === 'light' ? 'Donkere modus' : 'Lichte modus')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
              {useCustomTheme && (
                <div className="absolute -top-1 -right-1 bg-zinc-900 text-white p-0.5 rounded-full border border-white">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-zinc-200">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium leading-none">{profile?.display_name || user.displayName || 'Anoniem'}</p>
                    <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
                  </div>
                  {(profile?.photo_url || user.photoURL) ? (
                    <img 
                      src={profile?.photo_url || user.photoURL} 
                      alt={profile?.display_name || user.displayName || ''} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                      <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
                  title="Uitloggen"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-900 text-white rounded-full text-[10px] sm:text-xs font-medium hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Google
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* Bottom Navigation for Mobile */}
      {user && isWhitelisted && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50 px-6 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setView('forum')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'forum' ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <MessageSquare className={`w-6 h-6 ${view === 'forum' ? 'fill-zinc-900/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Forum</span>
          </button>
          <button 
            onClick={() => {
              setView('messages');
              setMobileChatView('list');
            }}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'messages' ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <Mail className={`w-6 h-6 ${view === 'messages' ? 'fill-zinc-900/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Berichten</span>
          </button>
          <button 
            onClick={() => setView('todos')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'todos' ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <Check className={`w-6 h-6 ${view === 'todos' ? 'fill-zinc-900/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Todos</span>
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <Settings className={`w-6 h-6 ${view === 'settings' ? 'fill-zinc-900/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Instellingen</span>
          </button>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12">
        <AnimatePresence mode="wait">
          {!user ? (
            <LandingPage onLogin={handleLogin} websiteStatus={websiteStatus} />
          ) : isWhitelisted === null ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-zinc-900 animate-spin mb-4" />
              <p className="text-zinc-500 font-medium">Toegang controleren...</p>
            </div>
          ) : isWhitelisted === false ? (
            <motion.div 
              key="not-whitelisted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center py-20 px-6"
            >
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-xl shadow-red-500/10">
                <ShieldCheck className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-zinc-900 mb-4">Geen Toegang</h1>
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm mb-10">
                <p className="text-zinc-500 leading-relaxed mb-4">
                  Je account <span className="font-bold text-zinc-900">{user.email}</span> staat momenteel niet op de whitelist van het <span className="font-bold text-zinc-900">FTJM Besloten Forum</span>.
                </p>
                <div className="flex items-center gap-2 justify-center p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  Toegang vereist goedkeuring
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-8">
                Neem contact op met de beheerder om toegang te krijgen.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Uitloggen & Opnieuw Proberen
              </button>
            </motion.div>
          ) : websiteStatus.toLowerCase() !== 'online' && !isAdmin ? (
            <motion.div 
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center py-20 px-6"
            >
              <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100 shadow-xl shadow-amber-500/10">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-zinc-900 mb-4">Onderhoud</h1>
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm mb-10">
                <p className="text-zinc-500 leading-relaxed mb-4">
                  Het forum is momenteel in <span className="font-bold text-zinc-900">{websiteStatus}</span>.
                </p>
                <div className="flex items-center gap-2 justify-center p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  We zijn zo terug
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Uitloggen
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="logged-in"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full relative"
            >
              {view === 'forum' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <div 
                      className={`bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          {(profile?.photo_url || user.photoURL) ? (
                            <img 
                              src={profile?.photo_url || user.photoURL} 
                              alt={profile?.display_name || user.displayName || ''} 
                              className="w-24 h-24 rounded-3xl border-4 border-white shadow-md"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-3xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                              <UserIcon className="w-10 h-10 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900">{profile?.display_name || user.displayName || 'Anoniem'}</h2>
                        <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
                        
                        <div className="mt-8 w-full pt-8 border-t border-zinc-100 space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Lid sinds</span>
                            <span className="text-zinc-600 font-medium">
                              {profile ? formatDate(profile.created_at) : '...'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Status</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-400">Rol</span>
                              <span className="flex items-center gap-1.5 text-zinc-900 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Admin
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div 
                      className={`bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex items-center gap-2 mb-6 sm:mb-8">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-900" />
                        <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Forum Feed</h3>
                      </div>

                      <form onSubmit={handleCreatePost} className="mb-6 sm:mb-10 relative pt-6 sm:pt-8">
                        <AnimatePresence>
                          {typingStatuses['forum']?.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-0 left-0 flex items-center gap-2 text-[8px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm z-10"
                            >
                              <div className="flex gap-0.5 sm:gap-1">
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-500 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-500 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-500 rounded-full" />
                              </div>
                              {typingStatuses['forum'].length === 1 
                                ? `${typingStatuses['forum'][0]} is aan het typen...` 
                                : `${typingStatuses['forum'].join(', ')} zijn aan het typen...`}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="relative">
                          <input 
                            type="text"
                            value={postInput}
                            onChange={(e) => handleTyping(e, 'forum')}
                            placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Deel een bericht..."}
                            disabled={cooldownRemaining > 0}
                            className="w-full pl-4 sm:pl-6 pr-14 sm:pr-16 py-3 sm:py-4 bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base"
                            maxLength={1000}
                          />
                          <button 
                            type="submit"
                            disabled={sending || !postInput.trim() || cooldownRemaining > 0}
                            className="absolute right-1.5 top-1.5 p-2 sm:p-2.5 bg-zinc-900 text-white rounded-lg sm:rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
                          >
                            {sending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                      </form>

                      <div className="space-y-4 sm:space-y-6">
                        {posts.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-zinc-400 text-xs sm:text-sm">Nog geen berichten. Deel als eerste iets!</p>
                          </div>
                        ) : (
                          posts.map((post) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={post.id}
                              className="flex gap-3 sm:gap-4 group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                {post.author_photo ? (
                                  <button 
                                    onClick={() => handleOpenProfile(post.author_id)}
                                    className="w-full h-full rounded-full overflow-hidden border border-zinc-200 object-cover hover:ring-2 hover:ring-zinc-900 transition-all"
                                  >
                                    <img 
                                      src={post.author_photo} 
                                      alt={post.author_name} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleOpenProfile(post.author_id)}
                                    className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 hover:ring-2 hover:ring-zinc-900 transition-all"
                                  >
                                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
                                  </button>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <button 
                                      onClick={() => handleOpenProfile(post.author_id)}
                                      className="font-bold text-sm sm:text-base text-zinc-900 truncate hover:underline text-left"
                                    >
                                      {post.author_name}
                                    </button>
                                    <span className="text-[10px] sm:text-xs text-zinc-400 font-medium whitespace-nowrap">
                                      {formatDate(post.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {user.uid !== post.author_id && (
                                      <button 
                                        onClick={() => handleOpenReport('post', post.id, post.author_id, post.author_name)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Rapporteer post"
                                      >
                                        <Flag className="w-4 h-4" />
                                      </button>
                                    )}
                                    {(user.uid === post.author_id || isAdmin) && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setEditingPostId(post.id);
                                            setEditPostInput(post.content);
                                          }}
                                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                                          title="Bewerken"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeletePost(post.id)}
                                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                          title="Verwijderen"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                    {user.uid !== post.author_id && (
                                      <button 
                                        onClick={() => handleStartConversation({ id: post.author_id, display_name: post.author_name })}
                                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                                        title="Stuur bericht"
                                      >
                                        <Mail className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {editingPostId === post.id ? (
                                  <div className="mt-3 flex gap-2">
                                    <input 
                                      type="text"
                                      value={editPostInput}
                                      onChange={(e) => setEditPostInput(e.target.value)}
                                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleUpdatePost(post.id)}
                                      disabled={saving || !editPostInput.trim()}
                                      className="p-2 sm:p-3 bg-zinc-900 text-white rounded-lg sm:rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
                                    >
                                      {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Check className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </button>
                                    <button 
                                      onClick={() => setEditingPostId(null)}
                                      className="p-2 sm:p-3 bg-zinc-100 text-zinc-500 rounded-lg sm:rounded-xl hover:bg-zinc-200 transition-all"
                                    >
                                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-zinc-700 text-sm sm:text-base leading-relaxed break-words">
                                    <RichContent content={post.content} />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'messages' && (
                <div 
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                  style={useCustomTheme ? { 
                    backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                    color: customTheme.text_color
                  } : {}}
                >
                  {/* Conversations List */}
                  <div className={`${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 border-r border-zinc-100 dark:border-zinc-800 flex-col bg-zinc-50/50 dark:bg-zinc-900/50`}>
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="font-bold text-lg dark:text-zinc-100">Berichten</h3>
                      <button 
                        onClick={() => setShowUserSearch(true)}
                        className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:scale-105 transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {conversations.map(conv => {
                        const otherParticipantUid = conv.participants.find(uid => uid !== user.uid);
                        const otherParticipantName = otherParticipantUid ? conv.participant_names[otherParticipantUid] : 'Onbekend';
                        const isActive = activeConversation?.id === conv.id;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => {
                              setActiveConversation(conv);
                              setMobileChatView('chat');
                            }}
                            className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all text-left group ${
                              isActive 
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-white/5' 
                                : 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                          >
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-white/20 scale-110' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:scale-105'}`}>
                                {conv.participant_photos[otherParticipantUid || ''] ? (
                                  <img src={conv.participant_photos[otherParticipantUid || '']} alt="" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserIcon className={`w-6 h-6 ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
                                )}
                              </div>
                              {otherParticipantUid && onlineUsers.has(otherParticipantUid) && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm truncate">{otherParticipantName}</p>
                                <p className={`text-[10px] font-medium ${isActive ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                                  {formatDate(conv.updated_at)}
                                </p>
                              </div>
                              {typingStatuses[conv.id]?.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white dark:bg-zinc-900' : 'bg-emerald-500'}`} />
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white dark:bg-zinc-900' : 'bg-emerald-500'}`} />
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white dark:bg-zinc-900' : 'bg-emerald-500'}`} />
                                  </div>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white dark:text-zinc-900' : 'text-emerald-500'}`}>Typen...</p>
                                </div>
                              ) : (
                                <p className={`text-xs truncate ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>{conv.last_message || 'Geen berichten'}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {conversations.length === 0 && (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                          </div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Geen gesprekken</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Start een nieuw gesprek om te chatten.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Conversation */}
                  <div 
                    className={`${mobileChatView === 'chat' ? 'flex' : 'hidden sm:flex'} flex-grow flex-col transition-all duration-500 bg-zinc-50 dark:bg-zinc-950`}
                    style={useCustomTheme ? { backgroundColor: customTheme.body_bg_color ? `${customTheme.body_bg_color}80` : 'rgba(249, 250, 251, 0.5)' } : {}}
                  >
                    {activeConversation ? (
                      <>
                        <div 
                          className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-500"
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.header_bg_color,
                            borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
                          } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setMobileChatView('list')}
                              className="sm:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 transition-all duration-500 overflow-hidden bg-white dark:bg-zinc-800"
                              style={useCustomTheme ? { 
                                backgroundColor: customTheme.card_bg_color,
                                borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)'
                              } : {}}
                            >
                              {(() => {
                                const otherUid = activeConversation?.participants.find(uid => uid !== user.uid);
                                const photo = otherUid ? activeConversation?.participant_photos[otherUid] : null;
                                return photo ? (
                                  <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" style={useCustomTheme ? { color: customTheme.text_color } : {}} />
                                );
                              })()}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm sm:text-lg dark:text-zinc-100" style={useCustomTheme ? { color: customTheme.text_color } : {}}>
                                {(() => {
                                  const otherUid = activeConversation?.participants.find(uid => uid !== user.uid);
                                  return otherUid ? activeConversation?.participant_names[otherUid] : 'Onbekend';
                                })()}
                              </h4>
                              {(() => {
                                const otherUid = activeConversation?.participants.find(uid => uid !== user.uid);
                                const isOnline = otherUid && onlineUsers.has(otherUid);
                                return isOnline ? (
                                  <p className="text-[10px] sm:text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                  </p>
                                ) : (
                                  <p className="text-[10px] sm:text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                                    Offline
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
                          {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === user.uid;
                            const prevMsg = idx > 0 ? messages[idx - 1] : null;
                            const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                            
                            return (
                              <div 
                                key={msg.id}
                                className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                              >
                                {!isMe && (
                                  <div className="w-8 flex-shrink-0">
                                    {showAvatar && (
                                      <button 
                                        onClick={() => handleOpenProfile(msg.sender_id)}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex-shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:ring-2 hover:ring-zinc-900 dark:hover:ring-zinc-100 transition-all mb-1 shadow-sm"
                                      >
                                        {activeConversation.participant_photos?.[msg.sender_id] ? (
                                          <img src={activeConversation.participant_photos[msg.sender_id]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <UserIcon className="w-4 h-4 text-zinc-400 m-auto" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div 
                                  className={`max-w-[80%] p-4 rounded-3xl text-[15px] leading-relaxed relative shadow-sm transition-all duration-500 ${
                                    isMe 
                                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-lg' 
                                      : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-bl-lg'
                                  }`}
                                  style={useCustomTheme ? {
                                    backgroundColor: isMe ? customTheme.primary_color : customTheme.card_bg_color,
                                    color: isMe ? '#ffffff' : customTheme.text_color,
                                    borderColor: isMe ? 'transparent' : customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)'
                                  } : {}}
                                >
                                  {editingMessageId === msg.id ? (
                                    <div className="space-y-3 min-w-[240px]">
                                      <textarea 
                                        value={editMessageInput}
                                        onChange={(e) => setEditMessageInput(e.target.value)}
                                        className={`w-full p-3 rounded-xl text-sm focus:ring-2 outline-none resize-none transition-all duration-500 ${
                                          isMe 
                                            ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-white/50' 
                                            : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-200'
                                        }`}
                                        rows={3}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setEditingMessageId(null)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                            isMe ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                          }`}
                                        >
                                          Annuleren
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateMessage(msg.id)}
                                          disabled={saving || !editMessageInput.trim()}
                                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                                            isMe ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
                                          }`}
                                          style={useCustomTheme ? {
                                            backgroundColor: isMe ? '#ffffff' : customTheme.primary_color,
                                            color: isMe ? customTheme.primary_color : '#ffffff'
                                          } : {}}
                                        >
                                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <RichContent content={msg.text} />
                                      <div className={`flex items-center justify-between mt-2 gap-4 ${isMe ? 'opacity-60' : 'opacity-40'}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-tight">
                                          {formatTime(msg.created_at)}
                                        </p>
                                        {(isMe || isAdmin) && (
                                          <div className="flex items-center gap-1">
                                            <button 
                                              onClick={() => {
                                                setEditingMessageId(msg.id);
                                                setEditMessageInput(msg.text);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:scale-110 transition-all"
                                              title="Bewerken"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteMessage(msg.id)}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 hover:scale-110 transition-all"
                                              title="Verwijderen"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
 
                        <div 
                          className="p-6 border-t border-zinc-200 dark:border-zinc-800 relative pt-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-all duration-500"
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.header_bg_color,
                            borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
                          } : {}}
                        >
                          <AnimatePresence>
                            {activeConversation && typingStatuses[activeConversation.id]?.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute top-4 left-6 flex items-center gap-2.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.15em] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-4 py-1.5 rounded-full shadow-sm z-10"
                              >
                                <div className="flex gap-1">
                                  <motion.span animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <motion.span animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <motion.span animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                </div>
                                {typingStatuses[activeConversation.id].length === 1 
                                  ? `${typingStatuses[activeConversation.id][0]} typt...` 
                                  : `${typingStatuses[activeConversation.id].length} mensen typen...`}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto">
                            <div className="flex-grow relative">
                              <input 
                                type="text"
                                value={messageInput}
                                onChange={(e) => handleTyping(e, activeConversation.id)}
                                placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Typ een bericht..."}
                                disabled={cooldownRemaining > 0}
                                className="w-full p-4 pr-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl transition-all outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent disabled:opacity-50 shadow-sm dark:text-zinc-100"
                                style={useCustomTheme ? { 
                                  backgroundColor: customTheme.card_bg_color,
                                  borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : undefined,
                                  color: customTheme.text_color
                                } : {}}
                              />
                            </div>
                            <button 
                              type="submit"
                              disabled={!messageInput.trim() || cooldownRemaining > 0}
                              className="p-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl disabled:opacity-50 transition-all active:scale-90 hover:scale-105 shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
                              style={useCustomTheme ? { backgroundColor: customTheme.primary_color } : {}}
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-12 bg-zinc-50 dark:bg-zinc-950">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-8"
                        >
                          <Mail className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                        </motion.div>
                        <h3 className="text-2xl font-black tracking-tight mb-2 dark:text-zinc-100">Jouw Berichten</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-xs font-medium">Selecteer een gesprek uit de lijst of start een nieuwe chat om te beginnen.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'settings' && (
                <div 
                  className="max-w-6xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] transition-all duration-500"
                  style={useCustomTheme ? { 
                    color: customTheme.text_color
                  } : {}}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter mb-1 dark:text-zinc-100" style={useCustomTheme ? { color: customTheme.text_color } : {}}>Instellingen</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Beheer je account en voorkeuren</p>
                    </div>
                    <button 
                      onClick={() => setView('forum')}
                      className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>

                    <div className="flex flex-col md:flex-row gap-6 sm:gap-8 h-full">
                    {/* Sidebar */}
                    <div 
                      className={`w-full md:w-64 flex-shrink-0 flex md:flex-col gap-1 p-1 sm:p-2 rounded-2xl transition-all duration-500 overflow-x-auto sm:overflow-x-visible no-scrollbar ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : 'bg-zinc-50 dark:bg-zinc-900/50'}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.sidebar_bg_color,
                      } : {}}
                    >
                      <button
                        onClick={() => setSettingsTab('profile')}
                        className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${settingsTab === 'profile' ? 'shadow-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'profile' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'profile' ? '#ffffff' : customTheme.text_color
                        } : {
                          backgroundColor: settingsTab === 'profile' ? undefined : 'transparent'
                        }}
                      >
                        <UserCog className="w-4 h-4 sm:w-5 sm:h-5" />
                        Profiel
                      </button>
                      <button
                        onClick={() => setSettingsTab('notifications')}
                        className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${settingsTab === 'notifications' ? 'shadow-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'notifications' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'notifications' ? '#ffffff' : customTheme.text_color
                        } : {
                          backgroundColor: settingsTab === 'notifications' ? undefined : 'transparent'
                        }}
                      >
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        Meldingen
                      </button>
                      <button
                        onClick={() => setSettingsTab('theme')}
                        className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${settingsTab === 'theme' ? 'shadow-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'theme' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'theme' ? '#ffffff' : customTheme.text_color
                        } : {
                          backgroundColor: settingsTab === 'theme' ? undefined : 'transparent'
                        }}
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        Thema
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setSettingsTab('admin')}
                          className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${settingsTab === 'admin' ? 'shadow-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                          style={useCustomTheme ? { 
                            backgroundColor: settingsTab === 'admin' ? customTheme.primary_color : 'transparent',
                            color: settingsTab === 'admin' ? '#ffffff' : customTheme.text_color
                          } : {
                            backgroundColor: settingsTab === 'admin' ? undefined : 'transparent'
                          }}
                        >
                          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                          Admin
                        </button>
                      )}
                    </div>

                    {/* Content Area */}
                    <div 
                      className={`flex-1 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-16rem)] transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                        {settingsTab === 'profile' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                                <UserCog className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                              </div>
                              <h3 className="text-xl font-bold dark:text-zinc-100">Profiel Aanpassen</h3>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center gap-6 pb-8 border-b border-zinc-100">
                                <div className="relative group">
                                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                                    <img 
                                      src={photoURLInput || profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} 
                                      alt="Profile" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 text-white rounded-xl shadow-lg">
                                    <Camera className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Nickname</label>
                                    <button 
                                      onClick={handleResetToGoogle}
                                      className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest hover:underline flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Reset naar Google
                                    </button>
                                  </div>
                                  <input 
                                    type="text"
                                    value={displayNameInput}
                                    onChange={(e) => setDisplayNameInput(e.target.value)}
                                    placeholder="Kies een bijnaam..."
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none font-medium"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2 ml-1">
                                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Profielfoto URL</label>
                                  <label className="cursor-pointer text-[10px] font-bold text-zinc-900 uppercase tracking-widest hover:underline flex items-center gap-1">
                                    <Upload className="w-3 h-3" />
                                    Upload Foto
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={handlePhotoUpload}
                                    />
                                  </label>
                                </div>
                                <input 
                                  type="text"
                                  value={photoURLInput}
                                  onChange={(e) => setPhotoURLInput(e.target.value)}
                                  placeholder="https://example.com/photo.jpg"
                                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Over Mij (Bio)</label>
                                <textarea 
                                  value={bioInput}
                                  onChange={(e) => setBioInput(e.target.value)}
                                  placeholder="Vertel iets over jezelf..."
                                  rows={4}
                                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none font-medium resize-none"
                                  maxLength={500}
                                />
                                <div className="flex justify-end mt-1">
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{bioInput.length}/500</span>
                                </div>
                              </div>

                              <button 
                                onClick={handleUpdateProfile}
                                disabled={saving || cooldownRemaining > 0}
                                className="w-full p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                              >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : 'Profiel Bijwerken'}
                              </button>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'notifications' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-zinc-100 rounded-2xl">
                                <Bell className="w-6 h-6 text-zinc-900" />
                              </div>
                              <h3 className="text-xl font-bold">Meldingen & Geluiden</h3>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-xl shadow-sm">
                                    {notificationSettings.enable_sounds ? <Volume2 className="w-4 h-4 text-zinc-900" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">Geluiden inschakelen</p>
                                    <p className="text-xs text-zinc-500">Speel een geluid af bij nieuwe meldingen</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setNotificationSettings(prev => ({ ...prev, enable_sounds: !prev.enable_sounds }))}
                                  className="w-12 h-6 rounded-full transition-all relative"
                                  style={{ backgroundColor: notificationSettings.enable_sounds ? customTheme.accent_color : '#e4e4e7' }}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings.enable_sounds ? 'left-7' : 'left-1'}`} />
                                </button>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Custom Geluiden</label>
                                  <label className="cursor-pointer px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                                    {uploadingSound ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    Uploaden
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleSoundUpload} disabled={uploadingSound} />
                                  </label>
                                </div>
                                
                                {customSounds.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {customSounds.map((sound, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl group">
                                        <button 
                                          onClick={() => playSound(sound.url, true)}
                                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                          <Volume2 className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-medium truncate max-w-[100px]">{sound.name}</span>
                                        <button 
                                          onClick={async () => {
                                            const updated = customSounds.filter((_, i) => i !== idx);
                                            setCustomSounds(updated);
                                            await supabaseClient.from('profiles').update({ custom_sounds: updated }).eq('id', user.uid);
                                            toast.info('Geluid verwijderd');
                                          }}
                                          className="p-1 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Bericht Geluid</label>
                                  <select 
                                    value={notificationSettings.message_sound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, message_sound: soundUrl }));
                                      playSound(soundUrl, true);
                                    }}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-medium text-sm"
                                  >
                                    <optgroup label="Standaard">
                                      {SOUND_OPTIONS.map(opt => (
                                        <option key={opt.url} value={opt.url}>{opt.name}</option>
                                      ))}
                                    </optgroup>
                                    {customSounds.length > 0 && (
                                      <optgroup label="Custom">
                                        {customSounds.map((opt, idx) => (
                                          <option key={idx} value={opt.url}>{opt.name}</option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Post Geluid</label>
                                  <select 
                                    value={notificationSettings.post_sound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, post_sound: soundUrl }));
                                      playSound(soundUrl, true);
                                    }}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-medium text-sm"
                                  >
                                    <optgroup label="Standaard">
                                      {SOUND_OPTIONS.map(opt => (
                                        <option key={opt.url} value={opt.url}>{opt.name}</option>
                                      ))}
                                    </optgroup>
                                    {customSounds.length > 0 && (
                                      <optgroup label="Custom">
                                        {customSounds.map((opt, idx) => (
                                          <option key={idx} value={opt.url}>{opt.name}</option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                </div>
                              </div>

                              <button 
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="w-full p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 mt-6"
                              >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Instellingen Opslaan
                              </button>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'theme' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200 mb-4 gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${useCustomTheme ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-200 text-zinc-500'}`}>
                                  <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-base font-bold">Custom Thema Inschakelen</p>
                                  <p className="text-xs text-zinc-500 font-medium">Activeer je persoonlijke thema instellingen</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {!useCustomTheme && (
                                  <button 
                                    onClick={() => {
                                      const isDark = theme === 'dark';
                                      const syncedTheme = {
                                        ...customTheme,
                                        primary_color: isDark ? '#fafafa' : '#18181b',
                                        secondary_color: isDark ? '#f4f4f5' : '#27272a',
                                        accent_color: isDark ? '#fafafa' : '#18181b',
                                        text_color: isDark ? '#fafafa' : '#18181b',
                                        card_bg_color: isDark ? '#18181b' : '#ffffff',
                                        sidebar_bg_color: isDark ? '#18181b' : '#ffffff',
                                        header_bg_color: isDark ? '#18181b' : '#ffffff',
                                        body_bg_color: isDark ? '#09090b' : '#f4f4f5',
                                      };
                                      setCustomTheme(syncedTheme);
                                      setUseCustomTheme(true);
                                      toast.success('Thema gesynchroniseerd met huidige modus!');
                                    }}
                                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all"
                                  >
                                    Sync met {theme === 'light' ? 'Licht' : 'Donker'}
                                  </button>
                                )}
                                <button 
                                  onClick={() => setUseCustomTheme(!useCustomTheme)}
                                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${useCustomTheme ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                                >
                                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${useCustomTheme ? 'left-8' : 'left-1'}`} />
                                </button>
                              </div>
                            </div>

                            {useCustomTheme && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-8 flex items-start gap-3"
                              >
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-bold text-amber-900">Let op!</p>
                                  <p className="text-xs text-amber-700 leading-relaxed">Wanneer een custom thema is ingeschakeld, werken de standaard Lichte en Donkere modus niet meer. Schakel dit uit om weer terug te gaan naar de standaard modi.</p>
                                </div>
                              </motion.div>
                            )}

                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-zinc-100 rounded-2xl">
                                <Sparkles className="w-6 h-6 text-zinc-900" />
                              </div>
                              <h3 className="text-xl font-bold">Custom Thema</h3>
                            </div>

                            <div className="space-y-8">
                              {/* Wallpaper Section */}
                              <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Achtergrond Afbeelding</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">URL</p>
                                    <input 
                                      type="text"
                                      value={customTheme.wallpaper || ''}
                                      onChange={(e) => setCustomTheme(prev => ({ ...prev, wallpaper: e.target.value }))}
                                      placeholder="https://example.com/wallpaper.jpg"
                                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none font-medium text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Uploaden (Max 800KB)</p>
                                    <label className="flex items-center justify-center w-full h-[54px] px-4 bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl cursor-pointer hover:bg-zinc-100 transition-all">
                                      <div className="flex items-center gap-2 text-zinc-500">
                                        <Camera className="w-5 h-5" />
                                        <span className="text-sm font-bold">Kies bestand</span>
                                      </div>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleWallpaperUpload}
                                      />
                                    </label>
                                  </div>
                                </div>
                                {customTheme.wallpaper && (
                                  <button 
                                    onClick={() => setCustomTheme(prev => ({ ...prev, wallpaper: '' }))}
                                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline ml-1"
                                  >
                                    Verwijder achtergrond
                                  </button>
                                )}
                              </div>

                              {/* Pattern Section */}
                              <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Achtergrond Patroon</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                  {PATTERNS.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => setCustomTheme(prev => ({ ...prev, pattern: p.id }))}
                                      className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-2 ${customTheme.pattern === p.id ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200'}`}
                                    >
                                      <div 
                                        className="w-full flex-1 rounded-md border border-zinc-100"
                                        style={{ 
                                          backgroundImage: p.style,
                                          backgroundSize: p.size,
                                          backgroundColor: customTheme.pattern === p.id ? 'transparent' : '#f4f4f5'
                                        }}
                                      />
                                      <span className="text-[8px] font-bold uppercase tracking-tighter">{p.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Colors Section */}
                              <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Kleuren Aanpassen</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  {[
                                    { label: 'Primaire Kleur', key: 'primary_color', default: '#18181b' },
                                    { label: 'Secundaire Kleur', key: 'secondary_color', default: '#27272a' },
                                    { label: 'Accent Kleur', key: 'accent_color', default: '#18181b' },
                                    { label: 'Tekst Kleur', key: 'text_color', default: '#18181b' },
                                    { label: 'Kaart Achtergrond', key: 'card_bg_color', default: '#ffffff' },
                                    { label: 'Sidebar Achtergrond', key: 'sidebar_bg_color', default: '#ffffff' },
                                    { label: 'Header Achtergrond', key: 'header_bg_color', default: '#ffffff' },
                                    { label: 'Body Achtergrond', key: 'body_bg_color', default: '#f4f4f5' },
                                  ].map((color) => (
                                    <div key={color.key}>
                                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">{color.label}</label>
                                      <div className="flex gap-2">
                                        <input 
                                          type="color"
                                          value={(customTheme as any)[color.key] || color.default}
                                          onChange={(e) => setCustomTheme(prev => ({ ...prev, [color.key]: e.target.value }))}
                                          className="w-12 h-12 rounded-xl border-none cursor-pointer"
                                        />
                                        <input 
                                          type="text"
                                          value={(customTheme as any)[color.key] || color.default}
                                          onChange={(e) => setCustomTheme(prev => ({ ...prev, [color.key]: e.target.value }))}
                                          className="flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono text-sm"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                                {customTheme.wallpaper && (
                                  <div className="space-y-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Achtergrond Positie (X)</label>
                                        <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">{customTheme.wallpaper_x || 50}%</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={customTheme.wallpaper_x || 50}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, wallpaper_x: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: customTheme.accent_color }}
                                      />
                                    </div>

                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Achtergrond Positie (Y)</label>
                                        <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">{customTheme.wallpaper_y || 50}%</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={customTheme.wallpaper_y || 50}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, wallpaper_y: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: customTheme.accent_color }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Glass Effect Section */}
                              <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold">Glass Effect</p>
                                      <span className="text-[8px] font-black bg-zinc-900 text-white px-1.5 py-0.5 rounded-full tracking-tighter">BETA</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">Maak kaarten semi-transparant</p>
                                  </div>
                                  <button 
                                    onClick={() => setCustomTheme(prev => ({ ...prev, glass_effect: !prev.glass_effect }))}
                                    className="w-12 h-6 rounded-full transition-all relative"
                                    style={{ backgroundColor: customTheme.glass_effect ? customTheme.accent_color : '#e4e4e7' }}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customTheme.glass_effect ? 'left-7' : 'left-1'}`} />
                                  </button>
                                </div>

                                {customTheme.glass_effect && (
                                  <div className="space-y-4 pt-4 border-t border-zinc-200">
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Blur Sterkte</label>
                                        <span className="text-[10px] font-bold text-zinc-900">{customTheme.blur_amount}px</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={customTheme.blur_amount || 10}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, blur_amount: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Transparantie</label>
                                        <span className="text-[10px] font-bold text-zinc-900">{customTheme.opacity}%</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={customTheme.opacity || 100}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                  onClick={handleUpdateProfile}
                                  disabled={saving}
                                  className="flex-1 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                  Thema Opslaan
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm('Weet je zeker dat je alle thema instellingen wilt resetten naar de standaard waarden?')) {
                                      const defaultTheme = {
                                        wallpaper: '',
                                        pattern: 'none',
                                        primary_color: '#18181b',
                                        secondary_color: '#27272a',
                                        accent_color: '#18181b',
                                        text_color: '#18181b',
                                        card_bg_color: '#ffffff',
                                        sidebar_bg_color: '#ffffff',
                                        header_bg_color: '#ffffff',
                                        body_bg_color: '#f4f4f5',
                                        glass_effect: false,
                                        blur_amount: 10,
                                        opacity: 100,
                                        wallpaper_x: 50,
                                        wallpaper_y: 50
                                      };
                                      setCustomTheme(defaultTheme);
                                      setUseCustomTheme(false);
                                      localStorage.setItem('cached_customTheme', JSON.stringify(defaultTheme));
                                      localStorage.setItem('cached_useCustomTheme', 'false');
                                      toast.success('Thema gereset naar standaard!');
                                    }
                                  }}
                                  className="p-4 bg-zinc-100 text-zinc-500 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  Reset
                                </button>
                                <button 
                                  onClick={handleUpdateProfile}
                                  disabled={saving}
                                  className="flex-1 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                  Thema Opslaan
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'admin' && isAdmin && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-zinc-900 rounded-2xl">
                                <ShieldCheck className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-xl font-bold">Admin Paneel</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Website Status</label>
                                <form onSubmit={handleUpdateStatus} className="flex gap-2">
                                  <select 
                                    value={statusInput}
                                    onChange={(e) => setStatusInput(e.target.value)}
                                    className="flex-grow p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none font-medium appearance-none"
                                  >
                                    <option value="Online">Online</option>
                                    <option value="Onderhoud">Onderhoud</option>
                                    <option value="Offline">Offline</option>
                                  </select>
                                  <button type="submit" className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all">
                                    <Save className="w-5 h-5" />
                                  </button>
                                </form>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Whitelist Toevoegen</label>
                                <form onSubmit={handleAddToWhitelist} className="flex gap-2">
                                  <input 
                                    type="email"
                                    value={whitelistInput}
                                    onChange={(e) => setWhitelistInput(e.target.value)}
                                    placeholder="email@voorbeeld.com"
                                    className="flex-grow p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none font-medium"
                                  />
                                  <button type="submit" className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all">
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </form>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Huidige Whitelist</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {whitelist.map(item => (
                                  <div key={item.email} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                    <span className="text-sm font-medium text-zinc-700 truncate">{item.email}</span>
                                    {item.email !== user.email && (
                                      <button onClick={() => handleRemoveFromWhitelist(item.email)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Rapporten ({reports.filter(r => r.status === 'pending').length} open)</label>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {reports.length === 0 ? (
                                    <p className="text-sm text-zinc-500 p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">Geen rapporten gevonden.</p>
                                  ) : (
                                    reports.map(report => (
                                      <div key={report.id} className={`p-4 rounded-xl border ${report.status === 'pending' ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                          <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${report.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {report.status}
                                            </span>
                                            <p className="text-sm font-bold mt-2 text-zinc-900">Reden: {report.reason}</p>
                                          </div>
                                          <div className="flex gap-1">
                                            {report.status === 'pending' && (
                                              <button onClick={() => handleResolveReport(report.id)} className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Markeer als opgelost">
                                                <Check className="w-4 h-4" />
                                              </button>
                                            )}
                                            <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Verwijder rapport">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        {report.details && <p className="text-sm text-zinc-600 mb-3 bg-white p-3 rounded-lg border border-zinc-100">"{report.details}"</p>}
                                        <div className="text-[10px] text-zinc-400 flex justify-between font-medium uppercase tracking-wider">
                                          <span>Door: {report.reporter_id.substring(0, 8)}...</span>
                                          <span>Over: {report.reported_id.substring(0, 8)}...</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {view === 'todos' && (
                <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tighter mb-1">Takenlijst</h2>
                    <p className="text-zinc-500 font-medium text-sm">Beheer je taken via Supabase</p>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-zinc-50">
                      <form onSubmit={handleAddTodo} className="flex gap-2">
                        <input 
                          type="text"
                          value={todoInput}
                          onChange={(e) => setTodoInput(e.target.value)}
                          placeholder="Nieuwe taak..."
                          className="flex-grow p-3 sm:p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none font-medium"
                        />
                        <button type="submit" className="p-3 sm:p-4 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all active:scale-95">
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </form>
                    </div>

                    {todos.length === 0 ? (
                      <div className="p-8 sm:p-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Check className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500 font-medium text-sm sm:text-base">Geen taken gevonden.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-zinc-50">
                        {todos.map((todo) => (
                          <li key={todo.id} className="p-3 sm:p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${todo.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-200 hover:border-zinc-400'}`}
                              >
                                {todo.is_completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                              </button>
                              <span className={`font-medium text-sm sm:text-base transition-all ${todo.is_completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                                {todo.name || todo.title || 'Naamloze taak'}
                              </span>
                            </div>
                            <button 
                              onClick={() => deleteTodo(todo.id)}
                              className="p-2 text-zinc-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUserSearch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUserSearch(false)}
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Nieuw Bericht</h3>
                    <button 
                      onClick={() => {
                        setShowUserSearch(false);
                        setUserSearchQuery('');
                      }}
                      className="p-2 hover:bg-zinc-100 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Zoek op naam of e-mail..."
                      className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      autoFocus
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  </div>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-zinc-400 text-sm">Geen gebruikers gevonden voor "{userSearchQuery}"</p>
                    </div>
                  ) : (
                    filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          handleStartConversation(u as UserProfile);
                          setShowUserSearch(false);
                          setUserSearchQuery('');
                        }}
                        className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-zinc-50 transition-all text-left group cursor-pointer"
                      >
                        <div className="relative w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-zinc-400" />
                          )}
                          {onlineUsers.has(u.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{u.display_name}</p>
                          <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfile(u.id);
                            }}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                            title="Bekijk profiel"
                          >
                            <UserIcon className="w-4 h-4" />
                          </button>
                          {u.id !== user.uid && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReport('user', u.id, u.id, u.display_name);
                              }}
                              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Rapporteer gebruiker"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                          <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center">
                            <Send className="w-3.5 h-3.5 text-zinc-900" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* User Profile Modal */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-zinc-900 to-zinc-800 relative">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="px-8 pb-8">
                  <div className="relative -mt-16 mb-6">
                    <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl">
                      <div className="w-full h-full rounded-[1.5rem] bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-100">
                        {selectedUser.photo_url ? (
                          <img src={selectedUser.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon className="w-12 h-12 text-zinc-400" />
                        )}
                      </div>
                    </div>
                    {selectedUser.role === 'admin' && (
                      <div className="absolute bottom-2 left-24 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{selectedUser.display_name}</h3>
                        {onlineUsers.has(selectedUser.id) ? (
                          <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                            Offline
                          </div>
                        )}
                      </div>
                      {selectedUser.original_name && selectedUser.original_name !== selectedUser.display_name && (
                        <p className="text-sm text-zinc-400 font-medium mt-1">Oorspronkelijke naam: {selectedUser.original_name}</p>
                      )}
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Lid sinds {formatDate(selectedUser.created_at)}
                      </p>
                    </div>

                    {selectedUser.bio ? (
                      <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Over mij</label>
                        <p className="text-zinc-600 leading-relaxed font-medium">{selectedUser.bio}</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed flex flex-col items-center justify-center text-center py-10">
                        <p className="text-zinc-400 text-sm font-medium italic">Geen bio beschikbaar</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {user.uid !== selectedUser.id && (
                        <>
                          <button 
                            onClick={() => {
                              handleStartConversation({ id: selectedUser.id, display_name: selectedUser.display_name });
                              setSelectedUser(null);
                            }}
                            className="flex-1 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20"
                          >
                            <Mail className="w-5 h-5" />
                            Bericht
                          </button>
                          <button 
                            onClick={() => {
                              handleOpenReport('user', selectedUser.id, selectedUser.id, selectedUser.display_name);
                              setSelectedUser(null);
                            }}
                            className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-[0.98]"
                            title="Rapporteer"
                          >
                            <Flag className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {reportTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReportTarget(null)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-zinc-100 bg-red-50/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-100 rounded-2xl">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="font-black text-xl tracking-tight">
                        Rapporteer {reportTarget.type === 'user' ? 'Gebruiker' : reportTarget.type === 'post' ? 'Post' : 'Bericht'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setReportTarget(null)}
                      className="p-2 hover:bg-red-100 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
                      <UserIcon className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{reportTarget.displayName}</p>
                      <p className="text-xs text-zinc-400 font-medium">ID: {reportTarget.id.substring(0, 12)}...</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleReport} className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Reden van rapportage</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium appearance-none"
                    >
                      <option value="">Selecteer een reden...</option>
                      <option value="spam">Spam of ongewenste reclame</option>
                      <option value="harassment">Intimidatie of pesten</option>
                      <option value="hate_speech">Haatzaaiende uitlatingen</option>
                      <option value="inappropriate">Ongepaste inhoud</option>
                      <option value="impersonation">Impersonatie</option>
                      <option value="other">Anders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Details (optioneel)</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Geef meer context over de situatie..."
                      rows={4}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setReportTarget(null)}
                      className="flex-1 p-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                    >
                      Annuleren
                    </button>
                    <button 
                      type="submit"
                      disabled={sending || !reportReason || cooldownRemaining > 0}
                      className="flex-[2] p-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flag className="w-5 h-5" />}
                      Rapport Indienen
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Bug Warning Modal */}
        <AnimatePresence>
          {showUpdateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-8">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">Belangrijke Update & Bug Warning</h2>
                  <p className="text-zinc-500 mb-6 font-medium">We werken hard aan verbeteringen, maar let op de volgende punten:</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Bliksemsnel laden</h4>
                        <p className="text-xs text-zinc-500 mt-1">Je profiel en berichten worden nu lokaal opgeslagen voor direct toegang.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-red-600">Berichten Instellingen</h4>
                        <p className="text-xs text-zinc-500 mt-1">De instellingen voor berichten (zoals meldingen en geluiden) werken momenteel nog niet.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Palette className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Thema Fixes</h4>
                        <p className="text-xs text-zinc-500 mt-1">Achtergronden en thema's werken nu vlekkeloos in alle modi.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      localStorage.setItem('hasSeenBugWarning_1', 'true');
                      setShowUpdateModal(false);
                    }}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    Ik begrijp het, laten we gaan!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
      <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  );
}
