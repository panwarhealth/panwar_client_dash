import { createFileRoute, Link, Outlet, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getClientBrands } from '@/api/clients';
import { getEducationPages } from '@/api/education';
import { useClientBranding } from '@/hooks/useClientBranding';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/$clientSlug')({
  loader: async ({ context, params }) => {
    return context.queryClient.fetchQuery({
      queryKey: ['client', params.clientSlug],
      queryFn: () => getClientBrands(params.clientSlug),
      staleTime: 60 * 1000,
    });
  },
  component: ClientLayout,
});

function ClientLayout() {
  const { clientSlug } = Route.useParams();
  const search = useSearch({ strict: false }) as { from?: string; to?: string };
  const period = { from: search.from, to: search.to };

  const { data } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });
  const { data: eduPages = [] } = useQuery({
    queryKey: ['education', 'pages', clientSlug],
    queryFn: () => getEducationPages(clientSlug),
    staleTime: 60 * 1000,
  });

  useClientBranding(data?.client ?? null);

  const brands = (data?.brands ?? []).filter((b) => b.audienceSlugs.length > 0);
  const tab =
    'whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors';
  const idle = 'border-transparent text-ph-charcoal/55 hover:border-ph-charcoal/25 hover:text-ph-charcoal';
  const active = 'border-client-primary text-client-primary';

  return (
    <div className="flex flex-col gap-6">
      <nav className="-mb-px flex overflow-x-auto border-b border-ph-charcoal/10" aria-label="Dashboard sections">
        <Link
          to="/dashboard/$clientSlug"
          params={{ clientSlug }}
          search={period}
          activeOptions={{ exact: true, includeSearch: false }}
          className={cn(tab, idle)}
          activeProps={{ className: cn(tab, active) }}
        >
          YTD Overview
        </Link>
        {brands.map((b) => (
          <Link
            key={b.id}
            to="/dashboard/$clientSlug/$brandSlug"
            params={{ clientSlug, brandSlug: b.slug }}
            search={period}
            activeOptions={{ includeSearch: false }}
            className={cn(tab, idle)}
            activeProps={{ className: cn(tab, active) }}
          >
            {b.name}
          </Link>
        ))}
        {eduPages.length > 0 && (
          <Link
            to="/dashboard/$clientSlug/education"
            params={{ clientSlug }}
            search={period}
            activeOptions={{ includeSearch: false }}
            className={cn(tab, idle)}
            activeProps={{ className: cn(tab, active) }}
          >
            Education Results
          </Link>
        )}
        <Link
          to="/dashboard/$clientSlug/assets"
          params={{ clientSlug }}
          search={period}
          activeOptions={{ includeSearch: false }}
          className={cn(tab, idle)}
          activeProps={{ className: cn(tab, active) }}
        >
          Summary by Asset
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
