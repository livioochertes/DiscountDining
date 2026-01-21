// Advanced image caching system for restaurant images
class ImageCacheManager {
  private cache = new Map<string, HTMLImageElement>();
  private preloadPromises = new Map<string, Promise<HTMLImageElement>>();

  // Preload an image and store it in cache
  preloadImage(src: string): Promise<HTMLImageElement> {
    // Return existing promise if already preloading
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    // Return cached image immediately if available
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!);
    }

    // Create new preload promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.preloadPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.preloadPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Set crossOrigin to avoid CORS issues with Unsplash
      img.crossOrigin = 'anonymous';
      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  // Check if image is already cached
  isCached(src: string): boolean {
    return this.cache.has(src);
  }

  // Get cached image
  getCachedImage(src: string): HTMLImageElement | null {
    return this.cache.get(src) || null;
  }

  // Preload multiple images in batch
  preloadBatch(srcs: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)));
  }

  // Clear cache to prevent memory leaks
  clearCache(): void {
    this.cache.clear();
    this.preloadPromises.clear();
  }

  // Get cache size for debugging
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCacheManager();