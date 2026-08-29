/**
 * Client-Side IndexedDB Storage Manager for Local Message Archiving
 * Allows users to persist chat messages, DMs, and bookmarked posts locally on their device,
 * keeping long-term history locally while leaving server limits untouched.
 */

export interface SavedBookmark {
  id: string;
  type: 'dm' | 'chat';
  content: string;
  author_name: string;
  created_at: string;
  conversation_id?: string;
  saved_at: string;
}

const DB_NAME = 'ftjm_local_archive_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const getArchiveDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for Direct Messages
      if (!db.objectStoreNames.contains('direct_messages')) {
        const dmStore = db.createObjectStore('direct_messages', { keyPath: 'id' });
        dmStore.createIndex('conversation_id', 'conversation_id', { unique: false });
        dmStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Object store for General Chat Posts
      if (!db.objectStoreNames.contains('chat_posts')) {
        const postStore = db.createObjectStore('chat_posts', { keyPath: 'id' });
        postStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Object store for Bookmarks / Saved messages
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('saved_at', 'saved_at', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

/**
 * Saves or updates a batch of Direct Messages locally in IndexedDB
 */
export const saveDMsBatchLocally = async (messages: any[]): Promise<void> => {
  if (!messages || messages.length === 0) return;
  try {
    const db = await getArchiveDB();
    const tx = db.transaction('direct_messages', 'readwrite');
    const store = tx.objectStore('direct_messages');
    for (const msg of messages) {
      if (msg && msg.id && msg.conversation_id) {
        store.put(msg);
      }
    }
  } catch (err) {
    console.warn('Failed to save DMs batch locally:', err);
  }
};

/**
 * Gets all locally archived DMs for a given conversation_id
 */
export const getLocalDMsForConversation = async (conversationId: string): Promise<any[]> => {
  if (!conversationId) return [];
  try {
    const db = await getArchiveDB();
    return new Promise((resolve) => {
      const tx = db.transaction('direct_messages', 'readonly');
      const store = tx.objectStore('direct_messages');
      const index = store.index('conversation_id');
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort descending by created_at
        results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        resolve(results);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Failed to get local DMs:', err);
    return [];
  }
};

/**
 * Saves or updates a batch of General Chat Posts locally in IndexedDB
 */
export const savePostsBatchLocally = async (posts: any[]): Promise<void> => {
  if (!posts || posts.length === 0) return;
  try {
    const db = await getArchiveDB();
    const tx = db.transaction('chat_posts', 'readwrite');
    const store = tx.objectStore('chat_posts');
    for (const post of posts) {
      if (post && post.id) {
        store.put(post);
      }
    }
  } catch (err) {
    console.warn('Failed to save posts batch locally:', err);
  }
};

/**
 * Gets all locally archived General Chat Posts
 */
export const getLocalPosts = async (): Promise<any[]> => {
  try {
    const db = await getArchiveDB();
    return new Promise((resolve) => {
      const tx = db.transaction('chat_posts', 'readonly');
      const store = tx.objectStore('chat_posts');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort descending by created_at
        results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        resolve(results);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Failed to get local posts:', err);
    return [];
  }
};

/**
 * Toggles bookmark status for a message/post locally
 */
export const toggleBookmarkLocally = async (bookmark: SavedBookmark): Promise<boolean> => {
  try {
    const db = await getArchiveDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const getReq = store.get(bookmark.id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          store.delete(bookmark.id);
          resolve(false); // removed
        } else {
          store.put({ ...bookmark, saved_at: new Date().toISOString() });
          resolve(true); // saved
        }
      };

      getReq.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to toggle bookmark:', err);
    return false;
  }
};

/**
 * Gets all saved bookmarks
 */
export const getLocalBookmarks = async (): Promise<SavedBookmark[]> => {
  try {
    const db = await getArchiveDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bookmarks', 'readonly');
      const store = tx.objectStore('bookmarks');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => (b.saved_at || '').localeCompare(a.saved_at || ''));
        resolve(results);
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to get local bookmarks:', err);
    return [];
  }
};

/**
 * Gets statistics about locally archived data
 */
export const getLocalArchiveStats = async (): Promise<{ dmsCount: number; postsCount: number; bookmarksCount: number }> => {
  try {
    const db = await getArchiveDB();
    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    };

    const dmsCount = await countStore('direct_messages');
    const postsCount = await countStore('chat_posts');
    const bookmarksCount = await countStore('bookmarks');

    return { dmsCount, postsCount, bookmarksCount };
  } catch {
    return { dmsCount: 0, postsCount: 0, bookmarksCount: 0 };
  }
};

/**
 * Clears local archive
 */
export const clearLocalArchive = async (target: 'dms' | 'posts' | 'bookmarks' | 'all' = 'all'): Promise<void> => {
  try {
    const db = await getArchiveDB();
    const storesToClear: string[] = [];
    if (target === 'all' || target === 'dms') storesToClear.push('direct_messages');
    if (target === 'all' || target === 'posts') storesToClear.push('chat_posts');
    if (target === 'all' || target === 'bookmarks') storesToClear.push('bookmarks');

    const tx = db.transaction(storesToClear, 'readwrite');
    for (const name of storesToClear) {
      tx.objectStore(name).clear();
    }
  } catch (err) {
    console.warn('Failed to clear local archive:', err);
  }
};
