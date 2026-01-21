import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface RestaurantOwner {
  id: number;
  email: string;
  companyName: string;
  isVerified: boolean;
  isActive: boolean;
  contactPersonName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export function useRestaurantAuth() {
  const { data: owner, isLoading, error, refetch } = useQuery<RestaurantOwner>({
    queryKey: ["/api/restaurant-portal/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    gcTime: 0,
    // Force refetch every 100ms during loading to catch auth state changes quickly
    refetchIntervalInBackground: false,
  });

  return {
    owner,
    isLoading,
    isRestaurantAuthenticated: !!owner,
    error,
    refetch,
  };
}