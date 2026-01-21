// Aggressive image preloading system for maximum performance
import { optimizeImageUrl } from './imageOptimizer';

class ImagePreloader {
  private preloadedImages = new Set<string>();
  private preloadPromises = new Map<string, Promise<void>>();

  // Preload image with aggressive caching
  async preloadImage(src: string): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(src);
        this.preloadPromises.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.preloadPromises.delete(src);
        reject(new Error(`Failed to preload: ${src}`));
      };

      // High priority loading with crossOrigin support
      img.crossOrigin = 'anonymous';
      img.loading = 'eager';
      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  // Batch preload for restaurant lists
  async preloadRestaurantImages(restaurants: any[]): Promise<void[]> {
    const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
    
    const imageUrls = restaurants.map(restaurant => 
      optimizeImageUrl(restaurant.imageUrl || defaultImage, 320, 192)
    );

    return Promise.allSettled(
      imageUrls.map(url => this.preloadImage(url))
    ).then(results => 
      results.map(result => 
        result.status === 'fulfilled' ? result.value : undefined
      ).filter(Boolean) as void[]
    );
  }

  // Check if image is preloaded
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  // Clear preloaded images (memory management)
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadPromises.clear();
  }

  // Get preloader stats
  getStats(): { preloaded: number; loading: number } {
    return {
      preloaded: this.preloadedImages.size,
      loading: this.preloadPromises.size
    };
  }
}

export const imagePreloader = new ImagePreloader();