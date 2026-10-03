import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Shield, 
  Zap, 
  Clock, 
  Calendar, 
  SlidersHorizontal, 
  X, 
  Flame, 
  Rocket, 
  Heart, 
  Smile, 
  Gamepad2, 
  ChevronRight, 
  RotateCcw,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  Layers,
  ArrowUpRight,
  BookOpen,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { NEWS_ITEMS, APP_VERSION } from '../constants';
import type { NewsItem } from '../types';
import { t } from '../utils/translations';
import { UpdateModal } from './UpdateModal';

interface NewsViewProps {
  onNavigateToView?: (view: 'chat' | 'forum' | 'messages' | 'settings' | 'news' | 'audiologs' | 'arcade' | 'media_feed') => void;
  hasSeenNews?: boolean;
  onMarkAllAsRead?: () => void;
}

type FilterCategory = 'all' | 'major' | 'security' | 'platform' | 'legal' | 'bookmarked';
type SortOrder = 'newest' | 'oldest';

const DEFAULT_REACTIONS: Record<string, number> = {
  rocket: 12,
  fire: 18,
  heart: 9,
  sparkle: 14
};

export const NewsView: React.FC<NewsViewProps> = ({ 
  onNavigateToView, 
  hasSeenNews = false,
  onMarkAllAsRead 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Bookmarks persistence
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ftjm_bookmarked_news');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Read items persistence
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ftjm_read_news_ids');
      if (saved) return JSON.parse(saved);
      // Default: mark older items as read, latest as unread if hasSeenNews is false
      return hasSeenNews ? NEWS_ITEMS.map(n => n.id) : NEWS_ITEMS.slice(2).map(n => n.id);
    } catch {
      return [];
    }
  });

  // Reactions persistence
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('ftjm_news_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [userReactions, setUserReactions] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('ftjm_user_news_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Keep localStorage synced
  useEffect(() => {
    try {
      localStorage.setItem('ftjm_bookmarked_news', JSON.stringify(bookmarks));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('ftjm_read_news_ids', JSON.stringify(readIds));
    } catch (e) {
      console.error(e);
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem('ftjm_news_reactions', JSON.stringify(reactions));
    } catch (e) {
      console.error(e);
    }
  }, [reactions]);

  useEffect(() => {
    try {
      localStorage.setItem('ftjm_user_news_reactions', JSON.stringify(userReactions));
    } catch (e) {
      console.error(e);
    }
  }, [userReactions]);

  // Handle URL hash on mount or change
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#news-')) {
      const id = parseInt(hash.replace('#news-', ''), 10);
      const found = NEWS_ITEMS.find(item => item.id === id);
      if (found) {
        setSelectedArticle(found);
        markAsRead(found.id);
      }
    }
  }, []);

  const markAsRead = useCallback((id: number) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const handleMarkAllAsRead = () => {
    const allIds = NEWS_ITEMS.map(n => n.id);
    setReadIds(allIds);
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
    toast.success(t("Alle updates gemarkeerd als gelezen"));
  };

  const toggleBookmark = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarks(prev => {
      const isBookmarked = prev.includes(id);
      if (isBookmarked) {
        toast.info(t("Artikel verwijderd uit opgeslagen"));
        return prev.filter(bId => bId !== id);
      } else {
        toast.success(t("Artikel opgeslagen!"));
        return [...prev, id];
      }
    });
  };

  const handleShare = async (item: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#news-${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} - FTJM Platform Update`,
          url: shareUrl
        });
        toast.success(t("Succesvol gedeeld"));
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("Directe link gekopieerd naar klembord!"));
    } catch {
      toast.error(t("Kon link niet kopiëren"));
    }
  };

  const handleReaction = (itemId: number, type: 'rocket' | 'fire' | 'heart' | 'sparkle', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentReaction = userReactions[itemId];
    
    setReactions(prev => {
      const itemReactions = prev[itemId] || { ...DEFAULT_REACTIONS };
      const newCounts = { ...itemReactions };

      if (currentReaction === type) {
        // Toggle off
        newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1);
      } else {
        // Toggle new on, remove old if exists
        if (currentReaction) {
          newCounts[currentReaction] = Math.max(0, (newCounts[currentReaction] || 0) - 1);
        }
        newCounts[type] = (newCounts[type] || 0) + 1;
      }
      return { ...prev, [itemId]: newCounts };
    });

    setUserReactions(prev => {
      if (currentReaction === type) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: type };
    });

    toast.success(t("Reactie geregistreerd!"));
  };

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return NEWS_ITEMS.filter(item => {
      // Category match
      if (category === 'bookmarked') {
        if (!bookmarks.includes(item.id)) return false;
      } else if (category === 'major') {
        if (item.category !== 'Grote Update') return false;
      } else if (category === 'security') {
        if (item.category !== 'Beveiliging' && item.category !== 'Zwaarbeveiligd') return false;
      } else if (category === 'platform') {
        if (item.category !== 'Platform & UI' && item.category !== 'Update') return false;
      } else if (category === 'legal') {
        if (item.category !== 'Regels & Beleid' && item.category !== 'Aankondiging' && item.category !== 'Juridisch') return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inContent = item.content.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inVersion = item.version?.toLowerCase().includes(q) ?? false;
        const inHighlights = item.highlights?.some(h => h.toLowerCase().includes(q)) ?? false;
        return inTitle || inContent || inCategory || inVersion || inHighlights;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.id - a.id;
      } else {
        return a.id - b.id;
      }
    });
  }, [searchQuery, category, sortOrder, bookmarks]);

  // Unread count
  const unreadCount = useMemo(() => {
    return NEWS_ITEMS.filter(n => !readIds.includes(n.id)).length;
  }, [readIds]);

  // Lead Featured Story (usually the latest flagship or top matched item)
  const leadStory = useMemo(() => {
    if (category !== 'all' || searchQuery.trim()) {
      return filteredItems[0] || null;
    }
    return NEWS_ITEMS[0]; // v2.7.0
  }, [filteredItems, category, searchQuery]);

  // Secondary stories (rank 2 to 4)
  const secondaryStories = useMemo(() => {
    if (!leadStory) return [];
    return filteredItems.filter(item => item.id !== leadStory.id).slice(0, 4);
  }, [filteredItems, leadStory]);

  // Archive & Department stories (remaining items)
  const archiveStories = useMemo(() => {
    if (!leadStory) return [];
    const leadAndSecondaryIds = new Set([leadStory.id, ...secondaryStories.map(s => s.id)]);
    return filteredItems.filter(item => !leadAndSecondaryIds.has(item.id));
  }, [filteredItems, leadStory, secondaryStories]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
      
      {/* Top Header & Operational Strip */}
      <header className="mb-8 border-b border-app-border pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-app-muted mb-1">
              <span>FTJM Newsroom</span>
              <span aria-hidden="true">·</span>
              <span>Changelog & Updates</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-app-ink">{APP_VERSION}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-app-ink">
              {t("Laatste Nieuws & Platform Updates")}
            </h1>
            <p className="text-sm text-app-muted mt-1 max-w-2xl">
              {t("Officiële updates, beveiligingsrapportages, changelogs en community aankondigingen.")}
            </p>
          </div>

          {/* Operational Status & Action Ribbon */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowReleaseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors border border-cyan-500/30 cursor-pointer shadow-sm"
              title={`Bekijk de ${APP_VERSION} Release Notes & Changelog`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span>Release Notes {APP_VERSION}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-app-ink bg-app-accent hover:bg-app-accent/80 rounded-lg transition-colors border border-app-border cursor-pointer"
                title="Markeer alle items als gelezen"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Markeer alles als gelezen ({unreadCount})</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs text-app-muted bg-app-card px-3 py-1.5 rounded-lg border border-app-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform 100% Operationeel</span>
            </div>

            {onNavigateToView && (
              <button
                type="button"
                onClick={() => onNavigateToView('forum')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-app-muted hover:text-app-ink transition-colors cursor-pointer"
              >
                <span>Feedback geven</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3">
          
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-app-accent/50 rounded-xl overflow-x-auto custom-scrollbar text-xs font-medium border border-app-border shrink-0">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                category === 'all' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {t("Alle Updates")}
            </button>
            <button
              type="button"
              onClick={() => setCategory('major')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                category === 'major' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {t("Grote Updates")}
            </button>
            <button
              type="button"
              onClick={() => setCategory('security')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                category === 'security' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {t("Beveiliging")}
            </button>
            <button
              type="button"
              onClick={() => setCategory('platform')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                category === 'platform' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {t("Platform & UI")}
            </button>
            <button
              type="button"
              onClick={() => setCategory('legal')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                category === 'legal' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {t("Regels & Beleid")}
            </button>
            <button
              type="button"
              onClick={() => setCategory('bookmarked')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                category === 'bookmarked' 
                  ? 'bg-app-card text-app-ink shadow-sm font-semibold' 
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Opgeslagen ({bookmarks.length})</span>
            </button>
          </div>

          {/* Search & Sort Input Controls */}
          <div className="flex items-center gap-2 grow lg:max-w-md justify-end">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-app-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Zoek op trefwoord, versie, fix...")}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-app-card border border-app-border rounded-xl text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-ink transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-ink p-0.5 cursor-pointer"
                  title="Wissen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-1.5 text-xs font-medium text-app-muted hover:text-app-ink bg-app-card border border-app-border rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              title="Sorteer volgorde omdraaien"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Nieuwste' : 'Oudste'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-app-card rounded-2xl border border-app-border p-8">
          <BookOpen className="w-12 h-12 text-app-muted/50 mb-3" />
          <h3 className="text-base font-semibold text-app-ink mb-1">{t("Geen nieuwsberichten gevonden")}</h3>
          <p className="text-xs text-app-muted max-w-sm mb-4">
            {searchQuery 
              ? `Er zijn geen resultaten gevonden voor "${searchQuery}". Probeer een andere zoekterm.`
              : `Er zijn momenteel geen artikelen in deze categorie.`}
          </p>
          {(searchQuery || category !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-app-ink bg-app-accent hover:bg-app-accent/80 rounded-xl transition-colors cursor-pointer"
            >
              {t("Herstel alle filters")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* TIER 1: FLAGSHIP LEAD MARQUEE STORY */}
          {leadStory && (
            <section aria-label="Lead Story">
              <div 
                onClick={() => {
                  setSelectedArticle(leadStory);
                  markAsRead(leadStory.id);
                }}
                className="group relative overflow-hidden rounded-3xl bg-app-card border border-app-border shadow-sm hover:shadow-md transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Visual Area */}
                <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[380px] bg-slate-900 overflow-hidden">
                  {leadStory.image ? (
                    <img 
                      src={leadStory.image} 
                      alt={leadStory.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        // Fallback container
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* Subtle Scrim for Depth */}
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />
                  
                  {/* Status Overlay Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white bg-black/60 backdrop-blur-md rounded-md border border-white/10 uppercase">
                      Uitgelicht
                    </span>
                    {!readIds.includes(leadStory.id) && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-amber-400 rounded-md">
                        Nieuw
                      </span>
                    )}
                  </div>
                </div>

                {/* Editorial Content Area */}
                <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Unboxed Metadata Line (Frontend Constitution Discipline) */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-app-muted mb-3">
                      <span className="font-semibold text-app-ink">{leadStory.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{leadStory.date}</span>
                      {leadStory.version && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums font-medium text-app-ink">{leadStory.version}</span>
                        </>
                      )}
                      {leadStory.readTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{leadStory.readTime}</span>
                        </>
                      )}
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-app-ink tracking-tight mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {leadStory.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-app-muted leading-relaxed line-clamp-3 mb-5">
                      {leadStory.content}
                    </p>

                    {/* Feature Highlights Bullet Checklist */}
                    {leadStory.highlights && leadStory.highlights.length > 0 && (
                      <div className="space-y-2 mb-6">
                        {leadStory.highlights.slice(0, 3).map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-app-ink">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Reactions Row */}
                  <div className="pt-4 border-t border-app-border flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-app-ink flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Lees volledige release <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {leadStory.id === 16 && onNavigateToView && (
                        <button
                          type="button"
                          onClick={() => onNavigateToView('arcade')}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          title="Open de Katten Klikker Arcade game"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>Speel Klikker</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(leadStory.id, e)}
                        className={`p-2 rounded-lg border border-app-border transition-colors cursor-pointer ${
                          bookmarks.includes(leadStory.id) 
                            ? 'text-amber-500 bg-amber-500/10' 
                            : 'text-app-muted hover:text-app-ink bg-app-card'
                        }`}
                        title="Opslaan"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShare(leadStory, e)}
                        className="p-2 rounded-lg border border-app-border text-app-muted hover:text-app-ink bg-app-card transition-colors cursor-pointer"
                        title="Deel link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* TIER 2: SECONDARY BREAKTHROUGHS GRID */}
          {secondaryStories.length > 0 && (
            <section aria-label="Secondary Features">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-app-ink tracking-tight flex items-center gap-2">
                  <span>Belangrijke Releases & Beveiliging</span>
                </h3>
                <span className="text-xs text-app-muted font-mono tabular-nums">
                  {secondaryStories.length} publicaties
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {secondaryStories.map((item) => {
                  const isRead = readIds.includes(item.id);
                  const isBookmarked = bookmarks.includes(item.id);
                  const itemReactions = reactions[item.id] || { ...DEFAULT_REACTIONS };
                  const activeReaction = userReactions[item.id];

                  return (
                    <motion.article 
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setSelectedArticle(item);
                        markAsRead(item.id);
                      }}
                      className="group bg-app-card rounded-2xl border border-app-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail if present */}
                        {item.image && (
                          <div className="mb-4 h-40 rounded-xl overflow-hidden relative bg-slate-900">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          </div>
                        )}

                        {/* Unboxed Metadata Line */}
                        <div className="flex items-center flex-wrap gap-2 text-xs text-app-muted mb-2.5">
                          <span className="font-semibold text-app-ink">{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.date}</span>
                          {item.version && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums font-medium text-app-ink">{item.version}</span>
                            </>
                          )}
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block ml-1" title="Ongelezen" />
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-app-ink tracking-tight mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>

                        {/* Text */}
                        <p className="text-xs sm:text-sm text-app-muted leading-relaxed line-clamp-3 mb-4">
                          {item.content}
                        </p>

                        {/* Highlights Snippet */}
                        {item.highlights && item.highlights.length > 0 && (
                          <div className="space-y-1.5 mb-5 bg-app-accent/30 p-3 rounded-xl border border-app-border/60">
                            {item.highlights.slice(0, 2).map((h, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-app-ink">
                                <span className="text-amber-500 font-bold shrink-0">•</span>
                                <span className="line-clamp-1">{h}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions & Reactions */}
                      <div className="pt-4 border-t border-app-border flex items-center justify-between flex-wrap gap-2">
                        {/* Quick Reaction Bar */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleReaction(item.id, 'rocket', e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                              activeReaction === 'rocket' 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold' 
                                : 'text-app-muted hover:text-app-ink hover:bg-app-accent'
                            }`}
                            title="Stem met Raket"
                          >
                            <span>🚀</span>
                            <span>{itemReactions.rocket || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleReaction(item.id, 'fire', e)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                              activeReaction === 'fire' 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold' 
                                : 'text-app-muted hover:text-app-ink hover:bg-app-accent'
                            }`}
                            title="Stem met Vuur"
                          >
                            <span>🔥</span>
                            <span>{itemReactions.fire || 0}</span>
                          </button>
                        </div>

                        {/* Utility Buttons */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => toggleBookmark(item.id, e)}
                            className={`p-1.5 rounded-lg border border-app-border transition-colors cursor-pointer ${
                              isBookmarked 
                                ? 'text-amber-500 bg-amber-500/10' 
                                : 'text-app-muted hover:text-app-ink'
                            }`}
                            title="Opslaan"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleShare(item, e)}
                            className="p-1.5 rounded-lg border border-app-border text-app-muted hover:text-app-ink transition-colors cursor-pointer"
                            title="Kopieer directe link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          )}

          {/* TIER 3: CHRONOLOGICAL ARCHIVE & DEPARTMENT BULLETINS */}
          {archiveStories.length > 0 && (
            <section aria-label="Archive Releases">
              <div className="flex items-center justify-between mb-4 border-b border-app-border pb-2">
                <h3 className="text-base font-bold text-app-ink tracking-tight">
                  Archief & Community Mededelingen
                </h3>
                <span className="text-xs text-app-muted font-mono tabular-nums">
                  {archiveStories.length} gearchiveerd
                </span>
              </div>

              <div className="divide-y divide-app-border bg-app-card rounded-2xl border border-app-border overflow-hidden">
                {archiveStories.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isBookmarked = bookmarks.includes(item.id);

                  return (
                    <div 
                      key={item.id}
                      className="p-4 sm:p-5 hover:bg-app-accent/30 transition-colors"
                    >
                      <div 
                        onClick={() => {
                          setExpandedId(isExpanded ? null : item.id);
                          markAsRead(item.id);
                        }}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="grow">
                          {/* Unboxed Metadata */}
                          <div className="flex items-center flex-wrap gap-2 text-xs text-app-muted mb-1.5">
                            <span className="font-semibold text-app-ink">{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.date}</span>
                            {item.version && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-app-ink">{item.version}</span>
                              </>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-app-ink tracking-tight mb-1">
                            {item.title}
                          </h4>

                          <p className={`text-xs sm:text-sm text-app-muted leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.content}
                          </p>
                        </div>

                        {/* Expand / Actions */}
                        <div className="flex items-center gap-1 shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArticle(item);
                              markAsRead(item.id);
                            }}
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-app-ink bg-app-accent hover:bg-app-accent/80 rounded-lg transition-colors border border-app-border cursor-pointer mr-1"
                            title="Bekijk details"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => toggleBookmark(item.id, e)}
                            className={`p-1.5 rounded-lg border border-app-border transition-colors cursor-pointer ${
                              isBookmarked ? 'text-amber-500 bg-amber-500/10' : 'text-app-muted hover:text-app-ink'
                            }`}
                            title="Opslaan"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExpandedId(isExpanded ? null : item.id);
                              markAsRead(item.id);
                            }}
                            className="p-1.5 text-app-muted hover:text-app-ink rounded-lg transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-app-border flex items-center justify-between text-xs text-app-muted"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedArticle(item)}
                                className="font-semibold text-app-ink hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                Volledige release bekijken <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleShare(item, e)}
                              className="flex items-center gap-1 hover:text-app-ink cursor-pointer"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Deel link</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      )}

      {/* FULL EDITORIAL ARTICLE READER MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-app-card rounded-3xl shadow-2xl border border-app-border overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header Image if present */}
              {selectedArticle.image && (
                <div className="relative h-48 sm:h-56 bg-slate-900 shrink-0 overflow-hidden">
                  <img 
                    src={selectedArticle.image} 
                    alt={selectedArticle.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
                  
                  {/* Close button on image */}
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer border border-white/10"
                    title="Sluiten"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Close Button if no image */}
              {!selectedArticle.image && (
                <div className="flex justify-end p-4 pb-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 rounded-full text-app-muted hover:text-app-ink bg-app-accent transition-colors cursor-pointer"
                    title="Sluiten"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scrollable Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar grow">
                {/* Unboxed Metadata */}
                <div className="flex items-center flex-wrap gap-2 text-xs text-app-muted mb-3">
                  <span className="font-semibold text-app-ink">{selectedArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{selectedArticle.date}</span>
                  {selectedArticle.version && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-semibold text-app-ink">{selectedArticle.version}</span>
                    </>
                  )}
                  {selectedArticle.author && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedArticle.author}</span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-app-ink tracking-tight mb-4">
                  {selectedArticle.title}
                </h3>

                {/* Primary Content Narrative */}
                <p className="text-sm sm:text-base text-app-muted leading-relaxed mb-6 font-normal">
                  {selectedArticle.content}
                </p>

                {/* Detailed Sections if available */}
                {selectedArticle.details && (
                  <div className="space-y-6 pt-6 border-t border-app-border">
                    {selectedArticle.details.overview && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2">
                          Overzicht & Context
                        </h4>
                        <p className="text-xs sm:text-sm text-app-ink leading-relaxed">
                          {selectedArticle.details.overview}
                        </p>
                      </div>
                    )}

                    {selectedArticle.details.features && selectedArticle.details.features.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2">
                          Nieuwe Functionaliteiten
                        </h4>
                        <ul className="space-y-2">
                          {selectedArticle.details.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-app-ink">
                              <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedArticle.details.improvements && selectedArticle.details.improvements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2">
                          Verbeteringen & Prestaties
                        </h4>
                        <ul className="space-y-2">
                          {selectedArticle.details.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-app-ink">
                              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedArticle.details.security && selectedArticle.details.security.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2">
                          Beveiliging & Privacy
                        </h4>
                        <ul className="space-y-2">
                          {selectedArticle.details.security.map((sec, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-app-ink">
                              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{sec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedArticle.details.fixes && selectedArticle.details.fixes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2">
                          Opgeloste Problemen
                        </h4>
                        <ul className="space-y-2">
                          {selectedArticle.details.fixes.map((fix, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-app-ink">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 sm:p-6 bg-app-accent/30 border-t border-app-border shrink-0 flex items-center justify-between flex-wrap gap-3">
                {/* Reactions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReaction(selectedArticle.id, 'rocket')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-app-border text-xs font-medium text-app-ink hover:bg-app-accent transition-colors cursor-pointer"
                  >
                    <span>🚀</span>
                    <span className="font-mono tabular-nums">
                      {(reactions[selectedArticle.id]?.rocket || 0) + (userReactions[selectedArticle.id] === 'rocket' ? 1 : 0)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(selectedArticle.id, 'fire')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-app-border text-xs font-medium text-app-ink hover:bg-app-accent transition-colors cursor-pointer"
                  >
                    <span>🔥</span>
                    <span className="font-mono tabular-nums">
                      {(reactions[selectedArticle.id]?.fire || 0) + (userReactions[selectedArticle.id] === 'fire' ? 1 : 0)}
                    </span>
                  </button>
                </div>

                {/* Share, Bookmark & Navigate */}
                <div className="flex items-center gap-2">
                  {selectedArticle.id === 16 && onNavigateToView && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArticle(null);
                        onNavigateToView('arcade');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>Start Katten Klikker</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(selectedArticle.id, e)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border border-app-border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      bookmarks.includes(selectedArticle.id) 
                        ? 'text-amber-500 bg-amber-500/10' 
                        : 'text-app-ink bg-app-card hover:bg-app-accent'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{bookmarks.includes(selectedArticle.id) ? 'Opgeslagen' : 'Opslaan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleShare(selectedArticle, e)}
                    className="px-3 py-1.5 text-xs font-medium text-app-ink bg-app-card hover:bg-app-accent border border-app-border rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Delen</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpdateModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        version={APP_VERSION}
      />

    </div>
  );
};

export default NewsView;
