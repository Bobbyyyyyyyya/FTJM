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
  Flame, 
  TrendingUp, 
  Radio, 
  Layers, 
  CornerDownRight, 
  Zap,
  SlidersHorizontal
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

interface ModernForumViewProps {
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

export const ModernForumView: React.FC<ModernForumViewProps> = React.memo((props) => {
  const {
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
  } = props;

  const propsRef = React.useRef(props);
  React.useLayoutEffect(() => {
    propsRef.current = props;
  });

  const onOpenThreadStable = React.useCallback((thread: ForumThread) => propsRef.current.handleOpenThread(thread), []);
  const onOpenProfileStable = React.useCallback((id: string) => propsRef.current.handleOpenProfile(id), []);
  const onDeleteThreadStable = React.useCallback((id: string) => propsRef.current.onDeleteThread?.(id), []);
  const onDeleteCommentStable = React.useCallback((cId: string, tId: string) => propsRef.current.onDeleteComment?.(cId, tId), []);
  const setReplyingToCommentStable = React.useCallback((c: ForumComment | null) => propsRef.current.setReplyingToComment(c), []);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<'trending' | 'newest' | 'discussed'>('trending');
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
      toast.success('Topic link gekopieerd!');
    }
  };

  // Filter & Sort Threads
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const decTitle = decryptGeneralChat(t.title || '');
      const decContent = decryptGeneralChat(t.content || '');
      if (selectedCategory !== 'all') {
        const { category } = parseThreadCategory(decTitle, decContent);
        if (category.id !== selectedCategory) return false;
      }
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
      if (sortFilter === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortFilter === 'discussed') {
        return (b.comment_count || 0) - (a.comment_count || 0);
      }
      // Trending (weight comments + recent)
      const scoreA = (a.comment_count || 0) * 2 + new Date(a.updated_at || a.created_at).getTime() / 1000000000;
      const scoreB = (b.comment_count || 0) * 2 + new Date(b.updated_at || b.created_at).getTime() / 1000000000;
      return scoreB - scoreA;
    });
  }, [threads, selectedCategory, searchQuery, sortFilter, nicknames]);

  // Statistics
  const totalComments = useMemo(() => {
    return threads.reduce((acc, t) => acc + (t.comment_count || 0), 0);
  }, [threads]);

  const activeAuthorProfile = useMemo(() => {
    if (!activeThread) return null;
    return (userProfile && activeThread.author_id === userProfile.id)
      ? userProfile
      : profiles?.find(p => p.id === activeThread.author_id);
  }, [activeThread, userProfile, profiles]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'markohoksen@gmail.com';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      {/* Modern Cybernetic Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-app-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-10">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>Modern Community Forum</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-app-ink tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Community Hub
            </h1>

            <p className="text-app-muted text-sm sm:text-base leading-relaxed">
              Verbind met medeleden, start diepgaande discussies, stel vragen en ontdek realtime community updates in een gestroomlijnde omgeving.
            </p>
          </div>

          {/* Quick Metrics & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="grid grid-cols-2 gap-3 bg-app-ink/5 border border-app-border p-3 rounded-2xl backdrop-blur-xl">
              <div className="px-3 py-2">
                <div className="text-[10px] uppercase font-bold text-app-muted">Topics</div>
                <div className="text-xl font-black text-cyan-400 font-mono">{threads.length}</div>
              </div>
              <div className="px-3 py-2 border-l border-app-border">
                <div className="text-[10px] uppercase font-bold text-app-muted">Reacties</div>
                <div className="text-xl font-black text-violet-400 font-mono">{totalComments}</div>
              </div>
            </div>

            {!activeThread && (
              <button
                onClick={() => {
                  setIsCreatingThread(true);
                  setShowCreatePreview(false);
                }}
                className="px-6 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-app-ink font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Nieuw Topic</span>
              </button>
            )}
          </div>
        </div>

        {/* Floating Modern Search & Filter Dock */}
        {!activeThread && (
          <div className="mt-8 pt-6 border-t border-app-border flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek razendsnel op trefwoord, tag of gebruiker..."
                className="w-full pl-11 pr-10 py-3 bg-black/40 border border-app-border rounded-2xl text-sm text-app-ink placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-black/50 border border-app-border p-1.5 rounded-2xl backdrop-blur-xl w-full md:w-auto shrink-0 justify-between">
              <button
                onClick={() => setSortFilter('trending')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  sortFilter === 'trending'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-app-ink shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Trending</span>
              </button>

              <button
                onClick={() => setSortFilter('newest')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  sortFilter === 'newest'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-app-ink shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nieuwste</span>
              </button>

              <button
                onClick={() => setSortFilter('discussed')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  sortFilter === 'discussed'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-app-ink shadow-sm'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                <span>Besproken</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE THREAD DETAIL VIEW (MODERN) */}
      {activeThread ? (
        <div className="space-y-6">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveThread(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-app-card/80 border border-app-border text-app-ink/80 hover:text-app-ink hover:border-cyan-500/40 transition-all text-xs font-black uppercase tracking-wider backdrop-blur-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400 stroke-[3]" />
              <span>Terug naar Forum Overzicht</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareThread(activeThread)}
                className="px-3.5 py-2 rounded-2xl bg-app-card/80 border border-app-border text-app-ink/80 hover:text-app-ink hover:border-cyan-500/40 transition-all text-xs font-black flex items-center gap-2 backdrop-blur-xl cursor-pointer"
                title="Deel topic link"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Delen</span>
              </button>

              {(isAdmin || (userProfile && activeThread.author_id === userProfile.id)) && onDeleteThread && (
                <button
                  onClick={() => {
                    if (window.confirm('Weet je zeker dat je dit hele topic wilt verwijderen?')) {
                      onDeleteThread(activeThread.id);
                    }
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs font-black flex items-center gap-2 cursor-pointer"
                  title="Topic verwijderen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Verwijderen</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Cyber Thread Card */}
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
              <div className="relative overflow-hidden rounded-3xl bg-app-bg/70 border border-app-border backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                {/* Ambient Category Glow */}
                <div 
                  className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
                  style={{ background: category.modernGlow }}
                />

                {/* Header Information */}
                <div className="p-6 sm:p-8 border-b border-app-border bg-white/[0.02]">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${category.modernGradient} ${category.color} border border-app-border shadow-sm backdrop-blur-md`}>
                        {getCategoryIcon(category.iconName)}
                        <span>{category.name}</span>
                      </span>
                    </div>

                    <span className="text-xs text-app-muted font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {formatDate(activeThread.created_at)}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-app-ink mb-6 leading-tight">
                    {cleanTitle}
                  </h1>

                  {/* Author Card Capsule */}
                  <div 
                    onClick={() => handleOpenProfile(activeThread.author_id)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-app-card/90 border border-app-border hover:border-cyan-500/50 transition-all cursor-pointer w-fit backdrop-blur-md"
                  >
                    <div className="relative">
                      {authorPhoto ? (
                        <img 
                          src={authorPhoto} 
                          alt={authorName} 
                          className="w-10 h-10 rounded-xl object-cover border border-cyan-500/30" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-app-accent flex items-center justify-center border border-app-border">
                          <UserIcon className="w-5 h-5 text-app-muted" />
                        </div>
                      )}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900 absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-app-ink">{authorName}</span>
                        {isVerified && (
                          <span className="inline-flex items-center justify-center bg-cyan-500 text-app-ink rounded-full p-0.5 shadow-[0_0_8px_rgba(6,182,212,0.6)]" title="Geverifieerd">
                            <Check className="w-2.5 h-2.5 stroke-[4]" />
                          </span>
                        )}
                        {isBeta && (
                          <span className="inline-flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 p-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.3)]" title="Beta Tester">
                            <FlaskConical className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        )}
                        {isAuthorAdmin && (
                          <span className="inline-flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 p-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.3)]" title="Administrator">
                            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-app-muted font-mono">Bekijk profiel</span>
                    </div>
                  </div>
                </div>

                {/* Content Stream Body */}
                <div className="p-6 sm:p-8 text-app-ink text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  <RichContent content={decActiveContent} />
                </div>

                {/* Cyber Reaction Capsule Bar */}
                <div className="px-6 sm:px-8 py-4 bg-black/40 border-t border-app-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-app-muted mr-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Reacties:
                    </span>
                    {FORUM_REACTIONS.map(r => {
                      const count = threadReactions[r.emoji] || 0;
                      const hasReacted = userThreadReactions.includes(r.emoji);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => handleReact(activeThread.id, r.emoji)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            hasReacted
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-app-ink shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                              : 'bg-app-card/80 border border-app-border text-app-ink/80 hover:text-app-ink hover:border-cyan-500/40'
                          }`}
                          title={r.label}
                        >
                          <span className="text-base leading-none">{r.emoji}</span>
                          {count > 0 && <span className="font-mono">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{threadComments.length} {threadComments.length === 1 ? 'reactie' : 'reacties'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* COMMENTS RIVER (MODERN) */}
          <div className="rounded-3xl bg-app-bg/70 border border-app-border p-6 sm:p-8 backdrop-blur-2xl space-y-6">
            <h3 className="text-xl font-black text-app-ink flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span>Discussiestroom ({threadComments.length})</span>
            </h3>

            {/* Comment Composer Capsule */}
            <div className="space-y-3 bg-app-card/80 border border-app-border p-4 sm:p-5 rounded-2xl backdrop-blur-xl">
              <AnimatePresence>
                {replyingToComment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl overflow-hidden mb-2 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CornerDownRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      <p className="font-bold text-app-ink/80 truncate">
                        Reageren op <span className="text-cyan-300 font-black">{nicknames[replyingToComment.author_id] || replyingToComment.author_name || 'Gebruiker'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingToComment(null)}
                      className="p-1 text-app-muted hover:text-app-ink rounded-lg hover:bg-app-ink/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                value={commentInput}
                onChange={(e) => handleTyping(e, 'forum')}
                placeholder="Typ je reactie in de discussie..."
                disabled={uploading}
                className="w-full px-4 py-3 bg-black/50 border border-app-border rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all text-app-ink min-h-[100px] resize-none text-sm placeholder:text-zinc-500 font-medium"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleImageUrl}
                    disabled={uploading}
                    className="p-2 text-app-muted hover:text-app-ink hover:bg-app-ink/10 rounded-xl border border-app-border transition-all cursor-pointer"
                    title="Afbeelding via URL"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleEmojiButtonClick(e, 'comment')}
                    disabled={uploading}
                    className="p-2 text-app-muted hover:text-app-ink hover:bg-app-ink/10 rounded-xl border border-app-border transition-all cursor-pointer"
                    title="Emoji kiezen"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCreateComment(activeThread.id)}
                  disabled={sending || !commentInput.trim() || uploading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-app-ink rounded-xl font-black text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {sending ? <ThemedSpinner size="xs" color="#ffffff" /> : <Send className="w-4 h-4" />}
                  <span>Plaatsen</span>
                </motion.button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {threadComments.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-dashed border-app-border rounded-2xl">
                  <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm font-medium">Nog geen reacties in dit topic. Start de discussie!</p>
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
                    <div key={comment.id} className="p-4 sm:p-5 bg-app-card/60 border border-app-border rounded-2xl space-y-3 backdrop-blur-md">
                      {/* Parent Quote */}
                      {comment.parent_id && (() => {
                        const parent = threadComments.find(c => c.id === comment.parent_id);
                        if (!parent) return null;
                        const parentAuthor = (userProfile && parent.author_id === userProfile.id)
                          ? userProfile
                          : profiles?.find(p => p.id === parent.author_id);
                        const parentAuthorName = nicknames[parent.author_id] || parentAuthor?.display_name || parent.author_name || 'Gebruiker';
                        return (
                          <div className="p-2.5 bg-black/40 rounded-xl border border-cyan-500/20 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                              <CornerDownRight className="w-3 h-3" />
                              <span>Antwoord op <span className="text-app-ink">{parentAuthorName}</span>:</span>
                            </div>
                            <p className="text-app-muted italic line-clamp-2 pl-4">
                              "{decryptGeneralChat(parent.content || '')}"
                            </p>
                          </div>
                        );
                      })()}

                      {/* Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div
                          onClick={() => handleOpenProfile(comment.author_id)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          {commentAuthorPhoto ? (
                            <img
                              src={commentAuthorPhoto}
                              alt={commentAuthorName}
                              className="w-8 h-8 rounded-full object-cover border border-cyan-500/30"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                              <UserIcon className="w-4 h-4 text-app-muted" />
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-app-ink group-hover:text-cyan-300 transition-colors">
                              {commentAuthorName}
                            </span>
                            {isVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-app-ink rounded-full p-0.5" title="Geverifieerd">
                                <Check className="w-2 h-2 stroke-[4]" />
                              </span>
                            )}
                            {isBeta && (
                              <span className="inline-flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 p-0.5 rounded" title="Beta Tester">
                                <FlaskConical className="w-2.5 h-2.5" />
                              </span>
                            )}
                            {isCommentAdmin && (
                              <span className="inline-flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 p-0.5 rounded" title="Admin">
                                <ShieldCheck className="w-3 h-3" />
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-mono">• {formatDate(comment.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setReplyingToComment(comment)}
                            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-ink/10 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Beantwoorden"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">Beantwoord</span>
                          </button>

                          {(isAdmin || (userProfile && comment.author_id === userProfile.id)) && onDeleteComment && (
                            <button
                              onClick={() => {
                                if (window.confirm('Wil je deze reactie verwijderen?')) {
                                  onDeleteComment(comment.id, activeThread.id);
                                }
                              }}
                              className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-all cursor-pointer"
                              title="Reactie verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-sm text-app-ink leading-relaxed pl-1 sm:pl-10">
                        <RichContent content={decryptGeneralChat(comment.content || '')} />
                      </div>

                      {/* Reactions */}
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
                                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                  : 'bg-black/40 border-app-border text-app-ink/80'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="font-mono">{count}</span>
                            </button>
                          );
                        })}

                        <div className="relative group/emojimodern inline-block">
                          <button
                            type="button"
                            className="p-1 text-zinc-500 hover:text-app-ink/80 rounded-lg text-xs hover:bg-app-ink/10"
                            title="Emoji reactie toevoegen"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          <div className="hidden group-hover/emojimodern:flex absolute left-0 bottom-full mb-1 bg-app-card border border-white/15 shadow-xl p-1 rounded-xl items-center gap-1 z-20 backdrop-blur-xl">
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
        /* MODERN OVERVIEW MODE */
        <div className="space-y-6">
          {/* Glass Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FORUM_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              const count = threads.filter(t => cat.id === 'all' || parseThreadCategory(t.title, t.content).category.id === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer backdrop-blur-xl ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-app-ink shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-app-card/60 border-app-border text-app-muted hover:text-app-ink hover:border-white/20'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : ''}>{getCategoryIcon(cat.iconName)}</span>
                  <span>{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-app-ink/5 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CREATE TOPIC MODAL / CARD (MODERN) */}
          <AnimatePresence>
            {isCreatingThread && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-app-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-app-ink">Nieuw Topic Publiceren</h3>
                      <p className="text-xs text-app-muted">Deel je gedachten of stel een vraag aan de community</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreatingThread(false)}
                    className="p-2 rounded-xl text-app-muted hover:text-app-ink hover:bg-app-ink/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-cyan-400 uppercase tracking-wider">Kies Categorie</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FORUM_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                      const isSelected = selectedCreationCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCreationCategory(cat.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer backdrop-blur-md ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                              : 'bg-black/40 border-app-border hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cat.color}>{getCategoryIcon(cat.iconName)}</span>
                            <span className="text-xs font-black text-app-ink">{cat.name}</span>
                          </div>
                          <span className="text-[10px] text-app-muted line-clamp-1">{cat.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-app-muted flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
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
                      className="px-2.5 py-1 bg-app-ink/5 hover:bg-app-ink/10 text-cyan-300 text-xs font-bold rounded-lg border border-app-border transition-all cursor-pointer"
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-app-ink/80 uppercase tracking-wider">Onderwerp</label>
                      <span className="text-[10px] text-zinc-500 font-mono">{threadTitleInput.length}/100</span>
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={threadTitleInput}
                      onChange={(e) => setThreadTitleInput(e.target.value)}
                      placeholder="Voer een duidelijke, krachtige titel in..."
                      className="w-full px-4 py-3 bg-black/50 border border-app-border rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold text-base text-app-ink placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-app-ink/80 uppercase tracking-wider">Inhoud</label>
                      <button
                        type="button"
                        onClick={() => setShowCreatePreview(!showCreatePreview)}
                        className="text-xs font-bold text-cyan-400 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {showCreatePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showCreatePreview ? 'Live Editor' : 'Live Preview'}</span>
                      </button>
                    </div>

                    {showCreatePreview ? (
                      <div className="p-4 bg-black/40 border border-app-border rounded-xl min-h-[160px] text-sm text-app-ink leading-relaxed">
                        <RichContent content={threadContentInput || '*Nog geen inhoud geschreven...*'} />
                      </div>
                    ) : (
                      <textarea
                        value={threadContentInput}
                        onChange={(e) => setThreadContentInput(e.target.value)}
                        placeholder="Deel de context, details of stel je vraag..."
                        className="w-full px-4 py-3.5 bg-black/50 border border-app-border rounded-xl focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all text-app-ink min-h-[160px] resize-none text-sm leading-relaxed placeholder:text-zinc-500"
                      />
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-2 mt-3 bg-black/40 p-2.5 rounded-xl border border-app-border">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleImageUrl}
                          className="p-2 text-app-muted hover:text-app-ink hover:bg-app-ink/10 rounded-lg transition-all cursor-pointer"
                          title="Afbeelding via URL"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleEmojiButtonClick(e, 'post')}
                          className="p-2 text-app-muted hover:text-app-ink hover:bg-app-ink/10 rounded-lg transition-all cursor-pointer"
                          title="Emoji invoegen"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingThread(false)}
                          className="px-4 py-2 bg-app-ink/5 text-app-ink/80 hover:text-app-ink rounded-xl font-bold text-xs hover:bg-app-ink/10 transition-all cursor-pointer"
                        >
                          Annuleren
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cat = FORUM_CATEGORIES.find(c => c.id === selectedCreationCategory);
                            let finalTitle = threadTitleInput.trim();
                            if (cat && cat.id !== 'algemeen' && !finalTitle.toLowerCase().includes(cat.tag)) {
                              finalTitle = `[${cat.name}] ${finalTitle}`;
                              setThreadTitleInput(finalTitle);
                            }
                            handleCreateThread();
                          }}
                          disabled={sending || !threadTitleInput.trim() || !threadContentInput.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-app-ink rounded-xl font-black text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          {sending ? <ThemedSpinner size="xs" color="#ffffff" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                          <span>Topic Publiceren</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STREAM / CARDS GRID */}
          {filteredThreads.length === 0 ? (
            <div className="text-center py-20 bg-app-bg/60 rounded-3xl border border-dashed border-app-border p-8 space-y-4 backdrop-blur-xl">
              <Compass className="w-12 h-12 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-lg font-black text-app-ink">Geen topics in dit kanaal</h4>
                <p className="text-app-muted text-sm max-w-sm mx-auto">
                  {searchQuery ? `Geen resultaten gevonden voor "${searchQuery}".` : 'Nog geen actieve topics in deze categorie.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                  if (selectedCategory !== 'all') setSelectedCategory('all');
                  setIsCreatingThread(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-app-ink font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Start het eerste topic</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
                    onClick={() => onOpenThreadStable(thread)}
                    className="relative overflow-hidden bg-app-bg/60 hover:bg-app-card/80 border border-app-border hover:border-cyan-500/40 p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r ${category.modernGradient} ${category.color} border border-app-border shadow-sm`}>
                            {getCategoryIcon(category.iconName)}
                            <span>{category.name}</span>
                          </span>

                          <span className="font-bold text-app-ink flex items-center gap-1">
                            {threadAuthorName}
                            {isVerified && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-app-ink rounded-full p-0.5 shadow-[0_0_6px_rgba(6,182,212,0.6)]" title="Geverifieerd">
                                <Check className="w-2 h-2 stroke-[4]" />
                              </span>
                            )}
                            {isBeta && (
                              <span className="inline-flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 p-0.5 rounded" title="Beta Tester">
                                <FlaskConical className="w-2 h-2" />
                              </span>
                            )}
                            {isAuthorAdmin && (
                              <span className="inline-flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 p-0.5 rounded" title="Admin">
                                <ShieldCheck className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </span>

                          <span className="text-zinc-500">•</span>
                          <span className="text-app-muted font-mono text-[11px]">{formatDate(thread.created_at)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-black text-app-ink group-hover:text-cyan-300 transition-colors leading-snug break-words">
                          {cleanTitle}
                        </h3>

                        {/* Snippet */}
                        <p className="text-app-muted text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                          {decContent}
                        </p>

                        {/* Footer Badges */}
                        <div className="flex items-center gap-4 pt-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-xl">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{repliesCount} {repliesCount === 1 ? 'reactie' : 'reacties'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-app-muted font-mono">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Laatste update: {formatDate(thread.updated_at)}</span>
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
                            className="p-2.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all cursor-pointer"
                            title="Topic en alle reacties verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="hidden sm:flex p-3 rounded-2xl bg-app-ink/5 text-app-muted group-hover:bg-cyan-500 group-hover:text-app-ink transition-all shadow-sm">
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
