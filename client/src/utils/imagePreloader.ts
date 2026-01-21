// Simple but reliable image preloading and caching
import { useState, useEffect } from 'react';

// Global image cache to store preloaded images
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

function preloadImage(src: string): Promise<HTMLImageElement> {
  // Return cached image if available
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  // Return existing loading promise if image is being loaded
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  // Create new loading promise
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    // Set cache-friendly attributes
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.loading = 'lazy';
    
    img.onload = () => {
      // Store in cache for future use
      imageCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // Start loading
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

export function useImagePreloader(imageSrc: string | null) {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    if (imageCache.has(imageSrc)) {
      setImageElement(imageCache.get(imageSrc)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    preloadImage(imageSrc)
      .then(img => {
        setImageElement(img);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
        setImageElement(null);
      });
  }, [imageSrc]);

  return {
    imageElement,
    isLoading,
    error,
    imageSrc: imageElement?.src || null
  };
}

// Preload multiple images
export function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => 
    preloadImage(url).catch(() => null) // Ignore individual failures
  );
  
  return Promise.allSettled(promises).then(() => {});
}

// Get cache statistics
export function getCacheInfo() {
  return {
    size: imageCache.size,
    urls: Array.from(imageCache.keys())
  };
}