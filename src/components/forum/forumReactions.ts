export interface ReactionState {
  [itemId: string]: {
    [emoji: string]: number;
  };
}

export interface UserReactionsState {
  [itemId: string]: string[]; // array of emojis user reacted with
}

const STORAGE_REACTIONS_KEY = 'ftjm_forum_reactions_counts';
const STORAGE_USER_REACTIONS_KEY = 'ftjm_forum_user_reactions';

export const getStoredReactions = (): { reactions: ReactionState; userReactions: UserReactionsState } => {
  try {
    const rawReactions = localStorage.getItem(STORAGE_REACTIONS_KEY);
    const rawUserReactions = localStorage.getItem(STORAGE_USER_REACTIONS_KEY);
    return {
      reactions: rawReactions ? JSON.parse(rawReactions) : {},
      userReactions: rawUserReactions ? JSON.parse(rawUserReactions) : {}
    };
  } catch {
    return { reactions: {}, userReactions: {} };
  }
};

export const toggleItemReaction = (
  itemId: string,
  emoji: string
): { reactions: ReactionState; userReactions: UserReactionsState; hasReacted: boolean } => {
  const { reactions, userReactions } = getStoredReactions();

  const currentItemReactions = reactions[itemId] || {};
  const currentUserReactions = userReactions[itemId] || [];

  const alreadyReacted = currentUserReactions.includes(emoji);
  let updatedUserReactions: string[];
  let updatedItemReactions = { ...currentItemReactions };

  if (alreadyReacted) {
    updatedUserReactions = currentUserReactions.filter(e => e !== emoji);
    updatedItemReactions[emoji] = Math.max(0, (updatedItemReactions[emoji] || 1) - 1);
    if (updatedItemReactions[emoji] === 0) {
      delete updatedItemReactions[emoji];
    }
  } else {
    updatedUserReactions = [...currentUserReactions, emoji];
    updatedItemReactions[emoji] = (updatedItemReactions[emoji] || 0) + 1;
  }

  reactions[itemId] = updatedItemReactions;
  userReactions[itemId] = updatedUserReactions;

  try {
    localStorage.setItem(STORAGE_REACTIONS_KEY, JSON.stringify(reactions));
    localStorage.setItem(STORAGE_USER_REACTIONS_KEY, JSON.stringify(userReactions));
  } catch (e) {
    console.error('Failed to save reactions', e);
  }

  return {
    reactions,
    userReactions,
    hasReacted: !alreadyReacted
  };
};
