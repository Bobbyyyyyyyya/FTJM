import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, X, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Post, CustomTheme } from '../types';
import { PostItem } from './PostItem';

interface ChatViewProps {
  user: any;
  posts: Post[];
  isAdmin: boolean;
  postInput: string;
  handleCreatePost: (e: React.FormEvent) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, channel: string) => void;
  cooldownRemaining: number;
  sending: boolean;
  replyingTo: Post | null;
  setReplyingTo: (post: Post | null) => void;
  typingStatuses: Record<string, string[]>;
  handleOpenProfile: (userId: string) => void;
  handleOpenReport: (type: 'post', id: string, userId: string, name: string) => void;
  setEditingPostId: (id: string | null) => void;
  setEditPostInput: (input: string) => void;
  handleUpdatePost: (id: string) => void;
  handleDeletePost: (id: string) => void;
  handleStartConversation: (user: { id: string, display_name: string }) => void;
  editingPostId: string | null;
  editPostInput: string;
  saving: boolean;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File) => void;
  nicknames: Record<string, string>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  posts,
  isAdmin,
  postInput,
  handleCreatePost,
  handleTyping,
  cooldownRemaining,
  sending,
  replyingTo,
  setReplyingTo,
  typingStatuses,
  handleOpenProfile,
  handleOpenReport,
  setEditingPostId,
  setEditPostInput,
  handleUpdatePost,
  handleDeletePost,
  handleStartConversation,
  editingPostId,
  editPostInput,
  saving,
  useCustomTheme,
  customTheme,
  uploading,
  fileInputRef,
  handleFileUpload,
  nicknames
}) => {
  return (
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
                type="button"
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
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept="image/*"
          className="hidden"
        />

        <div className="relative">
          <input 
            type="text"
            value={postInput}
            onChange={(e) => handleTyping(e, 'forum')}
            placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Deel een bericht..."}
            disabled={cooldownRemaining > 0}
            className="w-full pl-4 sm:pl-6 pr-24 sm:pr-28 py-3 sm:py-4 bg-app-bg border border-app-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base text-app-ink placeholder:text-app-muted"
            maxLength={1000}
          />
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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
              disabled={sending || !postInput.trim() || cooldownRemaining > 0}
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
            <PostItem 
              key={post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              onReply={setReplyingTo}
              onReport={handleOpenReport}
              onEdit={(id, content) => {
                setEditingPostId(id);
                setEditPostInput(content);
              }}
              onDelete={handleDeletePost}
              onStartDM={handleStartConversation}
              onOpenProfile={handleOpenProfile}
              editingPostId={editingPostId}
              editPostInput={editPostInput}
              handleTyping={handleTyping}
              onUpdatePost={handleUpdatePost}
              onCancelEdit={() => setEditingPostId(null)}
              saving={saving}
              nicknames={nicknames}
            />
          ))
        )}
      </div>
      
      {posts.length > 5 && (
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-8 right-8 p-3 bg-app-ink text-app-bg rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 border border-app-border/20"
          title="Terug naar boven"
        >
          <ChevronLeft className="w-5 h-5 rotate-90" />
        </button>
      )}
    </div>
  );
};
