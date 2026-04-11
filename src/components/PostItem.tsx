import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, MessageSquare, Flag, Pencil, Trash2, Mail, Loader2, Check, X } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
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
  setEditPostInput: (input: string) => void;
  onUpdatePost: (id: string) => void;
  onCancelEdit: () => void;
  saving: boolean;
}

export const PostItem: React.FC<PostItemProps> = ({
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
  setEditPostInput,
  onUpdatePost,
  onCancelEdit,
  saving
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={post.id}
      id={`post-${post.id}`}
      className={`flex gap-3 sm:gap-4 group bg-app-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-app-border shadow-sm hover:shadow-md transition-all relative`}
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        {post.author_photo ? (
          <button 
            onClick={() => onOpenProfile(post.author_id)}
            className="w-full h-full rounded-full overflow-hidden border border-app-border object-cover hover:ring-2 hover:ring-app-ink transition-all"
          >
            <img 
              src={post.author_photo} 
              alt={post.author_name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
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
        <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => onOpenProfile(post.author_id)}
              className="font-bold text-sm sm:text-base text-app-ink truncate hover:underline text-left"
            >
              {post.author_name}
            </button>
            <span className="text-[10px] sm:text-xs text-app-muted font-medium whitespace-nowrap">
              {formatDate(post.created_at)} om {formatTime(post.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onReply(post)}
              className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
              title="Reageren"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            {user.uid !== post.author_id && (
              <button 
                onClick={() => onReport('post', post.id, post.author_id, post.author_name)}
                className="p-2 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Rapporteer post"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            {(user.uid === post.author_id || isAdmin) && (
              <>
                <button 
                  onClick={() => onEdit(post.id, post.content)}
                  className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                  title="Bewerken"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(post.id)}
                  className="p-2 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {user.uid !== post.author_id && (
              <button 
                onClick={() => onStartDM({ id: post.author_id, display_name: post.author_name })}
                className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
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
              onChange={(e) => setEditPostInput(e.target.value)}
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
};
