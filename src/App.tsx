import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, setSupabaseFirebaseUid, createSupabaseClient } from './utils/supabase';
import { User, UserProfile, Post, Conversation, DirectMessage, CustomTheme, ForumThread, ForumComment, AppNotification, NotificationSettings, Report } from './types';
import { MentionOverlay } from './components/MentionOverlay';
import { EmojiOverlay } from './components/EmojiOverlay';
import { Toaster, toast } from 'sonner';

import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw,
  Shield, 
  Bell, 
  Volume2, 
  Gamepad2,
  Moon, 
  Sparkles, 
  Sun, 
  Lock as LockIcon, 
  User as UserIcon, 
  LogOut, 
  MessageSquare, 
  Layout, 
  Mail, 
  Newspaper, 
  Settings, 
  ShieldCheck, 
  Activity,
  AlertCircle, 
  Loader2, 
  AlertTriangle, 
  Send, 
  X, 
  ChevronLeft, 
  Plus, 
  Upload, 
  Play, 
  Trash2, 
  Keyboard, 
  UserPlus, 
  Flag, 
  Pencil, 
  Check,
  ShieldAlert,
  ArrowRight,
  Bot,
  Phone,
  PhoneOff,
  Fingerprint,
  Film,
  FlaskConical,
  Zap,
  Monitor,
  LayoutGrid,
  Smartphone
} from 'lucide-react';

// Components
import { LandingPage } from './components/LandingPage';
import { RichContent } from './components/RichContent';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ForumView } from './components/ForumView';
import { MessagesView } from './components/MessagesView';
import { SettingsView } from './components/SettingsView';
import { NewsView } from './components/NewsView';
import { UserSearchModal } from './components/UserSearchModal';
import { ReportModal } from './components/ReportModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AudioLogsView } from './components/AudioLogsView';
import { GamesView } from './components/GamesView';
import { MediaFeedCard } from './components/MediaFeedCard';
import { MediaSwipeFeed } from './components/MediaSwipeFeed';
import { PublicSharedMediaModal } from './components/PublicSharedMediaModal';
import { MessageEditArea } from './components/MessageEditArea';
import { DesktopAppPromptModal, getDesktopOperatingSystem } from './components/DesktopAppPromptModal';
import { useVoiceCall } from './hooks/useVoiceCall';
import { VoiceCallUI } from './components/VoiceCallUI';
import { useGroupVoiceCall } from './hooks/useGroupVoiceCall';
import { GroupVoiceCallUI } from './components/GroupVoiceCallUI';
import { t, Language, getLanguage, setLanguage } from './utils/translations';

// Constants & Helpers
import { NEWS_ITEMS, SOUND_OPTIONS, RINGTONE_OPTIONS, PATTERNS, EMOJI_LIST, isVerifiedEmail, isBetaTester } from './constants';
import { playSound, formatDate, handleSupabaseError, audioCache, logAudioEvent, convertEmoticons, isDarkColor, parseAdminNotes } from './utils/helpers';

import { encryptGeneralChat, decryptGeneralChat, secureLocalStorage } from './utils/encryption';
import { rateLimiter } from './utils/rateLimiter';
import CryptoJS from 'crypto-js';

// Human Verification Challenge for Anti-DDoS bypass
function HumanVerificationChallenge() {
  const [num1] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [num2] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === num1 + num2) {
      rateLimiter.manualUnlock();
      toast.success('Menselijke verificatie succesvol doorlopen!');
    } else {
      setError(true);
      setAnswer('');
      toast.error('Onjuist antwoord, probeer opnieuw.');
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full border-t border-zinc-800/60 pt-5 text-left">
      <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2">
        🔓 DIRECT DEBLOKKEREN (Menselijke Toets)
      </h3>
      <p className="text-[9px] text-zinc-500 mb-3 leading-relaxed">
        Los deze eenvoudige som op om te bewijzen dat je een mens bent om de tijdelijke vlammenbeveiliging op te heffen:
      </p>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-zinc-950 border border-zinc-850 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white font-mono tracking-widest select-none">
          {num1} + {num2} = ?
        </div>
        
        <input 
          type="text"
          pattern="[0-9]*"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Antwoord"
          className={`w-20 h-10 bg-zinc-950 border ${error ? 'border-rose-500 text-rose-400' : 'border-zinc-850 hover:border-zinc-800 focus:border-rose-500'} text-center text-xs font-bold text-white font-mono rounded-xl focus:outline-none transition-all placeholder:text-zinc-700`}
        />
        
        <button 
          type="submit"
          className="px-4 h-10 bg-white text-zinc-950 text-[10px] font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
        >
          Check
        </button>
      </div>
    </form>
  );
}

// Veilige localStorage schaduw-wrapper om alle bewaarde informatie en caches in te pakken met AES
const localStorage = {
  getItem: (key: string): string | null => {
    return secureLocalStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    secureLocalStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    secureLocalStorage.removeItem(key);
  }
};

// App component
const IS_WHITELIST_ACTIVE = false; // Zet op true om de whitelist-beveiliging weer in te schakelen!

const normalizeEmail = (rawEmail: string): string => {
  const parts = rawEmail.trim().toLowerCase().split('@');
  if (parts.length !== 2) return rawEmail.trim().toLowerCase();
  
  let [local, domain] = parts;
  // Remove all dots from local part to prevent tricks like m.a.r.k.o@...
  local = local.replace(/\./g, '').trim();
  // Handle Gmail style plus aliasing (e.g., marko+test@gmail.com -> marko@gmail.com)
  local = local.split('+')[0];
  
  return `${local}@${domain}`;
};

