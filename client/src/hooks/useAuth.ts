import { useQuery } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<Customer>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always refetch to get latest auth state
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false, // Disable background refetching for faster manual updates
    gcTime: 0, // Clear from cache immediately when stale
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
  };
}