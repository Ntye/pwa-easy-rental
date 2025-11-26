// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SyncQueueItem<T extends Record<string, any> = Record<string, unknown>> {
  id: string;
  timestamp: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: T;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface SyncResult {
  success: boolean;
  itemId: string;
  error?: string;
}

export interface OfflineConfig {
  dbName: string;
  maxRetries: number;
  syncInterval: number;
}

export interface CacheConfig {
  cacheName: string;
  maxAge: number;
}
