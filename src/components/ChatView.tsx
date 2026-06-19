import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, X, ChevronLeft, Smile, Link, Paperclip, Volume2 } from 'lucide-react';
import { Post, CustomTheme, UserProfile } from '../types';
import { PostItem } from './PostItem';

interface ChatViewProps {
  user: any;
  posts: Post[];
  isAdmin: boolean;
  postInput: string;
  setPostInput?: (input: string) => void;
  handleCreatePost: (e: React.FormEvent, customContent?: string) => void;
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
  handleEmojiButtonClick: (e: React.MouseEvent, type: 'post') => void;
  handleImageUrl: () => void;
  nicknames: Record<string, string>;
  profiles?: UserProfile[];
  userProfile?: UserProfile | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  posts,
  isAdmin,
  postInput,
  setPostInput,
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
  handleEmojiButtonClick,
  handleImageUrl,
  nicknames,
  profiles,
  userProfile
}) => {
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
    if (!postInput.trim() && !selectedFile) {
      return;
    }

    if (selectedFile) {
      const finalInput = postInput.trim() ? `${postInput.trim()} ${selectedFile}` : selectedFile;
      handleCreatePost(e, finalInput);
      setSelectedFile(null);
      setSelectedFileType(null);
    } else {
      handleCreatePost(e);
    }
  };

  return (
    <div 
      className={`bg-app-card rounded-3xl p-4 sm:p-8 border border-app-border shadow-sm transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
        borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
        color: customTheme.text_color
      } : {}}
    >
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-app-ink" />
        <h3 className="text-lg sm:text-xl font-bold text-app-ink">General Chat</h3>
      </div>

      <form onSubmit={onFormSubmit} className="mb-6 sm:mb-10 relative pt-6 sm:pt-8">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 flex items-center justify-between bg-app-accent/50 border border-app-border p-3 rounded-xl backdrop-blur-sm"
              style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent', borderColor: 'transparent' } : {}}
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

        <div className="relative">
          <input 
            type="text"
            value={postInput}
            onChange={(e) => handleTyping(e, 'forum')}
            placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Deel een bericht..."}
            disabled={cooldownRemaining > 0}
            className="w-full pl-4 sm:pl-6 pr-36 sm:pr-48 py-3 sm:py-4 bg-app-bg border border-app-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base text-app-ink placeholder:text-app-muted"
            style={useCustomTheme ? { 
              backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
              borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
              color: customTheme.text_color
            } : {}}
            maxLength={1000}
          />
          <div className="absolute right-1 top-1 bottom-1 flex items-center gap-0.5 sm:gap-1">
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
              disabled={cooldownRemaining > 0}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-all"
              title="Foto of audio uploaden"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              type="button"
              onClick={handleImageUrl}
              disabled={uploading || cooldownRemaining > 0}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
              title="Afbeelding via URL"
            >
              <Link className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              type="button"
              onClick={(e) => handleEmojiButtonClick(e, 'post')}
              disabled={cooldownRemaining > 0}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
              title="Emoji kiezen"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              type="submit"
              disabled={sending || (!postInput.trim() && !selectedFile) || cooldownRemaining > 0 || uploading}
              className="px-3 sm:px-4 h-full bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[40px] sm:min-w-[50px]"
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
              allPosts={posts}
              useCustomTheme={useCustomTheme}
              customTheme={customTheme}
              profiles={profiles}
              userProfile={userProfile}
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
