// Image optimization utility for better performance
export const optimizeImageUrl = (url: string, width = 320, height = 192): string => {
  if (!url) return '';
  
  // If it's already an Unsplash URL, optimize it
  if (url.includes('unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?w=${width}&h=${height}&fit=crop&fm=webp&q=80`;
  }
  
  // For other URLs, return as-is but could add other optimizations here
  return url;
};

// Generate fallback SVG placeholder
export const generateFallbackSvg = (name: string): string => {
  const encodedName = encodeURIComponent(name);
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="320" height="192" viewBox="0 0 320 192" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="system-ui, sans-serif" font-size="14" fill="#6b7280">
        ${encodedName}
      </text>
    </svg>
  `)}`;
};