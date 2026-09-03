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

export const invalidateArchiveDB = () => {
  dbPromise = null;
};

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
      const db = (event.target as IDBOpenDBRequest).result;

      db.onclose = () => {
        dbPromise = null;
      };

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = (event) => {
      dbPromise = null;
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

const isConnectionClosedError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('connection is closing') ||
    msg.includes('database connection') ||
    msg.includes('idbdatabase') ||
    msg.includes('invalidstateerror') ||
    err.name === 'InvalidStateError'
  );
};

export const executeWithArchiveDB = async <T>(
  operation: (db: IDBDatabase) => Promise<T>
): Promise<T> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getArchiveDB();
      return await operation(db);
    } catch (err) {
      if (attempt === 0 && isConnectionClosedError(err)) {
        console.warn('IndexedDB connection was closing or invalid. Resetting and retrying...', err);
        invalidateArchiveDB();
        await new Promise(r => setTimeout(r, 150));
        continue;
      }
      throw err;
    }
  }
  throw new Error('IndexedDB operation failed');
};

/**
 * Saves or updates a batch of Direct Messages locally in IndexedDB
 */
export const saveDMsBatchLocally = async (messages: any[]): Promise<void> => {
  if (!messages || messages.length === 0) return;
  try {
    await executeWithArchiveDB((db) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction('direct_messages', 'readwrite');
          const store = tx.objectStore('direct_messages');
          for (const msg of messages) {
            if (msg && msg.id && msg.conversation_id) {
              store.put(msg);
            }
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    });
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
    return await executeWithArchiveDB((db) => {
      return new Promise<any[]>((resolve, reject) => {
        try {
          const tx = db.transaction('direct_messages', 'readonly');
          const store = tx.objectStore('direct_messages');
          const index = store.index('conversation_id');
          const request = index.getAll(conversationId);

          request.onsuccess = () => {
            const results = request.result || [];
            results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
            resolve(results);
          };

          request.onerror = () => reject(request.error);
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
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
    await executeWithArchiveDB((db) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction('chat_posts', 'readwrite');
          const store = tx.objectStore('chat_posts');
          for (const post of posts) {
            if (post && post.id) {
              store.put(post);
            }
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('Failed to save posts batch locally:', err);
  }
};

/**
 * Gets all locally archived General Chat Posts
 */
export const getLocalPosts = async (): Promise<any[]> => {
  try {
    return await executeWithArchiveDB((db) => {
      return new Promise<any[]>((resolve, reject) => {
        try {
          const tx = db.transaction('chat_posts', 'readonly');
          const store = tx.objectStore('chat_posts');
          const request = store.getAll();

          request.onsuccess = () => {
            const results = request.result || [];
            results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
            resolve(results);
          };

          request.onerror = () => reject(request.error);
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('Failed to get local posts:', err);
    return [];
  }
};

/**
 * Deletes a post from the local IndexedDB database
 */
export const deletePostLocally = async (postId: string): Promise<void> => {
  if (!postId) return;
  try {
    await executeWithArchiveDB((db) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction('chat_posts', 'readwrite');
          const store = tx.objectStore('chat_posts');
          const request = store.delete(postId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('Failed to delete post locally:', err);
  }
};

/**
 * Deletes a direct message from the local IndexedDB database
 */
export const deleteDMLocally = async (messageId: string): Promise<void> => {
  if (!messageId) return;
  try {
    await executeWithArchiveDB((db) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction('direct_messages', 'readwrite');
          const store = tx.objectStore('direct_messages');
          const request = store.delete(messageId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('Failed to delete DM locally:', err);
  }
};

/**
 * Toggles bookmark status for a message/post locally
 */
export const toggleBookmarkLocally = async (bookmark: SavedBookmark): Promise<boolean> => {
  try {
    return await executeWithArchiveDB((db) => {
      return new Promise<boolean>((resolve, reject) => {
        try {
          const tx = db.transaction('bookmarks', 'readwrite');
          const store = tx.objectStore('bookmarks');
          const getReq = store.get(bookmark.id);

          getReq.onsuccess = () => {
            if (getReq.result) {
              store.delete(bookmark.id);
              resolve(false);
            } else {
              store.put({ ...bookmark, saved_at: new Date().toISOString() });
              resolve(true);
            }
          };

          getReq.onerror = () => reject(getReq.error);
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
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
    return await executeWithArchiveDB((db) => {
      return new Promise<SavedBookmark[]>((resolve, reject) => {
        try {
          const tx = db.transaction('bookmarks', 'readonly');
          const store = tx.objectStore('bookmarks');
          const request = store.getAll();

          request.onsuccess = () => {
            const results = request.result || [];
            results.sort((a, b) => (b.saved_at || '').localeCompare(a.saved_at || ''));
            resolve(results);
          };

          request.onerror = () => reject(request.error);
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      });
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
    return await executeWithArchiveDB(async (db) => {
      const countStore = (storeName: string): Promise<number> => {
        return new Promise((resolve) => {
          try {
            if (!db.objectStoreNames.contains(storeName)) {
              resolve(0);
              return;
            }
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.count();
            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => resolve(0);
          } catch {
            resolve(0);
          }
        });
      };

      const dmsCount = await countStore('direct_messages');
      const postsCount = await countStore('chat_posts');
      const bookmarksCount = await countStore('bookmarks');

      return { dmsCount, postsCount, bookmarksCount };
    });
  } catch (err) {
    console.warn('Failed to get archive stats:', err);
    return { dmsCount: 0, postsCount: 0, bookmarksCount: 0 };
  }
};

/**
 * Clears local archive and cleans up cached storage
 */
export const clearLocalArchive = async (target: 'dms' | 'posts' | 'bookmarks' | 'all' = 'all'): Promise<boolean> => {
  try {
    await executeWithArchiveDB(async (db) => {
      const storesToClear: string[] = [];
      if (target === 'all' || target === 'dms') {
        if (db.objectStoreNames.contains('direct_messages')) storesToClear.push('direct_messages');
      }
      if (target === 'all' || target === 'posts') {
        if (db.objectStoreNames.contains('chat_posts')) storesToClear.push('chat_posts');
      }
      if (target === 'all' || target === 'bookmarks') {
        if (db.objectStoreNames.contains('bookmarks')) storesToClear.push('bookmarks');
      }

      if (storesToClear.length > 0) {
        await new Promise<void>((resolve, reject) => {
          try {
            const tx = db.transaction(storesToClear, 'readwrite');
            for (const name of storesToClear) {
              tx.objectStore(name).clear();
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('Clear transaction failed'));
            tx.onabort = () => reject(tx.error || new Error('Clear transaction aborted'));
          } catch (e) {
            reject(e);
          }
        });
      }
    });

    // Clean up corresponding localStorage / sessionStorage caches
    if (typeof window !== 'undefined') {
      if (target === 'all' || target === 'posts') {
        try {
          localStorage.removeItem('cached_posts');
          sessionStorage.removeItem('cached_posts');
        } catch {}
      }
      if (target === 'all' || target === 'dms') {
        try {
          localStorage.removeItem('cached_messages');
          localStorage.removeItem('cached_conversations');
          sessionStorage.removeItem('cached_messages');
        } catch {}
      }

      // Notify running components that the local archive has been purged
      window.dispatchEvent(new CustomEvent('local-archive-cleared', { detail: { target } }));
    }

    return true;
  } catch (err) {
    console.error('Failed to clear local archive:', err);
    return false;
  }
};

