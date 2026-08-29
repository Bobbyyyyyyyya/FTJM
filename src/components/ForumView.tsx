import React from 'react';
import { ForumThread, ForumComment, UserProfile } from '../types';
import { NormalForumView } from './forum/NormalForumView';
import { ModernForumView } from './forum/ModernForumView';

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
  isModernUI?: boolean;
  onDeleteThread?: (threadId: string) => void;
  onDeleteComment?: (commentId: string, threadId: string) => void;
}

export const ForumView: React.FC<ForumViewProps> = React.memo((props) => {
  const isModern = props.isModernUI ?? Boolean(props.customTheme?.modern_ui);

  if (isModern) {
    return <ModernForumView {...props} />;
  }

  return <NormalForumView {...props} />;
});
