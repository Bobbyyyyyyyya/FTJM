import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  Timestamp,
  where
} from 'firebase/firestore';
import { auth, db, googleProvider, microsoftProvider } from './firebase';
import { UserProfile, Post, OperationType, FirestoreErrorInfo, Conversation, DirectMessage, CustomTheme } from './types';
import { LogIn, LogOut, User as UserIcon, Save, Loader2, AlertCircle, Send, Trash2, MessageSquare, ShieldCheck, UserPlus, X, Settings, Mail, ArrowLeft, Plus, Sparkles, Pencil, Check, Bell, Volume2, VolumeX, Camera, Flag, UserCog, Moon, Sun, Upload } from 'lucide-react';
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

// Error handler as per guidelines
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'enhanced'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'enhanced') || 'light';
  });

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [whitelist, setWhitelist] = useState<{email: string, addedAt: string}[]>([]);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [photoURLInput, setPhotoURLInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'forum' | 'messages' | 'settings'>('forum');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'theme' | 'admin'>('profile');
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enableSounds: true,
    notifyNewPosts: true,
    notifyNewMessages: true,
    messageSound: SOUND_OPTIONS[0].url,
    postSound: SOUND_OPTIONS[1].url
  });
  const [customTheme, setCustomTheme] = useState<CustomTheme>({
    wallpaper: '',
    pattern: 'none',
    primaryColor: '#18181b', // zinc-900
    secondaryColor: '#27272a', // zinc-800
    accentColor: '#18181b',
    textColor: '#18181b',
    cardBgColor: '#ffffff',
    sidebarBgColor: '#ffffff',
    headerBgColor: '#ffffff',
    bodyBgColor: '#f4f4f5',
    glassEffect: false,
    blurAmount: 10,
    opacity: 100,
    wallpaperX: 50,
    wallpaperY: 50
  });
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState<string>('Online');
  const [statusInput, setStatusInput] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [typingStatuses, setTypingStatuses] = useState<Record<string, string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingInId, setTypingInId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadTime = useRef(new Date().toISOString());
  const lastPostId = useRef<string | null>(null);
  const lastConversationUpdates = useRef<Record<string, string>>({});
  const notificationSettingsRef = useRef(notificationSettings);
  const activeConversationRef = useRef(activeConversation);
  const viewRef = useRef(view);

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
      return;
    }

    if (customTheme.primaryColor) root.style.setProperty('--custom-primary', customTheme.primaryColor);
    if (customTheme.secondaryColor) root.style.setProperty('--custom-secondary', customTheme.secondaryColor);
    if (customTheme.accentColor) root.style.setProperty('--custom-accent', customTheme.accentColor);
    if (customTheme.textColor) root.style.setProperty('--custom-text', customTheme.textColor);
    if (customTheme.cardBgColor) root.style.setProperty('--custom-card-bg', customTheme.cardBgColor);
    if (customTheme.sidebarBgColor) root.style.setProperty('--custom-sidebar-bg', customTheme.sidebarBgColor);
    if (customTheme.headerBgColor) root.style.setProperty('--custom-header-bg', customTheme.headerBgColor);
    if (customTheme.bodyBgColor) root.style.setProperty('--custom-body-bg', customTheme.bodyBgColor);
    if (customTheme.blurAmount !== undefined) root.style.setProperty('--custom-blur', `${customTheme.blurAmount}px`);
    if (customTheme.opacity !== undefined) root.style.setProperty('--custom-opacity', `${customTheme.opacity / 100}`);
    if (customTheme.wallpaperX !== undefined) root.style.setProperty('--custom-wallpaper-x', `${customTheme.wallpaperX}%`);
    if (customTheme.wallpaperY !== undefined) root.style.setProperty('--custom-wallpaper-y', `${customTheme.wallpaperY}%`);
    
    // Glass Effect Variables
    if (customTheme.glassEffect) {
      const r = parseInt(customTheme.cardBgColor?.slice(1,3) || 'ff', 16);
      const g = parseInt(customTheme.cardBgColor?.slice(3,5) || 'ff', 16);
      const b = parseInt(customTheme.cardBgColor?.slice(5,7) || 'ff', 16);
      const a = (customTheme.opacity || 100) / 100;
      root.style.setProperty('--custom-glass-bg', `rgba(${r}, ${g}, ${b}, ${a})`);
      root.style.setProperty('--custom-glass-blur', `blur(${customTheme.blurAmount || 10}px)`);
    } else {
      root.style.setProperty('--custom-glass-bg', customTheme.cardBgColor || '#ffffff');
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
    
    if (pattern) {
      bgImages.push(pattern.style);
      bgSizes.push(pattern.size);
    }
    
    if (customTheme.wallpaper) {
      bgImages.push(`url(${customTheme.wallpaper})`);
      bgSizes.push('cover');
    }
    
    root.style.setProperty('--custom-main-bg', bgImages.length > 0 ? bgImages.join(', ') : 'none');
    root.style.setProperty('--custom-main-bg-size', bgSizes.length > 0 ? bgSizes.join(', ') : 'auto');
  }, [customTheme, useCustomTheme]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

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
      const hasSeenUpdate = localStorage.getItem('hasSeenUpdate1_5');
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }
  }, [user, isWhitelisted]);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setError("Firebase configuratiefout: De client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIsWhitelisted(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Whitelist check
  useEffect(() => {
    if (!user) return;

    const checkWhitelist = async () => {
      const whitelistRef = doc(db, 'whitelist', user.email!);
      try {
        const snap = await getDoc(whitelistRef);
        const exists = snap.exists();
        
        if (isAdmin && !exists) {
          // Seed admin into whitelist
          await setDoc(whitelistRef, {
            email: user.email,
            addedAt: new Date().toISOString(),
            addedBy: 'system'
          });
          setIsWhitelisted(true);
        } else {
          setIsWhitelisted(exists || isAdmin);
        }
      } catch (err) {
        console.error('Whitelist check failed:', err);
        setIsWhitelisted(isAdmin); // Admins bypass local check if it fails
      }
    };

    checkWhitelist();
  }, [user, isAdmin]);

  // Real-time profile sync
  useEffect(() => {
    if (!user || isWhitelisted === false) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setBioInput(data.bio || '');
        setDisplayNameInput(data.displayName || '');
        setPhotoURLInput(data.photoURL || '');
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
        if (data.customTheme) {
          setCustomTheme(data.customTheme);
        }
        if (data.useCustomTheme !== undefined) {
          setUseCustomTheme(data.useCustomTheme);
        }
      } else if (isWhitelisted) {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Anoniem',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          useCustomTheme: false,
          notificationSettings: {
            enableSounds: true,
            notifyNewPosts: true,
            notifyNewMessages: true,
            messageSound: SOUND_OPTIONS[0].url,
            postSound: SOUND_OPTIONS[1].url
          },
          customTheme: {
            wallpaper: '',
            primaryColor: '#18181b',
            accentColor: '#18181b',
            textColor: '#18181b',
            cardBgColor: '#ffffff',
            sidebarBgColor: '#ffffff',
            headerBgColor: '#ffffff',
            bodyBgColor: '#f4f4f5',
            glassEffect: false,
            blurAmount: 10,
            opacity: 100,
            wallpaperX: 50,
            wallpaperY: 50
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setDoc(userDocRef, newProfile).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        });
      }
    }, (err) => {
      if (isWhitelisted) handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user, isWhitelisted]);

  // Real-time whitelist sync for admin
  useEffect(() => {
    if (!isAdmin) return;

    const whitelistQuery = query(collection(db, 'whitelist'), orderBy('addedAt', 'desc'));
    const unsubscribeWhitelist = onSnapshot(whitelistQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        email: doc.id,
        ...doc.data()
      })) as {email: string, addedAt: string}[];
      setWhitelist(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'whitelist');
    });

    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reports');
    });

    return () => {
      unsubscribeWhitelist();
      unsubscribeReports();
    };
  }, [isAdmin]);

  // Real-time website status
  useEffect(() => {
    const statusRef = doc(db, 'settings', 'websiteStatus');
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setWebsiteStatus(data.status || 'Online');
        setStatusInput(data.status || 'Online');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/websiteStatus');
    });
    return () => unsubscribe();
  }, []);

  // Real-time conversations sync
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const convQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(convQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];

      // Notification logic for new messages
      data.forEach(conv => {
        const prevUpdate = lastConversationUpdates.current[conv.id];
        if (prevUpdate && conv.updatedAt > prevUpdate && 
            conv.lastMessageSenderUid !== user.uid && 
            conv.updatedAt > initialLoadTime.current) {
          
          const otherParticipantUid = conv.participants.find(uid => uid !== user.uid);
          const senderName = otherParticipantUid ? conv.participantNames[otherParticipantUid] : 'Iemand';
          
          if (notificationSettingsRef.current.notifyNewMessages && (activeConversationRef.current?.id !== conv.id || viewRef.current !== 'messages')) {
            toast.success(`Nieuw bericht van ${senderName}`, {
              description: conv.lastMessage?.substring(0, 50) + (conv.lastMessage && conv.lastMessage.length > 50 ? '...' : ''),
              action: {
                label: 'Beantwoorden',
                onClick: () => {
                  setActiveConversation(conv);
                  setView('messages');
                }
              }
            });
            playSound(notificationSettingsRef.current.messageSound || SOUND_OPTIONS[0].url, notificationSettingsRef.current.enableSounds);
          }
        }
        lastConversationUpdates.current[conv.id] = conv.updatedAt;
      });

      setConversations(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, [user, isWhitelisted]);

  // Real-time messages sync
  useEffect(() => {
    if (!user || !activeConversation) {
      setMessages([]);
      return;
    }

    const msgQuery = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DirectMessage[];
      setMessages(data.reverse());
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `conversations/${activeConversation.id}/messages`);
    });

    return () => unsubscribe();
  }, [user, activeConversation]);

  // Cleanup typing status on unmount or conversation change
  useEffect(() => {
    return () => {
      if (user && typingInId && isTyping) {
        const typingRef = doc(db, 'typing', `${typingInId}_${user.uid}`);
        updateDoc(typingRef, {
          isTyping: false,
          lastUpdated: new Date().toISOString()
        }).catch(() => {});
      }
    };
  }, [typingInId, user, isTyping]);

  // Real-time typing indicators sync for all conversations
  useEffect(() => {
    if (!user) {
      setTypingStatuses({});
      return;
    }

    // Listen to all typing statuses
    const typingQuery = query(
      collection(db, 'typing'),
      where('isTyping', '==', true)
    );

    const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
      const newStatuses: Record<string, string[]> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const convId = data.conversationId;
        const userId = data.userId;
        const userName = data.userName || 'Iemand';
        
        if (userId !== user.uid && (Date.now() - new Date(data.lastUpdated).getTime()) < 10000) {
          if (convId === 'forum') {
            if (!newStatuses[convId]) newStatuses[convId] = [];
            if (!newStatuses[convId].includes(userName)) newStatuses[convId].push(userName);
          } else {
            const conv = conversations.find(c => c.id === convId);
            if (conv) {
              if (!newStatuses[convId]) newStatuses[convId] = [];
              if (!newStatuses[convId].includes(userName)) newStatuses[convId].push(userName);
            }
          }
        }
      });
      
      setTypingStatuses(newStatuses);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'typing');
    });

    return () => unsubscribe();
  }, [user, conversations]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all users for starting new conversations
  useEffect(() => {
    if (!user || !isWhitelisted || view !== 'messages') return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== user.uid);
      setUsers(data);
    }, (err) => {
      if (isWhitelisted) handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [user, isWhitelisted, view]);

  // Real-time posts feed
  useEffect(() => {
    if (!user || !isWhitelisted) return;

    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Notification logic for new posts
      if (postsData.length > 0) {
        const latestPost = postsData[0];
        if (lastPostId.current && latestPost.id !== lastPostId.current && 
            latestPost.authorUid !== user.uid && 
            latestPost.createdAt > initialLoadTime.current) {
          if (notificationSettingsRef.current.notifyNewPosts) {
            toast.info(`Nieuw bericht van ${latestPost.authorName}`, {
              description: latestPost.content.substring(0, 50) + (latestPost.content.length > 50 ? '...' : ''),
              action: {
                label: 'Bekijken',
                onClick: () => setView('forum')
              }
            });
            playSound(notificationSettingsRef.current.postSound || SOUND_OPTIONS[1].url, notificationSettingsRef.current.enableSounds);
          }
        }
        lastPostId.current = latestPost.id;
      }

      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      if (isWhitelisted) handleFirestoreError(err, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [user, isWhitelisted]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Google inloggen mislukt.');
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (err) {
      setError('Microsoft inloggen mislukt.');
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
    if (!user || !profile) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayNameInput.trim() || user.displayName || 'Anoniem',
        photoURL: photoURLInput.trim() || user.photoURL || undefined,
        bio: bioInput.trim(),
        notificationSettings,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profiel bijgewerkt');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
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
      await addDoc(collection(db, 'reports'), {
        reporterUid: user.uid,
        reportedUid: reportingUser.uid,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      toast.success('Rapport ingediend. Bedankt voor je hulp.');
      setReportingUser(null);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
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
    
    setSending(true);
    setError(null);

    try {
      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anoniem',
        authorPhoto: profile?.photoURL || user.photoURL || undefined,
        content: postInput.trim(),
        createdAt: new Date().toISOString()
      });
      setPostInput('');

      // Clear typing status
      if (isTyping && typingInId === 'forum') {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const typingRef = doc(db, 'typing', `forum_${user.uid}`);
        updateDoc(typingRef, {
          isTyping: false,
          lastUpdated: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!checkRateLimit()) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editPostInput.trim()) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', postId), {
        content: editPostInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingPostId(null);
      toast.success('Bericht bijgewerkt');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editMessageInput.trim() || !activeConversation) return;
    if (!checkRateLimit()) return;
    setSaving(true);
    try {
      const msgRef = doc(db, 'conversations', activeConversation.id, 'messages', messageId);
      await updateDoc(msgRef, {
        text: editMessageInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingMessageId(null);
      toast.success('Bericht bijgewerkt');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${activeConversation.id}/messages/${messageId}`);
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
      await setDoc(doc(db, 'whitelist', email), {
        email,
        addedAt: new Date().toISOString(),
        addedBy: user?.email
      });
      setWhitelistInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `whitelist/${email}`);
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!isAdmin || email === user?.email) return;
    if (!checkRateLimit()) return;
    try {
      await deleteDoc(doc(db, 'whitelist', email));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `whitelist/${email}`);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      await setDoc(doc(db, 'settings', 'websiteStatus'), { status: statusInput });
      toast.success('Website status bijgewerkt');
    } catch (err) {
      toast.error('Fout bij bijwerken status');
      handleFirestoreError(err, OperationType.UPDATE, 'settings/websiteStatus');
    }
  };

  const handleUpdateTheme = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om je thema op te slaan.');
      return;
    }
    
    if (!checkRateLimit()) return;
    
    setSaving(true);
    setError(null);

    try {
      // Sanitize customTheme to ensure only allowed fields are sent
      const sanitizedTheme = {
        wallpaper: customTheme.wallpaper || '',
        pattern: customTheme.pattern || 'none',
        primaryColor: customTheme.primaryColor || '#18181b',
        secondaryColor: customTheme.secondaryColor || '#27272a',
        accentColor: customTheme.accentColor || '#18181b',
        textColor: customTheme.textColor || '#18181b',
        cardBgColor: customTheme.cardBgColor || '#ffffff',
        sidebarBgColor: customTheme.sidebarBgColor || '#ffffff',
        headerBgColor: customTheme.headerBgColor || '#ffffff',
        bodyBgColor: customTheme.bodyBgColor || '#f4f4f5',
        glassEffect: !!customTheme.glassEffect,
        blurAmount: customTheme.blurAmount ?? 10,
        opacity: customTheme.opacity ?? 100,
        wallpaperX: customTheme.wallpaperX ?? 50,
        wallpaperY: customTheme.wallpaperY ?? 50
      };

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        customTheme: sanitizedTheme,
        useCustomTheme,
        updatedAt: new Date().toISOString()
      });
      toast.success('Thema succesvol opgeslagen!', {
        description: 'Je persoonlijke instellingen zijn nu overal beschikbaar.'
      });
    } catch (err) {
      console.error('Thema opslaan mislukt:', err);
      toast.error('Opslaan mislukt. Probeer het later opnieuw.');
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
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
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      toast.success('Rapport gemarkeerd als opgelost');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!isAdmin) return;
    if (!checkRateLimit()) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast.success('Rapport verwijderd');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}`);
    }
  };

  const handleStartConversation = async (targetUser: UserProfile | {uid: string, displayName: string}) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existing = conversations.find(c => c.participants.includes(targetUser.uid));
    if (existing) {
      setActiveConversation(existing);
      setView('messages');
      return;
    }

    if (!checkRateLimit()) return;

    const newConv: Omit<Conversation, 'id'> = {
      participants: [user.uid, targetUser.uid],
      participantNames: {
        [user.uid]: user.displayName || 'Me',
        [targetUser.uid]: targetUser.displayName
      },
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'conversations'), newConv);
      setActiveConversation({ id: docRef.id, ...newConv });
      setView('messages');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'conversations');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !messageInput.trim()) return;
    
    if (!checkRateLimit()) return;
    
    const text = messageInput.trim();
    setMessageInput('');

    if (!activeConversation) return;

    try {
      const msgRef = collection(db, 'conversations', activeConversation.id, 'messages');
      await addDoc(msgRef, {
        senderUid: user.uid,
        text,
        createdAt: new Date().toISOString()
      });
      
      // Clear typing status
      if (isTyping && typingInId === activeConversation.id) {
        setIsTyping(false);
        setTypingInId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const typingRef = doc(db, 'typing', `${activeConversation.id}_${user.uid}`);
        updateDoc(typingRef, {
          isTyping: false,
          lastUpdated: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (err) {
      setMessageInput(text); // Restore input on failure
      handleFirestoreError(err, OperationType.CREATE, `conversations/${activeConversation.id}/messages`);
      return;
    }

    try {
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: text,
        lastMessageSenderUid: user.uid,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${activeConversation.id}`);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>, conversationId: string) => {
    if (conversationId === 'forum') {
      setPostInput(e.target.value);
    } else {
      setMessageInput(e.target.value);
    }

    if (!user) return;

    if (!isTyping || typingInId !== conversationId) {
      setIsTyping(true);
      setTypingInId(conversationId);
    }

    const typingRef = doc(db, 'typing', `${conversationId}_${user.uid}`);
    setDoc(typingRef, {
      conversationId,
      userId: user.uid,
      userName: profile?.displayName || user.displayName || 'Iemand',
      isTyping: true,
      lastUpdated: new Date().toISOString()
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingInId(null);
      const typingRef = doc(db, 'typing', `${conversationId}_${user.uid}`);
      updateDoc(typingRef, {
        isTyping: false,
        lastUpdated: new Date().toISOString()
      }).catch(() => {});
    }, 3000);
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

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
    <div 
      className="min-h-screen transition-all duration-500 relative" 
      style={{ 
        backgroundColor: customTheme.bodyBgColor,
        backgroundImage: 'var(--custom-main-bg)',
        backgroundSize: 'var(--custom-main-bg-size)',
        backgroundPosition: `center, ${customTheme.wallpaperX}% ${customTheme.wallpaperY}%`,
        backgroundAttachment: 'fixed'
      }}
    >
      <nav 
        className={`border-b border-zinc-200 sticky top-0 z-10 transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
        style={{ 
          backgroundColor: customTheme.glassEffect ? undefined : customTheme.headerBgColor,
        }}
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
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
                  </div>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || ''} 
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
              {customTheme.wallpaper && (
                <div 
                  className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-all duration-700 custom-wallpaper"
                  style={{ 
                    backgroundImage: `url(${customTheme.wallpaper})`,
                    filter: `blur(${customTheme.blurAmount}px)`,
                    opacity: customTheme.opacity / 100
                  }}
                />
              )}
              {view === 'forum' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div 
                      className={`bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm sticky top-24 transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
                      style={{ 
                        backgroundColor: customTheme.glassEffect ? undefined : customTheme.cardBgColor,
                        color: customTheme.textColor
                      }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName || ''} 
                              className="w-24 h-24 rounded-3xl border-4 border-white shadow-md"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-3xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                              <UserIcon className="w-10 h-10 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900">{user.displayName}</h2>
                        <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
                        
                        <div className="mt-8 w-full pt-8 border-t border-zinc-100 space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Lid sinds</span>
                            <span className="text-zinc-600 font-medium">
                              {profile ? new Date(profile.createdAt).toLocaleDateString() : '...'}
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
                      className={`bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
                      style={{ 
                        backgroundColor: customTheme.glassEffect ? undefined : customTheme.cardBgColor,
                        color: customTheme.textColor
                      }}
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
                              {post.authorPhoto ? (
                                <img 
                                  src={post.authorPhoto} 
                                  alt={post.authorName} 
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
                                    <span className="font-bold text-base text-zinc-900 truncate">{post.authorName}</span>
                                    <span className="text-xs text-zinc-400 font-medium">
                                      {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} om {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {user.uid !== post.authorUid && (
                                      <button 
                                        onClick={() => setReportingUser({ uid: post.authorUid, displayName: post.authorName, email: '', createdAt: '', updatedAt: '' })}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Rapporteer gebruiker"
                                      >
                                        <Flag className="w-4 h-4" />
                                      </button>
                                    )}
                                    {(user.uid === post.authorUid || isAdmin) && (
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
                                    {user.uid !== post.authorUid && (
                                      <button 
                                        onClick={() => handleStartConversation({ uid: post.authorUid, displayName: post.authorName })}
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
                  className={`bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
                  style={{ 
                    backgroundColor: customTheme.glassEffect ? undefined : customTheme.cardBgColor,
                    color: customTheme.textColor
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
                        const otherParticipantUid = conv.participants.find(uid => uid !== user.uid);
                        const otherParticipantName = otherParticipantUid ? conv.participantNames[otherParticipantUid] : 'Onbekend';
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
                                  {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
                                <p className={`text-xs truncate ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>{conv.lastMessage || 'Geen berichten'}</p>
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
                    style={{ backgroundColor: customTheme.bodyBgColor ? `${customTheme.bodyBgColor}80` : 'rgba(249, 250, 251, 0.5)' }}
                  >
                    {activeConversation ? (
                      <>
                        <div 
                          className="p-6 border-b flex items-center justify-between shadow-sm z-10 transition-all duration-500"
                          style={{ 
                            backgroundColor: customTheme.headerBgColor,
                            borderColor: customTheme.cardBgColor ? `${customTheme.cardBgColor}20` : 'rgba(244, 244, 245, 1)'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500"
                              style={{ 
                                backgroundColor: customTheme.cardBgColor,
                                borderColor: customTheme.accentColor ? `${customTheme.accentColor}20` : 'rgba(228, 228, 231, 1)'
                              }}
                            >
                              <UserIcon className="w-5 h-5" style={{ color: customTheme.textColor }} />
                            </div>
                            <div>
                              <h4 className="font-bold" style={{ color: customTheme.textColor }}>
                                {(() => {
                                  const otherUid = activeConversation?.participants.find(uid => uid !== user.uid);
                                  return otherUid ? activeConversation?.participantNames[otherUid] : 'Onbekend';
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
                            const isMe = msg.senderUid === user.uid;
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
                                  style={{
                                    backgroundColor: isMe ? customTheme.primaryColor : customTheme.cardBgColor,
                                    color: isMe ? '#ffffff' : customTheme.textColor,
                                    borderColor: isMe ? 'transparent' : customTheme.accentColor ? `${customTheme.accentColor}20` : 'rgba(228, 228, 231, 1)'
                                  }}
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
                                            backgroundColor: isMe ? '#ffffff' : customTheme.primaryColor,
                                            color: isMe ? customTheme.primaryColor : '#ffffff'
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
                                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          style={{ 
                            backgroundColor: customTheme.headerBgColor,
                            borderColor: customTheme.cardBgColor ? `${customTheme.cardBgColor}20` : 'rgba(244, 244, 245, 1)'
                          }}
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
                                backgroundColor: customTheme.cardBgColor,
                                borderColor: customTheme.accentColor ? `${customTheme.accentColor}20` : 'rgba(228, 228, 231, 1)',
                                color: customTheme.textColor
                              }}
                            />
                            <button 
                              type="submit"
                              disabled={!messageInput.trim() || cooldownRemaining > 0}
                              className="p-4 text-white rounded-2xl disabled:opacity-50 transition-all active:scale-95"
                              style={{ backgroundColor: customTheme.primaryColor }}
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
                  style={{ 
                    color: customTheme.textColor
                  }}
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
                      className={`w-full md:w-64 flex-shrink-0 space-y-1 p-2 rounded-2xl transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
                      style={{ 
                        backgroundColor: customTheme.glassEffect ? undefined : customTheme.sidebarBgColor,
                      }}
                    >
                      <button
                        onClick={() => setSettingsTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'profile' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={{ 
                          backgroundColor: settingsTab === 'profile' ? customTheme.primaryColor : 'transparent',
                          color: settingsTab === 'profile' ? '#ffffff' : customTheme.textColor
                        }}
                      >
                        <UserCog className="w-5 h-5" />
                        Profiel
                      </button>
                      <button
                        onClick={() => setSettingsTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'notifications' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={{ 
                          backgroundColor: settingsTab === 'notifications' ? customTheme.primaryColor : 'transparent',
                          color: settingsTab === 'notifications' ? '#ffffff' : customTheme.textColor
                        }}
                      >
                        <Bell className="w-5 h-5" />
                        Meldingen
                      </button>
                      <button
                        onClick={() => setSettingsTab('theme')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'theme' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                        style={{ 
                          backgroundColor: settingsTab === 'theme' ? customTheme.primaryColor : 'transparent',
                          color: settingsTab === 'theme' ? '#ffffff' : customTheme.textColor
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Custom Thema
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setSettingsTab('admin')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsTab === 'admin' ? 'shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                          style={{ 
                            backgroundColor: settingsTab === 'admin' ? customTheme.primaryColor : 'transparent',
                            color: settingsTab === 'admin' ? '#ffffff' : customTheme.textColor
                          }}
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
                      className={`flex-1 bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-16rem)] transition-all duration-500 ${customTheme.glassEffect ? 'custom-glass' : ''}`}
                      style={{ 
                        backgroundColor: customTheme.glassEffect ? undefined : customTheme.cardBgColor,
                        color: customTheme.textColor
                      }}
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
                                      src={photoURLInput || profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
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
                                    {notificationSettings.enableSounds ? <Volume2 className="w-4 h-4 text-zinc-900" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">Geluiden inschakelen</p>
                                    <p className="text-xs text-zinc-500">Speel een geluid af bij nieuwe meldingen</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setNotificationSettings(prev => ({ ...prev, enableSounds: !prev.enableSounds }))}
                                  className="w-12 h-6 rounded-full transition-all relative"
                                  style={{ backgroundColor: notificationSettings.enableSounds ? customTheme.accentColor : '#e4e4e7' }}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings.enableSounds ? 'left-7' : 'left-1'}`} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Bericht Geluid</label>
                                  <select 
                                    value={notificationSettings.messageSound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, messageSound: soundUrl }));
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
                                    value={notificationSettings.postSound}
                                    onChange={(e) => {
                                      const soundUrl = e.target.value;
                                      setNotificationSettings(prev => ({ ...prev, postSound: soundUrl }));
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
                                    { label: 'Primaire Kleur', key: 'primaryColor', default: '#18181b' },
                                    { label: 'Secundaire Kleur', key: 'secondaryColor', default: '#27272a' },
                                    { label: 'Accent Kleur', key: 'accentColor', default: '#18181b' },
                                    { label: 'Tekst Kleur', key: 'textColor', default: '#18181b' },
                                    { label: 'Kaart Achtergrond', key: 'cardBgColor', default: '#ffffff' },
                                    { label: 'Sidebar Achtergrond', key: 'sidebarBgColor', default: '#ffffff' },
                                    { label: 'Header Achtergrond', key: 'headerBgColor', default: '#ffffff' },
                                    { label: 'Body Achtergrond', key: 'bodyBgColor', default: '#f4f4f5' },
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
                                        <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">{customTheme.wallpaperX || 50}%</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={customTheme.wallpaperX || 50}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, wallpaperX: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: customTheme.accentColor }}
                                      />
                                    </div>

                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Achtergrond Positie (Y)</label>
                                        <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded">{customTheme.wallpaperY || 50}%</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={customTheme.wallpaperY || 50}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, wallpaperY: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: customTheme.accentColor }}
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
                                    onClick={() => setCustomTheme(prev => ({ ...prev, glassEffect: !prev.glassEffect }))}
                                    className="w-12 h-6 rounded-full transition-all relative"
                                    style={{ backgroundColor: customTheme.glassEffect ? customTheme.accentColor : '#e4e4e7' }}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customTheme.glassEffect ? 'left-7' : 'left-1'}`} />
                                  </button>
                                </div>

                                {customTheme.glassEffect && (
                                  <div className="space-y-4 pt-4 border-t border-zinc-200">
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Blur Sterkte</label>
                                        <span className="text-[10px] font-bold text-zinc-900">{customTheme.blurAmount}px</span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={customTheme.blurAmount || 10}
                                        onChange={(e) => setCustomTheme(prev => ({ ...prev, blurAmount: parseInt(e.target.value) }))}
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

                              <button 
                                onClick={handleUpdateTheme}
                                disabled={saving}
                                className="w-full p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                              >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Thema Opslaan
                              </button>
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
                                          <span>Door: {report.reporterUid.substring(0, 8)}...</span>
                                          <span>Over: {report.reportedUid.substring(0, 8)}...</span>
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
                        key={u.uid}
                        onClick={() => {
                          handleStartConversation(u);
                          setShowUserSearch(false);
                          setUserSearchQuery('');
                        }}
                        className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-zinc-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{u.displayName}</p>
                          <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.uid !== user.uid && (
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
                      {reportingUser.photoURL ? (
                        <img src={reportingUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{reportingUser.displayName}</p>
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

        {/* Update 1.5 Modal */}
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
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">Nieuw in versie 1.5</h2>
                  <p className="text-zinc-500 mb-6">We hebben de app verbeterd met nieuwe functies en een strakker design.</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Nieuwe Berichten UI</h4>
                        <p className="text-xs text-zinc-500 mt-1">Een schoner, moderner design voor al je gesprekken, zonder afleidingen.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Settings className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Verbeterde Instellingen</h4>
                        <p className="text-xs text-zinc-500 mt-1">Een nieuw zijpaneel voor instellingen, inclusief een admin paneel.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">Live Status</h4>
                        <p className="text-xs text-zinc-500 mt-1">Bekijk de actuele website status direct in de navigatiebalk.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      localStorage.setItem('hasSeenUpdate1_5', 'true');
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
  );
}
