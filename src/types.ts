export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface NotificationSettings {
  enable_sounds: boolean;
  notify_new_posts: boolean;
  notify_new_messages: boolean;
  notify_mentions: boolean;
  message_sound: string;
  post_sound: string;
  ringtone_url?: string;
  discord_webhook_url?: string;
  discord_notify_general?: boolean;
  discord_notify_dm?: boolean;
}

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_photo?: string;
  type: 'mention' | 'reply' | 'dm' | 'follow' | 'system' | 'like' | 'comment';
  resource_id: string;
  resource_type: 'post' | 'comment' | 'thread' | 'media' | 'profile';
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id?: string;
  reported_post_id?: string;
  target_type?: string;
  target_id?: string;
  reason?: string;
  details?: string;
  created_at: string;
  status: string;
}

export interface CustomFontItem {
  id: string;
  name: string;
  family: string;
  source: 'preset' | 'google' | 'upload' | 'system';
  url?: string;
  fontData?: string; // base64 / data URL for uploaded .ttf / .woff / .otf
  format?: 'truetype' | 'opentype' | 'woff' | 'woff2';
  category?: 'sans' | 'serif' | 'mono' | 'display' | 'retro' | 'script' | 'custom';
  createdAt?: string;
  fileSize?: number;
}

export interface ModernUICustomization {
  enabled?: boolean;
  sidebar_position?: 'left' | 'right' | 'bottom_dock' | 'compact';
  accent_style?: 'theme' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'monochrome' | 'custom';
  custom_accent_color?: string;
  glass_intensity?: 'none' | 'subtle' | 'frosted' | 'deep' | 'cyber';
  card_radius?: 'crisp' | 'modern' | 'squircle' | 'pill';
  density?: 'compact' | 'balanced' | 'spacious';
  ambient_aura?: boolean;
  aura_background?: boolean;
  ambient_aura_color?: string;
  glow_active_items?: boolean;
  show_offline_users?: boolean;
  dock_position?: 'bottom' | 'floating';
  sidebar_blur?: number;
  sidebar_opacity?: number;
  auto_hide_top_bar?: boolean;
}

export interface CustomTheme {
  modern_ui?: boolean;
  modern_ui_custom?: ModernUICustomization;
  profile_list_position?: 'left' | 'right' | 'sidebar' | 'hidden';
  wallpaper?: string;
  pattern?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  card_bg_color?: string;
  sidebar_bg_color?: string;
  header_bg_color?: string;
  body_bg_color?: string;
  glass_effect?: boolean;
  blur_amount?: number;
  opacity?: number;
  chat_opacity?: number;
  profile_card_opacity?: number;
  wallpaper_x?: number;
  wallpaper_y?: number;
  border_radius?: number;
  font_family?: string;
  custom_font_name?: string;
  custom_font_url?: string;
  custom_font_data?: string;
  custom_fonts?: CustomFontItem[];
  agreed_terms_v2?: boolean;
  user_telemetry?: any;
  game_high_scores?: Record<string, number>;
  banner_url?: string;
  discord_id?: string;
  discord_username?: string;
  discord_link_code?: string;
  following?: string[];
  media?: any[];
  icon_animation_mode?: 'all' | 'hover_only' | 'disabled';
}

export interface UserProfile {
  id: string;
  display_name: string;
  original_name?: string;
  email: string;
  photo_url?: string;
  bio?: string;
  banner_url?: string;
  role?: 'user' | 'admin';
  is_verified?: boolean;
  notification_settings?: NotificationSettings;
  custom_theme?: CustomTheme;
  use_custom_theme?: boolean;
  custom_sounds?: { name: string, url: string }[];
  name_change_count?: number;
  last_name_change_date?: string;
  is_blocked?: boolean;
  name_locked_until?: string;
  bio_locked_until?: string;
  admin_notes?: string;
  public_key?: string; // Base64 encoded public key
  created_at: string;
  updated_at: string;
}

export interface AdminWarning {
  id: string;
  reason: string;
  details: string;
  admin_name: string;
  date: string;
  read: boolean;
}

export interface AdminNotesData {
  telemetry: any[];
  warnings: AdminWarning[];
  banned_until: string | null;
  ban_reason: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  content: string;
  created_at: string;
  parent_id?: string;
  is_blocked?: boolean;
}

export interface ForumThread {
  id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
  is_blocked?: boolean;
}

export interface ForumComment {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  content: string;
  created_at: string;
  parent_id?: string;
  is_blocked?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  participant_photos: Record<string, string>;
  last_message?: string;
  last_message_sender_id?: string;
  last_message_is_encrypted?: boolean;
  last_message_iv?: string;
  is_group?: boolean;
  name?: string;
  created_by?: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_encrypted?: boolean;
  iv?: string; // Initialization vector for AES-GCM
  is_edited?: boolean;
}

export interface Nickname {
  id: string;
  user_id: string;
  target_id: string;
  nickname: string;
  created_at: string;
}

export interface AudioLog {
  id: string;
  user_id?: string;
  user_name?: string;
  url: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  created_at: string;
}

export interface SupabaseErrorInfo {
  error: string;
  operation: string;
  authInfo: {
    userId?: string;
    email?: string | null;
  }
}
