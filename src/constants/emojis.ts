import data from '@emoji-mart/data';

// @ts-ignore
const emojiData = data as any;

export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

// category icons mapping since emoji-mart data doesn't include category icons natively
const CATEGORY_ICONS: Record<string, string> = {
  frequent: '🕒',
  people: '😀',
  nature: '🐻',
  foods: '🍔',
  activity: '⚽',
  places: '🚗',
  objects: '💡',
  symbols: '❤️',
  flags: '🏳️'
};

const CATEGORY_NAMES: Record<string, string> = {
  frequent: 'Recent',
  people: 'Smileys & Mensen',
  nature: 'Dieren & Natuur',
  foods: 'Eten & Drinken',
  activity: 'Activiteiten',
  places: 'Reizen & Plaatsen',
  objects: 'Objecten',
  symbols: 'Symbolen',
  flags: 'Vlaggen'
};

export const EMOJI_CATEGORIES: EmojiCategory[] = (emojiData.categories || []).map((cat: any) => {
  return {
    id: cat.id,
    name: CATEGORY_NAMES[cat.id] || cat.id,
    icon: CATEGORY_ICONS[cat.id] || '😀',
    emojis: (cat.emojis || []).map((emojiId: string) => {
      const eData = emojiData.emojis[emojiId];
      if (!eData) return null;
      return {
        emoji: eData.skins[0].native,
        name: eData.id,
        keywords: eData.keywords || []
      };
    }).filter(Boolean) as EmojiItem[]
  };
});

export const EMOJI_LIST: EmojiItem[] = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
