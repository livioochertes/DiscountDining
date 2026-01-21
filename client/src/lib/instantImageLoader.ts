// Ultra-fast image loading system to eliminate any loading delays
export class InstantImageLoader {
  private static instance: InstantImageLoader;
  private loadedImages = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  static getInstance(): InstantImageLoader {
    if (!this.instance) {
      this.instance = new InstantImageLoader();
    }
    return this.instance;
  }

  // Check if image is instantly available (in memory cache)
  isInstantlyAvailable(src: string): boolean {
    // Check if we've already loaded it
    if (this.loadedImages.has(src)) return true;
    
    // Quick test: create temp image and check if immediately complete
    const tempImg = new Image();
    tempImg.src = src;
    return tempImg.complete && tempImg.naturalWidth > 0;
  }

  // Ultra-fast preload with immediate availability check
  async ultraPreload(src: string): Promise<void> {
    if (this.loadedImages.has(src)) return;
    
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      // Set highest priority attributes
      img.loading = 'eager';
      img.decoding = 'sync';
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject();
      };
      
      // Check if already cached before setting src
      if (img.complete) {
        this.loadedImages.add(src);
        resolve();
        return;
      }
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Batch ultra-preload for multiple images
  async batchUltraPreload(srcs: string[]): Promise<void> {
    const promises = srcs.map(src => this.ultraPreload(src).catch(() => undefined));
    await Promise.allSettled(promises);
  }

  // Mark image as loaded (for manual tracking)
  markAsLoaded(src: string): void {
    this.loadedImages.add(src);
  }

  // Clear cache for memory management
  clearCache(): void {
    this.loadedImages.clear();
    this.loadingPromises.clear();
  }
}

export const instantImageLoader = InstantImageLoader.getInstance();