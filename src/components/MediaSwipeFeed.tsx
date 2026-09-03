import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  User as UserIcon, 
  Trash2, 
  ShieldCheck, 
  Check, 
  FlaskConical, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Share2, 
  Play, 
  Pause, 
  Sparkles, 
  X,
  Plus,
  Layers,
  LayoutGrid,
  RefreshCw,
  ShieldAlert,
  Ban
} from 'lucide-react';
import { formatDate, getMediaShareUrl, getSafeImageUrl, handleImageError } from '../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../constants';
import { t } from '../utils/translations';

interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  author_photo: string | null;
  text: string;
  created_at: string;
}

interface MediaItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  author_name: string;
  author_photo: string | null;
  likes: string[];
  comments: Comment[];
  is_blocked?: boolean;
}

interface MediaSwipeFeedProps {
  mediaList: MediaItem[];
  currentUserId: string | undefined;
  onLike: (mediaId: string, authorId: string) => void;
  onComment: (mediaId: string, authorId: string, text: string) => void;
  onDeleteComment?: (mediaId: string, authorId: string, commentId: string) => void;
  onOpenProfile: (userId: string) => void;
  onViewFullscreen: (url: string) => void;
  onDeleteMedia?: (mediaId: string, authorId: string) => void;
  onToggleBlockMedia?: (mediaId: string, authorId: string) => void;
  nicknames: Record<string, string>;
  isAdmin?: boolean;
  profiles?: any[];
  onUploadClick?: () => void;
  initialMediaId?: string | null;
  onSwitchToGrid?: () => void;
  onRefresh?: () => void;
  isUploading?: boolean;
}

