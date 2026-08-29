import React from 'react';
import { 
  MessageSquare, 
  HelpCircle, 
  Lightbulb, 
  Coffee, 
  Megaphone, 
  Gamepad2, 
  Sparkles, 
  Compass, 
  Flame, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  tag: string;
  color: string;
  bgColor: string;
  borderColor: string;
  modernGradient: string;
  modernGlow: string;
}

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: 'all',
    name: 'Alle Topics',
    description: 'Bekijk alle discussies en berichten van de community',
    iconName: 'Compass',
    tag: '#alles',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    modernGradient: 'from-indigo-500/20 to-purple-500/20',
    modernGlow: 'rgba(99, 102, 241, 0.3)'
  },
  {
    id: 'algemeen',
    name: 'Algemeen',
    description: 'Open discussies, nieuws en alledaagse onderwerpen',
    iconName: 'MessageSquare',
    tag: '#algemeen',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    modernGradient: 'from-blue-500/20 to-cyan-500/20',
    modernGlow: 'rgba(59, 130, 246, 0.3)'
  },
  {
    id: 'vragen',
    name: 'Vragen & Hulp',
    description: 'Stel vragen, zoek hulp en deel praktische oplossingen',
    iconName: 'HelpCircle',
    tag: '#vraag',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    modernGradient: 'from-emerald-500/20 to-teal-500/20',
    modernGlow: 'rgba(16, 185, 129, 0.3)'
  },
  {
    id: 'ideeen',
    name: 'Ideeën & Suggesties',
    description: 'Deel nieuwe concepten, feedback en feature-verzoeken',
    iconName: 'Lightbulb',
    tag: '#idee',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    modernGradient: 'from-amber-500/20 to-orange-500/20',
    modernGlow: 'rgba(245, 158, 11, 0.3)'
  },
  {
    id: 'gezelligheid',
    name: 'Gezelligheid & Chill',
    description: 'Even gezellig kletsen, memes, humor en off-topic',
    iconName: 'Coffee',
    tag: '#gezellig',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    modernGradient: 'from-pink-500/20 to-rose-500/20',
    modernGlow: 'rgba(236, 72, 153, 0.3)'
  },
  {
    id: 'gaming_tech',
    name: 'Gaming & Tech',
    description: 'Games, hardware, gadgets, development en technologie',
    iconName: 'Gamepad2',
    tag: '#gaming',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    modernGradient: 'from-violet-500/20 to-fuchsia-500/20',
    modernGlow: 'rgba(139, 92, 246, 0.3)'
  },
  {
    id: 'aankondigingen',
    name: 'Aankondigingen',
    description: 'Belangrijke updates, events en community mededelingen',
    iconName: 'Megaphone',
    tag: '#update',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    modernGradient: 'from-red-500/20 to-amber-500/20',
    modernGlow: 'rgba(239, 68, 68, 0.3)'
  }
];

export const FORUM_REACTIONS = [
  { emoji: '👍', label: 'Duim omhoog' },
  { emoji: '❤️', label: 'Hartje' },
  { emoji: '🔥', label: 'Vuur' },
  { emoji: '💡', label: 'Slim idee' },
  { emoji: '🚀', label: 'Raket' },
  { emoji: '😂', label: 'Grappig' },
  { emoji: '👏', label: 'Applaus' }
];

export const QUICK_TAGS = [
  { label: '#vraag', categoryId: 'vragen' },
  { label: '#discussie', categoryId: 'algemeen' },
  { label: '#idee', categoryId: 'ideeen' },
  { label: '#gezellig', categoryId: 'gezelligheid' },
  { label: '#tech', categoryId: 'gaming_tech' },
  { label: '#update', categoryId: 'aankondigingen' }
];

/**
 * Extracts category and cleans title if prefixed with tag or [Category]
 */
export const parseThreadCategory = (title: string, content?: string): { category: ForumCategory; cleanTitle: string } => {
  const lowerTitle = (title || '').toLowerCase();
  const lowerContent = (content || '').toLowerCase();

  // Check prefix [Tag] or tag in title/content
  if (lowerTitle.includes('[vraag]') || lowerTitle.includes('#vraag') || lowerContent.includes('#vraag')) {
    return {
      category: FORUM_CATEGORIES.find(c => c.id === 'vragen')!,
      cleanTitle: title.replace(/\[vraag\]/i, '').replace(/#vraag/i, '').trim()
    };
  }
  if (lowerTitle.includes('[idee]') || lowerTitle.includes('#idee') || lowerContent.includes('#idee') || lowerTitle.includes('[suggestie]')) {
    return {
      category: FORUM_CATEGORIES.find(c => c.id === 'ideeen')!,
      cleanTitle: title.replace(/\[idee\]/i, '').replace(/#idee/i, '').replace(/\[suggestie\]/i, '').trim()
    };
  }
  if (lowerTitle.includes('[gezellig]') || lowerTitle.includes('#gezellig') || lowerContent.includes('#gezellig') || lowerTitle.includes('[chill]')) {
    return {
      category: FORUM_CATEGORIES.find(c => c.id === 'gezelligheid')!,
      cleanTitle: title.replace(/\[gezellig\]/i, '').replace(/#gezellig/i, '').trim()
    };
  }
  if (lowerTitle.includes('[gaming]') || lowerTitle.includes('#gaming') || lowerTitle.includes('[tech]') || lowerTitle.includes('#tech')) {
    return {
      category: FORUM_CATEGORIES.find(c => c.id === 'gaming_tech')!,
      cleanTitle: title.replace(/\[gaming\]/i, '').replace(/#gaming/i, '').replace(/\[tech\]/i, '').replace(/#tech/i, '').trim()
    };
  }
  if (lowerTitle.includes('[aankondiging]') || lowerTitle.includes('#update') || lowerTitle.includes('[update]')) {
    return {
      category: FORUM_CATEGORIES.find(c => c.id === 'aankondigingen')!,
      cleanTitle: title.replace(/\[aankondiging\]/i, '').replace(/#update/i, '').replace(/\[update\]/i, '').trim()
    };
  }

  return {
    category: FORUM_CATEGORIES.find(c => c.id === 'algemeen')!,
    cleanTitle: title
  };
};
