import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { PublisherTable } from '@/components/dashboard/PublisherTable';
import { PlacementCards } from '@/components/dashboard/PlacementCards';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { AudienceTabs } from '@/components/picker/AudienceTabs';
import { getClientBrands } from '@/api/clients';
import { getDashboard } from '@/api/dashboard';

interface PeriodSearch {
  from?: string;
  to?: string;
}

export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/$audienceSlug')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: BrandAudienceDashboard,
});

function BrandAudienceDashboard() {
  const { clientSlug, brandSlug, audienceSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const dashboard = useQuery({
    queryKey: ['dashboard', clientSlug, brandSlug, audienceSlug, from ?? '', to ?? ''],
    queryFn: () => getDashboard(clientSlug, brandSlug, audienceSlug, { from, to }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const brands = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  const brand = brands.data?.brands.find((b) => b.slug === brandSlug);
  const availableAudiences =
    brands.data?.audiences.filter((a) => brand?.audienceSlugs.includes(a.slug)) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        {availableAudiences.length > 1 ? (
          <Link
            to="/dashboard/$clientSlug/$brandSlug"
            params={{ clientSlug, brandSlug }}
            search={{ from, to }}
            className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
          >
            ← Brand overview
          </Link>
        ) : (
          <Link
            to="/dashboard/$clientSlug"
            params={{ clientSlug }}
            search={{ from, to }}
            className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
          >
            ← All brands
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ph-charcoal">
            {dashboard.data
              ? `${dashboard.data.brand.name} · ${dashboard.data.audience.name}`
              : 'Loading…'}
            {dashboard.data?.isPlan && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Plan
              </span>
            )}
          </h1>
          {dashboard.data && (
            <PeriodFilter
              period={dashboard.data.period}
              onChange={(f, t) => navigate({ search: { from: f, to: t } })}
            />
          )}
        </div>
      </div>

      {availableAudiences.length > 1 && (
        <AudienceTabs
          clientSlug={clientSlug}
          brandSlug={brandSlug}
          audiences={availableAudiences}
          activeAudienceSlug={audienceSlug}
          period={{ from, to }}
        />
      )}

      {dashboard.isPending && <DashboardSkeleton />}
      {dashboard.error && (
        <DashboardError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      )}
      {dashboard.data && (
        <div className="flex flex-col gap-6">
          <SummaryBanner totals={dashboard.data.totals} isPlan={dashboard.data.isPlan} />
          {!dashboard.data.isPlan && <MonthlyChart monthly={dashboard.data.monthly} />}
          <PublisherTable publishers={dashboard.data.publishers} />
          <PlacementCards placements={dashboard.data.placements} isPlan={dashboard.data.isPlan} />
        </div>
      )}
    </div>
  );
}
