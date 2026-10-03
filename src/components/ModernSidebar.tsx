import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Mail, Layout, Film, Newspaper, Settings, Gamepad2, Users, 
  User as UserIcon, ShieldCheck, ChevronRight, Search, X, LogOut, Sliders,
  Bell, Trash2, CheckCheck, Heart, AtSign, UserPlus 
} from 'lucide-react';
import { 
  AnimatedMailIcon, 
  AnimatedChatIcon, 
  AnimatedMenuIcon, 
  AnimatedMediaIcon, 
  AnimatedForumIcon, 
  AnimatedNewsIcon, 
  AnimatedArcadeIcon,
  AnimatedBellIcon 
} from './AnimatedIcons';
import { t } from '../utils/translations';
import { UserProfile, ModernUICustomization, CustomTheme, AppNotification } from '../types';
import { isTestUser } from '../constants';
import { VerifiedBadge } from './VerifiedBadge';
import { DeveloperBadge } from './DeveloperBadge';
import { getSafeImageUrl, handleImageError, formatDate } from '../utils/helpers';
import { Logo } from './Logo';
import { getAccentHex, getGlassEffectClasses, getRadiusValue } from '../utils/modernUICustom';
import { LetterAvatar } from './UserAvatar';

interface ModernSidebarProps {
  view: string;
  setView: (view: any) => void;
  isAdmin: boolean;
  websiteStatus: string;
  profileListPosition?: 'left' | 'right' | 'sidebar' | 'hidden';
  users?: UserProfile[];
  onlineUsers?: Set<string>;
  onOpenProfile?: (userId: string) => void;
  onStartDM?: (user: UserProfile) => void;
  currentUserId?: string;
  onLogout?: () => void;
  modernCustom?: ModernUICustomization;
  customTheme?: CustomTheme;
  onOpenCustomizer?: () => void;
  notifications?: AppNotification[];
  onNotificationClick?: (notif: AppNotification) => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (e: React.MouseEvent, notifId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  nicknames?: Record<string, string>;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  view,
  setView,
  isAdmin,
  websiteStatus,
  profileListPosition = 'right',
  users = [],
  onlineUsers = new Set(),
  onOpenProfile,
  onStartDM,
  currentUserId,
  onLogout,
  modernCustom,
  customTheme,
  onOpenCustomizer,
  notifications = [],
  onNotificationClick,
  onClearAllNotifications,
  onDeleteNotification,
  onMarkAllNotificationsAsRead,
  nicknames = {}
}) => {
  const [hoveredUser, setHoveredUser] = useState<UserProfile | null>(null);
  const [showFullFlyout, setShowFullFlyout] = useState(false);
  const [showNotificationsFlyout, setShowNotificationsFlyout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUnread = unreadCount > 0;

  const toggleNotifications = () => {
    setShowNotificationsFlyout(prev => {
      const next = !prev;
      if (next) setShowFullFlyout(false);
      return next;
    });
  };

  const toggleFullFlyout = () => {
    setShowFullFlyout(prev => {
      const next = !prev;
      if (next) setShowNotificationsFlyout(false);
      return next;
    });
  };

  const activeAccent = getAccentHex(modernCustom, customTheme);
  const sidebarPosition = modernCustom?.sidebar_position || 'left';
  const effectiveProfilePosition = profileListPosition;
  const glassClasses = modernCustom ? getGlassEffectClasses(modernCustom.glass_intensity) : 'bg-app-card/60 backdrop-blur-2xl border border-white/10 shadow-2xl';
  const radius = getRadiusValue(modernCustom?.card_radius, customTheme);

  const navItems = [
    { id: 'chat', Icon: AnimatedChatIcon, label: 'Chat' },
    { id: 'messages', Icon: AnimatedMailIcon, label: 'Berichten' },
    { id: 'forum', Icon: AnimatedForumIcon, label: 'Forum' },
    { id: 'media_feed', Icon: AnimatedMediaIcon, label: 'Media' },
    { id: 'news', Icon: AnimatedNewsIcon, label: 'Nieuws' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'arcade', Icon: AnimatedArcadeIcon, label: 'Arcade' });
  }

  const showSidebarProfiles = effectiveProfilePosition === 'sidebar' && sidebarPosition !== 'bottom_dock';
  const showOffline = modernCustom?.show_offline_users !== false;
  const filteredUsers = users.filter(u => !u.is_blocked && u.id !== currentUserId && !isTestUser(u));
  const onlineList = filteredUsers.filter(u => onlineUsers.has(u.id));
  const otherList = showOffline ? filteredUsers.filter(u => !onlineUsers.has(u.id)) : [];

  const flyoutFilteredOnline = onlineList.filter(u => 
    !searchQuery.trim() || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const flyoutFilteredOffline = otherList.filter(u => 
    !searchQuery.trim() || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNotificationsContent = () => (
    <>
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-app-accent/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AnimatedBellIcon hasUnread={hasUnread} isActive={true} className="w-5 h-5 text-app-ink" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-sm text-app-ink">Meldingen</h4>
            {notifications.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-app-accent text-app-muted border border-app-border/60">
                {notifications.length}
              </span>
            )}
            {hasUnread && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/25 animate-pulse">
                {unreadCount} nieuw
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasUnread && onMarkAllNotificationsAsRead && (
            <button 
              type="button"
              onClick={onMarkAllNotificationsAsRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer"
              title="Markeer alle meldingen als gelezen"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Gelezen</span>
            </button>
          )}
          {notifications.length > 0 && onClearAllNotifications && (
            <button 
              type="button"
              onClick={onClearAllNotifications}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Wis al je meldingen definitief"
            >
              <Trash2 className="w-3 h-3" />
              <span>Wissen</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNotificationsFlyout(false)}
            className="p-1 rounded-lg hover:bg-app-accent text-app-muted hover:text-app-ink transition-all cursor-pointer"
            title="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
        {notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-app-accent/50 flex items-center justify-center mb-2.5 text-app-muted/40">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-app-ink mb-0.5">Geen meldingen</p>
            <p className="text-[11px] text-app-muted font-medium">Je bent helemaal bij!</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isUnread = !notif.is_read;
            const actorDisplayName = (nicknames && nicknames[notif.actor_id]) || notif.actor_name || 'Iemand';
            
            let actionLabel = 'stuurde een melding';
            let typeBadge = <Bell className="w-2.5 h-2.5" />;
            let badgeBg = 'bg-app-accent text-app-muted';

            if (notif.type === 'mention') {
              actionLabel = 'heeft je genoemd';
              typeBadge = <AtSign className="w-2.5 h-2.5 text-violet-400" />;
              badgeBg = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
            } else if (notif.type === 'dm') {
              actionLabel = 'stuurde je een bericht';
              typeBadge = <Mail className="w-2.5 h-2.5 text-blue-400" />;
              badgeBg = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            } else if (notif.type === 'reply') {
              actionLabel = 'reageerde op je bericht';
              typeBadge = <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />;
              badgeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            } else if (notif.type === 'like') {
              actionLabel = 'vond je bericht leuk ❤️';
              typeBadge = <Heart className="w-2.5 h-2.5 text-rose-400" />;
              badgeBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            } else if (notif.type === 'comment') {
              actionLabel = 'heeft gereageerd 💬';
              typeBadge = <MessageSquare className="w-2.5 h-2.5 text-cyan-400" />;
              badgeBg = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
            } else if (notif.type === 'follow') {
              actionLabel = 'is je gaan volgen';
              typeBadge = <UserPlus className="w-2.5 h-2.5 text-emerald-400" />;
              badgeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            }

            return (
              <div
                key={notif.id}
                onClick={() => {
                  onNotificationClick?.(notif);
                  setShowNotificationsFlyout(false);
                }}
                className={`w-full p-3 text-left hover:bg-app-accent/40 transition-colors flex items-start gap-3 group relative cursor-pointer select-none ${
                  isUnread ? 'bg-red-500/[0.04] border-l-2 border-red-500' : ''
                }`}
              >
                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-app-accent flex-shrink-0 mt-0.5 border border-white/10">
                  {notif.actor_photo?.trim() ? (
                    <img 
                      src={getSafeImageUrl(notif.actor_photo)} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-app-muted">
                      {actorDisplayName[0] || 'M'}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${badgeBg}`}>
                    {typeBadge}
                  </span>
                </div>

                <div className="min-w-0 flex-1 pr-6">
                  <p className="text-xs text-app-ink font-medium leading-snug">
                    <span className="font-bold">{actorDisplayName}</span>{' '}
                    <span className="text-app-muted">{actionLabel}</span>
                  </p>
                  {notif.content && (
                    <p className="text-[10px] text-app-muted truncate mt-0.5 italic">
                      "{notif.content}"
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-app-muted/70 uppercase font-bold tracking-widest">
                      {formatDate(notif.created_at)}
                    </span>
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                </div>

                {onDeleteNotification && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(e, notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 text-app-muted hover:text-red-500 rounded-lg absolute right-2.5 top-2.5 cursor-pointer"
                    title="Melding verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );

  // FLOATING BOTTOM DOCK MODE
  if (sidebarPosition === 'bottom_dock') {
    return (
      <>
        <div 
          className={`hidden sm:flex fixed bottom-5 left-1/2 -translate-x-1/2 h-18 px-5 py-2 flex-row items-center gap-3 z-[100] transition-all duration-300 ${glassClasses}`}
          style={{ borderRadius: radius }}
        >
          {/* Logo with Unread / Missed Notification Badge */}
          <div className="relative shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={toggleNotifications}
              className={`w-10 h-10 bg-app-accent/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative border transition-all duration-300 cursor-pointer ${
                showNotificationsFlyout 
                  ? 'ring-2 ring-app-ink/40 border-app-ink/50 shadow-md' 
                  : hasUnread 
                    ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.35)] ring-2 ring-red-500/25 hover:border-red-500' 
                    : 'border-app-border/40 hover:border-app-border'
              }`}
              title={hasUnread ? `${unreadCount} ongelezen melding(en) • Klik om te bekijken` : 'Meldingen bekijken'}
            >
              <Logo className="w-full h-full object-cover rounded-xl p-0.5" fallbackTextSize="text-[9px] font-black tracking-tighter" />
            </motion.button>

            {/* Red notification indicator badge at the logo */}
            {hasUnread && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center pointer-events-none z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-black text-white bg-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.7)] border-2 border-app-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </div>

          <div className="h-7 w-px bg-white/10 shrink-0" />

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-app-ink text-app-bg shadow-lg scale-110' 
                      : 'text-app-muted hover:bg-app-accent hover:text-app-ink hover:scale-105'
                  }`}
                  title={t(item.label)}
                  style={isActive && modernCustom?.glow_active_items ? {
                    boxShadow: `0 0 16px ${activeAccent}80`,
                    backgroundColor: activeAccent,
                    color: '#ffffff'
                  } : undefined}
                >
                  <item.Icon isActive={isActive} className="w-5 h-5" />
                  {isActive && (
                    <motion.div 
                      layoutId="modern-dock-active" 
                      className="absolute inset-0 border-2 rounded-2xl" 
                      style={{ borderColor: activeAccent }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-7 w-px bg-white/10 shrink-0" />

          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setView('settings')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                view === 'settings' 
                  ? 'bg-app-ink text-app-bg shadow-md' 
                  : 'text-app-muted hover:bg-app-accent hover:text-app-ink'
              }`}
              title="Instellingen"
            >
              <Settings className="w-4 h-4" />
            </motion.button>

            {onLogout && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={onLogout}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Notifications Flyout for Bottom Dock */}
        <AnimatePresence>
          {showNotificationsFlyout && (
            <>
              <div 
                className="fixed inset-0 z-[155]" 
                onClick={() => setShowNotificationsFlyout(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 w-80 sm:w-96 max-h-[min(560px,calc(100vh-8rem))] bg-app-card/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl z-[160] flex flex-col overflow-hidden pointer-events-auto text-left"
              >
                {renderNotificationsContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // VERTICAL SIDEBAR POSITIONING CLASSES
  const isRight = sidebarPosition === 'right';
  const isCompact = sidebarPosition === 'compact';
  const sidebarPosClasses = isRight
    ? 'right-4 top-4 bottom-4'
    : 'left-4 top-4 bottom-4';

  const sidebarWidthClass = isCompact ? 'w-16 py-4' : 'w-20 py-6';

  return (
    <>
      <div 
        className={`hidden sm:flex fixed ${sidebarPosClasses} ${sidebarWidthClass} flex-col items-center z-[100] transition-all duration-300 ${glassClasses}`}
        style={{ borderRadius: radius }}
      >
        {/* Logo with Unread / Missed Notification Badge */}
        <div className={`relative ${isCompact ? 'mb-4' : 'mb-6'} shrink-0`}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={toggleNotifications}
            className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} bg-app-accent/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative border transition-all duration-300 cursor-pointer ${
              showNotificationsFlyout 
                ? 'ring-2 ring-app-ink/40 border-app-ink/50 shadow-md' 
                : hasUnread 
                  ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.35)] ring-2 ring-red-500/25 hover:border-red-500' 
                  : 'border-app-border/40 hover:border-app-border'
            }`}
            title={hasUnread ? `${unreadCount} ongelezen melding(en) • Klik om te bekijken` : 'Meldingen bekijken'}
          >
            <Logo className="w-full h-full object-cover rounded-xl p-0.5" fallbackTextSize="text-[10px] font-black tracking-tighter" />
          </motion.button>

          {/* Red notification indicator badge at the logo */}
          {hasUnread && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center pointer-events-none z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-black text-white bg-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.7)] border-2 border-app-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </div>

        {/* Navigation Icons */}
      <div className="w-full flex flex-col items-center gap-3 shrink-0">
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`group relative ${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? 'bg-app-ink text-app-bg shadow-lg scale-110' 
                  : 'text-app-muted hover:bg-app-accent hover:text-app-ink hover:scale-105'
              }`}
              title={t(item.label)}
              style={isActive && modernCustom?.glow_active_items ? {
                boxShadow: `0 0 16px ${activeAccent}80`,
                backgroundColor: activeAccent,
                color: '#ffffff'
              } : undefined}
            >
              <item.Icon isActive={isActive} className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
              {isActive && (
                <motion.div 
                  layoutId="modern-sidebar-active" 
                  className="absolute inset-0 border-2 rounded-2xl" 
                  style={{ borderColor: activeAccent }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Embedded Profile List in Sidebar (When profile_list_position === 'sidebar') */}
      {showSidebarProfiles && (
        <div className="w-full flex-1 flex flex-col items-center min-h-0 my-3 pt-3 border-t border-white/10 relative">
          {/* Header button to open full side flyout */}
          <button
            type="button"
            onClick={() => setShowFullFlyout(!showFullFlyout)}
            className="flex flex-col items-center gap-0.5 mb-2 px-1 py-1 rounded-xl hover:bg-app-accent/60 transition-all text-center group/btn"
            title={`${onlineList.length} Online, ${otherList.length} Offline (Klik om lijst te openen)`}
          >
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineList.length}</span>
              <span className="text-app-muted font-normal">/</span>
              <span className="text-app-muted">{filteredUsers.length}</span>
            </div>
            <span className="text-[7.5px] font-bold text-app-muted tracking-tight group-hover/btn:text-app-ink">Leden</span>
          </button>

          {/* User Avatars Column */}
          <div className="w-full flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-2 px-2">
            {/* Online Members List */}
            {onlineList.map(u => (
              <div
                key={u.id}
                className="relative group/avatar"
                onMouseEnter={() => setHoveredUser(u)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                <button
                  onClick={() => onOpenProfile?.(u.id)}
                  className="relative w-9 h-9 rounded-xl overflow-hidden bg-app-accent border border-emerald-500/30 hover:scale-110 hover:ring-2 hover:ring-emerald-500/50 transition-all flex items-center justify-center shrink-0"
                  title={`${u.display_name} (Online)`}
                >
                  {u.photo_url?.trim() ? (
                    <img 
                      src={getSafeImageUrl(u.photo_url)} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={handleImageError}
                    />
                  ) : (
                    <LetterAvatar name={u.display_name} className="w-full h-full" />
                  )}
                  {/* Glowing Green Online Status Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-app-card shadow-sm animate-pulse" />
                </button>

                {/* Hover Card */}
                <AnimatePresence>
                  {hoveredUser?.id === u.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -5, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -5, scale: 0.95 }}
                      className="absolute left-14 top-1/2 -translate-y-1/2 z-[150] w-52 p-3 bg-app-card/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl pointer-events-auto"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-app-accent shrink-0 border border-white/10">
                          {u.photo_url?.trim() ? (
                            <img 
                              src={getSafeImageUrl(u.photo_url)} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                              onError={handleImageError}
                            />
                          ) : (
                            <LetterAvatar name={u.display_name} className="w-full h-full" />
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-app-card animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-app-ink truncate">{u.display_name}</p>
                            <VerifiedBadge user={u} size="xs" />
                            <DeveloperBadge user={u} size="xs" />
                            {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />}
                          </div>
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            onStartDM?.(u);
                            setHoveredUser(null);
                          }}
                          className="flex-1 py-1.5 px-2 bg-app-ink text-app-bg rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-all shadow-sm"
                        >
                          <Mail className="w-3 h-3" />
                          DM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProfile?.(u.id);
                            setHoveredUser(null);
                          }}
                          className="py-1.5 px-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-lg text-[10px] font-bold transition-all border border-app-border"
                        >
                          Profiel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Subtle Divider if there are offline users */}
            {otherList.length > 0 && (
              <div className="w-5 h-px bg-white/10 my-1 shrink-0" />
            )}

            {/* Offline Members List */}
            {otherList.map(u => (
              <div
                key={u.id}
                className="relative group/avatar"
                onMouseEnter={() => setHoveredUser(u)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                <button
                  onClick={() => onOpenProfile?.(u.id)}
                  className="relative w-9 h-9 rounded-xl overflow-hidden bg-app-accent/60 border border-white/5 opacity-65 group-hover/avatar:opacity-100 hover:scale-110 hover:ring-2 hover:ring-app-muted/30 transition-all flex items-center justify-center shrink-0"
                  title={`${u.display_name} (Offline)`}
                >
                  {u.photo_url?.trim() ? (
                    <img 
                      src={getSafeImageUrl(u.photo_url)} 
                      alt="" 
                      className="w-full h-full object-cover grayscale-[30%]" 
                      referrerPolicy="no-referrer" 
                      onError={handleImageError}
                    />
                  ) : (
                    <LetterAvatar name={u.display_name} className="w-full h-full" />
                  )}
                  {/* Subtle Gray Offline Status Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-600 rounded-full ring-2 ring-app-card" />
                </button>

                {/* Hover Card */}
                <AnimatePresence>
                  {hoveredUser?.id === u.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -5, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -5, scale: 0.95 }}
                      className="absolute left-14 top-1/2 -translate-y-1/2 z-[150] w-52 p-3 bg-app-card/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl pointer-events-auto"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-app-accent shrink-0 border border-white/10 opacity-75">
                          {u.photo_url?.trim() ? (
                            <img 
                              src={getSafeImageUrl(u.photo_url)} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                              onError={handleImageError}
                            />
                          ) : (
                            <LetterAvatar name={u.display_name} className="w-full h-full" />
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-600 rounded-full ring-2 ring-app-card" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-app-ink truncate">{u.display_name}</p>
                            <VerifiedBadge user={u} size="xs" />
                            <DeveloperBadge user={u} size="xs" />
                            {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />}
                          </div>
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-zinc-500/10 text-app-muted text-[10px] font-bold border border-zinc-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                            <span>Offline</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            onStartDM?.(u);
                            setHoveredUser(null);
                          }}
                          className="flex-1 py-1.5 px-2 bg-app-ink text-app-bg rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-all shadow-sm"
                        >
                          <Mail className="w-3 h-3" />
                          DM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProfile?.(u.id);
                            setHoveredUser(null);
                          }}
                          className="py-1.5 px-3 bg-app-accent hover:bg-app-accent/80 text-app-ink rounded-lg text-[10px] font-bold transition-all border border-app-border"
                        >
                          Profiel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Full Flyout Drawer (Optional Expanded View) */}
          <AnimatePresence>
            {showFullFlyout && (
              <>
                <div 
                  className="fixed inset-0 z-[130]" 
                  onClick={() => setShowFullFlyout(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, x: -15, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -15, scale: 0.98 }}
                  className="fixed left-28 top-4 bottom-4 w-72 bg-app-card/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl z-[140] flex flex-col p-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-app-border/40">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-extrabold text-sm text-app-ink">Ledenlijst</h3>
                    </div>
                    <button
                      onClick={() => setShowFullFlyout(false)}
                      className="p-1 rounded-lg hover:bg-app-accent text-app-muted hover:text-app-ink transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative my-3">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Zoek lid..."
                      className="w-full pl-8 pr-3 py-1.5 bg-app-accent/50 border border-app-border rounded-xl text-xs text-app-ink placeholder-app-muted/60 focus:outline-none focus:ring-2 focus:ring-app-ink/30"
                    />
                  </div>

                  {/* Flyout List */}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                    {/* Online Section */}
                    {flyoutFilteredOnline.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                          <span>{flyoutFilteredOnline.length}</span>
                        </div>
                        <div className="space-y-1">
                          {flyoutFilteredOnline.map(u => (
                            <div
                              key={u.id}
                              onClick={() => {
                                onOpenProfile?.(u.id);
                                setShowFullFlyout(false);
                              }}
                              className="group flex items-center justify-between p-2 rounded-2xl hover:bg-app-accent/70 transition-all cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-app-accent border border-white/10 shrink-0">
                                  {u.photo_url?.trim() ? (
                                    <img 
                                      src={getSafeImageUrl(u.photo_url)} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                      onError={handleImageError}
                                    />
                                  ) : (
                                    <LetterAvatar name={u.display_name} className="w-full h-full" />
                                  )}
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-app-card animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-app-ink truncate">{u.display_name}</span>
                                    <VerifiedBadge user={u} size="xs" />
                                    <DeveloperBadge user={u} size="xs" />
                                    {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />}
                                  </div>
                                  <span className="text-[10px] text-emerald-500 font-medium">Online</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartDM?.(u);
                                  setShowFullFlyout(false);
                                }}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-app-card text-app-ink transition-all"
                                title="Stuur DM"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offline Section */}
                    {flyoutFilteredOffline.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-app-muted">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                            Offline
                          </span>
                          <span>{flyoutFilteredOffline.length}</span>
                        </div>
                        <div className="space-y-1">
                          {flyoutFilteredOffline.map(u => (
                            <div
                              key={u.id}
                              onClick={() => {
                                onOpenProfile?.(u.id);
                                setShowFullFlyout(false);
                              }}
                              className="group flex items-center justify-between p-2 rounded-2xl hover:bg-app-accent/70 transition-all cursor-pointer select-none opacity-70 hover:opacity-100"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-app-accent border border-white/10 shrink-0">
                                  {u.photo_url?.trim() ? (
                                    <img 
                                      src={getSafeImageUrl(u.photo_url)} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                      onError={handleImageError}
                                    />
                                  ) : (
                                    <LetterAvatar name={u.display_name} className="w-full h-full" />
                                  )}
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full ring-2 ring-app-card" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-app-ink truncate">{u.display_name}</span>
                                    <VerifiedBadge user={u} size="xs" />
                                    <DeveloperBadge user={u} size="xs" />
                                    {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />}
                                  </div>
                                  <span className="text-[10px] text-app-muted font-medium">Offline</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartDM?.(u);
                                  setShowFullFlyout(false);
                                }}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-app-card text-app-ink transition-all"
                                title="Stuur DM"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`mt-auto flex flex-col items-center gap-2.5 shrink-0 pt-2 border-t border-white/10 w-full ${isCompact ? 'px-1' : 'px-2'}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${websiteStatus.toLowerCase() === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} title={websiteStatus} />
        
        <motion.button
          id="modern-sidebar-settings-btn"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => setView('settings')}
          className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl flex items-center justify-center transition-colors duration-300 ${
            view === 'settings' 
              ? 'bg-app-ink text-app-bg shadow-lg' 
              : 'text-app-muted hover:bg-app-accent hover:text-app-ink'
          }`}
          title="Instellingen"
        >
          <Settings className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
        </motion.button>

        {onLogout && (
          <motion.button
            id="modern-sidebar-logout-btn"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onLogout}
            className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl flex items-center justify-center text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors duration-300`}
            title="Uitloggen"
          >
            <LogOut className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </motion.button>
        )}
      </div>
    </div>

    {/* Notifications Flyout for Vertical Sidebar */}
    <AnimatePresence>
      {showNotificationsFlyout && (
        <>
          <div 
            className="fixed inset-0 z-[155]" 
            onClick={() => setShowNotificationsFlyout(false)} 
          />
          <motion.div
            initial={isRight ? { opacity: 0, x: 20, scale: 0.95 } : { opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={isRight ? { opacity: 0, x: 20, scale: 0.95 } : { opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={`fixed ${isRight ? (isCompact ? 'right-20' : 'right-24') : (isCompact ? 'left-20' : 'left-24')} top-4 w-80 sm:w-96 max-h-[min(650px,calc(100vh-2rem))] bg-app-card/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl z-[160] flex flex-col overflow-hidden pointer-events-auto text-left`}
          >
            {renderNotificationsContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
  );
};

export const ModernMobileNav: React.FC<{ 
  view: string; 
  setView: (view: any) => void; 
  setMobileChatView?: (view: any) => void;
  onLogout?: () => void;
  onOpenCustomizer?: () => void;
  modernCustom?: ModernUICustomization;
  customTheme?: CustomTheme;
}> = ({ view, setView, setMobileChatView, onLogout, onOpenCustomizer, modernCustom, customTheme }) => {
  const activeAccent = getAccentHex(modernCustom, customTheme);
  const radius = getRadiusValue(modernCustom?.card_radius, customTheme);

  return (
    <div 
      className="sm:hidden fixed bottom-6 left-4 right-4 h-16 bg-app-card/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] z-[100] flex items-center justify-around px-3"
      style={{ borderRadius: radius }}
    >
      <button 
        onClick={() => setView('chat')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'chat' ? 'scale-125 -translate-y-2' : 'text-app-muted hover:text-app-ink'}`}
        style={view === 'chat' ? { color: activeAccent } : undefined}
        title="Chat"
      >
        <AnimatedChatIcon isActive={view === 'chat'} className="w-5 h-5" />
      </button>
      <button 
        onClick={() => { setView('messages'); setMobileChatView?.('list'); }}
        className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'messages' ? 'scale-125 -translate-y-2' : 'text-app-muted hover:text-app-ink'}`}
        style={view === 'messages' ? { color: activeAccent } : undefined}
        title="Berichten"
      >
        <AnimatedMailIcon isActive={view === 'messages'} className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setView('forum')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ${view === 'forum' ? 'scale-125 -translate-y-2' : 'text-app-muted hover:text-app-ink'}`}
        style={view === 'forum' ? { color: activeAccent } : undefined}
        title="Forum"
      >
        <AnimatedForumIcon isActive={view === 'forum'} className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setView('media_feed')}
        className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${view === 'media_feed' ? 'scale-125 -translate-y-2' : 'text-app-muted hover:text-app-ink'}`}
        style={view === 'media_feed' ? { color: activeAccent } : undefined}
        title="Media"
      >
        <AnimatedMediaIcon isActive={view === 'media_feed'} className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setView('settings')}
        className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${view === 'settings' ? 'scale-125 -translate-y-2' : 'text-app-muted hover:text-app-ink'}`}
        style={view === 'settings' ? { color: activeAccent } : undefined}
        title="Instellingen"
      >
        <AnimatedMenuIcon isActive={view === 'settings'} className="w-5 h-5" />
      </button>
      {onLogout && (
        <button 
          onClick={onLogout}
          className="flex flex-col items-center justify-center text-app-muted hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-300"
          title="Uitloggen"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
