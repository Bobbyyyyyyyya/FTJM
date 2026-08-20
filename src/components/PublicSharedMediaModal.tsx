import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageSquare,
  Lock,
  LogIn,
  X,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Check,
  FlaskConical,
  ShieldCheck,
  User as UserIcon,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../constants';
import { t } from '../utils/translations';
import { createSupabaseClient } from '../utils/supabase';

interface PublicSharedMediaModalProps {
  mediaId: string;
  onClose: () => void;
  onLogin: () => void;
}

export const PublicSharedMediaModal: React.FC<PublicSharedMediaModalProps> = ({
  mediaId,
  onClose,
  onLogin,
}) => {
  const [mediaItem, setMediaItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<string | null>(null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSharedMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient();
        
        // 1. Try to fetch from profile_media by ID
        const { data, error: fetchErr } = await supabase
          .from('profile_media')
          .select('*')
          .eq('id', mediaId)
          .maybeSingle();

        if (fetchErr) {
          console.warn('Could not fetch from profile_media table:', fetchErr);
        }

        let foundMedia = data;

        // 2. If not found by ID directly in profile_media, check all profile_media by media_url or list
        if (!foundMedia) {
          const { data: allMedia } = await supabase
            .from('profile_media')
            .select('*')
            .limit(100);
          foundMedia = allMedia?.find((m: any) => m.id === mediaId || m.media_url?.includes(mediaId));
        }

        if (!foundMedia) {
          if (isMounted) {
            setError('Deze media kon niet worden gevonden of is verwijderd.');
            setLoading(false);
          }
          return;
        }

        // Fetch author profile if not attached
        if (!foundMedia.author_profile && foundMedia.user_id) {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url, email, role')
            .eq('id', foundMedia.user_id)
            .maybeSingle();
          
          if (authorData) {
            foundMedia.author_name = authorData.display_name || 'Anoniem';
            foundMedia.author_photo = authorData.photo_url || null;
            foundMedia.author_profile = authorData;
          }
        }

        if (isMounted) {
          setMediaItem(foundMedia);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching public shared media:', err);
        if (isMounted) {
          setError('Er is een fout opgetreden bij het inladen.');
          setLoading(false);
        }
      }
    };

    fetchSharedMedia();

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  useEffect(() => {
    if (mediaItem?.media_type === 'video' && videoRef.current) {
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
  }, [mediaItem, isPlaying, isMuted]);

  const handleMediaClick = () => {
    if (mediaItem?.media_type === 'video') {
      setIsPlaying(prev => {
        const next = !prev;
        if (videoRef.current) {
          if (next) videoRef.current.play().catch(() => {});
          else videoRef.current.pause();
        }
        return next;
      });
    }
  };

  const triggerLoginPrompt = (actionName: string) => {
    setLoginPromptReason(actionName);
  };

  const authorProfile = mediaItem?.author_profile;
  const isVerified = authorProfile ? isVerifiedEmail(authorProfile || authorProfile.email) : false;
  const isBeta = authorProfile ? isBetaTester(authorProfile || authorProfile.email) : false;
  const isAuthorAdmin = authorProfile ? (authorProfile.role === 'admin' || authorProfile.email?.toLowerCase() === 'markohoksen@gmail.com') : false;

  const likesCount = (mediaItem?.likes || []).length;
  const commentsList = mediaItem?.comments || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Background Ambient Glow */}
      {mediaItem?.media_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${mediaItem.media_url})` }}
        />
      )}

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92dvh] sm:max-h-[95vh]"
      >
        {/* Top Header Bar */}
        <div className="relative z-20 p-3.5 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">FTJM Media</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Gedeelde Post
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Openbare weergave • Gedeeld via FTJM</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLogin}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Inloggen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Media ophalen...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <Layers className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-300 font-semibold mb-2">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Terug naar startpagina
            </button>
          </div>
        )}

        {/* Media Content */}
        {!loading && mediaItem && (
          <div className="relative flex-1 overflow-y-auto flex flex-col justify-between custom-scrollbar bg-black">
            {/* Visual Media Container */}
            <div 
              className="relative w-full h-[48dvh] sm:h-[64vh] md:h-[70vh] min-h-[340px] sm:min-h-[460px] max-h-[780px] bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
              onClick={handleMediaClick}
            >
              {mediaItem.media_type === 'video' ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={mediaItem.media_url}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    autoPlay
                    muted={isMuted}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white shadow-2xl">
                        <Play className="w-10 h-10 ml-1.5 fill-white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={mediaItem.media_url}
                  alt=""
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Side Floating Action Icons for Public Viewer */}
              <div className="absolute right-4 sm:right-6 bottom-6 z-20 flex flex-col items-center gap-3.5">
                {/* Like Button (Disabled for non-auth, prompts login) */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerLoginPrompt('liken');
                    }}
                    className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl active:scale-90 transition-all group relative"
                    title="Log in om te liken"
                  >
                    <Heart className="w-6 h-6 text-white/80 group-hover:text-red-400" />
                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 text-black shadow-md">
                      <Lock className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                  <span className="text-xs font-black text-white mt-1 drop-shadow-md font-mono">
                    {likesCount}
                  </span>
                </div>

                {/* Comment Button (Toggles view of existing comments) */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowComments(prev => !prev);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl transition-all ${
                      showComments 
                        ? 'bg-cyan-500 text-white border border-cyan-400' 
                        : 'bg-black/70 text-white/90 hover:text-cyan-400 border border-white/15 hover:bg-black/90'
                    }`}
                    title="Reacties bekijken"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-black text-white mt-1 drop-shadow-md font-mono">
                    {commentsList.length}
                  </span>
                </div>

                {/* Video Sound Toggle */}
                {mediaItem.media_type === 'video' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(prev => !prev);
                    }}
                    className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                    title={isMuted ? 'Geluid aanzetten' : 'Dempen'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
                  </button>
                )}

                {/* Fullscreen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenUrl(mediaItem.media_url);
                  }}
                  className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white/90 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                  title="Volledig scherm"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Author info overlay */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 border border-white/20 overflow-hidden shrink-0">
                  {mediaItem.author_photo ? (
                    <img src={mediaItem.author_photo} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white truncate max-w-[150px]">
                      {mediaItem.author_name || 'Anoniem'}
                    </span>
                    {isVerified && (
                      <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0" title="Geverifieerd">
                        <Check className="w-2 h-2 stroke-[4]" />
                      </span>
                    )}
                    {isBeta && (
                      <span className="inline-flex items-center justify-center text-amber-400 p-0.5 rounded shrink-0" title="Beta">
                        <FlaskConical className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                    )}
                    {isAuthorAdmin && (
                      <span className="inline-flex items-center justify-center text-red-400 p-0.5 rounded shrink-0" title="Admin">
                        <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {formatDate(mediaItem.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => triggerLoginPrompt('swipen')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-[11px] font-bold transition-all shrink-0"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Swipe vergrendeld</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Comments Drawer for Public Viewer */}
        <AnimatePresence>
          {showComments && !loading && mediaItem && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-zinc-800 bg-zinc-900/95 flex flex-col max-h-[220px] overflow-hidden"
            >
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Reacties ({commentsList.length})</span>
                </div>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {commentsList.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-3 italic">
                    Nog geen reacties geplaatst.
                  </p>
                ) : (
                  commentsList.map((comment: any, idx: number) => (
                    <div key={comment.id || idx} className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-white text-[11px]">
                          {comment.author_name || 'Anoniem'}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed break-words">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Locked Comment Input Bar */}
              <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  Log in om te reageren
                </span>
                <button
                  onClick={onLogin}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Inloggen</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Call-to-Action Bar for Non-logged-in Users */}
        <div className="p-4 bg-gradient-to-b from-zinc-900 to-zinc-950 border-t border-zinc-800/90 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300">
                Wil je swipen, liken & reageren?
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">FTJM v1.3.1</span>
          </div>

          <button
            onClick={onLogin}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Inloggen met Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Login Prompt Modal / Toast if user clicked like or swipe */}
        <AnimatePresence>
          {loginPromptReason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                className="bg-zinc-900 border border-zinc-700 p-6 rounded-3xl max-w-sm w-full text-white shadow-2xl space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight text-white">
                    Inloggen Vereist
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Om te kunnen <strong className="text-cyan-400">{loginPromptReason}</strong>, door de feed te swipen en reacties te plaatsen moet je ingelogd zijn met je FTJM account.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setLoginPromptReason(null);
                      onLogin();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Nu Inloggen</span>
                  </button>
                  <button
                    onClick={() => setLoginPromptReason(null)}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs transition-colors"
                  >
                    Sluiten
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Media Viewer for Public Preview */}
      {fullscreenUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            onClick={() => setFullscreenUrl(null)}
            className="absolute top-5 right-5 p-2.5 text-white/70 hover:text-white rounded-full bg-black/50 hover:bg-black/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {fullscreenUrl.includes('video') || fullscreenUrl.endsWith('.mp4') ? (
            <video src={fullscreenUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl" />
          ) : (
            <img src={fullscreenUrl} alt="" className="max-w-full max-h-full object-contain rounded-2xl" referrerPolicy="no-referrer" />
          )}
        </div>
      )}
    </div>
  );
};
