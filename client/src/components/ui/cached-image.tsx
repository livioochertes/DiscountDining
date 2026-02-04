import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

const imageCache = new Set<string>();
const loadingImages = new Map<string, Promise<void>>();

function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) {
    return Promise.resolve();
  }
  
  if (loadingImages.has(src)) {
    return loadingImages.get(src)!;
  }
  
  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(src);
      loadingImages.delete(src);
      resolve();
    };
    img.onerror = () => {
      loadingImages.delete(src);
      reject();
    };
    img.src = src;
  });
  
  loadingImages.set(src, promise);
  return promise;
}

export function preloadImages(urls: string[]) {
  urls.forEach(url => {
    if (url && !imageCache.has(url)) {
      preloadImage(url).catch(() => {});
    }
  });
}

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  fallback?: React.ReactNode;
}

export const CachedImage = memo(function CachedImage({
  src,
  alt,
  className,
  placeholderClassName,
  fallback
}: CachedImageProps) {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageCache.has(src)) {
      setLoaded(true);
      setError(false);
      return;
    }

    setLoaded(false);
    setError(false);

    preloadImage(src)
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, [src]);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn("relative overflow-hidden", placeholderClassName)}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          imageCache.add(src);
          setLoaded(true);
        }}
        onError={() => setError(true)}
      />
    </div>
  );
});

export function isImageCached(src: string): boolean {
  return imageCache.has(src);
}
