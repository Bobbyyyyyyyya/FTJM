import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  MessageSquare, 
  Clock, 
  User as UserIcon, 
  X, 
  Smile, 
  Link as LinkIcon, 
  Send, 
  Check, 
  ShieldCheck, 
  FlaskConical, 
  Search, 
  Tag, 
  Trash2, 
  Share2, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  Coffee, 
  Megaphone, 
  Gamepad2, 
  Compass, 
  Eye, 
  EyeOff, 
  ArrowUpDown,
  CornerDownRight,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { ForumThread, ForumComment, UserProfile } from '../../types';
import { formatDate } from '../../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../../constants';
import { decryptGeneralChat } from '../../utils/encryption';
import { RichContent } from '../RichContent';
import { ThemedSpinner } from '../ThemedLoadingScreen';
import { 
  FORUM_CATEGORIES, 
  FORUM_REACTIONS, 
  QUICK_TAGS, 
  parseThreadCategory, 
  ForumCategory 
} from './forumConstants';
import { 
  getStoredReactions, 
  toggleItemReaction, 
  ReactionState, 
  UserReactionsState 
} from './forumReactions';

interface NormalForumViewProps {
  threads: ForumThread[];
  activeThread: ForumThread | null;
  setActiveThread: (thread: ForumThread | null) => void;
  threadComments: ForumComment[];
  isCreatingThread: boolean;
  setIsCreatingThread: (is: boolean) => void;
  threadTitleInput: string;
  setThreadTitleInput: (input: string) => void;
  threadContentInput: string;
  setThreadContentInput: (input: string) => void;
  handleCreateThread: () => void;
  commentInput: string;
  setCommentInput: (input: string) => void;
  handleCreateComment: (threadId: string) => void;
  handleOpenThread: (thread: ForumThread) => void;
  handleOpenProfile: (userId: string) => void;
  handleTyping: (e: any, channel: string) => void;
  handleEmojiButtonClick: (e: React.MouseEvent, type: 'post' | 'comment') => void;
  handleImageUrl: () => void;
  sending: boolean;
  uploading: boolean;
  replyingToComment: ForumComment | null;
  setReplyingToComment: (comment: ForumComment | null) => void;
  nicknames: Record<string, string>;
  useCustomTheme: boolean;
  customTheme: any;
  profiles?: UserProfile[];
  userProfile?: UserProfile | null;
  onDeleteThread?: (threadId: string) => void;
  onDeleteComment?: (commentId: string, threadId: string) => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
    case 'HelpCircle': return <HelpCircle className="w-4 h-4" />;
    case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
    case 'Coffee': return <Coffee className="w-4 h-4" />;
    case 'Megaphone': return <Megaphone className="w-4 h-4" />;
    case 'Gamepad2': return <Gamepad2 className="w-4 h-4" />;
    default: return <Compass className="w-4 h-4" />;
  }
};

