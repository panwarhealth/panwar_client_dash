import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getClientBrands } from '@/api/clients';

interface PeriodSearch {
  from?: string;
  to?: string;
}

/**
 * Brand overview. For brands with exactly one populated audience, redirects
 * straight to it (no point landing on an empty picker). For brands with multiple
 * audiences, shows a picker. For brands with no populated audiences, shows the
 * empty state.
 */
export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  beforeLoad: async ({ context, params, search }) => {
    const data = await context.queryClient.fetchQuery({
      queryKey: ['client', params.clientSlug],
      queryFn: () => getClientBrands(params.clientSlug),
      staleTime: 60 * 1000,
    });
    const brand = data.brands.find((b) => b.slug === params.brandSlug);
    // Only auto-redirect when there is exactly one audience — preserves this
    // page as a real picker when there are multiple.
    if (brand?.audienceSlugs.length === 1) {
      throw redirect({
        to: '/dashboard/$clientSlug/$brandSlug/$audienceSlug',
        params: {
          clientSlug: params.clientSlug,
          brandSlug: params.brandSlug,
          audienceSlug: brand.audienceSlugs[0],
        },
        search,
      });
    }
  },
  component: BrandOverview,
});

function BrandOverview() {
  const { clientSlug, brandSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const { data } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  const brand = data?.brands.find((b) => b.slug === brandSlug);
  const availableAudiences =
    data?.audiences.filter((a) => brand?.audienceSlugs.includes(a.slug)) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard/$clientSlug"
          params={{ clientSlug }}
          search={{ from, to }}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← All brands
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">{brand?.name ?? brandSlug}</h1>
      </div>

      {availableAudiences.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableAudiences.map((a) => (
            <Link
              key={a.slug}
              to="/dashboard/$clientSlug/$brandSlug/$audienceSlug"
              params={{ clientSlug, brandSlug, audienceSlug: a.slug }}
              search={{ from, to }}
              className="rounded-lg border border-ph-charcoal/10 p-5 transition-colors hover:border-client-primary"
            >
              <div className="text-sm font-semibold text-ph-charcoal">{a.name}</div>
              <div className="mt-1 text-xs text-ph-charcoal/50">View performance dashboard</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
          No dashboards are available for this brand yet.
        </div>
      )}
    </div>
  );
}
