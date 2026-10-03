import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Share2,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  Lock,
  Copy,
  Check,
  Calendar,
  Image as ImageIcon,
  ShieldAlert,
  Users
} from 'lucide-react';
import { formatDate, getSafeImageUrl, handleImageError, getProfileShareUrl } from '../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../constants';
import { VerifiedBadge } from './VerifiedBadge';
import { DeveloperBadge } from './DeveloperBadge';
import { t } from '../utils/translations';
import { createSupabaseClient } from '../utils/supabase';
import { ThemedLoadingScreen } from './ThemedLoadingScreen';
import { LetterAvatar } from './UserAvatar';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface PublicSharedProfileModalProps {
  userId: string;
  onClose: () => void;
  onLogin: () => void;
}

export const PublicSharedProfileModal: React.FC<PublicSharedProfileModalProps> = ({
  userId,
  onClose,
  onLogin,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileMedia, setProfileMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFullscreenMedia, setSelectedFullscreenMedia] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchPublicProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient();

        // 1. Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (userError || !userData) {
          console.warn('Could not fetch user profile from Supabase:', userError);
          if (isMounted) {
            setError('Dit profiel kon niet worden gevonden of bestaat niet meer.');
            setLoading(false);
          }
          return;
        }

        if (!isMounted) return;
        setProfile(userData as UserProfile);

        // 2. Calculate followers & following
        const followingArr = userData.custom_theme?.following || [];
        setFollowingCount(Array.isArray(followingArr) ? followingArr.length : 0);

        try {
          const { count, error: countErr } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .contains('custom_theme', { following: [userId] });

          if (!countErr && typeof count === 'number') {
            if (isMounted) setFollowersCount(count);
          }
        } catch {
          // ignore count error
        }

        // 3. Fetch public media for this profile
        setMediaLoading(true);
        try {
          const { data: mediaData, error: mediaErr } = await supabase
            .from('profile_media')
            .select('id, user_id, media_url, media_type, caption, likes, comments, is_blocked, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!mediaErr && mediaData && isMounted) {
            setProfileMedia(mediaData.filter(m => !m.is_blocked));
          }
        } catch (mErr) {
          console.warn('Error fetching public profile media:', mErr);
        } finally {
          if (isMounted) setMediaLoading(false);
        }

      } catch (err: any) {
        console.error('Error fetching public profile:', err);
        if (isMounted) {
          setError('Er is een fout opgetreden bij het laden van dit profiel.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const handleShare = async () => {
    const shareUrl = getProfileShareUrl(userId);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile ? `${profile.display_name} op het Forum` : 'Profiel op het Forum',
          text: profile ? `Bekijk het profiel van ${profile.display_name}!` : 'Bekijk dit profiel!',
          url: shareUrl,
        });
        toast.success(t('Profiellink succesvol gedeeld!'));
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('Profiellink gekopieerd naar klembord!'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success(t('Profiellink gekopieerd naar klembord!'));
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-900 text-zinc-100 rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col my-auto custom-scrollbar"
      >
        {/* Loading state */}
        {loading && (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
            <ThemedLoadingScreen 
              message="Profiel laden..." 
              submessage="Gegevens ophalen van het netwerk"
            />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-16 px-8 text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{t('Profiel Niet Gevonden')}</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">{error}</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all cursor-pointer text-sm"
              >
                {t('Sluiten')}
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer text-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {t('Inloggen')}
              </button>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!loading && !error && profile && (
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {/* Header Banner */}
            <div className="h-36 sm:h-40 bg-zinc-950 relative overflow-hidden shrink-0">
              {(profile.banner_url || profile.custom_theme?.banner_url) ? (
                <img 
                  src={getSafeImageUrl(profile.banner_url || profile.custom_theme?.banner_url)} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/40 via-zinc-900 to-indigo-950/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-zinc-900" />
              
              {/* Top Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button 
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 bg-black/40 hover:bg-black/60 rounded-2xl transition-all text-white backdrop-blur-md shadow-lg border border-white/10 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                  title="Deel profiel"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Gekopieerd' : 'Delen'}</span>
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="p-2.5 bg-black/40 hover:bg-black/60 rounded-2xl transition-all text-white backdrop-blur-md shadow-lg border border-white/10 active:scale-95"
                  title="Sluiten"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Public Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="px-3 py-1 bg-black/50 backdrop-blur-md text-cyan-400 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  <span>Openbaar Profiel</span>
                </div>
              </div>
            </div>

            {/* Profile Info Container */}
            <div className="px-6 sm:px-8 pb-8 space-y-6">
              {/* Avatar + Badges */}
              <div className="relative -mt-16 flex items-end justify-between">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-zinc-900 p-2 shadow-2xl border-2 border-zinc-800">
                    <div className="w-full h-full rounded-[1.5rem] bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700/60">
                      {profile.photo_url ? (
                        <img 
                          src={getSafeImageUrl(profile.photo_url)} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                          onError={handleImageError} 
                        />
                      ) : (
                        <LetterAvatar name={profile.display_name} className="w-full h-full" textClassName="text-3xl font-black" />
                      )}
                    </div>
                  </div>
                  {(profile.role === 'admin' || profile.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                    <div className="absolute bottom-1 right-1 bg-red-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-zinc-900" title="Administrator">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Share Quick Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2 bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 text-zinc-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Gekopieerd' : 'Kopieer Link'}</span>
                </button>
              </div>

              {/* Names and Roles */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {profile.display_name}
                  </h3>
                  <VerifiedBadge user={profile} size="md" />
                  <DeveloperBadge user={profile} size="md" showLabel={true} />
                  {isBetaTester(profile) && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                      <FlaskConical className="w-3 h-3 stroke-[2.5]" />
                      <span>Beta Tester</span>
                    </span>
                  )}
                  {(profile.role === 'admin' || profile.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                    <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Admin</span>
                    </span>
                  )}
                </div>

                {profile.created_at && (
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Lid sinds {formatDate(profile.created_at)}
                  </p>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-4 text-sm bg-zinc-800/60 p-4 rounded-2xl border border-zinc-700/60 shadow-inner">
                <div className="flex-1 text-center">
                  <div className="text-cyan-400 font-black text-xl">{followersCount}</div>
                  <div className="text-zinc-400 font-semibold text-xs mt-0.5">{t('Volgers')}</div>
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="flex-1 text-center">
                  <div className="text-cyan-400 font-black text-xl">{followingCount}</div>
                  <div className="text-zinc-400 font-semibold text-xs mt-0.5">{t('Volgend')}</div>
                </div>
                {profileMedia.length > 0 && (
                  <>
                    <div className="w-px h-8 bg-zinc-700" />
                    <div className="flex-1 text-center">
                      <div className="text-cyan-400 font-black text-xl">{profileMedia.length}</div>
                      <div className="text-zinc-400 font-semibold text-xs mt-0.5">{t('Media')}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Bio Section */}
              {profile.bio ? (
                <div className="p-5 bg-zinc-800/40 rounded-3xl border border-zinc-800">
                  <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">
                    {t('Over mij')}
                  </label>
                  <p className="text-zinc-200 text-sm leading-relaxed font-medium whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-zinc-800/20 rounded-2xl border border-zinc-800/80 text-center text-xs text-zinc-500 italic">
                  Geen bio ingesteld
                </div>
              )}

              {/* Profile Media Gallery (Read-Only) */}
              <div className="p-5 bg-zinc-800/40 rounded-3xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Media Galerij ({profileMedia.length}/10)</span>
                  </label>
                </div>

                {mediaLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-400 font-medium">
                    Media laden...
                  </div>
                ) : profileMedia.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-xs text-zinc-500 font-medium italic">Nog geen openbare media geüpload</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {profileMedia.map((media, idx) => (
                      <div 
                        key={media.id || idx} 
                        className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-950 cursor-pointer hover:border-cyan-500/50 transition-all"
                        onClick={() => setSelectedFullscreenMedia(media.media_url)}
                      >
                        {media.media_type === 'video' ? (
                          <video 
                            src={media.media_url} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all"
                            muted
                            playsInline
                          />
                        ) : (
                          <img 
                            src={getSafeImageUrl(media.media_url)} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                          />
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[7px] font-black text-white uppercase rounded tracking-widest">
                          {media.media_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visitor Notice Banner & Action Buttons */}
              <div className="p-5 bg-gradient-to-br from-cyan-950/40 via-zinc-800/70 to-indigo-950/40 rounded-3xl border border-cyan-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Bezoekersmodus</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                      Je bekijkt dit profiel als bezoeker. Log in om deze gebruiker te volgen, privéberichten te sturen of te bellen.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onLogin}
                    className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Inloggen om te Volgen</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-zinc-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Deel Dit Profiel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Fullscreen Media Viewer */}
      {selectedFullscreenMedia && (
        <div 
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 backdrop-blur-lg"
          onClick={() => setSelectedFullscreenMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {selectedFullscreenMedia.match(/\.(mp4|webm|ogg)$/i) || selectedFullscreenMedia.includes('video') ? (
              <video 
                src={selectedFullscreenMedia} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img 
                src={getSafeImageUrl(selectedFullscreenMedia)} 
                alt="" 
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                referrerPolicy="no-referrer"
              />
            )}
            <button 
              onClick={() => setSelectedFullscreenMedia(null)}
              className="absolute top-4 right-4 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
