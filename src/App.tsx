import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { supabase, setSupabaseFirebaseUid, createSupabaseClient } from './utils/supabase';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './lib/firebase';
import { UserProfile, Post, Conversation, DirectMessage, CustomTheme, ForumThread, ForumComment, AppNotification, NotificationSettings, Report } from './types';
import { MentionOverlay } from './components/MentionOverlay';
import { Toaster, toast } from 'sonner';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Bell, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sparkles, 
  Sun, 
  Lock, 
  User as UserIcon, 
  LogOut, 
  MessageSquare, 
  Layout, 
  Mail, 
  Newspaper, 
  Settings, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  AlertTriangle, 
  Send, 
  X, 
  ChevronLeft, 
  Plus, 
  Clock, 
  UserCog, 
  Palette, 
  Camera, 
  Save, 
  Upload, 
  Play, 
  Trash2, 
  UserPlus, 
  CloudOff, 
  Flag, 
  Pencil, 
  Check,
  Zap,
  ArrowRight,
  ArrowLeft,
  Link,
  Image as ImageIcon
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

// Constants & Helpers
import { NEWS_ITEMS, SOUND_OPTIONS, PATTERNS } from './constants';
import { playSound, formatDate, formatTime, handleSupabaseError, audioCache } from './utils/helpers';

