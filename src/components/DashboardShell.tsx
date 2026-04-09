import { Link, Outlet } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useLogout } from '@/hooks/useAuth';

/**
 * Layout for the authenticated client dashboard. Branded header uses the
 * client's logo + primary colour pulled from /api/auth/me. The same React
 * components paint themselves with whichever client's colours are loaded.
 */
export function DashboardShell() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col bg-ph-charcoal/[0.02]">
      <header className="border-b border-ph-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            {user?.clientLogoUrl ? (
              <img src={user.clientLogoUrl} alt={user.clientName ?? ''} className="h-9 w-auto" />
            ) : (
              <div className="h-9 w-9 rounded-md bg-client-primary" aria-hidden />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ph-charcoal">
                {user?.clientName ?? 'Dashboard'}
              </span>
              <span className="text-xs text-ph-charcoal/60">Media Performance</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ph-charcoal/70 sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout.mutate();
              }}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-ph-charcoal/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-ph-charcoal/50">
          Powered by{' '}
          <span className="font-medium text-ph-purple">Panwar Health</span>
        </div>
      </footer>
    </div>
  );
}
