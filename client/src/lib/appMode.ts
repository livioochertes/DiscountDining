import { Capacitor } from '@capacitor/core';

export type AppMode = 'client' | 'restaurant';

let nativeMode: AppMode | null = null;

export function getAppMode(): AppMode {
  if (nativeMode) return nativeMode;

  if (typeof window !== 'undefined' && (window as any).__EATOFF_APP_MODE__ === 'restaurant') {
    nativeMode = 'restaurant';
    return 'restaurant';
  }
  
  if (Capacitor.isNativePlatform()) {
    const appId = (Capacitor as any).config?.appId || '';
    if (appId.includes('restaurant')) {
      nativeMode = 'restaurant';
      return 'restaurant';
    }
  }

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'restaurant') {
      (window as any).__EATOFF_APP_MODE__ = 'restaurant';
      nativeMode = 'restaurant';
      return 'restaurant';
    }
  }
  
  return 'client';
}

export function isRestaurantApp(): boolean {
  return getAppMode() === 'restaurant';
}
