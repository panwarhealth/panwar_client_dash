import { createFileRoute, redirect } from '@tanstack/react-router';
import { ApiError } from '@/api/client';
import { getMe } from '@/api/auth';
import { DashboardShell } from '@/components/DashboardShell';

/**
 * Authed shell layout. Every /dashboard/* route renders inside this shell.
 * The beforeLoad guard runs /api/auth/me and redirects to /login on 401,
 * so child routes can assume there's an authenticated user.
 */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    try {
      const me = await context.queryClient.fetchQuery({
        queryKey: ['me'],
        queryFn: getMe,
        staleTime: 5 * 60 * 1000,
      });
      return { me };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: '/login' });
      }
      throw error;
    }
  },
  component: DashboardShell,
});
