export interface NotificationSettings {
  enableSounds: boolean;
  notifyNewPosts: boolean;
  notifyNewMessages: boolean;
  messageSound: string;
  postSound: string;
}

export interface Report {
  id: string;
  reporterUid: string;
  reportedUid: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface CustomTheme {
  wallpaper?: string;
  pattern?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  cardBgColor?: string;
  sidebarBgColor?: string;
  headerBgColor?: string;
  bodyBgColor?: string;
  glassEffect?: boolean;
  blurAmount?: number;
  opacity?: number;
  wallpaperX?: number;
  wallpaperY?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  originalName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  notificationSettings?: NotificationSettings;
  customTheme?: CustomTheme;
  useCustomTheme?: boolean;
  nameChangeCount?: number;
  lastNameChangeDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  lastMessageSenderUid?: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  senderUid: string;
  text: string;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