export default function App() {
  const [language, setLanguageState] = useState<Language>(() => getLanguage());
  const [ddosLock, setDdosLock] = useState(() => rateLimiter.getIsLockedStatus());

  useEffect(() => {
    rateLimiter.registerCallback((locked, secondsLeft, reason) => {
      setDdosLock({ locked, secondsLeft, reason });
    });
  }, []);

  const [user, setUser] = useState<User | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark' | 'enhanced'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'enhanced') || 'light';
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Failed to parse cached_profile', e);
      return null;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_posts');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [whitelist, setWhitelist] = useState<{email: string, added_at: string}[]>(() => {
    const cached = secureLocalStorage.getItem('cached_whitelist');
    return cached ? JSON.parse(cached) : [];
  });

  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(() => {
    if (!IS_WHITELIST_ACTIVE) return true;
    try {
      const cached = secureLocalStorage.getItem('cached_isWhitelisted');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Failed to parse cached_isWhitelisted', e);
      return null;
    }
  });

  const isPostingRef = useRef(false);

  const needsTermsAgreement = React.useMemo(() => {
    if (!user || isWhitelisted === false) return false;
    const cachedAgreed = secureLocalStorage.getItem('has_agreed_terms_v2') === 'true';
    if (cachedAgreed) return false;
    if (profile) {
      const themeObj = profile.custom_theme || {};
      return !(themeObj as any).agreed_terms_v2;
    }
    return false;
  }, [user, profile, isWhitelisted]);

  const [loading, setLoading] = useState(() => {
    // If we have a cached whitelist status, we can skip initial loading screen
    // and let the background check handle updates
    const cached = secureLocalStorage.getItem('cached_isWhitelisted');
    return cached === null;
  });
  const [saving, setSaving] = useState(false);
  const isSavingThemeRef = useRef(false);
  const currentUidRef = useRef<string | null>(null);
  const [sending, setSending] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [photoURLInput, setPhotoURLInput] = useState('');
  const [bannerURLInput, setBannerURLInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [threadTitleInput, setThreadTitleInput] = useState('');
  const [threadContentInput, setThreadContentInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'forum' | 'messages' | 'settings' | 'news' | 'audiologs' | 'arcade' | 'media_feed'>('chat');

  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs' | 'security' | 'discord'>('profile');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showDesktopPromptModal, setShowDesktopPromptModal] = useState(false);

  useEffect(() => {
    if (user) {
      const detectedOs = getDesktopOperatingSystem();
      if (detectedOs) {
        try {
          const choice = localStorage.getItem('ftjm_desktop_app_choice');
          const sessionSeen = sessionStorage.getItem('ftjm_desktop_app_prompt_seen');
          if (!choice && !sessionSeen) {
            const timer = setTimeout(() => {
              setShowDesktopPromptModal(true);
            }, 900);
            return () => clearTimeout(timer);
          }
        } catch (e) {
          console.error('Failed to read desktop preference', e);
        }
      }
    }
  }, [user]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [threadComments, setThreadComments] = useState<ForumComment[]>([]);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const joinDate = React.useMemo(() => {
    if (profile?.created_at) return profile.created_at;
    if ((user as any)?.created_at) return (user as any).created_at;
    return null;
  }, [profile, user]);

  const filteredPosts = React.useMemo(() => {
    const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
    if (isSystemAdmin || !joinDate) {
      return posts;
    }
    const joinTime = new Date(joinDate).getTime();
    return posts.filter(p => new Date(p.created_at).getTime() >= joinTime);
  }, [posts, joinDate, user, profile]);

  const filteredThreads = React.useMemo(() => {
    const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
    if (isSystemAdmin || !joinDate) {
      return threads;
    }
    const joinTime = new Date(joinDate).getTime();
    return threads.filter(t => new Date(t.created_at || '').getTime() >= joinTime);
  }, [threads, joinDate, user, profile]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const usersRef = useRef<UserProfile[]>(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('Failed to parse cached_conversations', e);
      return [];
    }
  });
  const conversationsRef = useRef<Conversation[]>(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Hidden conversations state (for hiding DMs from inbox)
  const [hiddenConversationIds, setHiddenConversationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ftjm_hidden_conversations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleToggleHideConversation = React.useCallback((conversationId: string) => {
    setHiddenConversationIds(prev => {
      const isHidden = prev.includes(conversationId);
      const updated = isHidden ? prev.filter(id => id !== conversationId) : [...prev, conversationId];
      try {
        localStorage.setItem('ftjm_hidden_conversations', JSON.stringify(updated));
      } catch (e) {}
      
      if (isHidden) {
        toast.success(t("Gesprek zichtbaar gemaakt in Inbox"));
      } else {
        toast.success(t("Gesprek verborgen"), {
          description: t("Je kunt verborgen DM's bekijken en herstellen via Instellingen -> App Instellingen."),
          action: {
            label: t("Ongedaan maken"),
            onClick: () => {
              setHiddenConversationIds(current => {
                const restored = current.filter(id => id !== conversationId);
                try { localStorage.setItem('ftjm_hidden_conversations', JSON.stringify(restored)); } catch (e) {}
                return restored;
              });
            }
          }
        });
      }
      return updated;
    });
  }, [t]);

  const handleUnhideAllConversations = React.useCallback(() => {
    setHiddenConversationIds([]);
    try {
      localStorage.removeItem('ftjm_hidden_conversations');
    } catch (e) {}
    toast.success(t("Alle gesprekken zijn weer zichtbaar gemaakt in je inbox"));
  }, [t]);

  // Filter out DM conversations where the other participant is blocked or conversation is hidden
  const filteredConversations = React.useMemo(() => {
    return conversations.filter(c => {
      if (hiddenConversationIds.includes(c.id)) {
        return false;
      }
      if (!c.is_group) {
        const otherUid = c.participants?.find(p => p !== user?.uid);
        if (otherUid) {
          const otherProfile = users.find(u => u.id === otherUid);
          if (otherProfile?.is_blocked === true) {
            return false;
          }
        }
      }
      return true;
    });
  }, [conversations, users, user?.uid, hiddenConversationIds]);

  const threadsRef = useRef<ForumThread[]>(threads);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const handleNotificationClickRef = useRef<(notif: AppNotification) => void>(() => {});

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() => {
    try {
      const cached = secureLocalStorage.getItem('active_conversation');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  const handleSetActiveConversation = (conv: Conversation | null) => {
    if (conv && !conv.is_group) {
      const otherUid = conv.participants?.find(uid => uid !== user?.uid);
      if (otherUid) {
        const otherProfile = users.find(u => u.id === otherUid);
        if (otherProfile?.is_blocked === true) {
          toast.error('Deze gebruiker is geblokkeerd.');
          setActiveConversation(null);
          secureLocalStorage.removeItem('active_conversation');
          return;
        }
      }
    }
    setActiveConversation(conv);
    if (conv) {
      secureLocalStorage.setItem('active_conversation', JSON.stringify(conv));
    } else {
      secureLocalStorage.removeItem('active_conversation');
    }
  };
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostInput, setEditPostInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageInput, setEditMessageInput] = useState('');
  
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<ForumComment | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<number | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    return localStorage.getItem('has_seen_whats_new_v2.5') !== 'true';
  });
  const [whatsNewStep, setWhatsNewStep] = useState(1);
  const [hasSeenNews, setHasSeenNews] = useState(() => {
    return localStorage.getItem('has_seen_news_v2.5') === 'true';
  });
  const [hasSeenMenu, setHasSeenMenu] = useState(() => {
    return localStorage.getItem('has_seen_menu_v2.5') === 'true';
  });
  const cleanNotificationSettings = (settings: any): NotificationSettings => {
    const defaultSettings = {
      enable_sounds: true,
      notify_new_posts: true,
      notify_new_messages: true,
      notify_mentions: true,
      message_sound: SOUND_OPTIONS[0].url,
      post_sound: SOUND_OPTIONS[1].url,
      ringtone_url: RINGTONE_OPTIONS[0].url,
      discord_webhook_url: '',
      discord_notify_general: false,
      discord_notify_dm: false
    };

    if (!settings) return defaultSettings;

    // Map old camelCase keys to snake_case if they exist and snake_case is missing
    const cleaned: NotificationSettings = {
      enable_sounds: settings.enable_sounds !== undefined ? settings.enable_sounds : (settings.enableSounds !== undefined ? settings.enableSounds : defaultSettings.enable_sounds),
      notify_new_posts: settings.notify_new_posts !== undefined ? settings.notify_new_posts : (settings.notifyNewPosts !== undefined ? settings.notifyNewPosts : defaultSettings.notify_new_posts),
      notify_new_messages: settings.notify_new_messages !== undefined ? settings.notify_new_messages : (settings.notifyNewMessages !== undefined ? settings.notifyNewMessages : defaultSettings.notify_new_messages),
      notify_mentions: settings.notify_mentions !== undefined ? settings.notify_mentions : (settings.notifyMentions !== undefined ? settings.notifyMentions : defaultSettings.notify_mentions),
      message_sound: settings.message_sound || settings.messageSound || defaultSettings.message_sound,
      post_sound: settings.post_sound || settings.postSound || defaultSettings.post_sound,
      ringtone_url: settings.ringtone_url || defaultSettings.ringtone_url,
      discord_webhook_url: settings.discord_webhook_url !== undefined ? settings.discord_webhook_url : defaultSettings.discord_webhook_url,
      discord_notify_general: settings.discord_notify_general !== undefined ? settings.discord_notify_general : defaultSettings.discord_notify_general,
      discord_notify_dm: settings.discord_notify_dm !== undefined ? settings.discord_notify_dm : defaultSettings.discord_notify_dm
    };

    // Migration: Reset problematic old Mixkit URLs
    const oldMixkitUrls = [
      'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'
    ];

    if (oldMixkitUrls.includes(cleaned.message_sound)) {
      cleaned.message_sound = SOUND_OPTIONS[0].url;
    }
    if (oldMixkitUrls.includes(cleaned.post_sound)) {
      cleaned.post_sound = SOUND_OPTIONS[1].url;
    }

    return cleaned;
  };

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_notification_settings');
      return cleanNotificationSettings(cached ? JSON.parse(cached) : null);
    } catch (e) {
      console.error('Failed to parse cached_notification_settings', e);
      return cleanNotificationSettings(null);
    }
  });
  const [customSounds, setCustomSounds] = useState<{ name: string, url: string }[]>([]);
  const [uploadingSound, setUploadingSound] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const handleUpdate = () => {
      toast.info('Nieuwe update beschikbaar!', {
        description: 'Ververs de pagina om de nieuwste functies te gebruiken.',
        duration: Infinity,
        action: {
          label: 'Verversen',
          onClick: () => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg && reg.waiting) {
                  reg.waiting.postMessage('SKIP_WAITING');
                }
                // Short buffer to allow service worker to process message and activate
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }).catch(() => {
                window.location.reload();
              });
            } else {
              window.location.reload();
            }
          }
        }
      });
    };
    window.addEventListener('sw-update-available', handleUpdate);
    
    // Auto-unlock audio on first interaction
    const autoUnlock = async () => {
      try {
        const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        await silent.play();
        setIsAudioUnlocked(true);
        console.log('Audio auto-unlocked');
        
        if (/CrOS|Chromebook|ChromeOS|cros/i.test(navigator.userAgent || '')) {
          toast.success('Chrome OS Audio Geactiveerd', {
            description: 'Geluiden zouden nu moeten werken. Gebruik de luidspreker bovenin bij problemen.',
            duration: 5000
          });
        }

        // Preload sounds after unlock
        SOUND_OPTIONS.forEach(opt => {
          if (!audioCache.has(opt.url)) {
            const audio = new Audio(opt.url);
            audio.preload = 'auto';
            audio.load();
            audioCache.set(opt.url, audio);
          }
        });

        window.removeEventListener('click', autoUnlock);
        window.removeEventListener('touchstart', autoUnlock);
        window.removeEventListener('keydown', autoUnlock);
      } catch (e) {
        // Silent fail
      }
    };
    window.addEventListener('click', autoUnlock);
    window.addEventListener('touchstart', autoUnlock);
    window.addEventListener('keydown', autoUnlock);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
      window.removeEventListener('click', autoUnlock);
      window.removeEventListener('touchstart', autoUnlock);
      window.removeEventListener('keydown', autoUnlock);
    };
  }, []);

  useEffect(() => {
    const handleSwitchView = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setView(customEvent.detail);
      }
    };
    window.addEventListener('ftjm_switch_view', handleSwitchView);
    return () => window.removeEventListener('ftjm_switch_view', handleSwitchView);
  }, []);

  const unlockAudio = async () => {
    try {
      if (isAudioUnlocked) {
        playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, true, user?.uid, profile?.display_name || user?.displayName || 'Anoniem');
        toast.info('Test geluid afgespeeld');
        return;
      }
      const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      await silent.play();
      setIsAudioUnlocked(true);
      toast.success('Audio geactiveerd!');
      logAudioEvent('system', 'success', 'Audio handmatig ontgrendeld door gebruiker', user?.uid, profile?.display_name || user?.displayName || 'Anoniem');
      // Play a quick test sound after activation
      setTimeout(() => {
        playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, true, user?.uid, profile?.display_name || user?.displayName || 'Anoniem');
      }, 500);
    } catch (err) {
      console.error('Failed to unlock audio:', err);
      toast.error('Audio activatie mislukt. Klik ergens op de pagina.');
    }
  };

  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_customTheme');
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
        wallpaper_y: 50,
        border_radius: 24,
        font_family: 'sans'
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
        wallpaper_y: 50,
        border_radius: 24,
        font_family: 'sans'
      };
    }
  });

  const [useCustomTheme, setUseCustomTheme] = useState(() => {
    return secureLocalStorage.getItem('cached_useCustomTheme') === 'true';
  });

  const [nicknames, setNicknames] = useState<Record<string, string>>(() => {
    try {
      const cached = secureLocalStorage.getItem('cached_nicknames');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Profile Media Gallery States
  const [profileMedia, setProfileMedia] = React.useState<any[]>([]);
  const [profileMediaLoading, setProfileMediaLoading] = React.useState<boolean>(false);
  const [selectedFullscreenMedia, setSelectedFullscreenMedia] = React.useState<string | null>(null);

  // Image Compressor for Profile Media
  const compressProfileMediaImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 720;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.62);
            resolve(compressed);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Profile Media Handler
  const handleAddProfileMedia = async (url: string, type: 'image' | 'gif' | 'video', fileBlob?: File | Blob) => {
    if (!user) return;
    if (selectedUser && selectedUser.id === user.uid && profileMedia.length >= 10) {
      toast.error('Je kunt maximaal 10 media items uploaden onder je profiel.');
      return;
    }

    setProfileMediaLoading(true);
    let finalMediaUrl = url;

    // 1. Direct Supabase Storage upload attempt for permanent CDN hosting
    if (fileBlob) {
      try {
        const isVid = type === 'video' || fileBlob.type.includes('video');
        const fileExt = isVid
          ? (fileBlob.type.includes('webm') ? 'webm' : fileBlob.type.includes('quicktime') ? 'mov' : 'mp4')
          : 'jpg';
        const fileName = `${user.uid}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const possibleBuckets = ['media', 'profile_media', 'videos', 'uploads', 'public', 'files', 'chat-attachments', 'avatars'];
        
        for (const bucket of possibleBuckets) {
          try {
            const { data: uploadData, error: uploadErr } = await supabaseClient.storage
              .from(bucket)
              .upload(fileName, fileBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: fileBlob.type || (isVid ? 'video/mp4' : 'image/jpeg')
              });
            
            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabaseClient.storage
                .from(bucket)
                .getPublicUrl(fileName);
              
              if (publicUrlData?.publicUrl) {
                finalMediaUrl = publicUrlData.publicUrl;
                break;
              }
            }
          } catch (bErr) {
            // try next bucket
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload fallback:', storageErr);
      }
    }

    const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`;

    const isVideoType = type === 'video' || (finalMediaUrl && (finalMediaUrl.startsWith('data:video/') || /\.(mp4|webm|mov|mkv|m4v|ogv)(\?.*)?$/i.test(finalMediaUrl)));
    // Database constraint profile_media_media_type_check strictly requires 'image' or 'gif'
    const dbMediaType = type === 'gif' ? 'gif' : 'image';

    const newRecord = {
      id: generatedId,
      user_id: user.uid,
      media_url: finalMediaUrl,
      media_type: dbMediaType,
      likes: [] as string[],
      comments: [] as any[],
      created_at: new Date().toISOString()
    };

    try {
      // Insert STRICTLY into public.profile_media table in Supabase
      const { data, error } = await supabaseClient
        .from('profile_media')
        .insert([newRecord])
        .select();

      if (error) {
        console.error('Failed to insert into public.profile_media:', error);
        toast.error('Fout bij opslaan in public.profile_media: ' + (error.message || JSON.stringify(error)));
        throw error;
      }

      const savedItem = (data && data[0]) ? {
        ...data[0],
        media_type: isVideoType ? 'video' : (data[0].media_type || dbMediaType),
        likes: data[0].likes || [],
        comments: data[0].comments || []
      } : {
        ...newRecord,
        media_type: isVideoType ? 'video' : dbMediaType
      };

      setProfileMedia(prev => [savedItem, ...prev.filter(m => m.id !== savedItem.id && m.media_url !== savedItem.media_url)]);

      // Update local feedMedia immediately
      const broadcastItem = {
        ...savedItem,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || null,
        likes: savedItem.likes || [],
        comments: savedItem.comments || []
      };

      setFeedMedia(prev => {
        if (prev.some(m => m.id === savedItem.id || m.media_url === savedItem.media_url)) {
          return prev.map(m => (m.id === savedItem.id || m.media_url === savedItem.media_url) ? { ...m, ...broadcastItem } : m);
        }
        return [broadcastItem, ...prev];
      });

      if (type === 'video') {
        toast.success('Video opgeslagen in public.profile_media!');
      } else {
        toast.success('Media opgeslagen in public.profile_media!');
      }

      // Real-time broadcast new media
      try {
        supabaseClient.channel('media_feed_realtime').send({
          type: 'broadcast',
          event: 'media_event',
          payload: { type: 'NEW_MEDIA', media: broadcastItem }
        });
      } catch (bcErr) {
        console.warn('Media broadcast failed:', bcErr);
      }

      // Notify followers of new upload
      try {
        const { data: followers } = await supabaseClient
          .from('profiles')
          .select('id')
          .contains('custom_theme', { following: [user.uid] });

        const followerIds = new Set<string>();
        if (followers) {
          followers.forEach(f => followerIds.add(f.id));
        }
        users.filter(u => u.custom_theme?.following?.includes(user.uid)).forEach(u => followerIds.add(u.id));

        if (followerIds.size > 0) {
          const promises = Array.from(followerIds).map(fid => {
            return supabaseClient.from('notifications').insert({
              user_id: fid,
              actor_id: user.uid,
              actor_name: profile?.display_name || user.displayName || 'Anoniem',
              actor_photo: profile?.photo_url || user.photoURL || null,
              type: 'mention',
              resource_type: 'post',
              resource_id: 'media_feed',
              content: `${profile?.display_name || user.displayName || 'Anoniem'} heeft een nieuwe ${type === 'video' ? 'video' : type === 'gif' ? 'GIF' : 'foto'} geüpload!`,
              is_read: false,
              created_at: new Date().toISOString()
            });
          });
          await Promise.allSettled(promises);
        }
      } catch (notifErr) {
        console.warn('Follower notification dispatch failed:', notifErr);
      }

    } catch (err: any) {
      console.error('Error adding profile media:', err);
    } finally {
      setProfileMediaLoading(false);
      // Refresh the Media Feed instantly!
      fetchFeedMedia();
    }
  };

  // Delete Profile Media Handler
  const handleDeleteProfileMedia = async (itemId: string, mediaUrl: string) => {
    if (!selectedUser || !user) return;

    setProfileMediaLoading(true);
    try {
      // Delete strictly from public.profile_media table
      const { error } = await supabaseClient
        .from('profile_media')
        .delete()
        .or(`id.eq.${itemId},media_url.eq.${mediaUrl}`);

      if (error) {
        toast.error('Fout bij het verwijderen uit public.profile_media: ' + error.message);
        throw error;
      }

      setProfileMedia(prev => prev.filter(m => m.id !== itemId && m.media_url !== mediaUrl));
      setFeedMedia(prev => prev.filter(m => m.id !== itemId && m.media_url !== mediaUrl));
      toast.success('Media verwijderd uit public.profile_media!');
    } catch (err: any) {
      console.error('Error deleting profile media:', err);
    } finally {
      setProfileMediaLoading(false);
    }
  };

  const handleProfileMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximaal 5MB toegestaan.');
      return;
    }

    setProfileMediaLoading(true);
    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/i.test(file.name);
      
      if (isVideo) {
        let isDone = false;

        const processAndUploadVideo = () => {
          if (isDone) return;
          isDone = true;

          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Url = event.target?.result as string;
            await handleAddProfileMedia(base64Url, 'video', file);
            setProfileMediaLoading(false);
          };
          reader.onerror = () => {
            toast.error('Kan de video niet inlezen.');
            setProfileMediaLoading(false);
          };
          reader.readAsDataURL(file);
        };

        const blobUrl = URL.createObjectURL(file);
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        
        videoEl.onloadedmetadata = () => {
          setTimeout(() => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }, 1000);
          const duration = videoEl.duration;
          if (isFinite(duration) && duration > 5.5) {
            toast.error('Video is te lang. Maximaal 5 seconden toegestaan.');
            setProfileMediaLoading(false);
            isDone = true;
            return;
          }
          processAndUploadVideo();
        };

        videoEl.onerror = () => {
          setTimeout(() => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }, 1000);
          // If metadata fails to read preview on some devices, still proceed to read file & upload
          processAndUploadVideo();
        };

        videoEl.src = blobUrl;
        videoEl.load();

        // Safety fallback timer if onloadedmetadata hangs or does not trigger
        setTimeout(() => {
          if (!isDone) {
            URL.revokeObjectURL(blobUrl);
            processAndUploadVideo();
          }
        }, 1800);
      } else {
        const compressed = await compressProfileMediaImage(file);
        await handleAddProfileMedia(compressed, 'image', file);
        setProfileMediaLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to process file upload:', err);
      toast.error('Fout bij verwerken bestand: ' + (err.message || err));
      setProfileMediaLoading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Fetch Profile Media on selectedUser change
  React.useEffect(() => {
    if (!selectedUser) {
      setProfileMedia([]);
      return;
    }

    const fetchProfileMedia = async () => {
      setProfileMediaLoading(true);
      try {
        const { data, error } = await supabaseClient
          .from('profile_media')
          .select('*')
          .eq('user_id', selectedUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching public.profile_media:', error);
          setProfileMedia([]);
        } else {
          setProfileMedia(data || []);
        }
      } catch (err) {
        console.error('Error fetching public.profile_media:', err);
        setProfileMedia([]);
      } finally {
        setProfileMediaLoading(false);
      }
    };

    fetchProfileMedia();
  }, [selectedUser?.id]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const [feedMedia, setFeedMedia] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [feedViewMode, setFeedViewMode] = useState<'grid' | 'swipe'>(() => {
    try {
      return (localStorage.getItem('ftjm_feed_view_mode') as 'grid' | 'swipe') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [sharedMediaId, setSharedMediaId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const mediaParam = params.get('media') || params.get('media_id');
      if (mediaParam) return mediaParam;
      const hash = window.location.hash;
      if (hash.includes('media=')) {
        const match = hash.match(/media=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    } catch (e) {
      console.error('Error parsing shared media URL param:', e);
    }
    return null;
  });

  // If user is authenticated and whitelist approved, navigate to the media feed to view the shared post with full swipe/like/comment features
  useEffect(() => {
    if (sharedMediaId && user && isWhitelisted) {
      setView('media_feed');
      setFeedViewMode('swipe');
    }
  }, [sharedMediaId, user, isWhitelisted]);

  const fetchFeedMedia = async () => {
    setFeedLoading(true);
    try {
      // Fetch strictly from public.profile_media table in Supabase
      const { data: dbMediaData, error: dbError } = await supabaseClient
        .from('profile_media')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbError) {
        console.error('Error fetching public.profile_media for feed:', dbError);
        setFeedMedia([]);
        return;
      }

      const dbList = Array.isArray(dbMediaData) ? dbMediaData : [];
      const userIds = Array.from(new Set(dbList.map((m: any) => m.user_id)));

      let fetchedProfiles: UserProfile[] = [];
      if (userIds.length > 0) {
        const { data: pData, error: pError } = await supabaseClient
          .from('profiles')
          .select('id, display_name, photo_url, email, created_at, updated_at, is_blocked')
          .in('id', userIds);
        if (!pError && pData) {
          fetchedProfiles = pData;
          setUsers(prev => {
            const map = new Map<string, UserProfile>();
            prev.forEach(u => map.set(u.id, u));
            pData.forEach(p => {
              const existing = map.get(p.id);
              map.set(p.id, existing ? { ...existing, ...p } : p);
            });
            return Array.from(map.values()).sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
          });
        }
      }

      const mappedList = dbList.map((m: any) => {
        const authorProfile = fetchedProfiles.find(u => u.id === m.user_id) 
          || usersRef.current.find(u => u.id === m.user_id)
          || (user && m.user_id === user.uid ? profile : null);
        const isVid = m.media_type === 'video' || (m.media_url && (m.media_url.startsWith('data:video/') || /\.(mp4|webm|mov|mkv|m4v)(\?.*)?$/i.test(m.media_url)));

        return {
          ...m,
          media_type: isVid ? 'video' : (m.media_type || 'image'),
          author_name: authorProfile?.display_name || (user && m.user_id === user.uid ? (profile?.display_name || user.displayName) : null) || 'Anoniem',
          author_photo: authorProfile?.photo_url || (user && m.user_id === user.uid ? (profile?.photo_url || user.photoURL) : null) || null,
          likes: m.likes || [],
          comments: m.comments || []
        };
      });

      mappedList.sort((a, b) => {
        const aLikes = (a.likes || []).length;
        const bLikes = (b.likes || []).length;
        if (bLikes !== aLikes) {
          return bLikes - aLikes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setFeedMedia(mappedList);
    } catch (err) {
      console.error('Error loading media feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleLikeMedia = async (mediaId: string, authorId: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om te liken.');
      return;
    }

    try {
      const currentMediaItem = feedMedia.find(m => m.id === mediaId || m.media_url === mediaId);
      const likes = currentMediaItem?.likes || [];
      
      let isLiked = false;
      let updatedLikes: string[];
      if (likes.includes(user.uid)) {
        updatedLikes = likes.filter((uid: string) => uid !== user.uid);
        isLiked = false;
      } else {
        updatedLikes = [...likes, user.uid];
        isLiked = true;
      }

      // Update strictly in public.profile_media table
      const { error: dbError } = await supabaseClient
        .from('profile_media')
        .update({ likes: updatedLikes })
        .or(`id.eq.${mediaId},media_url.eq.${mediaId}`);

      if (dbError) {
        throw dbError;
      }

      // Update local feedMedia instantly
      setFeedMedia(prev => {
        const updated = prev.map(m => {
          if (m.id === mediaId || m.media_url === mediaId) {
            return {
              ...m,
              likes: updatedLikes
            };
          }
          return m;
        });

        return updated.sort((a, b) => {
          const aLikes = (a.likes || []).length;
          const bLikes = (b.likes || []).length;
          if (bLikes !== aLikes) {
            return bLikes - aLikes;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });

      try {
        supabaseClient.channel('media_feed_realtime').send({
          type: 'broadcast',
          event: 'media_event',
          payload: { type: 'LIKE', mediaId, likes: updatedLikes }
        });
      } catch (bcErr) {
        console.warn('Realtime like broadcast error:', bcErr);
      }

      if (isLiked && authorId !== user.uid) {
        await supabaseClient.from('notifications').insert({
          user_id: authorId,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || null,
          type: 'mention',
          resource_type: 'post',
          resource_id: 'media_feed',
          content: `${profile?.display_name || user.displayName || 'Anoniem'} vindt je foto leuk! ❤️`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      toast.success(isLiked ? 'Leuk gevonden!' : 'Niet meer leuk gevonden');
    } catch (err: any) {
      console.error('Error liking media:', err);
      toast.error('Fout bij liken: ' + err.message);
    }
  };

  const handleCommentMedia = async (mediaId: string, authorId: string, text: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om te reageren.');
      return;
    }
    if (!text.trim()) return;

    try {
      const currentMediaItem = feedMedia.find(m => m.id === mediaId || m.media_url === mediaId);
      const comments = currentMediaItem?.comments || [];

      const newComment = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
        user_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || null,
        text: text.trim(),
        created_at: new Date().toISOString()
      };

      const updatedComments = [...comments, newComment];

      // Update strictly in public.profile_media table
      const { error: dbError } = await supabaseClient
        .from('profile_media')
        .update({ comments: updatedComments })
        .or(`id.eq.${mediaId},media_url.eq.${mediaId}`);

      if (dbError) {
        throw dbError;
      }

      setFeedMedia(prev => prev.map(m => {
        if (m.id === mediaId || m.media_url === mediaId) {
          return {
            ...m,
            comments: updatedComments
          };
        }
        return m;
      }));

      try {
        supabaseClient.channel('media_feed_realtime').send({
          type: 'broadcast',
          event: 'media_event',
          payload: { type: 'COMMENT', mediaId, comments: updatedComments }
        });
      } catch (bcErr) {
        console.warn('Realtime comment broadcast error:', bcErr);
      }

      if (authorId !== user.uid) {
        await supabaseClient.from('notifications').insert({
          user_id: authorId,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || null,
          type: 'mention',
          resource_type: 'post',
          resource_id: 'media_feed',
          content: `${profile?.display_name || user.displayName || 'Anoniem'} reageerde op je foto: "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}" 💬`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      toast.success('Reactie geplaatst!');
    } catch (err: any) {
      console.error('Error commenting on media:', err);
      toast.error('Fout bij plaatsen reactie: ' + err.message);
    }
  };

  const handleDeleteCommentMedia = async (mediaId: string, authorId: string, commentId: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om een reactie te verwijderen.');
      return;
    }

    try {
      const currentMediaItem = feedMedia.find(m => m.id === mediaId || m.media_url === mediaId);
      if (!currentMediaItem) return;
      const comments = currentMediaItem?.comments || [];
      
      const targetComment = comments.find(c => c.id === commentId);
      if (!targetComment) {
        toast.error('Reactie niet gevonden.');
        return;
      }

      const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
      if (targetComment.user_id !== user.uid && !isSystemAdmin) {
        toast.error('Je kunt alleen je eigen reacties verwijderen.');
        return;
      }

      const updatedComments = comments.filter(c => c.id !== commentId);

      // Update strictly in public.profile_media table
      const { error: dbError } = await supabaseClient
        .from('profile_media')
        .update({ comments: updatedComments })
        .or(`id.eq.${mediaId},media_url.eq.${mediaId}`);

      if (dbError) {
        throw dbError;
      }

      setFeedMedia(prev => prev.map(m => {
        if (m.id === mediaId || m.media_url === mediaId) {
          return {
            ...m,
            comments: updatedComments
          };
        }
        return m;
      }));

      try {
        supabaseClient.channel('media_feed_realtime').send({
          type: 'broadcast',
          event: 'media_event',
          payload: { type: 'COMMENT', mediaId, comments: updatedComments }
        });
      } catch (bcErr) {
        console.warn('Realtime comment delete broadcast error:', bcErr);
      }

      toast.success('Reactie verwijderd!');
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast.error('Fout bij verwijderen reactie: ' + err.message);
    }
  };

  const handleDeleteFeedMedia = async (mediaId: string, authorId: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om media te verwijderen.');
      return;
    }

    const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
    if (authorId !== user.uid && !isSystemAdmin) {
      toast.error('Je hebt geen rechten om deze media te verwijderen.');
      return;
    }

    try {
      // Delete strictly from public.profile_media table
      const { error: dbError } = await supabaseClient
        .from('profile_media')
        .delete()
        .or(`id.eq.${mediaId},media_url.eq.${mediaId}`);

      if (dbError) {
        throw dbError;
      }

      if (authorId === user.uid) {
        setProfileMedia(prev => prev.filter(m => m.id !== mediaId && m.media_url !== mediaId));
      }

      setFeedMedia(prev => prev.filter(m => m.id !== mediaId && m.media_url !== mediaId));

      try {
        supabaseClient.channel('media_feed_realtime').send({
          type: 'broadcast',
          event: 'media_event',
          payload: { type: 'DELETE_MEDIA', mediaId }
        });
      } catch (bcErr) {
        console.warn('Realtime media delete broadcast error:', bcErr);
      }

      toast.success('Media verwijderd!');
    } catch (err: any) {
      console.error('Error deleting media:', err);
      toast.error('Fout bij verwijderen media: ' + err.message);
    }
  };

  // Real-time Media Feed Subscription (Supabase Postgres Changes + Instant Broadcasts)
  useEffect(() => {
    if (!user || isWhitelisted !== true) return;

    fetchFeedMedia();

    const mediaChannel = supabaseClient
      .channel('media_feed_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_media' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMedia = payload.new as any;
            const authorProfile = usersRef.current.find(u => u.id === newMedia.user_id)
              || (user && newMedia.user_id === user.uid ? profile : null);

            const mappedItem = {
              ...newMedia,
              author_name: authorProfile?.display_name || (user && newMedia.user_id === user.uid ? (profile?.display_name || user.displayName) : null) || 'Anoniem',
              author_photo: authorProfile?.photo_url || (user && newMedia.user_id === user.uid ? (profile?.photo_url || user.photoURL) : null) || null,
              likes: newMedia.likes || [],
              comments: newMedia.comments || []
            };

            setFeedMedia(prev => {
              if (prev.some(m => m.id === mappedItem.id || m.media_url === mappedItem.media_url)) {
                return prev.map(m => (m.id === mappedItem.id || m.media_url === mappedItem.media_url) ? { ...m, ...mappedItem } : m);
              }
              const updated = [mappedItem, ...prev];
              return updated.sort((a, b) => {
                const aLikes = (a.likes || []).length;
                const bLikes = (b.likes || []).length;
                if (bLikes !== aLikes) return bLikes - aLikes;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setFeedMedia(prev => {
              const next = prev.map(m => {
                if (m.id === updated.id || m.media_url === updated.media_url) {
                  return {
                    ...m,
                    ...updated,
                    author_name: m.author_name,
                    author_photo: m.author_photo,
                    likes: updated.likes || [],
                    comments: updated.comments || []
                  };
                }
                return m;
              });
              return next.sort((a, b) => {
                const aLikes = (a.likes || []).length;
                const bLikes = (b.likes || []).length;
                if (bLikes !== aLikes) return bLikes - aLikes;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setFeedMedia(prev => prev.filter(m => m.id !== deletedId));
            }
          }
        }
      )
      .on('broadcast', { event: 'media_event' }, ({ payload }) => {
        if (!payload) return;
        if (payload.type === 'LIKE') {
          const { mediaId, likes } = payload;
          setFeedMedia(prev => {
            const next = prev.map(m => {
              if (m.id === mediaId || m.media_url === mediaId) {
                return { ...m, likes };
              }
              return m;
            });
            return next.sort((a, b) => {
              const aLikes = (a.likes || []).length;
              const bLikes = (b.likes || []).length;
              if (bLikes !== aLikes) return bLikes - aLikes;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
        } else if (payload.type === 'COMMENT') {
          const { mediaId, comments } = payload;
          setFeedMedia(prev => prev.map(m => {
            if (m.id === mediaId || m.media_url === mediaId) {
              return { ...m, comments };
            }
            return m;
          }));
        } else if (payload.type === 'NEW_MEDIA') {
          const { media } = payload;
          setFeedMedia(prev => {
            if (prev.some(m => m.id === media.id || m.media_url === media.media_url)) {
              return prev.map(m => (m.id === media.id || m.media_url === media.media_url) ? { ...m, ...media } : m);
            }
            const next = [media, ...prev];
            return next.sort((a, b) => {
              const aLikes = (a.likes || []).length;
              const bLikes = (b.likes || []).length;
              if (bLikes !== aLikes) return bLikes - aLikes;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
        } else if (payload.type === 'DELETE_MEDIA') {
          const { mediaId } = payload;
          setFeedMedia(prev => prev.filter(m => m.id !== mediaId && m.media_url !== mediaId));
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(mediaChannel);
    };
  }, [user?.uid, isWhitelisted]);

  useEffect(() => {
    if (view === 'media_feed') {
      fetchFeedMedia();
    }
  }, [view]);

  const [selectedUserFollowers, setSelectedUserFollowers] = useState<UserProfile[]>([]);
  const [selectedUserFollowing, setSelectedUserFollowing] = useState<UserProfile[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersSearchQuery, setFollowersSearchQuery] = useState('');
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');

  const filteredFollowers = useMemo(() => {
    const query = followersSearchQuery.toLowerCase();
    return selectedUserFollowers.filter(f => 
      f.display_name?.toLowerCase().includes(query) ||
      f.bio?.toLowerCase().includes(query) ||
      f.email?.toLowerCase().includes(query)
    );
  }, [selectedUserFollowers, followersSearchQuery]);

  const filteredFollowing = useMemo(() => {
    const query = followingSearchQuery.toLowerCase();
    return selectedUserFollowing.filter(f => 
      f.display_name?.toLowerCase().includes(query) ||
      f.bio?.toLowerCase().includes(query) ||
      f.email?.toLowerCase().includes(query)
    );
  }, [selectedUserFollowing, followingSearchQuery]);
  
  useEffect(() => {
    if (selectedUser) {
      setNicknameInput(nicknames[selectedUser.id] || '');
      setIsEditingNickname(false);
    }
  }, [selectedUser, nicknames]);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserFollowers([]);
      setSelectedUserFollowing([]);
      setShowFollowersModal(false);
      setShowFollowingModal(false);
      return;
    }

    const loadFollows = async () => {
      try {
        const { data: followersData, error: followersError } = await supabaseClient
          .from('profiles')
          .select('id, display_name, photo_url, custom_theme, bio')
          .contains('custom_theme', { following: [selectedUser.id] });

        if (!followersError && followersData) {
          setSelectedUserFollowers(followersData);
        } else {
          setSelectedUserFollowers(users.filter(u => u.custom_theme?.following?.includes(selectedUser.id)));
        }

        const followingIds = selectedUser.custom_theme?.following || [];
        if (followingIds.length > 0) {
          const { data: followingData, error: followingError } = await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url, custom_theme, bio')
            .in('id', followingIds);

          if (!followingError && followingData) {
            setSelectedUserFollowing(followingData);
          } else {
            setSelectedUserFollowing(users.filter(u => followingIds.includes(u.id)));
          }
        } else {
          setSelectedUserFollowing([]);
        }
      } catch (err) {
        console.error('Error loading followers/following:', err);
      }
    };

    loadFollows();
  }, [selectedUser?.id, selectedUser?.custom_theme?.following, users]);

  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'post' | 'message', id: string, userId: string, displayName: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<UserProfile[]>([]);
  const [mentionPosition, setMentionPosition] = useState<{ top: number, left: number } | null>(null);
  const [activeMentionInput, setActiveMentionInput] = useState<'post' | 'message' | 'comment' | 'editPost' | 'editMessage' | null>(null);

  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiResults, setEmojiResults] = useState<any[]>([]);
  const [emojiPosition, setEmojiPosition] = useState<{ top: number, left: number } | null>(null);
  const [emojiPickerMode, setEmojiPickerMode] = useState<'picker' | 'suggestion'>('suggestion');
  const [showAdminPrank, setShowAdminPrank] = useState(false);
  const [adminPrankLogs, setAdminPrankLogs] = useState<string[]>([]);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isPranking, setIsPranking] = useState(false);
  const [fakeErrors, setFakeErrors] = useState<string[]>([]);
  const saveConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savePostsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [messagesLimit, setMessagesLimit] = useState(50);

  const [websiteStatus, setWebsiteStatus] = useState<string>(() => {
    return secureLocalStorage.getItem('cached_websiteStatus') || 'Online';
  });
  const [statusInput, setStatusInput] = useState('');
  const [scheduledMaintenance, setScheduledMaintenance] = useState<{ isActive: boolean; targetTime: string }>({
    isActive: false,
    targetTime: '',
  });
  const [maintenanceTimeLeft, setMaintenanceTimeLeft] = useState<number | null>(null);
  const playedMaintenanceTriggersRef = useRef<Set<string>>(new Set());
  const [reports, setReports] = useState<Report[]>([]); // Reports state remains but we don't fetch for admin UI anymore
  
  const hasFetchedConversations = useRef(false);
  const hasFetchedPosts = useRef(false);
  const hasFetchedAdminData = useRef(false);
  const hasFetchedStatus = useRef(false);
  const hasFetchedProfile = useRef(false);
  const hasFetchedWhitelist = useRef(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, { name: string, lastSeen: number }>>>({});
  const typingStatuses = useMemo(() => {
    const newStatuses: Record<string, string[]> = {};
    Object.keys(typingUsers).forEach(convId => {
      newStatuses[convId] = Object.entries(typingUsers[convId]).map(([uid, u]) => {
        return nicknames[uid] || u.name;
      });
    });
    return newStatuses;
  }, [typingUsers, nicknames]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingInId, setTypingInId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleImageUrl = () => {
    const url = prompt('Voer de URL van de afbeelding in:');
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      if (view === 'chat') {
        setPostInput(prev => prev + (prev ? ' ' : '') + url);
      } else if (view === 'forum') {
        if (activeThread) {
          setCommentInput(prev => prev + (prev ? ' ' : '') + url);
        } else {
          setThreadContentInput(prev => prev + (prev ? ' ' : '') + url);
        }
      } else if (view === 'messages') {
        setMessageInput(prev => prev + (prev ? ' ' : '') + url);
      }
    } else if (url) {
      toast.error('Ongeldige URL. Zorg dat deze begint met http:// of https://');
    }
  };

  const handleClearCache = () => {
    const keysToRemove = [
      'cached_profile', 'cached_posts', 'cached_whitelist', 
      'cached_isWhitelisted', 'cached_conversations', 
      'cached_notifications', 'cached_customTheme', 
      'cached_useCustomTheme', 'cached_websiteStatus'
    ];
    keysToRemove.forEach(key => secureLocalStorage.removeItem(key));
    toast.success('Cache gewist! De pagina wordt herladen...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const startAdminPrank = async () => {
    if (isPranking) return;
    setIsPranking(true);
    setShowAdminPrank(true);
    setAdminPrankLogs([]);
    setFakeErrors([]);

    const addLog = (msg: string) => setAdminPrankLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    addLog("Initializing system diagnostic sequence...");
    await new Promise(r => setTimeout(r, 800));
    addLog("Bypassing main security firewall...");
    await new Promise(r => setTimeout(r, 1200));
    
    addLog(`TARGET_IP: Geanonimiseerd (Privacy-Dienst Actief)`);
    addLog(`LOCATION: Privacy Beveiligd, FTJM Enterprise`);
    addLog(`ISP: FTJM Secure Route`);
    addLog(`LAT/LONG: Verborgen (Privacy Wetgeving OK)`);

    addLog("Scanning local file system...");
    await new Promise(r => setTimeout(r, 1000));
    addLog("Found sensitive data: user_credentials.db");
    addLog("Found sensitive data: private_keys.pem");
    await new Promise(r => setTimeout(r, 1500));
    
    addLog("CRITICAL ERROR: Buffer overflow detected at 0x0045F2");
    await new Promise(r => setTimeout(r, 500));
    addLog("SYSTEM FAILURE IMMINENT");
    
    // Start showing fake errors
    const errors = [
      "FATAL ERROR: Memory corruption at 0x8823",
      "SECURITY BREACH: Unauthorized access to /root",
      "DATABASE_ERROR: Connection lost to Supabase",
      "KERNEL_PANIC: CPU overload",
      "WARNING: System temperature critical",
      "ERROR: Failed to load user profile",
      "ALERT: Malware detected in /src/App.tsx"
    ];

    for (let i = 0; i < 15; i++) {
      setFakeErrors(prev => [...prev, errors[Math.floor(Math.random() * errors.length)]]);
      await new Promise(r => setTimeout(r, 200));
    }

    await new Promise(r => setTimeout(r, 2000));
    setShowAdminPrank(false);
    setFakeErrors([]);
    setIsPranking(false);
    toast.success("Systeem hersteld. Alle processen zijn weer normaal.");
  };
  const initialLoadTime = useRef(new Date(Date.now() - 60000).toISOString()); // 60 seconds buffer to account for server/client clock drift
  const lastPostId = useRef<string | null>(null);
  const lastConversationUpdates = useRef<Record<string, string>>({});
  const notificationSettingsRef = useRef(notificationSettings);
  const activeConversationRef = useRef(activeConversation);
  const viewRef = useRef(view);
  const typingChannelRef = useRef<any>(null);
  const messageChannelRef = useRef<any>(null);
  const postsChannelRef = useRef<any>(null);
  const conversationsChannelRef = useRef<any>(null);
  const telemetryRecordedUidRef = useRef<string | null>(null);
  const telemetryInProgressRef = useRef<boolean>(false);

  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [supabaseClient, setSupabaseClient] = useState(supabase);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authAgreeTerms, setAuthAgreeTerms] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [devicePasskeys, setDevicePasskeys] = useState<any[]>([]);
  const [authStep, setAuthStep] = useState<'email' | 'password'>('email');
  const [lookupProfile, setLookupProfile] = useState<{ display_name: string; email: string; photo_url: string | null } | null>(null);
  const [isSearchingProfile, setIsSearchingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setAuthStep('email');
      setLookupProfile(null);
      setIsSearchingProfile(false);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    setAuthStep('email');
    setLookupProfile(null);
    setIsSearchingProfile(false);
  }, [isRegisterMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ftjm_device_passkeys');
      if (raw) {
        setDevicePasskeys(JSON.parse(raw));
      } else {
        setDevicePasskeys([]);
      }
    } catch (e) {
      console.error('Error loading dev passkeys:', e);
    }
  }, [isAuthModalOpen]);

  const handlePasskeyLogin = async () => {
    setAuthError(null);
    
    // Check if browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      setAuthError("Passkeys (WebAuthn) worden niet ondersteund in deze browser of context.");
      return;
    }

    try {
      const raw = localStorage.getItem('ftjm_device_passkeys');
      const passkeysList = raw ? JSON.parse(raw) : [];
      
      if (passkeysList.length === 0) {
        toast.error("Er is nog geen passkey geregistreerd op dit apparaat. Log eerst normaal in en registreer een passkey via je instellingen!");
        return;
      }

      setAuthLoading(true);
      
      // Request WebAuthn credential assertion
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: "required"
        }
      }) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error("Authenticatie geannuleerd.");
      }

      // Find passkey record with this credential ID
      const matchingRecord = passkeysList.find((pk: any) => pk.credentialId === assertion.id);
      
      if (!matchingRecord) {
        throw new Error("Deze passkey is niet herkend op dit apparaat.");
      }

      // Decrypt credentials
      const secretKey = assertion.id + "_secure_passkey";
      const decryptedBytes = CryptoJS.AES.decrypt(matchingRecord.payload, secretKey);
      const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error("Kan de opgeslagen accountgegevens niet ontsleutelen met de passkey.");
      }

      const { email, password } = JSON.parse(decryptedText);

      // Log in with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast.success(`Succesvol ingelogd als ${matchingRecord.userName || email}!`);
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error("Passkey login error:", err);
      setAuthError(err.message || "Passkey authenticatie mislukt.");
    } finally {
      setAuthLoading(false);
    }
  };
  const voiceCall = useVoiceCall(user, profile, supabaseClient);
  const [groupVoiceCallActiveRooms, setGroupVoiceCallActiveRooms] = useState<Set<string>>(new Set());

  // Listen for group call activity across all rooms
  useEffect(() => {
    if (!user) return;
    
    // This is a global channel to listen for group call signals
    const channel = supabaseClient.channel('group_calls_monitor');
    
    channel.on('broadcast', { event: 'group_join' }, ({ payload }) => {
      if (payload.roomId) {
        setGroupVoiceCallActiveRooms(prev => new Set(prev).add(payload.roomId));
      }
    }).on('broadcast', { event: 'group_leave' }, ({ payload }) => {
      // In a real app we'd need more logic to know if ANYONE is left, 
      // but for this demo we'll just periodically clear or rely on presence.
    }).subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user]);

  const groupVoiceCall = useGroupVoiceCall(user, profile, supabaseClient);
  const activeCallUserId = voiceCall.activeCall ? (voiceCall.isInitiator ? voiceCall.activeCall.targetId : voiceCall.activeCall.callerId) : undefined;


  useEffect(() => {
    // Preload custom sounds
    customSounds.forEach(sound => {
      if (!audioCache.has(sound.url)) {
        console.log('Preloading custom sound:', sound.name);
        const audio = new Audio(sound.url);
        audio.preload = 'auto';
        audio.load(); // Explicitly trigger load
        audioCache.set(sound.url, audio);
      }
    });
  }, [customSounds]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (useCustomTheme) {
      document.documentElement.setAttribute('data-custom-theme', 'true');
    } else {
      document.documentElement.removeAttribute('data-custom-theme');
    }

    // Always set data-theme
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
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
  }, [user?.uid]);

  // Caching effects
  useEffect(() => {
    if (profile) {
      // Limit profile size in storage
      const profileStr = JSON.stringify(profile);
      if (profileStr.length < 50000) { // 50KB limit
        secureLocalStorage.setItem('cached_profile', profileStr);
      }
    }
  }, [profile]);

  useEffect(() => {
    const data = JSON.stringify(whitelist);
    if (data.length < 100000) {
      secureLocalStorage.setItem('cached_whitelist', data);
    }
  }, [whitelist]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_isWhitelisted', JSON.stringify(isWhitelisted));
  }, [isWhitelisted]);

  useEffect(() => {
    const data = JSON.stringify(conversations);
    if (data.length < 200000) {
      secureLocalStorage.setItem('cached_conversations', data);
    }
  }, [conversations]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_notification_settings', JSON.stringify(notificationSettings));
    
    if (user) {
      const syncSettings = async () => {
        try {
          await supabaseClient
            .from('profiles')
            .update({ 
              notification_settings: {
                enable_sounds: notificationSettings.enable_sounds,
                notify_new_posts: notificationSettings.notify_new_posts,
                notify_new_messages: notificationSettings.notify_new_messages,
                notify_mentions: notificationSettings.notify_mentions,
                message_sound: notificationSettings.message_sound,
                post_sound: notificationSettings.post_sound,
                ringtone_url: notificationSettings.ringtone_url,
                discord_webhook_url: notificationSettings.discord_webhook_url,
                discord_notify_general: notificationSettings.discord_notify_general,
                discord_notify_dm: notificationSettings.discord_notify_dm
              } 
            })
            .eq('id', user.uid);
        } catch (err) {
          console.error('Failed to sync notification settings', err);
        }
      };
      
      const timer = setTimeout(syncSettings, 2000);
      return () => clearTimeout(timer);
    }
  }, [notificationSettings, user]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_customTheme', JSON.stringify(customTheme));
  }, [customTheme]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_useCustomTheme', useCustomTheme.toString());
  }, [useCustomTheme]);

  useEffect(() => {
    secureLocalStorage.setItem('cached_websiteStatus', websiteStatus);
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
      root.style.removeProperty('--custom-glass-chat-bg');
      root.style.removeProperty('--custom-glass-profile-bg');
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
    
    // Border Radius
    if (customTheme.border_radius !== undefined) {
      root.style.setProperty('--app-radius', `${customTheme.border_radius}px`);
    }

    // Font Family
    let fontFamily = '"Inter", sans-serif';
    if (customTheme.font_family === 'serif') fontFamily = 'ui-serif, Georgia, serif';
    root.style.setProperty('--custom-font', fontFamily);

    // Glass Effect Variables
    if (customTheme.glass_effect) {
      const r = parseInt(customTheme.card_bg_color?.slice(1,3) || 'ff', 16);
      const g = parseInt(customTheme.card_bg_color?.slice(3,5) || 'ff', 16);
      const b = parseInt(customTheme.card_bg_color?.slice(5,7) || 'ff', 16);
      const a = (100 - (customTheme.opacity || 0)) / 100;
      const chatA = (100 - (customTheme.chat_opacity ?? 0)) / 100;
      const profileA = (100 - (customTheme.profile_card_opacity ?? 0)) / 100;
      
      root.style.setProperty('--custom-glass-bg', `rgba(${r}, ${g}, ${b}, ${a})`);
      root.style.setProperty('--custom-glass-chat-bg', `rgba(${r}, ${g}, ${b}, ${chatA})`);
      root.style.setProperty('--custom-glass-profile-bg', `rgba(${r}, ${g}, ${b}, ${profileA})`);
      root.style.setProperty('--custom-glass-blur', `blur(${customTheme.blur_amount || 10}px)`);

      // Handle borders and shadows for transparency
      root.style.setProperty('--custom-glass-chat-border', chatA === 0 ? 'transparent' : 'var(--app-border)');
      root.style.setProperty('--custom-glass-chat-shadow', chatA === 0 ? 'none' : 'var(--shadow-sm)');
      root.style.setProperty('--custom-glass-profile-border', profileA === 0 ? 'transparent' : 'var(--app-border)');
      root.style.setProperty('--custom-glass-profile-shadow', profileA === 0 ? 'none' : 'var(--shadow-sm)');
    } else {
      root.style.setProperty('--custom-glass-bg', customTheme.card_bg_color || '#ffffff');
      root.style.setProperty('--custom-glass-chat-bg', customTheme.card_bg_color || '#ffffff');
      root.style.setProperty('--custom-glass-profile-bg', customTheme.card_bg_color || '#ffffff');
      root.style.setProperty('--custom-glass-blur', 'none');
      root.style.setProperty('--custom-glass-chat-border', 'var(--app-border)');
      root.style.setProperty('--custom-glass-chat-shadow', 'var(--shadow-sm)');
      root.style.setProperty('--custom-glass-profile-border', 'var(--app-border)');
      root.style.setProperty('--custom-glass-profile-shadow', 'var(--shadow-sm)');
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

  // Security & Permissions
  const isHardwareBanned = rateLimiter.isBanned();
  const isAdmin = profile?.role === 'admin' || user?.email === 'markohoksen@gmail.com';
  const isBlocked = profile?.is_blocked === true || isHardwareBanned;

  const notesData = parseAdminNotes(profile?.admin_notes, profile?.custom_theme);
  const isTempBanned = !!(notesData.banned_until && new Date(notesData.banned_until) > new Date());
  const activeWarning = notesData.warnings?.find(w => !w.read) || null;

  // Auto-set admin role for markohoksen@gmail.com
  useEffect(() => {
    if (user?.email === 'markohoksen@gmail.com' && profile && profile.role !== 'admin') {
      supabaseClient.from('profiles').update({ role: 'admin' }).eq('id', user.uid);
    }
  }, [user, profile]);

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

  // Notifications Fetch & Realtime
  useEffect(() => {
    if (!user || isWhitelisted !== true) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('notifications')
          .select('id, user_id, actor_id, actor_name, actor_photo, type, resource_id, resource_type, content, is_read, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();

    const channel = supabaseClient
      .channel(`notifications:${user.uid}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.uid}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev].slice(0, 20);
          });
          
          // Use ref to avoid re-subscribing when settings change
          const settings = notificationSettingsRef.current;
          if (settings.enable_sounds) {
            if (newNotif.type === 'dm') {
              playSound(settings.message_sound, true, user.uid, profile?.display_name || user.displayName || 'Anoniem');
            } else {
              playSound(settings.post_sound, true, user.uid, profile?.display_name || user.displayName || 'Anoniem');
            }
          }
          
          let title = 'Nieuwe melding';
          if (newNotif.type === 'mention') title = `Nieuwe vermelding door ${newNotif.actor_name}`;
          else if (newNotif.type === 'reply') title = `Nieuwe reactie van ${newNotif.actor_name}`;
          else if (newNotif.type === 'dm') title = `Nieuw bericht van ${newNotif.actor_name}`;
          
          toast.info(title, {
            description: newNotif.content,
            action: {
              label: 'Bekijken',
              onClick: () => {
                handleNotificationClickRef.current(newNotif);
              }
            }
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as AppNotification;
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
          }
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.uid, isWhitelisted]);

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
  }, []);

  // Auth state listener
  useEffect(() => {
    // Check current session first
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      handleAuthUser(session?.user || null, session);
    };
    checkSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state changed:', event, session?.user?.id);
      handleAuthUser(session?.user || null, session);
    });

    async function handleAuthUser(currentUser: any, activeSession?: any) {
      if (currentUser) {
        const mappedUser: User = {
          uid: currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'Anoniem',
          photoURL: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.photo_url || '',
        };
        setUser(mappedUser);
        
        if (mappedUser.email && mappedUser.email.toLowerCase() === '137903@edu.singelland.nl') {
          toast.success('Privacy bekrachtigd: Jouw data / IP-adres wordt conform verzoek niet meer verzameld.', {
            duration: 10000,
          });
        }
        
        if (currentUidRef.current !== currentUser.id) {
          currentUidRef.current = currentUser.id;
          setSupabaseFirebaseUid(currentUser.id);
          
          logAudioEvent('system', 'success', `Ingelogd als ${mappedUser.displayName || mappedUser.email}`, currentUser.id, mappedUser.displayName || 'Anoniem');
          
          // Recreate Supabase client with UID for Realtime headers
          const newClient = createSupabaseClient(currentUser.id);
          
          // Propagate active native session to the new client
          // to ensure native Supabase Auth.uid() works under RLS policies (e.g. conversations/messages).
          const sessionToSet = activeSession || (await supabaseClient.auth.getSession()).data.session;
          if (sessionToSet) {
            await newClient.auth.setSession({
              access_token: sessionToSet.access_token,
              refresh_token: sessionToSet.refresh_token
            });
          }
          
          setSupabaseClient(newClient);
                  // Initial unified parallel bootstrapping of Whitelist, Profile, and Nicknames
          setLoading(true);
          try {
            const [wlRes, pRes, nRes] = await Promise.all([
              // 1. Whitelist Check (resolve immediately if not active)
              !IS_WHITELIST_ACTIVE
                ? Promise.resolve({ data: { email: currentUser.email, added_at: new Date().toISOString() }, error: null })
                : newClient.from('whitelist').select('email, added_at').eq('email', currentUser.email).maybeSingle(),
              
              // 2. Profile Fetch
              newClient
                .from('profiles')
                .select('id, display_name, original_name, email, photo_url, bio, role, notification_settings, custom_theme, use_custom_theme, custom_sounds, created_at, admin_notes, is_blocked, name_locked_until, bio_locked_until')
                .eq('id', currentUser.id)
                .maybeSingle(),
              
              // 3. Nicknames Fetch
              newClient
                .from('nicknames')
                .select('target_id, nickname')
                .eq('user_id', currentUser.id)
            ]);

            // Determine admin role status from fetched profile
            const profileRole = pRes.data?.role;
            const isUserAdmin = profileRole === 'admin' || currentUser.email === 'markohoksen@gmail.com';

            // Whitelist verification
            const wlData = wlRes.data;
            const exists = !!wlData;
            let whitelisted = exists || isUserAdmin;

            if (isUserAdmin && !exists) {
              try {
                await newClient.from('whitelist').insert({
                  email: currentUser.email,
                  added_at: new Date().toISOString(),
                  added_by: 'system'
                });
                whitelisted = true;
              } catch (e) {
                console.warn('Admin whitelist seeding bypassed:', e);
              }
            }

            console.log('Bootstrapped whitelist check result:', { whitelisted, exists, isUserAdmin });
            logAudioEvent('system', whitelisted ? 'success' : 'warning', whitelisted ? 'Whitelist check geslaagd' : 'Niet op de whitelist', currentUser.id, mappedUser.displayName || 'Anoniem');
            setIsWhitelisted(whitelisted);
            secureLocalStorage.setItem('cached_isWhitelisted', JSON.stringify(whitelisted));

            // Populate nicknames dictionary
            if (nRes.data) {
              const nicknameMap = nRes.data.reduce((acc: Record<string, string>, curr: any) => {
                acc[curr.target_id] = curr.nickname;
                return acc;
              }, {});
              setNicknames(nicknameMap);
              localStorage.setItem('cached_nicknames', JSON.stringify(nicknameMap));
            }

            // Populate profile settings
            if (pRes.data) {
              const profileData = pRes.data as UserProfile;
              setProfile(profileData);
              localStorage.setItem('cached_profile', JSON.stringify(profileData));
              setDisplayNameInput(profileData.display_name || mappedUser.displayName || '');
              setPhotoURLInput(profileData.photo_url || mappedUser.photoURL || '');
              setBioInput(profileData.bio || '');
              setBannerURLInput(profileData.banner_url || profileData.custom_theme?.banner_url || '');

              if (profileData.notification_settings) {
                setNotificationSettings(cleanNotificationSettings(profileData.notification_settings));
              }
              if (profileData.custom_sounds) {
                setCustomSounds(profileData.custom_sounds);
              }
              if (profileData.custom_theme) {
                setCustomTheme(prev => ({ ...prev, ...profileData.custom_theme }));
              }
              if (profileData.use_custom_theme !== undefined) {
                setUseCustomTheme(profileData.use_custom_theme);
              }
              hasFetchedProfile.current = true;
            } else if (whitelisted) {
              // Automatically provision profile inline on first login
              const newProfile: UserProfile = {
                id: currentUser.id,
                display_name: mappedUser.displayName || 'Anoniem',
                email: mappedUser.email || '',
                photo_url: mappedUser.photoURL || undefined,
                use_custom_theme: useCustomTheme,
                notification_settings: {
                  enable_sounds: notificationSettings.enable_sounds,
                  notify_new_posts: notificationSettings.notify_new_posts,
                  notify_new_messages: notificationSettings.notify_new_messages,
                  notify_mentions: notificationSettings.notify_mentions,
                  message_sound: notificationSettings.message_sound,
                  post_sound: notificationSettings.post_sound,
                  ringtone_url: notificationSettings.ringtone_url,
                  discord_webhook_url: notificationSettings.discord_webhook_url,
                  discord_notify_general: notificationSettings.discord_notify_general,
                  discord_notify_dm: notificationSettings.discord_notify_dm
                },
                custom_theme: {
                  ...customTheme,
                  agreed_terms_v2: true
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: 'user',
                bio: ''
              };
              const { error: insertError } = await newClient.from('profiles').insert(newProfile);
              if (!insertError) {
                setProfile(newProfile);
                localStorage.setItem('cached_profile', JSON.stringify(newProfile));
                hasFetchedProfile.current = true;
              }
            }
          } catch (err) {
            console.error('Initial bootstrapping error:', err);
          } finally {
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        currentUidRef.current = null;
        setSupabaseFirebaseUid(null);
        telemetryRecordedUidRef.current = null;
        setSupabaseClient(createSupabaseClient(null));
        setProfile(null);
        setIsWhitelisted(null);
        secureLocalStorage.removeItem('cached_profile');
        secureLocalStorage.removeItem('cached_isWhitelisted');
        secureLocalStorage.removeItem('cached_conversations');
        setLoading(false);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.hasAttribute('contenteditable'))
      ) {
        if (e.key === 'Escape') {
          setShowShortcutsModal(false);
        }
        return;
      }

      const isModifierActive = e.altKey || e.ctrlKey || e.metaKey;

      // 1. Alternate numbers 1-7
      let digit: number | null = null;
      if (e.code && e.code.startsWith('Digit')) {
        const d = parseInt(e.code.replace('Digit', ''), 10);
        if (d >= 1 && d <= 7) {
          digit = d;
        }
      } else {
        const parsed = parseInt(e.key, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          digit = parsed;
        }
      }

      if (isModifierActive && digit !== null) {
        const hasAlt = e.altKey;
        const hasCtrl = e.ctrlKey;
        const hasShift = e.shiftKey;
        const hasMeta = e.metaKey; // Command ⌘ key on macOS

        // Match Alt+Digit, Ctrl+Digit, Ctrl+Shift+Digit or Command+Shift+Digit (very safe on Mac)
        const isMatched = 
          (hasAlt && !hasCtrl && !hasMeta) || 
          (hasCtrl && hasShift) ||
          (hasCtrl && !hasShift && !hasAlt && !hasMeta) ||
          (hasMeta && hasShift);

        if (isMatched) {
          e.preventDefault();
          const views: ('chat' | 'forum' | 'messages' | 'news' | 'settings' | 'arcade' | 'audiologs')[] = [
            'chat',
            'forum',
            'messages',
            'news',
            'settings',
            'arcade',
            'audiologs'
          ];
          const selectedView = views[digit - 1];
          if (selectedView) {
            setView(selectedView);
            const labels: Record<string, string> = {
              chat: 'Algemene Chat',
              forum: 'Forum',
              messages: 'Berichten/Inbox',
              news: 'Laatste Nieuws',
              settings: 'Instellingen',
              arcade: 'Arcade',
              audiologs: 'Audio Logs'
            };
            toast.success(`${t("Weergave gewijzigd naar: ")}${t(labels[selectedView])}`);
            return;
          }
        }
      }

      // 2. Mnemonic single letters
      if (isModifierActive) {
        let keyChar = '';
        if (e.code && e.code.startsWith('Key')) {
          keyChar = e.code.replace('Key', '').toLowerCase();
        } else if (e.key && e.key.length === 1) {
          keyChar = e.key.toLowerCase();
        }

        if (keyChar) {
          const hasAlt = e.altKey;
          const hasCtrl = e.ctrlKey;
          const hasShift = e.shiftKey;
          const hasMeta = e.metaKey;

          // Support:
          // - Alt/Option + Letter
          // - Cmd + Shift + Letter (very natural/safe on Mac)
          // - Ctrl + Shift + Letter (Windows)
          const isLetterModifierMatched = 
            (hasAlt && !hasCtrl && !hasMeta) ||
            (hasMeta && hasShift) ||
            (hasCtrl && hasShift);

          if (isLetterModifierMatched) {
            let targetView: 'chat' | 'forum' | 'messages' | 'news' | 'settings' | 'arcade' | 'audiologs' | null = null;
            if (keyChar === 'c') targetView = 'chat';
            else if (keyChar === 'f') targetView = 'forum';
            else if (keyChar === 'm') targetView = 'messages';
            else if (keyChar === 'n') targetView = 'news';
            else if (keyChar === 's') targetView = 'settings';
            else if (keyChar === 'a') targetView = 'arcade';
            else if (keyChar === 'l') targetView = 'audiologs';
            else if (keyChar === 'h' || keyChar === 'k') {
              e.preventDefault();
              setShowShortcutsModal(prev => !prev);
              return;
            }

            if (targetView) {
              e.preventDefault();
              setView(targetView);
              const labels: Record<string, string> = {
                chat: 'Algemene Chat',
                forum: 'Forum',
                messages: 'Berichten/Inbox',
                news: 'Laatste Nieuws',
                settings: 'Instellingen',
                arcade: 'Arcade',
                audiologs: 'Audio Logs'
              };
              toast.success(`${t("Weergave gewijzigd naar: ")}${t(labels[targetView])}`);
              return;
            }
          }
        }
      }

      // 3. Question mark ? for Help trigger
      if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
      
      // 4. Escape key to dismiss shortcuts cheat sheet
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      }, async (payload) => {
        // Fetch full profile securely to prevent incomplete payload or database RLS replication issues
        try {
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, display_name, original_name, email, photo_url, bio, role, notification_settings, custom_theme, use_custom_theme, custom_sounds, created_at, admin_notes, is_blocked, name_locked_until, bio_locked_until')
            .eq('id', user.uid)
            .maybeSingle();

          if (data && !error) {
            const upP = data as UserProfile;
            setProfile(upP);
            localStorage.setItem('cached_profile', JSON.stringify(upP));
            setBioInput(upP.bio || '');
            setDisplayNameInput(upP.display_name || '');
            setPhotoURLInput(upP.photo_url || '');
            setBannerURLInput(upP.banner_url || upP.custom_theme?.banner_url || '');
            
            if (!isSavingThemeRef.current && !(view === 'settings' && settingsTab === 'theme')) {
              if (upP.notification_settings) {
                setNotificationSettings(cleanNotificationSettings(upP.notification_settings));
              }
              if (upP.custom_theme) {
                setCustomTheme(prev => ({ ...prev, ...upP.custom_theme }));
              }
              if (upP.use_custom_theme !== undefined) {
                setUseCustomTheme(upP.use_custom_theme);
              }
            }
          }
        } catch (e) {
          console.error('[RealtimeProfileSync] Failed to fetch full profile:', e);
        }
      })
      .subscribe((status) => {
        console.log(`Profile subscription status for ${user.uid}:`, status);
        logAudioEvent('system', status === 'SUBSCRIBED' ? 'success' : 'warning', `Profiel status: ${status}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.uid, isWhitelisted]);

  // Periodic polling fallback (every 10 seconds) to guarantee sync of warnings and bans
  useEffect(() => {
    if (!user || isWhitelisted === false) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('id, display_name, original_name, email, photo_url, bio, role, notification_settings, custom_theme, use_custom_theme, custom_sounds, created_at, admin_notes, is_blocked, name_locked_until, bio_locked_until')
          .eq('id', user.uid)
          .maybeSingle();
        
        if (data && !error) {
          const upP = data as UserProfile;
          setProfile(upP);
          localStorage.setItem('cached_profile', JSON.stringify(upP));
        }
      } catch (err) {
        console.warn('Periodic safety check sync failed:', err);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid, isWhitelisted]);

  // Telemetrie verzamelen voor moderatie (IP, locatie, apparaat, etc.) - geoptimaliseerd tegen timeouts
  const recordTelemetry = useCallback(async () => {
    if (!user || !supabaseClient || !user.uid) return;

    // Check if telemetry for this user was already recorded in this session
    if (telemetryRecordedUidRef.current === user.uid || telemetryInProgressRef.current) {
      return;
    }

    telemetryInProgressRef.current = true;

    // Voor het account 137903@edu.singelland.nl mag er absoluut geen IP of telemetrie worden geregistreerd
    if (user.email && user.email.toLowerCase() === '137903@edu.singelland.nl') {
      try {
        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('admin_notes, custom_theme')
          .eq('id', user.uid)
          .maybeSingle();

        const hasAdminNotes = !!currentProfile?.admin_notes;
        const cleanTheme = currentProfile?.custom_theme ? { ...(currentProfile.custom_theme as any) } : {};
        const hasTelemetryInTheme = !!cleanTheme.user_telemetry;

        if (hasAdminNotes || hasTelemetryInTheme) {
          if (hasTelemetryInTheme) {
            delete cleanTheme.user_telemetry;
          }
          await supabaseClient
            .from('profiles')
            .update({ admin_notes: null, custom_theme: cleanTheme })
            .eq('id', user.uid);

          setProfile(prev => prev ? { ...prev, admin_notes: null, custom_theme: cleanTheme } : null);
          setCustomTheme(cleanTheme);
        }
      } catch (err) {
        console.warn('Opschonen van telemetrie voor specifiek account overgeslagen:', err);
      } finally {
        telemetryRecordedUidRef.current = user.uid;
        telemetryInProgressRef.current = false;
      }
      return;
    }

    try {
      // Delay slightly to prevent contention with initial parallel auth/whitelist bootstrapping
      await new Promise(r => setTimeout(r, 1500));
      if (!user?.uid) return;

      const ip = 'Geanonimiseerd';
      const location = 'Laan van de Privacy';
      const org = 'FTJM Privacy Shield';

      // Haal enkel admin_notes op om de data-overdracht minimaal te houden
      const { data: currentProfile, error: fetchErr } = await supabaseClient
        .from('profiles')
        .select('admin_notes')
        .eq('id', user.uid)
        .maybeSingle();

      if (fetchErr) {
        if (fetchErr.code === '57014' || fetchErr.message?.includes('timeout')) {
          console.warn('Telemetrie ophalen overgeslagen wegens database timeout (57014)');
          return;
        }
      }

      const oldAdminNotes = currentProfile?.admin_notes;
      const adminNotesObj = parseAdminNotes(oldAdminNotes);
      let existingLogs: any[] = adminNotesObj.telemetry || [];

      let updatedLogs = [...existingLogs];
      const existingLogIndex = existingLogs.findIndex(log => log && log.ip === ip);
      const currentTimestamp = new Date().toISOString();

      if (existingLogIndex === -1) {
        const newLogEntry = {
          ip,
          location,
          org,
          device: navigator.userAgent,
          mac_address: rateLimiter.getDeviceFingerprint(),
          timestamp: currentTimestamp
        };
        updatedLogs = [newLogEntry, ...existingLogs];
      } else {
        const existingLog = existingLogs[existingLogIndex];
        const updatedLogEntry = {
          ...existingLog,
          device: navigator.userAgent,
          mac_address: rateLimiter.getDeviceFingerprint(),
          timestamp: currentTimestamp,
          location: location,
          org: org || existingLog.org
        };
        updatedLogs.splice(existingLogIndex, 1);
        updatedLogs.unshift(updatedLogEntry);
      }

      // Beperk tot max 5 recente sessies voor minimale payload
      if (updatedLogs.length > 5) {
        updatedLogs = updatedLogs.slice(0, 5);
      }

      const structuredAdminNotes = {
        telemetry: updatedLogs,
        warnings: adminNotesObj.warnings || [],
        banned_until: adminNotesObj.banned_until || null,
        ban_reason: adminNotesObj.ban_reason || null
      };

      const telemetryString = JSON.stringify(structuredAdminNotes);

      // Schrijf uitsluitend naar admin_notes kolom (snel & zonder zware custom_theme payload)
      const { error: directError } = await supabaseClient
        .from('profiles')
        .update({ 
          admin_notes: telemetryString
        })
        .eq('id', user.uid);

      if (directError) {
        if (directError.code === '57014' || directError.message?.includes('timeout')) {
          console.warn('Telemetrie opslaan overgeslagen wegens database timeout (57014)');
        } else {
          console.warn('Directe admin_notes update niet gelukt, fallback...', directError.message);
        }
      } else {
        setProfile(prev => prev ? { 
          ...prev, 
          admin_notes: telemetryString
        } : null);
      }

      telemetryRecordedUidRef.current = user.uid;
    } catch (err: any) {
      if (err?.code === '57014' || err?.message?.includes('timeout')) {
        console.warn('Telemetrie registratie overgeslagen wegens database timeout (57014)');
      } else {
        console.warn('Niet-kritieke waarschuwing bij telemetrie:', err?.message || err);
      }
    } finally {
      telemetryInProgressRef.current = false;
    }
  }, [user?.uid, supabaseClient]);

  useEffect(() => {
    recordTelemetry();
  }, [recordTelemetry]);

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

    // Initial fetch if in admin view or not yet fetched
    if (isAdmin && user && (view === 'settings' && (settingsTab === 'admin' || settingsTab === 'profile'))) {
      const fetchAdminData = async () => {
        console.log('Admin: Fetching data (Explicit trigger)...');
        try {
          const fetchProfilesWithFallback = async () => {
            try {
              const res = await supabaseClient
                .from('profiles')
                .select('id, display_name, photo_url, email, created_at, is_blocked, admin_notes, custom_theme, name_locked_until, bio_locked_until')
                .limit(200);
              if (!res.error && res.data) return res;
              console.warn('Ophalen met admin_notes mislukt, proberen zonder...', res.error);
              return await supabaseClient
                .from('profiles')
                .select('id, display_name, photo_url, email, created_at, is_blocked, custom_theme, name_locked_until, bio_locked_until')
                .limit(200);
            } catch (e) {
              console.warn('Mislukt met custom_theme, proberen basisvelden...', e);
              return await supabaseClient
                .from('profiles')
                .select('id, display_name, photo_url, email, created_at, is_blocked, name_locked_until, bio_locked_until')
                .limit(200);
            }
          };

          const [wRes, uRes, rRes] = await Promise.all([
            supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }).limit(100),
            fetchProfilesWithFallback(),
            supabaseClient.from('reports').select('*').order('created_at', { ascending: false })
          ]);
          
          if (wRes.error) {
            console.error('Admin: Error fetching whitelist:', wRes.error);
            toast.error('Fout bij ophalen whitelist');
          }
          if (uRes.error) {
            console.error('Admin: Error fetching users:', uRes.error);
          }
          if (rRes.error) {
            console.error('Admin: Error fetching reports:', rRes.error);
          }

          if (wRes.data) {
            setWhitelist(wRes.data);
            localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
          }
          if (uRes.data) {
            const sorted = [...uRes.data].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
            setUsers(sorted);
          }
          if (rRes.data) {
            setReports(rRes.data.filter((r: any) => r.status !== 'deleted'));
          }
          hasFetchedAdminData.current = true;
        } catch (err) {
          console.error('Admin: Unexpected error fetching data:', err);
        }
      };
      fetchAdminData();
    } else if (isAdmin && user && !hasFetchedAdminData.current) {
      // Background fetch if admin but not in view yet
      const fetchAdminData = async () => {
        try {
          const [wRes] = await Promise.all([
            supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }).limit(100)
          ]);
          if (wRes.data) {
            setWhitelist(wRes.data);
            localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
          }
          hasFetchedAdminData.current = true;
        } catch (e) {
          console.error('Background admin fetch failed', e);
        }
      };
      fetchAdminData();
    }

    return () => {
      supabaseClient.removeChannel(whitelistChannel);
    };
  }, [isAdmin, user?.uid, view, settingsTab]);

  const fetchAdminData = async () => {
    if (!isAdmin || !user) return;
    console.log('Admin: Fetching data...');
    try {
      const fetchProfilesWithFallback = async () => {
        try {
          const res = await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url, email, created_at, is_blocked, admin_notes, custom_theme, name_locked_until, bio_locked_until')
            .limit(200);
          if (!res.error && res.data) return res;
          console.warn('Ophalen met admin_notes mislukt, proberen zonder...', res.error);
          return await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url, email, created_at, is_blocked, custom_theme, name_locked_until, bio_locked_until')
            .limit(200);
        } catch (e) {
          console.warn('Mislukt met custom_theme, proberen basisvelden...', e);
          return await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url, email, created_at, is_blocked, name_locked_until, bio_locked_until')
            .limit(200);
        }
      };

      const [wRes, uRes, rRes] = await Promise.all([
        supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }).limit(100),
        fetchProfilesWithFallback(),
        supabaseClient.from('reports').select('*').order('created_at', { ascending: false })
      ]);
      
      if (wRes.error) console.error('Admin: Error fetching whitelist:', wRes.error);
      if (uRes.error) console.error('Admin: Error fetching users:', uRes.error);
      if (rRes.error) console.error('Admin: Error fetching reports:', rRes.error);

      if (wRes.data) {
        setWhitelist(wRes.data);
        localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
      }
      let fetchedUsers = uRes.data ? [...uRes.data] : [];

      if (rRes.data) {
        setReports(rRes.data.filter((r: any) => r.status !== 'deleted'));
        
        // Fetch missing users for reports so they don't show as "Onbekend"
        const missingIds = new Set<string>();
        rRes.data.forEach((r: any) => {
          if (r.reporter_id && !fetchedUsers.find(u => u.id === r.reporter_id)) missingIds.add(r.reporter_id);
          if (r.reported_id && !fetchedUsers.find(u => u.id === r.reported_id)) missingIds.add(r.reported_id);
        });

        if (missingIds.size > 0) {
          const { data: missingUsers } = await supabaseClient
            .from('profiles')
            .select('id, display_name, photo_url, email, created_at, is_blocked, custom_theme, name_locked_until, bio_locked_until')
            .in('id', Array.from(missingIds));
          if (missingUsers) {
            fetchedUsers = [...fetchedUsers, ...missingUsers];
          }
        }
      }

      if (fetchedUsers.length > 0) {
        const sorted = fetchedUsers.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        setUsers(sorted);
      }

      hasFetchedAdminData.current = true;
    } catch (err) {
      console.error('Admin: Unexpected error fetching data:', err);
    }
  };

  const handleSetNickname = async (targetId: string, nickname: string) => {
    if (!user) return;

    try {
      console.log('Saving nickname:', { targetId, nickname, userId: user.uid });
      if (!nickname.trim()) {
        // Delete nickname
        const { error } = await supabaseClient
          .from('nicknames')
          .delete()
          .eq('user_id', user.uid)
          .eq('target_id', targetId);

        if (error) throw error;

        setNicknames(prev => {
          const next = { ...prev };
          delete next[targetId];
          localStorage.setItem('cached_nicknames', JSON.stringify(next));
          return next;
        });
        toast.success('Bijnaam verwijderd');
      } else {
        // Upsert nickname
        const { error } = await supabaseClient
          .from('nicknames')
          .upsert({
            user_id: user.uid,
            target_id: targetId,
            nickname: nickname.trim()
          }, { onConflict: 'user_id,target_id' });

        if (error) throw error;

        setNicknames(prev => {
          const next = { ...prev, [targetId]: nickname.trim() };
          localStorage.setItem('cached_nicknames', JSON.stringify(next));
          return next;
        });
        toast.success('Bijnaam opgeslagen');
      }
    } catch (err) {
      handleSupabaseError(err, 'bijnaam opslaan', user, isAdmin);
    }
  };

  // Website status and Scheduled Maintenance
  useEffect(() => {
    if (hasFetchedStatus.current) return;
    
    const fetchStatusAndMaintenance = async () => {
      // 1. Fetch Website Status
      const { data: statusRes } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'websiteStatus')
        .maybeSingle();
        
      if (statusRes) {
        const status = statusRes.value?.status || 'Online';
        setWebsiteStatus(status);
        setStatusInput(status);
        localStorage.setItem('cached_websiteStatus', status);
      }

      // 2. Fetch Scheduled Maintenance
      const { data: maintRes } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'scheduledMaintenance')
        .maybeSingle();

      if (maintRes && maintRes.value) {
        setScheduledMaintenance({
          isActive: !!maintRes.value.isActive,
          targetTime: maintRes.value.targetTime || '',
        });
      }

      hasFetchedStatus.current = true;
    };
    
    fetchStatusAndMaintenance();

    // 3. Register real-time changes channel
    const channel = supabaseClient
      .channel('settings_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'settings'
      }, (payload) => {
        const key = (payload.new as any)?.key || (payload.old as any)?.key;
        const val = (payload.new as any)?.value;
        if (key === 'websiteStatus' && val) {
          setWebsiteStatus(val.status || 'Online');
          setStatusInput(val.status || 'Online');
        } else if (key === 'scheduledMaintenance') {
          if (val) {
            setScheduledMaintenance({
              isActive: !!val.isActive,
              targetTime: val.targetTime || '',
            });
          } else {
            setScheduledMaintenance({ isActive: false, targetTime: '' });
          }
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Countdown and play sounds for gepland onderhoud
  useEffect(() => {
    if (!scheduledMaintenance.isActive || !scheduledMaintenance.targetTime) {
      setMaintenanceTimeLeft(null);
      playedMaintenanceTriggersRef.current.clear();
      return;
    }

    const targetMs = new Date(scheduledMaintenance.targetTime).getTime();
    playedMaintenanceTriggersRef.current.clear();

    const checkTime = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((targetMs - now) / 1000));
      setMaintenanceTimeLeft(diffSecs);

      // Play matching sound triggers
      if (diffSecs <= 300 && diffSecs > 240 && !playedMaintenanceTriggersRef.current.has('5m')) {
        playedMaintenanceTriggersRef.current.add('5m');
        playSound(
          '/audio/maintenance/maintenance_5m.m4a',
          true,
          user?.uid,
          profile?.display_name || user?.displayName || 'Anoniem'
        );
        toast.warning('Gepland Onderhoud: Nog 5 minuten tot aanvang!', { duration: 10000 });
      } else if (diffSecs <= 240 && diffSecs > 180 && !playedMaintenanceTriggersRef.current.has('4m')) {
        playedMaintenanceTriggersRef.current.add('4m');
        playSound(
          '/audio/maintenance/maintenance_4m.m4a',
          true,
          user?.uid,
          profile?.display_name || user?.displayName || 'Anoniem'
        );
        toast.warning('Gepland Onderhoud: Nog 4 minuten tot aanvang!', { duration: 10000 });
      } else if (diffSecs <= 180 && diffSecs > 120 && !playedMaintenanceTriggersRef.current.has('3m')) {
        playedMaintenanceTriggersRef.current.add('3m');
        playSound(
          '/audio/maintenance/maintenance_3m.m4a',
          true,
          user?.uid,
          profile?.display_name || user?.displayName || 'Anoniem'
        );
        toast.warning('Gepland Onderhoud: Nog 3 minuten tot aanvang!', { duration: 10000 });
      } else if (diffSecs <= 120 && diffSecs > 60 && !playedMaintenanceTriggersRef.current.has('2m')) {
        playedMaintenanceTriggersRef.current.add('2m');
        playSound(
          '/audio/maintenance/maintenance_2m.m4a',
          true,
          user?.uid,
          profile?.display_name || user?.displayName || 'Anoniem'
        );
        toast.warning('Gepland Onderhoud: Nog 2 minuten tot aanvang!', { duration: 10000 });
      } else if (diffSecs <= 60 && diffSecs > 0 && !playedMaintenanceTriggersRef.current.has('1m')) {
        playedMaintenanceTriggersRef.current.add('1m');
        playSound(
          '/audio/maintenance/maintenance_1m.m4a',
          true,
          user?.uid,
          profile?.display_name || user?.displayName || 'Anoniem'
        );
        toast.error('Gepland Onderhoud: Nog 1 minuut tot aanvang! Sla direct je werk op.', { duration: 10000 });
      } else if (diffSecs === 0) {
        if (!playedMaintenanceTriggersRef.current.has('0m')) {
          playedMaintenanceTriggersRef.current.add('0m');
          toast.error('Onderhoud is nu begonnen! Het forum wordt herstart.', { duration: 5000 });
          if (isAdmin) {
            supabaseClient
              .from('settings')
              .upsert({ key: 'websiteStatus', value: { status: 'Onderhoud' } })
              .then(({ error }) => {
                if (!error) {
                  setWebsiteStatus('Onderhoud');
                }
              });
          }
          setScheduledMaintenance(prev => ({ ...prev, isActive: false }));
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [scheduledMaintenance.isActive, scheduledMaintenance.targetTime, isAdmin, user?.uid, profile]);

  const handleScheduleMaintenance = async (target: number | Date) => {
    if (!isAdmin) return;
    try {
      let targetTimeISO = '';
      if (typeof target === 'number') {
        const time = new Date(Date.now() + target * 60 * 1000);
        targetTimeISO = time.toISOString();
      } else if (target instanceof Date) {
        targetTimeISO = target.toISOString();
      } else {
        return;
      }

      const { error } = await supabaseClient
        .from('settings')
        .upsert({ 
          key: 'scheduledMaintenance', 
          value: { isActive: true, targetTime: targetTimeISO } 
        });

      if (error) throw error;
      setScheduledMaintenance({ isActive: true, targetTime: targetTimeISO });
      toast.success('Onderhoud succesvol ingepland!');
    } catch (err) {
      handleSupabaseError(err, 'onderhoud inplannen', user, isAdmin);
    }
  };

  const handleCancelMaintenance = async () => {
    if (!isAdmin) return;
    try {
      const { error } = await supabaseClient
        .from('settings')
        .upsert({ 
          key: 'scheduledMaintenance', 
          value: { isActive: false, targetTime: '' } 
        });

      if (error) throw error;
      setScheduledMaintenance({ isActive: false, targetTime: '' });
      toast.success('Gepland onderhoud geannuleerd!');
    } catch (err) {
      handleSupabaseError(err, 'onderhoud annuleren', user, isAdmin);
    }
  };

  // Real-time conversations sync
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const channel = supabaseClient
      .channel(`conversations:${user.uid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedConvRaw = payload.new as Conversation;
          const updatedConv = { ...updatedConvRaw, last_message: decryptGeneralChat(updatedConvRaw.last_message || '') };
          
          // Efficient filtering
          if (updatedConv.participants && !updatedConv.participants.includes(user.uid)) return;

          setConversations(prev => {
            const index = prev.findIndex(c => c.id === updatedConv.id);
            let nextConvs;
            
            if (index !== -1) {
              // Update existing
              const updated = { ...prev[index], ...updatedConv };
              // If it's already at the top and timestamps match, don't do anything
              if (index === 0 && prev[0].updated_at === updated.updated_at) return prev;
              
              nextConvs = [...prev];
              nextConvs[index] = updated;
            } else {
              // Add new
              nextConvs = [updatedConv, ...prev];
            }
            
            // Notification logic
            if (updatedConv.updated_at > (lastConversationUpdates.current[updatedConv.id] || '') && 
                updatedConv.last_message_sender_id !== user.uid && 
                new Date(updatedConv.updated_at).getTime() > new Date(initialLoadTime.current).getTime()) {
              
              let senderName = 'Iemand';
              if (updatedConv.is_group) {
                const profileObj = usersRef.current.find(u => u.id === updatedConv.last_message_sender_id);
                const authorName = profileObj?.display_name || (updatedConv.last_message_sender_id ? updatedConv.participant_names[updatedConv.last_message_sender_id] : null);
                senderName = authorName ? `${authorName} in ${updatedConv.name || 'Groep'}` : (updatedConv.name || 'Groep');
              } else {
                const otherParticipantUid = updatedConv.participants.find((uid: string) => uid !== user.uid);
                const profileObj = otherParticipantUid ? usersRef.current.find(u => u.id === otherParticipantUid) : null;
                senderName = profileObj?.display_name || (otherParticipantUid ? updatedConv.participant_names[otherParticipantUid] : 'Iemand');
              }
              
              sendDiscordNotification('dm', senderName, updatedConv.last_message || '');
              
              if (notificationSettingsRef.current.notify_new_messages && (activeConversationRef.current?.id !== updatedConv.id || viewRef.current !== 'messages')) {
                toast.success(updatedConv.is_group ? `Groepsbericht` : `Nieuw bericht van ${senderName}`, {
                  description: updatedConv.is_group ? `${senderName}: ${updatedConv.last_message?.substring(0, 40)}...` : updatedConv.last_message?.substring(0, 50) + (updatedConv.last_message && updatedConv.last_message.length > 50 ? '...' : ''),
                  action: {
                    label: 'Beantwoorden',
                    onClick: () => {
                      handleSetActiveConversation(updatedConv);
                      setView('messages');
                    }
                  }
                });
                playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
              }
            }
            lastConversationUpdates.current[updatedConv.id] = updatedConv.updated_at;
            
            // Re-sort only if necessary (usually the updated one should be at the top)
            const sorted = [...nextConvs].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
            
            // Debounced save to localStorage
            if (saveConversationsTimeoutRef.current) clearTimeout(saveConversationsTimeoutRef.current);
            saveConversationsTimeoutRef.current = setTimeout(() => {
              localStorage.setItem('cached_conversations', JSON.stringify(sorted));
            }, 2000);
            
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
        const updateRaw = payload.payload;
        const update = { ...updateRaw, last_message: decryptGeneralChat(updateRaw.last_message || '') };
        setConversations(prev => {
          const newConvs = prev.map(c => c.id === update.id ? { ...c, ...update } : c);
          return newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        });
      })
      .on('broadcast', { event: 'new_conversation' }, (payload) => {
        console.log('Broadcast new conversation received:', payload);
        const newConvRaw = payload.payload as Conversation;
        const newConv = { ...newConvRaw, last_message: decryptGeneralChat(newConvRaw.last_message || '') };
        setConversations(prev => {
          if (prev.some(c => c.id === newConv.id)) return prev;
          const newConvs = [newConv, ...prev];
          return newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        });
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('Broadcast new message (on conversations channel) received:', payload);
        const msgRaw = payload.payload as DirectMessage;
        const decryptedText = decryptGeneralChat(msgRaw.text);
        const processedMsg = { ...msgRaw, text: decryptedText };

        // Update messages if this conversation is active
        if (activeConversationRef.current?.id === processedMsg.conversation_id) {
          setMessages(prev => {
            if (prev.some(m => m.id === processedMsg.id)) return prev;
            return [processedMsg, ...prev];
          });
        }

        // Update conversations preview
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === processedMsg.conversation_id);
          if (index === -1) return prev;
          const next = [...prev];
          next[index] = {
            ...next[index],
            last_message: decryptedText,
            last_message_sender_id: processedMsg.sender_id,
            updated_at: processedMsg.created_at
          };
          return next.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
        });

        // Trigger notification check
        if (processedMsg.sender_id !== user.uid && 
            (activeConversationRef.current?.id !== processedMsg.conversation_id || viewRef.current !== 'messages')) {
          if (notificationSettingsRef.current.notify_new_messages) {
            playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
          }
        }
      })
      .on('broadcast', { event: 'update_message' }, (payload) => {
        console.log('Broadcast update message (on conversations channel) received:', payload);
        const updateRaw = payload.payload;
        const decryptedText = decryptGeneralChat(updateRaw.text);
        const update = { ...updateRaw, text: decryptedText };

        // Update messages if this conversation is active
        if (activeConversationRef.current?.id === update.conversation_id) {
          setMessages(prev => prev.map(m => m.id === update.id ? { 
            ...m, 
            ...update, 
            text: decryptedText 
          } : m));
        }

        // Update conversations preview if needed
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === update.conversation_id);
          if (index === -1) return prev;
          // Only update if it looks like the last message
          if (prev[index].updated_at <= update.updated_at) {
            const next = [...prev];
            next[index] = {
              ...next[index],
              last_message: decryptedText,
              updated_at: update.updated_at
            };
            return next;
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        console.log('Broadcast delete message (on conversations channel) received:', payload);
        const { id, conversation_id } = payload.payload;

        // Update messages if this conversation is active
        if (activeConversationRef.current?.id === conversation_id) {
          setMessages(prev => prev.filter(m => m.id !== id));
        }
      })
      .subscribe((status) => {
        console.log(`Conversations subscription status for ${user.uid}:`, status);
        if (status === 'SUBSCRIBED') {
          logAudioEvent('system', 'success', `Conversatie verbinding actief`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logAudioEvent('system', 'error', `Conversatie verbinding fout: ${status}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
        }
      });

    conversationsChannelRef.current = channel;

    // Initial fetch if not already done
    if (!hasFetchedConversations.current) {
      const fetchConversations = async () => {
        const { data, error } = await supabaseClient
          .from('conversations')
          .select('id, participants, participant_names, participant_photos, last_message, last_message_sender_id, updated_at')
          .contains('participants', [user.uid]);
        
        if (error) {
          console.error('Error fetching conversations:', error);
          return;
        }

        if (data) {
          // Decrypt last messages if present
          const decryptedData = (data as Conversation[]).map(c => ({
            ...c,
            last_message: decryptGeneralChat(c.last_message || '')
          }));

          // If last_message is missing for some conversations, try to fetch it from messages table
          const conversationsWithLastMessage = await Promise.all(decryptedData.map(async (conv) => {
            if (!conv.last_message) {
              const { data: lastMsg } = await supabaseClient
                .from('messages')
                .select('text, sender_id, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (lastMsg) {
                const decryptedLastMsg = decryptGeneralChat(lastMsg.text);
                return {
                  ...conv,
                  last_message: decryptedLastMsg,
                  last_message_sender_id: lastMsg.sender_id,
                  updated_at: lastMsg.created_at
                };
              }
            }
            return conv;
          }));

          setConversations(conversationsWithLastMessage.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')));
          localStorage.setItem('cached_conversations', JSON.stringify(conversationsWithLastMessage));
          hasFetchedConversations.current = true;
        }
        setLoading(false);
      };
      fetchConversations();
    }

    return () => {
      supabaseClient.removeChannel(channel);
      conversationsChannelRef.current = null;
    };
  }, [user?.uid, isWhitelisted]);

  // Separate effect for fetching conversations when switching to messages view
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'messages') return;
    
    const fetchConversations = async () => {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('id, participants, participant_names, participant_photos, last_message, last_message_sender_id, updated_at, is_group, name, created_by')
        .contains('participants', [user.uid]);
      
      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      const decryptedData = (data || []).map(c => ({
        ...c,
        last_message: decryptGeneralChat(c.last_message || '')
      }));

      const conversationsWithLastMsg = await Promise.all(decryptedData.map(async (conv) => {
        const { data: lastMsg } = await supabaseClient
          .from('messages')
          .select('text, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle to avoid error if no messages
        
        if (lastMsg) {
          const decryptedLastMsg = decryptGeneralChat(lastMsg.text);
          return {
            ...conv,
            last_message: decryptedLastMsg,
            last_message_sender_id: lastMsg.sender_id,
            updated_at: lastMsg.created_at
          };
        }
        return conv;
      }));

      const sorted = conversationsWithLastMsg.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
      setConversations(sorted);
      hasFetchedConversations.current = true;
    };
    
    fetchConversations();
  }, [user?.uid, isWhitelisted, view]);

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
          const msgRaw = payload.new as DirectMessage;
          
          const handleIncoming = async () => {
            const decryptedText = decryptGeneralChat(msgRaw.text);
            const processedMsg = { ...msgRaw, text: decryptedText };

            // Update conversations list preview
            setConversations(prev => {
              const index = prev.findIndex(c => c.id === processedMsg.conversation_id);
              if (index === -1) return prev;
              const currentConv = prev[index];
              
              const next = [...prev];
              next[index] = {
                ...currentConv,
                last_message: decryptedText,
                last_message_sender_id: processedMsg.sender_id,
                updated_at: processedMsg.created_at
              };
              return next.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
            });

            logAudioEvent('system', 'success', `Nieuw bericht ontvangen van ${processedMsg.sender_id === user.uid ? 'jou' : 'andere gebruiker'}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
            
            if (processedMsg.sender_id !== user.uid) {
              playSound(notificationSettingsRef.current.message_sound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
            }
            
            setMessages(prev => {
              const exists = prev.find(m => m.id === processedMsg.id);
              if (exists) {
                return prev;
              }
              return [processedMsg, ...prev];
            });
          };

          handleIncoming();
        } else if (payload.eventType === 'UPDATE') {
          const updatedRaw = payload.new as DirectMessage;
          const updated = { ...updatedRaw, text: decryptGeneralChat(updatedRaw.text) };
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          }
        }
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('Broadcast message received:', payload);
        const msgRaw = payload.payload as DirectMessage;
        
        const handleNewBroadcast = async () => {
          const decryptedText = decryptGeneralChat(msgRaw.text);
          const processedMsg = { ...msgRaw, text: decryptedText };

          // Update conversations list preview
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === processedMsg.conversation_id);
            if (index === -1) return prev;
            const currentConv = prev[index];
            
            const next = [...prev];
            next[index] = {
              ...currentConv,
              last_message: decryptedText,
              last_message_sender_id: processedMsg.sender_id,
              updated_at: processedMsg.created_at
            };
            return next.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
          });

          setMessages(prev => {
            if (prev.some(m => m.id === processedMsg.id)) return prev;
            return [processedMsg, ...prev];
          });
        };
        handleNewBroadcast();
      })
      .on('broadcast', { event: 'update_message' }, (payload) => {
        console.log('Broadcast update message received:', payload);
        const updateRaw = payload.payload;
        
        const handleUpdateBroadcast = async () => {
          const decryptedText = decryptGeneralChat(updateRaw.text);
          const update = { ...updateRaw, text: decryptedText };

          setMessages(prev => prev.map(m => m.id === update.id ? { 
            ...m, 
            ...update, 
            text: decryptedText 
          } : m));
        };
        handleUpdateBroadcast();
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        console.log('Broadcast delete message received:', payload);
        const { id } = payload.payload;
        setMessages(prev => prev.filter(m => m.id !== id));
      })
      .subscribe((status) => {
        console.log(`Messages subscription status for ${activeConversation.id}:`, status);
        logAudioEvent('system', status === 'SUBSCRIBED' ? 'success' : 'warning', `Berichten status: ${status}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      });

    messageChannelRef.current = channel;

    // Initial fetch
    const fetchMessages = async () => {
      setLoadingMoreMessages(true);
      const { data } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(messagesLimit);
      
      if (data) {
        // Decrypt messages
        const decryptedMessages = (data as DirectMessage[]).map(m => ({
          ...m,
          text: decryptGeneralChat(m.text)
        }));
        // Don't reverse - we want newest first at index 0 for flex-col-reverse
        setMessages(decryptedMessages);
        setHasMoreMessages(data.length === messagesLimit);
      }
      setLoadingMoreMessages(false);
    };
    fetchMessages();

    return () => {
      supabaseClient.removeChannel(channel);
      messageChannelRef.current = null;
    };
  }, [user?.uid, activeConversation?.id]);

  const [isTypingSubscribed, setIsTypingSubscribed] = useState(false);

  // Real-time typing indicators sync via Broadcast
  useEffect(() => {
    if (!user || !supabaseClient) {
      setTypingUsers({});
      setIsTypingSubscribed(false);
      return;
    }

    const channel = supabaseClient.channel('typing_broadcast');
    typingChannelRef.current = channel;
    
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name, conversation_id } = payload.payload;
        if (user_id === user.uid) return;

        setTypingUsers(prev => {
          const next = { ...prev };
          next[conversation_id] = {
            ...(next[conversation_id] || {}),
            [user_id]: {
              name: user_name,
              lastSeen: Date.now()
            }
          };
          return next;
        });
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const { user_id, conversation_id } = payload.payload;
        if (user_id === user.uid) return;

        setTypingUsers(prev => {
          if (!prev[conversation_id] || !prev[conversation_id][user_id]) return prev;
          const next = { ...prev };
          const users = { ...next[conversation_id] };
          delete users[user_id];
          if (Object.keys(users).length === 0) {
            delete next[conversation_id];
          } else {
            next[conversation_id] = users;
          }
          return next;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsTypingSubscribed(true);
        } else {
          setIsTypingSubscribed(false);
        }
      });

    // Cleanup interval to remove stale typing statuses
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        let changed = false;
        const next = { ...prev };
        const convIds = Object.keys(next);
        
        if (convIds.length === 0) return prev;

        convIds.forEach(convId => {
          const users = { ...next[convId] };
          let usersChanged = false;
          const uids = Object.keys(users);
          
          uids.forEach(uid => {
            if (now - users[uid].lastSeen > 5000) {
              delete users[uid];
              usersChanged = true;
              changed = true;
            }
          });
          
          if (usersChanged) {
            if (Object.keys(users).length === 0) {
              delete next[convId];
            } else {
              next[convId] = users;
            }
          }
        });
        
        return changed ? next : prev;
      });
    }, 3000); // Increased interval to 3s to reduce CPU load

    return () => {
      supabaseClient.removeChannel(channel);
      typingChannelRef.current = null;
      setIsTypingSubscribed(false);
      clearInterval(interval);
    };
  }, [user?.uid]);

  // Track typing status via Broadcast
  useEffect(() => {
    if (!user || !isTyping || !typingInId || !typingChannelRef.current || !isTypingSubscribed) return;

    const sendTypingBroadcast = () => {
      if (typingChannelRef.current && isTypingSubscribed) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.uid,
            user_name: profile?.display_name || user.displayName || 'Iemand',
            conversation_id: typingInId
          }
        });
      }
    };

    // Send immediately
    sendTypingBroadcast();

    // Send periodically while typing
    const interval = setInterval(sendTypingBroadcast, 2000);

    return () => {
      clearInterval(interval);
      if (typingChannelRef.current && isTypingSubscribed) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: {
            user_id: user.uid,
            conversation_id: typingInId
          }
        });
      }
    };
  }, [isTyping, typingInId, user, profile, isTypingSubscribed]);

  // Fetch profiles for participants and message senders dynamically across all conversations/messages/posts/forum
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const fetchParticipantProfiles = async () => {
      const participantIds = new Set<string>();

      // Collect participants from conversations
      conversations.forEach(c => {
        if (c.participants && Array.isArray(c.participants)) {
          c.participants.forEach(p => {
            if (p && p !== user.uid) participantIds.add(p);
          });
        }
        if (c.last_message_sender_id && c.last_message_sender_id !== user.uid) {
          participantIds.add(c.last_message_sender_id);
        }
      });

      // Collect senders from currently loaded messages
      messages.forEach(m => {
        if (m.sender_id && m.sender_id !== user.uid) {
          participantIds.add(m.sender_id);
        }
      });

      // Collect authors from general chat posts
      posts.forEach(p => {
        if (p.author_id && p.author_id !== user.uid) {
          participantIds.add(p.author_id);
        }
      });

      // Collect authors from forum threads
      threads.forEach(t => {
        if (t.author_id && t.author_id !== user.uid) {
          participantIds.add(t.author_id);
        }
      });

      // Collect authors from forum comments
      threadComments.forEach(c => {
        if (c.author_id && c.author_id !== user.uid) {
          participantIds.add(c.author_id);
        }
      });
      
      if (participantIds.size === 0) return;

      // Filter in-memory missing ones to avoid duplicate API calls
      const missingIds = Array.from(participantIds).filter(id => !users.some(u => u.id === id));
      if (missingIds.length === 0) return;

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at, is_blocked')
        .in('id', missingIds);
        
      if (error) {
        console.error('Error fetching participant profiles:', error);
        return;
      }

      if (data && data.length > 0) {
        setUsers(prev => {
          const next = [...prev];
          data.forEach(profile => {
            const idx = next.findIndex(u => u.id === profile.id);
            if (idx === -1) {
              next.push(profile);
            } else {
              // Refresh existing profile with newer data if it was different
              next[idx] = { ...next[idx], ...profile };
            }
          });
          return next.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        });
      }
    };
    
    // Use a small debounce to batch any rapid updates
    const timer = setTimeout(() => {
      fetchParticipantProfiles();
    }, 150);

    return () => clearTimeout(timer);
  }, [user?.uid, isWhitelisted, conversations, messages, posts, threads, threadComments, users.length]);

  // Fetch users for search only when searching or needed
  useEffect(() => {
    if (!user || !isWhitelisted) return;
    if (!showUserSearch && !userSearchQuery) return;

    const fetchUsers = async () => {
      const query = supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at, is_blocked')
        .neq('id', user.uid)
        .or('is_blocked.is.null,is_blocked.eq.false');
      
      if (userSearchQuery) {
        query.ilike('display_name', `%${userSearchQuery}%`);
      }
      
      const { data } = await query.limit(50);
      if (data) {
        const unblockedData = data.filter(u => !u.is_blocked);
        setUsers(prev => {
          const map = new Map<string, UserProfile>();
          prev.forEach(u => map.set(u.id, u));
          unblockedData.forEach(u => {
            const existing = map.get(u.id);
            map.set(u.id, existing ? { ...existing, ...u } : u);
          });
          return Array.from(map.values()).sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        });
      }
    };
    
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [user?.uid, isWhitelisted, showUserSearch, userSearchQuery]);

  // Mark notifications as read when opening a conversation
  useEffect(() => {
    if (activeConversation && user && view === 'messages') {
      const unreadMessageNotifs = notifications.filter(n => n.type === 'dm' && n.resource_id === activeConversation.id && !n.is_read);
      if (unreadMessageNotifs.length > 0) {
        const markAsRead = async () => {
          const ids = unreadMessageNotifs.map(n => n.id);
          const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .in('id', ids);
          
          if (!error) {
            setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
          }
        };
        markAsRead();
      }
    }
  }, [activeConversation?.id, view, user?.uid, notifications.length]);

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
        if (payload.eventType === 'INSERT') {
          const rawPost = payload.new as Post;
          const latestPost = { ...rawPost, content: decryptGeneralChat(rawPost.content) };
          
          // Skip if we already have it
          let alreadyExists = false;
          setPosts(prev => {
            if (prev.some(p => p.id === latestPost.id)) {
              alreadyExists = true;
              return prev;
            }
            
            const newPosts = [latestPost, ...prev].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ).slice(0, 100);
            
            if (savePostsTimeoutRef.current) clearTimeout(savePostsTimeoutRef.current);
            savePostsTimeoutRef.current = setTimeout(() => {
              localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            }, 3000);
            
            return newPosts;
          });

          if (alreadyExists) return;

          if (lastPostId.current && latestPost && latestPost.id !== lastPostId.current && 
              latestPost.author_id !== user.uid && 
              new Date(latestPost.created_at).getTime() > new Date(initialLoadTime.current).getTime()) {
            sendDiscordNotification('general', latestPost.author_name, latestPost.content);
            if (notificationSettingsRef.current.notify_new_posts) {
              toast.info(`Nieuw bericht van ${latestPost.author_name}`, {
                description: latestPost.content.substring(0, 50) + (latestPost.content.length > 50 ? '...' : ''),
                action: {
                  label: 'Bekijken',
                  onClick: () => setView('forum')
                }
              });
              playSound(notificationSettingsRef.current.post_sound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
            }
          }
          if (latestPost) lastPostId.current = latestPost.id;
          
        } else if (payload.eventType === 'UPDATE') {
          const rawUpdated = payload.new as Post;
          const updated = { ...rawUpdated, content: decryptGeneralChat(rawUpdated.content) };
          setPosts(prev => {
            const newPosts = prev.map(p => p.id === updated.id ? updated : p);
            localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            return newPosts;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setPosts(prev => {
              const newPosts = prev.filter(p => p.id !== deletedId);
              localStorage.setItem('cached_posts', JSON.stringify(newPosts));
              return newPosts;
            });
          }
        }
      })
      .on('broadcast', { event: 'new_post' }, (payload) => {
        console.log('Broadcast post received:', payload);
        const latestPostRaw = payload.payload as Post;
        const latestPost = { ...latestPostRaw, content: decryptGeneralChat(latestPostRaw.content) };
        
        if (lastPostId.current && latestPost && latestPost.id !== lastPostId.current && 
            latestPost.author_id !== user.uid && 
            new Date(latestPost.created_at).getTime() > new Date(initialLoadTime.current).getTime()) {
          sendDiscordNotification('general', latestPost.author_name, latestPost.content);
          if (notificationSettingsRef.current.notify_new_posts) {
            toast.info(`Nieuw bericht van ${latestPost.author_name}`, {
              description: latestPost.content.substring(0, 50) + (latestPost.content.length > 50 ? '...' : ''),
              action: {
                label: 'Bekijken',
                onClick: () => setView('forum')
              }
            });
            playSound(notificationSettingsRef.current.post_sound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
          }
        }
        if (latestPost) lastPostId.current = latestPost.id;
        
        setPosts((prev) => {
          if (prev.some(p => p.id === latestPost.id)) return prev;
          const newPosts = [latestPost, ...prev].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, 100);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
      })
      .on('broadcast', { event: 'update_post' }, (payload) => {
        console.log('Broadcast update post received:', payload);
        const updateRaw = payload.payload;
        const update = { ...updateRaw, content: decryptGeneralChat(updateRaw.content) };
        setPosts(prev => {
          const newPosts = prev.map(p => p.id === update.id ? { ...p, ...update } : p);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
      })
      .on('broadcast', { event: 'delete_post' }, (payload) => {
        console.log('Broadcast delete post received:', payload);
        const { id } = payload.payload;
        setPosts(prev => {
          const newPosts = prev.filter(p => p.id !== id);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
      })
      .subscribe((status) => {
        console.log('Posts subscription status:', status);
        logAudioEvent('system', status === 'SUBSCRIBED' ? 'success' : 'warning', `Posts status: ${status}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      });

    postsChannelRef.current = channel;

    // Initial fetch
    const fetchPosts = async () => {
      if (isPostingRef.current || hasFetchedPosts.current) return;
      
      let query = supabaseClient
        .from('posts')
        .select('id, content, author_id, author_name, author_photo, created_at, parent_id')
        .order('created_at', { ascending: false })
        .limit(100);

      const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
      if (!isSystemAdmin && joinDate) {
        query = query.gte('created_at', joinDate);
      }
      
      const { data, error } = await query;
      
      if (data) {
        const decryptedPosts = (data as Post[]).map(p => ({ ...p, content: decryptGeneralChat(p.content) }));
        setPosts(decryptedPosts);
        localStorage.setItem('cached_posts', JSON.stringify(decryptedPosts));
        if (data.length > 0) {
          lastPostId.current = data[0].id;
        }
        hasFetchedPosts.current = true;
      }
    };

    fetchPosts();
    setLoading(false);

    return () => {
      supabaseClient.removeChannel(channel);
      postsChannelRef.current = null;
    };
  }, [user?.uid, isWhitelisted]);

  // Real-time forum threads sync
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const fetchThreads = async () => {
      try {
        let query = supabaseClient
          .from('forum_threads')
          .select('id, author_id, author_name, author_photo, title, content, created_at, updated_at, comment_count')
          .order('updated_at', { ascending: false })
          .limit(50);

        const isSystemAdmin = user?.email?.toLowerCase() === 'markohoksen@gmail.com' || profile?.role === 'admin';
        if (!isSystemAdmin && joinDate) {
          query = query.gte('created_at', joinDate);
        }

        const { data, error } = await query;
        
        if (data) {
          const decryptedThreads = (data as ForumThread[]).map(t => ({ 
            ...t, 
            title: decryptGeneralChat(t.title), 
            content: decryptGeneralChat(t.content) 
          }));
          setThreads(decryptedThreads);
        }
      } catch (err) {
        console.error('Error fetching threads:', err);
      }
    };

    fetchThreads();

    const threadsChannel = supabaseClient
      .channel('forum_threads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_threads' }, (payload) => {
        console.log('Real-time thread change:', payload);
        if (payload.eventType === 'INSERT') {
          const newThreadRaw = payload.new as ForumThread;
          const newThread = { 
            ...newThreadRaw, 
            title: decryptGeneralChat(newThreadRaw.title), 
            content: decryptGeneralChat(newThreadRaw.content) 
          };
          setThreads(prev => {
            if (prev.some(t => t.id === newThread.id)) return prev;
            return [newThread, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedRaw = payload.new as ForumThread;
          const updated = { 
            ...updatedRaw, 
            title: decryptGeneralChat(updatedRaw.title), 
            content: decryptGeneralChat(updatedRaw.content) 
          };
          setThreads(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
          setActiveThread(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setThreads(prev => prev.filter(t => t.id !== deletedId));
            if (activeThread?.id === deletedId) setActiveThread(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(threadsChannel);
    };
  }, [user?.uid, isWhitelisted, activeThread?.id]);

  // Real-time forum comments sync
  useEffect(() => {
    if (!user || !isWhitelisted || !activeThread) return;

    const channel = supabaseClient
      .channel(`forum_comments:${activeThread.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_comments',
        filter: `thread_id=eq.${activeThread.id}`
      }, (payload) => {
        console.log('Real-time comment change:', payload);
        if (payload.eventType === 'INSERT') {
          const newCommentRaw = payload.new as ForumComment;
          const newComment = { ...newCommentRaw, content: decryptGeneralChat(newCommentRaw.content) };
          setThreadComments(prev => {
            if (prev.some(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedRaw = payload.new as ForumComment;
          const updated = { ...updatedRaw, content: decryptGeneralChat(updatedRaw.content) };
          setThreadComments(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setThreadComments(prev => prev.filter(c => c.id !== deletedId));
          }
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.uid, isWhitelisted, activeThread?.id]);

  const loadMoreMessages = async () => {
    if (!activeConversation || loadingMoreMessages || !hasMoreMessages) return;
    
    setLoadingMoreMessages(true);
    const oldestMessage = messages[0];
    const newLimit = 50;
    
    const { data } = await supabaseClient
      .from('messages')
      .select('id, conversation_id, sender_id, text, created_at')
      .eq('conversation_id', activeConversation.id)
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(newLimit);
      
    if (data && data.length > 0) {
      const sorted = data.reverse();
      const decryptedMessages = sorted.map(m => ({
        ...m,
        text: decryptGeneralChat(m.text)
      }));
      setMessages(prev => [...decryptedMessages, ...prev]);
      setHasMoreMessages(data.length === newLimit);
    } else {
      setHasMoreMessages(false);
    }
    setLoadingMoreMessages(false);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (view === 'messages' && activeConversation && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [activeConversation?.id, view]);

  useEffect(() => {
    if (view === 'messages' && activeConversation && messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const sendDiscordNotification = async (type: 'general' | 'dm', authorName: string, content: string) => {
    const settings = notificationSettingsRef.current;
    const webhookUrl = settings.discord_webhook_url;
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return;
    }

    if (type === 'general' && !settings.discord_notify_general) {
      return;
    }

    if (type === 'dm' && !settings.discord_notify_dm) {
      return;
    }

    const title = type === 'general' ? `💬 Nieuw bericht in General Chat` : `✉️ Nieuw Privébericht (DM)`;
    const description = content;
    const body = {
      embeds: [
        {
          title: title,
          description: description.length > 2000 ? description.substring(0, 1997) + '...' : description,
          color: type === 'general' ? 3447003 : 10181046,
          fields: [
            {
              name: "Afzender",
              value: authorName || "Anoniem",
              inline: true
            },
            {
              name: "App",
              value: "FTJM Chat & Arcade 🎮",
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error('Failed to send Discord notification:', err);
    }
  };

  const handleLogin = async () => {
    setIsAuthModalOpen(true);
    setAuthError(null);
  };

  const handleUpdateNotifications = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ notification_settings: notificationSettings })
        .eq('id', user.uid);
      
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, notification_settings: notificationSettings } : null);
      toast.success('Notificatie-instellingen opgeslagen');
      logAudioEvent('system', 'success', 'Notificatie-instellingen bijgewerkt', user.uid, profile?.display_name || user.displayName || 'Anoniem');
    } catch (err) {
      handleSupabaseError(err, 'notificaties opslaan', user, isAdmin);
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptUpdatedTerms = async () => {
    if (!user || !supabaseClient) return;
    setSaving(true);
    try {
      secureLocalStorage.setItem('has_agreed_terms_v2', 'true');
      const currentTheme = profile?.custom_theme || {};
      const updatedTheme = { ...currentTheme, agreed_terms_v2: true };
      
      const { error } = await supabaseClient
        .from('profiles')
        .update({ custom_theme: updatedTheme })
        .eq('id', user.uid);
        
      if (error) throw error;
      
      setCustomTheme(prev => ({ ...prev, ...updatedTheme }));
      setProfile(prev => prev ? { ...prev, custom_theme: updatedTheme } : null);
      
      const updatedProfile = profile ? { ...profile, custom_theme: updatedTheme } : null;
      if (updatedProfile) {
        localStorage.setItem('cached_profile', JSON.stringify(updatedProfile));
      }
      
      toast.success('Hartelijk dank! Je bent akkoord gegaan met de vernieuwde voorwaarden.');
    } catch (err: any) {
      console.error('Accept terms error:', err);
      toast.error('Kan akkoord niet opslaan: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTheme = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn');
      return;
    }
    setSaving(true);
    isSavingThemeRef.current = true;
    try {
      const currentTheme = profile?.custom_theme || {};
      const updatedTheme = {
        ...currentTheme,
        ...customTheme,
        agreed_terms_v2: true
      };
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          custom_theme: updatedTheme,
          use_custom_theme: useCustomTheme
        })
        .eq('id', user.uid);
      
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, custom_theme: updatedTheme, use_custom_theme: useCustomTheme } : null);
      toast.success('Thema instellingen opgeslagen');
      logAudioEvent('system', 'success', 'Thema bijgewerkt', user.uid, profile?.display_name || user.displayName || 'Anoniem');
    } catch (err) {
      handleSupabaseError(err, 'thema opslaan', user, isAdmin);
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingThemeRef.current = false;
      }, 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
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

    const isNameLocked = profile?.name_locked_until && new Date(profile.name_locked_until) > new Date();
    const isBioLocked = profile?.bio_locked_until && new Date(profile.bio_locked_until) > new Date();

    const targetDisplayName = displayNameInput.trim() || user.displayName || 'Anoniem';
    if (isNameLocked && targetDisplayName !== profile?.display_name) {
      toast.error('Je weergavenaam is vergrendeld door een administrator!');
      setSaving(false);
      return;
    }

    const targetBio = bioInput.trim() || null;
    const oldBio = profile?.bio || null;
    if (isBioLocked && targetBio !== oldBio) {
      toast.error('Je bio / status is vergrendeld door een administrator!');
      setSaving(false);
      return;
    }

    const updatedData: any = {
      id: user.uid,
      display_name: displayNameInput.trim() || user.displayName || 'Anoniem',
      photo_url: photoURLInput.trim() || user.photoURL || null,
      bio: bioInput.trim() || null,
      banner_url: bannerURLInput.trim() || null,
      notification_settings: {
        enable_sounds: notificationSettings.enable_sounds,
        notify_new_posts: notificationSettings.notify_new_posts,
        notify_new_messages: notificationSettings.notify_new_messages,
        notify_mentions: notificationSettings.notify_mentions,
        message_sound: notificationSettings.message_sound,
        post_sound: notificationSettings.post_sound
      },
      custom_theme: {
        ...(profile?.custom_theme || {}),
        ...customTheme,
        banner_url: bannerURLInput.trim() || null,
        agreed_terms_v2: true
      },
      use_custom_theme: useCustomTheme,
      custom_sounds: customSounds,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .upsert(updatedData, { onConflict: 'id' });
        
      if (error) throw error;
      
      logAudioEvent('system', 'success', 'Profiel succesvol bijgewerkt', user.uid, profile?.display_name || user.displayName || 'Anoniem');
      // Update all content where this user is the author to reflect name/photo changes
      try {
        const bulkUpdates = [
          supabaseClient.from('posts').update({
            author_name: updatedData.display_name,
            author_photo: updatedData.photo_url
          }).eq('author_id', user.uid),
          
          supabaseClient.from('forum_threads').update({
            author_name: updatedData.display_name,
            author_photo: updatedData.photo_url
          }).eq('author_id', user.uid),
          
          supabaseClient.from('forum_comments').update({
            author_name: updatedData.display_name,
            author_photo: updatedData.photo_url
          }).eq('author_id', user.uid),
          
          supabaseClient.from('notifications').update({
            actor_name: updatedData.display_name,
            actor_photo: updatedData.photo_url
          }).eq('actor_id', user.uid)
        ];

        // Also update conversations where user is a participant (JSONB fields)
        const { data: convs } = await supabaseClient
          .from('conversations')
          .select('id, participant_names, participant_photos')
          .contains('participants', [user.uid]);

        if (convs && convs.length > 0) {
          const convUpdates = convs.map(conv => {
            const newNames = { ...conv.participant_names, [user.uid]: updatedData.display_name };
            const newPhotos = { ...conv.participant_photos, [user.uid]: updatedData.photo_url };
            return supabaseClient
              .from('conversations')
              .update({
                participant_names: newNames,
                participant_photos: newPhotos
              })
              .eq('id', conv.id);
          });
          bulkUpdates.push(...convUpdates);
        }

        await Promise.all(bulkUpdates);
      } catch (bulkErr) {
        console.error('Failed to update some content with new profile info:', bulkErr);
        // We don't throw here to not block the main profile update success
      }
      
      // Update local profile state
      setProfile(prev => ({ ...prev, ...updatedData } as UserProfile));
      localStorage.setItem('cached_profile', JSON.stringify({ ...profile, ...updatedData }));
      
      toast.success('Instellingen opgeslagen');
    } catch (err) {
      handleSupabaseError(err, 'instellingen opslaan', user, isAdmin);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomSound = async () => {
    if (!newSoundName || !newSoundUrl || !user || !supabaseClient) {
      toast.error('Vul zowel een naam als een geluidsbron/bestand in');
      return;
    }

    const isDataUrl = newSoundUrl.startsWith('data:');
    // Basic URL validation - informative only, non-blocking
    const isDirectAudio = isDataUrl || /\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?.*)?$/i.test(newSoundUrl);
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(newSoundUrl);

    if (!isDirectAudio && !isYouTube && !newSoundUrl.startsWith('/')) {
      toast.warning('De opgegeven bron lijkt geen bekend audioformaat te zijn. Het geluid werkt mogelijk niet.');
    }

    setUploadingSound(true);
    try {
      // Skip direct audio testing for YouTube links or Data URLs
      if (!isYouTube && !isDataUrl) {
        // Test if the sound actually works before adding
        const testAudio = new Audio(newSoundUrl);
        testAudio.preload = 'auto';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Time-out bij laden audio. Is de URL een direct audio bestand?'));
          }, 10000);

          const cleanup = () => {
            clearTimeout(timeout);
            testAudio.removeEventListener('canplay', onCanPlay);
            testAudio.removeEventListener('error', onError);
          };

          const onCanPlay = () => {
            cleanup();
            resolve(true);
          };

          const onError = (e) => {
            cleanup();
            console.error('Audio load error:', e);
            reject(new Error('Audio kon niet worden geladen. Controleer of de URL naar een direct .mp3 of .wav bestand verwijst.'));
          };

          testAudio.addEventListener('canplay', onCanPlay);
          testAudio.addEventListener('error', onError);
          
          // Trigger load
          testAudio.load();
        });
      }

      const newSound = { name: newSoundName, url: newSoundUrl };
      const updatedSounds = [...customSounds, newSound];
      setCustomSounds(updatedSounds);
      
      await supabaseClient
        .from('profiles')
        .update({ custom_sounds: updatedSounds })
        .eq('id', user.uid);

      setNewSoundName('');
      setNewSoundUrl('');
      toast.success('Geluid toegevoegd!');
    } catch (err) {
      console.error('Failed to add custom sound', err);
      toast.error(err instanceof Error ? err.message : 'Kon geluid niet toevoegen');
    } finally {
      setUploadingSound(false);
    }
  };

  const handleDeleteCustomSound = async (index: number) => {
    if (!user || !supabaseClient) return;
    
    try {
      const updatedSounds = customSounds.filter((_, i) => i !== index);
      setCustomSounds(updatedSounds);
      
      await supabaseClient
        .from('profiles')
        .update({ custom_sounds: updatedSounds })
        .eq('id', user.uid);
        
      toast.success('Geluid verwijderd');
    } catch (err) {
      console.error('Failed to delete custom sound', err);
      toast.error('Kon geluid niet verwijderen');
    }
  };

  const handleResetToGoogle = () => {
    if (!user) return;
    setDisplayNameInput(user.displayName || '');
    setPhotoURLInput(user.photoURL || '');
    toast.info('Google profiel gegevens geladen. Vergeet niet op te slaan!');
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!user || !profile) {
      toast.error('Je moet ingelogd zijn om gebruikers te volgen');
      return;
    }
    setFollowLoading(true);

    try {
      const currentFollowing = profile.custom_theme?.following || [];
      const isCurrentlyFollowing = currentFollowing.includes(targetUserId);

      let updatedFollowing: string[];
      if (isCurrentlyFollowing) {
        updatedFollowing = currentFollowing.filter(id => id !== targetUserId);
      } else {
        updatedFollowing = [...currentFollowing, targetUserId];
      }

      const updatedTheme = {
        ...(profile.custom_theme || {}),
        following: updatedFollowing
      };

      const { error } = await supabaseClient
        .from('profiles')
        .update({ custom_theme: updatedTheme })
        .eq('id', user.uid);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, custom_theme: updatedTheme } : null);

      if (!isCurrentlyFollowing) {
        await supabaseClient.from('notifications').insert({
          user_id: targetUserId,
          actor_id: user.uid,
          actor_name: profile.display_name,
          actor_photo: profile.photo_url || null,
          type: 'follow',
          resource_type: 'post',
          resource_id: user.uid,
          content: `${profile.display_name} is je gaan volgen!`,
          created_at: new Date().toISOString(),
          is_read: false
        }).then(({ error }) => {
          if (error) console.error('Error sending follow notification:', error);
        });
      }

      if (selectedUser && selectedUser.id === targetUserId) {
        setSelectedUserFollowers(prev => {
          if (isCurrentlyFollowing) {
            return prev.filter(p => p.id !== user.uid);
          } else {
            const myFollowerProfile: UserProfile = {
              id: user.uid,
              display_name: profile.display_name,
              photo_url: profile.photo_url,
              email: profile.email,
              bio: profile.bio,
              custom_theme: profile.custom_theme,
              created_at: profile.created_at || new Date().toISOString(),
              updated_at: profile.updated_at || new Date().toISOString()
            };
            return [...prev, myFollowerProfile];
          }
        });
        
        // Also update selectedUser custom_theme/state so button updates correctly
        setSelectedUser(prev => prev ? { 
          ...prev, 
          custom_theme: { 
            ...(prev.custom_theme || {}),
            // if we are following ourselves... but wait we only follow others
          } 
        } : null);
      }

      toast.success(isCurrentlyFollowing ? 'Niet meer volgend' : 'Je volgt nu deze gebruiker!');
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error('Kan actie niet uitvoeren');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenProfile = async (userId: string) => {
    try {
      let result = await supabaseClient
        .from('profiles')
        .select('id, display_name, original_name, email, photo_url, bio, role, created_at, updated_at, banner_url, custom_theme, name_locked_until, bio_locked_until, is_blocked')
        .eq('id', userId)
        .single();
        
      if (result.error) {
        console.warn('Ophalen met banner_url mislukt, proberen zonder...', result.error);
        result = await supabaseClient
          .from('profiles')
          .select('id, display_name, original_name, email, photo_url, bio, role, created_at, updated_at, custom_theme, name_locked_until, bio_locked_until, is_blocked')
          .eq('id', userId)
          .single();
      }
      
      if (result.error) throw result.error;
      if (result.data) setSelectedUser(result.data);
    } catch (err) {
      handleSupabaseError(err, 'profiel ophalen', user, isAdmin);
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
      const reportData = {
        reporter_id: user.uid,
        reported_id: reportTarget.userId,
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      const { error } = await supabaseClient.from('reports').insert(reportData);
      if (error) throw error;

      // Forward to Discord bot via secure Express API
      fetch('/api/bot/forward-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      }).catch(err => console.error('Failed to forward report to bot API:', err));

      toast.success('Moderatie: Rapport ingediend. Bedankt voor je hulp.', {
        icon: '🛡️'
      });
      setReportTarget(null);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      handleSupabaseError(err, 'rapport indienen', user, isAdmin);
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
      const newCooldown = now + 30000; // Increased to 30 seconds for spamming
      setCooldownUntil(newCooldown);
      setCooldownRemaining(30);
      toast.error('Moderatie: Je gaat te snel! Stop met spammen. Er is een rapport geopend.', {
        icon: '🛡️',
        duration: 5000
      });
      
      // Automatic report for spamming
      if (user) {
        const autoReportData = {
          reporter_id: 'SYSTEM',
          reported_id: user.uid,
          target_type: 'user',
          target_id: user.uid,
          reason: 'Automatische Spam Detectie',
          details: `Gebruiker stuurde ${recentTimestamps.length + 1} berichten in minder dan 5 seconden.`,
          created_at: new Date().toISOString(),
          status: 'pending'
        };
        supabaseClient.from('reports').insert(autoReportData).then(({ error }) => {
          if (error) {
            console.error('Failed to create auto-report:', error);
          } else {
            // Forward to Discord bot via secure Express API
            fetch('/api/bot/forward-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(autoReportData)
            }).catch(err => console.error('Failed to forward auto-report to bot API:', err));
          }
        });
      }
      
      return false;
    }
    
    setMessageTimestamps([...recentTimestamps, now]);
    return true;
  };

  const handleMentions = async (content: string, resourceId: string, resourceType: 'post' | 'comment' | 'thread') => {
    if (!user || !users.length) return;

    const mentionedUserIds = new Set<string>();
    
    users.forEach(u => {
      if (u.id === user.uid) return;
      // Use regex to match @name followed by non-word character or end of string
      const mentionRegex = new RegExp(`@${u.display_name}(\\b|$)`, 'i');
      if (mentionRegex.test(content)) {
        mentionedUserIds.add(u.id);
      }
    });

    for (const recipientId of mentionedUserIds) {
      const recipient = users.find(u => u.id === recipientId);
      if (recipient?.notification_settings?.notify_mentions === false) continue;

      try {
        const payload = {
          user_id: recipientId,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || undefined,
          type: 'mention',
          resource_id: resourceId,
          resource_type: resourceType,
          content: content.substring(0, 100),
          is_read: false,
          created_at: new Date().toISOString()
        };
        console.log('Sending mention notification payload:', JSON.stringify(payload, null, 2));
        await supabaseClient.from('notifications').insert(payload);
      } catch (err) {
        console.error('Failed to send mention notification', err);
      }
    }
  };

  const moderateContent = async (content: string): Promise<{ allowed: boolean; reason?: string }> => {
    // Strip base64 data to avoid false positive matches on bad words inside random base64 bytes:
    const cleanContent = content.replace(/data:[^;]+;base64,[^\s]+/g, '');
    const lowerContent = cleanContent.toLowerCase();
    
    // Altijd toestaan als het woord 'davin' (of een variatie ervan) in het bericht of de afzendersnaam staat
    const senderDisplayName = ((profile?.display_name || user?.displayName || '') as string).toLowerCase();
    if (lowerContent.includes('davin') || senderDisplayName.includes('davin')) {
      return { allowed: true };
    }
    
    // 1. Extreme words that are ALWAYS blocked (slurs, severe illnesses)
    const absoluteForbidden = [
      'neger', 'nikker', 'nigger', 'negro', 'kankerlijer', 'kkr', 'kanker', 'nazi', 'jood', 'hitler', 'hoerezoon', 'varken', 'teringlijer'
    ];

    for (const word of absoluteForbidden) {
      if (lowerContent.includes(word)) {
        return { allowed: false, reason: 'Dit bericht bevat verboden woorden.' };
      }
    }

    // 2. Words that are only blocked if directed at someone
    const directedForbidden = [
      // English
      'idiot', 'fool', 'jerk', 'asshole', 'bitch', 'bastard', 'prick', 'douchebag', 'moron', 'cunt', 'dick', 'shithead', 'wanker', 'twat', 'faggot',
      // Dutch
      'domkop', 'sukkel', 'idioot', 'eikel', 'klootzak', 'lul', 'zakkenwasser', 'mongool', 'mongooltje', 'trut', 'hoer', 'slet', 'pipo', 'pannenkoek', 'dakhaas', 'flikker', 'homo', 'gay', 'kneus', 'paling', 'lapzwans', 'kwibus', 'flapuit', 'droeftoeter'
    ];

    // Check if the message contains a potential target
    const hasMention = content.includes('@');
    // Check if any registered user's display name is in the message (case insensitive)
    const hasUserName = users.some(u => 
      u.display_name && 
      u.display_name.length > 2 && 
      lowerContent.includes(u.display_name.toLowerCase())
    );
    // Simple check for names (words starting with a capital letter that aren't at the start of a sentence)
    // This is a rough heuristic for the hardcoded filter
    const hasPotentialName = /\s[A-Z][a-z]+/.test(content);

    if (hasMention || hasUserName || hasPotentialName) {
      for (const word of directedForbidden) {
        if (lowerContent.includes(word)) {
          return { 
            allowed: false, 
            reason: `Je mag deze woorden niet gebruiken om anderen te beledigen.` 
          };
        }
      }
    }

    return { allowed: true };
  };

  const MAX_CONTENT_LENGTH = 2000;

  const handleCreatePost = async (e: React.FormEvent, customContent?: string) => {
    e.preventDefault();
    const rawContent = (customContent !== undefined ? customContent : postInput).trim();
    console.log('handleCreatePost triggered', { user: !!user, hasContent: !!rawContent, isWhitelisted });
    if (!user || !rawContent || isWhitelisted !== true) {
      if (isWhitelisted === null) {
        toast.error('Wacht even, we controleren je toegang...');
      } else if (isWhitelisted === false) {
        toast.error('Je hebt geen toegang om berichten te plaatsen.');
      }
      return;
    }

    if (!checkRateLimit()) return;
    
    isPostingRef.current = true;
    const content = rawContent;
    
    const hasUpload = content.includes('data:image/') || content.includes('data:audio/') || content.includes('data:video/');
    const maxAllowed = hasUpload ? 20000000 : MAX_CONTENT_LENGTH;
    if (content.length > maxAllowed) {
      toast.error(hasUpload ? "Bestand is te groot (maximaal 15MB)." : `Bericht is te lang (max ${MAX_CONTENT_LENGTH} tekens).`);
      isPostingRef.current = false;
      return;
    }

    setSending(true);
    setError(null);

    const postPromise = (async () => {
      // Moderation check
      const moderation = await moderateContent(content);
      if (!moderation.allowed) {
        isPostingRef.current = false;
        throw new Error(moderation.reason || 'Je bericht is geblokkeerd vanwege negatieve uitlatingen over personen.');
      }

      console.log('Attempting to insert post:', { content, author_id: user.uid, parent_id: replyingTo?.id });
      const encryptedContent = encryptGeneralChat(content);
      const { data: insertData, error } = await supabaseClient.from('posts').insert({
        author_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || undefined,
        content: encryptedContent,
        created_at: new Date().toISOString(),
        parent_id: replyingTo?.id || null
      }).select().single();

      if (error) {
        console.error('Insert post error:', error);
        isPostingRef.current = false;
        throw error;
      }

      console.log('Post inserted successfully:', insertData);
      
      // Forward to Discord bot via secure Express API
      if (insertData) {
        fetch('/api/bot/forward-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author_id: user.uid,
            author_name: profile?.display_name || user.displayName || 'Anoniem',
            content: encryptedContent,
            created_at: insertData.created_at
          })
        }).catch(err => console.error('Failed to forward post to bot API:', err));
      }

      logAudioEvent('system', 'success', 'Bericht succesvol geplaatst', user.uid, profile?.display_name || user.displayName || 'Anoniem');
      playSound(notificationSettingsRef.current.post_sound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enable_sounds, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      setPostInput('');
      setReplyingTo(null);

      // Update state directly with the new post to avoid race conditions
      if (insertData) {
        handleMentions(content, insertData.id, 'post');
        const decryptedPost = { ...insertData, content: content };
        setPosts((prev) => {
          const alreadyExists = prev.some(p => p.id === decryptedPost.id);
          if (alreadyExists) return prev;
          const newPosts = [decryptedPost, ...prev].slice(0, 100);
          localStorage.setItem('cached_posts', JSON.stringify(newPosts));
          return newPosts;
        });
        
        // Broadcast new post to others
        if (postsChannelRef.current) {
          postsChannelRef.current.send({
            type: 'broadcast',
            event: 'new_post',
            payload: insertData
          });
        }
      }

      isPostingRef.current = false;
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
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht plaatsen', user, isAdmin);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (!user || !threadTitleInput.trim() || !threadContentInput.trim() || isWhitelisted !== true) return;
    
    if (threadTitleInput.trim().length > 100) {
      toast.error('Titel is te lang (max 100 tekens).');
      return;
    }

    if (threadContentInput.trim().length > MAX_CONTENT_LENGTH) {
      toast.error(`Inhoud is te lang (max ${MAX_CONTENT_LENGTH} tekens).`);
      return;
    }

    if (!checkRateLimit()) return;
    
    setSending(true);

    // Moderation check
    const moderation = await moderateContent(threadContentInput.trim());
    if (!moderation.allowed) {
      toast.error(moderation.reason || 'Je topic is geblokkeerd vanwege negatieve uitlatingen over personen.', {
        icon: '🛡️',
        duration: 5000
      });
      setSending(false);
      return;
    }

    const payload = {
      author_id: user.uid,
      author_name: profile?.display_name || user.displayName || 'Anoniem',
      author_photo: profile?.photo_url || user.photoURL || undefined,
      title: encryptGeneralChat(threadTitleInput.trim()),
      content: encryptGeneralChat(threadContentInput.trim()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting to insert forum thread. Payload:', JSON.stringify(payload, null, 2));
    
    try {
      const { data, error } = await supabaseClient.from('forum_threads').insert(payload).select().single();

      if (error) throw error;
      
      logAudioEvent('system', 'success', `Topic '${payload.title}' succesvol geplaatst`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      const decryptedData = { 
        ...data, 
        title: threadTitleInput.trim(), 
        content: threadContentInput.trim() 
      };
      setThreads(prev => [decryptedData, ...prev]);
      setThreadTitleInput('');
      setThreadContentInput('');
      setIsCreatingThread(false);
      setActiveThread(data);
      toast.success('Topic succesvol geplaatst!');
    } catch (err) {
      handleSupabaseError(err, 'topic aanmaken', user, isAdmin);
    } finally {
      setSending(false);
    }
  };

  const handleOpenThread = async (thread: ForumThread) => {
    setActiveThread(thread);
    setThreadComments([]);
    setCommentInput('');
    
    try {
      const { data, error } = await supabaseClient
        .from('forum_comments')
        .select('id, thread_id, author_id, author_name, author_photo, content, created_at, parent_id')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) {
        const decryptedComments = (data as ForumComment[]).map(c => ({ ...c, content: decryptGeneralChat(c.content) }));
        setThreadComments(decryptedComments);
      }
    } catch (err) {
      handleSupabaseError(err, 'reacties ophalen', user, isAdmin);
    }
  };

  const handleCreateComment = async (threadId: string) => {
    if (!user || !commentInput.trim() || isWhitelisted !== true) return;
    
    if (!checkRateLimit()) return;
    
    setSending(true);

    // Moderation check
    const moderation = await moderateContent(commentInput.trim());
    if (!moderation.allowed) {
      toast.error(moderation.reason || 'Je reactie is geblokkeerd vanwege negatieve uitlatingen over personen.', {
        icon: '🛡️',
        duration: 5000
      });
      setSending(false);
      return;
    }

    try {
      const encryptedComment = encryptGeneralChat(commentInput.trim());
      const { data, error } = await supabaseClient.from('forum_comments').insert({
        thread_id: threadId,
        author_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || undefined,
        content: encryptedComment,
        created_at: new Date().toISOString(),
        parent_id: replyingToComment?.id || null
      }).select().single();

      if (error) throw error;
      
      logAudioEvent('system', 'success', `Reactie geplaatst op thread ${threadId}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      const decryptedData = { ...data, content: decryptGeneralChat(data.content) };
      setThreadComments(prev => [...prev, decryptedData]);
      setCommentInput('');
      setReplyingToComment(null);
      
      // Notify mentioned users
      handleMentions(decryptedData.content, activeThread?.id || data.id, 'thread');
      
      // Notify thread author if they are not the commenter
      if (activeThread && activeThread.author_id !== user.uid) {
        const payload = {
          user_id: activeThread.author_id,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || undefined,
          type: 'reply',
          resource_id: activeThread.id,
          resource_type: 'thread',
          content: commentInput.trim().substring(0, 100),
          is_read: false,
          created_at: new Date().toISOString()
        };
        console.log('Sending thread reply notification payload:', JSON.stringify(payload, null, 2));
        supabaseClient.from('notifications').insert(payload).then(({ error }) => {
          if (error) console.error('Failed to send thread reply notification', error);
        });
      }
      
      // Update comment count in thread (increment locally for now)
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t));
      
      toast.success('Reactie geplaatst!');
    } catch (err) {
      handleSupabaseError(err, 'reactie plaatsen', user, isAdmin);
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!checkRateLimit()) return;
    
    isPostingRef.current = true;
    const deletePromise = (async () => {
      console.log('Attempting to delete post:', postId);
      
      let query = supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (!isAdmin) {
        query = query.eq('author_id', user.uid);
      }

      const { error } = await query;

      if (error) {
        console.error('Delete post error details:', error);
        isPostingRef.current = false;
        throw error;
      }

      // Broadcast delete to others
      if (postsChannelRef.current) {
        postsChannelRef.current.send({
          type: 'broadcast',
          event: 'delete_post',
          payload: { id: postId }
        });
      }

      // Update local state immediately for better UX
      setPosts(prev => {
        const newPosts = prev.filter(p => p.id !== postId);
        localStorage.setItem('cached_posts', JSON.stringify(newPosts));
        return newPosts;
      });
      
      isPostingRef.current = false;
    })();

    toast.promise(deletePromise, {
      loading: 'Bericht verwijderen...',
      success: 'Bericht verwijderd',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet verwijderen'}`
    });

    try {
      await deletePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht verwijderen', user, isAdmin);
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editPostInput.trim()) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    
    isPostingRef.current = true;
    const updatePromise = (async () => {
      // Moderation check
      const moderation = await moderateContent(editPostInput.trim());
      if (!moderation.allowed) {
        isPostingRef.current = false;
        throw new Error(moderation.reason || 'Je bericht is geblokkeerd vanwege negatieve uitlatingen over personen.');
      }

      console.log('Attempting to update post:', postId);
      const encryptedUpdate = encryptGeneralChat(editPostInput.trim());
      
      let query = supabaseClient
        .from('posts')
        .update({
          content: encryptedUpdate
        })
        .eq('id', postId);
      
      if (!isAdmin) {
        query = query.eq('author_id', user.uid);
      }

      const { error } = await query;
      
      if (error) {
        console.error('Update post error details:', error);
        isPostingRef.current = false;
        throw error;
      }

      // Broadcast update to others
      if (postsChannelRef.current) {
        postsChannelRef.current.send({
          type: 'broadcast',
          event: 'update_post',
          payload: { 
            id: postId, 
            content: editPostInput.trim()
          }
        });
      }

      // Update local state immediately for better UX
      setPosts(prev => {
        const newPosts = prev.map(p => p.id === postId ? { ...p, content: editPostInput.trim() } : p);
        localStorage.setItem('cached_posts', JSON.stringify(newPosts));
        return newPosts;
      });
      
      isPostingRef.current = false;
      setEditingPostId(null);
      setEditPostInput('');
    })();

    toast.promise(updatePromise, {
      loading: 'Bericht bijwerken...',
      success: 'Bericht bijgewerkt',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet bijwerken'}`
    });

    try {
      await updatePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken', user, isAdmin);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDirectMessage = async (messageId: string, customText?: string) => {
    const textToUse = (customText !== undefined ? customText : editMessageInput).trim();
    if (!textToUse || !activeConversation || !user) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    
    const updatePromise = (async () => {
      // Moderation check
      const moderation = await moderateContent(textToUse);
      if (!moderation.allowed) {
        throw new Error(moderation.reason || 'Je bericht is geblokkeerd vanwege negatieve uitlatingen over personen.');
      }

      console.log('Attempting to update message:', messageId);
      
      const encryptedText = encryptGeneralChat(textToUse);
      let payloadText = encryptedText;

      let query = supabaseClient
        .from('messages')
        .update({
          text: payloadText,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (!isAdmin) {
        query = query.eq('sender_id', user.uid);
      }

      const { error } = await query;
      
      if (error) {
        console.error('Update message error:', error);
        throw error;
      }

      // Broadcast update to others
      if (messageChannelRef.current) {
        messageChannelRef.current.send({
          type: 'broadcast',
          event: 'update_message',
          payload: { 
            id: messageId, 
            text: payloadText,
            updated_at: new Date().toISOString()
          }
        });
      }

      // Targeted broadcast to each participant's personal conversations channel
      if (activeConversation) {
        activeConversation.participants.forEach(participantId => {
          if (participantId === user.uid) return;
          const targetChannel = supabaseClient.channel(`conversations:${participantId}`);
          targetChannel.send({
            type: 'broadcast',
            event: 'update_message',
            payload: { 
              id: messageId, 
              text: payloadText,
              conversation_id: activeConversation.id,
              updated_at: new Date().toISOString()
            }
          });
        });
      }

      // Update local state immediately for better UX
      setMessages(prev => prev.map(m => m.id === messageId ? { 
        ...m, 
        text: textToUse,
        updated_at: new Date().toISOString() 
      } : m));

      // Update conversation last_message if this was the last message
      // We do this in the background
      supabaseClient
        .from('messages')
        .select('id')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data: latestMsg }) => {
          if (latestMsg && latestMsg.id === messageId) {
            supabaseClient
              .from('conversations')
              .update({ 
                last_message: payloadText,
                updated_at: new Date().toISOString()
              })
              .eq('id', activeConversation.id);
            
            // Also update local conversations state
            setConversations(prev => prev.map(c => c.id === activeConversation.id ? {
              ...c,
              last_message: textToUse,
              updated_at: new Date().toISOString()
            } : c));
          }
        });

      setEditingMessageId(null);
    })();

    toast.promise(updatePromise, {
      loading: 'Bericht bijwerken...',
      success: 'Bericht bijgewerkt',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet bijwerken'}`
    });

    try {
      await updatePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht bijwerken', user, isAdmin);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDirectMessage = async (messageId: string) => {
    if (!activeConversation || !user) return;
    if (!checkRateLimit()) return;
    
    const deletePromise = (async () => {
      console.log('Attempting to delete direct message:', messageId);
      let query = supabaseClient
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (!isAdmin) {
        query = query.eq('sender_id', user.uid);
      }

      const { error } = await query;

      if (error) {
        console.error('Delete message error:', error);
        throw error;
      }

      // Broadcast delete to others
      if (messageChannelRef.current) {
        messageChannelRef.current.send({
          type: 'broadcast',
          event: 'delete_message',
          payload: { id: messageId }
        });
      }

      // Targeted broadcast to each participant's personal conversations channel
      if (activeConversation) {
        activeConversation.participants.forEach(participantId => {
          if (participantId === user.uid) return;
          const targetChannel = supabaseClient.channel(`conversations:${participantId}`);
          targetChannel.send({
            type: 'broadcast',
            event: 'delete_message',
            payload: { id: messageId, conversation_id: activeConversation.id }
          });
        });
      }

      // Update local state immediately for better UX
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // Find new last message and update conversation in background
      supabaseClient
        .from('messages')
        .select('text, sender_id')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data: newLastMsg }) => {
          supabaseClient
            .from('conversations')
            .update({
              last_message: newLastMsg ? newLastMsg.text : null,
              last_message_sender_id: newLastMsg ? newLastMsg.sender_id : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', activeConversation.id);
        });
    })();

    toast.promise(deletePromise, {
      loading: 'Bericht verwijderen...',
      success: 'Bericht verwijderd',
      error: (err) => `Fout: ${err.message || 'Kon bericht niet verwijderen'}`
    });

    try {
      await deletePromise;
    } catch (err) {
      handleSupabaseError(err, 'bericht verwijderen', user, isAdmin);
    }
  };

  const handleAddToWhitelist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      handleSupabaseError(err, 'whitelist toevoegen', user, isAdmin);
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!isAdmin || email === user?.email) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient.from('whitelist').delete().eq('email', email);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'whitelist verwijderen', user, isAdmin);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    if (!isAdmin) {
      console.warn('[Admin] handleBlockUser called by non-admin');
      return;
    }

    let userToBlock = users.find(u => u.id === userId);
    if (!userToBlock && selectedUser && selectedUser.id === userId) {
      userToBlock = selectedUser;
    }

    if (!userToBlock) {
      console.error('[Admin] User not found for blocking:', userId);
      toast.error('Gebruiker niet gevonden.');
      return;
    }

    setSaving(true);
    console.log(`[Admin] START ${isBlocked ? 'BLOCK' : 'UNBLOCK'} flow for:`, {
      userId,
      name: userToBlock.display_name,
      email: userToBlock.email
    });
    
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ 
          is_blocked: isBlocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('[Admin] Supabase error during block operation:', error);
        throw error;
      }
      
      console.log('[Admin] Supabase update response:', data);
      
      // If it returned no data, it might still have worked but been blocked by RLS read permissions
      if (!data || data.length === 0) {
        console.warn('[Admin] Update returned no data (likely RLS select restriction). Continuing with local update.');
      }
      
      // Handle whitelist synchronization
      if (userToBlock.email) {
        if (isBlocked) {
          console.log('[Admin] Also removing from whitelist:', userToBlock.email);
          try {
            const { error: wlError } = await supabaseClient.from('whitelist').delete().eq('email', userToBlock.email);
            if (wlError) console.error('[Admin] Whitelist delete error:', wlError);
            setWhitelist(prev => prev.filter(w => w.email !== userToBlock.email));
          } catch (e) {
            console.error('[Admin] Failed to remove from whitelist during block:', e);
          }
        } else {
          // UNBLOCKING: Add back to whitelist if not already there
          console.log('[Admin] Also adding back to whitelist:', userToBlock.email);
          try {
            // Check if already in whitelist first to avoid unique constraint errors
            const { data: existingWl } = await supabaseClient
              .from('whitelist')
              .select('email')
              .eq('email', userToBlock.email)
              .maybeSingle();

            if (!existingWl) {
              const { error: wlError } = await supabaseClient
                .from('whitelist')
                .insert({ email: userToBlock.email, added_at: new Date().toISOString() });
              
              if (wlError) {
                console.error('[Admin] Whitelist add error:', wlError);
              } else {
                setWhitelist(prev => [...prev, { email: userToBlock.email!, added_at: new Date().toISOString() }]);
              }
            }
          } catch (e) {
            console.error('[Admin] Failed to add back to whitelist during unblock:', e);
          }
        }
      }
      
      // Update local state immediately for responsiveness
      setUsers(prev => {
        const updated = prev.map(u => u.id === userId ? { ...u, is_blocked: isBlocked } : u);
        return [...updated].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
      });
      
      toast.success(isBlocked ? `Gebruiker ${userToBlock.display_name} geblokkeerd` : `Gebruiker ${userToBlock.display_name} gedeblokkeerd`);
      
      logAudioEvent('system', 'warning', `Gebruiker ${userToBlock.display_name} is ${isBlocked ? 'geblokkeerd' : 'gedeblokkeerd'} door admin`, user?.uid, profile?.display_name);
    } catch (err) {
      console.error('[Admin] CRITICAL catch in handleBlockUser:', err);
      handleSupabaseError(err, 'gebruiker blokkeren', user, true); // true for isAdmin
    } finally {
      setSaving(false);
      console.log('[Admin] FINISHED block flow');
    }
  };

  const handleLockUserField = async (userId: string, field: 'name' | 'bio', isLocked: boolean) => {
    if (!isAdmin) {
      console.warn('[Admin] handleLockUserField called by non-admin');
      return;
    }

    let userToLock = users.find(u => u.id === userId);
    if (!userToLock && selectedUser && selectedUser.id === userId) {
      userToLock = selectedUser;
    }

    if (!userToLock) {
      toast.error('Gebruiker niet gevonden.');
      return;
    }

    setSaving(true);
    const lockValue = isLocked ? '9999-12-31T23:59:59.000Z' : null;
    const updatePayload = field === 'name' 
      ? { name_locked_until: lockValue, updated_at: new Date().toISOString() } 
      : { bio_locked_until: lockValue, updated_at: new Date().toISOString() };

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (error) throw error;

      // Update local state immediately for responsiveness
      setUsers(prev => {
        return prev.map(u => u.id === userId 
          ? { 
              ...u, 
              [field === 'name' ? 'name_locked_until' : 'bio_locked_until']: lockValue 
            } 
          : u
        );
      });

      toast.success(
        isLocked 
          ? `${field === 'name' ? 'Naam' : 'Bio'} van ${userToLock.display_name} is vergrendeld`
          : `${field === 'name' ? 'Naam' : 'Bio'} van ${userToLock.display_name} is ontgrendeld`
      );

      logAudioEvent(
        'system', 
        'success', 
        `Admin heeft de ${field === 'name' ? 'naam' : 'bio'} van ${userToLock.display_name} ${isLocked ? 'vergrendeld' : 'ontgrendeld'}`, 
        user?.uid, 
        profile?.display_name
      );
    } catch (err) {
      console.error('[Admin] Error locking user field:', err);
      handleSupabaseError(err, 'profielveld vergrendelen/ontgrendelen', user, true);
    } finally {
      setSaving(false);
    }
  };

  const handleWarnUser = async (userId: string, reason: string, details: string) => {
    if (!isAdmin) {
      console.warn('[Admin] handleWarnUser called by non-admin');
      return;
    }

    let targetUser = users.find(u => u.id === userId);
    if (!targetUser && selectedUser && selectedUser.id === userId) {
      targetUser = selectedUser;
    }

    if (!targetUser) {
      toast.error('Gebruiker niet gevonden.');
      return;
    }

    setSaving(true);
    try {
      const { data: profileVal, error: getError } = await supabaseClient
        .from('profiles')
        .select('admin_notes, custom_theme')
        .eq('id', userId)
        .single();

      if (getError) throw getError;

      const oldAdminNotes = profileVal?.admin_notes;
      const oldCustomTheme = profileVal?.custom_theme || {};
      const data = parseAdminNotes(oldAdminNotes, oldCustomTheme);

      const newWarning = {
        id: 'warn_' + Math.random().toString(36).substring(2, 11),
        reason,
        details,
        admin_name: profile?.display_name || 'Admin',
        date: new Date().toISOString(),
        read: false
      };

      const updatedWarnings = [newWarning, ...data.warnings];

      const structuredAdminNotes = {
        telemetry: data.telemetry,
        warnings: updatedWarnings,
        banned_until: data.banned_until,
        ban_reason: data.ban_reason
      };

      const updatedCustomTheme = {
        ...oldCustomTheme,
        admin_notes: structuredAdminNotes
      };

      let saveError = null;
      try {
        const { error: firstError } = await supabaseClient
          .from('profiles')
          .update({
            admin_notes: JSON.stringify(structuredAdminNotes),
            custom_theme: updatedCustomTheme,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (firstError) {
          console.warn('[Admin] Direct update failed, trying custom_theme fallback...', firstError);
          const { error: fallbackError } = await supabaseClient
            .from('profiles')
            .update({
              custom_theme: updatedCustomTheme,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (fallbackError) saveError = fallbackError;
        }
      } catch (e) {
        saveError = e;
      }

      if (saveError) throw saveError;

      // Update local state is crucial
      setUsers(prev => {
        return prev.map(u => u.id === userId 
          ? { 
              ...u, 
              admin_notes: JSON.stringify(structuredAdminNotes),
              custom_theme: updatedCustomTheme
            } 
          : u
        );
      });

      toast.success(`Waarschuwing verstuurd naar ${targetUser.display_name}`);
      logAudioEvent(
        'system',
        'warning',
        `Admin waarschuwde ${targetUser.display_name}: ${reason}`,
        user?.uid,
        profile?.display_name
      );
    } catch (err) {
      console.error('[Admin] Error warning user:', err);
      handleSupabaseError(err, 'gebruiker waarschuwen', user, true);
    } finally {
      setSaving(false);
    }
  };

  const handleTempBanUser = async (userId: string, durationMinutes: number, reason: string) => {
    if (!isAdmin) {
      console.warn('[Admin] handleTempBanUser called by non-admin');
      return;
    }

    let targetUser = users.find(u => u.id === userId);
    if (!targetUser && selectedUser && selectedUser.id === userId) {
      targetUser = selectedUser;
    }

    if (!targetUser) {
      toast.error('Gebruiker niet gevonden.');
      return;
    }

    setSaving(true);
    try {
      const { data: profileVal, error: getError } = await supabaseClient
        .from('profiles')
        .select('admin_notes, custom_theme')
        .eq('id', userId)
        .single();

      if (getError) throw getError;

      const oldAdminNotes = profileVal?.admin_notes;
      const oldCustomTheme = profileVal?.custom_theme || {};
      const data = parseAdminNotes(oldAdminNotes, oldCustomTheme);

      let bannedUntil: string | null = null;
      if (durationMinutes > 0) {
        bannedUntil = new Date(Date.now() + durationMinutes * 60000).toISOString();
      }

      const structuredAdminNotes = {
        telemetry: data.telemetry,
        warnings: data.warnings,
        banned_until: bannedUntil,
        ban_reason: durationMinutes > 0 ? reason : null
      };

      const updatedCustomTheme = {
        ...oldCustomTheme,
        admin_notes: structuredAdminNotes
      };

      let saveError = null;
      try {
        const { error: firstError } = await supabaseClient
          .from('profiles')
          .update({
            admin_notes: JSON.stringify(structuredAdminNotes),
            custom_theme: updatedCustomTheme,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (firstError) {
          console.warn('[Admin] Direct temp ban update failed, trying custom_theme fallback...', firstError);
          const { error: fallbackError } = await supabaseClient
            .from('profiles')
            .update({
              custom_theme: updatedCustomTheme,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (fallbackError) saveError = fallbackError;
        }
      } catch (e) {
        saveError = e;
      }

      if (saveError) throw saveError;

      // Update local state
      setUsers(prev => {
        return prev.map(u => u.id === userId 
          ? { 
              ...u, 
              admin_notes: JSON.stringify(structuredAdminNotes),
              custom_theme: updatedCustomTheme
            } 
          : u
        );
      });

      if (durationMinutes > 0) {
        toast.success(`Gebruiker ${targetUser.display_name} tijdelijk geband tot ${new Date(bannedUntil!).toLocaleString('nl-NL')}`);
        logAudioEvent(
          'system',
          'warning',
          `Admin legde tijdelijke ban op voor ${targetUser.display_name}: ${reason}`,
          user?.uid,
          profile?.display_name
        );
      } else {
        toast.success(`Tijdelijke ban opgeheven voor ${targetUser.display_name}`);
        logAudioEvent(
          'system',
          'success',
          `Admin hief tijdelijke ban op voor ${targetUser.display_name}`,
          user?.uid,
          profile?.display_name
        );
      }
    } catch (err) {
      console.error('[Admin] Error temp banning user:', err);
      handleSupabaseError(err, 'tijdelijk uitsluiten gebruiker', user, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDismissWarning = async (warningId: string) => {
    if (!profile || !user?.uid) return;

    try {
      const data = parseAdminNotes(profile.admin_notes, profile.custom_theme);
      const updatedWarnings = data.warnings.map(w => w.id === warningId ? { ...w, read: true } : w);

      const structuredAdminNotes = {
        telemetry: data.telemetry,
        warnings: updatedWarnings,
        banned_until: data.banned_until,
        ban_reason: data.ban_reason
      };

      const updatedCustomTheme = {
        ...(profile.custom_theme || {}),
        admin_notes: structuredAdminNotes
      };

      let saveError = null;
      try {
        const { error: firstError } = await supabaseClient
          .from('profiles')
          .update({
            admin_notes: JSON.stringify(structuredAdminNotes),
            custom_theme: updatedCustomTheme,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.uid);

        if (firstError) {
          console.warn('[Warning] Direct dismiss warning failed, trying custom_theme fallback...', firstError);
          const { error: fallbackError } = await supabaseClient
            .from('profiles')
            .update({
              custom_theme: updatedCustomTheme,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.uid);

          if (fallbackError) saveError = fallbackError;
        }
      } catch (e) {
        saveError = e;
      }

      if (saveError) throw saveError;

      setProfile(prev => prev ? { 
        ...prev, 
        admin_notes: JSON.stringify(structuredAdminNotes),
        custom_theme: updatedCustomTheme
      } : null);
      toast.success('Waarschuwing gemarkeerd als gelezen.');
    } catch (err) {
      console.error('[Warning] Error dismissing warning:', err);
      toast.error('Kon waarschuwing niet markeren als gelezen.');
    }
  };

  const handleSelectMention = (selectedUser: UserProfile) => {
    const mention = `@${selectedUser.display_name?.replace(/\s+/g, '_')} `;
    
    if (activeMentionInput === 'message') {
      const lastAt = messageInput.lastIndexOf('@');
      setMessageInput(messageInput.substring(0, lastAt) + mention);
    } else if (activeMentionInput === 'post') {
      const lastAt = postInput.lastIndexOf('@');
      setPostInput(postInput.substring(0, lastAt) + mention);
    } else if (activeMentionInput === 'comment') {
      const lastAt = commentInput.lastIndexOf('@');
      setCommentInput(commentInput.substring(0, lastAt) + mention);
    } else if (activeMentionInput === 'editPost') {
      const lastAt = editPostInput.lastIndexOf('@');
      setEditPostInput(editPostInput.substring(0, lastAt) + mention);
    }
    
    setMentionResults([]);
    setMentionPosition(null);
    setActiveMentionInput(null);
  };

  const handleUpdateStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      const { error } = await supabaseClient
        .from('settings')
        .upsert({ key: 'websiteStatus', value: { status: statusInput } });
      if (error) throw error;
      toast.success('Website status bijgewerkt');
    } catch (err) {
      handleSupabaseError(err, 'status bijwerken', user, isAdmin);
    }
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Afbeelding is te groot (max 4MB)');
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

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Profielfoto is te groot (max 4MB)');
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

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    if (!isAdmin) {
      toast.error('Je hebt geen beheerdersrechten.');
      return;
    }
    try {
      const { error } = await supabaseClient
        .from('reports')
        .update({ status })
        .eq('id', reportId);
      if (error) throw error;
      
      const updatedReport = reports.find(r => r.id === reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      toast.success(`Melding status bijgewerkt naar: ${status}`);

      if (updatedReport && (status === 'resolved' || status === 'reviewed')) {
         await supabaseClient.from('notifications').insert({
          user_id: updatedReport.reporter_id,
          actor_id: user?.uid,
          actor_name: 'Systeem Admin',
          type: 'system',
          content: `Jouw melding over ${updatedReport.target_type || 'een post'} is nu gemarkeerd als: ${status === 'resolved' ? 'Afgehandeld' : 'In Behandeling'}. Bedankt voor het melden!`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Error updating report status:', err);
      toast.error(`Fout bij bijwerken melding: ${err.message}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!isAdmin) {
      toast.error('Je hebt geen beheerdersrechten.');
      return;
    }
    try {
      const { error } = await supabaseClient
        .from('reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Melding is verwijderd.');
    } catch (err: any) {
      console.error('Error deleting report:', err);
      toast.error(`Fout bij verwijderen melding: ${err.message}`);
    }
  };

  const handleStartGroupConversation = async (selectedUsers: UserProfile[], groupName: string) => {
    if (!user || selectedUsers.length < 2) return;
    if (!checkRateLimit()) return;

    const participantUids = [user.uid, ...selectedUsers.map(u => u.id)];
    const participantNames: Record<string, string> = {
      [user.uid]: user.displayName || 'Me'
    };
    const participantPhotos: Record<string, string> = {
      [user.uid]: user.photoURL || ''
    };

    selectedUsers.forEach(u => {
      participantNames[u.id] = u.display_name;
      participantPhotos[u.id] = u.photo_url || '';
    });

    const newGroupConv = {
      participants: participantUids,
      participant_names: participantNames,
      participant_photos: participantPhotos,
      is_group: true,
      name: groupName,
      created_by: user.uid,
      updated_at: new Date().toISOString()
    };

    console.log('Starting group conversation with payload:', newGroupConv);

    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .insert(newGroupConv)
        .select();
        
      console.log('Group insert result:', { data, error });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Geen data teruggekregen van de server na aanmaken groep. Controleer RLS beleid.');
      }

      const createdConv = data[0];
      handleSetActiveConversation(createdConv);
      
      // Add to local list immediately
      setConversations(prev => {
        if (prev.some(c => c.id === createdConv.id)) return prev;
        return [createdConv, ...prev].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      });
      
      // Broadcast new conversation to all participants
      participantUids.forEach(uid => {
        if (uid === user.uid) return;
        const targetChannel = supabaseClient.channel(`conversations:${uid}`);
        targetChannel.send({
          type: 'broadcast',
          event: 'new_conversation',
          payload: createdConv
        });
      });

      setShowUserSearch(false);
      setUserSearchQuery('');
      setMobileChatView('chat');
      setView('messages');
      toast.success(`Groep "${groupName}" aangemaakt!`);
    } catch (err) {
      handleSupabaseError(err, 'groep starten', user, isAdmin);
    }
  };

  const handleStartConversation = async (targetUser: UserProfile | {id: string, display_name: string}) => {
    if (!user) return;
    
    // Check if target user is blocked
    const targetProfile = users.find(u => u.id === targetUser.id);
    if (targetProfile?.is_blocked === true || (targetUser as any).is_blocked === true) {
      toast.error('Deze gebruiker is geblokkeerd en kan geen privégesprek ontvangen.');
      return;
    }

    // Check if conversation already exists (1-on-1)
    const existing = conversations.find(c => !c.is_group && c.participants.length === 2 && c.participants.includes(targetUser.id));
    if (existing) {
      handleSetActiveConversation(existing);
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
      is_group: false,
      updated_at: new Date().toISOString()
    };

    console.log('Starting 1-on-1 conversation with payload:', newConv);

    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .insert(newConv)
        .select();
        
      console.log('1-on-1 insert result:', { data, error });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Geen data teruggekregen van de server. Controleer RLS beleid.');
      }

      const createdConv = data[0];
      handleSetActiveConversation(createdConv);
      
      // Add to local list immediately
      setConversations(prev => {
        if (prev.some(c => c.id === createdConv.id)) return prev;
        return [createdConv, ...prev].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      });
      
      // Broadcast new conversation to target user
      const targetChannel = supabaseClient.channel(`conversations:${targetUser.id}`);
      targetChannel.send({
        type: 'broadcast',
        event: 'new_conversation',
        payload: createdConv
      });

      setMobileChatView('chat');
      setView('messages');
    } catch (err) {
      handleSupabaseError(err, 'gesprek starten', user, isAdmin);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // 1. Mark as read
    if (!notif.is_read) {
      supabaseClient.from('notifications').update({ is_read: true }).eq('id', notif.id).then();
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    // 2. Direct Messages
    if (notif.type === 'dm') {
      setView('messages');
      const targetConv = conversationsRef.current.find(c => c.id === notif.resource_id) || conversations.find(c => c.id === notif.resource_id);
      if (targetConv) {
        handleSetActiveConversation(targetConv);
        setMobileChatView('chat');
      } else if (notif.actor_id) {
        handleStartConversation({ id: notif.actor_id, display_name: notif.actor_name });
      }
      return;
    }

    // 3. Media Feed (media uploads, likes ❤️, comments 💬 on media)
    if (
      notif.resource_id === 'media_feed' ||
      (notif as any).resource_type === 'media' ||
      notif.content?.includes('foto') ||
      notif.content?.includes('video') ||
      notif.content?.includes('GIF') ||
      notif.content?.includes('Media') ||
      notif.content?.includes('❤️') ||
      notif.content?.includes('💬')
    ) {
      setView('media_feed');
      fetchFeedMedia();
      return;
    }

    // 4. Follower Notification
    if (notif.type === 'follow' || notif.content?.includes('is je gaan volgen')) {
      const targetUid = notif.actor_id || (notif as any).sender_id;
      if (targetUid) {
        handleOpenProfile(targetUid);
      }
      return;
    }

    // 5. Forum Thread Notification (reply to thread, or mention in thread/comment)
    if (
      notif.resource_type === 'thread' || 
      notif.type === 'reply' || 
      (notif.resource_type === 'comment' && notif.resource_id)
    ) {
      setView('forum');
      if (notif.resource_id && notif.resource_id !== 'media_feed') {
        const existingThread = threadsRef.current.find(t => t.id === notif.resource_id) || threads.find(t => t.id === notif.resource_id);
        if (existingThread) {
          setActiveThread(existingThread);
        } else {
          try {
            const { data, error } = await supabaseClient
              .from('forum_threads')
              .select('*')
              .eq('id', notif.resource_id)
              .single();
            if (data && !error) {
              const threadObj: ForumThread = {
                ...data,
                title: decryptGeneralChat(data.title),
                content: decryptGeneralChat(data.content)
              };
              setActiveThread(threadObj);
            }
          } catch (e) {
            console.warn('Could not fetch thread for notification:', e);
          }
        }
      }
      return;
    }

    // 6. Community Chat Feed (Mentions or General posts)
    if (notif.resource_type === 'post' || notif.type === 'mention') {
      setView('chat');
      return;
    }

    // 7. System / Admin Reports
    if (notif.type === 'system') {
      if (isAdmin) {
        setView('settings');
        setSettingsTab('admin');
      }
      return;
    }

    // Default fallback
    setView('chat');
  };

  useEffect(() => {
    handleNotificationClickRef.current = handleNotificationClick;
  });

  const handleClearAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .delete()
        .eq('user_id', user.uid);
      
      if (error) throw error;
      setNotifications([]);
      try {
        secureLocalStorage.removeItem('cached_notifications');
      } catch (e) {}
      toast.success('Alle meldingen zijn gewist uit de database.');
    } catch (err: any) {
      console.error('Fout bij wissen van meldingen:', err);
      toast.error('Fout bij wissen van meldingen: ' + (err.message || err));
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .delete()
        .eq('id', notifId)
        .eq('user_id', user.uid);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.success('Melding verwijderd.');
    } catch (err: any) {
      console.error('Fout bij verwijderen melding:', err);
      toast.error('Fout bij verwijderen melding: ' + (err.message || err));
    }
  };

  const handleSaveHighScore = async (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout', score: number) => {
    if (!user || isWhitelisted !== true) return;
    
    const currentTheme = profile?.custom_theme || {};
    const gameHighScores = currentTheme.game_high_scores || {};
    
    const oldScore = gameHighScores[gameId] || 0;
    if (score <= oldScore) return;
    
    const updatedHighScores = {
      ...gameHighScores,
      [gameId]: score
    };
    
    const updatedTheme = {
      ...currentTheme,
      game_high_scores: updatedHighScores
    };
    
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          custom_theme: updatedTheme
        })
        .eq('id', user.uid);
        
      if (error) throw error;
      
      setProfile(prev => prev ? {
        ...prev,
        custom_theme: updatedTheme
      } : null);
      
      setCustomTheme(updatedTheme);
      secureLocalStorage.setItem('cached_customTheme', JSON.stringify(updatedTheme));
      
      toast.success(`🎉 Nieuw persoonlijk record opgeslagen voor ${gameId}: ${score}!`);
    } catch (err) {
      console.error('Error saving high score:', err);
    }
  };

  const handleShareHighScore = async (gameId: 'snake' | 'flappy' | 'sysadmin' | 'hamster' | 'conquest' | 'geometry' | 'breakout', score: number, targetType: 'general' | 'dm', conversationId?: string) => {
    if (!user || isWhitelisted !== true) return;
    
    const gameIdLabel = gameId;
    let playerName = (profile?.display_name || user.displayName || '').trim();
    if (!playerName || playerName === 'Anoniem') {
      if (user.displayName && user.displayName !== 'Anoniem') {
        playerName = user.displayName;
      } else if (user.email) {
        playerName = user.email.split('@')[0];
      } else {
        playerName = 'Gebruiker';
      }
    }
    
    const messageText = `[ARCADE_SCORE_SHARE:${gameIdLabel}:${score}:${playerName}]`;
    
    if (targetType === 'general') {
      try {
        const encryptedContent = encryptGeneralChat(messageText);
        const { data: insertData, error } = await supabaseClient.from('posts').insert({
          content: encryptedContent,
          author_id: user.uid,
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) throw error;
        
        if (insertData) {
          const decryptedPost = { ...insertData, content: messageText };
          setPosts(prev => [decryptedPost, ...prev].slice(0, 100));
          
          if (postsChannelRef.current) {
            postsChannelRef.current.send({
              event: 'new_post',
              payload: decryptedPost
            });
          }

          // Forward to Discord bot via secure Express API
          fetch('/api/bot/forward-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author_id: user.uid,
              author_name: profile?.display_name || user.displayName || 'Anoniem',
              content: encryptedContent,
              created_at: insertData.created_at
            })
          }).catch(err => console.error('Failed to forward arcade post to bot API:', err));
        }
        toast.success(`Highscore gedeeld in Algemene Chat! 🏆`);
      } catch (err) {
        toast.error('Kan highscore niet delen');
        console.error(err);
      }
    } else if (targetType === 'dm' && conversationId) {
      try {
        const encryptedText = encryptGeneralChat(messageText);
        const { data: insertedMsg, error: msgError } = await supabaseClient
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.uid,
            text: encryptedText,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (msgError) throw msgError;
        
        if (insertedMsg) {
          const localMsg = { ...insertedMsg, text: messageText };
          if (activeConversation && activeConversation.id === conversationId) {
            setMessages(prev => [localMsg, ...prev]);
          }
          
          setConversations(prev => prev.map(c => c.id === conversationId ? {
            ...c,
            last_message: messageText,
            last_message_sender_id: user.uid,
            updated_at: new Date().toISOString()
          } : c));
        }
        toast.success(`Highscore gedeeld in de privé-chat! 💌`);
      } catch (err) {
        toast.error('Kan highscore niet delen');
        console.error(err);
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const rawText = (customContent !== undefined ? customContent : messageInput).trim();
    if (!user || !rawText || !activeConversation || isWhitelisted !== true) return;
    
    const text = rawText;
    const hasUpload = text.includes('data:image/') || text.includes('data:audio/') || text.includes('data:video/');
    const maxAllowed = hasUpload ? 20000000 : MAX_CONTENT_LENGTH;
    if (text.length > maxAllowed) {
      toast.error(hasUpload ? "Bestand is te groot (maximaal 15MB)." : `Bericht is te lang (max ${MAX_CONTENT_LENGTH} tekens).`);
      return;
    }

    if (!checkRateLimit()) return;

    // Moderation check
    const moderation = await moderateContent(text);
    if (!moderation.allowed) {
      toast.error(moderation.reason || 'Je bericht is geblokkeerd vanwege negatieve uitlatingen over personen.', {
        icon: '🛡️',
        duration: 5000
      });
      return;
    }

    try {
      console.log('Attempting to send message:', { text, conversation_id: activeConversation.id });
      
      const encryptedText = encryptGeneralChat(text);
      let payloadText = encryptedText;

      const { data: insertedMsg, error: msgError } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.uid,
          text: payloadText,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (msgError) {
        console.error('Insert message error:', msgError);
        throw msgError;
      }
      
      console.log('Message sent successfully:', insertedMsg);
      logAudioEvent('system', 'success', `Bericht verzonden naar conversatie ${activeConversation.id}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      
      // Update local state immediately for better UX
      if (insertedMsg) {
        const localMsg = { ...insertedMsg, text: text }; // Use cleartext for the sender's local view
        setMessages(prev => {
          if (prev.some(m => m.id === localMsg.id)) return prev;
          return [localMsg, ...prev];
        });

        // Also update conversation in local list immediately
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === activeConversation.id);
          if (index === -1) return prev;
          const next = [...prev];
          next[index] = {
            ...next[index],
            last_message: text,
            last_message_sender_id: user.uid,
            updated_at: insertedMsg.created_at
          };
          return next.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
        });
      }

      // Broadcast new message to others
      if (messageChannelRef.current) {
        messageChannelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: insertedMsg
        });
      }

      // Targeted broadcast to each participant's personal conversations channel
      activeConversation.participants.forEach(participantId => {
        if (participantId === user.uid) return;
        const targetChannel = supabaseClient.channel(`conversations:${participantId}`);
        targetChannel.send({
          type: 'broadcast',
          event: 'conversation_update',
          payload: {
            id: activeConversation.id,
            last_message: payloadText,
            last_message_sender_id: user.uid,
            updated_at: insertedMsg.created_at
          }
        });
        
        // Also send new_message broadcast to their personal channel in case they have it open
        // but are on a different channel instance
        targetChannel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: insertedMsg
        });
      });

      setMessageInput('');

      // Send notifications to other participants
      activeConversation.participants.forEach(participantId => {
        if (participantId === user.uid) return;
        
        const payload = {
          user_id: participantId,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || undefined,
          type: 'dm',
          resource_id: activeConversation.id,
          resource_type: 'thread',
          content: text.substring(0, 100),
          is_read: false,
          created_at: new Date().toISOString()
        };
        console.log('Sending message notification payload:', JSON.stringify(payload, null, 2));
        logAudioEvent('system', 'success', `Notificatie verzonden naar ${participantId}: ${text.substring(0, 20)}...`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
        supabaseClient.from('notifications').insert(payload).then(({ error }) => {
          if (error) {
            console.error('Failed to send message notification', error);
            logAudioEvent('system', 'error', `Notificatie fout: ${error.message}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
          }
        });
      });

      // Update conversation metadata in background
      supabaseClient
        .from('conversations')
        .update({
          last_message: payloadText,
          last_message_sender_id: user.uid,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversation.id).then(); // fire and forgetish

      // Broadcast conversation update to others
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.send({
          type: 'broadcast',
          event: 'conversation_update',
          payload: {
            id: activeConversation.id,
            last_message: payloadText,
            last_message_sender_id: user.uid,
            updated_at: new Date().toISOString()
          }
        });
      }

      // Clear typing status
      if (isTyping && typingInId === activeConversation.id) {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      handleSupabaseError(err, 'bericht verzenden', user, isAdmin);
    }
  };

  useEffect(() => {
    if (user && isWhitelisted) {
      toast.success('Bedankt voor het gebruiken van FTJM forum', {
        description: 'Fijn dat je er weer bent!',
        duration: 5000,
      });
    }
  }, [user?.uid, isWhitelisted]);

  const handleEmojiSelect = (emoji: string) => {
    let currentInput = '';
    let setInput: (val: string) => void = () => {};

    if (activeMentionInput === 'post') {
      currentInput = postInput;
      setInput = setPostInput;
    } else if (activeMentionInput === 'comment') {
      currentInput = commentInput;
      setInput = setCommentInput;
    } else if (activeMentionInput === 'message') {
      currentInput = messageInput;
      setInput = setMessageInput;
    } else if (activeMentionInput === 'editPost') {
      currentInput = editPostInput;
      setInput = setEditPostInput;
    } else if (activeMentionInput === 'editMessage') {
      currentInput = editMessageInput;
      setInput = setEditMessageInput;
    }

    if (emojiPickerMode === 'suggestion') {
      const lastColon = currentInput.lastIndexOf(':');
      if (lastColon !== -1 && currentInput.length - lastColon < 20) {
        const newValue = currentInput.substring(0, lastColon) + emoji + ' ';
        setInput(newValue);
      } else {
        setInput(currentInput + emoji);
      }
    } else {
      setInput(currentInput + emoji);
    }
    setEmojiResults([]);
  };

  const handleEmojiButtonClick = (e: React.MouseEvent, type: 'post' | 'comment' | 'message' | 'editPost' | 'editMessage') => {
    setActiveMentionInput(type);
    setEmojiPickerMode('picker');
    setEmojiResults([EMOJI_LIST[0]]); // Just to trigger show
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setEmojiPosition({
      top: rect.top,
      left: rect.left
    });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, conversationId: string) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    // Mention detection
    const lastAt = value.lastIndexOf('@', cursorPosition - 1);
    if (lastAt !== -1) {
      const query = value.substring(lastAt + 1, cursorPosition);
      if (!query.includes(' ')) {
        setMentionSearch(query);
        const results = users.filter(u => 
          u.display_name?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setMentionResults(results);
        
        // Calculate position
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          top: rect.top,
          left: rect.left + 20 // Simple offset
        });
        
        // Determine which input is active
        if (conversationId === 'chat') setActiveMentionInput('post');
        else if (conversationId === 'forum') {
          if (activeThread) setActiveMentionInput('comment');
          else setActiveMentionInput('post');
        } else if (conversationId.startsWith('edit-post-')) setActiveMentionInput('editPost');
        else if (conversationId.startsWith('edit-msg-')) setActiveMentionInput('editMessage');
        else setActiveMentionInput('message');
      } else {
        setMentionResults([]);
      }
    } else {
      setMentionResults([]);
    }

    // Emoji detection
    const lastColon = value.lastIndexOf(':', cursorPosition - 1);
    if (lastColon !== -1) {
      const query = value.substring(lastColon + 1, cursorPosition);
      if (!query.includes(' ')) {
        setEmojiSearch(query);
        setEmojiPickerMode('suggestion');
        const results = EMOJI_LIST.filter(e => 
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 20);
        setEmojiResults(results);
        
        // Calculate position
        const rect = e.target.getBoundingClientRect();
        setEmojiPosition({
          top: rect.top,
          left: rect.left + 20
        });

        // Determine which input is active
        if (conversationId === 'chat') setActiveMentionInput('post');
        else if (conversationId === 'forum') {
          if (activeThread) setActiveMentionInput('comment');
          else setActiveMentionInput('post');
        } else if (conversationId.startsWith('edit-post-')) setActiveMentionInput('editPost');
        else if (conversationId.startsWith('edit-msg-')) setActiveMentionInput('editMessage');
        else setActiveMentionInput('message');
      } else {
        setEmojiResults([]);
      }
    } else {
      setEmojiResults([]);
    }

    const convertedValue = convertEmoticons(e.target.value);

    if (conversationId === 'forum') {
      if (activeThread) {
        setCommentInput(convertedValue);
      } else {
        setPostInput(convertedValue);
      }
    } else if (conversationId === 'chat') {
      setPostInput(convertedValue);
    } else if (conversationId.startsWith('edit-post-')) {
      setEditPostInput(convertedValue);
    } else if (conversationId.startsWith('edit-msg-')) {
      setEditMessageInput(convertedValue);
    } else {
      setMessageInput(convertedValue);
    }

    if (!user) return;

    const now = Date.now();
    
    if (!isTyping || typingInId !== conversationId || (now - lastTypingUpdateRef.current > 5000)) {
      setIsTyping(true);
      setTypingInId(conversationId);
      lastTypingUpdateRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingInId(null);
    }, 3000);
  };

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.toLowerCase();
    return users
      .filter(u => !u.is_blocked)
      .filter(u => 
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (nicknames[u.id] && nicknames[u.id].toLowerCase().includes(q))
      );
  }, [users, userSearchQuery, nicknames]);

  if (ddosLock.locked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 font-sans p-6 overflow-y-auto selection:bg-rose-500/30 selection:text-rose-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        
        <div className="relative max-w-sm w-full bg-zinc-900/60 border border-zinc-800 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
          
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-16 h-16 bg-zinc-850 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-500 shadow-xl">
              <ShieldAlert className="w-8 h-8 animate-[pulse_1.5s_infinite]" />
            </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 font-mono">
            GATEWAY BLOCK
          </h1>
          
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-full text-[9px] font-bold uppercase tracking-widest border border-rose-500/20 mb-5">
            <Bot className="w-3 h-3" />
            <span>{ddosLock.reason ? ddosLock.reason.split(':')[0] : "DDoS Shield Actief"}</span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal mb-5">
            {ddosLock.reason ? ddosLock.reason.split(':').slice(1).join(':').trim() || "Je verbinding is tijdelijk onder quarantine geplaatst om overbelasting te voorkomen." : "Hoge transactie-frequentie gedetecteerd. Je verbinding is tijdelijk onder quarantine geplaatst om overbelasting te voorkomen."}
          </p>

          <div className="w-full bg-zinc-950/80 rounded-2xl border border-zinc-850 p-4 mb-5 text-left font-mono text-[9px] space-y-1.5 text-zinc-500">
            <div className="flex justify-between border-b border-zinc-850/40 pb-1">
              <span>Status:</span>
              <span className="text-rose-400 font-bold">LOCKED_OUT</span>
            </div>
            <div className="flex justify-between">
              <span>Protectie:</span>
              <span className="text-emerald-400 font-bold">ANTI_FLOOD_V3</span>
            </div>
          </div>

          {/* Cooldown bar */}
          <div className="w-full mb-5">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
              <span>Quarantine afkoeling</span>
              <span className="text-white font-bold">{ddosLock.secondsLeft} seconden over</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(ddosLock.secondsLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          <HumanVerificationChallenge />

        </div>
      </div>
    );
  }

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
      {(isBlocked || isTempBanned || isHardwareBanned) && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950 flex items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md space-y-8"
          >
            <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center mx-auto mb-8 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="FTJM Logo" 
                className="w-full h-full object-cover scale-[1.35]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none">
                {isHardwareBanned ? 'Apparaat Verbannen' : isTempBanned ? 'Tijdelijk Geschorst' : 'Toegang Ontzegd'}
              </h1>
              <div className="h-1 w-20 bg-red-600 mx-auto rounded-full" />
              
              {isHardwareBanned ? (
                <div className="space-y-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-left">
                  <p className="text-zinc-300 font-medium text-sm">
                    Dit apparaat is permanent geblokkeerd en heeft geen toegang meer tot onze services.
                  </p>
                  <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500 uppercase font-black tracking-wider block">Reden:</span>
                      <span className="text-red-500 font-bold text-sm block mt-0.5">Ernstige of herhaaldelijke schending van de platformregels vanaf deze hardware.</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-zinc-500 uppercase font-black tracking-wider block">MAC ADRES:</span>
                      <span className="text-white font-mono text-sm block mt-0.5">
                        {rateLimiter.getDeviceFingerprint()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isTempBanned ? (
                <div className="space-y-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-left">
                  <p className="text-zinc-300 font-medium text-sm">
                    Je account is door een beheerder tijdelijk geschorst wegens overtreding van de platformregels.
                  </p>
                  <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500 uppercase font-black tracking-wider block">Reden:</span>
                      <span className="text-amber-500 font-bold text-sm block mt-0.5">{notesData.ban_reason || 'Geen specifieke reden opgegeven.'}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-zinc-500 uppercase font-black tracking-wider block">Duur tot:</span>
                      <span className="text-white font-mono text-sm block mt-0.5">
                        {notesData.banned_until ? new Date(notesData.banned_until).toLocaleString('nl-NL') : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-400 font-medium text-lg">Je account is permanent geblokkeerd door een beheerder wegens schending van de platformregels.</p>
              )}
            </div>
            <div className="pt-8 flex flex-col gap-4">
              <button 
                onClick={() => handleLogout()}
                className="px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-wide hover:bg-zinc-200 transition-all shadow-xl"
              >
                Sluiten / Uitloggen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Warning Overlay */}
      {!isBlocked && !isTempBanned && activeWarning && (
        <div className="fixed inset-0 z-[990] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-6 text-center animate-fadeIn">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-md bg-app-card rounded-[2.5rem] border border-amber-500/30 p-8 space-y-6 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient amber pulse background */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />

            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-app-ink uppercase tracking-tight">Officiële Waarschuwing</h1>
              <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest">Gezonden door: {activeWarning.admin_name || 'Beheerder'}</p>
              <div className="h-0.5 w-12 bg-amber-500 mx-auto rounded-full" />
            </div>

            <div className="bg-app-bg/60 border border-app-border rounded-2xl p-5 text-left space-y-4">
              <div>
                <span className="text-[9px] uppercase font-black text-app-muted block tracking-wider">Overtreding:</span>
                <span className="text-sm font-bold text-app-ink block mt-0.5">{activeWarning.reason}</span>
              </div>
              <div className="border-t border-app-border/50 pt-3">
                <span className="text-[9px] uppercase font-black text-app-muted block tracking-wider">Details & Toelichting:</span>
                <p className="text-xs text-app-ink leading-relaxed font-semibold mt-1 bg-app-card p-3 rounded-lg border border-app-border/40 max-h-[140px] overflow-y-auto custom-scrollbar">
                  {activeWarning.details}
                </p>
              </div>
              <div className="text-[8.5px] text-app-muted text-center pt-1 flex items-center justify-center gap-1">
                <span>📅 Ontvangen op:</span>
                <span>{new Date(activeWarning.date).toLocaleString('nl-NL')}</span>
              </div>
            </div>

            <p className="text-[10px] font-bold text-app-muted leading-snug">
              Je moet deze waarschuwing bevestigen om door te gaan naar de applicatie. Herhaaldelijke overtredingen leiden tot een tijdelijke of permanente ban.
            </p>

            <button 
              onClick={() => handleDismissWarning(activeWarning.id)}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Ik begrijp het & ga akkoord
            </button>
          </motion.div>
        </div>
      )}

      {/* Global Custom Wallpaper Layer */}
      {useCustomTheme && customTheme.wallpaper && (
        <div 
          className="fixed inset-0 -z-50 bg-cover bg-no-repeat transition-all duration-700 custom-wallpaper pointer-events-none"
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
          className={`border-b border-app-border sticky top-0 z-[100] transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass bg-app-card/75 backdrop-blur-md' : 'bg-app-card/90 backdrop-blur-md'}`}
          style={useCustomTheme ? { 
            backgroundColor: customTheme.glass_effect ? undefined : (customTheme.header_bg_color || undefined),
          } : {}}
        >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('chat')}>
              <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="FTJM Logo" 
                  className="w-full h-full object-cover scale-[1.35]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-semibold tracking-tight text-sm sm:text-base text-app-ink">FTJM Forum</span>
            </div>
            {user && isWhitelisted && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-app-accent rounded-full text-[10px] sm:text-xs font-medium text-app-muted">
                <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {websiteStatus}
              </div>
            )}
          </div>
          
          {user && isWhitelisted && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1 bg-app-accent p-1 rounded-xl">
                <button 
                  onClick={() => setView('chat')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'chat' ? 'bg-app-card text-app-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t("Chat")}
                </button>
                <button 
                  onClick={() => setView('messages')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'messages' ? 'bg-app-card text-app-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}`}
                >
                  <Mail className="w-4 h-4" />
                  {t("Berichten")}
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNavDropdown(!showNavDropdown);
                    if (!hasSeenMenu) {
                      setHasSeenMenu(true);
                      localStorage.setItem('has_seen_menu_v2.5', 'true');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${['forum', 'settings', 'news'].includes(view) ? 'bg-app-ink text-app-bg shadow-md' : 'bg-app-accent text-app-muted hover:text-app-ink'}`}
                >
                  <Settings className={`w-4 h-4 ${showNavDropdown ? 'rotate-90' : ''} transition-transform`} />
                  {t("Menu")}
                  <ChevronLeft className={`w-4 h-4 -rotate-90 transition-transform ${showNavDropdown ? 'rotate-90' : ''}`} />
                  {!hasSeenMenu && (
                    <motion.div 
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-app-card shadow-lg"
                    >
                      !
                    </motion.div>
                  )}
                </button>

                <AnimatePresence>
                  {showNavDropdown && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110]"
                        onClick={() => setShowNavDropdown(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-app-card border border-app-border rounded-2xl shadow-2xl z-[120] overflow-hidden p-2"
                      >
                        <div className="px-3 py-2 mb-1">
                          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide">{t("Navigatie")}</p>
                        </div>
                        <button 
                          onClick={() => { setView('forum'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'forum' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Layout className="w-4 h-4" />
                          {t("Community Forum")}
                        </button>
                        <button 
                          onClick={() => { 
                            setView('news'); 
                            setShowNavDropdown(false); 
                            if (!hasSeenNews) {
                              setHasSeenNews(true);
                              localStorage.setItem('has_seen_news_v2.5', 'true');
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative ${view === 'news' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Newspaper className="w-4 h-4" />
                          {t("Laatste Nieuws")}
                          {!hasSeenNews && (
                            <motion.div 
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="absolute right-3 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm"
                            >
                              !
                            </motion.div>
                          )}
                        </button>
                        <div className="h-px bg-app-border my-2 mx-2" />
                        <button 
                          onClick={() => { setView('settings'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Settings className="w-4 h-4" />
                          {t("Instellingen")}
                        </button>
                        <div className="h-px bg-app-border my-2 mx-2" />
                        <button 
                          onClick={() => { setView('arcade'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'arcade' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Gamepad2 className="w-4 h-4 text-cyan-500 animate-[pulse_2s_infinite]" />
                          {t("🕹️ Arcade (Geheim!)")}
                        </button>
                        <div className="h-px bg-app-border my-2 mx-2" />
                        <button 
                          onClick={() => { setView('audiologs'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'audiologs' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Volume2 className="w-4 h-4" />
                          {t("Audio Logs")}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {user && isWhitelisted && (
              <>
                <button 
                  onClick={() => setView('media_feed')}
                  className={`p-2 rounded-full transition-all group relative ${view === 'media_feed' ? 'bg-app-accent text-cyan-500' : 'hover:bg-app-accent text-app-muted hover:text-app-ink'}`}
                  title={t("Media Feed")}
                >
                  <Film className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-app-ink text-app-bg text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {t("Media Feed")}
                  </span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-app-accent rounded-full transition-colors text-app-muted hover:text-app-ink relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-app-card" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110]"
                        onClick={() => setShowNotifications(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-app-card border border-app-border rounded-2xl shadow-2xl z-[120] overflow-hidden"
                      >
                        <div className="p-3.5 border-b border-app-border flex items-center justify-between bg-app-accent/30">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-app-ink">Meldingen</h4>
                            {notifications.length > 0 && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-app-accent text-app-ink border border-app-border">
                                {notifications.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {notifications.some(n => !n.is_read) && (
                              <button 
                                onClick={async () => {
                                  const { error } = await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', user.uid);
                                  if (!error) setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                                }}
                                className="text-[10px] font-bold text-cyan-600 hover:text-cyan-500 hover:underline uppercase tracking-wider cursor-pointer"
                                title="Markeer alles als gelezen"
                              >
                                Gelezen
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button 
                                onClick={handleClearAllNotifications}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline uppercase tracking-wider cursor-pointer"
                                title="Wis al je meldingen definitief uit de Supabase database"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Alles wissen</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-app-border">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-8 h-8 text-app-muted mx-auto mb-2 opacity-20" />
                              <p className="text-xs text-app-muted font-medium">Geen meldingen</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  handleNotificationClick(notif);
                                  setShowNotifications(false);
                                }}
                                className={`w-full p-3.5 text-left hover:bg-app-accent/40 transition-colors flex items-start gap-3 group relative cursor-pointer ${!notif.is_read ? 'bg-app-accent/20' : ''}`}
                              >
                                <div className="w-8 h-8 rounded-full bg-app-accent flex-shrink-0 overflow-hidden mt-0.5">
                                  {notif.actor_photo ? (
                                    <img src={notif.actor_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-app-muted">
                                      {notif.actor_name?.[0] || 'M'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 pr-6">
                                  <p className="text-xs text-app-ink font-medium">
                                    <span className="font-bold">{nicknames[notif.actor_id] || notif.actor_name}</span> {
                                      notif.type === 'mention' ? 'heeft je genoemd' :
                                      notif.type === 'dm' ? 'stuurde je een bericht' :
                                      notif.type === 'reply' ? 'reageerde op je post' :
                                      'stuurde een melding'
                                    }
                                  </p>
                                  <p className="text-[10px] text-app-muted truncate mt-0.5 italic">"{notif.content}"</p>
                                  <p className="text-[8px] text-app-muted mt-1 uppercase font-bold tracking-widest">{formatDate(notif.created_at)}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 text-app-muted hover:text-red-500 rounded-lg absolute right-2.5 top-3 cursor-pointer"
                                  title="Melding wissen uit Supabase"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
            <button 
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 hover:bg-app-accent rounded-full transition-colors text-app-muted hover:text-app-ink relative"
              title="Toon Snelkoppelingen (Druk op ?)"
            >
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => {
                if (useCustomTheme) {
                  toast.error('Schakel eerst je Custom Thema uit om de standaard modus te wijzigen.');
                  return;
                }
                setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'enhanced' : 'light');
              }}
              className="p-2 hover:bg-app-accent rounded-full transition-colors text-app-muted hover:text-app-ink relative"
              title={useCustomTheme ? 'Thema vergrendeld door Custom Thema' : (theme === 'light' ? 'Donkere modus' : theme === 'dark' ? 'Enhanced modus' : 'Lichte modus')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : theme === 'dark' ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
              {useCustomTheme && (
                <div className="absolute -top-1 -right-1 bg-app-ink text-app-bg p-0.5 rounded-full border border-app-border">
                  <LockIcon className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div 
                  onClick={() => {
                    if (profile) {
                      setSelectedUser({
                        id: profile.id || user.uid,
                        display_name: profile.display_name || 'Anoniem',
                        email: profile.email || user.email || '',
                        photo_url: profile.photo_url || user.photoURL || '',
                        role: profile.role || 'user',
                        bio: profile.bio || '',
                        created_at: profile.created_at || new Date().toISOString(),
                        updated_at: profile.updated_at || new Date().toISOString(),
                        custom_theme: profile.custom_theme || {}
                      });
                    }
                  }}
                  className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-app-border cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                  title="Mijn Profiel bekijken"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium leading-none text-app-ink">{profile?.display_name || user.displayName || 'Anoniem'}</p>
                    <p className="text-xs text-app-muted mt-1">{user.email}</p>
                  </div>
                  {(profile?.photo_url || user.photoURL) ? (
                    <img 
                      src={profile?.photo_url || user.photoURL} 
                      alt={profile?.display_name || user.displayName || ''} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-app-border object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                      <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-app-muted" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-app-accent rounded-full transition-colors text-app-muted hover:text-app-ink"
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
      {user && maintenanceTimeLeft !== null && (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white border-b border-red-700 font-mono tracking-tight text-xs sm:text-sm py-2 px-4 shadow-md flex items-center justify-between z-[90] relative animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
            <span className="font-extrabold uppercase tracking-wide">Systeemmelding:</span>
            <span>Gepland onderhoud begint over <span className="font-extrabold text-[#fffb00] underline">{Math.floor(maintenanceTimeLeft / 60)}m {maintenanceTimeLeft % 60}s</span>! Sla je werk op.</span>
          </div>
          <div className="text-[10px] sm:text-xs font-bold uppercase select-none bg-black/25 px-2 py-0.5 rounded border border-white/20 whitespace-nowrap hidden sm:block">
            Kritieke Status
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      {user && isWhitelisted && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-app-card border-t border-app-border z-50 px-6 py-4 flex items-center justify-between shadow-lg">
          <button 
            onClick={() => setView('chat')}
            className={`flex flex-col items-center justify-center transition-all ${view === 'chat' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Chat"
          >
            <MessageSquare className={`w-7 h-7 ${view === 'chat' ? 'fill-zinc-900/10' : ''}`} />
          </button>
          <button 
            onClick={() => setView('forum')}
            className={`flex flex-col items-center justify-center transition-all ${view === 'forum' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Forum"
          >
            <Layout className={`w-7 h-7 ${view === 'forum' ? 'fill-app-ink/10' : ''}`} />
          </button>
          <button 
            onClick={() => setView('media_feed')}
            className={`flex flex-col items-center justify-center transition-all ${view === 'media_feed' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Media"
          >
            <Film className={`w-7 h-7 ${view === 'media_feed' ? 'fill-app-ink/10' : ''}`} />
          </button>
          <button 
            onClick={() => {
              setView('messages');
              setMobileChatView('list');
            }}
            className={`flex flex-col items-center justify-center transition-all ${view === 'messages' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Berichten"
          >
            <Mail className={`w-7 h-7 ${view === 'messages' ? 'fill-app-ink/10' : ''}`} />
          </button>
          <button 
            onClick={() => setView('news')}
            className={`flex flex-col items-center justify-center transition-all ${view === 'news' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Nieuws"
          >
            <Newspaper className={`w-7 h-7 ${view === 'news' ? 'fill-app-ink/10' : ''}`} />
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`flex flex-col items-center justify-center transition-all ${view === 'settings' ? 'text-app-ink scale-110' : 'text-app-muted hover:text-app-ink'}`}
            title="Instellingen"
          >
            <Settings className={`w-7 h-7 ${view === 'settings' ? 'fill-app-ink/10' : ''}`} />
          </button>
        </div>
      )}

      <main className={!user ? "" : (view === 'media_feed' && feedViewMode === 'swipe') ? "max-w-5xl mx-auto w-full px-2 sm:px-6 py-2 sm:py-6 pb-20 sm:pb-8" : "max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12"}>
        <AnimatePresence mode="wait">
          {!user ? (
            <>
              <LandingPage onLogin={handleLogin} websiteStatus={websiteStatus} />
              {sharedMediaId && (
                <PublicSharedMediaModal
                  mediaId={sharedMediaId}
                  onClose={() => {
                    setSharedMediaId(null);
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('media');
                      url.searchParams.delete('media_id');
                      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
                    } catch {}
                  }}
                  onLogin={handleLogin}
                />
              )}
            </>
          ) : isWhitelisted === null ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-app-ink animate-spin mb-4" />
              <p className="text-app-muted font-medium">Toegang controleren...</p>
            </div>
          ) : isWhitelisted === false ? (
            <motion.div 
              key="not-whitelisted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center py-20 px-6"
            >
              <div className="w-24 h-24 bg-transparent rounded-[2rem] flex items-center justify-center mx-auto mb-8 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="FTJM Logo" 
                  className="w-full h-full object-cover scale-[1.35]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-app-ink mb-4">Geen Toegang</h1>
              <div className="bg-app-card p-6 rounded-3xl border border-app-border shadow-sm mb-10">
                <p className="text-app-muted leading-relaxed mb-4">
                  Je account <span className="font-bold text-app-ink">{user.email}</span> staat momenteel niet op de whitelist van het <span className="font-bold text-app-ink">FTJM Besloten Forum</span>.
                </p>
                <div className="flex items-center gap-2 justify-center p-3 bg-app-accent rounded-xl text-xs font-bold text-app-muted uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  Toegang vereist goedkeuring
                </div>
              </div>
              <p className="text-sm text-app-muted mb-8">
                Neem contact op met de beheerder om toegang te krijgen.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
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
              <h1 className="text-4xl font-bold tracking-tight text-app-ink mb-4">Onderhoud</h1>
              <div className="bg-app-card p-6 rounded-3xl border border-app-border shadow-sm mb-10">
                <p className="text-app-muted leading-relaxed mb-4">
                  Het forum is momenteel in <span className="font-bold text-app-ink">{websiteStatus}</span>.
                </p>
                <div className="flex items-center gap-2 justify-center p-3 bg-app-accent rounded-xl text-xs font-bold text-app-muted uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  We zijn zo terug
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
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
              {/* Privacy Banner voor specifiek account */}
              {user && user.email && user.email.toLowerCase() === '137903@edu.singelland.nl' && (
                <div id="singelland-privacy-alert" className="mb-8 p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 text-app-ink rounded-[2rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-2xl shrink-0">
                      <ShieldCheck className="w-6 h-6 animate-[pulse_2s_infinite]" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wider text-emerald-600">🛡️ Privacy-Garantie Actief</p>
                      <p className="text-xs text-app-muted leading-relaxed mt-1">
                        Beste <span className="font-bold">{user.email}</span>, jouw privacy-instellingen zijn bekrachtigd. Om te voldoen aan jouw verzoek wordt er <span className="text-emerald-500 font-extrabold underline">geen telemetrie, IP-adres of apparaatdata</span> meer van jouw sessies verzameld. Bestaande logs zijn volledig gewist.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    Sessie Anoniem
                  </span>
                </div>
              )}
              {view === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <div 
                      className={`bg-app-card rounded-3xl p-8 border border-app-border shadow-sm sticky top-24 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-profile' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.profile_card_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                        borderColor: customTheme.profile_card_opacity === 100 ? 'transparent' : undefined,
                        boxShadow: customTheme.profile_card_opacity === 100 ? 'none' : undefined,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          {(profile?.photo_url || user.photoURL) ? (
                            <img 
                              src={profile?.photo_url || user.photoURL} 
                              alt={profile?.display_name || user.displayName || ''} 
                              className="w-24 h-24 rounded-3xl border-4 border-app-card shadow-md"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-3xl bg-app-accent flex items-center justify-center border border-app-border">
                              <UserIcon className="w-10 h-10 text-app-muted" />
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-app-ink">{profile?.display_name || user.displayName || 'Anoniem'}</h2>
                        <p className="text-app-muted text-sm mt-1">{user.email}</p>
                        
                        <div className="mt-8 w-full pt-8 border-t border-app-border space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-app-muted">Lid sinds</span>
                            <span className="text-app-ink font-medium">
                              {profile ? formatDate(profile.created_at) : '...'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-app-muted">Status</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex justify-between text-sm">
                              <span className="text-app-muted">Rol</span>
                              <span className="flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-1 rounded-md">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <ChatView 
                      user={user}
                      posts={filteredPosts}
                      isAdmin={isAdmin}
                      postInput={postInput}
                      setPostInput={setPostInput}
                      handleCreatePost={handleCreatePost}
                      handleTyping={handleTyping}
                      cooldownRemaining={cooldownRemaining}
                      sending={sending}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      typingStatuses={typingStatuses}
                      handleOpenProfile={handleOpenProfile}
                      handleOpenReport={handleOpenReport}
                      setEditingPostId={setEditingPostId}
                      setEditPostInput={setEditPostInput}
                      handleUpdatePost={handleUpdatePost}
                      handleDeletePost={handleDeletePost}
                      handleStartConversation={handleStartConversation}
                      editingPostId={editingPostId}
                      editPostInput={editPostInput}
                      saving={saving}
                      useCustomTheme={useCustomTheme}
                      customTheme={customTheme}
                      uploading={uploading}
                      handleEmojiButtonClick={handleEmojiButtonClick}
                      handleImageUrl={handleImageUrl}
                      nicknames={nicknames}
                      profiles={users}
                      userProfile={profile}
                    />
                  </div>
                </div>
              )}

              {view === 'media_feed' && (
                <div className={feedViewMode === 'swipe' ? "w-full flex justify-center items-center" : "max-w-6xl mx-auto py-4 sm:py-8 px-4"}>
                  {/* Hidden File Upload Input for Media Feed */}
                  <input 
                    type="file"
                    id="feed-media-upload"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleProfileMediaUpload}
                    disabled={profileMediaLoading}
                  />

                  {/* Upload Processing Overlay */}
                  {profileMediaLoading && (
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
                      <div className="p-5 bg-app-card border border-app-border rounded-3xl shadow-2xl flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                        <p className="text-xs text-app-ink font-bold tracking-wider uppercase">Bestand verwerken & uploaden...</p>
                      </div>
                    </div>
                  )}

                  {feedLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                      <p className="text-xs text-app-muted font-bold tracking-wider uppercase">Feed laden...</p>
                    </div>
                  ) : feedMedia.length === 0 ? (
                    <div className="text-center py-20 bg-app-card border border-app-border rounded-3xl p-8 max-w-lg mx-auto">
                      <Film className="w-12 h-12 text-app-muted mx-auto mb-3 opacity-20" />
                      <p className="text-sm text-app-muted font-medium italic">Nog geen media geüpload door de community.</p>
                      <button 
                        onClick={() => document.getElementById('feed-media-upload')?.click()} 
                        className="mt-4 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Upload eerste foto of video</span>
                      </button>
                    </div>
                  ) : feedViewMode === 'swipe' ? (
                    /* TikTok / YouTube Shorts Vertical Swipe View - Full Immersive View */
                    <div className="w-full flex items-center justify-center">
                      <MediaSwipeFeed
                        mediaList={feedMedia}
                        currentUserId={user?.uid}
                        onLike={handleLikeMedia}
                        onComment={handleCommentMedia}
                        onDeleteComment={handleDeleteCommentMedia}
                        onDeleteMedia={handleDeleteFeedMedia}
                        onOpenProfile={handleOpenProfile}
                        onViewFullscreen={setSelectedFullscreenMedia}
                        nicknames={nicknames}
                        isAdmin={isAdmin}
                        profiles={users}
                        onUploadClick={() => document.getElementById('feed-media-upload')?.click()}
                        onSwitchToGrid={() => {
                          setFeedViewMode('grid');
                          try { localStorage.setItem('ftjm_feed_view_mode', 'grid'); } catch {}
                        }}
                        onRefresh={fetchFeedMedia}
                        isUploading={profileMediaLoading}
                        initialMediaId={sharedMediaId}
                      />
                    </div>
                  ) : (
                    /* Classic Grid View */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-black text-app-ink flex items-center gap-2">
                            <Film className="w-7 h-7 text-cyan-500 animate-[pulse_2s_infinite]" />
                            Media Feed
                          </h3>
                          <p className="text-xs text-app-muted font-medium mt-1">
                            Ontdek foto's en video's gedeeld door de community
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                          {/* View Mode Toggle: Grid vs Shorts/Swipe */}
                          <div className="flex items-center bg-app-card border border-app-border p-1 rounded-2xl shadow-sm">
                            <button
                              onClick={() => {
                                setFeedViewMode('grid');
                                try { localStorage.setItem('ftjm_feed_view_mode', 'grid'); } catch {}
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-app-ink text-app-bg shadow-sm"
                              title="Grid Weergave (Overzicht)"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                              <span>Grid</span>
                            </button>
                            <button
                              onClick={() => {
                                setFeedViewMode('swipe');
                                try { localStorage.setItem('ftjm_feed_view_mode', 'swipe'); } catch {}
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all text-app-muted hover:text-app-ink"
                              title="Swipe / Shorts Weergave (TikTok / Reels Style)"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Shorts / Swipe</span>
                            </button>
                          </div>

                          <button 
                            onClick={fetchFeedMedia}
                            className="p-2.5 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-xl border border-app-border hover:scale-105 active:scale-95 transition-all shadow-sm"
                            title="Feed vernieuwen"
                          >
                            <RefreshCw className={`w-4 h-4 ${feedLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Share Media Box */}
                      {user && (
                        <div className="bg-app-card border border-app-border rounded-3xl p-5 mb-8 shadow-sm relative overflow-hidden transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-app-accent border border-app-border shrink-0">
                              {profile?.photo_url ? (
                                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <UserIcon className="w-5 h-5 text-app-muted" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-app-ink">Deel iets met de community!</h4>
                              <p className="text-[11px] text-app-muted font-medium mt-0.5">
                                Upload een foto of video (max. 5 seconden / 5MB) die direct in de feed verschijnt en autoplayed met audio.
                              </p>
                              
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => document.getElementById('feed-media-upload')?.click()}
                                  disabled={profileMediaLoading}
                                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-sm shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                  <span>Foto of Video uploaden</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grid View Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedMedia.map((media, idx) => (
                          <MediaFeedCard
                            key={media.id || idx}
                            media={media}
                            currentUserId={user?.uid}
                            onLike={handleLikeMedia}
                            onComment={handleCommentMedia}
                            onDeleteComment={handleDeleteCommentMedia}
                            onDeleteMedia={handleDeleteFeedMedia}
                            onOpenProfile={handleOpenProfile}
                            onViewFullscreen={setSelectedFullscreenMedia}
                            nicknames={nicknames}
                            isAdmin={isAdmin}
                            profiles={users}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {view === 'forum' && (
                <ForumView 
                  activeThread={activeThread}
                  setActiveThread={setActiveThread}
                  isCreatingThread={isCreatingThread}
                  setIsCreatingThread={setIsCreatingThread}
                  threadTitleInput={threadTitleInput}
                  setThreadTitleInput={setThreadTitleInput}
                  threadContentInput={threadContentInput}
                  setThreadContentInput={setThreadContentInput}
                  handleCreateThread={handleCreateThread}
                  threads={filteredThreads}
                  threadComments={threadComments}
                  commentInput={commentInput}
                  setCommentInput={setCommentInput}
                  handleCreateComment={handleCreateComment}
                  replyingToComment={replyingToComment}
                  setReplyingToComment={setReplyingToComment}
                  handleOpenThread={handleOpenThread}
                  nicknames={nicknames}
                  handleOpenProfile={handleOpenProfile}
                  sending={sending}
                  handleTyping={handleTyping}
                  handleEmojiButtonClick={handleEmojiButtonClick}
                  handleImageUrl={handleImageUrl}
                  uploading={uploading}
                  useCustomTheme={useCustomTheme}
                  customTheme={customTheme}
                  profiles={users}
                  userProfile={profile}
                />
              )}

              {view === 'messages' && (
                <MessagesView 
                  user={user}
                  profile={profile}
                  profiles={users}
                  conversations={filteredConversations}
                  activeConversation={activeConversation}
                  setActiveConversation={handleSetActiveConversation}
                  messages={messages}
                  messageInput={messageInput}
                  setMessageInput={setMessageInput}
                  handleSendMessage={handleSendMessage}
                  handleTyping={handleTyping}
                  handleEmojiButtonClick={handleEmojiButtonClick}
                  handleImageUrl={handleImageUrl}
                  typingStatuses={typingStatuses}
                  mobileChatView={mobileChatView}
                  setMobileChatView={setMobileChatView}
                  setShowUserSearch={setShowUserSearch}
                  onlineUsers={onlineUsers}
                  sending={sending}
                  useCustomTheme={useCustomTheme}
                  customTheme={customTheme}
                  onStartCall={voiceCall.initiateCall}
                  onStartVideoCall={(targetId, targetName, targetAvatar) => voiceCall.initiateCall(targetId, targetName, targetAvatar, true)}
                  onStartGroupCall={(roomId, roomName, isVideo) => groupVoiceCall.joinGroupCall(roomId, roomName, isVideo)}
                  groupVoiceCallActiveRooms={groupVoiceCallActiveRooms}
                  onEndCall={voiceCall.endCall}
                  activeCallUserId={activeCallUserId}
                  playSound={playSound}
                  onDeleteMessage={handleDeleteDirectMessage}
                  onEditMessage={handleUpdateDirectMessage}
                  onToggleHideConversation={handleToggleHideConversation}
                />
              )}

              {view === 'settings' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <div className="mb-8 font-primary">
                      <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">{t("Instellingen")}</h2>
                    <p className="text-app-muted font-medium text-sm">{t("Beheer je account en app voorkeuren")}</p>
                  </div>
                  
                  <SettingsView 
                    user={user}
                    profile={profile}
                    setProfile={setProfile}
                    settingsTab={settingsTab}
                    setSettingsTab={setSettingsTab}
                    isAdmin={isAdmin}
                    displayNameInput={displayNameInput}
                    setDisplayNameInput={setDisplayNameInput}
                    photoURLInput={photoURLInput}
                    setPhotoURLInput={setPhotoURLInput}
                    bioInput={bioInput}
                    setBioInput={setBioInput}
                    bannerURLInput={bannerURLInput}
                    setBannerURLInput={setBannerURLInput}
                    handleUpdateProfile={handleUpdateProfile}
                    handleUpdateNotifications={handleUpdateNotifications}
                    handleUpdateTheme={handleUpdateTheme}
                    handleResetToGoogle={handleResetToGoogle}
                    notificationSettings={notificationSettings}
                    setNotificationSettings={setNotificationSettings}
                    customSounds={customSounds}
                    newSoundName={newSoundName}
                    setNewSoundName={setNewSoundName}
                    newSoundUrl={newSoundUrl}
                    setNewSoundUrl={setNewSoundUrl}
                    handleAddCustomSound={handleAddCustomSound}
                    handleDeleteCustomSound={handleDeleteCustomSound}
                    playSound={playSound}
                    customTheme={customTheme}
                    setCustomTheme={setCustomTheme}
                    useCustomTheme={useCustomTheme}
                    setUseCustomTheme={setUseCustomTheme}
                    whitelist={whitelist}
                    whitelistInput={whitelistInput}
                    setWhitelistInput={setWhitelistInput}
                    handleAddWhitelist={handleAddToWhitelist}
                    handleRemoveWhitelist={handleRemoveFromWhitelist}
                    websiteStatus={websiteStatus}
                    statusInput={statusInput}
                    setStatusInput={setStatusInput}
                    handleUpdateStatus={handleUpdateStatus}
                    fetchAdminData={fetchAdminData}
                    users={users}
                    handleBlockUser={handleBlockUser}
                    handleLockUserField={handleLockUserField}
                    handleWarnUser={handleWarnUser}
                    handleTempBanUser={handleTempBanUser}
                    saving={saving}
                    uploadingSound={uploadingSound}
                    showInstallButton={deferredPrompt !== null}
                    handleInstallClick={handleInstallClick}
                    scheduledMaintenance={scheduledMaintenance}
                    maintenanceTimeLeft={maintenanceTimeLeft}
                    handleScheduleMaintenance={handleScheduleMaintenance}
                    handleCancelMaintenance={handleCancelMaintenance}
                    language={language}
                    onChangeLanguage={(lang) => {
                      setLanguageState(lang);
                      setLanguage(lang);
                      toast.success(lang === 'en' ? 'Language changed to English' : 'Taal gewijzigd naar Nederlands');
                    }}
                    reports={reports}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    onDeleteReport={handleDeleteReport}
                    onClearAllNotifications={handleClearAllNotifications}
                    notificationsCount={notifications.length}
                    conversations={conversations}
                    profiles={users}
                    hiddenConversationIds={hiddenConversationIds}
                    onToggleHideConversation={handleToggleHideConversation}
                    onUnhideAllConversations={handleUnhideAllConversations}
                  />
                </div>
              )}
              {view === 'audiologs' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)]">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">{t("Audio Logs")}</h2>
                    <p className="text-app-muted font-medium text-sm">{t("Overzicht van alle geluidsgebeurtenissen")}</p>
                  </div>
                  <div className="bg-app-card rounded-[2rem] border border-app-border p-6 shadow-sm h-full overflow-hidden flex flex-col">
                    <AudioLogsView />
                  </div>
                </div>
              )}
              {view === 'arcade' && (
                <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <GamesView 
                    userProfile={profile}
                    conversations={filteredConversations}
                    onSaveHighScore={handleSaveHighScore}
                    onShareHighScore={handleShareHighScore}
                  />
                </div>
              )}
              {view === 'news' && (
                <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">{t("Laatste Nieuws")}</h2>
                    <p className="text-app-muted font-medium text-sm">{t("Blijf op de hoogte van de laatste ontwikkelingen")}</p>
                  </div>
                  
                  <div className="space-y-6">
                    {NEWS_ITEMS.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setExpandedNewsId(expandedNewsId === item.id ? null : item.id)}
                        className={`bg-app-card rounded-3xl border border-app-border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${expandedNewsId === item.id ? 'ring-2 ring-app-ink' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-app-accent text-app-ink text-[10px] font-bold uppercase tracking-widest rounded-full">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
                            {item.date}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-app-ink mb-2">{item.title}</h3>
                        <p className={`text-app-muted leading-relaxed ${expandedNewsId === item.id ? '' : 'line-clamp-2'}`}>{item.content}</p>
                        {expandedNewsId !== item.id && (
                          <p className="mt-4 text-[10px] font-bold text-app-ink uppercase tracking-widest flex items-center gap-1">
                            Klik om meer te lezen <ArrowRight className="w-3 h-3" />
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <UserSearchModal 
          show={showUserSearch}
          onClose={() => setShowUserSearch(false)}
          searchQuery={userSearchQuery}
          setSearchQuery={setUserSearchQuery}
          users={users.filter(u => u.id !== user?.uid && !u.is_blocked)}
          onSelectUser={(u) => {
            handleStartConversation(u);
            setShowUserSearch(false);
          }}
          onStartGroup={handleStartGroupConversation}
          onlineUsers={onlineUsers}
        />

        {/* User Profile Modal */}
        <AnimatePresence>
          {selectedUser && (
            <div 
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-app-card rounded-[2.5rem] shadow-2xl border border-app-border overflow-y-auto max-h-[90vh] custom-scrollbar"
              >
                <div className="h-32 bg-app-ink relative overflow-hidden">
                  {(selectedUser.banner_url || selectedUser.custom_theme?.banner_url) ? (
                    <img 
                      src={selectedUser.banner_url || selectedUser.custom_theme?.banner_url} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-10">
                      <img 
                        src="/logo.png" 
                        alt="" 
                        className="w-64 h-64 -rotate-12 -translate-x-12 -translate-y-12"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="absolute top-6 right-6 p-3 bg-app-bg/20 hover:bg-app-bg/30 rounded-2xl transition-all text-app-bg backdrop-blur-md shadow-lg border border-app-bg/10 active:scale-95 z-10"
                    title="Sluiten"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="px-8 pb-8">
                  <div className="relative -mt-16 mb-6">
                    <div className="w-32 h-32 rounded-[2rem] bg-app-card p-2 shadow-xl border border-app-border">
                      <div className="w-full h-full rounded-[1.5rem] bg-app-accent flex items-center justify-center overflow-hidden border border-app-border">
                        {selectedUser.photo_url ? (
                          <img src={selectedUser.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon className="w-12 h-12 text-app-muted" />
                        )}
                      </div>
                    </div>
                    {(selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                      <div className="absolute bottom-2 left-24 bg-red-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-app-card" title="Administrator">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-app-ink tracking-tight flex items-center gap-1.5 flex-wrap">
                            <span>{selectedUser.display_name}</span>
                            {isVerifiedEmail(selectedUser) && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 select-none shadow-[0_0_8px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                                <Check className="w-3.5 h-3.5 stroke-[4]" />
                              </span>
                            )}
                            {isBetaTester(selectedUser) && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                <FlaskConical className="w-3 h-3 stroke-[2.5]" />
                                <span>Beta Tester</span>
                              </span>
                            )}
                            {(selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                              <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-1 rounded-md select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                                <ShieldCheck className="w-4 h-4 text-red-400 stroke-[2.5]" />
                              </span>
                            )}
                          </h3>
                        </div>
                        {onlineUsers.has(selectedUser.id) ? (
                          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-app-accent text-app-muted rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-app-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-app-muted/30"></span>
                            Offline
                          </div>
                        )}
                      </div>
                      {selectedUser.original_name && selectedUser.original_name !== selectedUser.display_name && (
                        <p className="text-sm text-app-muted font-medium mt-1">Oorspronkelijke naam: {selectedUser.original_name}</p>
                      )}
                      <p className="text-xs text-app-muted font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Lid sinds {formatDate(selectedUser.created_at)}
                      </p>

                      {/* Followers & Following Stats and Button */}
                      <div className="flex flex-col gap-3 mt-4 border-t border-app-border/40 pt-4">
                        <div className="flex items-center gap-4 text-sm bg-app-accent/25 p-3 sm:p-4 rounded-2xl border border-app-border/40">
                          <button 
                            type="button"
                            onClick={() => {
                              if (selectedUserFollowers.length > 0) {
                                setShowFollowersModal(true);
                              } else {
                                toast.info("Deze gebruiker heeft nog geen volgers.");
                              }
                            }} 
                            className="hover:underline text-app-ink font-bold flex items-center gap-1.5 cursor-pointer flex-1 justify-center py-1 rounded-xl hover:bg-app-accent/40 transition-all select-none animate-none"
                          >
                            <span className="text-cyan-500 font-extrabold text-lg">{selectedUserFollowers.length}</span> 
                            <span className="text-app-muted font-medium text-xs">Volgers</span>
                          </button>
                          <div className="w-px h-6 bg-app-border/60" />
                          <button 
                            type="button"
                            onClick={() => {
                              const count = (selectedUser.custom_theme?.following || []).length;
                              if (count > 0) {
                                setShowFollowingModal(true);
                              } else {
                                toast.info("Deze gebruiker volgt nog niemand.");
                              }
                            }} 
                            className="hover:underline text-app-ink font-bold flex items-center gap-1.5 cursor-pointer flex-1 justify-center py-1 rounded-xl hover:bg-app-accent/40 transition-all select-none animate-none"
                          >
                            <span className="text-cyan-500 font-extrabold text-lg">{(selectedUser.custom_theme?.following || []).length}</span> 
                            <span className="text-app-muted font-medium text-xs">Volgend</span>
                          </button>
                        </div>

                        {user && user.uid !== selectedUser.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(selectedUser.id)}
                            disabled={followLoading}
                            className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border select-none ${
                              profile?.custom_theme?.following?.includes(selectedUser.id)
                                ? 'bg-app-accent border-app-border/50 text-app-ink hover:bg-app-border/30' 
                                : 'bg-app-ink text-app-bg border-transparent hover:opacity-95'
                            }`}
                          >
                            {followLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                            ) : profile?.custom_theme?.following?.includes(selectedUser.id) ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500 font-black" />
                                <span>✓ Volgend</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>Volg deze persoon</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedUser.bio ? (
                      <div className="p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3">Over mij</label>
                        <p className="text-app-ink leading-relaxed font-medium">{selectedUser.bio}</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-app-accent/20 rounded-3xl border border-app-border border-dashed flex flex-col items-center justify-center text-center py-10 text-app-muted">
                        <p className="text-sm font-medium italic">Geen bio beschikbaar</p>
                      </div>
                    )}

                    {/* Media Galerij (Foto's & GIFs) */}
                    <div className="p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest">
                          Media Galerij ({profileMedia.length}/10)
                        </label>
                        {user && user.uid === selectedUser.id && profileMedia.length < 10 && (
                          <div className="flex gap-2">
                            {/* Photo upload button */}
                            <input 
                              type="file"
                              id="profile-media-upload"
                              className="hidden"
                              accept="image/*,video/*"
                              onChange={handleProfileMediaUpload}
                              disabled={profileMediaLoading}
                            />
                            <button
                              onClick={() => document.getElementById('profile-media-upload')?.click()}
                              disabled={profileMediaLoading}
                              className="p-1.5 bg-app-card hover:bg-app-accent border border-app-border rounded-lg text-app-ink transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              title="Foto of Video uploaden"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {profileMediaLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                        </div>
                      ) : profileMedia.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-app-border rounded-2xl">
                          <p className="text-xs text-app-muted font-medium italic">Nog geen media geüpload</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {profileMedia.map((media, idx) => (
                            <div key={media.id || idx} className="group relative aspect-square rounded-xl overflow-hidden border border-app-border bg-app-bg">
                              {media.media_type === 'video' ? (
                                <video 
                                  src={media.media_url} 
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedFullscreenMedia(media.media_url)}
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img 
                                  src={media.media_url} 
                                  alt="" 
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedFullscreenMedia(media.media_url)}
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {user && user.uid === selectedUser.id && (
                                <button
                                  onClick={() => handleDeleteProfileMedia(media.id, media.media_url)}
                                  className="absolute top-1 right-1 p-1 bg-red-500/85 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                                  title="Verwijderen"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-[7px] font-black text-white uppercase rounded tracking-widest">
                                {media.media_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {user && user.uid !== selectedUser.id && (
                      <div className="p-6 bg-app-accent/30 rounded-3xl border border-app-border">
                        <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3">Persoonlijke Bijnaam</label>
                        {isEditingNickname ? (
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={nicknameInput}
                              onChange={(e) => setNicknameInput(convertEmoticons(e.target.value))}
                              placeholder="Geef deze persoon een bijnaam..."
                              className="flex-1 p-3 bg-app-bg border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink outline-none font-bold text-app-ink"
                              autoFocus
                            />
                            <button 
                              onClick={() => {
                                handleSetNickname(selectedUser.id, nicknameInput);
                                setIsEditingNickname(false);
                              }}
                              className="p-3 bg-app-ink text-app-bg rounded-xl hover:opacity-90 transition-all"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setIsEditingNickname(false)}
                              className="p-3 bg-app-accent text-app-muted rounded-xl hover:text-app-ink transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-app-ink font-bold">
                              {nicknames[selectedUser.id] || <span className="text-app-muted font-normal italic">Geen bijnaam ingesteld</span>}
                            </p>
                            <button 
                              onClick={() => {
                                setNicknameInput(nicknames[selectedUser.id] || '');
                                setIsEditingNickname(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-app-card border border-app-border text-app-ink rounded-xl text-xs font-bold hover:bg-app-accent transition-all shadow-sm"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {nicknames[selectedUser.id] ? 'Aanpassen' : 'Instellen'}
                            </button>
                          </div>
                        )}
                        <p className="text-[9px] text-app-muted mt-3 italic">
                          * Deze bijnaam is alleen voor jou zichtbaar en wordt overal in de app gebruikt.
                        </p>
                      </div>
                    )}

                    {/* ADMIN ACTION PANEL IN PROFILE POPUP */}
                    {isAdmin && user && user.uid !== selectedUser.id && (
                      <div className="p-6 bg-amber-500/10 border border-amber-500/25 rounded-3xl space-y-4">
                        <label className="block text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1.5 border-b border-amber-500/20 pb-2">
                          <LockIcon className="w-3 h-3 text-amber-500 inline" /> Beheerder Acties
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center text-xs font-bold leading-normal">
                          <button
                            onClick={async () => {
                              await handleBlockUser(selectedUser.id, !selectedUser.is_blocked);
                              setSelectedUser(prev => prev ? { ...prev, is_blocked: !prev.is_blocked } : null);
                            }}
                            disabled={saving}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all w-full select-none ${
                              saving ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              selectedUser.is_blocked 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-605 shadow-md active:scale-95' 
                                : 'bg-red-500 text-white hover:bg-red-610 shadow-md active:scale-95'
                            }`}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : selectedUser.is_blocked ? (
                              <>Deblokkeren</>
                            ) : (
                              <>Blokkeren</>
                            )}
                          </button>

                          <button
                            onClick={async () => {
                              const isLocked = !!(selectedUser.name_locked_until && new Date(selectedUser.name_locked_until) > new Date());
                              await handleLockUserField(selectedUser.id, 'name', !isLocked);
                              setSelectedUser(prev => prev ? { 
                                ...prev, 
                                name_locked_until: !isLocked ? '9999-12-31T23:59:59.000Z' : null 
                              } : null);
                            }}
                            disabled={saving}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all w-full select-none ${
                              saving ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              selectedUser.name_locked_until && new Date(selectedUser.name_locked_until) > new Date()
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md active:scale-95'
                                : 'bg-app-accent border border-app-border text-app-ink hover:bg-app-accent/70 active:scale-95'
                            }`}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : selectedUser.name_locked_until && new Date(selectedUser.name_locked_until) > new Date() ? (
                              <>Naam Ontgrendelen</>
                            ) : (
                              <>Naam Vergrendelen</>
                            )}
                          </button>

                          <button
                            onClick={async () => {
                              const isLocked = !!(selectedUser.bio_locked_until && new Date(selectedUser.bio_locked_until) > new Date());
                              await handleLockUserField(selectedUser.id, 'bio', !isLocked);
                              setSelectedUser(prev => prev ? { 
                                ...prev, 
                                bio_locked_until: !isLocked ? '9999-12-31T23:59:59.000Z' : null 
                              } : null);
                            }}
                            disabled={saving}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all w-full sm:col-span-2 select-none ${
                              saving ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              selectedUser.bio_locked_until && new Date(selectedUser.bio_locked_until) > new Date()
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md active:scale-95'
                                : 'bg-app-accent border border-app-border text-app-ink hover:bg-app-accent/70 active:scale-95'
                            }`}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : selectedUser.bio_locked_until && new Date(selectedUser.bio_locked_until) > new Date() ? (
                              <>Bio Ontgrendelen</>
                            ) : (
                              <>Bio Vergrendelen</>
                            )}
                          </button>
                        </div>
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
                            className="flex-1 p-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Mail className="w-5 h-5" />
                            Bericht
                          </button>
                          
                          {(() => {
                            const isCurrentPeer = activeCallUserId && selectedUser.id === activeCallUserId;
                            
                            return (
                              <button 
                                onClick={() => {
                                  if (isCurrentPeer) {
                                    voiceCall.endCall();
                                  } else {
                                    voiceCall.initiateCall(selectedUser.id, selectedUser.display_name, selectedUser.photo_url || undefined);
                                    setSelectedUser(null);
                                  }
                                }}
                                className={`flex-1 p-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
                                  isCurrentPeer 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                }`}
                              >
                                {isCurrentPeer ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                {isCurrentPeer ? 'Ophangen' : 'Bellen'}
                              </button>
                            );
                          })()}

                          <button 
                            onClick={() => {
                              handleOpenReport('user', selectedUser.id, selectedUser.id, selectedUser.display_name);
                              setSelectedUser(null);
                            }}
                            className="p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-all active:scale-[0.98] border border-red-500/20"
                            title="Rapporteer"
                          >
                            <Flag className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-app-border">
                      <button 
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="w-full p-4 bg-app-accent text-app-muted rounded-2xl font-bold hover:text-app-ink transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Sluiten
                      </button>
                    </div>
                  </div>
                </div>

                {/* Followers Sheet Overlay */}
                <AnimatePresence>
                  {showFollowersModal && (
                    <motion.div 
                      initial={{ opacity: 0, y: '100%' }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="absolute inset-0 bg-app-card rounded-[2.5rem] p-6 flex flex-col z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
                        <div>
                          <h4 className="font-black text-app-ink text-xl tracking-tight">Volgers</h4>
                          <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider mt-0.5">
                            {selectedUserFollowers.length} gebruikers volgen {selectedUser.display_name}
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowFollowersModal(false);
                            setFollowersSearchQuery('');
                          }}
                          className="p-1.5 hover:bg-app-accent rounded-xl text-app-muted hover:text-app-ink transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="mb-4">
                        <input 
                          type="text"
                          placeholder="Zoek volgers..."
                          value={followersSearchQuery}
                          onChange={(e) => setFollowersSearchQuery(e.target.value)}
                          className="w-full bg-app-bg text-xs font-medium text-app-ink rounded-xl border border-app-border px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                        {filteredFollowers.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-xs text-app-muted italic font-medium">Geen volgers gevonden</p>
                          </div>
                        ) : (
                          filteredFollowers.map((follower) => {
                            const isFollowerVerified = isVerifiedEmail(follower);
                            const isFollowerBeta = isBetaTester(follower);
                            const isFollowerAdmin = follower.role === 'admin' || follower.email?.toLowerCase() === 'markohoksen@gmail.com';
                            return (
                              <div 
                                key={follower.id}
                                onClick={() => {
                                  setSelectedUser(follower);
                                  setShowFollowersModal(false);
                                  setFollowersSearchQuery('');
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-app-accent/50 rounded-2xl cursor-pointer transition-all border border-app-border/20 hover:border-app-border/60 hover:scale-[1.01] active:scale-95 group/item"
                              >
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-app-accent flex-shrink-0 border border-app-border">
                                  {follower.photo_url ? (
                                    <img src={follower.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <UserIcon className="w-5 h-5 text-app-muted" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm text-app-ink truncate group-hover/item:text-cyan-500 transition-colors">
                                      {follower.display_name}
                                    </p>
                                    {isFollowerVerified && (
                                      <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.4)]" title="Geverifieerd Account">
                                        <Check className="w-2 h-2 stroke-[4]" />
                                      </span>
                                    )}
                                    {isFollowerBeta && (
                                      <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                        <FlaskConical className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                                      </span>
                                    )}
                                    {isFollowerAdmin && (
                                      <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                                        <ShieldCheck className="w-3 h-3 text-red-400 stroke-[2.5]" />
                                      </span>
                                    )}
                                  </div>
                                  {follower.bio ? (
                                    <p className="text-[10px] text-app-muted truncate mt-0.5">{follower.bio}</p>
                                  ) : (
                                    <p className="text-[10px] text-app-muted italic truncate mt-0.5">Geen bio</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Following Sheet Overlay */}
                <AnimatePresence>
                  {showFollowingModal && (
                    <motion.div 
                      initial={{ opacity: 0, y: '100%' }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="absolute inset-0 bg-app-card rounded-[2.5rem] p-6 flex flex-col z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
                        <div>
                          <h4 className="font-black text-app-ink text-xl tracking-tight">Volgend</h4>
                          <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider mt-0.5">
                            {selectedUser.display_name} volgt {selectedUserFollowing.length} gebruikers
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowFollowingModal(false);
                            setFollowingSearchQuery('');
                          }}
                          className="p-1.5 hover:bg-app-accent rounded-xl text-app-muted hover:text-app-ink transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="mb-4">
                        <input 
                          type="text"
                          placeholder="Zoek volgend..."
                          value={followingSearchQuery}
                          onChange={(e) => setFollowingSearchQuery(e.target.value)}
                          className="w-full bg-app-bg text-xs font-medium text-app-ink rounded-xl border border-app-border px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                        {filteredFollowing.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-xs text-app-muted italic font-medium">Geen volgend gevonden</p>
                          </div>
                        ) : (
                          filteredFollowing.map((followed) => {
                            const isFollowedVerified = isVerifiedEmail(followed);
                            const isFollowedBeta = isBetaTester(followed);
                            const isFollowedAdmin = followed.role === 'admin' || followed.email?.toLowerCase() === 'markohoksen@gmail.com';
                            return (
                              <div 
                                key={followed.id}
                                onClick={() => {
                                  setSelectedUser(followed);
                                  setShowFollowingModal(false);
                                  setFollowingSearchQuery('');
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-app-accent/50 rounded-2xl cursor-pointer transition-all border border-app-border/20 hover:border-app-border/60 hover:scale-[1.01] active:scale-95 group/item"
                              >
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-app-accent flex-shrink-0 border border-app-border">
                                  {followed.photo_url ? (
                                    <img src={followed.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <UserIcon className="w-5 h-5 text-app-muted" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm text-app-ink truncate group-hover/item:text-cyan-500 transition-colors">
                                      {followed.display_name}
                                    </p>
                                    {isFollowedVerified && (
                                      <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.4)]" title="Geverifieerd Account">
                                        <Check className="w-2 h-2 stroke-[4]" />
                                      </span>
                                    )}
                                    {isFollowedBeta && (
                                      <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                        <FlaskConical className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                                      </span>
                                    )}
                                    {isFollowedAdmin && (
                                      <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                                        <ShieldCheck className="w-3 h-3 text-red-400 stroke-[2.5]" />
                                      </span>
                                    )}
                                  </div>
                                  {followed.bio ? (
                                    <p className="text-[10px] text-app-muted truncate mt-0.5">{followed.bio}</p>
                                  ) : (
                                    <p className="text-[10px] text-app-muted italic truncate mt-0.5">Geen bio</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fullscreen Media Viewer */}
        <AnimatePresence>
          {selectedFullscreenMedia && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <button 
                onClick={() => setSelectedFullscreenMedia(null)}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 z-50"
                title="Sluiten"
              >
                <X className="w-6 h-6" />
              </button>
              {selectedFullscreenMedia.startsWith('data:video/') || 
               selectedFullscreenMedia.endsWith('.mp4') || 
               selectedFullscreenMedia.endsWith('.mov') || 
               selectedFullscreenMedia.endsWith('.webm') ? (
                <video 
                  src={selectedFullscreenMedia} 
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl"
                />
              ) : (
                <img 
                  src={selectedFullscreenMedia} 
                  alt="Fullscreen Preview" 
                  className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              )}
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
                className="relative w-full max-w-md bg-app-card rounded-[2.5rem] shadow-2xl border border-app-border overflow-hidden"
              >
                <div className="p-8 border-b border-app-border bg-red-500/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="font-bold text-xl tracking-tight text-app-ink">
                        Rapporteer {reportTarget.type === 'user' ? 'Gebruiker' : reportTarget.type === 'post' ? 'Post' : 'Bericht'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setReportTarget(null)}
                      className="p-2 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-app-bg rounded-2xl border border-app-border shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-app-accent flex items-center justify-center overflow-hidden border border-app-border">
                      <UserIcon className="w-6 h-6 text-app-muted" />
                    </div>
                    <div>
                      <p className="font-bold text-app-ink">{reportTarget.displayName}</p>
                      <p className="text-[10px] text-app-muted font-bold uppercase tracking-widest mt-1">ID: {reportTarget.id.substring(0, 12)}...</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleReport} className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 ml-1">Reden van rapportage</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      className="w-full p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all outline-none font-medium appearance-none text-app-ink"
                    >
                      <option value="" className="text-app-ink">Selecteer een reden...</option>
                      <option value="spam" className="text-app-ink">Spam of ongewenste reclame</option>
                      <option value="harassment" className="text-app-ink">Intimidatie of pesten</option>
                      <option value="hate_speech" className="text-app-ink">Haatzaaiende uitlatingen</option>
                      <option value="inappropriate" className="text-app-ink">Ongepaste inhoud</option>
                      <option value="impersonation" className="text-app-ink">Impersonatie</option>
                      <option value="other" className="text-app-ink">Anders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 ml-1">Details (optioneel)</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(convertEmoticons(e.target.value))}
                      placeholder="Geef meer context over de situatie..."
                      rows={4}
                      className="w-full p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all outline-none font-medium resize-none text-app-ink placeholder:text-app-muted/50"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setReportTarget(null)}
                      className="flex-1 p-4 bg-app-accent text-app-muted rounded-2xl font-bold hover:text-app-ink transition-all active:scale-[0.98]"
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
        
        <VoiceCallUI 
          {...voiceCall} 
        />

        <GroupVoiceCallUI
          state={groupVoiceCall.groupCallState}
          participants={groupVoiceCall.groupParticipants}
          isMuted={groupVoiceCall.isGroupMuted}
          isVideoCall={groupVoiceCall.isVideoCall}
          isVideoMuted={groupVoiceCall.isVideoMuted}
          localStream={groupVoiceCall.localStream}
          leaveCall={groupVoiceCall.leaveGroupCall}
          toggleMute={groupVoiceCall.toggleGroupMute}
          toggleVideo={groupVoiceCall.toggleGroupVideo}
          roomName={groupVoiceCall.roomName}
          user={user}
        />
      </main>
        <AnimatePresence>
          {showAdminPrank && (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col p-4 font-mono text-emerald-500 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {adminPrankLogs.map((log, i) => (
                  <div key={i} className="text-sm">
                    <span className="opacity-50">{log.split(']')[0]}]</span>
                    {log.split(']')[1]}
                  </div>
                ))}
                <div className="animate-pulse">_</div>
              </div>
              
              <div className="fixed inset-0 pointer-events-none flex flex-wrap gap-4 p-10 overflow-hidden">
                {fakeErrors.map((err, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-red-600 text-white p-4 rounded-xl shadow-2xl h-fit max-w-xs border-2 border-white/20"
                  >
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-tight italic">
                      <AlertCircle className="w-5 h-5" />
                      System Failure
                    </div>
                    <p className="text-xs font-bold">{err}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showWhatsNew && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gradient-to-b from-[#003b68] to-[#00213b] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-cyan-500/20 overflow-hidden relative"
              >
                {/* Visual design embellishments */}
                <div className="absolute top-0 right-0 w-[220px] h-[220px] bg-cyan-400/10 rounded-full blur-[45px] pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />

                <div className="relative p-8 sm:p-10 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                          V2.5.0 Update
                        </h2>
                        <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest mt-1">
                          DESKTOP APP, 4MB UPLOADS & AUDIO REFRESH
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-3 py-1">
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                        <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">4 MB Uploadlimiet</h4>
                          <p className="text-xs text-blue-100/70 mt-1">
                            De limiet voor alle bestanden, foto's, profielfoto's, achtergronden en audio is verdubbeld naar maar liefst 4 MB.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                        <Monitor className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Officiële Desktop App (v1.3.1)</h4>
                          <p className="text-xs text-blue-100/70 mt-1">
                            FTJM herkent nu automatisch je besturingssysteem (macOS, Windows, Linux) en biedt een directe downloadlink naar de officiële standalone release.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                        <Volume2 className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Nieuwe Audio & Beltonen</h4>
                          <p className="text-xs text-blue-100/70 mt-1">
                            Volledig vernieuwde bibliotheek met moderne geluidseffecten (o.a. Fears to Fathom, 007 Sound) en beltonen (Skype New, iPhone Remixes).
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Geverifieerde Badges & Optimalisaties</h4>
                          <p className="text-xs text-blue-100/70 mt-1">
                            Duidelijke badges voor officiële en geverifieerde accounts, snellere laadtijden en verbeterde sessiebeveiliging.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Navigation bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="w-[10px]" />
                    <button
                      onClick={() => {
                        setShowWhatsNew(false);
                        localStorage.setItem('has_seen_whats_new_v2.5', 'true');
                      }}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                    >
                      Aan de slag!
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <MentionOverlay 
          show={mentionResults.length > 0}
          results={mentionResults}
          position={mentionPosition}
          onSelect={handleSelectMention}
          onClose={() => setMentionResults([])}
        />

        <EmojiOverlay 
          show={emojiResults.length > 0}
          results={emojiResults}
          position={emojiPosition}
          onSelect={handleEmojiSelect}
          onClose={() => setEmojiResults([])}
          mode={emojiPickerMode}
        />

        <AnimatePresence>
          {isAuthModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 25 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 25 }}
                className="bg-gradient-to-b from-[#003b68] to-[#00213b] border-2 border-white/10 w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden"
              >
                {/* Visual Revamp: Glowing Ambient Circles */}
                <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-gradient-to-tr from-blue-600/15 to-transparent rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-cyan-400/5 rounded-full blur-[80px] pointer-events-none" />

                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center mb-8 relative z-10">
                  {/* Glowing logo badge */}
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] p-2 flex items-center justify-center mb-4 overflow-hidden border border-white/10 shadow-lg shadow-black/35 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src="/logo.png" 
                      alt="FTJM Logo" 
                      className="w-full h-full object-cover scale-[1.35] relative z-10"
                    />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter text-center leading-none">
                    {isRegisterMode 
                      ? 'Account Registreren' 
                      : authStep === 'password'
                        ? 'Wachtwoord Invoeren'
                        : 'Inloggen'}
                  </h3>
                  <p className="text-xs text-cyan-300 font-extrabold mt-1.5 uppercase tracking-widest text-center">
                    {isRegisterMode 
                      ? 'Sluit je aan bij FTJM Network' 
                      : authStep === 'password'
                        ? 'Beveiligde aanmelding verifiëren'
                        : 'Toegang tot FTJM Enterprise'}
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError(null);

                  const email = authEmail.trim();

                  if (!email) {
                    setAuthError('E-mail of gebruikersnaam is verplicht');
                    return;
                  }

                  if (!isRegisterMode && authStep === 'email') {
                    setAuthLoading(true);
                    try {
                      const { data: profiles, error: lookupError } = await supabaseClient
                        .from('profiles')
                        .select('email, display_name, photo_url')
                        .or(`email.eq.${email},display_name.eq.${email}`)
                        .limit(1);

                      if (lookupError) {
                        console.error('Lookup profile error:', lookupError);
                      }

                      if (profiles && profiles.length > 0) {
                        const foundProfile = profiles[0];
                        setLookupProfile({
                          display_name: foundProfile.display_name || foundProfile.email || email,
                          email: foundProfile.email || email,
                          photo_url: foundProfile.photo_url || null
                        });
                        if (foundProfile.email) {
                          setAuthEmail(foundProfile.email);
                        }
                      } else {
                        // Use fallback so they can still try to log in (e.g. if profile row hasn't been created yet)
                        setLookupProfile({
                          display_name: email,
                          email: email,
                          photo_url: null
                        });
                      }
                      setAuthStep('password');
                    } catch (err: any) {
                      console.error('Profile lookup error:', err);
                      setLookupProfile({
                        display_name: email,
                        email: email,
                        photo_url: null
                      });
                      setAuthStep('password');
                    } finally {
                      setAuthLoading(false);
                    }
                    return;
                  }

                  const password = authPassword;

                  if (!password) {
                    setAuthError('Wachtwoord is verplicht');
                    return;
                  }

                  setAuthLoading(true);

                  try {
                    const claimAuth = rateLimiter.logAuthAttempt();
                    if (!claimAuth.allowed) {
                      throw new Error(claimAuth.reason || 'Teveel loginpogingen vanaf dit apparaat. Probeer het over 5 minuten opnieuw.');
                    }

                    if (isRegisterMode) {
                      const displayName = authDisplayName.trim();
                      if (!displayName) {
                        setAuthError('Weergavenaam is verplicht');
                        setAuthLoading(false);
                        return;
                      }

                      if (!authAgreeTerms) {
                        setAuthError('Je bent verplicht akkoord te gaan met de Algemene Voorwaarden en het Privacybeleid.');
                        setAuthLoading(false);
                        return;
                      }

                      // Eerst controleren of het e-mailadres op de whitelist staat (indien actief)
                      const isSystemAdmin = email.toLowerCase() === 'markohoksen@gmail.com';
                      if (!isSystemAdmin && IS_WHITELIST_ACTIVE) {
                        const { data: whitelistData, error: whitelistError } = await supabaseClient
                          .from('whitelist')
                          .select('email')
                          .eq('email', email.toLowerCase())
                          .maybeSingle();

                        if (whitelistError) {
                          console.error('Check whitelist error:', whitelistError);
                          throw new Error('Fout bij het controleren van de whitelist status. Probeer het opnieuw.');
                        }

                        if (!whitelistData) {
                          throw new Error('Dit e-mailadres is niet geautoriseerd om een account aan te maken.');
                        }
                      }

                      // Extra controle: Controleer of het e-mailadres of een variant daarvan al geregistreerd staat
                      const normalizedInputEmail = normalizeEmail(email);
                      const { data: existingProfiles, error: fetchProfilesError } = await supabaseClient
                        .from('profiles')
                        .select('email');

                      if (!fetchProfilesError && existingProfiles) {
                        const isDuplicate = existingProfiles.some(p => p.email && normalizeEmail(p.email) === normalizedInputEmail);
                        if (isDuplicate) {
                          throw new Error('Dit e-mailadres (of een variant daarvan) is al in gebruik door een ander geregistreerd lid.');
                        }
                      }

                      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: {
                          data: {
                            display_name: displayName,
                          }
                        }
                      });

                      if (signUpError) throw signUpError;
                      
                      // Direct automatisch inloggen na registratie!
                      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                      });

                      if (signInError) {
                        console.error('Auto sign-in error:', signInError);
                        toast.success('Account succesvol geregistreerd! Log nu in.');
                        setIsRegisterMode(false);
                      } else {
                        toast.success('Account succesvol geregistreerd en ingelogd!');
                        setIsAuthModalOpen(false);
                        // Reset form fields
                        setAuthEmail('');
                        setAuthPassword('');
                        setAuthDisplayName('');
                      }
                    } else {
                      // Check if a passkey is active for this email on this device
                      const rawKeys = localStorage.getItem('ftjm_device_passkeys');
                      const passkeyList = rawKeys ? JSON.parse(rawKeys) : [];
                      const hasDevicePasskey = passkeyList.some((pk: any) => pk.email.toLowerCase() === email.toLowerCase());

                      const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                      });

                      if (error) throw error;

                      if (hasDevicePasskey) {
                        toast.info("Wachtwoord geverifieerd. Scan en verifieer nu je passkey...");
                        try {
                          if (!window.PublicKeyCredential) {
                            throw new Error("WebAuthn (Passkeys) wordt niet ondersteund in deze browser of context.");
                          }

                          const challenge = crypto.getRandomValues(new Uint8Array(32));
                          const assertion = await navigator.credentials.get({
                            publicKey: {
                              challenge: challenge,
                              timeout: 60000,
                              userVerification: "required"
                            }
                          }) as PublicKeyCredential | null;

                          if (!assertion) {
                            throw new Error("Authenticatie geannuleerd.");
                          }

                          const matchingRecord = passkeyList.find(
                            (pk: any) => pk.credentialId === assertion.id && pk.email.toLowerCase() === email.toLowerCase()
                          );

                          if (!matchingRecord) {
                            throw new Error("Deze passkey hoort niet bij dit account.");
                          }

                          toast.success('Succesvol ingelogd met wachtwoord en passkey!');
                        } catch (passkeyErr: any) {
                          // Sign out immediately to preserve security
                          await supabaseClient.auth.signOut();
                          throw new Error(passkeyErr.message || "Passkey beveiligingscontrole mislukt. Toegang geweigerd.");
                        }
                      } else {
                        toast.success('Succesvol ingelogd!');
                      }

                      setIsAuthModalOpen(false);
                      // Reset form fields
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthDisplayName('');
                    }
                  } catch (err: any) {
                    console.error('Auth error:', err);
                    setAuthError(err.message || 'Er is een fout opgetreden.');
                  } finally {
                    setAuthLoading(false);
                  }
                }} className="space-y-4">
                  {authError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {isRegisterMode ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-100/60 uppercase tracking-wider mb-1.5 ml-1">
                          Weergavenaam
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Bijv. Mark"
                          autoComplete="name"
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-100/60 uppercase tracking-wider mb-1.5 ml-1">
                          E-mailadres
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="voorbeeld@adres.nl"
                          autoComplete="username email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-100/60 uppercase tracking-wider mb-1.5 ml-1">
                          Wachtwoord
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                        />
                      </div>

                      <div className="flex items-start gap-2.5 mt-2 mb-2 px-1">
                        <input
                          id="auth-agree-terms-checkbox"
                          type="checkbox"
                          required
                          checked={authAgreeTerms}
                          onChange={(e) => setAuthAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-cyan-500 rounded border-white/25 bg-white/10 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-400"
                        />
                        <label htmlFor="auth-agree-terms-checkbox" className="text-xs text-blue-100/70 leading-normal select-none cursor-pointer">
                          Ik ga akkoord met de <span className="text-cyan-400 font-extrabold underline">Algemene Voorwaarden</span> en het <span className="text-cyan-400 font-extrabold underline">Privacybeleid</span> van FTJM Enterprise.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-4 bg-white text-[#002f54] hover:bg-cyan-100 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#002f54]" />
                        ) : (
                          'Registreren & Inloggen'
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {authStep === 'email' ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-[11px] font-bold text-blue-100/60 uppercase tracking-wider mb-1.5 ml-1">
                              Gebruikersnaam of E-mailadres
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Type je gebruikersnaam of e-mail"
                              autoComplete="username"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-4 bg-white text-[#002f54] hover:bg-cyan-100 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {authLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#002f54]" />
                            ) : (
                              'Volgende'
                            )}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-4"
                        >
                          {/* Centered user card */}
                          <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthStep('email');
                                setLookupProfile(null);
                                setAuthPassword('');
                              }}
                              className="absolute top-3 left-3 text-white/50 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              Wissel
                            </button>

                            <div className="w-16 h-16 rounded-full border-2 border-cyan-400 overflow-hidden shadow-lg shadow-cyan-500/20 mb-2 mt-2 flex items-center justify-center bg-[#0a385c]">
                              {lookupProfile?.photo_url ? (
                                <img
                                  src={lookupProfile.photo_url}
                                  alt={lookupProfile.display_name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <UserIcon className="w-8 h-8 text-cyan-300" />
                              )}
                            </div>

                            <p className="text-sm font-black text-white text-center tracking-tight">
                              {lookupProfile?.display_name}
                            </p>
                            <p className="text-[10px] text-blue-100/40 text-center font-mono mt-0.5 truncate max-w-xs">
                              {lookupProfile?.email}
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-blue-100/60 uppercase tracking-wider mb-1.5 ml-1">
                              Wachtwoord
                            </label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••••••"
                              autoComplete="current-password"
                              autoFocus
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-4 bg-white text-[#002f54] hover:bg-cyan-100 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {authLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#002f54]" />
                            ) : (
                              'Inloggen'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handlePasskeyLogin}
                            disabled={authLoading}
                            className="w-full py-4 bg-[#0a385c] hover:bg-cyan-950 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                          >
                            <Fingerprint className="w-5 h-5 text-cyan-400 animate-pulse" />
                            Inloggen met Passkey
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </form>

                {(isRegisterMode || authStep === 'email') && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setAuthError(null);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      {isRegisterMode
                        ? 'Heb je al een account? Log hier in'
                        : 'Nog geen account? Registreer hier'}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {needsTermsAgreement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-white select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="max-w-xl w-full bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6 shrink-0 relative overflow-hidden"
              >
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-505/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

                <div className="text-center space-y-2 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-cyan-500/30">
                    <ShieldCheck className="w-8 h-8 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                    Voorwaarden & Privacy Update
                  </h2>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">
                    FTJM Enterprise Platform v2.5.0
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl text-xs space-y-3 leading-relaxed text-zinc-300 relative z-10">
                  <p className="font-bold text-cyan-400 text-[13px] flex items-center gap-1.5 mb-1">
                    <span>📢</span> Belangrijke Wijzigingen:
                  </p>
                  <div className="space-y-2 text-[11px] text-zinc-300">
                    <div className="flex gap-2.5">
                      <span className="text-emerald-400 shrink-0 font-bold">✔</span>
                      <p>
                        <span className="font-extrabold text-white">100% IP-Deconstructie:</span> We hebben alle verzameling van IP-adressen (IPv4/IPv6), fysieke geolocaties, en internet providers stopgezet voor álle gebruikers. Bestaande logs zijn volledig en permanent gewist uit onze gehele infrastructuur.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="text-emerald-400 shrink-0 font-bold">✔</span>
                      <p>
                        <span className="font-extrabold text-white">Uitgebreide Algemene Voorwaarden:</span> Volledig vernieuwde, transparante spelregels voor platformintegriteit, intellectueel eigendom en veiligheid.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="text-emerald-400 shrink-0 font-bold">✔</span>
                      <p>
                        <span className="font-extrabold text-white">Garantie & Beveiliging:</span> Verhoogde bescherming van jouw persoonsgegevens zonder dat er onnodige metadata of privacygevoelige logs achterblijven.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1 ml-1 flex justify-between">
                    <span>Lees de Algemene Overeenkomst</span>
                    <span className="text-cyan-500">Volledig overzicht</span>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 text-[10.5px] text-zinc-400 space-y-4 leading-relaxed custom-scrollbar text-justify select-text">
                    <p className="font-bold text-white text-xs">
                      1. TOEPASSELIJKHEID & ENTITEIT
                    </p>
                    <p>
                      Deze voorwaarden regelen de rechten en plichten tussen FTJM Enterprise (de Eigenaar) en iedere Gebruiker met betrekking tot het gebruik van het Platform (inclusief het forum, chatsysteem, en de retro gaming arcade). Door het Platform te blijven gebruiken gaat u onvoorwaardelijk akkoord met deze voorwaarden.
                    </p>
                    <p className="font-bold text-white text-xs">
                      2. PRIVACY & VOLLEDIGE IP-ANONYMISERING
                    </p>
                    <p>
                      Wij zijn toegewijd aan maximale dataminimalisatie. Wij registreren onder geen beding uw IP-adres, internet service provider (ISP), of specifieke geografische positie. Technische metadata wordt uitsluitend in geanonimiseerde vorm gebruikt om de continuïteit en veiligheid van het platform te waarborgen.
                    </p>
                    <p className="font-bold text-white text-xs">
                      3. INTELLECTUEEL EIGENDOM
                    </p>
                    <p>
                      Alle content, designs, retro games en functionaliteiten op het platform behoren toe aan FTJM Enterprise. Gebruikers behouden het auteursrecht op hun eigen berichten en forum-bijdragen, maar verlenen FTJM Enterprise een onherroepelijke, royaltyvrije licentie om deze binnen het platform te hosten en te modereren.
                    </p>
                    <p className="font-bold text-white text-xs">
                      4. VERANTWOORDELIJKHEID & GEBRUIKSREGELS
                    </p>
                    <p>
                      Spammen, misbruik, treiteren, het plaatsen van intimiderende of lasterlijke teksten, en het omzeilen van filters of technische restricties zal leiden tot onmiddellijke schorsing of permanente IP-onafhankelijke account-beëindiging zonder waarschuwing.
                    </p>
                    <p className="font-bold text-white text-xs">
                      5. WIJZIGINGEN EN BEËINDIGING
                    </p>
                    <p>
                      De Eigenaar behoudt zich het recht voor om functionaliteiten of het platform als geheel op ieder gewenst moment aan te passen, te staken, of te beëindigen zonder aansprakelijkheid voor verlies van data of toegang.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    onClick={handleAcceptUpdatedTerms}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/20"
                  >
                    <span>✦</span> Ik ga onvoorwaardelijk akkoord en ga verder <span>✦</span>
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center mt-3">
                    Door te klikkert ga je akkoord met onze vernieuwde Algemene Voorwaarden & ons Privacybeleid.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShortcutsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowShortcutsModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="max-w-lg w-full bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Glow decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-505/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded-2xl">
                      <Keyboard className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">Snelkoppelingen</h3>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">Systeemnavigatie via toetsenbord</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowShortcutsModal(false)}
                    className="p-1.5 hover:bg-zinc-850 rounded-xl transition-colors text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  <p className="text-xs text-zinc-400 leading-normal">
                    Gebruik de onderstaande toetsencombinaties om flitsend snel door het platform te navigeren. Druk buiten invoervelden op <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono font-bold mx-0.5 text-cyan-400">?</kbd> om dit paneel op te roepen.
                  </p>

                  <div className="space-y-2.5">
                    <div className="text-[10px] uppercase font-black tracking-wider text-cyan-400 mb-1 ml-1 font-mono">Navigatie (Tabbladen)</div>
                    {(() => {
                      const isMacPlatform = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
                      const shortcutsList = [
                        { keys: isMacPlatform ? ['⌥ Opt + 1', '⌥ Opt + C'] : ['Alt + 1', 'Alt + C'], action: 'Algemene Chat', icon: '💬' },
                        { keys: isMacPlatform ? ['⌥ Opt + 2', '⌥ Opt + F'] : ['Alt + 2', 'Alt + F'], action: 'Community Forum', icon: '🏛️' },
                        { keys: isMacPlatform ? ['⌥ Opt + 3', '⌥ Opt + M'] : ['Alt + 3', 'Alt + M'], action: 'Berichten / DM Inbox', icon: '📩' },
                        { keys: isMacPlatform ? ['⌥ Opt + 4', '⌥ Opt + N'] : ['Alt + 4', 'Alt + N'], action: 'Nieuws & Updates', icon: '📢' },
                        { keys: isMacPlatform ? ['⌥ Opt + 5', '⌥ Opt + S'] : ['Alt + 5', 'Alt + S'], action: 'Systeem Instellingen', icon: '⚙️' },
                        { keys: isMacPlatform ? ['⌥ Opt + 6', '⌥ Opt + A'] : ['Alt + 6', 'Alt + A'], action: 'Retro Arcade Games', icon: '🕹️' },
                        { keys: isMacPlatform ? ['⌥ Opt + 7', '⌥ Opt + L'] : ['Alt + 7', 'Alt + L'], action: 'Studio Audiologs', icon: '🎵' },
                      ];

                      if (isMacPlatform) {
                        // Let's also mention the Mac Command alternative in a helper paragraph or as extra keys
                        shortcutsList[0].keys.push('⌘ Cmd + ⇧ Shift + 1');
                      }

                      return shortcutsList.map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl hover:bg-zinc-950/80 hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{row.icon}</span>
                            <span className="text-xs font-bold text-zinc-200">{row.action}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 items-center justify-end max-w-[60%]">
                            {row.keys.map((k, idx) => (
                              <React.Fragment key={k}>
                                {idx > 0 && <span className="text-[9px] text-zinc-650 font-bold uppercase mx-0.5">of</span>}
                                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono font-bold tracking-tight shadow-sm shadow-black/40">
                                  {k}
                                </kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-[10px] uppercase font-black tracking-wider text-cyan-400 mb-1 ml-1 font-mono">Algemene Acties</div>
                    {[
                      { keys: ['?'], action: 'Toon / verberg snelkoppelingen' },
                      { keys: ['Esc'], action: 'Sluit actieve popup vensters' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl">
                        <span className="text-xs font-bold text-zinc-200">{row.action}</span>
                        <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono font-bold shadow-sm shadow-black/40">
                          {row.keys[0]}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
                  <button
                    onClick={() => setShowShortcutsModal(false)}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
                  >
                    Sluiten
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DesktopAppPromptModal 
          isOpen={showDesktopPromptModal} 
          onClose={() => setShowDesktopPromptModal(false)} 
        />

        <Toaster 
          position="top-right" 
          richColors 
          expand={true}
          visibleToasts={5}
          theme={theme === 'dark' || (useCustomTheme && customTheme.body_bg_color && isDarkColor(customTheme.body_bg_color)) ? 'dark' : 'light'}
          toastOptions={{
            duration: 3000,
          }}
        />
      </div>
    </div>
  );
}