export const NormalForumView: React.FC<NormalForumViewProps> = React.memo(({
  threads,
  activeThread,
  setActiveThread,
  threadComments,
  isCreatingThread,
  setIsCreatingThread,
  threadTitleInput,
  setThreadTitleInput,
  threadContentInput,
  setThreadContentInput,
  handleCreateThread,
  commentInput,
  setCommentInput,
  handleCreateComment,
  handleOpenThread,
  handleOpenProfile,
  handleTyping,
  handleEmojiButtonClick,
  handleImageUrl,
  sending,
  uploading,
  replyingToComment,
  setReplyingToComment,
  nicknames,
  useCustomTheme,
  customTheme,
  profiles,
  userProfile,
  onDeleteThread,
  onDeleteComment
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'comments' | 'oldest'>('newest');
  const [selectedCreationCategory, setSelectedCreationCategory] = useState<string>('algemeen');
  const [showCreatePreview, setShowCreatePreview] = useState<boolean>(false);

  // Local Reactions
  const [reactionData, setReactionData] = useState<{ reactions: ReactionState; userReactions: UserReactionsState }>(() => getStoredReactions());

  const handleReact = (itemId: string, emoji: string) => {
    const updated = toggleItemReaction(itemId, emoji);
    setReactionData({
      reactions: updated.reactions,
      userReactions: updated.userReactions
    });
  };

  const handleShareThread = (thread: ForumThread) => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link naar dit topic gekopieerd naar klembord!');
    }
  };

  // Filter & Sort Threads
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const decTitle = decryptGeneralChat(t.title || '');
      const decContent = decryptGeneralChat(t.content || '');
      // Category filter
      if (selectedCategory !== 'all') {
        const { category } = parseThreadCategory(decTitle, decContent);
        if (category.id !== selectedCategory) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const { cleanTitle } = parseThreadCategory(decTitle);
        const matchesTitle = cleanTitle.toLowerCase().includes(q);
        const matchesContent = decContent.toLowerCase().includes(q);
        const authorName = (nicknames[t.author_id] || t.author_name || '').toLowerCase();
        const matchesAuthor = authorName.includes(q);
        if (!matchesTitle && !matchesContent && !matchesAuthor) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'comments') {
        return (b.comment_count || 0) - (a.comment_count || 0);
      }
      return 0;
    });
  }, [threads, selectedCategory, searchQuery, sortBy, nicknames]);

  // Topic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: threads.length };
    FORUM_CATEGORIES.forEach(c => {
      if (c.id !== 'all') {
        counts[c.id] = threads.filter(t => {
          const decTitle = decryptGeneralChat(t.title || '');
          const decContent = decryptGeneralChat(t.content || '');
          return parseThreadCategory(decTitle, decContent).category.id === c.id;
        }).length;
      }
    });
    return counts;
  }, [threads]);

  const activeAuthorProfile = useMemo(() => {
    if (!activeThread) return null;
    return (userProfile && activeThread.author_id === userProfile.id)
      ? userProfile
      : profiles?.find(p => p.id === activeThread.author_id);
  }, [activeThread, userProfile, profiles]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="bg-app-card border border-app-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-app-accent text-app-ink rounded-full text-xs font-bold uppercase tracking-wider border border-app-border">
                Community Hub
              </span>
              <span className="text-xs text-app-muted font-medium">
                {threads.length} {threads.length === 1 ? 'topic' : 'topics'} geplaatst
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-app-ink tracking-tight">
              Community Forum
            </h1>
            <p className="text-app-muted text-sm sm:text-base max-w-2xl leading-relaxed">
              Het centrale ontmoetingspunt voor discussies, hulp, feedback en gezelligheid.
            </p>
          </div>

          {!activeThread && (
            <button 
              onClick={() => {
                setIsCreatingThread(true);
                setShowCreatePreview(false);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-app-ink text-app-bg rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Nieuw Topic Starten</span>
            </button>
          )}
        </div>

        {/* Search and Sort Toolbar when in overview */}
        {!activeThread && (
          <div className="mt-6 pt-6 border-t border-app-border flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek in titels, inhoud of gebruikers..."
                className="w-full pl-10 pr-10 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs sm:text-sm text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-ink/30 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs text-app-muted font-bold flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sorteer:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-app-bg border border-app-border rounded-xl text-xs font-bold text-app-ink focus:outline-none focus:ring-2 focus:ring-app-ink/30 cursor-pointer"
              >
                <option value="newest">Nieuwste eerst</option>
                <option value="comments">Meeste reacties</option>
                <option value="oldest">Oudste eerst</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE THREAD DETAIL VIEW */}
      {activeThread ? (
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveThread(null)}
              className="flex items-center gap-2 text-app-muted hover:text-app-ink transition-colors font-bold text-xs sm:text-sm uppercase tracking-wider py-1.5 px-3 rounded-xl hover:bg-app-accent/50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>Terug naar topic overzicht</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareThread(activeThread)}
                className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl border border-app-border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Deel link naar topic"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delen</span>
              </button>

              {(isAdmin || (userProfile && activeThread.author_id === userProfile.id)) && onDeleteThread && (
                <button
                  onClick={() => {
                    if (window.confirm('Weet je zeker dat je dit hele topic wilt verwijderen?')) {
                      onDeleteThread(activeThread.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/20 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Topic verwijderen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Verwijderen</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Original Post Card */}
          {(() => {
            const decActiveTitle = decryptGeneralChat(activeThread.title || '');
            const decActiveContent = decryptGeneralChat(activeThread.content || '');
            const { category, cleanTitle } = parseThreadCategory(decActiveTitle, decActiveContent);
            const authorName = activeAuthorProfile?.display_name || nicknames[activeThread.author_id] || activeThread.author_name || 'Anoniem';
            const authorPhoto = activeAuthorProfile?.photo_url || activeThread.author_photo;
            const isVerified = isVerifiedEmail(activeAuthorProfile || activeAuthorProfile?.email);
            const isBeta = isBetaTester(activeAuthorProfile || activeAuthorProfile?.email);
            const isAuthorAdmin = activeAuthorProfile?.role === 'admin' || activeAuthorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';
            const threadReactions = reactionData.reactions[activeThread.id] || {};
            const userThreadReactions = reactionData.userReactions[activeThread.id] || [];

            return (
              <div className="bg-app-card rounded-3xl border border-app-border shadow-sm overflow-hidden transition-all">
                {/* Header Banner */}
                <div className="p-6 sm:p-8 border-b border-app-border bg-app-accent/10">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${category.bgColor} ${category.color} border ${category.borderColor}`}>
                      {getCategoryIcon(category.iconName)}
                      <span>{category.name}</span>
                    </span>

                    <span className="text-xs text-app-muted font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(activeThread.created_at)}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-app-ink mb-5 leading-tight">
                    {cleanTitle}
                  </h1>

                  {/* Author Bar */}
                  <div 
                    onClick={() => handleOpenProfile(activeThread.author_id)}
                    className="flex items-center gap-3 p-3 bg-app-card rounded-2xl border border-app-border/70 hover:border-app-ink/30 cursor-pointer transition-all w-fit"
                  >
                    {authorPhoto ? (
                      <img 
                        src={authorPhoto} 
                        alt={authorName} 
                        className="w-10 h-10 rounded-xl object-cover border border-app-border" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-app-accent flex items-center justify-center border border-app-border">
                        <UserIcon className="w-5 h-5 text-app-muted" />
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-app-ink">{authorName}</span>
                        {isVerified && (
                          <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5" title="Geverifieerd Account">
                            <Check className="w-2.5 h-2.5 stroke-[4]" />
                          </span>
                        )}
                        {isBeta && (
                          <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-500 p-0.5 rounded" title="Beta Tester">
                            <FlaskConical className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        )}
                        {isAuthorAdmin && (
                          <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-500 p-0.5 rounded" title="Administrator">
                            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-app-muted font-medium">Klik voor profiel</span>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 text-app-ink text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  <RichContent content={decActiveContent} />
                </div>

                {/* Reactions Bar */}
                <div className="px-6 sm:px-8 py-4 bg-app-accent/5 border-t border-app-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-app-muted mr-1">Reageer:</span>
                    {FORUM_REACTIONS.map(r => {
                      const count = threadReactions[r.emoji] || 0;
                      const hasReacted = userThreadReactions.includes(r.emoji);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => handleReact(activeThread.id, r.emoji)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            hasReacted
                              ? 'bg-app-ink text-app-bg border-app-ink shadow-sm scale-105'
                              : 'bg-app-card text-app-ink border-app-border hover:bg-app-accent'
                          }`}
                          title={r.label}
                        >
                          <span className="text-base leading-none">{r.emoji}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-app-muted">
                    <MessageSquare className="w-4 h-4" />
                    <span>{threadComments.length} {threadComments.length === 1 ? 'reactie' : 'reacties'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* COMMENTS TIMELINE */}
          <div className="bg-app-card rounded-3xl border border-app-border p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-extrabold text-app-ink flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-app-ink" />
              <span>Discussie & Reacties ({threadComments.length})</span>
            </h3>

            {/* Comment Composer */}
            <div className="space-y-3 bg-app-bg p-4 sm:p-5 rounded-2xl border border-app-border">
              <AnimatePresence>
                {replyingToComment && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between bg-app-accent/40 border border-app-border p-2.5 rounded-xl overflow-hidden mb-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-xs">
                      <CornerDownRight className="w-4 h-4 text-app-ink shrink-0" />
                      <p className="font-bold text-app-muted truncate">
                        Reageren op <span className="text-app-ink font-black">{nicknames[replyingToComment.author_id] || replyingToComment.author_name || 'Gebruiker'}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setReplyingToComment(null)}
                      className="p-1 text-app-muted hover:text-app-ink transition-colors rounded-lg hover:bg-app-accent"
                      title="Annuleren"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea 
                value={commentInput}
                onChange={(e) => handleTyping(e, 'forum')}
                placeholder="Schrijf een reactie..."
                disabled={uploading}
                className="w-full px-4 py-3 bg-app-card border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink/30 focus:border-app-ink transition-all text-app-ink min-h-[100px] resize-none text-sm font-medium placeholder:text-app-muted"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={handleImageUrl}
                    disabled={uploading}
                    className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl border border-app-border transition-all disabled:opacity-50 cursor-pointer"
                    title="Afbeelding via URL toevoegen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleEmojiButtonClick(e, 'comment')}
                    disabled={uploading}
                    className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl border border-app-border transition-all disabled:opacity-50 cursor-pointer"
                    title="Emoji toevoegen"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCreateComment(activeThread.id)}
                  disabled={sending || !commentInput.trim() || uploading}
                  className="px-6 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {sending ? <ThemedSpinner size="xs" color="currentColor" /> : <Send className="w-4 h-4" />}
                  <span>Plaats Reactie</span>
                </motion.button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pt-4">
              {threadComments.length === 0 ? (
                <div className="text-center py-12 bg-app-accent/5 rounded-2xl border border-dashed border-app-border">
                  <MessageSquare className="w-8 h-8 text-app-muted mx-auto mb-2 opacity-30" />
                  <p className="text-app-muted text-sm font-medium">Nog geen reacties geplaatst. Wees de eerste!</p>
                </div>
              ) : (
                threadComments.map((comment) => {
                  const commentAuthor = (userProfile && comment.author_id === userProfile.id)
                    ? userProfile
                    : profiles?.find(p => p.id === comment.author_id);
                  const commentAuthorName = nicknames[comment.author_id] || (commentAuthor?.display_name && commentAuthor.display_name !== 'Anoniem' ? commentAuthor.display_name : null) || (comment.author_name && comment.author_name !== 'Anoniem' ? comment.author_name : null) || commentAuthor?.email?.split('@')[0] || 'Gebruiker';
                  const commentAuthorPhoto = commentAuthor?.photo_url || comment.author_photo;
                  const isVerified = isVerifiedEmail(commentAuthor || commentAuthor?.email);
                  const isBeta = isBetaTester(commentAuthor || commentAuthor?.email);
                  const isCommentAdmin = commentAuthor?.role === 'admin' || commentAuthor?.email?.toLowerCase() === 'markohoksen@gmail.com';
                  
                  const cReactions = reactionData.reactions[comment.id] || {};
                  const userCReactions = reactionData.userReactions[comment.id] || [];

                  return (
                    <div key={comment.id} className="p-4 sm:p-5 bg-app-bg border border-app-border rounded-2xl space-y-3 transition-all">
                      {/* Parent Quote if Replying */}
                      {comment.parent_id && (() => {
                        const parent = threadComments.find(c => c.id === comment.parent_id);
                        if (!parent) return null;
                        const parentAuthor = (userProfile && parent.author_id === userProfile.id)
                          ? userProfile
                          : profiles?.find(p => p.id === parent.author_id);
                        const parentAuthorName = nicknames[parent.author_id] || parentAuthor?.display_name || parent.author_name || 'Gebruiker';
                        return (
                          <div className="p-2.5 bg-app-card rounded-xl border border-app-border/70 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-app-muted font-bold">
                              <CornerDownRight className="w-3 h-3 text-app-ink" />
                              <span>Antwoord op <span className="text-app-ink">{parentAuthorName}</span>:</span>
                            </div>
                            <p className="text-app-muted/80 italic line-clamp-2 pl-4">
                              "{decryptGeneralChat(parent.content || '')}"
                            </p>
                          </div>
                        );
                      })()}

                      {/* Comment Author Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div 
                          onClick={() => handleOpenProfile(comment.author_id)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          {commentAuthorPhoto ? (
                            <img 
                              src={commentAuthorPhoto} 
                              alt={commentAuthorName} 
                              className="w-8 h-8 rounded-full object-cover border border-app-border" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                              <UserIcon className="w-4 h-4 text-app-muted" />
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-app-ink group-hover:underline">
                              {commentAuthorName}
                            </span>
                            {isVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5" title="Geverifieerd Account">
                                <Check className="w-2 h-2 stroke-[4]" />
                              </span>
                            )}
                            {isBeta && (
                              <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-500 p-0.5 rounded" title="Beta Tester">
                                <FlaskConical className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                            )}
                            {isCommentAdmin && (
                              <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-500 p-0.5 rounded" title="Administrator">
                                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            )}
                            <span className="text-[11px] text-app-muted">• {formatDate(comment.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setReplyingToComment(comment);
                            }}
                            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Reageer op dit bericht"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Beantwoorden</span>
                          </button>

                          {(isAdmin || (userProfile && comment.author_id === userProfile.id)) && onDeleteComment && (
                            <button
                              onClick={() => {
                                if (window.confirm('Wil je deze reactie verwijderen?')) {
                                  onDeleteComment(comment.id, activeThread.id);
                                }
                              }}
                              className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg text-xs transition-all cursor-pointer"
                              title="Reactie verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Comment Body */}
                      <div className="text-sm text-app-ink leading-relaxed pl-1 sm:pl-10">
                        <RichContent content={decryptGeneralChat(comment.content || '')} />
                      </div>

                      {/* Comment Reactions */}
                      <div className="pl-1 sm:pl-10 flex flex-wrap items-center gap-1.5 pt-1">
                        {FORUM_REACTIONS.map(r => {
                          const count = cReactions[r.emoji] || 0;
                          const hasReacted = userCReactions.includes(r.emoji);
                          if (count === 0 && !hasReacted) return null;
                          return (
                            <button
                              key={r.emoji}
                              onClick={() => handleReact(comment.id, r.emoji)}
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                hasReacted
                                  ? 'bg-app-ink text-app-bg border-app-ink'
                                  : 'bg-app-card text-app-ink border-app-border'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{count}</span>
                            </button>
                          );
                        })}

                        <div className="relative group/emoji inline-block">
                          <button
                            type="button"
                            className="p-1 text-app-muted hover:text-app-ink rounded-lg text-xs hover:bg-app-accent border border-transparent hover:border-app-border"
                            title="Reactie toevoegen"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          <div className="hidden group-hover/emoji:flex absolute left-0 bottom-full mb-1 bg-app-card border border-app-border shadow-lg p-1 rounded-xl items-center gap-1 z-20">
                            {FORUM_REACTIONS.slice(0, 5).map(r => (
                              <button
                                key={r.emoji}
                                onClick={() => handleReact(comment.id, r.emoji)}
                                className="p-1 hover:scale-125 transition-transform text-sm"
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* OVERVIEW MODE */
        <div className="space-y-6">
          {/* Category Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FORUM_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-app-ink text-app-bg border-app-ink shadow-sm'
                      : 'bg-app-card text-app-muted hover:text-app-ink border-app-border hover:bg-app-accent/50'
                  }`}
                >
                  {getCategoryIcon(cat.iconName)}
                  <span>{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-app-bg/20 text-app-bg' : 'bg-app-accent text-app-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CREATE TOPIC FORM */}
          <AnimatePresence>
            {isCreatingThread && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-app-card rounded-3xl p-6 sm:p-8 border-2 border-app-ink shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-app-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-app-ink" />
                    <h3 className="text-xl font-extrabold text-app-ink">Nieuw Topic Aanmaken</h3>
                  </div>
                  <button 
                    onClick={() => setIsCreatingThread(false)} 
                    className="p-2 hover:bg-app-accent rounded-full transition-colors cursor-pointer text-app-muted hover:text-app-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-app-ink uppercase tracking-wider">Kies Categorie</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FORUM_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                      const isSelected = selectedCreationCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCreationCategory(cat.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                            isSelected
                              ? `${cat.bgColor} ${cat.borderColor} border-2 shadow-sm`
                              : 'bg-app-bg border-app-border hover:bg-app-accent/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cat.color}>{getCategoryIcon(cat.iconName)}</span>
                            <span className="text-xs font-black text-app-ink">{cat.name}</span>
                          </div>
                          <span className="text-[10px] text-app-muted line-clamp-1">{cat.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Tag Insert Helpers */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-app-muted flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Snelle tags:
                  </span>
                  {QUICK_TAGS.map(qt => (
                    <button
                      key={qt.label}
                      type="button"
                      onClick={() => {
                        if (!threadTitleInput.includes(qt.label)) {
                          setThreadTitleInput(`[${qt.label.replace('#', '')}] ${threadTitleInput}`);
                        }
                        setSelectedCreationCategory(qt.categoryId);
                      }}
                      className="px-2.5 py-1 bg-app-accent/50 hover:bg-app-accent text-app-ink text-xs font-bold rounded-lg border border-app-border transition-all cursor-pointer"
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-app-ink uppercase tracking-wider">Onderwerp / Titel</label>
                      <span className="text-[10px] text-app-muted font-mono">{threadTitleInput.length}/100</span>
                    </div>
                    <input 
                      type="text"
                      maxLength={100}
                      value={threadTitleInput}
                      onChange={(e) => setThreadTitleInput(e.target.value)}
                      placeholder="Waar wil je het over hebben? (duidelijke titel)"
                      className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all font-bold text-base text-app-ink placeholder:text-app-muted"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-app-ink uppercase tracking-wider">Inhoud</label>
                      <button
                        type="button"
                        onClick={() => setShowCreatePreview(!showCreatePreview)}
                        className="text-xs font-bold text-app-ink flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {showCreatePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showCreatePreview ? 'Verberg Preview' : 'Toon Preview'}</span>
                      </button>
                    </div>

                    {showCreatePreview ? (
                      <div className="p-4 bg-app-bg border border-app-border rounded-xl min-h-[160px] text-sm text-app-ink leading-relaxed">
                        <RichContent content={threadContentInput || '*Nog geen inhoud geschreven...*'} />
                      </div>
                    ) : (
                      <textarea 
                        value={threadContentInput}
                        onChange={(e) => setThreadContentInput(e.target.value)}
                        placeholder="Beschrijf je vraag, idee of verhaal uitgebreid..."
                        className="w-full px-4 py-3.5 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[160px] resize-none text-sm leading-relaxed placeholder:text-app-muted"
                      />
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-2 mt-2 bg-app-bg p-2 rounded-xl border border-app-border">
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={handleImageUrl}
                          className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all cursor-pointer"
                          title="Afbeelding via URL toevoegen"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleEmojiButtonClick(e, 'post')}
                          className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all cursor-pointer"
                          title="Emoji kiezen"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setIsCreatingThread(false)}
                          className="px-4 py-2 bg-app-accent text-app-muted hover:text-app-ink rounded-xl font-bold text-xs hover:bg-app-border transition-all cursor-pointer"
                        >
                          Annuleren
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            // Ensure title has category prefix if not present
                            const cat = FORUM_CATEGORIES.find(c => c.id === selectedCreationCategory);
                            let finalTitle = threadTitleInput.trim();
                            if (cat && cat.id !== 'algemeen' && !finalTitle.toLowerCase().includes(cat.tag)) {
                              finalTitle = `[${cat.name}] ${finalTitle}`;
                              setThreadTitleInput(finalTitle);
                            }
                            handleCreateThread();
                          }}
                          disabled={sending || !threadTitleInput.trim() || !threadContentInput.trim()}
                          className="px-6 py-2 bg-app-ink text-app-bg rounded-xl font-black text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          {sending ? <ThemedSpinner size="xs" color="currentColor" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                          <span>Topic Publiceren</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THREADS LIST */}
          {filteredThreads.length === 0 ? (
            <div className="text-center py-20 bg-app-card rounded-3xl border border-dashed border-app-border p-8 space-y-4">
              <Compass className="w-12 h-12 text-app-muted mx-auto opacity-20" />
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-app-ink">Geen topics gevonden</h4>
                <p className="text-app-muted text-sm max-w-sm mx-auto">
                  {searchQuery 
                    ? `Geen resultaten voor "${searchQuery}". Probeer een andere zoekterm of wis het filter.` 
                    : 'Er zijn nog geen berichten geplaatst in deze categorie.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                  if (selectedCategory !== 'all') setSelectedCategory('all');
                  setIsCreatingThread(true);
                }}
                className="px-5 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Start het eerste topic</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map(thread => {
                const decTitle = decryptGeneralChat(thread.title || '');
                const decContent = decryptGeneralChat(thread.content || '');
                const { category, cleanTitle } = parseThreadCategory(decTitle, decContent);
                const threadAuthor = (userProfile && thread.author_id === userProfile.id)
                  ? userProfile
                  : profiles?.find(p => p.id === thread.author_id);
                const threadAuthorName = nicknames[thread.author_id] || (threadAuthor?.display_name && threadAuthor.display_name !== 'Anoniem' ? threadAuthor.display_name : null) || (thread.author_name && thread.author_name !== 'Anoniem' ? thread.author_name : null) || threadAuthor?.email?.split('@')[0] || 'Gebruiker';
                const isVerified = isVerifiedEmail(threadAuthor || threadAuthor?.email);
                const isBeta = isBetaTester(threadAuthor || threadAuthor?.email);
                const isAuthorAdmin = threadAuthor?.role === 'admin' || threadAuthor?.email?.toLowerCase() === 'markohoksen@gmail.com';
                const repliesCount = thread.comment_count || 0;

                return (
                  <motion.div
                    key={thread.id}
                    layout
                    onClick={() => handleOpenThread(thread)}
                    className="bg-app-card p-5 sm:p-6 rounded-3xl border border-app-border shadow-sm hover:shadow-md hover:border-app-ink/30 transition-all cursor-pointer group relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Meta Category & Author */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-app-muted">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${category.bgColor} ${category.color} border ${category.borderColor}`}>
                            {getCategoryIcon(category.iconName)}
                            <span>{category.name}</span>
                          </span>

                          <span className="font-bold text-app-ink flex items-center gap-1">
                            {threadAuthorName}
                            {isVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5" title="Geverifieerd">
                                <Check className="w-2 h-2 stroke-[4]" />
                              </span>
                            )}
                            {isBeta && (
                              <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-500 p-0.5 rounded" title="Beta Tester">
                                <FlaskConical className="w-2 h-2" />
                              </span>
                            )}
                            {isAuthorAdmin && (
                              <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-500 p-0.5 rounded" title="Admin">
                                <ShieldCheck className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </span>

                          <span>•</span>
                          <span>{formatDate(thread.created_at)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-extrabold text-app-ink group-hover:text-app-ink/80 transition-colors leading-snug break-words">
                          {cleanTitle}
                        </h3>

                        {/* Snippet */}
                        <p className="text-app-muted text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                          {decContent}
                        </p>

                        {/* Footer stats */}
                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-app-ink bg-app-accent/40 px-2.5 py-1 rounded-xl border border-app-border/40">
                            <MessageSquare className="w-3.5 h-3.5 text-app-ink" />
                            <span>{repliesCount} {repliesCount === 1 ? 'reactie' : 'reacties'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-medium text-app-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Update: {formatDate(thread.updated_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {(isAdmin || (userProfile && thread.author_id === userProfile.id)) && onDeleteThread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Weet je zeker dat je dit hele topic en alle bijbehorende reacties wilt verwijderen?')) {
                                onDeleteThread(thread.id);
                              }
                            }}
                            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                            title="Topic en alle reacties verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="hidden sm:flex p-3 bg-app-accent text-app-muted rounded-2xl group-hover:bg-app-ink group-hover:text-app-bg transition-all shadow-sm">
                          <ChevronLeft className="w-4 h-4 rotate-180 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
