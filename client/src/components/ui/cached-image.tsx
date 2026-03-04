import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/queryClient';

const imageCache = new Set<string>();
const loadingImages = new Map<string, Promise<void>>();

function preloadImage(src: string): Promise<void> {
  const resolvedSrc = getImageUrl(src);
  if (imageCache.has(resolvedSrc)) {
    return Promise.resolve();
  }
  
  if (loadingImages.has(resolvedSrc)) {
    return loadingImages.get(resolvedSrc)!;
  }
  
  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(resolvedSrc);
      loadingImages.delete(resolvedSrc);
      resolve();
    };
    img.onerror = () => {
      loadingImages.delete(resolvedSrc);
      reject();
    };
    img.src = resolvedSrc;
  });
  
  loadingImages.set(resolvedSrc, promise);
  return promise;
}

export function preloadImages(urls: string[]) {
  urls.forEach(url => {
    if (url) {
      const resolved = getImageUrl(url);
      if (!imageCache.has(resolved)) {
        preloadImage(url).catch(() => {});
      }
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
  const resolvedSrc = getImageUrl(src);
  const [loaded, setLoaded] = useState(() => imageCache.has(resolvedSrc));
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageCache.has(resolvedSrc)) {
      setLoaded(true);
      setError(false);
      return;
    }

    setLoaded(false);
    setError(false);

    preloadImage(resolvedSrc)
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, [resolvedSrc]);

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
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          imageCache.add(resolvedSrc);
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
