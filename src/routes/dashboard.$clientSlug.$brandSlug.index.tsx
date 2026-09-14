import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PlacementCards } from '@/components/dashboard/PlacementCards';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { BrandMonthlyPerformance } from '@/components/dashboard/BrandMonthlyPerformance';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getClientBrands } from '@/api/clients';
import { getClientSummary } from '@/api/summary';

interface PeriodSearch {
  from?: string;
  to?: string;
}

export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: BrandPage,
});

function BrandPage() {
  const { clientSlug, brandSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: clientData } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });
  const brand = clientData?.brands.find((b) => b.slug === brandSlug);
  const audiences = clientData?.audiences.filter((a) => brand?.audienceSlugs.includes(a.slug)) ?? [];

  const summary = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', brandSlug, ''],
    queryFn: () => getClientSummary(clientSlug, { from, to, brand: brandSlug }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ph-charcoal">
          {brand?.name ?? brandSlug}
          {summary.data?.isPlan && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Plan
            </span>
          )}
        </h1>
        {summary.data && (
          <PeriodFilter
            period={summary.data.period}
            onChange={(f, t) => navigate({ search: { from: f, to: t } })}
          />
        )}
      </div>

      {summary.isPending && <DashboardSkeleton />}
      {summary.error && <DashboardError error={summary.error} onRetry={() => summary.refetch()} />}
      {summary.data && (
        <div className="flex flex-col gap-6">
          <SummaryBanner totals={summary.data.totals} isPlan={summary.data.isPlan} />
          {summary.data.showBrandMonthlyChart && !summary.data.isPlan && summary.data.placements.length > 0 && (
            <BrandMonthlyPerformance
              placements={summary.data.placements}
              from={summary.data.period.from}
              to={summary.data.period.to}
              color={brand?.color}
            />
          )}
          {audiences.map((a) => {
            const cards = summary.data.placements.filter((p) => p.audienceSlug === a.slug);
            if (cards.length === 0) return null;
            return (
              <section key={a.slug} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-ph-charcoal">{a.name}</h2>
                <PlacementCards placements={cards} isPlan={summary.data.isPlan} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
