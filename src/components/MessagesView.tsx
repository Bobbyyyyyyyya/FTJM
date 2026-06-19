import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Plus, User as UserIcon, Users, ChevronLeft, Send, Loader2, MessageSquare, ShieldCheck, Lock as LockIcon, Smile, Link, Phone, PhoneOff, Volume2, Edit3, Trash2, X, Check, Search, Paperclip } from 'lucide-react';
import { Conversation, DirectMessage, CustomTheme, UserProfile } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import { RichContent } from './RichContent';

interface MessagesViewProps {
  user: any;
  profile?: UserProfile | null;
  profiles?: UserProfile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  messages: DirectMessage[];
  messageInput: string;
  setMessageInput: (input: string) => void;
  handleSendMessage: (e?: React.FormEvent, customContent?: string) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement>, channel: string) => void;
  handleEmojiButtonClick: (e: React.MouseEvent, type: 'message') => void;
  handleImageUrl: () => void;
  typingStatuses: Record<string, string[]>;
  mobileChatView: 'list' | 'chat';
  setMobileChatView: (view: 'list' | 'chat') => void;
  setShowUserSearch: (show: boolean) => void;
  onlineUsers: Set<string>;
  sending: boolean;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  onStartCall?: (targetId: string, targetName: string, targetAvatar?: string) => void;
  onStartGroupCall?: (roomId: string, roomName: string) => void;
  onEndCall?: () => void;
  activeCallUserId?: string;
  groupVoiceCallActiveRooms?: Set<string>;
  playSound?: (url: string, enabled: boolean, uid: string, name: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  profile,
  profiles = [],
  conversations,
  activeConversation: propActiveConversation,
  setActiveConversation,
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
  handleTyping,
  handleEmojiButtonClick,
  handleImageUrl,
  typingStatuses,
  mobileChatView,
  setMobileChatView,
  setShowUserSearch,
  onlineUsers,
  sending,
  useCustomTheme,
  customTheme,
  onStartCall,
  onStartGroupCall,
  onEndCall,
  activeCallUserId,
  groupVoiceCallActiveRooms,
  playSound,
  onDeleteMessage,
  onEditMessage
}) => {
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editInput, setEditInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = React.useState<'image' | 'audio' | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 800;
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
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Bestand is te groot. Selecteer een bestand kleiner dan 8MB.");
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setSelectedFile(compressed);
        setSelectedFileType('image');
      } else if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setSelectedFile(evt.target?.result as string);
          setSelectedFileType('audio');
        };
        reader.readAsDataURL(file);
      } else {
        alert("Ongeldig bestandstype. Selecteer een afbeelding of audiobestand.");
      }
    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) {
      return;
    }

    if (selectedFile) {
      const finalInput = messageInput.trim() ? `${messageInput.trim()} ${selectedFile}` : selectedFile;
      handleSendMessage(e, finalInput);
      setSelectedFile(null);
      setSelectedFileType(null);
    } else {
      handleSendMessage(e);
    }
  };

  // Clear search on active conversation changes
  React.useEffect(() => {
    setSearchQuery('');
    setShowSearchBar(false);
  }, [propActiveConversation?.id]);

  // Handle focus when search bar is shown
  React.useEffect(() => {
    if (showSearchBar) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    } else {
      setSearchQuery('');
    }
  }, [showSearchBar]);

  const filteredMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  // Resolve the newest conversation state from the live list to ensure real-time photo/name updates are visible instantly
  const activeConversation = propActiveConversation 
    ? (conversations.find(c => c.id === propActiveConversation.id) || propActiveConversation) 
    : null;

  const getParticipantPhoto = (uid: string, fallbackPhotos: Record<string, string> = {}) => {
    if (uid === user.uid) {
      return profile?.photo_url || user.photoURL || fallbackPhotos[uid] || null;
    }
    const found = profiles?.find(p => p.id === uid);
    return found?.photo_url || fallbackPhotos[uid] || null;
  };

  const getParticipantName = (uid: string, fallbackNames: Record<string, string> = {}) => {
    if (uid === user.uid) {
      return profile?.display_name || user.displayName || fallbackNames[uid] || 'Onbekend';
    }
    const found = profiles?.find(p => p.id === uid);
    return found?.display_name || fallbackNames[uid] || 'Onbekend';
  };

  return (
    <div 
      className={`messages-view-container bg-app-card rounded-[2.5rem] border border-app-border shadow-2xl overflow-hidden h-[calc(100vh-14rem)] flex transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
        borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
        color: customTheme.text_color
      } : {}}
    >
      {/* Conversations List */}
      <div className={`${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-96 border-r border-app-border flex-col bg-app-bg/30 backdrop-blur-sm`}
        style={useCustomTheme ? { 
          backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
          borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        } : {}}
      >
        <div className="p-8 border-b border-app-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-app-ink tracking-tight">Inbox</h3>
            <p className="text-xs font-medium text-app-muted mt-0.5">Directe Berichten</p>
          </div>
          <button 
            onClick={() => setShowUserSearch(true)}
            className="w-10 h-10 bg-app-ink text-app-bg rounded-2xl flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-lg shadow-app-ink/20 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? (
            <div className="divide-y divide-app-border/50">
              {conversations.map(conv => {
                const otherParticipants = conv.participants.filter(uid => uid !== user.uid);
                const otherParticipantUid = otherParticipants.length === 1 ? otherParticipants[0] : null;
                const displayName = conv.is_group ? (conv.name || 'Groepsgesprek') : (otherParticipantUid ? getParticipantName(otherParticipantUid, conv.participant_names) : 'Onbekend');
                const isActive = activeConversation?.id === conv.id;
                const isOnline = !conv.is_group && otherParticipantUid && onlineUsers.has(otherParticipantUid);
                const isGroupCallActive = conv.is_group && groupVoiceCallActiveRooms?.has(conv.id);
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setMobileChatView('chat');
                    }}
                    className={`w-full p-6 flex items-center gap-4 transition-all text-left relative group ${
                      isActive 
                        ? 'bg-app-ink text-app-bg' 
                        : 'hover:bg-app-accent/50 text-app-muted hover:text-app-ink'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 w-1.5 h-12 bg-app-bg rounded-r-full"
                      />
                    )}
                    
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 overflow-hidden ${
                        isActive ? 'bg-app-bg/20 ring-2 ring-app-bg/30' : 'bg-app-accent ring-1 ring-app-border group-hover:ring-app-ink/30'
                      }`}>
                        {conv.is_group ? (
                          <div className="grid grid-cols-2 gap-0.5 p-1 w-full h-full">
                            {conv.participants.slice(0, 4).map((uid, idx) => {
                              const photo = getParticipantPhoto(uid, conv.participant_photos);
                              return (
                                <div key={uid} className="w-full h-full bg-app-bg/50 overflow-hidden rounded-md flex items-center justify-center">
                                  {photo ? (
                                    <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <UserIcon className="w-2 h-2 text-app-muted" />
                                  )}
                                </div>
                              );
                            })}
                            {conv.participants.length < 4 && Array.from({ length: 4 - conv.participants.length }).map((_, i) => (
                              <div key={`empty-${i}`} className="w-full h-full bg-app-bg/20 rounded-md" />
                            ))}
                          </div>
                        ) : getParticipantPhoto(otherParticipantUid || '', conv.participant_photos) ? (
                          <img 
                            src={getParticipantPhoto(otherParticipantUid || '', conv.participant_photos) || ''} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <UserIcon className={`w-7 h-7 ${isActive ? 'text-app-bg' : 'text-app-muted'}`} />
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-app-card rounded-full shadow-lg" />
                      )}
                      {isGroupCallActive && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-app-card rounded-full shadow-lg flex items-center justify-center animate-pulse">
                          <Phone className="w-2 h-2 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-bold text-sm tracking-tight truncate">{displayName}</p>
                        <p className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'opacity-60 text-app-bg' : 'text-app-muted'}`}>
                          {formatTime(conv.updated_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {typingStatuses[conv.id]?.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 h-1 rounded-full bg-emerald-500" />
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-emerald-500" />
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 truncate">
                              {typingStatuses[conv.id].length > 1 
                                ? `${typingStatuses[conv.id].length} mensen typen...` 
                                : `${typingStatuses[conv.id][0]} typt...`}
                            </span>
                          </div>
                        ) : (
                          <p className={`text-xs truncate font-medium ${isActive ? 'opacity-70 text-app-bg' : 'text-app-muted'}`}>
                            {conv.is_group && conv.last_message && conv.last_message_sender_id && (
                              <span className="font-bold mr-1">
                                {conv.last_message_sender_id === user.uid ? 'Jij' : (getParticipantName(conv.last_message_sender_id, conv.participant_names) || 'Iemand')}:
                              </span>
                            )}
                            {conv.last_message || 'Start het gesprek...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center opacity-50">
              <div className="w-20 h-20 bg-app-accent rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-app-muted" />
              </div>
              <h4 className="font-bold text-app-ink uppercase tracking-tight">Geen Berichten</h4>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em] mt-2">Nog geen gesprekken gestart</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className={`${mobileChatView === 'chat' ? 'flex' : 'hidden sm:flex'} flex-grow flex-col relative bg-app-bg/10`}
        style={useCustomTheme ? { backgroundColor: customTheme.body_bg_color ? `${customTheme.body_bg_color}30` : undefined } : {}}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <header className="p-6 border-b border-app-border flex items-center justify-between bg-app-card/90 backdrop-blur-xl sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMobileChatView('list')}
                  className="sm:hidden w-10 h-10 flex items-center justify-center hover:bg-app-accent rounded-xl transition-colors text-app-ink"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-app-border group-hover:ring-app-ink/20 transition-all duration-300 bg-app-accent flex items-center justify-center">
                    {activeConversation.is_group ? (
                      <div className="grid grid-cols-2 gap-0.5 p-1 w-full h-full">
                        {activeConversation.participants.slice(0, 4).map((uid, idx) => {
                          const photo = getParticipantPhoto(uid, activeConversation.participant_photos);
                          return (
                            <div key={uid} className="w-full h-full bg-app-bg/50 overflow-hidden rounded-md flex items-center justify-center">
                              {photo ? (
                                <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon className="w-2 h-2 text-app-muted" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (() => {
                      const otherParticipants = activeConversation.participants.filter(uid => uid !== user.uid);
                      const otherUid = otherParticipants[0];
                      const photo = otherUid ? getParticipantPhoto(otherUid, activeConversation.participant_photos) : null;
                      return photo ? (
                        <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-app-muted m-auto h-full" />
                      );
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-app-ink tracking-tight">
                      {activeConversation.is_group 
                        ? (activeConversation.name || 'Groepsgesprek') 
                        : (() => {
                            const otherParticipants = activeConversation.participants.filter(uid => uid !== user.uid);
                            const otherUid = otherParticipants[0];
                            return otherUid ? getParticipantName(otherUid, activeConversation.participant_names) : 'Onbekend';
                          })()
                      }
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {activeConversation.is_group ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-app-accent px-2.5 py-1 rounded-full border border-app-border">
                            <Users className="w-3 h-3 text-app-muted" />
                            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wide">
                              {activeConversation.participants.length} deelnemers
                            </span>
                          </div>
                          {groupVoiceCallActiveRooms?.has(activeConversation.id) && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                              <Volume2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Live Call Gaande
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (() => {
                        const otherParticipants = activeConversation.participants.filter(uid => uid !== user.uid);
                        const otherUid = otherParticipants[0];
                        const isOnline = otherUid && onlineUsers.has(otherUid);
                        return (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-app-accent px-2.5 py-1 rounded-full border border-app-border">
                              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-app-muted/30'}`} />
                              <span className="text-[10px] font-bold text-app-muted uppercase tracking-wide">
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Beveiligd
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {activeConversation && (
                    <button
                      onClick={() => {
                        setShowSearchBar(prev => !prev);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 text-app-muted ${
                        showSearchBar 
                          ? 'bg-app-ink/10 dark:bg-app-ink/20 text-app-ink' 
                          : 'bg-app-accent hover:bg-app-accent/80'
                      }`}
                      title="Zoek in gesprek..."
                    >
                      {showSearchBar ? <X size={20} /> : <Search size={18} />}
                    </button>
                  )}

                  {activeConversation && activeConversation.is_group && onStartGroupCall && (
                    <button
                      onClick={() => {
                        if (playSound) {
                          playSound('/audio/calls/start_call.mp3', true, user.uid, user.displayName || 'Anoniem');
                        }
                        onStartGroupCall(activeConversation.id, activeConversation.name || 'Groepsgesprek');
                      }}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 shadow-emerald-500/20"
                      title="Start Groepscall"
                    >
                      <Phone size={18} />
                    </button>
                  )}

                  {activeConversation && !activeConversation.is_group && onStartCall && (() => {
                    const otherUid = activeConversation.participants.find(uid => uid !== user.uid);
                    const isActivePeer = activeCallUserId && otherUid === activeCallUserId;
                    
                    return (
                      <button
                        onClick={() => {
                          const otherName = otherUid ? getParticipantName(otherUid, activeConversation.participant_names) : 'Onbekend';
                          const otherAvatar = otherUid ? getParticipantPhoto(otherUid, activeConversation.participant_photos) || undefined : undefined;
                          
                          if (playSound && !isActivePeer) {
                            playSound('/audio/calls/start_call.mp3', true, user.uid, user.displayName || 'Anoniem');
                          }
                          
                          if (otherUid) {
                            if (isActivePeer && onEndCall) {
                              onEndCall();
                            } else {
                              onStartCall(otherUid, otherName, otherAvatar);
                            }
                          }
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                          isActivePeer 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                        }`}
                        title={isActivePeer ? "Ophangen" : "Start spraakoproep"}
                      >
                        {isActivePeer ? <PhoneOff size={18} /> : <Phone size={18} />}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </header>

            {/* Message Search Bar */}
            <AnimatePresence>
              {showSearchBar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-app-card border-b border-app-border"
                >
                  <div className="px-8 py-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 bg bg-app-bg/55 border border-app-border rounded-xl px-4 py-2 hover:border-app-border/80 focus-within:border-app-ink/20 transition-all duration-300">
                      <Search className="w-4 h-4 text-app-muted" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Zoek in dit gesprek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-app-ink placeholder:text-app-muted/40 text-sm font-medium"
                      />
                      {searchQuery && (
                        <button 
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 hover:bg-app-accent/80 rounded-lg transition-colors text-app-muted hover:text-app-ink"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <span className="text-[10px] font-bold text-app-muted uppercase font-mono bg-app-accent px-2.5 py-1.5 rounded-lg border border-app-border whitespace-nowrap animate-fadeIn">
                        {filteredMessages.length} {filteredMessages.length === 1 ? 'resultaat' : 'resultaten'}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Pane */}
            <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col-reverse">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg, i) => {
                  const isMe = msg.sender_id === user.uid;
                  const prevMsg = filteredMessages[i+1]; // reversed
                  const isSameday = prevMsg && new Date(msg.created_at).toDateString() === new Date(prevMsg.created_at).toDateString();
                  const showDate = !isSameday;
                  
                  return (
                    <div key={msg.id} className="space-y-4">
                      {showDate && (
                        <div className="flex items-center gap-4 py-4 opacity-30">
                          <div className="flex-grow h-px bg-app-border" />
                          <span className="text-[10px] font-medium text-app-muted uppercase tracking-widest whitespace-nowrap">
                            {formatDate(msg.created_at)}
                          </span>
                          <div className="flex-grow h-px bg-app-border" />
                        </div>
                      )}
                      
                      <div className={`flex items-end gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {activeConversation.is_group && !isMe && (
                          <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-app-border bg-app-card flex-shrink-0 mb-6">
                            {getParticipantPhoto(msg.sender_id, activeConversation.participant_photos) ? (
                              <img 
                                src={getParticipantPhoto(msg.sender_id, activeConversation.participant_photos) || ''} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-app-muted">
                                {getParticipantName(msg.sender_id, activeConversation.participant_names).charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {activeConversation.is_group && !isMe && (
                            <span className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-1.5 ml-1">
                              {getParticipantName(msg.sender_id, activeConversation.participant_names) || 'Onbekend'}
                            </span>
                          )}
                          <div className={`flex items-center gap-2 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`
                                px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-all duration-300 relative font-medium
                                ${isMe 
                                  ? 'bg-app-ink text-app-bg rounded-br-none hover:shadow-xl' 
                                  : 'bg-app-card text-app-ink border border-app-border rounded-bl-none hover:border-app-border'}
                                ${!isMe && useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}
                              `}
                              style={!isMe && useCustomTheme ? { 
                                backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                                borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
                                boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
                                color: customTheme.text_color
                              } : {}}
                            >
                              {editingMessageId === msg.id ? (
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                  <input 
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    className="w-full bg-app-bg/10 border-none focus:ring-2 focus:ring-app-bg/30 text-app-bg text-sm p-2 rounded-xl"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        onEditMessage?.(msg.id, editInput);
                                        setEditingMessageId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingMessageId(null);
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end gap-3">
                                    <button 
                                      onClick={() => setEditingMessageId(null)} 
                                      className="p-1.5 hover:bg-app-bg/20 rounded-lg transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        onEditMessage?.(msg.id, editInput);
                                        setEditingMessageId(null);
                                      }} 
                                      className="p-1.5 bg-app-bg/20 hover:bg-app-bg/30 rounded-lg transition-colors"
                                    >
                                      <Check size={16} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <RichContent content={msg.text} searchQuery={searchQuery} />
                                  {msg.is_edited && (
                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${isMe ? 'opacity-50' : 'text-app-muted opacity-70'}`}>
                                      (Bewerkt)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action Buttons beside bubble */}
                            {isMe && !editingMessageId && (
                              <div className="flex flex-col gap-1 opacity-0 group-hover/msg:opacity-100 transition-all duration-200">
                                <button 
                                  onClick={() => { setEditingMessageId(msg.id); setEditInput(msg.text); }}
                                  className="p-1.5 bg-app-card border border-app-border rounded-lg text-app-muted hover:text-app-ink hover:bg-app-accent transition-colors shadow-sm"
                                  title="Bewerken"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
                                      onDeleteMessage?.(msg.id);
                                    }
                                  }}
                                  className="p-1.5 bg-app-card border border-app-border rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                  title="Verwijderen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="mt-2 text-[8px] font-mono text-app-muted opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
                  <div className="w-24 h-24 bg-app-accent rounded-[3rem] flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-12 h-12 text-app-muted/50" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-app-ink uppercase tracking-tight">
                      {searchQuery ? 'Geen resultaten' : 'Status'}
                    </h3>
                    <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em] mt-2">
                      {searchQuery 
                        ? `Geen berichten gevonden die voldoen aan "${searchQuery}"`
                        : 'Geen berichten gedetecteerd in dit cluster'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-8 bg-app-card/90 backdrop-blur-xl border-t border-app-border">
              {/* POLISHED FILE PREVIEW CARD */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="mb-4 p-3 bg-app-accent/80 border border-app-border rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {selectedFileType === 'image' ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-app-border bg-black flex-shrink-0">
                          <img src={selectedFile} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 flex-shrink-0">
                          <Volume2 className="w-6 h-6 animate-pulse" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-app-ink uppercase tracking-wider truncate">
                          {selectedFileType === 'image' ? 'Geselecteerde Foto' : 'Geselecteerd Audiobestand'}
                        </p>
                        <p className="text-[10px] text-app-muted font-mono truncate mt-0.5">
                          Klaar om te versturen ({Math.round(selectedFile.length / 1024)} KB)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedFileType(null);
                      }}
                      className="w-8 h-8 rounded-full bg-app-card border border-app-border text-app-muted hover:text-app-ink hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={onFormSubmit} className="relative group">
                <input 
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping(e, activeConversation.id);
                  }}
                  placeholder="Type je bericht..."
                  className="w-full pl-5 sm:pl-8 pr-40 sm:pr-56 py-4 sm:py-5 bg-app-bg/50 border-2 border-app-border rounded-2xl sm:rounded-3xl focus:border-app-ink focus:ring-0 transition-all font-bold text-app-ink placeholder:text-app-muted/50 text-sm sm:text-base"
                  style={useCustomTheme ? { 
                    backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                    borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
                    color: customTheme.text_color
                  } : {}}
                />
                <div className="absolute right-1 sm:right-2 top-1 sm:top-2 bottom-1 sm:bottom-2 flex items-center gap-0.5 sm:gap-1.5">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,audio/*"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 sm:p-2.5 text-app-muted hover:text-app-ink rounded-lg sm:rounded-xl hover:bg-app-accent transition-all"
                    title="Foto of audio uploaden"
                  >
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleImageUrl}
                    className="p-2 sm:p-2.5 text-app-muted hover:text-app-ink rounded-lg sm:rounded-xl hover:bg-app-accent transition-all"
                    title="Afbeelding via URL"
                  >
                    <Link className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleEmojiButtonClick(e, 'message')}
                    className="p-2 sm:p-2.5 text-app-muted hover:text-app-ink rounded-lg sm:rounded-xl hover:bg-app-accent transition-all"
                    title="Emoji kiezen"
                  >
                    <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    type="submit"
                    disabled={sending || (!messageInput.trim() && !selectedFile)}
                    className="px-4 sm:px-6 h-full bg-app-ink text-app-bg rounded-lg sm:rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[50px] sm:min-w-[80px]"
                  >
                    {sending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
            <div className="opacity-10 mb-8">
              <MessageSquare className="w-24 h-24 text-app-ink" />
            </div>
            <p className="text-app-muted max-w-xs mb-8 text-sm font-medium leading-relaxed">
              Kies een gesprek uit de lijst of start een nieuwe chat met een andere gebruiker.
            </p>
            <button 
              onClick={() => setShowUserSearch(true)}
              className="px-8 py-3 bg-app-ink text-app-bg rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              Nieuw gesprek starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
