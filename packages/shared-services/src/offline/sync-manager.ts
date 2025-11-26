import type { SyncQueueItem, OfflineConfig } from '../types';

const DEFAULT_CONFIG: OfflineConfig = {
  dbName: 'pwa-easy-rental-db',
  maxRetries: 3,
  syncInterval: 30000, // 30 seconds
};

interface DBSchema {
  syncQueue: SyncQueueItem;
  cache: {
    key: string;
    value: unknown;
    timestamp: number;
    entity: string;
  };
}

/**
 * Centralized Offline Sync Manager
 * Handles IndexedDB operations and sync queue management
 */
export class OfflineSyncManager {
  private config: OfflineConfig;
  private db: IDBDatabase | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncHandlers: Map<string, (item: SyncQueueItem) => Promise<boolean>> = new Map();

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.setupOnlineListener();
        this.startSyncInterval();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('entity', 'entity', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('entity', 'entity', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Register a sync handler for a specific entity type
   */
  registerSyncHandler(entity: string, handler: (item: SyncQueueItem) => Promise<boolean>): void {
    this.syncHandlers.set(entity, handler);
  }

  /**
   * Add an item to the sync queue
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addToQueue<T extends Record<string, any>>(item: Omit<SyncQueueItem<T>, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const queueItem: SyncQueueItem<T> = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(queueItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // If online, trigger immediate sync
        if (this.isOnline) {
          this.processQueue();
        }
        resolve(queueItem.id);
      };
    });
  }

  /**
   * Get all pending items from the queue
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || !this.db) {
      return;
    }

    const pendingItems = await this.getPendingItems();

    for (const item of pendingItems) {
      await this.syncItem(item);
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    const handler = this.syncHandlers.get(item.entity);
    
    if (!handler) {
      console.warn(`No sync handler registered for entity: ${item.entity}`);
      return false;
    }

    try {
      await this.updateItemStatus(item.id, 'syncing');
      const success = await handler(item);

      if (success) {
        await this.removeFromQueue(item.id);
        return true;
      } else {
        await this.handleSyncFailure(item);
        return false;
      }
    } catch (error) {
      console.error(`Sync failed for item ${item.id}:`, error);
      await this.handleSyncFailure(item);
      return false;
    }
  }

  /**
   * Handle sync failure with retry logic
   */
  private async handleSyncFailure(item: SyncQueueItem): Promise<void> {
    const newRetryCount = item.retryCount + 1;
    
    if (newRetryCount >= this.config.maxRetries) {
      await this.updateItemStatus(item.id, 'failed');
    } else {
      await this.updateItem(item.id, {
        retryCount: newRetryCount,
        status: 'pending',
      });
    }
  }

  /**
   * Update item status in the queue
   */
  private async updateItemStatus(id: string, status: SyncQueueItem['status']): Promise<void> {
    await this.updateItem(id, { status });
  }

  /**
   * Update an item in the queue
   */
  private async updateItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const putRequest = store.put({ ...item, ...updates });
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Remove an item from the queue
   */
  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, entity: string, value: unknown): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        key,
        entity,
        value,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
    });
  }

  /**
   * Clear cached data for an entity
   */
  async clearCache(entity?: string): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');

      if (entity) {
        const index = store.index('entity');
        const request = index.openCursor(IDBKeyRange.only(entity));
        
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      } else {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }
    });
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start the periodic sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop the sync manager
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get the current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{ pending: number; failed: number; total: number }> {
    if (!this.db) {
      return { pending: 0, failed: 0, total: 0 };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readonly');
      const store = transaction.objectStore('syncQueue');
      const statusIndex = store.index('status');

      let pending = 0;
      let failed = 0;
      let total = 0;

      const pendingRequest = statusIndex.count('pending');
      const failedRequest = statusIndex.count('failed');
      const totalRequest = store.count();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve({ pending, failed, total });

      pendingRequest.onsuccess = () => {
        pending = pendingRequest.result;
      };
      failedRequest.onsuccess = () => {
        failed = failedRequest.result;
      };
      totalRequest.onsuccess = () => {
        total = totalRequest.result;
      };
    });
  }
}

// Singleton instance for shared use
let instance: OfflineSyncManager | null = null;

export function getOfflineSyncManager(config?: Partial<OfflineConfig>): OfflineSyncManager {
  if (!instance) {
    instance = new OfflineSyncManager(config);
  }
  return instance;
}
