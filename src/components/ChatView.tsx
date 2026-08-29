import React from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, ChevronLeft, Smile, Paperclip, Volume2, Film } from 'lucide-react';
import { ThemedSpinner } from './ThemedLoadingScreen';
import { AnimatedSendIcon } from './AnimatedIcons';
import { Post, CustomTheme, UserProfile } from '../types';
import { PostItem } from './PostItem';
import { VideoTrimmerModal } from './VideoTrimmerModal';
import { uploadImageToImgBB, compressImageToBlob, compressImage, hexToRgba } from '../utils/helpers';

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
  handleBlockPost?: (id: string, currentStatus: boolean) => void;
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

export const ChatView: React.FC<ChatViewProps> = React.memo((props) => {
  const {
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
    handleBlockPost,
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
  } = props;

  const propsRef = React.useRef(props);
  React.useLayoutEffect(() => {
    propsRef.current = props;
  });

  const onReply = React.useCallback((post: Post) => propsRef.current.setReplyingTo(post), []);
  const onReport = React.useCallback((type: 'post', id: string, userId: string, name: string) => propsRef.current.handleOpenReport(type, id, userId, name), []);
  const onEdit = React.useCallback((id: string, content: string) => {
    propsRef.current.setEditingPostId(id);
    propsRef.current.setEditPostInput(content);
  }, []);
  const onBlockPost = React.useCallback((id: string, currentStatus: boolean) => propsRef.current.handleBlockPost?.(id, currentStatus), []);
  const onDelete = React.useCallback((id: string) => propsRef.current.handleDeletePost(id), []);
  const onStartDM = React.useCallback((dmUser: { id: string, display_name: string }) => propsRef.current.handleStartConversation(dmUser), []);
  const onOpenProfile = React.useCallback((userId: string) => propsRef.current.handleOpenProfile(userId), []);
  const onTyping = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, channel: string) => propsRef.current.handleTyping(e, channel), []);
  const onUpdatePost = React.useCallback((id: string) => propsRef.current.handleUpdatePost(id), []);
  const onCancelEdit = React.useCallback(() => propsRef.current.setEditingPostId(null), []);

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = React.useState<'image' | 'audio' | 'video' | null>(null);
  const [videoToTrim, setVideoToTrim] = React.useState<File | null>(null);
  const [isCompressing, setIsCompressing] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) { // Increased limit but we optimize strongly
      alert("Bestand is te groot. Selecteer een bestand kleiner dan 15MB.");
      return;
    }

    setIsCompressing(true);
    try {
      const isVideoFile = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|ogv|3gp)$/i.test(file.name);
      const isAudioFile = !isVideoFile && (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|opus|aac|flac)$/i.test(file.name));
      const isImageFile = !isVideoFile && !isAudioFile && (file.type.startsWith('image/') || /\.(jpeg|jpg|gif|png|webp|bmp|svg|avif)$/i.test(file.name));

      if (isVideoFile) {
        setVideoToTrim(file);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else if (isAudioFile) {
        const uploadRes = await uploadImageToImgBB(file, file.name);
        if (uploadRes?.url) {
          setSelectedFile(uploadRes.url);
          setSelectedFileType('audio');
          toast.success('Audiobestand geüpload!');
        } else {
          setSelectedFile(null);
          setSelectedFileType(null);
          toast.error('Kon audiobestand niet uploaden.');
        }
      } else if (isImageFile) {
        // 1. Binary WebP compression
        const webpBlob = await compressImageToBlob(file, 800, 600, 0.65, 'image/webp');
        
        // 2. Upload to CDN / Server storage
        const imgbbRes = await uploadImageToImgBB(webpBlob, file.name);
        if (imgbbRes?.url) {
          setSelectedFile(imgbbRes.url);
          setSelectedFileType('image');
          toast.success('Afbeelding geüpload naar CDN!');
        } else {
          setSelectedFile(null);
          setSelectedFileType(null);
          toast.error('Uploaden van afbeelding is mislukt. Probeer het opnieuw.');
        }
      } else {
        alert("Selecteer een geldige video, afbeelding of audiobestand.");
      }
    } catch (err) {
      console.error("Error reading file:", err);
      toast.error('Kon bestand niet verwerken.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsCompressing(true);
          try {
            const webpBlob = await compressImageToBlob(file, 800, 600, 0.65, 'image/webp');
            const imgbbRes = await uploadImageToImgBB(webpBlob, 'pasted_image');
            if (imgbbRes?.url) {
              setSelectedFile(imgbbRes.url);
              setSelectedFileType('image');
              toast.success('Geplakte afbeelding geüpload!');
            } else {
              setSelectedFile(null);
              setSelectedFileType(null);
              toast.error('Uploaden van geplakte afbeelding is mislukt.');
            }
          } catch (err) {
            console.error('Paste image error:', err);
            toast.error('Kon geplakte afbeelding niet uploaden.');
          } finally {
            setIsCompressing(false);
          }
          break;
        }
      }
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
        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? hexToRgba(customTheme.card_bg_color, (100 - (customTheme.chat_opacity ?? 0)) / 100) : undefined),
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
          {isCompressing && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 p-3 bg-app-accent/80 border border-app-border rounded-2xl flex items-center gap-4 backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-xl bg-app-card border border-app-border flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-inner">
                <ThemedSpinner size="md" color="var(--custom-primary, #06b6d4)" />
              </div>
              <div>
                <p className="text-xs font-black text-app-ink uppercase tracking-wider flex items-center gap-1.5">
                  Bestand Verwerken
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                </p>
                <p className="text-[10px] text-app-muted font-mono mt-0.5">
                  Bestand optimaliseren voor snelle verzending...
                </p>
              </div>
            </motion.div>
          )}

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 p-3 bg-app-accent/80 border border-app-border rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {selectedFileType === 'video' ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-app-border bg-black flex-shrink-0 relative flex items-center justify-center">
                    <video src={selectedFile} className="w-full h-full object-cover" muted playsInline />
                    <Film className="w-4 h-4 text-cyan-400 absolute inset-0 m-auto drop-shadow" />
                  </div>
                ) : selectedFileType === 'image' ? (
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
                    {selectedFileType === 'video' ? 'Geselecteerde Video' : selectedFileType === 'image' ? 'Geselecteerde Foto' : 'Geselecteerd Audiobestand'}
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
            onPaste={handlePaste}
            placeholder={cooldownRemaining > 0 ? `Wacht ${cooldownRemaining}s...` : "Deel een bericht..."}
            disabled={cooldownRemaining > 0}
            className="w-full pl-4 sm:pl-6 pr-28 sm:pr-36 py-3 sm:py-4 bg-app-bg border border-app-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all disabled:opacity-50 text-sm sm:text-base text-app-ink placeholder:text-app-muted"
            style={useCustomTheme ? { 
              backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? hexToRgba(customTheme.card_bg_color, (100 - (customTheme.chat_opacity ?? 0)) / 100) : undefined),
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
            <motion.button 
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={cooldownRemaining > 0 || isCompressing}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-colors cursor-pointer"
              title="Foto, video of audiobestand uploaden (via ImgBB CDN)"
            >
              {isCompressing ? <ThemedSpinner size="xs" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
            <motion.button 
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleEmojiButtonClick(e, 'post')}
              disabled={cooldownRemaining > 0}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="Emoji kiezen"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              disabled={sending || (!postInput.trim() && !selectedFile) || cooldownRemaining > 0 || uploading}
              className="px-3 sm:px-4 h-full bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[40px] sm:min-w-[50px] shadow-sm"
            >
              {sending ? (
                <ThemedSpinner size="xs" color="currentColor" />
              ) : (
                <AnimatedSendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </form>

      <div className="space-y-4 sm:space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-app-muted text-xs sm:text-sm">Nog geen berichten. Deel als eerste iets!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostItem 
              key={post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              onReply={onReply}
              onReport={onReport}
              onEdit={onEdit}
              onBlockPost={onBlockPost}
              onDelete={onDelete}
              onStartDM={onStartDM}
              onOpenProfile={onOpenProfile}
              editingPostId={editingPostId}
              editPostInput={editPostInput}
              handleTyping={onTyping}
              onUpdatePost={onUpdatePost}
              onCancelEdit={onCancelEdit}
              saving={saving}
              nicknames={nicknames}
              allPosts={posts}
              useCustomTheme={useCustomTheme}
              customTheme={customTheme}
              profiles={profiles}
              userProfile={userProfile}
              isMediaExpired={false}
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

      {videoToTrim && (
        <VideoTrimmerModal
          file={videoToTrim}
          onTrimmed={async (dataUrl) => {
            setVideoToTrim(null);
            setIsCompressing(true);
            try {
              const uploadRes = await uploadImageToImgBB(dataUrl, 'video_clip.webm');
              if (uploadRes?.url) {
                setSelectedFile(uploadRes.url);
                setSelectedFileType('video');
                toast.success('Videofragment geüpload!');
              } else {
                toast.error('Kon videofragment niet uploaden.');
              }
            } catch (err) {
              console.error('Video upload error:', err);
              toast.error('Fout bij uploaden videofragment.');
            } finally {
              setIsCompressing(false);
            }
          }}
          onCancel={() => {
            setVideoToTrim(null);
          }}
        />
      )}
    </div>
  );
});
