import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError } from '@/api/client';
import { getMe, logout, type MeResponse } from '@/api/auth';
import { hexToRgbString } from '@/lib/utils';

const ME_QUERY_KEY = ['me'] as const;

/**
 * Fetches the current user from /api/auth/me. Returns undefined while loading,
 * null when not signed in (401), or the MeResponse object on success.
 *
 * Side effect: when a `clientPrimaryColor` / `clientAccentColor` is present,
 * we paint them onto the document root as CSS variables so the per-client
 * Tailwind colours (bg-client-primary, etc.) take effect everywhere.
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Apply per-client branding to the document root whenever /me changes.
  useEffect(() => {
    const me = query.data;
    if (!me) return;
    const root = document.documentElement;
    const primary = hexToRgbString(me.clientPrimaryColor);
    const accent = hexToRgbString(me.clientAccentColor);
    if (primary) root.style.setProperty('--client-primary', primary);
    if (accent) root.style.setProperty('--client-accent', accent);
  }, [query.data]);

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Logout mutation that clears the cookie + invalidates the /me cache. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
    },
  });
}
