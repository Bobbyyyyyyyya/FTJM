import React from 'react';
import { motion } from 'motion/react';
import { Layout, Plus, ChevronLeft, MessageSquare, Clock, User as UserIcon, Loader2, X } from 'lucide-react';
import { ForumThread, ForumComment } from '../types';
import { formatDate } from '../utils/helpers';
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
  sending: boolean;
  replyingToComment: ForumComment | null;
  setReplyingToComment: (comment: ForumComment | null) => void;
  nicknames: Record<string, string>;
}

export const ForumView: React.FC<ForumViewProps> = ({
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
  sending,
  replyingToComment,
  setReplyingToComment,
  nicknames
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-app-ink tracking-tight">Community Forum</h2>
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

          <div className="bg-app-card rounded-3xl border border-app-border shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-app-border bg-app-accent/5">
                <div className="flex items-center gap-3 mb-4">
                  {(activeThread.author_photo) ? (
                    <img src={activeThread.author_photo} alt="" className="w-8 h-8 rounded-full border border-app-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                      <UserIcon className="w-4 h-4 text-app-muted" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-app-muted">
                    <span className="font-bold text-app-ink">{nicknames[activeThread.author_id] || activeThread.author_name}</span>
                    <span>•</span>
                    <span>{formatDate(activeThread.created_at)}</span>
                  </div>
                </div>
              <h1 className="text-2xl sm:text-3xl font-black text-app-ink mb-4 leading-tight">{activeThread.title}</h1>
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
                
                <div className="relative">
                  {replyingToComment && (
                    <div className="mb-2 flex items-center justify-between bg-app-accent/30 border border-app-border p-2 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-1 h-6 bg-app-ink rounded-full flex-shrink-0" />
                        <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest truncate">
                          Reageren op <span className="text-app-ink">{replyingToComment.author_name}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => setReplyingToComment(null)}
                        className="p-1 text-app-muted hover:text-app-ink transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <textarea 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Wat vind jij hiervan?"
                    className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={() => handleCreateComment(activeThread.id)}
                    disabled={sending || !commentInput.trim()}
                    className="absolute bottom-4 right-4 px-6 py-2 bg-app-ink text-app-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Plaatsen'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {threadComments.length === 0 ? (
                  <div className="text-center py-12 bg-app-accent/5 rounded-2xl border border-dashed border-app-border">
                    <p className="text-app-muted text-sm">Nog geen reacties. Wees de eerste!</p>
                  </div>
                ) : (
                  threadComments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 flex-shrink-0">
                        {comment.author_photo ? (
                          <img src={comment.author_photo} alt="" className="w-full h-full rounded-full border border-app-border object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-app-accent flex items-center justify-center border border-app-border">
                            <UserIcon className="w-5 h-5 text-app-muted" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            {comment.parent_author_name && (
                              <div className="flex items-center gap-1 text-[10px] text-app-muted mb-0.5 font-medium">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>Geantwoord op <span className="font-bold text-app-ink">{comment.parent_author_name}</span></span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-app-ink">{nicknames[comment.author_id] || comment.author_name}</span>
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
                        <div className="text-app-ink text-sm sm:text-base leading-relaxed bg-app-accent/5 p-4 rounded-2xl border border-app-border/50">
                          <RichContent content={comment.content} />
                        </div>
                      </div>
                    </div>
                  ))
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
                <h3 className="text-xl font-black text-app-ink">Nieuw Topic Starten</h3>
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
                />
                <textarea 
                  value={threadContentInput}
                  onChange={(e) => setThreadContentInput(e.target.value)}
                  placeholder="Waar wil je het over hebben?"
                  className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-app-ink focus:border-transparent transition-all text-app-ink min-h-[200px] resize-none"
                />
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
                className="bg-app-card p-6 sm:p-8 rounded-3xl border border-app-border shadow-sm hover:shadow-md hover:border-app-ink/20 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-xs text-app-muted">
                      <span className="font-bold text-app-ink">{nicknames[thread.author_id] || thread.author_name}</span>
                      <span>•</span>
                      <span>{formatDate(thread.created_at)}</span>
                    </div>
                    <h3 className="text-xl font-black text-app-ink group-hover:text-app-ink/80 transition-colors leading-tight">{thread.title}</h3>
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
};
