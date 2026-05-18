import React, { useState, useEffect, useCallback, useRef } from 'react';
// Force rebuild - RefreshCw fix
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { supabase, setSupabaseFirebaseUid, createSupabaseClient } from './utils/supabase';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './lib/firebase';
import { UserProfile, Post, Conversation, DirectMessage, CustomTheme, ForumThread, ForumComment, AppNotification, NotificationSettings, Report } from './types';
import { MentionOverlay } from './components/MentionOverlay';
import { EmojiOverlay } from './components/EmojiOverlay';
import { Toaster, toast } from 'sonner';

import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { 
  Shield, 
  Bell, 
  Volume2, 
  VolumeX, 
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
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Link,
  Bot,
  Phone,
  PhoneOff
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
import { MessageEditArea } from './components/MessageEditArea';
import { useVoiceCall } from './hooks/useVoiceCall';
import { VoiceCallUI } from './components/VoiceCallUI';
import { useGroupVoiceCall } from './hooks/useGroupVoiceCall';
import { GroupVoiceCallUI } from './components/GroupVoiceCallUI';

// Constants & Helpers
import { NEWS_ITEMS, SOUND_OPTIONS, PATTERNS, EMOJI_LIST } from './constants';
import { playSound, formatDate, formatTime, handleSupabaseError, audioCache, logAudioEvent, convertEmoticons, isDarkColor } from './utils/helpers';

import { encryptGeneralChat, decryptGeneralChat } from './utils/encryption';

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
  const [view, setView] = useState<'chat' | 'forum' | 'messages' | 'settings' | 'news' | 'audiologs'>('chat');

  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'theme' | 'admin' | 'app' | 'audiologs'>('profile');
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

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() => {
    try {
      const cached = localStorage.getItem('active_conversation');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  const handleSetActiveConversation = (conv: Conversation | null) => {
    setActiveConversation(conv);
    if (conv) {
      localStorage.setItem('active_conversation', JSON.stringify(conv));
    } else {
      localStorage.removeItem('active_conversation');
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
    return localStorage.getItem('has_seen_whats_new_v1.8') !== 'true';
  });
  const [hasSeenNews, setHasSeenNews] = useState(() => {
    return localStorage.getItem('has_seen_news_v1.8') === 'true';
  });
  const [hasSeenMenu, setHasSeenMenu] = useState(() => {
    return localStorage.getItem('has_seen_menu_v1.8') === 'true';
  });
  const cleanNotificationSettings = (settings: any): NotificationSettings => {
    const defaultSettings = {
      enable_sounds: true,
      notify_new_posts: true,
      notify_new_messages: true,
      notify_mentions: true,
      message_sound: SOUND_OPTIONS[0].url,
      post_sound: SOUND_OPTIONS[1].url,
      ringtone_url: 'https://www.image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3'
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
      ringtone_url: settings.ringtone_url || defaultSettings.ringtone_url
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
      const cached = localStorage.getItem('cached_notifications');
      return cleanNotificationSettings(cached ? JSON.parse(cached) : null);
    } catch (e) {
      console.error('Failed to parse cached_notifications', e);
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
          onClick: () => window.location.reload()
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
        
        if (navigator.userAgent.includes('CrOS')) {
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
    return localStorage.getItem('cached_useCustomTheme') === 'true';
  });

  const [nicknames, setNicknames] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('cached_nicknames');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  
  useEffect(() => {
    if (selectedUser) {
      setNicknameInput(nicknames[selectedUser.id] || '');
      setIsEditingNickname(false);
    }
  }, [selectedUser, nicknames]);

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
    return localStorage.getItem('cached_websiteStatus') || 'Online';
  });
  const [statusInput, setStatusInput] = useState('');
  const [reports, setReports] = useState<Report[]>([]); // Reports state remains but we don't fetch for admin UI anymore
  
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

  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [supabaseClient, setSupabaseClient] = useState(supabase);
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
    localStorage.setItem('cached_notifications', JSON.stringify(notifications));
    
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
                post_sound: notificationSettings.post_sound
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
  const isAdmin = profile?.role === 'admin' || user?.email === 'markohoksen@gmail.com';
  const isBlocked = profile?.is_blocked === true;

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
                if (newNotif.type === 'dm') {
                  setView('messages');
                  handleSetActiveConversation(conversationsRef.current.find(c => c.id === newNotif.resource_id) || null);
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        logAudioEvent('system', 'success', `Ingelogd als ${currentUser.displayName || currentUser.email}`, currentUser.uid, currentUser.displayName || 'Anoniem');
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
              .select('id, display_name, original_name, email, photo_url, bio, role, notification_settings, custom_theme, use_custom_theme, custom_sounds, created_at')
              .eq('id', currentUser.uid)
              .single();
              
            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
              handleSupabaseError(error, 'profiel ophalen', currentUser, profile?.role === 'admin' || currentUser?.email === 'markohoksen@gmail.com');
            } else if (data) {
              setProfile(data);
              localStorage.setItem('cached_profile', JSON.stringify(data));
              setDisplayNameInput(data.display_name || currentUser.displayName || '');
              setPhotoURLInput(data.photo_url || currentUser.photoURL || '');
              setBioInput(data.bio || '');
              if (data.notification_settings) {
                setNotificationSettings(cleanNotificationSettings(data.notification_settings));
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
        logAudioEvent('system', whitelisted ? 'success' : 'warning', whitelisted ? 'Whitelist check geslaagd' : 'Niet op de whitelist', user.uid, user.displayName || 'Anoniem');
        setIsWhitelisted(whitelisted);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(whitelisted));
      } catch (err) {
        console.error('Whitelist check error:', err);
        handleSupabaseError(err, 'whitelist check', user, isAdmin);
        setIsWhitelisted(isAdmin);
        localStorage.setItem('cached_isWhitelisted', JSON.stringify(isAdmin));
      } finally {
        setLoading(false);
      }
    };

    checkWhitelist();
  }, [user?.uid, isAdmin]);

  // Fetch nicknames
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const fetchNicknames = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('nicknames')
          .select('target_id, nickname')
          .eq('user_id', user.uid);

        if (error) {
          console.error('Error fetching nicknames:', error);
        } else if (data) {
          const nicknameMap = data.reduce((acc: Record<string, string>, curr: any) => {
            acc[curr.target_id] = curr.nickname;
            return acc;
          }, {});
          setNicknames(nicknameMap);
          localStorage.setItem('cached_nicknames', JSON.stringify(nicknameMap));
        }
      } catch (err) {
        console.error('Unexpected error fetching nicknames:', err);
      }
    };

    fetchNicknames();
  }, [user?.uid, isWhitelisted]);

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
        logAudioEvent('system', status === 'SUBSCRIBED' ? 'success' : 'warning', `Profiel status: ${status}`, user.uid, profile?.display_name || user.displayName || 'Anoniem');
      });

    // Create profile if it doesn't exist
    const ensureProfile = async () => {
      if (hasFetchedProfile.current) return;
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, bio, role, notification_settings, updated_at, email, created_at, custom_theme, use_custom_theme, public_key, is_blocked')
        .eq('id', user.uid)
        .single();
        
      if (error && error.code === 'PGRST116' && isWhitelisted) {
        const newProfile: UserProfile = {
          id: user.uid,
          display_name: user.displayName || 'Anoniem',
          email: user.email || '',
          photo_url: user.photoURL || undefined,
          use_custom_theme: useCustomTheme,
          notification_settings: {
            enable_sounds: notificationSettings.enable_sounds,
            notify_new_posts: notificationSettings.notify_new_posts,
            notify_new_messages: notificationSettings.notify_new_messages,
            notify_mentions: notificationSettings.notify_mentions,
            message_sound: notificationSettings.message_sound,
            post_sound: notificationSettings.post_sound
          },
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
  }, [user?.uid, isWhitelisted]);

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
          const [wRes, uRes] = await Promise.all([
            supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }).limit(100),
            supabaseClient.from('profiles').select('id, display_name, photo_url, email, created_at, is_blocked').limit(200)
          ]);
          
          if (wRes.error) {
            console.error('Admin: Error fetching whitelist:', wRes.error);
            toast.error('Fout bij ophalen whitelist');
          }
          if (uRes.error) {
            console.error('Admin: Error fetching users:', uRes.error);
          }

          if (wRes.data) {
            setWhitelist(wRes.data);
            localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
          }
          if (uRes.data) {
            const sorted = [...uRes.data].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
            setUsers(sorted);
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
      const [wRes, uRes] = await Promise.all([
        supabaseClient.from('whitelist').select('email, added_at').order('added_at', { ascending: false }).limit(100),
        supabaseClient.from('profiles').select('id, display_name, photo_url, email, created_at, is_blocked').limit(200)
      ]);
      
      if (wRes.error) console.error('Admin: Error fetching whitelist:', wRes.error);
      if (uRes.error) console.error('Admin: Error fetching users:', uRes.error);

      if (wRes.data) {
        setWhitelist(wRes.data);
        localStorage.setItem('cached_whitelist', JSON.stringify(wRes.data));
      }
      if (uRes.data) {
        const sorted = [...uRes.data].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
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
  }, []);

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
                const authorName = updatedConv.last_message_sender_id ? updatedConv.participant_names[updatedConv.last_message_sender_id] : null;
                senderName = authorName ? `${authorName} in ${updatedConv.name || 'Groep'}` : (updatedConv.name || 'Groep');
              } else {
                const otherParticipantUid = updatedConv.participants.find((uid: string) => uid !== user.uid);
                senderName = otherParticipantUid ? updatedConv.participant_names[otherParticipantUid] : 'Iemand';
              }
              
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
  }, [user?.uid]);

  // Derive typingStatuses from typingUsers
  useEffect(() => {
    const newStatuses: Record<string, string[]> = {};
    Object.keys(typingUsers).forEach(convId => {
      newStatuses[convId] = Object.entries(typingUsers[convId]).map(([uid, u]) => {
        return nicknames[uid] || u.name;
      });
    });
    setTypingStatuses(newStatuses);
  }, [typingUsers, nicknames]);

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
        .select('id, display_name, photo_url, email, created_at, updated_at, is_blocked')
        .in('id', Array.from(participantIds));
        
      if (data) {
        setUsers(prev => {
          const next = [...prev];
          data.forEach(profile => {
            if (!next.some(u => u.id === profile.id)) {
              next.push(profile);
            }
          });
          return next.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        });
      }
    };
    
    fetchParticipantProfiles();
  }, [user?.uid, isWhitelisted, conversations.length]);

  // Fetch users for search only when searching or needed
  useEffect(() => {
    if (!user || !isWhitelisted) return;
    if (!showUserSearch && !userSearchQuery) return;

    const fetchUsers = async () => {
      const query = supabaseClient
        .from('profiles')
        .select('id, display_name, photo_url, email, created_at, updated_at, is_blocked')
        .neq('id', user.uid);
      
      if (userSearchQuery) {
        query.ilike('display_name', `%${userSearchQuery}%`);
      }
      
      const { data } = await query.limit(50);
      if (data) {
        const sorted = [...data].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        setUsers(sorted);
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
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select('id, content, author_id, author_name, author_photo, created_at, parent_id')
        .order('created_at', { ascending: false })
        .limit(100);
      
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
        const { data, error } = await supabaseClient
          .from('forum_threads')
          .select('id, author_id, author_name, author_photo, title, content, created_at, updated_at, comment_count')
          .order('updated_at', { ascending: false })
          .limit(50);
        
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

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      handleSupabaseError(err, 'Google inloggen', user, isAdmin);
      setLoading(false);
    }
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

  const handleUpdateTheme = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn');
      return;
    }
    setSaving(true);
    isSavingThemeRef.current = true;
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          custom_theme: customTheme,
          use_custom_theme: useCustomTheme
        })
        .eq('id', user.uid);
      
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, custom_theme: customTheme, use_custom_theme: useCustomTheme } : null);
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
      notification_settings: {
        enable_sounds: notificationSettings.enable_sounds,
        notify_new_posts: notificationSettings.notify_new_posts,
        notify_new_messages: notificationSettings.notify_new_messages,
        notify_mentions: notificationSettings.notify_mentions,
        message_sound: notificationSettings.message_sound,
        post_sound: notificationSettings.post_sound
      },
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
        console.log('Sending mention notification payload:', JSON.stringify(payload, null, 2));
        await supabaseClient.from('notifications').insert(payload);
      } catch (err) {
        console.error('Failed to send mention notification', err);
      }
    }
  };

  const moderateContent = async (content: string): Promise<{ allowed: boolean; reason?: string }> => {
    const lowerContent = content.toLowerCase();
    
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
    
    if (content.length > MAX_CONTENT_LENGTH) {
      toast.error(`Bericht is te lang (max ${MAX_CONTENT_LENGTH} tekens).`);
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
      handleMentions(decryptedData.content, data.id, 'comment');
      
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

    const userToBlock = users.find(u => u.id === userId);
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
    // Hidden functionality if needed later, but removed from UI
  };

  const handleDeleteReport = async (reportId: string) => {
    // Hidden functionality if needed later, but removed from UI
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !messageInput.trim() || !activeConversation || isWhitelisted !== true) return;
    
    if (messageInput.trim().length > MAX_CONTENT_LENGTH) {
      toast.error(`Bericht is te lang (max ${MAX_CONTENT_LENGTH} tekens).`);
      return;
    }

    if (!checkRateLimit()) return;
    
    const text = messageInput.trim();

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

  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (nicknames[u.id] && nicknames[u.id].toLowerCase().includes(userSearchQuery.toLowerCase()))
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
      {isBlocked && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950 flex items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md space-y-8"
          >
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-500/30">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white uppercase tracking-tight leading-none">Toegang Ontzegd</h1>
              <div className="h-1 w-20 bg-red-500 mx-auto rounded-full" />
              <p className="text-zinc-400 font-medium text-lg">Je account is permanent geblokkeerd door een beheerder wegens schending van de platformregels.</p>
            </div>
            <div className="pt-8 flex flex-col gap-4">
              <button 
                onClick={() => handleLogout()}
                className="px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-wide hover:bg-zinc-200 transition-all shadow-xl"
              >
                Log Uit
              </button>
            </div>
          </motion.div>
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
                      localStorage.setItem('has_seen_menu_v1.8', 'true');
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
                          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide">Navigatie</p>
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
                              localStorage.setItem('has_seen_news_v1.8', 'true');
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
                          Instellingen
                        </button>
                        <div className="h-px bg-app-border my-2 mx-2" />
                        <button 
                          onClick={() => { setView('audiologs'); setShowNavDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'audiologs' ? 'bg-app-accent text-app-ink' : 'text-app-muted hover:bg-app-accent/50 hover:text-app-ink'}`}
                        >
                          <Volume2 className="w-4 h-4" />
                          Audio Logs
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
                  onClick={unlockAudio}
                  className={`p-2 rounded-full transition-all group relative ${isAudioUnlocked ? 'hover:bg-app-accent text-app-muted hover:text-app-ink' : 'bg-amber-100 text-amber-600 animate-pulse shadow-lg shadow-amber-500/20'}`}
                  title={isAudioUnlocked ? "Audio testen" : "Audio herstellen"}
                >
                  {isAudioUnlocked ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-app-ink text-app-bg text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {isAudioUnlocked ? "Audio Testen" : "Audio Activeren"}
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
                                  if (notif.type === 'dm') {
                                    setView('messages');
                                    handleSetActiveConversation(conversations.find(c => c.id === notif.resource_id) || null);
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
                              </button>
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
                    <ChatView 
                      user={user}
                      posts={posts}
                      isAdmin={isAdmin}
                      postInput={postInput}
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
                    />
                  </div>
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
                  threads={threads}
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
                />
              )}

              {view === 'messages' && (
                <MessagesView 
                  user={user}
                  conversations={conversations}
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
                  onStartGroupCall={groupVoiceCall.joinGroupCall}
                  groupVoiceCallActiveRooms={groupVoiceCallActiveRooms}
                  onEndCall={voiceCall.endCall}
                  activeCallUserId={activeCallUserId}
                  playSound={playSound}
                  onDeleteMessage={handleDeleteDirectMessage}
                  onEditMessage={handleUpdateDirectMessage}
                />
              )}

              {view === 'settings' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)]">
                  <div className="mb-8 font-primary">
                      <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">Instellingen</h2>
                    <p className="text-app-muted font-medium text-sm">Beheer je account en app voorkeuren</p>
                  </div>
                  
                  <SettingsView 
                    user={user}
                    profile={profile}
                    settingsTab={settingsTab}
                    setSettingsTab={setSettingsTab}
                    isAdmin={isAdmin}
                    displayNameInput={displayNameInput}
                    setDisplayNameInput={setDisplayNameInput}
                    photoURLInput={photoURLInput}
                    setPhotoURLInput={setPhotoURLInput}
                    bioInput={bioInput}
                    setBioInput={setBioInput}
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
                    saving={saving}
                    uploadingSound={uploadingSound}
                    showInstallButton={deferredPrompt !== null}
                    handleInstallClick={handleInstallClick}
                  />
                </div>
              )}
              {view === 'audiologs' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)]">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">Audio Logs</h2>
                    <p className="text-app-muted font-medium text-sm">Overzicht van alle geluidsgebeurtenissen</p>
                  </div>
                  <div className="bg-app-card rounded-[2rem] border border-app-border p-6 shadow-sm h-full overflow-hidden flex flex-col">
                    <AudioLogsView />
                  </div>
                </div>
              )}
              {view === 'news' && (
                <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-app-ink">Laatste Nieuws</h2>
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

        <UserSearchModal 
          show={showUserSearch}
          onClose={() => setShowUserSearch(false)}
          searchQuery={userSearchQuery}
          setSearchQuery={setUserSearchQuery}
          users={users.filter(u => u.id !== user?.uid)}
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
                  <div className="absolute inset-0 opacity-10">
                    <Shield className="w-64 h-64 -rotate-12 -translate-x-12 -translate-y-12" />
                  </div>
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
                    {selectedUser.role === 'admin' && (
                      <div className="absolute bottom-2 left-24 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-app-card">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-app-ink tracking-tight">
                            {selectedUser.display_name}
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
                        onClick={() => setSelectedUser(null)}
                        className="w-full p-4 bg-app-accent text-app-muted rounded-2xl font-bold hover:text-app-ink transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Sluiten
                      </button>
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
          leaveCall={groupVoiceCall.leaveGroupCall}
          toggleMute={groupVoiceCall.toggleGroupMute}
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

        <AnimatePresence>
          {showWhatsNew && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-app-bg w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-app-border overflow-hidden"
              >
                <div className="relative p-8 sm:p-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-app-ink rounded-[1.5rem] flex items-center justify-center shadow-xl">
                      <Sparkles className="w-8 h-8 text-app-bg" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-app-ink tracking-tight uppercase leading-none">V1.8 Update</h2>
                      <p className="text-app-muted text-sm font-bold uppercase tracking-widest mt-1">Wat is er nieuw?</p>
                    </div>
                  </div>

                  <div className="space-y-4 py-4">
                    <div className="flex gap-4 p-4 bg-app-card rounded-2xl border border-app-border">
                      <Shield className="w-6 h-6 text-indigo-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-app-ink">Slimme Moderatie</h4>
                        <p className="text-xs text-app-muted">Context-bewust filter voor een gezellig forum zonder gescheld.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-app-card rounded-2xl border border-app-border">
                      <Volume2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-app-ink">Realtime Sounds</h4>
                        <p className="text-xs text-app-muted">Direct melding-geluiden voor alle gebruikers, overal in het forum.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-app-card rounded-2xl border border-app-border">
                      <Activity className="w-6 h-6 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-app-ink">Audio & Admin Logs</h4>
                        <p className="text-xs text-app-muted">Transparantie met live logs en een krachtig nieuw admin dashboard.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-app-card rounded-2xl border border-app-border">
                      <Palette className="w-6 h-6 text-purple-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-app-ink">Custom Geluiden</h4>
                        <p className="text-xs text-app-muted">Voeg je eigen unieke meldingsgeluiden toe via de instellingen.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowWhatsNew(false);
                      localStorage.setItem('has_seen_whats_new_v1.8', 'true');
                    }}
                    className="w-full py-4 bg-app-ink text-app-bg rounded-2xl font-bold uppercase tracking-wide hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                  >
                    Aan de slag!
                  </button>
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
