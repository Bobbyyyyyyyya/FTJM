import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Plus, ChevronLeft, MessageSquare, Clock, User as UserIcon, Loader2, X, Smile, Link, Send, Check, ShieldCheck, FlaskConical } from 'lucide-react';
import { ForumThread, ForumComment, UserProfile } from '../types';
import { formatDate } from '../utils/helpers';
import { isVerifiedEmail, isBetaTester } from '../constants';
import { RichContent } from './RichContent';

interface ForumViewProps {
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
}

export const ForumView: React.FC<ForumViewProps> = React.memo(({
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
  userProfile
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-app-ink tracking-tight">Community Forum</h2>
          <p className="text-app-muted text-sm mt-1">Deel je gedachten, stel vragen en help anderen.</p>
        </div>
        {!activeThread && (
          <button 
            onClick={() => setIsCreatingThread(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nieuw Topic
          </button>
        )}
      </div>

      {activeThread ? (
        <div className="space-y-6">
          <button 
            onClick={() => setActiveThread(null)}
            className="flex items-center gap-2 text-app-muted hover:text-app-ink transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Terug naar overzicht
          </button>

          <div 
            className={`bg-app-card rounded-3xl border border-app-border shadow-sm overflow-hidden transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
            style={useCustomTheme ? { 
              backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
              borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
              boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
              color: customTheme.text_color
            } : {}}
          >
              <div className="p-6 sm:p-8 border-b border-app-border bg-app-accent/5" style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent', borderColor: 'transparent' } : {}}>
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const threadAuthorProfile = activeThread
                      ? ((userProfile && activeThread.author_id === userProfile.id)
                        ? userProfile
                        : profiles?.find(p => p.id === activeThread.author_id))
                      : null;
                    const threadAuthorName = threadAuthorProfile?.display_name || activeThread?.author_name || 'Anoniem';
                    const threadAuthorPhoto = threadAuthorProfile?.photo_url || activeThread?.author_photo;
                    return (
                      <>
                        {threadAuthorPhoto ? (
                          <img src={threadAuthorPhoto} alt="" className="w-8 h-8 rounded-full border border-app-border object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                            <UserIcon className="w-4 h-4 text-app-muted" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-app-muted">
                          <span className="font-bold text-app-ink">{nicknames[activeThread!.author_id] || threadAuthorName}</span>
                          {isVerifiedEmail(threadAuthorProfile || threadAuthorProfile?.email) && (
                            <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                              <Check className="w-2 h-2 stroke-[4]" />
                            </span>
                          )}
                          {isBetaTester(threadAuthorProfile || threadAuthorProfile?.email) && (
                            <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(245,158,11,0.25)]" title="Beta Tester">
                              <FlaskConical className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                            </span>
                          )}
                          {(threadAuthorProfile?.role === 'admin' || threadAuthorProfile?.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                            <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_8px_rgba(239,68,68,0.2)]" title="Administrator">
                              <ShieldCheck className="w-3 h-3 text-red-400 stroke-[2.5]" />
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDate(activeThread!.created_at)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-app-ink mb-4 leading-tight">{activeThread.title}</h1>
              <div className="text-app-ink text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                <RichContent content={activeThread.content} />
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="font-bold text-app-ink flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reacties ({threadComments.length})
                </h3>
                
                <div className="relative space-y-2">
                  <AnimatePresence>
                    {replyingToComment && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between bg-app-accent/30 border border-app-border p-2 rounded-xl overflow-hidden"
                        style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent', borderColor: 'transparent' } : {}}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-1 h-6 bg-app-ink rounded-full flex-shrink-0" />
                          <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest truncate">
                            Reageren op <span className="text-app-ink">{nicknames[replyingToComment.author_id] || replyingToComment.author_name}</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => setReplyingToComment(null)}
                          className="p-1 text-app-muted hover:text-app-ink transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <textarea 
                    value={commentInput}
                    onChange={(e) => handleTyping(e, 'forum')}
                    placeholder="Wat vind jij hiervan?"
                    disabled={uploading}
                    className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[120px] resize-none"
                    style={useCustomTheme ? { 
                      backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                      borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
                      color: customTheme.text_color
                    } : {}}
                  />
                  <div className="flex items-center justify-between gap-2 bg-app-accent/20 p-2 rounded-xl" style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent' } : {}}>
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={handleImageUrl}
                        disabled={uploading}
                        className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all disabled:opacity-50"
                        title="Afbeelding via URL"
                      >
                        <Link className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleEmojiButtonClick(e, 'comment')}
                        disabled={uploading}
                        className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all disabled:opacity-50"
                        title="Emoji kiezen"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleCreateComment(activeThread.id)}
                      disabled={sending || !commentInput.trim() || uploading}
                      className="px-6 py-2 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Plaatsen
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {threadComments.length === 0 ? (
                  <div className="text-center py-12 bg-app-accent/5 rounded-2xl border border-dashed border-app-border" style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent', borderColor: 'transparent' } : {}}>
                    <p className="text-app-muted text-sm">Nog geen reacties. Wees de eerste!</p>
                  </div>
                ) : (
                  threadComments.map(comment => {
                    const commentAuthor = (userProfile && comment.author_id === userProfile.id)
                      ? userProfile
                      : profiles?.find(p => p.id === comment.author_id);
                    const commentAuthorName = commentAuthor?.display_name || comment.author_name || 'Anoniem';
                    const commentAuthorPhoto = commentAuthor?.photo_url || comment.author_photo;

                    return (
                      <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 flex-shrink-0">
                          {commentAuthorPhoto ? (
                            <img src={commentAuthorPhoto} alt="" className="w-full h-full rounded-full border border-app-border object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                              <UserIcon className="w-5 h-5 text-app-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                              {comment.parent_id && (
                                <div className="mb-1.5 space-y-1">
                                  {(() => {
                                    const parent = threadComments.find(c => c.id === comment.parent_id);
                                    if (!parent) return null;
                                    const parentAuthor = (userProfile && parent.author_id === userProfile.id)
                                      ? userProfile
                                      : profiles?.find(p => p.id === parent.author_id);
                                    const parentAuthorName = parentAuthor?.display_name || parent.author_name || 'Anoniem';
                                    return (
                                      <>
                                        <div className="flex items-center gap-1 text-[10px] text-app-muted font-medium bg-app-accent/30 w-fit px-2 py-0.5 rounded-full border border-app-border/50">
                                          <MessageSquare className="w-2.5 h-2.5" />
                                          <span>Geantwoord op <span className="font-bold text-app-ink">{nicknames[parent.author_id] || parentAuthorName}</span></span>
                                        </div>
                                        <div className="pl-2 border-l-2 border-app-border ml-1.5">
                                          <p className="text-[10px] text-app-muted italic line-clamp-1 opacity-70">
                                            "{parent.content}"
                                          </p>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                <span className="font-bold text-app-ink">{nicknames[comment.author_id] || commentAuthorName}</span>
                                {isVerifiedEmail(commentAuthor || commentAuthor?.email) && (
                                  <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_6px_rgba(6,182,212,0.5)]" title="Geverifieerd Account">
                                    <Check className="w-2 h-2 stroke-[4]" />
                                  </span>
                                )}
                                {isBetaTester(commentAuthor || commentAuthor?.email) && (
                                  <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                    <FlaskConical className="w-2 h-2 text-amber-400 stroke-[2.5]" />
                                  </span>
                                )}
                                {(commentAuthor?.role === 'admin' || commentAuthor?.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                                  <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(239,68,68,0.2)]" title="Administrator">
                                    <ShieldCheck className="w-2.5 h-2.5 text-red-400 stroke-[2.5]" />
                                  </span>
                                )}
                                <span className="text-app-muted">{formatDate(comment.created_at)}</span>
                              </div>
                            </div>
                          <button 
                            onClick={() => setReplyingToComment(comment)}
                            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Reageren"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div 
                          className={`text-app-ink text-sm sm:text-base leading-relaxed bg-app-accent/5 p-4 rounded-2xl border border-app-border/50 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
                          style={useCustomTheme ? { 
                            backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                            borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
                            color: customTheme.text_color
                          } : {}}
                        >
                          <RichContent content={comment.content} />
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {isCreatingThread && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-app-card rounded-3xl p-6 sm:p-8 border-2 border-app-ink shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-app-ink">Nieuw Topic Starten</h3>
                <button onClick={() => setIsCreatingThread(false)} className="p-2 hover:bg-app-accent rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input 
                  type="text"
                  value={threadTitleInput}
                  onChange={(e) => setThreadTitleInput(e.target.value)}
                  placeholder="Titel van je topic"
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all font-bold text-lg text-app-ink"
                  style={useCustomTheme ? { 
                    backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                    color: customTheme.text_color
                  } : {}}
                />
                <div className="space-y-4">
                  <textarea 
                    value={threadContentInput}
                    onChange={(e) => setThreadContentInput(e.target.value)}
                    placeholder="Waar wil je het over hebben?"
                    className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[200px] resize-none"
                    style={useCustomTheme ? { 
                      backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                      color: customTheme.text_color
                    } : {}}
                  />
                  <div className="flex items-center gap-2 bg-app-accent/20 p-2 rounded-xl" style={useCustomTheme && customTheme.chat_opacity === 100 ? { backgroundColor: 'transparent' } : {}}>
                    <button 
                      type="button"
                      onClick={handleImageUrl}
                      className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                      title="Afbeelding via URL"
                    >
                      <Link className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleEmojiButtonClick(e, 'post')}
                      className="p-2 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-xl transition-all"
                      title="Emoji kiezen"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setIsCreatingThread(false)}
                    className="px-6 py-2.5 bg-app-accent text-app-muted rounded-xl font-bold hover:bg-app-border transition-all"
                  >
                    Annuleren
                  </button>
                  <button 
                    onClick={handleCreateThread}
                    disabled={sending || !threadTitleInput.trim() || !threadContentInput.trim()}
                    className="px-8 py-2.5 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Topic Publiceren'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {threads.length === 0 ? (
            <div className="text-center py-20 bg-app-card rounded-3xl border border-dashed border-app-border">
              <Layout className="w-12 h-12 text-app-muted mx-auto mb-4 opacity-20" />
              <p className="text-app-muted font-medium">Nog geen topics gevonden. Start jij de eerste?</p>
            </div>
          ) : (
            threads.map(thread => (
                <motion.div 
                  key={thread.id}
                  layout
                  onClick={() => handleOpenThread(thread)}
                  className={`bg-app-card p-6 sm:p-8 rounded-3xl border border-app-border shadow-sm hover:shadow-md hover:border-app-ink/20 transition-all cursor-pointer group ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}
                  style={useCustomTheme ? { 
                    backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
                    borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
                    boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
                    color: customTheme.text_color
                  } : {}}
                >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-xs text-app-muted">
                      {(() => {
                        const threadAuthor = (userProfile && thread.author_id === userProfile.id)
                          ? userProfile
                          : profiles?.find(p => p.id === thread.author_id);
                        const threadAuthorName = threadAuthor?.display_name || thread.author_name || 'Anoniem';
                        return (
                          <span className="font-bold text-app-ink">{nicknames[thread.author_id] || threadAuthorName}</span>
                        );
                      })()}
                      <span>•</span>
                      <span>{formatDate(thread.created_at)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-app-ink group-hover:text-app-ink/80 transition-colors leading-tight">{thread.title}</h3>
                    <p className="text-app-muted text-sm line-clamp-2 leading-relaxed">{thread.content}</p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
                        <MessageSquare className="w-4 h-4" />
                        {thread.comment_count || 0} reacties
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
                        <Clock className="w-4 h-4" />
                        Laatste update {formatDate(thread.updated_at)}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="p-3 bg-app-accent rounded-2xl group-hover:bg-app-ink group-hover:text-app-bg transition-all">
                      <ChevronLeft className="w-5 h-5 rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
