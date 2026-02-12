import { Capacitor } from '@capacitor/core';

export type AppMode = 'client' | 'restaurant';

export function getAppMode(): AppMode {
  if (typeof window !== 'undefined' && (window as any).__EATOFF_APP_MODE__ === 'restaurant') {
    return 'restaurant';
  }
  
  if (Capacitor.isNativePlatform()) {
    const appId = (Capacitor as any).config?.appId || '';
    if (appId.includes('restaurant')) {
      return 'restaurant';
    }
  }
  
  return 'client';
}

export function isRestaurantApp(): boolean {
  return getAppMode() === 'restaurant';
}
