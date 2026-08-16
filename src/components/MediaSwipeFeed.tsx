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
  Layers
} from 'lucide-react';
import { formatDate, getMediaShareUrl } from '../utils/helpers';
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
  nicknames: Record<string, string>;
  isAdmin?: boolean;
  profiles?: any[];
  onUploadClick?: () => void;
  initialMediaId?: string | null;
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
  nicknames,
  isAdmin,
  profiles,
  onUploadClick,
  initialMediaId,
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
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);
  const [doubleTapHearts, setDoubleTapHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const currentMedia = mediaList[currentIndex];

  // If initialMediaId changes, set currentIndex to that media item
  useEffect(() => {
    if (initialMediaId && mediaList.length > 0) {
      const idx = mediaList.findIndex(m => m.id === initialMediaId || m.media_url === initialMediaId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [initialMediaId, mediaList]);

  // Safely adjust currentIndex if media items delete or change
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

  // Keyboard navigation (ArrowUp / ArrowDown / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in comment input or any form field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' && currentMedia?.media_type === 'video') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, currentMedia]);

  // Mouse wheel snap scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (showComments) return; // Don't scroll feed if comments modal is active
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

  // Mobile Touch Swipe Gesture Detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showComments) return;
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showComments || touchStartY.current === null || touchStartX.current === null) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartY.current;
    const diffX = touch.clientX - touchStartX.current;

    // If vertical swipe is intended, prevent background page scroll interference
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      // Swiping active
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showComments || touchStartY.current === null || touchStartX.current === null) return;
    const touch = e.changedTouches[0];
    const diffY = touch.clientY - touchStartY.current;
    const diffX = touch.clientX - touchStartX.current;
    const timeTaken = Date.now() - touchStartTime.current;

    touchStartY.current = null;
    touchStartX.current = null;

    // Check if vertical motion is dominant
    if (Math.abs(diffY) > Math.abs(diffX)) {
      const isQuickFlick = timeTaken < 400 && Math.abs(diffY) > 20;
      const isSubstantialSwipe = Math.abs(diffY) > 35;

      if (isQuickFlick || isSubstantialSwipe) {
        if (diffY < 0) {
          goToNext(); // Swipe Up -> Next Post
        } else {
          goToPrev(); // Swipe Down -> Previous Post
        }
      }
    }
  };

  // Video element play/pause control
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  // Double tap / click to like
  const handleMediaAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapRef.current < 320) {
      // Double tap detected!
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
      if (currentMedia?.media_type === 'video') {
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
      <div className="flex flex-col items-center justify-center py-20 text-center bg-app-card border border-app-border rounded-3xl p-8">
        <Layers className="w-12 h-12 text-app-muted mx-auto mb-3 opacity-30" />
        <p className="text-sm text-app-muted font-medium italic">{t("Geen media om te tonen in de swipe feed.")}</p>
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
  const isVerified = isVerifiedEmail(authorProfile || authorProfile?.email);
  const isBeta = isBetaTester(authorProfile || authorProfile?.email);
  const isAuthorAdmin = authorProfile?.role === 'admin' || authorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 320 : -320,
      opacity: 0,
      scale: 0.94,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: 'spring' as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.22 },
        scale: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -320 : 320,
      opacity: 0,
      scale: 0.94,
      transition: {
        y: { type: 'spring' as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto h-[calc(100dvh-130px)] sm:h-[84vh] min-h-[500px] max-h-[880px] bg-black rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800 select-none flex flex-col justify-between touch-pan-y"
    >
      {/* Background ambient blur for wide/tall aspect ratios */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-110 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${currentMedia.media_url})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none z-10" />

      {/* Top Header Overlay: Index Counter & Nav Controls */}
      <div className="relative z-20 p-3.5 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-black text-white font-mono tracking-wider">
            {currentIndex + 1} <span className="text-zinc-400">/</span> {mediaList.length}
          </span>
          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
            {currentMedia.media_type === 'video' ? 'Video' : 'Foto'}
          </span>
        </div>

        {/* Up/Down Quick Nav arrows */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:text-white/80 rounded-full hover:bg-white/10 transition-colors"
            title="Vorige (Pijl Omhoog)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === mediaList.length - 1}
            className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:text-white/80 rounded-full hover:bg-white/10 transition-colors"
            title="Volgende (Pijl Omlaag)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area with Swipe Gesture Detection */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentMedia.id || currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              const isFast = Math.abs(info.velocity.y) > 180;
              const isFar = Math.abs(info.offset.y) > 25;
              if (info.offset.y < 0 && (isFar || isFast)) {
                goToNext();
              } else if (info.offset.y > 0 && (isFar || isFast)) {
                goToPrev();
              }
            }}
            className="absolute inset-0 flex items-center justify-center cursor-pointer touch-none"
            onClick={handleMediaAreaClick}
          >
            {currentMedia.media_type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={currentMedia.media_url}
                  className="w-full h-full object-contain max-h-full"
                  loop
                  playsInline
                  autoPlay
                  muted={isMuted}
                  preload="metadata"
                />
                {!isPlaying && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] pointer-events-none"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/70 border border-white/20 flex items-center justify-center shadow-2xl text-white">
                      <Play className="w-8 h-8 ml-1 fill-white" />
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <img
                src={currentMedia.media_url}
                alt=""
                className="w-full h-full object-contain max-h-full"
                referrerPolicy="no-referrer"
                loading="eager"
                draggable={false}
              />
            )}

            {/* Double Tap Hearts Animation */}
            {doubleTapHearts.map(heart => (
              <motion.div
                key={heart.id}
                initial={{ scale: 0, opacity: 0, y: 0 }}
                animate={{ scale: [0.8, 1.4, 1.2], opacity: [1, 1, 0], y: -50 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{ left: heart.x - 30, top: heart.y - 30 }}
                className="absolute pointer-events-none z-30 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
              >
                <Heart className="w-16 h-16 fill-red-500" />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Bar (TikTok / Shorts Right Side Column) */}
      <div className="absolute right-3.5 bottom-20 z-20 flex flex-col items-center gap-3.5">
        {/* Author Avatar */}
        <div className="relative mb-1">
          <button
            onClick={() => onOpenProfile(currentMedia.user_id)}
            className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500 border-2 border-white shadow-xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
            title="Profiel bekijken"
          >
            {currentMedia.author_photo ? (
              <img
                src={currentMedia.author_photo}
                alt=""
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
          </button>
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onLike(currentMedia.id, currentMedia.user_id)}
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl transition-all active:scale-75 ${
              isLikedByMe 
                ? 'bg-red-500/30 text-red-500 border border-red-500/50' 
                : 'bg-black/60 text-white/90 hover:text-red-400 border border-white/10 hover:bg-black/80'
            }`}
            title="Vind ik leuk"
          >
            <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-red-500' : ''}`} />
          </button>
          <span className="text-[11px] font-black text-white mt-1 drop-shadow-md font-mono">
            {likesList.length}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowComments(prev => !prev)}
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl transition-all active:scale-75 ${
              showComments
                ? 'bg-cyan-500 text-white border border-cyan-400' 
                : 'bg-black/60 text-white/90 hover:text-cyan-400 border border-white/10 hover:bg-black/80'
            }`}
            title="Reacties bekijken"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-black text-white mt-1 drop-shadow-md font-mono">
            {commentsList.length}
          </span>
        </div>

        {/* Video Audio Mute/Unmute toggle if video */}
        {currentMedia.media_type === 'video' && (
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white/90 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl active:scale-90 transition-all"
            title={isMuted ? 'Geluid aanzetten' : 'Dempen'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        )}

        {/* Fullscreen View */}
        <button
          onClick={() => onViewFullscreen(currentMedia.media_url)}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white/90 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl active:scale-90 transition-all"
          title="Volledig scherm openen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Share Link */}
        <button
          onClick={handleShare}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white/90 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl active:scale-90 transition-all relative"
          title="Deel link"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Delete Media (if authorized) */}
        {(currentUserId === currentMedia.user_id || isAdmin) && onDeleteMedia && (
          <button
            onClick={() => onDeleteMedia(currentMedia.id, currentMedia.user_id)}
            className="w-11 h-11 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 backdrop-blur-md flex items-center justify-center shadow-xl active:scale-90 transition-all"
            title="Verwijder media"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Copied Toast Notification */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-cyan-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full shadow-2xl border border-white/20 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Link gekopieerd!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Info Banner (Author & Details & Mobile Quick Nav) */}
      <div className="relative z-20 p-4 sm:p-5 pr-16 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-between">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onOpenProfile(currentMedia.user_id)}
            className="flex items-center gap-2 group/author text-left max-w-full truncate"
          >
            <span className="text-sm font-black text-white group-hover/author:text-cyan-400 transition-colors drop-shadow-md truncate">
              {nicknames[currentMedia.user_id] || currentMedia.author_name}
            </span>
            {isVerified && (
              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" title="Geverifieerd Account">
                <Check className="w-2.5 h-2.5 stroke-[4]" />
              </span>
            )}
            {isBeta && (
              <span className="inline-flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 p-0.5 rounded shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]" title="Beta Tester">
                <FlaskConical className="w-3 h-3 text-amber-400 stroke-[2.5]" />
              </span>
            )}
            {isAuthorAdmin && (
              <span className="inline-flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 p-0.5 rounded shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.3)]" title="Administrator">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
              </span>
            )}
          </button>

          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {formatDate(currentMedia.created_at)}
          </p>
        </div>

        {/* Mobile Quick Thumb Nav Bar (Visible on mobile screens) */}
        <div className="flex sm:hidden items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shrink-0">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="p-1 text-white/80 active:text-cyan-400 disabled:opacity-25 transition-colors"
            title="Vorige"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-[9px] font-mono font-bold text-zinc-400 px-0.5">
            {currentIndex + 1}/{mediaList.length}
          </span>
          <button
            onClick={goToNext}
            disabled={currentIndex === mediaList.length - 1}
            className="p-1 text-white/80 active:text-cyan-400 disabled:opacity-25 transition-colors"
            title="Volgende"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-Up Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 top-1/4 z-40 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/80 rounded-t-[2rem] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Reacties ({commentsList.length})
                </h4>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {commentsList.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <p className="text-xs italic">{t("Nog geen reacties. Laat als eerste van je horen!")}</p>
                </div>
              ) : (
                commentsList.map((comment, idx) => {
                  const cAuthorProfile = profiles?.find((p: any) => p.id === comment.user_id);
                  const isCVerified = isVerifiedEmail(cAuthorProfile || cAuthorProfile?.email);
                  const isCBeta = isBetaTester(cAuthorProfile || cAuthorProfile?.email);
                  const isCAdmin = cAuthorProfile?.role === 'admin' || cAuthorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

                  return (
                    <div key={comment.id || idx} className="flex gap-2.5 items-start">
                      <div className="w-7 h-7 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                        {comment.author_photo ? (
                          <img src={comment.author_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-3.5 py-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-black text-white truncate max-w-[130px]">
                              {nicknames[comment.user_id] || comment.author_name || 'Anoniem'}
                            </span>
                            {isCVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0" title="Geverifieerd">
                                <Check className="w-1.5 h-1.5 stroke-[4]" />
                              </span>
                            )}
                            {isCBeta && (
                              <span className="inline-flex items-center justify-center text-amber-400 p-0.5 rounded shrink-0" title="Beta">
                                <FlaskConical className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                            )}
                            {isCAdmin && (
                              <span className="inline-flex items-center justify-center text-red-400 p-0.5 rounded shrink-0" title="Admin">
                                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-mono text-zinc-400">
                              {formatDate(comment.created_at)}
                            </span>
                            {(currentUserId === comment.user_id || isAdmin) && onDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(currentMedia.id, currentMedia.user_id, comment.id)}
                                className="text-zinc-400 hover:text-red-400 transition-colors p-0.5"
                                title="Verwijder reactie"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-200 mt-1 leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleCommentSubmit} className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-950/80">
              <input
                type="text"
                placeholder={t("Schrijf een reactie...")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-zinc-900 text-xs text-white rounded-xl border border-zinc-700 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="px-3 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
