import React from 'react';
import { Conversation, DirectMessage, CustomTheme, UserProfile } from '../types';
import { NormalMessagesView } from './dm/NormalMessagesView';
import { ModernMessagesView } from './dm/ModernMessagesView';

export interface MessagesViewProps {
  user: any;
  profile?: UserProfile | null;
  profiles?: UserProfile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  messages: DirectMessage[];
  messageInput: string;
  setMessageInput: (input: string) => void;
  handleSendMessage: (e?: React.FormEvent, customContent?: string) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement>, channel: string) => void;
  handleEmojiButtonClick: (e: React.MouseEvent, type: 'message') => void;
  handleImageUrl: () => void;
  typingStatuses: Record<string, string[]>;
  mobileChatView: 'list' | 'chat';
  setMobileChatView: (view: 'list' | 'chat') => void;
  setShowUserSearch: (show: boolean) => void;
  onlineUsers: Set<string>;
  sending: boolean;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  isModernUI?: boolean;
  onStartCall?: (targetId: string, targetName: string, targetAvatar?: string) => void;
  onStartVideoCall?: (targetId: string, targetName: string, targetAvatar?: string) => void;
  onStartGroupCall?: (roomId: string, roomName: string, isVideo?: boolean) => void;
  onEndCall?: () => void;
  activeCallUserId?: string;
  groupVoiceCallActiveRooms?: Set<string>;
  playSound?: (url: string, enabled: boolean, uid: string, name: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onToggleHideConversation?: (conversationId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = React.memo((props) => {
  if (props.isModernUI) {
    return <ModernMessagesView {...props} />;
  }
  return <NormalMessagesView {...props} />;
});