// App component
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
  const [threadTitleInput, setThreadTitleInput] = useState('');
  const [threadContentInput, setThreadContentInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'forum' | 'messages' | 'settings' | 'news'>('chat');

  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'theme' | 'admin'>('profile');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [threadComments, setThreadComments] = useState<ForumComment[]>([]);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = localStorage.getItem('cached_conversations');
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
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<number | null>(null);
  const [hasSeenNews, setHasSeenNews] = useState(() => {
    return localStorage.getItem('has_seen_news_v1.7.9') === 'true';
  });
  const [hasSeenMenu, setHasSeenMenu] = useState(() => {
    return localStorage.getItem('has_seen_menu_v1.7.9') === 'true';
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const cached = localStorage.getItem('cached_notifications');
      return cached ? JSON.parse(cached) : {
        enable_sounds: true,
        notify_new_posts: true,
        notify_new_messages: true,
        notify_mentions: true,
        message_sound: SOUND_OPTIONS[0].url,
        post_sound: SOUND_OPTIONS[1].url
      };
    } catch (e) {
      console.error('Failed to parse cached_notifications', e);
      return {
        enable_sounds: true,
        notify_new_posts: true,
        notify_new_messages: true,
        notify_mentions: true,
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
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<UserProfile[]>([]);
  const [mentionPosition, setMentionPosition] = useState<{ top: number, left: number } | null>(null);
  const [activeMentionInput, setActiveMentionInput] = useState<'post' | 'message' | 'comment' | 'editPost' | null>(null);
  const [showAdminPrank, setShowAdminPrank] = useState(false);
  const [adminPrankLogs, setAdminPrankLogs] = useState<string[]>([]);
  const [isPranking, setIsPranking] = useState(false);
  const [fakeErrors, setFakeErrors] = useState<string[]>([]);
  const saveConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savePostsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [messagesLimit, setMessagesLimit] = useState(50);

  const [isHuman, setIsHuman] = useState(() => {
    return localStorage.getItem('is_human_verified') === 'true';
  });
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ q: '', a: 0 });

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({ q: `Hoeveel is ${a} + ${b}?`, a: a + b });
    setCaptchaAnswer('');
    setShowCaptcha(true);
  };

  const verifyCaptcha = () => {
    if (parseInt(captchaAnswer) === captchaQuestion.a) {
      setIsHuman(true);
      localStorage.setItem('is_human_verified', 'true');
      setShowCaptcha(false);
      toast.success('Verificatie geslaagd!');
    } else {
      toast.error('Onjuist antwoord, probeer het opnieuw.');
      generateCaptcha();
    }
  };

  useEffect(() => {
    // Basic IP/Country check
    const checkLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code && data.country_code !== 'NL') {
          console.warn('Toegang vanaf buiten Nederland gedetecteerd:', data.country_name);
          // Force captcha for non-NL IPs
          if (!isHuman) generateCaptcha();
        }
      } catch (e) {
        console.error('Locatie check mislukt', e);
      }
    };
    checkLocation();
  }, []);

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
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, { name: string, lastSeen: number }>>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingInId, setTypingInId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!user || !isWhitelisted) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximaal 5MB.');
      return;
    }

    setUploading(true);
    const uploadPromise = (async () => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const s3Key = import.meta.env.VITE_S3_KEY || '505a5c2b68262b9e470c9f663982eadcf0fbd543d32708e61f0303006a121ecf';
      
      try {
        const s3Client = new S3Client({
          region: "auto",
          endpoint: "https://s3.amazonaws.com", // Default endpoint
          credentials: {
            accessKeyId: s3Key,
            secretAccessKey: "dummy-secret", 
          },
        });

        const arrayBuffer = await file.arrayBuffer();
        const command = new PutObjectCommand({
          Bucket: "ftjm-uploads",
          Key: fileName,
          Body: new Uint8Array(arrayBuffer),
          ContentType: file.type,
        });

        await s3Client.send(command);
        
        const publicUrl = `https://ftjm-uploads.s3.amazonaws.com/${fileName}`;

        if (view === 'chat') {
          setPostInput(prev => prev + (prev ? ' ' : '') + publicUrl);
        } else if (view === 'forum') {
          if (activeThread) {
            setCommentInput(prev => prev + (prev ? ' ' : '') + publicUrl);
          } else {
            setPostInput(prev => prev + (prev ? ' ' : '') + publicUrl);
          }
        } else if (view === 'messages') {
          setMessageInput(prev => prev + (prev ? ' ' : '') + publicUrl);
        }
        
        return publicUrl;
      } catch (s3Err) {
        console.error('S3 Upload failed, falling back to Supabase:', s3Err);
        const filePath = `${user.uid}/${fileName}`;
        const { error } = await supabaseClient.storage
          .from('public-1')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabaseClient.storage
          .from('public-1')
          .getPublicUrl(filePath);

        if (view === 'chat') {
          setPostInput(prev => prev + (prev ? ' ' : '') + publicUrl);
        } else if (view === 'forum') {
          if (activeThread) {
            setCommentInput(prev => prev + (prev ? ' ' : '') + publicUrl);
          } else {
            setPostInput(prev => prev + (prev ? ' ' : '') + publicUrl);
          }
        } else if (view === 'messages') {
          setMessageInput(prev => prev + (prev ? ' ' : '') + publicUrl);
        }
        
        return publicUrl;
      }
    })();

    toast.promise(uploadPromise, {
      loading: 'Afbeelding uploaden...',
      success: 'Afbeelding geüpload!',
      error: (err) => `Upload mislukt: ${err.message}`
    });

    try {
      await uploadPromise;
    } catch (err) {
      console.error('Final upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUrl = () => {
    const url = prompt('Voer de URL van de afbeelding in:');
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      if (view === 'chat') {
        setPostInput(prev => prev + (prev ? ' ' : '') + url);
      } else if (view === 'forum') {
        if (activeThread) {
          setCommentInput(prev => prev + (prev ? ' ' : '') + url);
        } else {
          setPostInput(prev => prev + (prev ? ' ' : '') + url);
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
      'cached_useCustomTheme', 'cached_websiteStatus',
      'cached_reports'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
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
    
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      addLog(`TARGET_IP: ${data.ip}`);
      addLog(`LOCATION: ${data.city}, ${data.country_name}`);
      addLog(`ISP: ${data.org}`);
      addLog(`LAT/LONG: ${data.latitude}, ${data.longitude}`);
    } catch (e) {
      addLog("TARGET_IP: 192.168.1.104 (Local fallback)");
    }

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
  const initialLoadTime = useRef(new Date(Date.now() - 30000).toISOString()); // 30 seconds buffer to account for server/client clock drift
  const lastPostId = useRef<string | null>(null);
  const lastConversationUpdates = useRef<Record<string, string>>({});
  const notificationSettingsRef = useRef(notificationSettings);
  const activeConversationRef = useRef(activeConversation);
  const viewRef = useRef(view);
  const typingChannelRef = useRef<any>(null);
  const messageChannelRef = useRef<any>(null);
  const postsChannelRef = useRef<any>(null);
  const conversationsChannelRef = useRef<any>(null);

  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [supabaseClient, setSupabaseClient] = useState(supabase);

  useEffect(() => {
    const unlockAudio = () => {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.play().then(() => {
        console.log('Audio unlocked');
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }).catch(() => {});
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    // Preload standard sounds
    SOUND_OPTIONS.forEach(opt => {
      if (!audioCache.has(opt.url)) {
        console.log('Preloading default sound:', opt.name);
        const audio = new Audio(opt.url);
        audio.preload = 'auto';
        audio.load(); // Explicitly trigger load
        audioCache.set(opt.url, audio);
      }
    });
    
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
  }, [user, supabaseClient]);

  // Caching effects
  useEffect(() => {
    if (profile) {
      // Limit profile size in storage
      const profileStr = JSON.stringify(profile);
      if (profileStr.length < 50000) { // 50KB limit
        localStorage.setItem('cached_profile', profileStr);
      }
    }
  }, [profile]);

  useEffect(() => {
    const data = JSON.stringify(whitelist);
    if (data.length < 100000) {
      localStorage.setItem('cached_whitelist', data);
    }
  }, [whitelist]);

  useEffect(() => {
    localStorage.setItem('cached_isWhitelisted', JSON.stringify(isWhitelisted));
  }, [isWhitelisted]);

  useEffect(() => {
    const data = JSON.stringify(conversations);
    if (data.length < 200000) {
      localStorage.setItem('cached_conversations', data);
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('cached_notifications', JSON.stringify(notificationSettings));
    
    if (user) {
      const syncSettings = async () => {
        try {
          await supabaseClient
            .from('profiles')
            .update({ notification_settings: notificationSettings })
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

  // Notifications Fetch & Realtime
  useEffect(() => {
    if (!user || isWhitelisted !== true) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('notifications')
          .select('*')
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
            if (newNotif.type === 'message') {
              playSound(settings.message_sound, true);
            } else {
              playSound(settings.post_sound, true);
            }
          }
          
          let title = 'Nieuwe melding';
          if (newNotif.type === 'mention') title = `Nieuwe vermelding door ${newNotif.actor_name}`;
          else if (newNotif.type === 'reply') title = `Nieuwe reactie van ${newNotif.actor_name}`;
          else if (newNotif.type === 'message') title = `Nieuw bericht van ${newNotif.actor_name}`;
          
          toast.info(title, {
            description: newNotif.content,
            action: {
              label: 'Bekijken',
              onClick: () => {
                if (newNotif.type === 'message') {
                  setView('messages');
                  setActiveConversation(conversationsRef.current.find(c => c.id === newNotif.resource_id) || null);
                } else if (newNotif.resource_type === 'post') {
                  setView('chat');
                } else {
                  setView('forum');
                }
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
  }, [user?.uid, isWhitelisted, supabaseClient]);

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
    if (isAdmin && user && (!hasFetchedAdminData.current || (view === 'settings' && settingsTab === 'admin'))) {
      const fetchAdminData = async () => {
        console.log('Admin: Fetching reports and whitelist...');
        const [wRes, rRes] = await Promise.all([
          supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }),
          supabaseClient.from('reports').select('*').order('created_at', { ascending: false })
        ]);
        
        if (wRes.data) {
          setWhitelist(wRes.data);
          localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
        }
        if (rRes.data) {
          console.log('Admin: Reports fetched:', rRes.data.length);
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
  }, [isAdmin, user?.uid, supabaseClient, view, settingsTab]);

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
        table: 'conversations'
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedConv = payload.new as Conversation;
          
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
        const update = payload.payload;
        setConversations(prev => {
          const newConvs = prev.map(c => c.id === update.id ? { ...c, ...update } : c);
          return newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        });
      })
      .on('broadcast', { event: 'new_conversation' }, (payload) => {
        console.log('Broadcast new conversation received:', payload);
        const newConv = payload.payload as Conversation;
        setConversations(prev => {
          if (prev.some(c => c.id === newConv.id)) return prev;
          const newConvs = [newConv, ...prev];
          return newConvs.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        });
      })
      .subscribe((status) => {
        console.log(`Conversations subscription status for ${user.uid}:`, status);
      });

    conversationsChannelRef.current = channel;

    // Initial fetch if not already done
    if (!hasFetchedConversations.current || view === 'messages') {
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
          // If last_message is missing for some conversations, try to fetch it from messages table
          const conversationsWithLastMessage = await Promise.all(data.map(async (conv) => {
            if (!conv.last_message) {
              const { data: lastMsg } = await supabaseClient
                .from('messages')
                .select('text, sender_id, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (lastMsg) {
                return {
                  ...conv,
                  last_message: lastMsg.text,
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
    };
  }, [user?.uid, isWhitelisted, supabaseClient, view]);

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
          const msg = payload.new as DirectMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as DirectMessage;
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
        const msg = payload.payload as DirectMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .on('broadcast', { event: 'update_message' }, (payload) => {
        console.log('Broadcast update message received:', payload);
        const update = payload.payload;
        setMessages(prev => prev.map(m => m.id === update.id ? { ...m, ...update } : m));
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        console.log('Broadcast delete message received:', payload);
        const { id } = payload.payload;
        setMessages(prev => prev.filter(m => m.id !== id));
      })
      .subscribe((status) => {
        console.log(`Messages subscription status for ${activeConversation.id}:`, status);
      });

    messageChannelRef.current = channel;

    // Initial fetch
    const fetchMessages = async () => {
      setLoadingMoreMessages(true);
      const { data } = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at, updated_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(messagesLimit);
      
      if (data) {
        // Reverse because we want oldest first in the array for the UI logic
        const sorted = data.reverse();
        setMessages(sorted);
        setHasMoreMessages(data.length === messagesLimit);
      }
      setLoadingMoreMessages(false);
    };
    fetchMessages();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.uid, activeConversation?.id, supabaseClient]);

  const [isTypingSubscribed, setIsTypingSubscribed] = useState(false);

  // Real-time typing indicators sync via Broadcast
  useEffect(() => {
    if (!user || !supabaseClient) {
      setTypingStatuses({});
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
  }, [user?.uid, supabaseClient]);

  // Derive typingStatuses from typingUsers
  useEffect(() => {
    const newStatuses: Record<string, string[]> = {};
    Object.keys(typingUsers).forEach(convId => {
      newStatuses[convId] = Object.values(typingUsers[convId]).map(u => u.name);
    });
    setTypingStatuses(newStatuses);
  }, [typingUsers]);

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

  // Fetch profiles for participants in conversations
  useEffect(() => {
    if (!user || !isWhitelisted || conversations.length === 0) return;

    const fetchParticipantProfiles = async () => {
      const participantIds = new Set<string>();
      conversations.forEach(c => c.participants.forEach(p => {
        if (p !== user.uid) participantIds.add(p);
      }));
      
      if (participantIds.size === 0) return;

      const { data } = await supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at')
        .in('id', Array.from(participantIds));
        
      if (data) {
        setUsers(prev => {
          const next = [...prev];
          data.forEach(profile => {
            if (!next.some(u => u.id === profile.id)) {
              next.push(profile);
            }
          });
          return next;
        });
      }
    };
    
    fetchParticipantProfiles();
  }, [user, isWhitelisted, conversations, supabaseClient]);

  // Fetch users for search only when searching or needed
  useEffect(() => {
    if (!user || !isWhitelisted) return;
    if (!showUserSearch && !userSearchQuery) return;

    const fetchUsers = async () => {
      const query = supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at')
        .neq('id', user.uid);
      
      if (userSearchQuery) {
        query.ilike('display_name', `%${userSearchQuery}%`);
      }
      
      const { data } = await query.limit(50);
      if (data) setUsers(data);
    };
    
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [user, isWhitelisted, showUserSearch, userSearchQuery, supabaseClient]);

  // Mark notifications as read when opening a conversation
  useEffect(() => {
    if (activeConversation && user && view === 'messages') {
      const unreadMessageNotifs = notifications.filter(n => n.type === 'message' && n.resource_id === activeConversation.id && !n.is_read);
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
          const latestPost = payload.new as Post;
          
          // Skip if we already have it
          let alreadyExists = false;
          setPosts(prev => {
            if (prev.some(p => p.id === latestPost.id)) {
              alreadyExists = true;
              return prev;
            }
            
            const newPosts = [latestPost, ...prev].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ).slice(0, 50); // Increased limit slightly for better UX
            
            if (savePostsTimeoutRef.current) clearTimeout(savePostsTimeoutRef.current);
            savePostsTimeoutRef.current = setTimeout(() => {
              localStorage.setItem('cached_posts', JSON.stringify(newPosts));
            }, 3000);
            
            return newPosts;
          });

          if (alreadyExists) return;

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
          
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Post;
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
      .on('broadcast', { event: 'update_post' }, (payload) => {
        console.log('Broadcast update post received:', payload);
        const update = payload.payload;
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
      });

    postsChannelRef.current = channel;

    // Initial fetch
    const fetchPosts = async () => {
      if (isPostingRef.current || hasFetchedPosts.current) return;
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select('id, content, author_id, author_name, author_photo, created_at, updated_at, parent_id, parent_author_name')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setPosts(data);
        localStorage.setItem('cached_posts', JSON.stringify(data));
        hasFetchedPosts.current = true;
      }
    };

    const fetchThreads = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('forum_threads')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (data) setThreads(data);
      } catch (err) {
        console.error('Error fetching threads:', err);
      }
    };

    fetchPosts();
    fetchThreads();
    setLoading(false);

    // Forum threads real-time sync
    const threadsChannel = supabaseClient
      .channel('forum_threads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_threads' }, (payload) => {
        console.log('Real-time thread change:', payload);
        if (payload.eventType === 'INSERT') {
          const newThread = payload.new as ForumThread;
          setThreads(prev => {
            if (prev.some(t => t.id === newThread.id)) return prev;
            return [newThread, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as ForumThread;
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
      supabaseClient.removeChannel(channel);
      supabaseClient.removeChannel(threadsChannel);
    };
  }, [user?.uid, isWhitelisted, supabaseClient, activeThread?.id]);

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
          const newComment = payload.new as ForumComment;
          setThreadComments(prev => {
            if (prev.some(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as ForumComment;
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
  }, [user?.uid, isWhitelisted, activeThread?.id, supabaseClient]);

  const loadMoreMessages = async () => {
    if (!activeConversation || loadingMoreMessages || !hasMoreMessages) return;
    
    setLoadingMoreMessages(true);
    const oldestMessage = messages[0];
    const newLimit = 50;
    
    const { data } = await supabaseClient
      .from('messages')
      .select('id, conversation_id, sender_id, text, created_at, updated_at')
      .eq('conversation_id', activeConversation.id)
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(newLimit);
      
    if (data && data.length > 0) {
      const sorted = data.reverse();
      setMessages(prev => [...sorted, ...prev]);
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
      handleSupabaseError(err, 'instellingen opslaan', user);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomSound = async () => {
    if (!newSoundName || !newSoundUrl || !user || !supabaseClient) {
      toast.error('Vul zowel een naam als een URL in');
      return;
    }

    if (!newSoundUrl.startsWith('http')) {
      toast.error('Ongeldige URL. Moet beginnen met http of https');
      return;
    }

    // Basic URL validation
    const isDirectAudio = /\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?.*)?$/i.test(newSoundUrl);
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(newSoundUrl);

    if (!isDirectAudio && !isYouTube) {
      toast.warning('De URL lijkt geen direct audiobestand of YouTube-link te zijn. Het geluid werkt mogelijk niet.');
    }

    setUploadingSound(true);
    try {
      // Skip direct audio testing for YouTube links as they use iframe
      if (!isYouTube) {
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
      const newCooldown = now + 30000; // Increased to 30 seconds for spamming
      setCooldownUntil(newCooldown);
      setCooldownRemaining(30);
      toast.error('Je gaat te snel! Stop met spammen. Er is een rapport geopend.');
      
      // Automatic report for spamming
      if (user) {
        supabaseClient.from('reports').insert({
          reporter_id: 'SYSTEM',
          reported_id: user.uid,
          target_type: 'user',
          target_id: user.uid,
          reason: 'Automatische Spam Detectie',
          details: `Gebruiker stuurde ${recentTimestamps.length + 1} berichten in minder dan 5 seconden.`,
          created_at: new Date().toISOString(),
          status: 'pending'
        }).then(({ error }) => {
          if (error) console.error('Failed to create auto-report:', error);
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
        console.log('Sending mention notification:', {
          type: payload.type,
          resource_type: `"${payload.resource_type}"`,
          resource_typeLen: payload.resource_type?.length,
          resource_id: payload.resource_id
        });
        await supabaseClient.from('notifications').insert(payload);
      } catch (err) {
        console.error('Failed to send mention notification', err);
      }
    }
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
    
    if (!isHuman && !isAdmin) {
      generateCaptcha();
      return;
    }

    if (!checkRateLimit()) return;
    
    isPostingRef.current = true;
    const content = postInput.trim();
    setSending(true);
    setError(null);

    const postPromise = (async () => {
      console.log('Attempting to insert post:', { content, author_id: user.uid, parent_id: replyingTo?.id });
      const { data: insertData, error } = await supabaseClient.from('posts').insert({
        author_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || undefined,
        content: content,
        created_at: new Date().toISOString(),
        parent_id: replyingTo?.id || null,
        parent_author_name: replyingTo?.author_name || null
      }).select().single();

      if (error) {
        console.error('Insert post error:', error);
        isPostingRef.current = false;
        throw error;
      }

      console.log('Post inserted successfully:', insertData);
      setPostInput('');
      setReplyingTo(null);

      // Update state directly with the new post to avoid race conditions
      if (insertData) {
        handleMentions(content, insertData.id, 'post');
        setPosts((prev) => {
          const alreadyExists = prev.some(p => p.id === insertData.id);
          if (alreadyExists) return prev;
          const newPosts = [insertData, ...prev].slice(0, 20);
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
      handleSupabaseError(err, 'bericht plaatsen', user);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (!user || !threadTitleInput.trim() || !threadContentInput.trim() || isWhitelisted !== true) return;
    
    if (!isHuman && !isAdmin) {
      generateCaptcha();
      return;
    }

    if (!checkRateLimit()) return;
    
    setSending(true);
    const payload = {
      author_id: user.uid,
      author_name: profile?.display_name || user.displayName || 'Anoniem',
      author_photo: profile?.photo_url || user.photoURL || undefined,
      title: threadTitleInput.trim(),
      content: threadContentInput.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting to insert forum thread. Payload:', JSON.stringify(payload, null, 2));
    
    try {
      const { data, error } = await supabaseClient.from('forum_threads').insert(payload).select().single();

      if (error) throw error;
      
      setThreads(prev => [data, ...prev]);
      setThreadTitleInput('');
      setThreadContentInput('');
      setIsCreatingThread(false);
      setActiveThread(data);
      toast.success('Topic succesvol geplaatst!');
    } catch (err) {
      handleSupabaseError(err, 'topic aanmaken', user);
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
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setThreadComments(data || []);
    } catch (err) {
      handleSupabaseError(err, 'reacties ophalen', user);
    }
  };

  const handleCreateComment = async (threadId: string) => {
    if (!user || !commentInput.trim() || isWhitelisted !== true) return;
    
    if (!isHuman && !isAdmin) {
      generateCaptcha();
      return;
    }

    if (!checkRateLimit()) return;
    
    setSending(true);
    try {
      const { data, error } = await supabaseClient.from('forum_comments').insert({
        thread_id: threadId,
        author_id: user.uid,
        author_name: profile?.display_name || user.displayName || 'Anoniem',
        author_photo: profile?.photo_url || user.photoURL || undefined,
        content: commentInput.trim(),
        created_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;
      
      setThreadComments(prev => [...prev, data]);
      setCommentInput('');
      
      // Notify mentioned users
      handleMentions(data.content, data.id, 'comment');
      
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
        console.log('Sending thread reply notification:', {
          type: payload.type,
          resource_type: `"${payload.resource_type}"`,
          resource_typeLen: payload.resource_type?.length,
          resource_id: payload.resource_id
        });
        supabaseClient.from('notifications').insert(payload).then(({ error }) => {
          if (error) console.error('Failed to send thread reply notification', error);
        });
      }
      
      // Update comment count in thread (increment locally for now)
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t));
      
      toast.success('Reactie geplaatst!');
    } catch (err) {
      handleSupabaseError(err, 'reactie plaatsen', user);
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
      
      let query = supabaseClient
        .from('posts')
        .update({
          content: editPostInput.trim(),
          updated_at: new Date().toISOString()
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
            content: editPostInput.trim(),
            updated_at: new Date().toISOString()
          }
        });
      }

      // Update local state immediately for better UX
      setPosts(prev => {
        const newPosts = prev.map(p => p.id === postId ? { ...p, content: editPostInput.trim(), updated_at: new Date().toISOString() } : p);
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
            text: editMessageInput.trim(),
            updated_at: new Date().toISOString()
          }
        });
      }

      // Update local state immediately for better UX
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: editMessageInput.trim(), updated_at: new Date().toISOString() } : m));

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
                last_message: editMessageInput.trim(),
                updated_at: new Date().toISOString()
              })
              .eq('id', activeConversation.id);
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
      
      // Broadcast new conversation to target user
      const targetChannel = supabaseClient.channel(`conversations:${targetUser.id}`);
      targetChannel.send({
        type: 'broadcast',
        event: 'new_conversation',
        payload: data
      });

      setMobileChatView('chat');
      setView('messages');
    } catch (err) {
      handleSupabaseError(err, 'gesprek starten', user);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !messageInput.trim() || !activeConversation) return;
    
    if (!isHuman && !isAdmin) {
      generateCaptcha();
      return;
    }

    if (!checkRateLimit()) return;
    
    const text = messageInput.trim();

    try {
      console.log('Attempting to send message:', { text, conversation_id: activeConversation.id });
      const { data: insertedMsg, error: msgError } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.uid,
          text,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (msgError) {
        console.error('Insert message error:', msgError);
        throw msgError;
      }
      
      console.log('Message sent successfully:', insertedMsg);
      
      // Update local state immediately for better UX
      if (insertedMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === insertedMsg.id)) return prev;
          return [...prev, insertedMsg];
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

      setMessageInput('');

      // Send notifications to other participants
      activeConversation.participants.forEach(participantId => {
        if (participantId === user.uid) return;
        
        const payload = {
          user_id: participantId,
          actor_id: user.uid,
          actor_name: profile?.display_name || user.displayName || 'Anoniem',
          actor_photo: profile?.photo_url || user.photoURL || undefined,
          type: 'message',
          resource_id: activeConversation.id,
          resource_type: 'thread',
          content: text.substring(0, 100),
          is_read: false,
          created_at: new Date().toISOString()
        };
        console.log('Sending message notification:', {
          type: payload.type,
          resource_type: `"${payload.resource_type}"`,
          resource_typeLen: payload.resource_type?.length,
          resource_id: payload.resource_id
        });
        supabaseClient.from('notifications').insert(payload).then(({ error }) => {
          if (error) console.error('Failed to send message notification', error);
        });
      });

      // Update conversation metadata in background
      supabaseClient
        .from('conversations')
        .update({
          last_message: text,
          last_message_sender_id: user.uid,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversation.id);

      // Broadcast conversation update to others
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.send({
          type: 'broadcast',
          event: 'conversation_update',
          payload: {
            id: activeConversation.id,
            last_message: text,
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
      handleSupabaseError(err, 'bericht verzenden', user);
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
        } else if (conversationId.startsWith('edit-')) setActiveMentionInput('editPost');
        else setActiveMentionInput('message');
      } else {
        setMentionResults([]);
      }
    } else {
      setMentionResults([]);
    }

    if (conversationId === 'forum') {
      if (activeThread) {
        setCommentInput(e.target.value);
      } else {
        setPostInput(e.target.value);
      }
    } else {
      setMessageInput(e.target.value);
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
          className={`border-b border-app-border sticky top-0 z-[100] transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : 'bg-app-card/80 backdrop-blur-md'}`}
          style={useCustomTheme ? { 
            backgroundColor: customTheme.glass_effect ? undefined : customTheme.header_bg_color,
          } : {}}
        >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('chat')}>
              <div className="w-8 h-8 bg-app-ink rounded-lg flex items-center justify-center">
                <span className="text-app-bg font-bold text-lg">F</span>
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
                  Chat
                </button>
                <button 
                  onClick={() => setView('messages')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'messages' ? 'bg-app-card text-app-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}`}
                >
                  <Mail className="w-4 h-4" />
                  Berichten
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNavDropdown(!showNavDropdown);
                    if (!hasSeenMenu) {
                      setHasSeenMenu(true);
                      localStorage.setItem('has_seen_menu_v1.7.9', 'true');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${['forum', 'settings', 'news'].includes(view) ? 'bg-app-ink text-app-bg shadow-md' : 'bg-app-accent text-app-muted hover:text-app-ink'}`}
                >
                  <Settings className={`w-4 h-4 ${showNavDropdown ? 'rotate-90' : ''} transition-transform`} />
                  Menu
                  <ChevronLeft className={`w-4 h-4 -rotate-90 transition-transform ${showNavDropdown ? 'rotate-90' : ''}`} />
                  {!hasSeenMenu && (
                    <motion.div 
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-app-card shadow-lg"
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
                          <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">Navigatie</p>
                        </div>
                        <button 
                          onClick={() => { setView('forum'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'forum' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Layout className="w-4 h-4" />
                          Community Forum
                        </button>
                        <button 
                          onClick={() => { 
                            setView('news'); 
                            setShowNavDropdown(false); 
                            if (!hasSeenNews) {
                              setHasSeenNews(true);
                              localStorage.setItem('has_seen_news_v1.7.9', 'true');
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative ${view === 'news' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Newspaper className="w-4 h-4" />
                          Laatste Nieuws
                          {!hasSeenNews && (
                            <motion.div 
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="absolute right-3 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm"
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
                          Instellingen
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
                        className="absolute right-0 mt-2 w-80 bg-app-card border border-app-border rounded-2xl shadow-2xl z-[120] overflow-hidden"
                      >
                        <div className="p-4 border-b border-app-border flex items-center justify-between bg-app-accent/30">
                          <h4 className="font-bold text-sm text-app-ink">Meldingen</h4>
                          <button 
                            onClick={async () => {
                              const { error } = await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', user.uid);
                              if (!error) setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            }}
                            className="text-[10px] font-bold text-app-ink hover:underline uppercase tracking-widest"
                          >
                            Markeer als gelezen
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-8 h-8 text-app-muted mx-auto mb-2 opacity-20" />
                              <p className="text-xs text-app-muted font-medium">Geen nieuwe meldingen</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <button 
                                key={notif.id}
                                onClick={() => {
                                  if (notif.type === 'message') {
                                    setView('messages');
                                    setActiveConversation(conversations.find(c => c.id === notif.resource_id) || null);
                                  } else if (notif.resource_type === 'post') {
                                    setView('chat');
                                  } else {
                                    setView('forum');
                                  }
                                  setShowNotifications(false);
                                }}
                                className={`w-full p-4 text-left border-b border-app-border last:border-0 hover:bg-app-accent/50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-app-accent/20' : ''}`}
                              >
                                <div className="w-8 h-8 rounded-full bg-app-accent flex-shrink-0 overflow-hidden">
                                  {notif.actor_photo ? (
                                    <img src={notif.actor_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-app-muted">
                                      {notif.actor_name[0]}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-app-ink font-medium">
                                    <span className="font-bold">{notif.actor_name}</span> {
                                      notif.type === 'mention' ? 'heeft je genoemd' :
                                      notif.type === 'message' ? 'stuurde je een bericht' :
                                      notif.type === 'reply' ? 'reageerde op je post' :
                                      'stuurde een melding'
                                    }
                                  </p>
                                  <p className="text-[10px] text-app-muted truncate mt-0.5 italic">"{notif.content}"</p>
                                  <p className="text-[8px] text-app-muted mt-1 uppercase font-bold tracking-widest">{formatDate(notif.created_at)}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
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
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-app-border">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium leading-none text-app-ink">{profile?.display_name || user.displayName || 'Anoniem'}</p>
                    <p className="text-xs text-app-muted mt-1">{user.email}</p>
                  </div>
                  {(profile?.photo_url || user.photoURL) ? (
                    <img 
                      src={profile?.photo_url || user.photoURL} 
                      alt={profile?.display_name || user.displayName || ''} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-app-border"
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

      {/* Bottom Navigation for Mobile */}
      {user && isWhitelisted && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-app-card border-t border-app-border z-50 px-4 py-3 flex items-center justify-between shadow-lg">
          <button 
            onClick={() => setView('chat')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'chat' ? 'text-app-ink' : 'text-app-muted'}`}
          >
            <MessageSquare className={`w-6 h-6 ${view === 'chat' ? 'fill-zinc-900/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </button>
          <button 
            onClick={() => setView('forum')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'forum' ? 'text-app-ink' : 'text-app-muted'}`}
          >
            <Layout className={`w-6 h-6 ${view === 'forum' ? 'fill-app-ink/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Forum</span>
          </button>
          <button 
            onClick={() => {
              setView('messages');
              setMobileChatView('list');
            }}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'messages' ? 'text-app-ink' : 'text-app-muted'}`}
          >
            <Mail className={`w-6 h-6 ${view === 'messages' ? 'fill-app-ink/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Berichten</span>
          </button>
          <button 
            onClick={() => setView('news')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'news' ? 'text-app-ink' : 'text-app-muted'}`}
          >
            <Newspaper className={`w-6 h-6 ${view === 'news' ? 'fill-app-ink/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Nieuws</span>
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-app-ink' : 'text-app-muted'}`}
          >
            <Settings className={`w-6 h-6 ${view === 'settings' ? 'fill-app-ink/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Instellingen</span>
          </button>
        </div>
      )}

      <main className={!user ? "" : "max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12"}>
        <AnimatePresence mode="wait">
          {!user ? (
            <LandingPage onLogin={handleLogin} websiteStatus={websiteStatus} />
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
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-xl shadow-red-500/10">
                <ShieldCheck className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-app-ink mb-4">Geen Toegang</h1>
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
              <h1 className="text-4xl font-black tracking-tighter text-app-ink mb-4">Onderhoud</h1>
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
              {view === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <div 
                      className={`bg-app-card rounded-3xl p-8 border border-app-border shadow-sm sticky top-24 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
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
                              <span className="flex items-center gap-1.5 text-app-ink font-bold">
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
                      className={`bg-app-card rounded-3xl p-4 sm:p-8 border border-app-border shadow-sm transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="flex items-center gap-2 mb-6 sm:mb-8">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-app-ink" />
                        <h3 className="text-lg sm:text-xl font-bold text-app-ink">General Chat</h3>
                      </div>

                      <form onSubmit={handleCreatePost} className="mb-6 sm:mb-10 relative pt-6 sm:pt-8">
                        <AnimatePresence>
                          {replyingTo && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mb-3 flex items-center justify-between bg-app-accent/50 border border-app-border p-3 rounded-xl backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-1 h-8 bg-app-ink rounded-full flex-shrink-0" />
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Reageren op {replyingTo.author_name}</p>
                                    <span className="text-[10px] text-app-muted/40">•</span>
                                    <p className="text-[10px] text-app-muted italic truncate max-w-[150px]">"{replyingTo.content}"</p>
                                  </div>
                                  <p className="text-xs text-app-ink font-medium">Typ je reactie hieronder...</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setReplyingTo(null)}
                                className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          )}
                          {typingStatuses['forum']?.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-0 left-0 flex items-center gap-2 text-[8px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/80 border border-emerald-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm z-10 backdrop-blur-sm"
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
                            disabled={cooldownRemaining > 0 || uploading}
                            className="w-full pl-4 sm:pl-6 pr-24 sm:pr-28 py-3 sm:py-4 bg-app-bg border border-app-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base text-app-ink placeholder:text-app-muted"
                            maxLength={1000}
                          />
                          <div className="absolute right-1.5 top-1.5 flex items-center gap-1 sm:gap-2">
                            <button 
                              type="button"
                              onClick={handleImageUrl}
                              disabled={uploading || cooldownRemaining > 0}
                              className="p-2 sm:p-2.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                              title="Afbeelding via URL"
                            >
                              <Link className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading || cooldownRemaining > 0}
                              className="p-2 sm:p-2.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                              title="Afbeelding uploaden"
                            >
                              {uploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            <button 
                              type="submit"
                              disabled={sending || !postInput.trim() || cooldownRemaining > 0 || uploading}
                              className="p-2 sm:p-2.5 bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {sending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                          </div>
                        </div>
                      </form>

                      <div className="space-y-4 sm:space-y-6">
                        {posts.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-app-muted text-xs sm:text-sm">Nog geen berichten. Deel als eerste iets!</p>
                          </div>
                        ) : (
                          posts.map((post) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={post.id}
                              id={`post-${post.id}`}
                              className={`flex gap-3 sm:gap-4 group bg-app-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-app-border shadow-sm hover:shadow-md transition-all relative`}
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                {post.author_photo ? (
                                  <button 
                                    onClick={() => handleOpenProfile(post.author_id)}
                                    className="w-full h-full rounded-full overflow-hidden border border-app-border object-cover hover:ring-2 hover:ring-app-ink transition-all"
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
                                    className="w-full h-full rounded-full bg-app-accent flex items-center justify-center border border-app-border hover:ring-2 hover:ring-app-ink transition-all"
                                  >
                                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-app-muted" />
                                  </button>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <button 
                                      onClick={() => handleOpenProfile(post.author_id)}
                                      className="font-bold text-sm sm:text-base text-app-ink truncate hover:underline text-left"
                                    >
                                      {post.author_name}
                                    </button>
                                    <span className="text-[10px] sm:text-xs text-app-muted font-medium whitespace-nowrap">
                                      {formatDate(post.created_at)} om {formatTime(post.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setReplyingTo(post)}
                                      className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                                      title="Reageren"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    {user.uid !== post.author_id && (
                                      <button 
                                        onClick={() => handleOpenReport('post', post.id, post.author_id, post.author_name)}
                                        className="p-2 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                                          className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                                          title="Bewerken"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeletePost(post.id)}
                                          className="p-2 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                          title="Verwijderen"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                    {user.uid !== post.author_id && (
                                      <button 
                                        onClick={() => handleStartConversation({ id: post.author_id, display_name: post.author_name })}
                                        className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
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
                                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-app-bg border border-app-border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleUpdatePost(post.id)}
                                      disabled={saving || !editPostInput.trim()}
                                      className="p-2 sm:p-3 bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                    >
                                      {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Check className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </button>
                                    <button 
                                      onClick={() => setEditingPostId(null)}
                                      className="p-2 sm:p-3 bg-app-accent text-app-muted rounded-lg sm:rounded-xl hover:opacity-90 transition-all"
                                    >
                                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-app-ink text-sm sm:text-base leading-relaxed break-words">
                                    <RichContent content={post.content} />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {posts.length > 5 && (
                      <button 
                        onClick={() => {
                          const forumContainer = document.querySelector('.forum-scroll-container');
                          if (forumContainer) {
                            forumContainer.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="absolute bottom-8 right-8 p-3 bg-app-ink text-app-bg rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 border border-app-border/20"
                        title="Terug naar boven"
                      >
                        <ChevronLeft className="w-5 h-5 rotate-90" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {view === 'forum' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-app-ink tracking-tight">Community Forum</h2>
                      <p className="text-app-muted text-sm mt-1">Deel je gedachten, stel vragen en help anderen.</p>
                    </div>
                    <button 
                      onClick={() => setIsCreatingThread(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Nieuw Topic
                    </button>
                  </div>

                  {activeThread ? (
                    <div className="space-y-6">
                      <button 
                        onClick={() => setActiveThread(null)}
                        className="flex items-center gap-2 text-app-muted hover:text-app-ink transition-colors font-bold text-sm uppercase tracking-wider"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Terug naar overzicht
                      </button>

                      <div className="bg-app-card rounded-3xl border border-app-border shadow-sm overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-app-border bg-app-accent/5">
                          <div className="flex items-center gap-3 mb-4">
                            {(activeThread.author_photo) ? (
                              <img src={activeThread.author_photo} alt="" className="w-8 h-8 rounded-full border border-app-border" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                                <UserIcon className="w-4 h-4 text-app-muted" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-app-muted">
                              <span className="font-bold text-app-ink">{activeThread.author_name}</span>
                              <span>•</span>
                              <span>{formatDate(activeThread.created_at)}</span>
                            </div>
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-black text-app-ink mb-4 leading-tight">{activeThread.title}</h1>
                          <div className="text-app-ink text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                            <RichContent content={activeThread.content} />
                          </div>
                        </div>

                        <div className="p-6 sm:p-8 space-y-8">
                          <div className="space-y-4">
                            <h3 className="font-bold text-app-ink flex items-center gap-2">
                              <MessageSquare className="w-5 h-5" />
                              Reacties ({threadComments.length})
                            </h3>
                            <div className="relative">
                              <textarea 
                                value={commentInput}
                                onChange={(e) => handleTyping(e, 'forum')}
                                placeholder="Wat vind jij hiervan?"
                                disabled={uploading}
                                className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[120px] resize-none pr-16"
                              />
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <button 
                                  type="button"
                                  onClick={handleImageUrl}
                                  disabled={uploading}
                                  className="p-2 bg-app-accent text-app-ink rounded-xl hover:bg-app-border transition-all disabled:opacity-50"
                                  title="Afbeelding via URL"
                                >
                                  <Link className="w-4 h-4" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="p-2 bg-app-accent text-app-ink rounded-xl hover:bg-app-border transition-all disabled:opacity-50"
                                  title="Afbeelding uploaden"
                                >
                                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => handleCreateComment(activeThread.id)}
                                  disabled={sending || !commentInput.trim() || uploading}
                                  className="px-6 py-2 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Plaatsen'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {threadComments.length === 0 ? (
                              <div className="text-center py-12 bg-app-accent/5 rounded-2xl border border-dashed border-app-border">
                                <p className="text-app-muted text-sm">Nog geen reacties. Wees de eerste!</p>
                              </div>
                            ) : (
                              threadComments.map(comment => (
                                <div key={comment.id} className="flex gap-4 group">
                                  <div className="w-10 h-10 flex-shrink-0">
                                    {comment.author_photo ? (
                                      <img src={comment.author_photo} alt="" className="w-full h-full rounded-full border border-app-border object-cover" />
                                    ) : (
                                      <div className="w-full h-full rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                                        <UserIcon className="w-5 h-5 text-app-muted" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="font-bold text-app-ink">{comment.author_name}</span>
                                      <span className="text-app-muted">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <div className="text-app-ink text-sm sm:text-base leading-relaxed bg-app-accent/5 p-4 rounded-2xl border border-app-border/50">
                                      <RichContent content={comment.content} />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {isCreatingThread && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-app-card rounded-3xl p-6 sm:p-8 border-2 border-app-ink shadow-xl space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-app-ink">Nieuw Topic Starten</h3>
                            <button onClick={() => setIsCreatingThread(false)} className="p-2 hover:bg-app-accent rounded-full transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <input 
                              type="text"
                              value={threadTitleInput}
                              onChange={(e) => setThreadTitleInput(e.target.value)}
                              placeholder="Titel van je topic"
                              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all font-bold text-lg text-app-ink"
                            />
                            <div className="relative">
                              <textarea 
                                value={threadContentInput}
                                onChange={(e) => setThreadContentInput(e.target.value)}
                                placeholder="Waar wil je het over hebben?"
                                disabled={uploading}
                                className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[200px] resize-none"
                              />
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <button 
                                  type="button"
                                  onClick={handleImageUrl}
                                  disabled={uploading}
                                  className="p-2 bg-app-accent text-app-ink rounded-xl hover:bg-app-border transition-all disabled:opacity-50"
                                  title="Afbeelding via URL"
                                >
                                  <Link className="w-5 h-5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="p-2 bg-app-accent text-app-ink rounded-xl hover:bg-app-border transition-all disabled:opacity-50"
                                  title="Afbeelding uploaden"
                                >
                                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => setIsCreatingThread(false)}
                                className="px-6 py-2.5 bg-app-accent text-app-muted rounded-xl font-bold hover:bg-app-border transition-all"
                              >
                                Annuleren
                              </button>
                              <button 
                                onClick={handleCreateThread}
                                disabled={sending || !threadTitleInput.trim() || !threadContentInput.trim()}
                                className="px-8 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                              >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Topic Publiceren'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {threads.length === 0 ? (
                        <div className="text-center py-20 bg-app-card rounded-3xl border border-dashed border-app-border">
                          <Layout className="w-12 h-12 text-app-muted mx-auto mb-4 opacity-20" />
                          <p className="text-app-muted font-medium">Nog geen topics gevonden. Start jij de eerste?</p>
                        </div>
                      ) : (
                        threads.map(thread => (
                          <motion.div 
                            key={thread.id}
                            layout
                            onClick={() => handleOpenThread(thread)}
                            className="bg-app-card p-6 sm:p-8 rounded-3xl border border-app-border shadow-sm hover:shadow-md hover:border-app-ink/20 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2 text-xs text-app-muted">
                                  <span className="font-bold text-app-ink">{thread.author_name}</span>
                                  <span>•</span>
                                  <span>{formatDate(thread.created_at)}</span>
                                </div>
                                <h3 className="text-xl font-black text-app-ink group-hover:text-app-ink/80 transition-colors leading-tight">{thread.title}</h3>
                                <p className="text-app-muted text-sm line-clamp-2 leading-relaxed">{thread.content}</p>
                                <div className="flex items-center gap-4 pt-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
                                    <MessageSquare className="w-4 h-4" />
                                    {thread.comment_count || 0} reacties
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
                                    <Clock className="w-4 h-4" />
                                    Laatste update {formatDate(thread.updated_at)}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:block">
                                <div className="p-3 bg-app-accent rounded-2xl group-hover:bg-app-ink group-hover:text-app-bg transition-all">
                                  <ChevronLeft className="w-5 h-5 rotate-180" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {view === 'messages' && (
                <div 
                  className={`bg-app-card rounded-3xl border border-app-border shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                  style={useCustomTheme ? { 
                    backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                    color: customTheme.text_color
                  } : {}}
                >
                  {/* Conversations List */}
                  <div className={`${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 border-r border-app-border flex-col bg-app-bg/50`}>
                    <div className="p-6 border-b border-app-border flex items-center justify-between">
                      <h3 className="font-bold text-lg text-app-ink">Berichten</h3>
                      <button 
                        onClick={() => setShowUserSearch(true)}
                        className="p-2 bg-app-ink text-app-bg rounded-xl hover:scale-105 transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {conversations.map(conv => {
                        const otherParticipantUid = conv.participants.find(uid => uid !== user.uid);
                        const otherParticipantProfile = users.find(u => u.id === otherParticipantUid);
                        const otherParticipantName = otherParticipantProfile?.display_name || (otherParticipantUid ? conv.participant_names[otherParticipantUid] : 'Onbekend');
                        const otherParticipantPhoto = otherParticipantProfile?.photo_url || (otherParticipantUid ? conv.participant_photos[otherParticipantUid] : '');
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
                                ? 'bg-app-ink text-app-bg shadow-lg shadow-app-ink/10' 
                                : 'hover:bg-app-accent text-app-muted hover:text-app-ink'
                            }`}
                          >
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-app-bg/20 scale-110' : 'bg-app-accent group-hover:scale-105'}`}>
                                {otherParticipantPhoto ? (
                                  <img src={otherParticipantPhoto} alt="" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserIcon className={`w-6 h-6 ${isActive ? 'text-app-bg' : 'text-app-muted'}`} />
                                )}
                              </div>
                              {otherParticipantUid && onlineUsers.has(otherParticipantUid) && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-app-card rounded-full shadow-sm" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm truncate">{otherParticipantName}</p>
                                <div className="flex flex-col items-end gap-1">
                                  <p className={`text-[10px] font-medium ${isActive ? 'opacity-60' : 'text-app-muted'}`}>
                                    {formatDate(conv.updated_at)}
                                  </p>
                                  {notifications.some(n => n.type === 'message' && n.resource_id === conv.id && !n.is_read) && (
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20" />
                                  )}
                                </div>
                              </div>
                              {typingStatuses[conv.id]?.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-app-bg' : 'bg-emerald-500'}`} />
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-app-bg' : 'bg-emerald-500'}`} />
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={`w-1 h-1 rounded-full ${isActive ? 'bg-app-bg' : 'bg-emerald-500'}`} />
                                  </div>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-app-bg' : 'text-emerald-500'}`}>Typen...</p>
                                </div>
                              ) : (
                                <p className={`text-xs truncate ${isActive ? 'opacity-70' : 'text-app-muted'}`}>{conv.last_message || 'Geen berichten'}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {conversations.length === 0 && (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-app-accent rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-app-muted" />
                          </div>
                          <p className="text-sm font-bold text-app-ink mb-1">Geen gesprekken</p>
                          <p className="text-xs text-app-muted">Start een nieuw gesprek om te chatten.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Conversation */}
                  <div 
                    className={`${mobileChatView === 'chat' ? 'flex' : 'hidden sm:flex'} flex-grow flex-col transition-all duration-500 bg-app-bg/50`}
                    style={useCustomTheme ? { backgroundColor: customTheme.body_bg_color ? `${customTheme.body_bg_color}80` : 'rgba(249, 250, 251, 0.5)' } : {}}
                  >
                    {activeConversation ? (
                      <>
                        <div 
                          className="p-4 sm:p-6 border-b border-app-border flex items-center justify-between bg-app-card/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-500"
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.header_bg_color,
                            borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
                          } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setMobileChatView('list')}
                              className="sm:hidden p-2 hover:bg-app-accent rounded-xl transition-colors text-app-muted"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border border-app-border transition-all duration-500 overflow-hidden bg-app-card"
                              style={useCustomTheme ? { 
                                backgroundColor: customTheme.card_bg_color,
                                borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : 'rgba(228, 228, 231, 1)'
                              } : {}}
                            >
                              {(() => {
                                const otherUid = activeConversation?.participants.find(uid => uid !== user.uid);
                                const otherProfile = users.find(u => u.id === otherUid);
                                const photo = otherProfile?.photo_url || (otherUid ? activeConversation?.participant_photos[otherUid] : null);
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
                          {hasMoreMessages && (
                            <button 
                              onClick={loadMoreMessages}
                              disabled={loadingMoreMessages}
                              className="w-full py-2 text-[10px] font-bold text-app-muted uppercase tracking-widest hover:text-app-ink transition-colors disabled:opacity-50"
                            >
                              {loadingMoreMessages ? 'Laden...' : 'Oudere berichten laden'}
                            </button>
                          )}
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
                                        {(() => {
                                          const senderProfile = users.find(u => u.id === msg.sender_id);
                                          const photo = senderProfile?.photo_url || activeConversation.participant_photos?.[msg.sender_id];
                                          return photo ? (
                                            <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <UserIcon className="w-4 h-4 text-zinc-400 m-auto" />
                                          );
                                        })()}
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div 
                                  className={`max-w-[80%] p-4 rounded-3xl text-[15px] leading-relaxed relative shadow-sm transition-all duration-500 ${
                                    isMe 
                                      ? 'bg-app-ink text-app-bg rounded-br-lg' 
                                      : 'bg-app-card text-app-ink border border-app-border rounded-bl-lg'
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
                                            : 'bg-app-card border border-app-border text-app-ink focus:ring-app-ink'
                                        }`}
                                        rows={3}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setEditingMessageId(null)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                            isMe ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-app-accent text-app-muted hover:text-app-ink'
                                          }`}
                                        >
                                          Annuleren
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateMessage(msg.id)}
                                          disabled={saving || !editMessageInput.trim()}
                                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                                            isMe ? 'bg-white text-app-ink hover:bg-zinc-200' : 'bg-app-ink text-app-bg hover:opacity-90'
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
                          className="p-6 border-t border-app-border relative pt-14 bg-app-card/80 backdrop-blur-md transition-all duration-500"
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
                                className="absolute top-4 left-6 flex items-center gap-2.5 text-[10px] font-black text-emerald-700 uppercase tracking-[0.15em] bg-emerald-50/80 border border-emerald-200 px-4 py-1.5 rounded-full shadow-sm z-10 backdrop-blur-sm"
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
                                disabled={cooldownRemaining > 0 || uploading}
                                className="w-full p-4 pr-24 bg-app-bg border border-app-border rounded-2xl transition-all outline-none focus:ring-2 focus:ring-app-ink focus:border-transparent disabled:opacity-50 shadow-sm text-app-ink"
                                style={useCustomTheme ? { 
                                  backgroundColor: customTheme.card_bg_color,
                                  borderColor: customTheme.accent_color ? `${customTheme.accent_color}20` : undefined,
                                  color: customTheme.text_color
                                } : {}}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={handleImageUrl}
                                  disabled={uploading || cooldownRemaining > 0}
                                  className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all disabled:opacity-50"
                                  title="Afbeelding via URL"
                                >
                                  <Link className="w-4 h-4" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading || cooldownRemaining > 0}
                                  className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all disabled:opacity-50"
                                  title="Afbeelding uploaden"
                                >
                                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                </button>
                                <button 
                                  type="submit"
                                  disabled={!messageInput.trim() || cooldownRemaining > 0 || uploading}
                                  className="p-2 bg-app-ink text-app-bg rounded-xl disabled:opacity-50 transition-all active:scale-90 hover:scale-105 shadow-lg"
                                  style={useCustomTheme ? { backgroundColor: customTheme.primary_color } : {}}
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
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
                      className={`flex-1 bg-app-card rounded-[2rem] border border-app-border shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-16rem)] transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
                      style={useCustomTheme ? { 
                        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
                        color: customTheme.text_color
                      } : {}}
                    >
                      <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                        {settingsTab === 'profile' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-app-accent rounded-2xl">
                                <UserCog className="w-6 h-6 text-app-ink" />
                              </div>
                              <h3 className="text-xl font-bold text-app-ink">Profiel Aanpassen</h3>
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
                                    <label className="block text-xs font-bold text-app-muted uppercase tracking-widest">Nickname</label>
                                    <button 
                                      onClick={handleResetToGoogle}
                                      className="text-[10px] font-bold text-app-ink uppercase tracking-widest hover:underline flex items-center gap-1"
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
                                    className="w-full p-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all outline-none font-medium text-app-ink"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2 ml-1">
                                  <label className="block text-xs font-bold text-app-muted uppercase tracking-widest">Profielfoto URL</label>
                                  <label className="cursor-pointer text-[10px] font-bold text-app-ink uppercase tracking-widest hover:underline flex items-center gap-1">
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
                                  className="w-full p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all outline-none font-medium text-app-ink"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-app-muted uppercase tracking-widest mb-2 ml-1">Over Mij (Bio)</label>
                                <textarea 
                                  value={bioInput}
                                  onChange={(e) => setBioInput(e.target.value)}
                                  placeholder="Vertel iets over jezelf..."
                                  rows={4}
                                  className="w-full p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all outline-none font-medium resize-none text-app-ink"
                                  maxLength={500}
                                />
                                <div className="flex justify-end mt-1">
                                  <span className="text-[10px] text-app-muted font-bold uppercase tracking-tighter">{bioInput.length}/500</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                  onClick={handleUpdateProfile}
                                  disabled={saving || cooldownRemaining > 0}
                                  className="flex-1 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                  {cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : 'Profiel Bijwerken'}
                                </button>
                                <button 
                                  onClick={handleClearCache}
                                  className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                  title="Cache wissen en herladen"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  Cache Wissen
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'notifications' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="p-3 bg-app-accent rounded-2xl">
                                <Bell className="w-6 h-6 text-app-ink" />
                              </div>
                              <h3 className="text-xl font-bold text-app-ink">Meldingen & Geluiden</h3>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-app-bg rounded-2xl border border-app-border">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-app-card rounded-xl shadow-sm">
                                    <MessageSquare className="w-4 h-4 text-app-ink" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-app-ink">Vermeldingen</p>
                                    <p className="text-xs text-app-muted">Ontvang meldingen wanneer je wordt genoemd (@naam)</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setNotificationSettings(prev => ({ ...prev, notify_mentions: !prev.notify_mentions }))}
                                  className="w-12 h-6 rounded-full transition-all relative"
                                  style={{ backgroundColor: notificationSettings.notify_mentions ? (customTheme.accent_color || 'var(--accent)') : 'var(--card-border)' }}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings.notify_mentions ? 'left-7' : 'left-1'}`} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-app-bg rounded-2xl border border-app-border">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-app-card rounded-xl shadow-sm">
                                    {notificationSettings.enable_sounds ? <Volume2 className="w-4 h-4 text-app-ink" /> : <VolumeX className="w-4 h-4 text-app-muted" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-app-ink">Geluiden inschakelen</p>
                                    <p className="text-xs text-app-muted">Speel een geluid af bij nieuwe meldingen</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setNotificationSettings(prev => ({ ...prev, enable_sounds: !prev.enable_sounds }))}
                                  className="w-12 h-6 rounded-full transition-all relative"
                                  style={{ backgroundColor: notificationSettings.enable_sounds ? (customTheme.accent_color || 'var(--accent)') : 'var(--card-border)' }}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings.enable_sounds ? 'left-7' : 'left-1'}`} />
                                </button>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Custom Geluid Toevoegen</label>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="Naam (bv. Mijn Geluid)"
                                      value={newSoundName}
                                      onChange={(e) => setNewSoundName(e.target.value)}
                                      className="flex-1 p-2.5 bg-app-bg border border-app-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-app-ink text-app-ink"
                                    />
                                    <div className="flex-1 flex flex-col gap-1">
                                      <div className="flex gap-2">
                                        <input 
                                          type="text" 
                                          placeholder="URL (mp3/wav/YouTube)"
                                          value={newSoundUrl}
                                          onChange={(e) => setNewSoundUrl(e.target.value)}
                                          className="flex-1 p-2.5 bg-app-bg border border-app-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-app-ink text-app-ink"
                                        />
                                        <button 
                                          onClick={() => {
                                            if (!newSoundUrl) return toast.error('Vul eerst een URL in');
                                            playSound(newSoundUrl, true);
                                            toast.info('Geluid testen...');
                                          }}
                                          className="px-3 bg-app-card border border-app-border rounded-xl hover:bg-app-accent transition-colors"
                                          title="Test geluid"
                                        >
                                          <Play className="w-3 h-3 text-app-ink" />
                                        </button>
                                      </div>
                                      <p className="text-[9px] text-app-muted ml-1">Gebruik een directe link naar een .mp3, .wav of YouTube video</p>
                                    </div>
                                    <button 
                                      onClick={handleAddCustomSound}
                                      disabled={uploadingSound}
                                      className="px-4 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {uploadingSound ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                      Toevoegen
                                    </button>
                                  </div>
                                </div>
                                
                                {customSounds.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {customSounds.map((sound, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-app-card border border-app-border rounded-xl group">
                                        <button 
                                          onClick={() => playSound(sound.url, true)}
                                          className="p-1 hover:bg-app-accent rounded-lg transition-colors"
                                        >
                                          <Volume2 className="w-3 h-3 text-app-ink" />
                                        </button>
                                        <span className="text-xs font-medium truncate max-w-[100px] text-app-ink">{sound.name}</span>
                                        <button 
                                          onClick={async () => {
                                            const updated = customSounds.filter((_, i) => i !== idx);
                                            setCustomSounds(updated);
                                            await supabaseClient.from('profiles').update({ custom_sounds: updated }).eq('id', user.uid);
                                            toast.info('Geluid verwijderd');
                                          }}
                                          className="p-1 hover:bg-red-50 text-app-muted hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Bericht Geluid</label>
                                  <select 
                                    value={notificationSettings.message_sound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, message_sound: soundUrl }));
                                      playSound(soundUrl, true);
                                    }}
                                    className="w-full p-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink outline-none font-medium text-sm text-app-ink"
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
                                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Post Geluid</label>
                                  <select 
                                    value={notificationSettings.post_sound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, post_sound: soundUrl }));
                                      playSound(soundUrl, true);
                                    }}
                                    className="w-full p-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink outline-none font-medium text-sm text-app-ink"
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
                                className="w-full p-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-6"
                              >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Instellingen Opslaan
                              </button>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'theme' && (
                          <div className="space-y-8 max-w-2xl">
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-app-bg rounded-[2rem] border border-app-border mb-4 gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${useCustomTheme ? 'bg-app-ink text-app-bg shadow-lg' : 'bg-app-accent text-app-muted'}`}>
                                  <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-base font-bold text-app-ink">Custom Thema Inschakelen</p>
                                  <p className="text-xs text-app-muted font-medium">Activeer je persoonlijke thema instellingen</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {!useCustomTheme && (
                                  <button 
                                    onClick={() => {
                                      const isDark = theme === 'dark' || theme === 'enhanced';
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
                                    className="px-3 py-1.5 bg-app-card border border-app-border rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-app-accent transition-all text-app-ink"
                                  >
                                    Sync met {theme === 'light' ? 'Licht' : 'Donker'}
                                  </button>
                                )}
                                <button 
                                  onClick={() => setUseCustomTheme(!useCustomTheme)}
                                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${useCustomTheme ? 'bg-app-ink' : 'bg-app-accent'}`}
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
                              <div className="p-3 bg-app-accent rounded-2xl">
                                <Sparkles className="w-6 h-6 text-app-ink" />
                              </div>
                              <h3 className="text-xl font-bold text-app-ink">Custom Thema</h3>
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
                                      className="w-full p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink outline-none font-medium text-sm text-app-ink"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Uploaden (Max 800KB)</p>
                                    <label className="flex items-center justify-center w-full h-[54px] px-4 bg-app-bg border border-app-border border-dashed rounded-2xl cursor-pointer hover:bg-app-accent transition-all">
                                      <div className="flex items-center gap-2 text-app-muted">
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
                                      className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-2 ${customTheme.pattern === p.id ? 'border-app-ink bg-app-ink text-app-bg shadow-md' : 'border-app-border bg-app-card text-app-muted hover:border-app-ink/20'}`}
                                    >
                                      <div 
                                        className="w-full flex-1 rounded-md border border-app-border"
                                        style={{ 
                                          backgroundImage: p.style,
                                          backgroundSize: p.size,
                                          backgroundColor: customTheme.pattern === p.id ? 'transparent' : 'var(--bg)'
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
                              <div className="p-3 bg-app-ink rounded-2xl">
                                <ShieldCheck className="w-6 h-6 text-app-bg" />
                              </div>
                              <h3 className="text-xl font-bold text-app-ink">Admin Paneel</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4 col-span-full">
                                <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                  Systeem Tools
                                </h4>
                                <button 
                                  onClick={startAdminPrank}
                                  disabled={isPranking}
                                  className="w-full p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {isPranking ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                                  Systeem Diagnose (Prank)
                                </button>
                                <p className="text-[10px] text-zinc-400 font-medium text-center italic">Trigger een nep terminal-hack sequence</p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Website Status</label>
                                <form onSubmit={handleUpdateStatus} className="flex gap-2">
                                  <select 
                                    value={statusInput}
                                    onChange={(e) => setStatusInput(e.target.value)}
                                    className="flex-grow p-3 bg-app-bg border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink outline-none font-medium appearance-none text-app-ink"
                                  >
                                    <option value="Online">Online</option>
                                    <option value="Onderhoud">Onderhoud</option>
                                    <option value="Offline">Offline</option>
                                  </select>
                                  <button type="submit" className="p-3 bg-app-ink text-app-bg rounded-xl hover:opacity-90 transition-all">
                                    <Save className="w-5 h-5" />
                                  </button>
                                </form>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Whitelist Toevoegen</label>
                                <form onSubmit={handleAddToWhitelist} className="flex gap-2">
                                  <input 
                                    type="email"
                                    value={whitelistInput}
                                    onChange={(e) => setWhitelistInput(e.target.value)}
                                    placeholder="email@voorbeeld.com"
                                    className="flex-grow p-3 bg-app-bg border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-ink outline-none font-medium text-app-ink"
                                  />
                                  <button type="submit" className="p-3 bg-app-ink text-app-bg rounded-xl hover:opacity-90 transition-all">
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </form>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Huidige Whitelist</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {whitelist.map(item => (
                                  <div key={item.email} className="flex items-center justify-between p-3 bg-app-bg border border-app-border rounded-xl">
                                    <span className="text-sm font-medium text-app-ink truncate">{item.email}</span>
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
                                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Rapporten ({reports.filter(r => r.status === 'pending').length} open)</label>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {reports.length === 0 ? (
                                    <p className="text-sm text-app-muted p-4 bg-app-bg rounded-xl border border-app-border text-center">Geen rapporten gevonden.</p>
                                  ) : (
                                    reports.map(report => (
                                      <div key={report.id} className={`p-4 rounded-xl border ${report.status === 'pending' ? 'bg-red-50/10 border-red-100/20' : 'bg-app-bg border-app-border'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                          <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${report.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {report.status}
                                            </span>
                                            <p className="text-sm font-bold mt-2 text-app-ink">Reden: {report.reason}</p>
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
              {view === 'news' && (
                <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tighter mb-1 text-app-ink">Laatste Nieuws</h2>
                    <p className="text-app-muted font-medium text-sm">Blijf op de hoogte van de laatste ontwikkelingen</p>
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
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium appearance-none text-zinc-900"
                    >
                      <option value="" className="text-zinc-900">Selecteer een reden...</option>
                      <option value="spam" className="text-zinc-900">Spam of ongewenste reclame</option>
                      <option value="harassment" className="text-zinc-900">Intimidatie of pesten</option>
                      <option value="hate_speech" className="text-zinc-900">Haatzaaiende uitlatingen</option>
                      <option value="inappropriate" className="text-zinc-900">Ongepaste inhoud</option>
                      <option value="impersonation" className="text-zinc-900">Impersonatie</option>
                      <option value="other" className="text-zinc-900">Anders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Details (optioneel)</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Geef meer context over de situatie..."
                      rows={4}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-medium resize-none text-zinc-900 placeholder:text-zinc-400"
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
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept="image/*"
          className="hidden"
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
                    <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-tighter italic">
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

        <AnimatePresence>
          {showCaptcha && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-zinc-900" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Beveiliging</h3>
                <p className="text-zinc-500 mb-8 font-medium">Bewijs dat je een mens bent om door te gaan.</p>
                
                <div className="mb-6">
                  <p className="text-lg font-bold text-zinc-900 mb-4">{captchaQuestion.q}</p>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyCaptcha()}
                    placeholder="Antwoord..."
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-center text-xl font-bold focus:ring-2 focus:ring-zinc-900 outline-none text-zinc-900 placeholder:text-zinc-400"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={verifyCaptcha}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20"
                >
                  Verifiëren
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <MentionOverlay 
          show={mentionResults.length > 0}
          results={mentionResults}
          position={mentionPosition}
          onSelect={handleSelectMention}
          onClose={() => setMentionResults([])}
        />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  );
}
