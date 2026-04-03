export interface NotificationSettings {
  enable_sounds: boolean;
  notify_new_posts: boolean;
  notify_new_messages: boolean;
  message_sound: string;
  post_sound: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details?: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface CustomTheme {
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
  wallpaper_x?: number;
  wallpaper_y?: number;
}

export interface UserProfile {
  id: string;
  display_name: string;
  original_name?: string;
  email: string;
  photo_url?: string;
  bio?: string;
  notification_settings?: NotificationSettings;
  custom_theme?: CustomTheme;
  use_custom_theme?: boolean;
  name_change_count?: number;
  last_name_change_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  last_message?: string;
  last_message_sender_id?: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  text: string;
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
