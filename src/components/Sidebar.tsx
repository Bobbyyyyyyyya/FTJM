import React from 'react';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import { UserProfile, CustomTheme } from '../types';
import { formatDate } from '../utils/helpers';
import { User } from '../lib/firebase';

interface SidebarProps {
  user: User;
  profile: UserProfile | null;
  isAdmin: boolean;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  formatDate: (date: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  profile, 
  isAdmin, 
  useCustomTheme, 
  customTheme 
}) => {
  return (
    <div 
      className={`bg-app-card rounded-3xl p-8 border border-app-border shadow-sm sticky top-24 transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : customTheme.card_bg_color,
        color: customTheme.text_color
      } : {}}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          {(profile?.photo_url || user.photoURL) ? (
            <img 
              src={profile?.photo_url || user.photoURL} 
              alt={profile?.display_name || user.displayName || ''} 
              className="w-24 h-24 rounded-3xl border-4 border-app-card shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-app-accent flex items-center justify-center border border-app-border">
              <UserIcon className="w-10 h-10 text-app-muted" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-app-ink">{profile?.display_name || user.displayName || 'Anoniem'}</h2>
        <p className="text-app-muted text-sm mt-1">{user.email}</p>
        
        <div className="mt-8 w-full pt-8 border-t border-app-border space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-app-muted">Lid sinds</span>
            <span className="text-app-ink font-medium">
              {profile ? formatDate(profile.created_at) : '...'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-app-muted">Status</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          {isAdmin && (
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">Rol</span>
              <span className="flex items-center gap-1.5 text-app-ink font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
