import React, { useState } from 'react';
import { Users, Search, Mail, ShieldCheck, User as UserIcon, PanelLeft, PanelRight, LayoutList, ChevronRight, X } from 'lucide-react';
import { UserProfile, CustomTheme, ModernUICustomization } from '../types';
import { isTestUser } from '../constants';
import { getAccentHex, getGlassEffectClasses, getRadiusValue } from '../utils/modernUICustom';
import { hexToRgba } from '../utils/helpers';

interface ModernProfileListProps {
  users: UserProfile[];
  onlineUsers: Set<string>;
  currentUserId?: string;
  position: 'left' | 'right';
  onChangePosition: (pos: 'left' | 'right' | 'sidebar' | 'hidden') => void;
  onOpenProfile: (userId: string) => void;
  onStartDM: (user: UserProfile) => void;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  modernCustom?: ModernUICustomization;
}

export const ModernProfileList: React.FC<ModernProfileListProps> = React.memo(({
  users,
  onlineUsers,
  currentUserId,
  position,
  onChangePosition,
  onOpenProfile,
  onStartDM,
  useCustomTheme,
  customTheme,
  modernCustom
}) => {
  const [search, setSearch] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const activeAccent = modernCustom ? getAccentHex(modernCustom) : '#06b6d4';
  const glassClasses = modernCustom ? getGlassEffectClasses(modernCustom.glass_intensity) : 'bg-app-card/75 backdrop-blur-2xl border border-white/10 shadow-2xl';
  const radius = modernCustom ? getRadiusValue(modernCustom.card_radius) : '1.5rem';
  const showOffline = modernCustom?.show_offline_users !== false;

  const isExplicitlySearchingTest = search.toLowerCase().includes('test');
  const filteredUsers = users
    .filter(u => !u.is_blocked && u.id !== currentUserId && (isExplicitlySearchingTest || !isTestUser(u)))
    .filter(u => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.original_name?.toLowerCase().includes(q)
      );
    });

  const onlineList = filteredUsers.filter(u => onlineUsers.has(u.id));
  const offlineList = showOffline ? filteredUsers.filter(u => !onlineUsers.has(u.id)) : [];

  // Determine fixed positioning classes
  const positionClasses = position === 'left'
    ? 'fixed left-4 sm:left-28 top-16 bottom-4 w-60 z-[90]'
    : 'fixed right-4 top-16 bottom-4 w-64 z-[90]';

  if (isMinimized) {
    return (
      <div className={`hidden lg:flex ${position === 'left' ? 'fixed left-28 top-16' : 'fixed right-4 top-16'} z-[90]`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="h-10 px-3 bg-app-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold text-app-ink hover:scale-105 transition-all"
          title="Profielenlijst openen"
          style={{ borderRadius: radius }}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>{onlineUsers.size} Online</span>
          <ChevronRight className="w-3 h-3 text-app-muted" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`hidden lg:flex flex-col p-4 transition-all duration-300 ${positionClasses} ${glassClasses} ${
        useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''
      }`}
      style={{
        borderRadius: radius,
        ...(useCustomTheme && !customTheme.glass_effect && customTheme.card_bg_color ? {
          backgroundColor: hexToRgba(customTheme.card_bg_color, 0.85),
          borderColor: hexToRgba(customTheme.card_bg_color, 0.2)
        } : {})
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: `${activeAccent}20`, color: activeAccent }}
          >
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-app-ink uppercase tracking-wider">Leden</h4>
            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineUsers.size} online
            </p>
          </div>
        </div>

        {/* Position Switcher & Minimize */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangePosition(position === 'left' ? 'right' : 'left')}
            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all"
            title={`Verplaats naar ${position === 'left' ? 'rechts' : 'links'}`}
          >
            {position === 'left' ? <PanelRight className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onChangePosition('sidebar')}
            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all"
            title="Verplaats in de sidebar"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-app-muted hover:text-app-ink hover:bg-app-accent rounded-lg transition-all"
            title="Minimaliseren"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-app-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek lid..."
          className="w-full pl-8 pr-3 py-1.5 bg-app-accent/40 border border-white/5 rounded-xl text-xs text-app-ink placeholder:text-app-muted/60 focus:outline-none focus:ring-1 focus:ring-app-ink/30 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Users List Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
        {/* Online Section */}
        {onlineList.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted/80 px-1">
              Online ({onlineList.length})
            </p>
            <div className="space-y-1">
              {onlineList.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  isOnline={true}
                  onOpenProfile={onOpenProfile}
                  onStartDM={onStartDM}
                />
              ))}
            </div>
          </div>
        )}

        {/* Offline Section */}
        {showOffline && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted/80 px-1">
              Alle Leden ({offlineList.length})
            </p>
            {offlineList.length === 0 && onlineList.length === 0 ? (
              <p className="text-xs text-app-muted italic text-center py-4">Geen leden gevonden.</p>
            ) : (
              <div className="space-y-1">
                {offlineList.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isOnline={false}
                    onOpenProfile={onOpenProfile}
                    onStartDM={onStartDM}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
});

interface UserRowProps {
  user: UserProfile;
  isOnline: boolean;
  onOpenProfile: (userId: string) => void;
  onStartDM: (user: UserProfile) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, isOnline, onOpenProfile, onStartDM }) => {
  return (
    <div
      onClick={() => onOpenProfile(user.id)}
      className="group flex items-center justify-between p-1.5 rounded-2xl hover:bg-app-accent/60 transition-all cursor-pointer select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div className="relative w-8 h-8 shrink-0">
          <div className="w-full h-full rounded-xl overflow-hidden bg-app-accent border border-white/10">
            {user.photo_url?.trim() ? (
              <img
                src={user.photo_url}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-app-muted" />
              </div>
            )}
          </div>
          {isOnline && (
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-app-card shadow-sm animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-app-ink truncate max-w-[100px]">
              {user.display_name || 'Anoniem'}
            </p>
            {user.role === 'admin' && (
              <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-app-muted truncate max-w-[100px]">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Quick DM Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStartDM(user);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 bg-app-ink text-app-bg rounded-lg hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
        title={`Stuur DM naar ${user.display_name}`}
      >
        <Mail className="w-3 h-3" />
      </button>
    </div>
  );
};