export const MediaSwipeFeed: React.FC<MediaSwipeFeedProps> = ({
  mediaList,
  currentUserId,
  onLike,
  onComment,
  onDeleteComment,
  onOpenProfile,
  onViewFullscreen,
  onDeleteMedia,
  onToggleBlockMedia,
  nicknames,
  isAdmin,
  profiles,
  onUploadClick,
  initialMediaId,
  onSwitchToGrid,
  onRefresh,
  isUploading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialMediaId && mediaList.length > 0) {
      const idx = mediaList.findIndex(m => m.id === initialMediaId || m.media_url === initialMediaId);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [direction, setDirection] = useState<number>(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);
  const [doubleTapHearts, setDoubleTapHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef<boolean>(false);

  const currentMedia = mediaList[currentIndex];

  const isVideo = currentMedia?.media_type === 'video' || (Boolean(currentMedia?.media_url) && (
    currentMedia.media_url.startsWith('data:video/') || 
    currentMedia.media_url.startsWith('data:audio/mp4') || 
    currentMedia.media_url.startsWith('data:audio/webm') || 
    currentMedia.media_url.startsWith('data:audio/quicktime') || 
    /\.(mp4|webm|mov|mkv|m4v|ogv|avi|3gp)(\?.*)?$/i.test(currentMedia.media_url)
  ));

  useEffect(() => {
    if (initialMediaId && mediaList.length > 0) {
      const idx = mediaList.findIndex(m => m.id === initialMediaId || m.media_url === initialMediaId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [initialMediaId, mediaList]);

  useEffect(() => {
    if (currentIndex >= mediaList.length && mediaList.length > 0) {
      setCurrentIndex(mediaList.length - 1);
    }
  }, [mediaList.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < mediaList.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setShowComments(false);
      setIsPlaying(true);
    }
  }, [currentIndex, mediaList.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setShowComments(false);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' && isVideo) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, isVideo]);

  const handleWheel = (e: React.WheelEvent) => {
    if (showComments) return;
    if (isScrollingRef.current) return;

    if (Math.abs(e.deltaY) > 25) {
      isScrollingRef.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 380);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (videoRef.current && !isMuted) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying, isMuted]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleMediaAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapRef.current < 320) {
      const heartId = Date.now();
      setDoubleTapHearts(prev => [...prev, { id: heartId, x, y }]);
      setTimeout(() => {
        setDoubleTapHearts(prev => prev.filter(h => h.id !== heartId));
      }, 1000);

      if (currentMedia && currentUserId && !currentMedia.likes?.includes(currentUserId)) {
        onLike(currentMedia.id, currentMedia.user_id);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      if (isVideo) {
        togglePlayPause();
      }
    }
  };

  const handleShare = () => {
    if (currentMedia) {
      const shareUrl = getMediaShareUrl(currentMedia.id || currentMedia.media_url);
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentMedia) return;
    onComment(currentMedia.id, currentMedia.user_id, commentText);
    setCommentText('');
  };

  if (!currentMedia) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-full">
        <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-30" />
        <p className="text-sm text-zinc-400 font-medium italic">{t("Geen media om te tonen in de swipe feed.")}</p>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t("Upload eerste foto of video")}</span>
          </button>
        )}
      </div>
    );
  }

  const likesList = currentMedia.likes || [];
  const commentsList = currentMedia.comments || [];
  const isLikedByMe = currentUserId ? likesList.includes(currentUserId) : false;

  const authorProfile = profiles?.find((p: any) => p.id === currentMedia.user_id);
  const resolvedAuthorPhoto = authorProfile?.photo_url || currentMedia.author_photo || null;
  const isVerified = isVerifiedEmail(authorProfile || authorProfile?.email);
  const isBeta = isBetaTester(authorProfile || authorProfile?.email);
  const isAuthorAdmin = authorProfile?.role === "admin" || authorProfile?.email?.toLowerCase() === "markohoksen@gmail.com";

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "100%" : dir < 0 ? "-100%" : "0%",
      opacity: dir === 0 ? 1 : 0,
      scale: dir === 0 ? 1 : 0.95,
    }),
    center: {
      y: "0%",
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
      transition: {
        y: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full max-w-[460px] mx-auto h-[calc(100dvh-125px)] min-h-[540px] max-h-[900px] bg-black sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800/80 select-none touch-pan-y group flex flex-col"
    >
      {/* Dynamic Blurred Background */}
      <div 
        key={"bg-" + (currentMedia.id || currentIndex)}
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-125 pointer-events-none z-0 transition-all duration-500"
        style={{ backgroundImage: "url(" + currentMedia.media_url + ")" }}
      />
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

      {/* Media Container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentMedia.id || (currentMedia.media_url + currentIndex)}
            custom={direction}
            variants={slideVariants}
            initial={direction === 0 ? false : "enter"}
            animate="center"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              const isFast = Math.abs(info.velocity.y) > 250;
              const isFar = Math.abs(info.offset.y) > 70;
              if (info.offset.y < 0 && (isFar || isFast)) {
                goToNext();
              } else if (info.offset.y > 0 && (isFar || isFast)) {
                goToPrev();
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-hidden"
            onClick={handleMediaAreaClick}
          >
            {currentMedia.is_blocked && !isAdmin ? (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center text-zinc-300 gap-4 border border-red-500/30 z-20">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="font-black text-sm text-red-400 tracking-wider uppercase">Content Tijdelijk Geblokkeerd</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Deze media is door een moderator tijdelijk verborgen voor de community in afwachting van beoordeling.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentMedia.is_blocked && isAdmin && (
                  <div className="absolute top-16 left-4 z-30 bg-red-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full border border-red-400 shadow-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Geblokkeerd (Zichtbaar voor Admin)</span>
                  </div>
                )}

                {isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={currentMedia.media_url}
                      className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                      loop
                      playsInline
                      autoPlay
                      muted={isMuted}
                      preload="auto"
                    />
                    {!isPlaying && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] pointer-events-none"
                      >
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl text-white">
                          <Play className="w-10 h-10 ml-1 fill-white" />
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <img
                    src={getSafeImageUrl(currentMedia?.media_url)}
                    alt=""
                    className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onError={handleImageError}
                  />
                )}
              </>
            )}

            {/* Double Tap Hearts Animation */}
            {doubleTapHearts.map(heart => (
              <motion.div
                key={heart.id}
                initial={{ scale: 0, opacity: 0, y: 0 }}
                animate={{ scale: [0.8, 1.4, 1.2], opacity: [1, 1, 0], y: -50 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                style={{ left: heart.x - 30, top: heart.y - 30 }}
                className="absolute pointer-events-none z-30 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
              >
                <Heart className="w-16 h-16 fill-red-500" />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay Gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Top Floating Navigation */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onSwitchToGrid && (
            <button onClick={onSwitchToGrid} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all hover:bg-white/20" title="Terug naar Grid">
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
          <div className="px-3.5 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black tracking-widest text-white drop-shadow-md">
              {currentIndex + 1} / {mediaList.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onUploadClick && (
            <button onClick={onUploadClick} className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-90 transition-all border border-cyan-400" title="Upload Media">
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          )}
        </div>
      </div>

      {/* Copied Toast Notification */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-1.5"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Link gekopieerd!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Action Bar */}
      <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-5">
        {/* Author Avatar */}
        <div className="relative mb-2 group/avatar">
          <button 
            onClick={() => onOpenProfile(currentMedia.user_id)}
            className="w-12 h-12 rounded-full border-2 border-white shadow-xl overflow-hidden bg-zinc-800 active:scale-95 transition-all"
            title="Profiel bekijken"
          >
            {resolvedAuthorPhoto?.trim() ? (
              <img 
                src={getSafeImageUrl(resolvedAuthorPhoto)} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            ) : (
               <UserIcon className="w-6 h-6 m-auto text-white/50" />
            )}
          </button>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-1 group/action">
          <button 
            onClick={() => onLike(currentMedia.id, currentMedia.user_id)}
            className={"w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-75 shadow-lg " + (isLikedByMe ? "bg-red-500/20" : "bg-black/40 hover:bg-black/60")}
          >
            <Heart className={"w-6 h-6 " + (isLikedByMe ? "fill-red-500 text-red-500" : "text-white drop-shadow-md group-hover/action:text-red-400")} />
          </button>
          <span className="text-xs font-bold text-white drop-shadow-md shadow-black">{likesList.length}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1 group/action">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 shadow-lg"
          >
            <MessageSquare className="w-6 h-6 text-white drop-shadow-md group-hover/action:text-cyan-400" />
          </button>
          <span className="text-xs font-bold text-white drop-shadow-md shadow-black">{commentsList.length}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1 group/action relative">
          <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 shadow-lg"
          >
            <Share2 className="w-6 h-6 text-white drop-shadow-md group-hover/action:text-green-400" />
          </button>
          <span className="text-xs font-bold text-white drop-shadow-md shadow-black">Deel</span>
        </div>

        {/* Fullscreen */}
        <div className="flex flex-col items-center gap-1 group/action relative mt-2">
          <button 
            onClick={() => onViewFullscreen(currentMedia.media_url)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 shadow-lg border border-white/10"
            title="Volledig Scherm"
          >
            <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
          </button>
        </div>

        {/* Admin Block Toggle Button */}
        {isAdmin && onToggleBlockMedia && (
          <div className="flex flex-col items-center gap-1 mt-1">
            <button 
              onClick={() => onToggleBlockMedia(currentMedia.id, currentMedia.user_id)}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-75 shadow-lg border ${
                currentMedia.is_blocked 
                  ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-400' 
                  : 'bg-amber-500/25 border-amber-500/50 text-amber-400'
              }`}
              title={currentMedia.is_blocked ? "Deblokkeer media" : "Tijdelijk blokkeren voor gebruikers"}
            >
              <Ban className="w-4 h-4" />
            </button>
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter drop-shadow-md">
              {currentMedia.is_blocked ? 'Deblok' : 'Blokkeer'}
            </span>
          </div>
        )}

        {/* Extra Options / Delete (For user's own media OR system admin) */}
        {((currentUserId && currentUserId === currentMedia.user_id) || isAdmin) && onDeleteMedia && (
          <div className="flex flex-col items-center gap-1 mt-1">
            <button 
              onClick={() => onDeleteMedia(currentMedia.id, currentMedia.user_id)}
              className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 shadow-lg border border-red-500/30"
              title={isAdmin && currentUserId !== currentMedia.user_id ? "Beheerder: Verwijder media" : "Mijn foto/video verwijderen"}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
            <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter drop-shadow-md">Wis</span>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute left-4 bottom-8 right-20 z-20 flex flex-col gap-2 pointer-events-none">
        <button 
          onClick={(e) => {
             e.stopPropagation();
             onOpenProfile(currentMedia.user_id);
          }}
          className="flex items-center gap-2 group/author w-max max-w-full text-left pointer-events-auto"
        >
          <span className="text-base sm:text-lg font-black text-white drop-shadow-lg shadow-black group-hover/author:text-cyan-400 transition-colors truncate">
            {nicknames[currentMedia.user_id] || currentMedia.author_name}
          </span>
          {isVerified && (
            <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 shadow-lg" title="Geverifieerd Account">
              <Check className="w-2.5 h-2.5 stroke-[4]" />
            </span>
          )}
          {isBeta && (
            <span className="inline-flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 p-0.5 rounded shrink-0 shadow-lg" title="Beta Tester">
              <FlaskConical className="w-3 h-3 text-amber-400 stroke-[2.5]" />
            </span>
          )}
          {isAuthorAdmin && (
            <span className="inline-flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 p-0.5 rounded shrink-0 shadow-lg" title="Administrator">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-xs text-white/80 font-mono drop-shadow-md">
            {formatDate(currentMedia.created_at)}
          </span>
          {isVideo && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[10px] uppercase font-bold active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              {isMuted ? "Gedempt" : "Geluid"}
            </button>
          )}
        </div>
      </div>

      {/* Slide-Up Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="absolute inset-x-0 bottom-0 h-[65%] z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 sm:rounded-t-3xl rounded-t-2xl flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Comments Header */}
            <div className="relative flex items-center justify-center p-4 border-b border-white/10 shrink-0">
              <div className="absolute left-1/2 -top-2 w-12 h-1.5 rounded-full bg-white/20 -translate-x-1/2" />
              <h4 className="text-sm font-black text-white tracking-wider uppercase">Reacties ({commentsList.length})</h4>
              <button onClick={() => setShowComments(false)} className="absolute right-4 p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {commentsList.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <p className="text-sm italic">{t("Nog geen reacties. Laat als eerste van je horen!")}</p>
                </div>
              ) : (
                commentsList.map((comment, idx) => {
                  const cAuthorProfile = profiles?.find((p: any) => p.id === comment.user_id);
                  const isCVerified = isVerifiedEmail(cAuthorProfile || cAuthorProfile?.email);
                  const isCBeta = isBetaTester(cAuthorProfile || cAuthorProfile?.email);
                  const isCAdmin = cAuthorProfile?.role === "admin" || cAuthorProfile?.email?.toLowerCase() === "markohoksen@gmail.com";

                  const commentDisplayName = 
                    nicknames[comment.user_id] ||
                    (cAuthorProfile?.display_name && cAuthorProfile.display_name !== 'Anoniem' ? cAuthorProfile.display_name : null) ||
                    (comment.author_name && comment.author_name !== 'Anoniem' ? comment.author_name : null) ||
                    cAuthorProfile?.email?.split('@')[0] ||
                    'Gebruiker';
                  const commentPhoto = cAuthorProfile?.photo_url || comment.author_photo || null;

                  return (
                    <div key={comment.id || idx} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                        {commentPhoto?.trim() ? (
                          <img 
                            src={getSafeImageUrl(commentPhoto)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-white/90 truncate">
                              {commentDisplayName}
                            </span>
                            {isCVerified && <Check className="w-3 h-3 text-cyan-400" />}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {formatDate(comment.created_at)}
                            </span>
                            {currentUserId && currentUserId === comment.user_id && onDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(currentMedia.id, currentMedia.user_id, comment.id)}
                                className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                                title="Mijn reactie verwijderen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-white/80 mt-1 leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleCommentSubmit} className="p-3 sm:p-4 border-t border-white/10 flex gap-2 bg-zinc-950">
              <input
                type="text"
                placeholder={t("Schrijf een reactie...")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white/5 text-sm text-white rounded-full border border-white/10 px-4 py-3 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="w-11 h-11 rounded-full bg-cyan-500 disabled:opacity-50 text-white active:scale-95 transition-all shadow-lg flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
