import { useEffect, useState } from 'react';

interface ImageCache {
  [url: string]: HTMLImageElement;
}

const imageCache: ImageCache = {};

export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if image is already cached
        if (imageCache[url]) {
          setLoadedImages(prev => new Set([...prev, url]));
          resolve();
          return;
        }

        const img = new Image();
        img.onload = () => {
          // Store in cache for future use
          imageCache[url] = img;
          setLoadedImages(prev => new Set([...prev, url]));
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    };

    // Preload all images
    const loadAllImages = async () => {
      try {
        await Promise.allSettled(imageUrls.map(loadImage));
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    };

    if (imageUrls.length > 0) {
      loadAllImages();
    }
  }, [imageUrls]);

  return {
    isImageLoaded: (url: string) => loadedImages.has(url),
    getCachedImage: (url: string) => imageCache[url],
    preloadedCount: loadedImages.size
  };
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageCache[url]) {
      resolve(imageCache[url]);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache[url] = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
}