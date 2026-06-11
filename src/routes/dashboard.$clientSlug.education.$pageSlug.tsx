import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { EducationBarChart, EducationLegend } from '@/components/education/EducationBarChart';
import { EducationAssetTables } from '@/components/education/EducationAssetTables';
import { getEducationPage, type EducationChart } from '@/api/education';
import { getClientBrands } from '@/api/clients';
import { sweepToSectionAfterNav } from '@/lib/scroll';

interface PeriodSearch {
  from?: string;
  to?: string;
}

/** First/last "YYYY-MM" with data across a chart's series; null when empty. */
function chartDataSpan(chart: EducationChart): { from: string; to: string } | null {
  const yms = chart.series
    .flatMap((s) => s.points)
    .map((p) => `${p.year}-${String(p.month).padStart(2, '0')}`);
  if (yms.length === 0) return null;
  return {
    from: yms.reduce((a, b) => (a < b ? a : b)),
    to: yms.reduce((a, b) => (a > b ? a : b)),
  };
}

export const Route = createFileRoute('/dashboard/$clientSlug/education/$pageSlug')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: EducationPageView,
});

function EducationPageView() {
  const { clientSlug, pageSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const page = useQuery({
    queryKey: ['education', 'page', clientSlug, pageSlug, from ?? '', to ?? ''],
    queryFn: () => getEducationPage(clientSlug, pageSlug, { from, to }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Already loaded by the client layout - cache hit. Brand colours highlight
  // the brand column of the asset tables.
  const { data: clientData } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });
  const brandColors = Object.fromEntries(
    (clientData?.brands ?? [])
      .filter((b) => b.color)
      .map((b) => [b.name.toLowerCase(), b.color!]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Back to the client overview, sweeping to its Education section -
            that section lists every education page, so it doubles as the picker. */}
        <Link
          to="/dashboard/$clientSlug"
          params={{ clientSlug }}
          search={{ from, to }}
          onClick={() => sweepToSectionAfterNav('education')}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← Overview
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ph-charcoal">
            {page.data?.page.name ?? 'Loading…'}
          </h1>
          {page.data && (
            <PeriodFilter
              period={page.data.period}
              onChange={(f, t) => navigate({ search: { from: f, to: t } })}
            />
          )}
        </div>
      </div>

      {page.isPending && <DashboardSkeleton />}
      {page.error && <DashboardError error={page.error} onRetry={() => page.refetch()} />}
      {page.data && page.data.charts.length === 0 && (
        <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
          This page has no charts yet.
        </div>
      )}
      {page.data &&
        page.data.charts.map((chart) => {
          // Clamp the axis to the chart's own data span: the window decides
          // which months are eligible (points are pre-filtered by the API),
          // but a wide window (e.g. All time spanning the asset tables'
          // history) shouldn't pad the chart with empty months.
          const span = chartDataSpan(chart);
          return (
            <Card key={chart.id}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
                {chart.subtitle && <CardDescription>{chart.subtitle}</CardDescription>}
              </CardHeader>
              <CardContent>
                {chart.series.length === 0 || span === null ? (
                  <p className="py-8 text-center text-sm text-ph-charcoal/50">No data for this period.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
                    <EducationBarChart
                      series={chart.series}
                      annotations={chart.annotations}
                      from={span.from}
                      to={span.to}
                    />
                    <div className="lg:max-h-[360px] lg:overflow-y-auto">
                      <EducationLegend series={chart.series} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

      {page.data && (
        <EducationAssetTables
          assets={page.data.assets}
          from={page.data.period.from}
          to={page.data.period.to}
          brandColors={brandColors}
        />
      )}
    </div>
  );
}
