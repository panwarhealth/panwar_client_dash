import { Link, Outlet, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { getClientBrands } from '@/api/clients';

/**
 * Authed shell layout for /dashboard/* routes. Header adapts to the current
 * route: if we're inside a client (/dashboard/{clientSlug}/...) it shows that
 * client's logo and name; on the client picker it shows PH branding.
 */
export function DashboardShell() {
  const { user } = useAuth();
  const logout = useLogout();

  // `clientSlug` is only present on client-scoped routes
  const params = useParams({ strict: false }) as { clientSlug?: string };
  const clientSlug = params.clientSlug;

  const clientQuery = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug!),
    enabled: !!clientSlug,
    staleTime: 60 * 1000,
  });

  const client = clientQuery.data?.client;

  return (
    <div className="flex min-h-screen flex-col bg-ph-charcoal/[0.02]">
      <header className="border-b border-ph-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            {client?.logoUrl ? (
              <img src={client.logoUrl} alt={client.name} className="h-9 w-auto" />
            ) : client ? (
              <div
                className="flex h-9 w-9 items-center justify-center rounded font-semibold text-white"
                style={{ backgroundColor: client.primaryColor ?? '#702f8f' }}
              >
                {client.name.charAt(0)}
              </div>
            ) : (
              <img src="/ph-logo.webp" alt="Panwar Health" className="h-9 w-auto" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ph-charcoal">
                {client?.name ?? 'Panwar Health'}
              </span>
              <span className="text-xs text-ph-charcoal/60">Media Performance</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ph-charcoal/70 sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
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
          Powered by <span className="font-medium text-ph-purple">Panwar Health</span>
        </div>
      </footer>
    </div>
  );
}
