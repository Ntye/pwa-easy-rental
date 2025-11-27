'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOfflineSyncManager, OfflineSyncManager } from './sync-manager';
import type { SyncQueueItem, OfflineConfig } from '../types';

export interface UseOfflineSyncResult {
  isInitialized: boolean;
  isOnline: boolean;
  isPending: boolean;
  queueStats: { pending: number; failed: number; total: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addToQueue: <T extends Record<string, any>>(item: Omit<SyncQueueItem<T>, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<string>;
  processQueue: () => Promise<void>;
  cacheData: (key: string, entity: string, value: unknown) => Promise<void>;
  getCachedData: <T>(key: string) => Promise<T | null>;
  registerSyncHandler: (entity: string, handler: (item: SyncQueueItem) => Promise<boolean>) => void;
}

/**
 * React hook for offline sync functionality
 */
export function useOfflineSync(config?: Partial<OfflineConfig>): UseOfflineSyncResult {
  const [manager, setManager] = useState<OfflineSyncManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, total: 0 });

  useEffect(() => {
    const syncManager = getOfflineSyncManager(config);

    const initManager = async () => {
      await syncManager.init();
      setManager(syncManager);
      setIsOnline(syncManager.getOnlineStatus());

      const stats = await syncManager.getQueueStats();
      setQueueStats(stats);
      setIsInitialized(true);
    };

    initManager();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config]);

  const updateStats = useCallback(async () => {
    if (manager) {
      const stats = await manager.getQueueStats();
      setQueueStats(stats);
    }
  }, [manager]);

  const addToQueue = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async <T extends Record<string, any>>(item: Omit<SyncQueueItem<T>, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
        if (!manager) {
          throw new Error('Offline sync manager not initialized');
        }
        const id = await manager.addToQueue(item);
        await updateStats();
        return id;
      },
      [manager, updateStats]
  );

  const processQueue = useCallback(async () => {
    if (!manager) {
      return;
    }
    setIsPending(true);
    await manager.processQueue();
    await updateStats();
    setIsPending(false);
  }, [manager, updateStats]);

  const cacheData = useCallback(
      async (key: string, entity: string, value: unknown) => {
        if (!manager) {
          throw new Error('Offline sync manager not initialized');
        }
        await manager.cacheData(key, entity, value);
      },
      [manager]
  );

  const getCachedData = useCallback(
      async <T,>(key: string): Promise<T | null> => {
        if (!manager) {
          return null;
        }
        return manager.getCachedData<T>(key);
      },
      [manager]
  );

  const registerSyncHandler = useCallback(
      (entity: string, handler: (item: SyncQueueItem) => Promise<boolean>) => {
        if (manager) {
          manager.registerSyncHandler(entity, handler);
        }
      },
      [manager]
  );

  return {
    isInitialized,
    isOnline,
    isPending,
    queueStats,
    addToQueue,
    processQueue,
    cacheData,
    getCachedData,
    registerSyncHandler,
  };
}
