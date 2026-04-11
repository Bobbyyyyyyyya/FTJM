import React from 'react';
import { User as UserIcon, ShieldCheck, LogOut } from 'lucide-react';
import { UserProfile, CustomTheme } from '../types';
import { User } from '../lib/firebase';

interface HeaderProps {
  user: User;
  profile: UserProfile | null;
  isAdmin: boolean;
  handleLogout: () => void;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  websiteStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  profile,
  isAdmin,
  handleLogout,
  useCustomTheme,
  customTheme,
  websiteStatus
}) => {
  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-40 border-b border-app-border backdrop-blur-md transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''}`}
      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : customTheme.header_bg_color,
        borderColor: customTheme.card_bg_color ? `${customTheme.card_bg_color}20` : 'rgba(244, 244, 245, 1)'
      } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-app-ink rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-all duration-300">
            <span className="text-app-bg font-black text-xl sm:text-2xl tracking-tighter">H</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-app-ink tracking-tighter uppercase">Hoksen Forum</h1>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${websiteStatus === 'Online' ? 'bg-emerald-500 animate-pulse' : websiteStatus === 'Onderhoud' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{websiteStatus}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-app-accent/50 rounded-xl sm:rounded-2xl border border-app-border">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-app-bg flex items-center justify-center overflow-hidden border border-app-border shadow-sm">
                {(profile?.photo_url || user.photoURL) ? (
                  <img src={profile?.photo_url || user.photoURL || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-app-muted" />
                )}
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-md shadow-sm border border-white">
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-black text-app-ink uppercase tracking-tight truncate max-w-[100px]">
                {profile?.display_name || user.displayName || 'Gebruiker'}
              </p>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
                {isAdmin ? 'Administrator' : 'Lid'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2.5 sm:p-3 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all active:scale-95"
            title="Uitloggen"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
