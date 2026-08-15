import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, MessageSquare, Flag, Pencil, Trash2, Mail, Loader2, Check, X, ShieldCheck, FlaskConical } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../constants';
import { RichContent } from './RichContent';

interface PostItemProps {
  post: Post;
  user: any;
  isAdmin: boolean;
  onReply: (post: Post) => void;
  onReport: (type: 'post', id: string, userId: string, name: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onStartDM: (user: { id: string, display_name: string }) => void;
  onOpenProfile: (userId: string) => void;
  editingPostId: string | null;
  editPostInput: string;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, channel: string) => void;
  onUpdatePost: (id: string) => void;
  onCancelEdit: () => void;
  saving: boolean;
  nicknames: Record<string, string>;
  allPosts: Post[];
  useCustomTheme?: boolean;
  customTheme?: any;
  profiles?: UserProfile[];
  userProfile?: UserProfile | null;
}

export const PostItem: React.FC<PostItemProps> = React.memo(({
  post,
  user,
  isAdmin,
  onReply,
  onReport,
  onEdit,
  onDelete,
  onStartDM,
  onOpenProfile,
  editingPostId,
  editPostInput,
  handleTyping,
  onUpdatePost,
  onCancelEdit,
  saving,
  nicknames,
  allPosts,
  useCustomTheme,
  customTheme,
  profiles,
  userProfile
}) => {
  const authorProfile = (userProfile && post.author_id === userProfile.id)
    ? userProfile
    : profiles?.find(p => p.id === post.author_id);
  const displayName = authorProfile?.display_name || post.author_name || 'Anoniem';
  const photoUrl = authorProfile?.photo_url || post.author_photo;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={post.id}
      id={`post-${post.id}`}
      className={`flex gap-3 sm:gap-4 group bg-app-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-app-border shadow-sm hover:shadow-md transition-all relative ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
        borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
        color: customTheme.text_color
      } : {}}
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        {photoUrl ? (
          <button 
            onClick={() => onOpenProfile(post.author_id)}
            className="w-full h-full rounded-full overflow-hidden border border-app-border object-cover hover:ring-2 hover:ring-app-ink transition-all"
          >
            <img 
              src={photoUrl} 
              alt={displayName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          </button>
        ) : (
          <button 
            onClick={() => onOpenProfile(post.author_id)}
            className="w-full h-full rounded-full bg-app-accent flex items-center justify-center border border-app-border hover:ring-2 hover:ring-app-ink transition-all"
          >
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-app-muted" />
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 min-w-0">
          <div className="flex-1 min-w-0">
            {post.parent_id && (
              <div className="mb-2 space-y-1">
                {(() => {
                  const parent = allPosts.find(p => p.id === post.parent_id);
                  if (!parent) return null;
                  const parentProfile = (userProfile && parent.author_id === userProfile.id)
                    ? userProfile
                    : profiles?.find(p => p.id === parent.author_id);
                  const parentDisplayName = parentProfile?.display_name || parent.author_name || 'Anoniem';
                  return (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-app-muted font-medium bg-app-accent/30 w-fit px-2 py-0.5 rounded-full border border-app-border/50">
                        <MessageSquare className="w-3 h-3" />
                        <span>Geantwoord op <span className="font-bold text-app-ink">{nicknames[parent.author_id] || parentDisplayName}</span></span>
                      </div>
                      <div className="pl-3 border-l-2 border-app-border ml-2">
                        <p className="text-[10px] sm:text-xs text-app-muted italic line-clamp-1 opacity-70">
                          "{parent.content}"
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
              <button 
                onClick={() => onOpenProfile(post.author_id)}
                className="font-bold text-sm sm:text-base text-app-ink hover:underline text-left inline-flex items-center gap-1.5 max-w-full"
              >
                <span className="truncate max-w-[130px] sm:max-w-[200px] md:max-w-xs">{nicknames[post.author_id] || displayName}</span>
                {isVerifiedEmail(authorProfile || authorProfile?.email) && (
                  <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
                {isBetaTester(authorProfile || authorProfile?.email) && (
                  <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                    <FlaskConical className="w-3 h-3 text-amber-400 stroke-[2.5]" />
                  </span>
                )}
                {(authorProfile?.role === 'admin' || authorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                  <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
                  </span>
                )}
              </button>
              <span className="text-[10px] sm:text-xs text-app-muted font-medium whitespace-nowrap shrink-0">
                {formatDate(post.created_at)} om {formatTime(post.created_at)}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-app-card/90 sm:bg-transparent rounded-xl">
            <button 
              onClick={() => onReply(post)}
              className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
              title="Reageren"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            {user.uid !== post.author_id && (
              <button 
                onClick={() => onReport('post', post.id, post.author_id, displayName)}
                className="p-1.5 sm:p-2 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Rapporteer post"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            {(user.uid === post.author_id || isAdmin) && (
              <>
                <button 
                  onClick={() => onEdit(post.id, post.content)}
                  className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                  title="Bewerken"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(post.id)}
                  className="p-1.5 sm:p-2 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {user.uid !== post.author_id && (
              <button 
                onClick={() => onStartDM({ id: post.author_id, display_name: displayName })}
                className="p-1.5 sm:p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                title="Stuur bericht"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {editingPostId === post.id ? (
          <div className="mt-3 flex gap-2">
            <input 
              type="text"
              value={editPostInput}
              onChange={(e) => handleTyping(e, `edit-post-${post.id}`)}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-app-bg border border-app-border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-sm text-app-ink"
              autoFocus
            />
            <button 
              onClick={() => onUpdatePost(post.id)}
              disabled={saving || !editPostInput.trim()}
              className="p-2 sm:p-3 bg-app-ink text-app-bg rounded-lg sm:rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Check className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button 
              onClick={onCancelEdit}
              className="p-2 sm:p-3 bg-app-accent text-app-muted rounded-lg sm:rounded-xl hover:opacity-90 transition-all"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        ) : (
          <div className="text-app-ink text-sm sm:text-base leading-relaxed break-words">
            <RichContent content={post.content} />
          </div>
        )}
      </div>
    </motion.div>
  );
});
