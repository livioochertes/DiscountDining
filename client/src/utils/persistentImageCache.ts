// Persistent image caching with IndexedDB and localStorage fallback
import { useState, useEffect } from 'react';

interface CachedImage {
  url: string;
  blobUrl: string;
  timestamp: number;
  expires: number;
}

class PersistentImageCache {
  private dbName = 'EatOffImageCache';
  private storeName = 'images';
  private version = 1;
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, CachedImage>();
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to memory cache');
        resolve();
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async getCachedImage(url: string): Promise<string> {
    // Check memory cache first
    const cached = this.memoryCache.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.blobUrl;
    }

    // Check IndexedDB if available
    if (this.db) {
      try {
        const cached = await this.getFromIndexedDB(url);
        if (cached && cached.expires > Date.now()) {
          // Restore to memory cache
          this.memoryCache.set(url, cached);
          return cached.blobUrl;
        }
      } catch (error) {
        console.warn('IndexedDB read error:', error);
      }
    }

    // Load and cache the image
    return this.loadAndCacheImage(url);
  }

  private async getFromIndexedDB(url: string): Promise<CachedImage | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToIndexedDB(cached: CachedImage): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cached);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadAndCacheImage(url: string): Promise<string> {
    try {
      // Create a persistent image element to ensure browser caching
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const blobUrl = await new Promise<string>((resolve, reject) => {
        img.onload = async () => {
          try {
            // Create canvas to convert to blob
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            ctx?.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                resolve(blobUrl);
              } else {
                // Fallback to original URL
                resolve(url);
              }
            }, 'image/jpeg', 0.9);
          } catch (error) {
            // Canvas failed, use original URL
            resolve(url);
          }
        };
        
        img.onerror = () => {
          // Image failed to load, use placeholder
          resolve(url);
        };
        
        img.src = url;
      });

      // Cache the result
      const cached: CachedImage = {
        url,
        blobUrl,
        timestamp: Date.now(),
        expires: Date.now() + this.CACHE_DURATION
      };

      // Store in memory
      this.memoryCache.set(url, cached);

      // Store in IndexedDB if available
      if (this.db && blobUrl !== url) {
        try {
          await this.saveToIndexedDB(cached);
        } catch (error) {
          console.warn('Failed to save to IndexedDB:', error);
        }
      }

      return blobUrl;
    } catch (error) {
      console.warn(`Failed to cache image ${url}:`, error);
      return url;
    }
  }

  // Clean expired entries
  async cleanup(): Promise<void> {
    const now = Date.now();
    
    // Clean memory cache
    for (const [url, cached] of this.memoryCache.entries()) {
      if (cached.expires <= now) {
        if (cached.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(cached.blobUrl);
        }
        this.memoryCache.delete(url);
      }
    }

    // Clean IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor();
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const cached = cursor.value as CachedImage;
            if (cached.expires <= now) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      } catch (error) {
        console.warn('IndexedDB cleanup error:', error);
      }
    }
  }
}

// Export singleton
export const persistentImageCache = new PersistentImageCache();

// Initialize on module load
persistentImageCache.init();

// Cleanup every hour
setInterval(() => {
  persistentImageCache.cleanup();
}, 60 * 60 * 1000);

// React hook
export function usePersistentImageCache(imageUrl: string | null) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setCachedUrl(null);
      return;
    }

    setIsLoading(true);
    persistentImageCache.getCachedImage(imageUrl)
      .then(url => {
        setCachedUrl(url);
        setIsLoading(false);
      })
      .catch(() => {
        setCachedUrl(imageUrl);
        setIsLoading(false);
      });
  }, [imageUrl]);

  return { cachedUrl, isLoading };
}