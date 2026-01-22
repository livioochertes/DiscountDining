import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', checkMobile);
    checkMobile();

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export function useIsCapacitor(): boolean {
  if (typeof window !== 'undefined') {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  }
  return false;
}

export function useIsMobileApp(): boolean {
  const isMobile = useIsMobile();
  const isCapacitor = useIsCapacitor();
  return isMobile || isCapacitor;
}
