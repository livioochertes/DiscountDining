import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export function usePendingPayments() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [newRequestAlert, setNewRequestAlert] = useState<any | null>(null);
  const previousIdsRef = useRef<Set<number>>(new Set());
  const initialLoadRef = useRef(true);

  const isOnWalletPage = location.startsWith('/m/wallet');

  const { data: pendingRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/wallet/pending-requests'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!pendingRequests || pendingRequests.length === 0) {
      previousIdsRef.current = new Set();
      initialLoadRef.current = true;
      return;
    }

    const currentIds = new Set(pendingRequests.map((r: any) => r.id));

    if (initialLoadRef.current) {
      previousIdsRef.current = currentIds;
      initialLoadRef.current = false;
      if (!isOnWalletPage && pendingRequests.length > 0) {
        setNewRequestAlert(pendingRequests[0]);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
      return;
    }

    const newRequests = pendingRequests.filter((r: any) => !previousIdsRef.current.has(r.id));
    previousIdsRef.current = currentIds;

    if (newRequests.length > 0 && !isOnWalletPage) {
      setNewRequestAlert(newRequests[0]);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [pendingRequests, isOnWalletPage]);

  useEffect(() => {
    if (isOnWalletPage && newRequestAlert) {
      setNewRequestAlert(null);
    }
  }, [isOnWalletPage, newRequestAlert]);

  const dismissAlert = useCallback(() => setNewRequestAlert(null), []);

  return {
    pendingCount: pendingRequests?.length || 0,
    pendingRequests: pendingRequests || [],
    newRequestAlert,
    dismissAlert,
  };
}
