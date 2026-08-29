import React from 'react';
import { Mail, Plus, User as UserIcon, PanelLeft, PanelRight, LayoutList, Users, LogOut, Sliders } from 'lucide-react';
import { Conversation, UserProfile, CustomTheme, User, ModernUICustomization } from '../types';
import { getAccentHex, getGlassEffectClasses, getRadiusValue } from '../utils/modernUICustom';
import { hexToRgba } from '../utils/helpers';

interface ModernTopDMBarProps {
  user: User;
  profile: UserProfile | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewDM: () => void;
  users: UserProfile[];
  onlineUsers: Set<string>;
  profileListPosition: 'left' | 'right' | 'sidebar' | 'hidden';
  onChangeProfileListPosition: (pos: 'left' | 'right' | 'sidebar' | 'hidden') => void;
  onOpenOwnProfile: () => void;
  onLogout?: () => void;
  websiteStatus: string;
  useCustomTheme: boolean;
  customTheme: CustomTheme;
  modernCustom?: ModernUICustomization;
  onOpenCustomizer?: () => void;
}

export const ModernTopDMBar: React.FC<ModernTopDMBarProps> = React.memo(({
  user,
  profile,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewDM,
  users,
  onlineUsers,
  profileListPosition,
  onChangeProfileListPosition,
  onOpenOwnProfile,
  onLogout,
  websiteStatus,
  useCustomTheme,
  customTheme,
  modernCustom,
  onOpenCustomizer
}) => {
  const getParticipantInfo = (conv: Conversation) => {
    if (conv.is_group) {
      return {
        name: conv.name || 'Groepsgesprek',
        photo: null,
        isOnline: false,
        isGroup: true
      };
    }
    const otherUid = conv.participants?.find(uid => uid !== user?.uid);
    if (!otherUid) return { name: 'Gesprek', photo: null, isOnline: false, isGroup: false };

    const foundProfile = users.find(u => u.id === otherUid);
    const photo = foundProfile?.photo_url || (conv.participant_photos ? conv.participant_photos[otherUid] : null) || null;
    const name = foundProfile?.display_name || (conv.participant_names ? conv.participant_names[otherUid] : null) || 'Gebruiker';
    const isOnline = onlineUsers.has(otherUid);

    return { name, photo, isOnline, isGroup: false };
  };

  const onlineCount = onlineUsers.size;
  const activeAccent = modernCustom ? getAccentHex(modernCustom) : '#06b6d4';
  const sidebarPos = modernCustom?.sidebar_position || 'left';
  const glassClasses = modernCustom ? getGlassEffectClasses(modernCustom.glass_intensity) : 'bg-app-card/80 backdrop-blur-2xl border border-white/10 shadow-xl';
  const radius = modernCustom ? getRadiusValue(modernCustom.card_radius) : '1rem';

  const leftMarginClass = sidebarPos === 'left' 
    ? 'sm:left-28' 
    : sidebarPos === 'compact'
    ? 'sm:left-22'
    : 'sm:left-6';

  const rightMarginClass = sidebarPos === 'right'
    ? 'sm:right-28'
    : 'right-4 sm:right-6';

  return (
    <header
      className={`fixed top-3 left-4 ${leftMarginClass} ${rightMarginClass} h-11 z-[95] flex items-center justify-between gap-2 px-3 transition-all duration-300 ${glassClasses} ${
        useCustomTheme && customTheme.glass_effect ? 'custom-glass' : ''
      }`}
      style={{
        borderRadius: radius,
        ...(useCustomTheme && !customTheme.glass_effect && customTheme.card_bg_color ? {
          backgroundColor: hexToRgba(customTheme.card_bg_color, 0.8),
          borderColor: hexToRgba(customTheme.card_bg_color, 0.2)
        } : {})
      }}
    >
      {/* Left: Super Slim DM Header & New Message Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-app-accent/60 rounded-xl text-app-ink">
          <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: activeAccent }} />
          <span className="text-[11px] font-black uppercase tracking-wider hidden md:inline">DM's</span>
        </div>

        <button
          type="button"
          onClick={onNewDM}
          className="h-7 px-2 bg-app-ink text-app-bg hover:opacity-90 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
          title="Nieuw direct bericht starten"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
          <span className="hidden sm:inline">Nieuw</span>
        </button>
      </div>

      {/* Center: Super Slim Horizontal Conversations Carousel */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 mask-fade-edges">
        {conversations.length === 0 ? (
          <div className="text-[11px] text-app-muted italic truncate px-2 flex items-center gap-1.5 opacity-70">
            <span>Geen actieve DM's — klik op</span>
            <button onClick={onNewDM} className="font-bold hover:underline not-italic" style={{ color: activeAccent }}>
              + Nieuw
            </button>
            <span>om een chat te starten</span>
          </div>
        ) : (
          conversations.map((conv) => {
            const info = getParticipantInfo(conv);
            const isActive = activeConversation?.id === conv.id;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv)}
                className={`group relative h-7.5 pl-1.5 pr-2.5 rounded-xl flex items-center gap-1.5 shrink-0 transition-all text-left text-xs font-semibold select-none ${
                  isActive
                    ? 'bg-app-ink text-app-bg shadow-sm ring-1 ring-app-ink'
                    : 'bg-app-accent/40 text-app-muted hover:bg-app-accent hover:text-app-ink hover:scale-[1.02]'
                }`}
                title={`Gesprek met ${info.name}`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 bg-app-card border border-white/10 flex items-center justify-center">
                  {info.photo?.trim() ? (
                    <img
                      src={info.photo}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-3 h-3 text-app-muted" />
                  )}
                  {info.isOnline && (
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-app-card animate-pulse" />
                  )}
                </div>

                <span className="truncate max-w-[90px] sm:max-w-[120px] text-[11px]">
                  {info.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Right: Profile List Position Selector + Online Count + Customizer + Own Profile */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Profile List Position Toggle */}
        <div
          className="flex items-center bg-app-accent/60 p-0.5 rounded-xl border border-white/5"
          title="Profielenlijst Weergave & Positie"
        >
          <button
            type="button"
            onClick={() => onChangeProfileListPosition('left')}
            className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              profileListPosition === 'left'
                ? 'bg-app-ink text-app-bg shadow-sm'
                : 'text-app-muted hover:text-app-ink'
            }`}
            title="Profielenlijst Links tonen"
          >
            <PanelLeft className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Links</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeProfileListPosition('sidebar')}
            className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              profileListPosition === 'sidebar'
                ? 'bg-app-ink text-app-bg shadow-sm'
                : 'text-app-muted hover:text-app-ink'
            }`}
            title="Profielen in Sidebar integreren"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">In Sidebar</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeProfileListPosition('right')}
            className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              profileListPosition === 'right'
                ? 'bg-app-ink text-app-bg shadow-sm'
                : 'text-app-muted hover:text-app-ink'
            }`}
            title="Profielenlijst Rechts tonen"
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Rechts</span>
          </button>
        </div>

        {/* Online Status Pill */}
        <div
          className="hidden md:flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-500"
          title={`${onlineCount} gebruikers nu online`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{onlineCount}</span>
        </div>

        {/* Own Profile Avatar Button */}
        <button
          type="button"
          onClick={onOpenOwnProfile}
          className="relative w-7 h-7 rounded-xl overflow-hidden bg-app-accent border border-white/10 hover:ring-2 hover:ring-app-ink/30 transition-all shrink-0"
          title={`Mijn Profiel: ${profile?.display_name || user.displayName || 'Anoniem'}`}
        >
          {(profile?.photo_url?.trim() || user.photoURL?.trim()) ? (
            <img
              src={profile?.photo_url || user.photoURL || undefined}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-app-muted" />
            </div>
          )}
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
            title="Uitloggen"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
});
