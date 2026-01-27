import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from '@capacitor/core';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');
const IS_CROSS_ORIGIN = !!API_BASE_URL;

// Mobile session token storage key
const MOBILE_SESSION_TOKEN_KEY = 'eatoff_mobile_session_token';

// Get stored mobile session token
export function getMobileSessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(MOBILE_SESSION_TOKEN_KEY);
  }
  return null;
}

// Store mobile session token
export function setMobileSessionToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOBILE_SESSION_TOKEN_KEY, token);
  }
}

// Clear mobile session token
export function clearMobileSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MOBILE_SESSION_TOKEN_KEY);
  }
}

console.log('[QueryClient] Platform detection:', { isNativePlatform, API_BASE_URL, IS_CROSS_ORIGIN });

function getFullUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getMobileSessionToken();
  if (token && isNativePlatform) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
  };
  
  if (!IS_CROSS_ORIGIN) {
    fetchOptions.credentials = "include";
  }
  
  const res = await fetch(getFullUrl(url), fetchOptions);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = getAuthHeaders();
    const fetchOptions: RequestInit = {
      headers: authHeaders,
    };
    
    if (!IS_CROSS_ORIGIN) {
      fetchOptions.credentials = "include";
    }
    
    const res = await fetch(getFullUrl(queryKey[0] as string), fetchOptions);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
