// Simple image optimization utilities based on best practices
export function optimizeImageUrl(originalUrl: string, width = 320, height = 192): string {
  // Check if it's an Unsplash URL and optimize it
  if (originalUrl.includes('images.unsplash.com')) {
    const baseUrl = originalUrl.split('?')[0];
    return `${baseUrl}?w=${width}&h=${height}&fit=crop&fm=webp&q=80`;
  }
  
  // For other URLs, return as-is (in production, you'd use a CDN service)
  return originalUrl;
}

export function getPlaceholderSvg(width = 320, height = 192, text = 'Restaurant Image'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-family='sans-serif' font-size='14'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
}

// Preload critical images for better performance
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
}

// Preload multiple images with limited concurrency
export async function preloadImages(urls: string[], maxConcurrent = 3): Promise<void> {
  const chunks = [];
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage));
  }
}