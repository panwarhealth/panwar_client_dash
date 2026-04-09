import { createFileRoute, redirect } from '@tanstack/react-router';
import { ApiError } from '@/api/client';
import { getMe } from '@/api/auth';

/**
 * Root landing page. Redirects to /dashboard if signed in, /login if not.
 * Uses the loader so the redirect happens BEFORE React renders an empty
 * intermediate state.
 */
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      await getMe();
      throw redirect({ to: '/dashboard' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: '/login' });
      }
      throw error;
    }
  },
});
