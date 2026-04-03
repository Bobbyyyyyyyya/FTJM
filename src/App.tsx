import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { UserProfile, Post, Conversation, DirectMessage, CustomTheme, SupabaseErrorInfo } from './types';
import { LogIn, LogOut, User as UserIcon, Save, Loader2, AlertCircle, AlertTriangle, Send, Trash2, MessageSquare, ShieldCheck, UserPlus, X, Settings, Mail, ArrowLeft, Plus, Sparkles, Pencil, Check, Bell, Volume2, VolumeX, Camera, Flag, UserCog, Moon, Sun, Upload, Zap, CloudOff, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { NotificationSettings, Report } from './types';

// Supabase User type
type User = any;

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
async function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase Error during ${operation}:`, error);
  const { data: { user } } = await supabase.auth.getUser();
  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    operation,
    authInfo: {
      userId: user?.id,
      email: user?.email,
    }
  };
  toast.error(`Er is een fout opgetreden tijdens ${operation}`);
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

  const [loading, setLoading] = useState(() => {
    // If we have a cached whitelist status, we can skip initial loading screen
    // and let the background check handle updates
    const cached = localStorage.getItem('cached_isWhitelisted');
    return cached === null;
  });
  const [saving, setSaving] = useState(false);
  const isSavingThemeRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [photoURLInput, setPhotoURLInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'forum' | 'messages' | 'settings'>('forum');
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

  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
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

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

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
      const hasSeenUpdate = localStorage.getItem('hasSeenUpdate1_6');
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }
  }, [user, isWhitelisted]);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await supabase.from('profiles').select('id').limit(1);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setError("Supabase configuratiefout: De client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        // Initial profile fetch
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            handleSupabaseError(error, 'profiel ophalen');
          } else if (data) {
            setProfile(data);
            localStorage.setItem('cached_profile', JSON.stringify(data));
          }
        } catch (err) {
          console.error('Initial profile fetch error:', err);
        }
      } else {
        setProfile(null);
        setIsWhitelisted(null);
        localStorage.removeItem('cached_profile');
        localStorage.removeItem('cached_isWhitelisted');
        localStorage.removeItem('cached_conversations');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Whitelist check
  useEffect(() => {
    if (!user) return;

    const checkWhitelist = async () => {
      try {
        const { data, error } = await supabase
          .from('whitelist')
          .select('*')
          .eq('email', user.email)
          .single();
          
        const exists = !!data;
        let whitelisted = exists || isAdmin;

        if (isAdmin && !exists) {
          // Seed admin into whitelist
          try {
            await supabase.from('whitelist').insert({
              email: user.email,
              added_at: new Date().toISOString(),
              added_by: 'system'
            });
            whitelisted = true;
          } catch (e) {
            console.warn('Admin seeding failed, but bypassing locally:', e);
          }
        }
        
        setIsWhitelisted(whitelisted);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(whitelisted));
      } catch (err) {
        handleSupabaseError(err, 'whitelist check');
        setIsWhitelisted(isAdmin);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(isAdmin));
      } finally {
        setLoading(false);
      }
    };

    checkWhitelist();
  }, [user, isAdmin]);

  // Real-time profile sync
  useEffect(() => {
    if (!user || isWhitelisted === false) return;

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        const data = payload.new as UserProfile;
        setProfile(data);
        localStorage.setItem('cached_profile', JSON.stringify(data));
        setBioInput(data.bio || '');
        setDisplayNameInput(data.display_name || '');
        setPhotoURLInput(data.photo_url || '');
        if (data.notification_settings) {
          setNotificationSettings(data.notification_settings);
        }
        if (!isSavingThemeRef.current && !(view === 'settings' && settingsTab === 'theme')) {
          if (data.custom_theme) {
            setCustomTheme(prev => ({
              ...prev,
              ...data.custom_theme
            }));
          }
          if (data.use_custom_theme !== undefined) {
            setUseCustomTheme(data.use_custom_theme);
          }
        }
      })
      .subscribe();

    // Create profile if it doesn't exist
    const ensureProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error && error.code === 'PGRST116' && isWhitelisted) {
        const newProfile: any = {
          id: user.id,
          display_name: user.user_metadata?.full_name || 'Anoniem',
          email: user.email || '',
          photo_url: user.user_metadata?.avatar_url || undefined,
          use_custom_theme: useCustomTheme,
          notification_settings: notificationSettings,
          custom_theme: customTheme,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(newProfile);
      }
    };
    ensureProfile();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isWhitelisted]);

  // Real-time whitelist sync for admin
  useEffect(() => {
    if (!isAdmin || settingsTab !== 'admin' || view !== 'settings') return;

    const whitelistChannel = supabase
      .channel('whitelist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whitelist' }, async () => {
        const { data } = await supabase.from('whitelist').select('*').order('added_at', { ascending: false });
        if (data) {
          setWhitelist(data);
          localStorage.setItem('cached_whitelist', JSON.stringify(data));
        }
      })
      .subscribe();

    const reportsChannel = supabase
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, async () => {
        const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
        if (data) {
          setReports(data);
          localStorage.setItem('cached_reports', JSON.stringify(data));
        }
      })
      .subscribe();

    // Initial fetch
    const fetchAdminData = async () => {
      const { data: wData } = await supabase.from('whitelist').select('*').order('added_at', { ascending: false });
      if (wData) setWhitelist(wData);
      
      const { data: rData } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (rData) setReports(rData);
    };
    fetchAdminData();

    return () => {
      supabase.removeChannel(whitelistChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [isAdmin, settingsTab, view]);

  // Website status
  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'websiteStatus')
        .single();
        
      if (data) {
        const status = data.value?.status || 'Online';
        setWebsiteStatus(status);
        setStatusInput(status);
        localStorage.setItem('cached_websiteStatus', status);
      }
    };
    fetchStatus();
  }, []);

  // Real-time conversations sync
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'messages') return;

    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participants=cs.{${user.id}}`
      }, async () => {
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .contains('participants', [user.id]);
          
        if (data) {
          // Notification logic for new messages
          data.forEach(conv => {
            const prevUpdate = lastConversationUpdates.current[conv.id];
            if (prevUpdate && conv.updated_at > prevUpdate && 
                conv.last_message_sender_id !== user.id && 
                conv.updated_at > initialLoadTime.current) {
              
              const otherParticipantUid = conv.participants.find((uid: string) => uid !== user.id);
              const senderName = otherParticipantUid ? conv.participant_names[otherParticipantUid] : 'Iemand';
              
              if (notificationSettingsRef.current.notify_new_messages && (activeConversationRef.current?.id !== conv.id || viewRef.current !== 'messages')) {
                toast.success(`Nieuw bericht van ${senderName}`, {
                  description: conv.last_message?.substring(0, 50) + (conv.last_message && conv.last_message.length > 50 ? '...' : ''),
                  action: {
                    label: 'Beantwoorden',
                    onClick: () => {
                      setActiveConversation(conv);
                      setView('messages');
                    }
                  }
                });
                playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enable_sounds);
              }
            }
            lastConversationUpdates.current[conv.id] = conv.updated_at;
          });

          setConversations(data.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')));
          localStorage.setItem('cached_conversations', JSON.stringify(data));
        }
      })
      .subscribe();

    // Initial fetch
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id]);
      if (data) {
        setConversations(data.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')));
        localStorage.setItem('cached_conversations', JSON.stringify(data));
      }
      setLoading(false);
    };
    fetchConversations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isWhitelisted, view]);

  // Real-time messages sync
  useEffect(() => {
    if (!user || !activeConversation) {
      setMessages([]);
      return;
    }

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DirectMessage]);
      })
      .subscribe();

    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversation]);

  // Cleanup typing status on unmount or conversation change
  useEffect(() => {
    return () => {
      if (user && typingInId && isTyping) {
        supabase
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `${typingInId}_${user.id}`);
      }
    };
  }, [typingInId, user, isTyping]);

  // Real-time typing indicators sync
  useEffect(() => {
    if (!user || (view !== 'forum' && view !== 'messages')) {
      setTypingStatuses({});
      return;
    }

    const channel = supabase
      .channel('typing_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing',
        filter: 'is_typing=eq.true'
      }, async () => {
        const { data } = await supabase
          .from('typing')
          .select('*')
          .eq('is_typing', true);
          
        if (data) {
          const newStatuses: Record<string, string[]> = {};
          data.forEach(row => {
            const convId = row.conversation_id;
            const userId = row.user_id;
            const userName = row.user_name || 'Iemand';
            
            if (userId !== user.id && (Date.now() - new Date(row.last_updated).getTime()) < 10000) {
              if (!newStatuses[convId]) newStatuses[convId] = [];
              if (!newStatuses[convId].includes(userName)) newStatuses[convId].push(userName);
            }
          });
          setTypingStatuses(newStatuses);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, view]);

  // Fetch all users for starting new conversations
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'messages' || !showUserSearch) return;

    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [user, isWhitelisted, view, showUserSearch]);

  // Real-time posts feed
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'forum') return;

    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async () => {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (data) {
          const latestPost = data[0];
          if (lastPostId.current && latestPost.id !== lastPostId.current && 
              latestPost.author_id !== user.id && 
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
          lastPostId.current = latestPost.id;
          setPosts(data);
          localStorage.setItem('cached_posts', JSON.stringify(data));
        }
      })
      .subscribe();

    // Initial fetch
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        setPosts(data);
        localStorage.setItem('cached_posts', JSON.stringify(data));
      }
      setLoading(false);
    };
    fetchPosts();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isWhitelisted, view]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'Google inloggen');
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'Microsoft inloggen');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    setError(null);

    const updatedData = {
      display_name: displayNameInput.trim() || user.user_metadata?.full_name || 'Anoniem',
      photo_url: photoURLInput.trim() || user.user_metadata?.avatar_url || undefined,
      bio: bioInput.trim(),
      notification_settings: notificationSettings,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id);
        
      if (error) throw error;
      toast.success('Profiel bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'profiel bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingUser || !reportReason.trim()) return;
    if (!checkRateLimit()) return;
    setSending(true);

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: reportingUser.id,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
        created_at: new Date().toISOString(),
        status: 'pending'
      });
      if (error) throw error;
      toast.success('Rapport ingediend. Bedankt voor je hulp.');
      setReportingUser(null);
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
    
    if (cooldownUntil && now < cooldownUntil) {
      toast.error(`Je gaat te snel! Wacht nog ${Math.ceil((cooldownUntil - now) / 1000)} seconden.`);
      return false;
    }
    
    if (cooldownUntil && now >= cooldownUntil) {
      setCooldownUntil(null);
      setCooldownRemaining(0);
    }

    const recentTimestamps = messageTimestamps.filter(t => now - t < 2000);
    
    if (recentTimestamps.length >= 5) {
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
    if (!user || !postInput.trim() || !isWhitelisted) return;
    
    if (!checkRateLimit()) return;
    
    const content = postInput.trim();
    setPostInput('');
    setSending(true);
    setError(null);

    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        author_name: profile?.display_name || user.user_metadata?.full_name || 'Anoniem',
        author_photo: profile?.photo_url || user.user_metadata?.avatar_url || undefined,
        content: content,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      // Clear typing status
      if (isTyping && typingInId === 'forum') {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        await supabase
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `forum_${user.id}`);
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht plaatsen');
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'bericht verwijderen');
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editPostInput.trim()) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editPostInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);
      if (error) throw error;
      setEditingPostId(null);
      toast.success('Bericht bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editMessageInput.trim() || !activeConversation) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          text: editMessageInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
      if (error) throw error;
      setEditingMessageId(null);
      toast.success('Bericht bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !whitelistInput.trim()) return;
    if (!checkRateLimit()) return;
    const email = whitelistInput.trim().toLowerCase();
    
    try {
      const { error } = await supabase.from('whitelist').insert({
        email,
        added_at: new Date().toISOString(),
        added_by: user?.email
      });
      if (error) throw error;
      setWhitelistInput('');
    } catch (err) {
      handleSupabaseError(err, 'whitelist toevoegen');
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!isAdmin || email === user?.email) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabase.from('whitelist').delete().eq('email', email);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'whitelist verwijderen');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'websiteStatus', value: { status: statusInput } });
      if (error) throw error;
      toast.success('Website status bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'status bijwerken');
    }
  };

  const handleUpdateTheme = async () => {
    setSaving(true);
    isSavingThemeRef.current = true;
    setError(null);

    try {
      const sanitizedTheme = {
        wallpaper: customTheme.wallpaper || '',
        pattern: customTheme.pattern || 'none',
        primary_color: customTheme.primary_color || '#18181b',
        secondary_color: customTheme.secondary_color || '#27272a',
        accent_color: customTheme.accent_color || '#18181b',
        text_color: customTheme.text_color || '#18181b',
        card_bg_color: customTheme.card_bg_color || '#ffffff',
        sidebar_bg_color: customTheme.sidebar_bg_color || '#ffffff',
        header_bg_color: customTheme.header_bg_color || '#ffffff',
        body_bg_color: customTheme.body_bg_color || '#f4f4f5',
        glass_effect: !!customTheme.glass_effect,
        blur_amount: customTheme.blur_amount ?? 10,
        opacity: customTheme.opacity ?? 100,
        wallpaper_x: customTheme.wallpaper_x ?? 50,
        wallpaper_y: customTheme.wallpaper_y ?? 50
      };

      localStorage.setItem('cached_customTheme', JSON.stringify(sanitizedTheme));
      localStorage.setItem('cached_useCustomTheme', useCustomTheme.toString());

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            custom_theme: sanitizedTheme,
            use_custom_theme: useCustomTheme,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) throw error;
        toast.success('Thema succesvol opgeslagen!');
      }
    } catch (err) {
      handleSupabaseError(err, 'thema opslaan');
    } finally {
      setSaving(false);
      isSavingThemeRef.current = false;
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
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
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
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
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
      setView('messages');
      return;
    }

    if (!checkRateLimit()) return;

    const newConv = {
      participants: [user.id, targetUser.id],
      participant_names: {
        [user.id]: user.user_metadata?.full_name || 'Me',
        [targetUser.id]: targetUser.display_name
      },
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert(newConv)
        .select()
        .single();
        
      if (error) throw error;
      setActiveConversation(data);
      setView('messages');
    } catch (err) {
      handleSupabaseError(err, 'gesprek starten');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !messageInput.trim() || !activeConversation) return;
    
    if (!checkRateLimit()) return;
    
    const text = messageInput.trim();
    setMessageInput('');

    try {
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        text,
        created_at: new Date().toISOString()
      });
      
      if (msgError) throw msgError;
      
      // Update conversation metadata
      const { error: convError } = await supabase
        .from('conversations')
        .update({
          last_message: text,
          last_message_sender_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversation.id);
        
      if (convError) throw convError;

      // Clear typing status
      if (isTyping && typingInId === activeConversation.id) {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        await supabase
          .from('typing')
          .update({
            is_typing: false,
            last_updated: new Date().toISOString()
          })
          .eq('id', `${activeConversation.id}_${user.id}`);
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht verzenden');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>, conversationId: string) => {
    if (conversationId === 'forum') {
      setPostInput(e.target.value);
    } else {
      setMessageInput(e.target.value);
    }

    if (!user) return;

    const now = Date.now();
    
    if (!isTyping || typingInId !== conversationId || (now - lastTypingUpdateRef.current > 10000)) {
      setIsTyping(true);
      setTypingInId(conversationId);
      lastTypingUpdateRef.current = now;

      supabase
        .from('typing')
        .upsert({
          id: `${conversationId}_${user.id}`,
          conversation_id: conversationId,
          user_id: user.id,
          user_name: profile?.display_name || user.user_metadata?.full_name || 'Iemand',
          is_typing: true,
          last_updated: new Date().toISOString()
        });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingInId(null);
      supabase
        .from('typing')
        .update({
          is_typing: false,
          last_updated: new Date().toISOString()
        })
        .eq('id', `${conversationId}_${user.id}`);
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
      <nav 
        className={`border-b border-zinc-200 sticky top-0 z-10 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
        style={useCustomTheme ? { 
          backgroundColor: customTheme.glass_effect ? undefined : customTheme.header_bg_color,
        } : {}}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('forum')}>
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-semibold tracking-tight">FTJM Forum</span>
            </div>
            {user && isWhitelisted && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
                <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {websiteStatus}
              </div>
            )}
          </div>
          
          {user && isWhitelisted && (
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
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
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
              title={theme === 'light' ? 'Donkere modus' : 'Lichte modus'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">{profile?.display_name || user.user_metadata?.full_name || 'Anoniem'}</p>
                    <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
                  </div>
                  {(profile?.photo_url || user.user_metadata?.avatar_url) ? (
                    <img 
                      src={profile?.photo_url || user.user_metadata?.avatar_url} 
                      alt={profile?.display_name || user.user_metadata?.full_name || ''} 
                      className="w-8 h-8 rounded-full border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
                  title="Uitloggen"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-xs font-medium hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Google
                </button>
                <button 
                  onClick={handleMicrosoftLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Microsoft
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="logged-out"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center py-20"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-zinc-200 shadow-sm">
                <LogIn className="w-10 h-10 text-zinc-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">FTJM Besloten Forum</h1>
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-sm font-medium text-zinc-600">
                <span className={`w-2 h-2 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                Status: {websiteStatus}
              </div>
              <p className="text-zinc-500 mb-10 leading-relaxed">
                Log in met je Google of Microsoft account om toegang te krijgen tot het forum. Alleen goedgekeurde leden kunnen berichten zien en plaatsen.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleLogin}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <LogIn className="w-5 h-5" />
                  Inloggen met Google
                </button>
                <button 
                  onClick={handleMicrosoftLogin}
                  className="w-full py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-semibold hover:bg-zinc-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <LogIn className="w-5 h-5" />
                  Inloggen met Microsoft
                </button>
              </div>
            </motion.div>
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
                  <div className="lg:col-span-1 space-y-6">
                    <div 
                      className={`bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm sticky top-24 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          {(profile?.photo_url || user.user_metadata?.avatar_url) ? (
                            <img 
                              src={profile?.photo_url || user.user_metadata?.avatar_url} 
                              alt={profile?.display_name || user.user_metadata?.full_name || ''} 
                              className="w-24 h-24 rounded-3xl border-4 border-white shadow-md"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-3xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                              <UserIcon className="w-10 h-10 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900">{profile?.display_name || user.user_metadata?.full_name || 'Anoniem'}</h2>
                        <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
                        
                        <div className="mt-8 w-full pt-8 border-t border-zinc-100 space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Lid sinds</span>
                            <span className="text-zinc-600 font-medium">
                              {profile ? new Date(profile.created_at).toLocaleDateString() : '...'}
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
                      className={`bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex items-center gap-2 mb-8">
                        <MessageSquare className="w-6 h-6 text-zinc-900" />
                        <h3 className="text-xl font-bold text-zinc-900">Forum Feed</h3>
                      </div>

                      <form onSubmit={handleCreatePost} className="mb-10 relative pt-8">
                        <AnimatePresence>
                          {typingStatuses['forum']?.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-0 left-0 flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full shadow-sm z-10"
                            >
                              <div className="flex gap-1">
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
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
                            placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Deel een bericht met de groep..."}
                            disabled={cooldownRemaining > 0}
                            className="w-full pl-6 pr-16 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all disabled:opacity-50"
                            maxLength={1000}
                          />
                          <button 
                            type="submit"
                            disabled={sending || !postInput.trim() || cooldownRemaining > 0}
                            className="absolute right-2 top-2 p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
                          >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                        </div>
                      </form>

                      <div className="space-y-6">
                        {posts.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-zinc-400 text-sm">Nog geen berichten. Deel als eerste iets!</p>
                          </div>
                        ) : (
                          posts.map((post) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={post.id}
                              className="flex gap-4 group bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all"
                            >
                              {post.author_photo ? (
                                <img 
                                  src={post.author_photo} 
                                  alt={post.author_name} 
                                  className="w-12 h-12 rounded-full flex-shrink-0 border border-zinc-200 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 border border-zinc-200">
                                  <UserIcon className="w-6 h-6 text-zinc-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-bold text-base text-zinc-900 truncate">{post.author_name}</span>
                                    <span className="text-xs text-zinc-400 font-medium">
                                      {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} om {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {user.id !== post.author_id && (
                                      <button 
                                        onClick={() => setReportingUser({ id: post.author_id, display_name: post.author_name, email: '', created_at: '', updated_at: '' })}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Rapporteer gebruiker"
                                      >
                                        <Flag className="w-4 h-4" />
                                      </button>
                                    )}
                                    {(user.id === post.author_id || isAdmin) && (
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
                                    {user.id !== post.author_id && (
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
                                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleUpdatePost(post.id)}
                                      disabled={saving || !editPostInput.trim()}
                                      className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
                                    >
                                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    </button>
                                    <button 
                                      onClick={() => setEditingPostId(null)}
                                      className="p-3 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-all"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-zinc-700 text-base leading-relaxed break-words">
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
                  className={`bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex transition-all duration-500 ${customTheme.glass_effect ? 'custom-glass' : ''}`}
                  style={{ 
                    backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                    color: customTheme.text_color
                  }}
                >
                  {/* Conversations List */}
                  <div className="w-80 border-r border-zinc-100 flex flex-col">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                      <h3 className="font-bold text-lg">Berichten</h3>
                      <button 
                        onClick={() => setShowUserSearch(true)}
                        className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                      {conversations.map(conv => {
                        const otherParticipantUid = conv.participants.find(uid => uid !== user.id);
                        const otherParticipantName = otherParticipantUid ? conv.participant_names[otherParticipantUid] : 'Onbekend';
                        const isActive = activeConversation?.id === conv.id;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => {
                              setActiveConversation(conv);
                            }}
                            className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all text-left group ${isActive ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-white/20' : 'bg-zinc-200'}`}>
                              <UserIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm truncate">{otherParticipantName}</p>
                                <p className={`text-[10px] ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                                  {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              {typingStatuses[conv.id]?.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-400'}`} />
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-400'}`} />
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-400'}`} />
                                  </div>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-zinc-400'}`}>Typen...</p>
                                </div>
                              ) : (
                                <p className={`text-xs truncate ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>{conv.last_message || 'Geen berichten'}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {conversations.length === 0 && (
                        <div className="p-8 text-center">
                          <Mail className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                          <p className="text-xs text-zinc-400">Geen gesprekken</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Conversation */}
                  <div 
                    className="flex-grow flex flex-col transition-all duration-500"
                    style={useCustomTheme ? { backgroundColor: customTheme.body_bg_color ? `${customTheme.body_bg_color}80` : 'rgba(249, 250, 251, 0.5)' } : {}}
                  >
                    {activeConversation ? (
                      <>
                        <div 
                          className="p-6 border-b flex items-center justify-between shadow-sm z-10 transition-all duration-500"
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.header_bg_color,
                            borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
                          } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500"
                              style={useCustomTheme ? { 
                                backgroundColor: customTheme.card_bg_color,
                                borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)'
                              } : {}}
                            >
                              <UserIcon className="w-5 h-5" style={useCustomTheme ? { color: customTheme.text_color } : {}} />
                            </div>
                            <div>
                              <h4 className="font-bold" style={useCustomTheme ? { color: customTheme.text_color } : {}}>
                                {(() => {
                                  const otherUid = activeConversation?.participants.find(uid => uid !== user.id);
                                  return otherUid ? activeConversation?.participant_names[otherUid] : 'Onbekend';
                                })()}
                              </h4>
                              <p className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Online
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {messages.map(msg => {
                            const isMe = msg.sender_id === user.id;
                            return (
                              <div 
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                              >
                                <div 
                                  className={`max-w-[75%] p-3.5 rounded-2xl text-[15px] leading-relaxed relative shadow-sm transition-all duration-500 ${
                                    isMe 
                                      ? 'rounded-br-sm' 
                                      : 'border rounded-bl-sm'
                                  }`}
                                  style={useCustomTheme ? {
                                    backgroundColor: isMe ? customTheme.primary_color : customTheme.card_bg_color,
                                    color: isMe ? '#ffffff' : customTheme.text_color,
                                    borderColor: isMe ? 'transparent' : customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)'
                                  } : {}}
                                >
                                  {editingMessageId === msg.id ? (
                                    <div className="space-y-2 min-w-[200px]">
                                      <textarea 
                                        value={editMessageInput}
                                        onChange={(e) => setEditMessageInput(e.target.value)}
                                        className={`w-full p-2 rounded-lg text-sm focus:ring-2 outline-none resize-none transition-all duration-500 ${
                                          isMe 
                                            ? 'bg-white/10 border border-white/20 text-white focus:ring-white/50' 
                                            : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:ring-zinc-200'
                                        }`}
                                        rows={3}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setEditingMessageId(null)}
                                          className={`p-1.5 rounded-lg transition-colors ${
                                            isMe ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                                          }`}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateMessage(msg.id)}
                                          disabled={saving || !editMessageInput.trim()}
                                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                            isMe ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                          }`}
                                          style={{
                                            backgroundColor: isMe ? '#ffffff' : customTheme.primary_color,
                                            color: isMe ? customTheme.primary_color : '#ffffff'
                                          }}
                                        >
                                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <RichContent content={msg.text} />
                                      <div className={`flex items-center justify-between mt-1.5 gap-4 ${isMe ? 'opacity-60' : 'opacity-40'}`}>
                                        <p className="text-[10px] font-medium">
                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {isMe && (
                                          <button 
                                            onClick={() => {
                                              setEditingMessageId(msg.id);
                                              setEditMessageInput(msg.text);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-all"
                                            title="Bewerken"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
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
                          className="p-6 border-t relative pt-12 transition-all duration-500"
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.header_bg_color,
                            borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
                          } : {}}
                        >
                          <AnimatePresence>
                            {activeConversation && typingStatuses[activeConversation.id]?.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-3 left-6 flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full shadow-sm z-10"
                              >
                                <div className="flex gap-1">
                                  <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                </div>
                                {typingStatuses[activeConversation.id].length === 1 
                                  ? `${typingStatuses[activeConversation.id][0]} is aan het typen...` 
                                  : `${typingStatuses[activeConversation.id].join(', ')} zijn aan het typen...`}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input 
                              type="text"
                              value={messageInput}
                              onChange={(e) => handleTyping(e, activeConversation.id)}
                              placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Typ een bericht..."}
                              disabled={cooldownRemaining > 0}
                              className="flex-grow p-4 border rounded-2xl transition-all outline-none disabled:opacity-50"
                              style={{ 
                                backgroundColor: customTheme.card_bg_color,
                                borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)',
                                color: customTheme.text_color
                              }}
                            />
                            <button 
                              type="submit"
                              disabled={!messageInput.trim() || cooldownRemaining > 0}
                              className="p-4 text-white rounded-2xl disabled:opacity-50 transition-all active:scale-95"
                              style={useCustomTheme ? { backgroundColor: customTheme.primary_color } : {}}
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6">
                          <Mail className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Selecteer een gesprek</h3>
                        <p className="text-zinc-400 max-w-xs">Kies een gesprek uit de lijst of start een nieuwe om te beginnen met chatten.</p>
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
                      <h2 className="text-3xl font-black tracking-tighter mb-1">Instellingen</h2>
                      <p className="text-zinc-500 font-medium text-sm">Beheer je account en voorkeuren</p>
                    </div>
                    <button 
                      onClick={() => setView('forum')}
                      className="p-2.5 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>

                    <div className="flex flex-col md:flex-row gap-8 h-full">
                    {/* Sidebar */}
                    <div 
                      className={`w-full md:w-64 flex-shrink-0 space-y-1 p-2 rounded-2xl transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.sidebar_bg_color,
                      } : {}}
                    >
                      <button
                        onClick={() => setSettingsTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'profile' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'profile' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'profile' ? '#ffffff' : customTheme.text_color
                        } : {}}
                      >
                        <UserCog className="w-5 h-5" />
                        Profiel
                      </button>
                      <button
                        onClick={() => setSettingsTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'notifications' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'notifications' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'notifications' ? '#ffffff' : customTheme.text_color
                        } : {}}
                      >
                        <Bell className="w-5 h-5" />
                        Meldingen
                      </button>
                      <button
                        onClick={() => setSettingsTab('theme')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'theme' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={useCustomTheme ? { 
                          backgroundColor: settingsTab === 'theme' ? customTheme.primary_color : 'transparent',
                          color: settingsTab === 'theme' ? '#ffffff' : customTheme.text_color
                        } : {}}
                      >
                        <Sparkles className="w-5 h-5" />
                        Custom Thema
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setSettingsTab('admin')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'admin' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                          style={useCustomTheme ? { 
                            backgroundColor: settingsTab === 'admin' ? customTheme.primary_color : 'transparent',
                            color: settingsTab === 'admin' ? '#ffffff' : customTheme.text_color
                          } : {}}
                        >
                          <ShieldCheck className="w-5 h-5" />
                          Admin Paneel
                        </button>
                      )}
                      
                      <div className="pt-4 mt-4 border-t border-zinc-100">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <LogOut className="w-5 h-5" />
                          Uitloggen
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div 
                      className={`flex-1 bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-16rem)] transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="p-8 overflow-y-auto custom-scrollbar">
                        {settingsTab === 'profile' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-zinc-100 rounded-2xl">
                                <UserCog className="w-6 h-6 text-zinc-900" />
                              </div>
                              <h3 className="text-xl font-bold">Profiel Aanpassen</h3>
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
                                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Nickname</label>
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
                                    {SOUND_OPTIONS.map(opt => (
                                      <option key={opt.url} value={opt.url}>{opt.name}</option>
                                    ))}
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
                                    {SOUND_OPTIONS.map(opt => (
                                      <option key={opt.url} value={opt.url}>{opt.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'theme' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200 mb-8">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${useCustomTheme ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-200 text-zinc-500'}`}>
                                  <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-base font-bold">Custom Thema Inschakelen</p>
                                  <p className="text-xs text-zinc-500 font-medium">Activeer je persoonlijke thema instellingen</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setUseCustomTheme(!useCustomTheme)}
                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${useCustomTheme ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                              >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${useCustomTheme ? 'left-8' : 'left-1'}`} />
                              </button>
                            </div>

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
                                    <p className="text-sm font-bold">Glass Effect</p>
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
                                  onClick={handleUpdateTheme}
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

                            <div className="space-y-8">
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
                              
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Huidige Whitelist</label>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
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
                          </div>
                        )}
                      </div>
                    </div>
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
                      <button
                        key={u.id}
                        onClick={() => {
                          handleStartConversation(u as UserProfile);
                          setShowUserSearch(false);
                          setUserSearchQuery('');
                        }}
                        className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-zinc-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{u.display_name}</p>
                          <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.id !== user.id && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportingUser(u as UserProfile);
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
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reportingUser && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReportingUser(null)}
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
                      <h3 className="font-black text-xl tracking-tight">Rapporteer Gebruiker</h3>
                    </div>
                    <button 
                      onClick={() => setReportingUser(null)}
                      className="p-2 hover:bg-red-100 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
                      {reportingUser.photo_url ? (
                        <img src={reportingUser.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{reportingUser.display_name}</p>
                      <p className="text-xs text-zinc-400 font-medium">{reportingUser.email}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleReportUser} className="p-8 space-y-6">
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
                      onClick={() => setReportingUser(null)}
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
        {/* Update 1.6 Modal */}
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
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">Nieuw in versie 1.6</h2>
                  <p className="text-zinc-500 mb-6 font-medium">We hebben de app sneller en slimmer gemaakt door meer lokaal te doen.</p>
                  
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
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <CloudOff className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Minder Cloud, Meer Lokaal</h4>
                        <p className="text-xs text-zinc-500 mt-1">Slimmere synchronisatie vermindert dataverbruik en verhoogt de snelheid.</p>
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
                      localStorage.setItem('hasSeenUpdate1_6', 'true');
                      setShowUpdateModal(false);
                    }}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    Geweldig, laten we beginnen!
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
