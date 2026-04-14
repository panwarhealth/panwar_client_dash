import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { PublisherTable } from '@/components/dashboard/PublisherTable';
import { PlacementTable } from '@/components/dashboard/PlacementTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { AudienceTabs } from '@/components/picker/AudienceTabs';
import { getClientBrands } from '@/api/clients';
import { getDashboard, type DashboardResponse } from '@/api/dashboard';
import { ENGAGEMENT_KEYS, TOUCHPOINT_KEYS, formatCurrency, sumKeys } from '@/lib/metrics';

export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/$audienceSlug')({
  component: BrandAudienceDashboard,
});

function BrandAudienceDashboard() {
  const { clientSlug, brandSlug, audienceSlug } = Route.useParams();

  const dashboard = useQuery({
    queryKey: ['dashboard', clientSlug, brandSlug, audienceSlug],
    queryFn: () => getDashboard(clientSlug, brandSlug, audienceSlug),
  });

  const brands = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard/$clientSlug/$brandSlug"
          params={{ clientSlug, brandSlug }}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← Brand overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">
          {dashboard.data
            ? `${dashboard.data.brand.name} · ${dashboard.data.audience.name}`
            : 'Loading…'}
        </h1>
        {dashboard.data && (
          <p className="mt-1 text-sm text-ph-charcoal/70">
            YTD performance for {dashboard.data.year}.
          </p>
        )}
      </div>

      {brands.data && brands.data.audiences.length > 1 && (
        <AudienceTabs
          clientSlug={clientSlug}
          brandSlug={brandSlug}
          audiences={brands.data.audiences}
          activeAudienceSlug={audienceSlug}
        />
      )}

      {dashboard.isPending && <DashboardSkeleton />}
      {dashboard.error && (
        <DashboardError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      )}
      {dashboard.data && <DashboardBody data={dashboard.data} />}
    </div>
  );
}

function DashboardBody({ data }: { data: DashboardResponse }) {
  const touchpoints = sumKeys(data.totals.metrics, TOUCHPOINT_KEYS);
  const engagements = sumKeys(data.totals.metrics, ENGAGEMENT_KEYS);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Placements" value={data.totals.placementCount.toLocaleString('en-AU')} />
        <KpiCard label="YTD spend" value={formatCurrency(data.totals.mediaCost)} />
        <KpiCard label="Touchpoints" value={touchpoints.toLocaleString('en-AU')} />
        <KpiCard label="Engagements" value={engagements.toLocaleString('en-AU')} />
      </div>
      <MonthlyChart monthly={data.monthly} />
      <PublisherTable publishers={data.publishers} />
      <PlacementTable placements={data.placements} />
    </div>
  );
}
