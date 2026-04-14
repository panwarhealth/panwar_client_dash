import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { getMe, logout, type MeResponse } from '@/api/auth';

const ME_QUERY_KEY = ['me'] as const;

/**
 * Fetches the current user from /api/auth/me. Returns null when not signed in
 * (401), or the MeResponse on success. Client-specific branding moves to
 * per-client context (see hooks/useClientBranding) because a user can belong
 * to multiple clients.
 */
export function useAuth() {
  const query = useQuery<MeResponse | null, Error>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Logout clears the cookie + bounces to /login. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      window.location.href = '/login';
    },
  });
}
