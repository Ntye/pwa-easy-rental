export interface SyncQueueItem {
  id: string;
  timestamp: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: Record<string, unknown>;
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
