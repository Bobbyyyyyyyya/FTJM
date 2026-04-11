import React from 'react';
import { motion } from 'motion/react';
import { Mail, Plus, User as UserIcon, ChevronLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { Conversation, DirectMessage, CustomTheme } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import { RichContent } from './RichContent';

interface MessagesViewProps {
  user: any;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  messages: DirectMessage[];
  messageInput: string;
  setMessageInput: (input: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement>, channel: string) => void;
  typingStatuses: Record<string, string[]>;
  mobileChatView: 'list' | 'chat';
  setMobileChatView: (view: 'list' | 'chat') => void;
  setShowUserSearch: (show: boolean) => void;
  onlineUsers: Set<string>;
  sending: boolean;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  conversations,
  activeConversation,
  setActiveConversation,
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
  handleTyping,
  typingStatuses,
  mobileChatView,
  setMobileChatView,
  setShowUserSearch,
  onlineUsers,
  sending,
  useCustomTheme,
  customTheme
}) => {
  return (
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
                    ? 'bg-app-ink text-app-bg shadow-lg shadow-app-ink/10' 
                    : 'hover:bg-app-accent text-app-muted hover:text-app-ink'
                }`}
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-app-bg/20 scale-110' : 'bg-app-accent group-hover:scale-105'}`}>
                    {conv.participant_photos[otherParticipantUid || ''] ? (
                      <img src={conv.participant_photos[otherParticipantUid || '']} alt="" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
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
                    <p className={`text-[10px] font-medium ${isActive ? 'opacity-60' : 'text-app-muted'}`}>
                      {formatDate(conv.updated_at)}
                    </p>
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
                    const otherUid = activeConversation.participants.find(uid => uid !== user.uid);
                    const photo = otherUid ? activeConversation.participant_photos[otherUid] : null;
                    return photo ? (
                      <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-app-muted" />
                    );
                  })()}
                </div>
                <div>
                  <p className="font-bold text-app-ink">
                    {(() => {
                      const otherUid = activeConversation.participants.find(uid => uid !== user.uid);
                      return otherUid ? activeConversation.participant_names[otherUid] : 'Onbekend';
                    })()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const otherUid = activeConversation.participants.find(uid => uid !== user.uid);
                      const isOnline = otherUid && onlineUsers.has(otherUid);
                      return (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-app-muted'}`} />
                          <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
                            {isOnline ? 'Online' : 'Offline'}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-4 custom-scrollbar flex flex-col-reverse">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.uid;
                const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showTime && (
                      <p className="text-[8px] font-bold text-app-muted uppercase tracking-[0.2em] mb-2 mt-4 w-full text-center">
                        {formatDate(msg.created_at)} • {formatTime(msg.created_at)}
                      </p>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl text-sm sm:text-base shadow-sm ${
                      isMe 
                        ? 'bg-app-ink text-app-bg rounded-tr-none' 
                        : 'bg-app-card text-app-ink border border-app-border rounded-tl-none'
                    }`}>
                      <RichContent content={msg.text} />
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <div className="w-20 h-20 bg-app-accent rounded-[2.5rem] flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-app-muted" />
                  </div>
                  <p className="text-lg font-black text-app-ink uppercase tracking-tighter">Begin het gesprek</p>
                  <p className="text-xs font-bold text-app-muted uppercase tracking-widest mt-2">Zeg hallo tegen je collega!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 sm:p-6 bg-app-card/80 backdrop-blur-md border-t border-app-border">
              <div className="relative">
                <input 
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping(e, activeConversation.id);
                  }}
                  placeholder="Typ een bericht..."
                  className="w-full pl-4 sm:pl-6 pr-14 sm:pr-16 py-3 sm:py-4 bg-app-bg border border-app-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm sm:text-base text-app-ink"
                />
                <button 
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="absolute right-1.5 top-1.5 p-2 sm:p-2.5 bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-app-accent rounded-[3rem] flex items-center justify-center mb-8 shadow-xl shadow-app-ink/5">
              <Mail className="w-10 h-10 text-app-muted" />
            </div>
            <h3 className="text-2xl font-black text-app-ink uppercase tracking-tighter">Jouw Berichten</h3>
            <p className="text-app-muted max-w-xs mt-3 font-medium">Selecteer een gesprek aan de linkerkant of start een nieuwe chat.</p>
            <button 
              onClick={() => setShowUserSearch(true)}
              className="mt-8 px-8 py-3 bg-app-ink text-app-bg rounded-2xl font-bold hover:scale-105 transition-all active:scale-95 shadow-lg"
            >
              Nieuw Gesprek
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
