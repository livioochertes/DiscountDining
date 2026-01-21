// Comprehensive image caching solution to prevent reloading during scroll
import { useEffect, useState } from 'react';

// Global image cache that persists across component re-renders
const globalImageCache = new Map<string, {
  element: HTMLImageElement;
  dataUrl: string;
  loadTime: number;
}>();

// Keep references to prevent garbage collection
const imageRefs = new Set<HTMLImageElement>();

function createPersistentImage(src: string): Promise<{ element: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // Check if already cached
    const cached = globalImageCache.get(src);
    if (cached) {
      resolve({ element: cached.element, dataUrl: cached.dataUrl });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    
    // Force image to stay in memory
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.style.top = '-9999px';
    img.style.visibility = 'hidden';
    
    img.onload = () => {
      try {
        // Create canvas to convert to data URL for persistent storage
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        ctx?.drawImage(img, 0, 0);
        
        // Convert to data URL for permanent storage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Store in cache
        const cacheEntry = {
          element: img,
          dataUrl,
          loadTime: Date.now()
        };
        
        globalImageCache.set(src, cacheEntry);
        imageRefs.add(img);
        
        // Append to body to keep in memory (hidden)
        document.body.appendChild(img);
        
        resolve({ element: img, dataUrl });
      } catch (error) {
        // Fallback to original image
        const cacheEntry = {
          element: img,
          dataUrl: src,
          loadTime: Date.now()
        };
        
        globalImageCache.set(src, cacheEntry);
        imageRefs.add(img);
        document.body.appendChild(img);
        
        resolve({ element: img, dataUrl: src });
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load ${src}`));
    };
    
    img.src = src;
  });
}

export function useImageCache(imageSrc: string | null) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageSrc) {
      setCachedUrl(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = globalImageCache.get(imageSrc);
    if (cached) {
      setCachedUrl(cached.dataUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    createPersistentImage(imageSrc)
      .then(({ dataUrl }) => {
        setCachedUrl(dataUrl);
        setIsLoading(false);
      })
      .catch(() => {
        setCachedUrl(imageSrc); // Fallback
        setIsLoading(false);
      });
  }, [imageSrc]);

  return { cachedUrl, isLoading };
}

// Preload images for better performance
export function preloadImages(urls: string[]) {
  urls.forEach(url => {
    if (!globalImageCache.has(url)) {
      createPersistentImage(url).catch(() => {
        // Ignore preload failures
      });
    }
  });
}

// Clean up old cache entries (keep last 100 images)
export function cleanupImageCache() {
  if (globalImageCache.size > 100) {
    const entries = Array.from(globalImageCache.entries())
      .sort((a, b) => b[1].loadTime - a[1].loadTime);
    
    // Keep newest 100, remove rest
    const toRemove = entries.slice(100);
    toRemove.forEach(([url, cached]) => {
      globalImageCache.delete(url);
      imageRefs.delete(cached.element);
      
      if (cached.element.parentNode) {
        cached.element.parentNode.removeChild(cached.element);
      }
    });
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupImageCache);