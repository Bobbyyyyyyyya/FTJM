import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Send, User as UserIcon, Trash2, ShieldCheck, Check, FlaskConical } from 'lucide-react';
import { formatDate } from '../utils/helpers';
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

interface MediaFeedCardProps {
  media: {
    id: string;
    user_id: string;
    media_url: string;
    media_type: string;
    created_at: string;
    author_name: string;
    author_photo: string | null;
    likes: string[];
    comments: Comment[];
  };
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
}

export const MediaFeedCard: React.FC<MediaFeedCardProps> = React.memo(({
  media,
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
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLikePulsing, setIsLikePulsing] = useState(false);

  const likesList = media.likes || [];
  const commentsList = media.comments || [];
  const isLikedByMe = currentUserId ? likesList.includes(currentUserId) : false;

  const authorProfile = profiles?.find((p: any) => p.id === media.user_id);
  const isVerified = isVerifiedEmail(authorProfile || authorProfile?.email);
  const isBeta = isBetaTester(authorProfile || authorProfile?.email);
  const isAuthorAdmin = authorProfile?.role === 'admin' || authorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

  const handleLikeClick = () => {
    setIsLikePulsing(true);
    setTimeout(() => setIsLikePulsing(false), 500);
    onLike(media.id, media.user_id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(media.id, media.user_id, commentText);
    setCommentText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group h-full"
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-app-border bg-app-card/50">
        <button
          onClick={() => onOpenProfile(media.user_id)}
          className="flex items-center gap-3 text-left group/author min-w-0 flex-1"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-app-accent border border-app-border shrink-0">
            {media.author_photo ? (
              <img
                src={media.author_photo}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-app-muted" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-black text-app-ink group-hover/author:text-cyan-500 transition-colors truncate max-w-[130px] sm:max-w-xs">
                {nicknames[media.user_id] || media.author_name}
              </p>
              {isVerified && (
                <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                  <Check className="w-2 h-2 stroke-[4]" />
                </span>
              )}
              {isBeta && (
                <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                  <FlaskConical className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                </span>
              )}
              {isAuthorAdmin && (
                <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                  <ShieldCheck className="w-3 h-3 text-red-400 stroke-[2.5]" />
                </span>
              )}
            </div>
            <p className="text-[9px] text-app-muted font-mono uppercase tracking-wider mt-0.5 shrink-0">
              {formatDate(media.created_at)}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-app-accent text-[8px] font-black uppercase text-app-ink border border-app-border rounded-full tracking-wider shrink-0">
            {media.media_type === 'video' ? '📽️ Video' : '🖼️ Foto'}
          </span>
          {(currentUserId === media.user_id || isAdmin) && onDeleteMedia && (
            <button
              onClick={() => onDeleteMedia(media.id, media.user_id)}
              className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              title={t("Verwijder media")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Media Wrapper */}
      <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer group/media">
        {media.media_type === 'video' ? (
          <video
            src={media.media_url}
            className="w-full h-full object-cover"
            onClick={() => onViewFullscreen(media.media_url)}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <img
            src={media.media_url}
            alt=""
            className="w-full h-full object-cover group-hover/media:scale-[1.03] transition-all duration-500"
            onClick={() => onViewFullscreen(media.media_url)}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      {/* Interactions Bar */}
      <div className="p-3 flex items-center gap-4 border-b border-app-border/40 bg-app-card/30">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 text-xs font-black transition-all ${
            isLikedByMe ? 'text-red-500' : 'text-app-muted hover:text-red-400'
          }`}
        >
          <motion.span
            animate={isLikePulsing ? { scale: [1, 1.4, 0.9, 1.2, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-current' : ''}`} />
          </motion.span>
          <span>{likesList.length}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-xs font-black transition-all ${
            showComments ? 'text-cyan-500' : 'text-app-muted hover:text-cyan-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>{commentsList.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-app-card/40 flex flex-col border-t border-app-border/20"
          >
            {/* Scrollable comments list */}
            <div className="p-4 max-h-[180px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-app-border">
              {commentsList.length === 0 ? (
                <p className="text-[11px] text-app-muted italic py-2 text-center">
                  {t("Nog geen reacties. Laat van je horen!")}
                </p>
              ) : (
                commentsList.map((comment, index) => {
                  const commentAuthorProfile = profiles?.find((p: any) => p.id === comment.user_id);
                  const isCommentVerified = isVerifiedEmail(commentAuthorProfile || commentAuthorProfile?.email);
                  const isCommentBeta = isBetaTester(commentAuthorProfile || commentAuthorProfile?.email);
                  const isCommentAdmin = commentAuthorProfile?.role === 'admin' || commentAuthorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

                  return (
                    <div key={comment.id || index} className="flex gap-2.5 items-start text-left">
                      <div className="w-6 h-6 rounded-lg bg-app-accent overflow-hidden shrink-0 border border-app-border/50">
                        {comment.author_photo ? (
                          <img src={comment.author_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="w-2.5 h-2.5 text-app-muted" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-app-accent/30 rounded-2xl px-3 py-1.5 border border-app-border/40 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-black text-app-ink truncate max-w-[110px] sm:max-w-[160px]">
                              {nicknames[comment.user_id] || comment.author_name || 'Anoniem'}
                            </span>
                            {isCommentVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_6px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                                <Check className="w-1.5 h-1.5 stroke-[4]" />
                              </span>
                            )}
                            {isCommentBeta && (
                              <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                <FlaskConical className="w-2 h-2 text-amber-400 stroke-[2.5]" />
                              </span>
                            )}
                            {isCommentAdmin && (
                              <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(239,68,68,0.2)]" title="Administrator">
                                <ShieldCheck className="w-2.5 h-2.5 text-red-400 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-mono text-app-muted shrink-0">
                              {formatDate(comment.created_at)}
                            </span>
                            {(currentUserId === comment.user_id || isAdmin) && onDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(media.id, media.user_id, comment.id)}
                                type="button"
                                className="text-app-muted hover:text-red-500 transition-colors p-0.5 rounded shrink-0"
                                title={t("Verwijder reactie")}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-app-ink/90 mt-0.5 leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="p-3 border-t border-app-border/40 flex gap-2 bg-app-card/50">
              <input
                type="text"
                placeholder={t("Typ een reactie...")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-app-bg text-[11px] font-medium text-app-ink rounded-xl border border-app-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <button
                type="submit"
                className="p-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
