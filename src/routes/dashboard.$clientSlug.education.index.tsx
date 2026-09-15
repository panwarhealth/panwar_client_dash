import { createFileRoute } from '@tanstack/react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { EducationChartCard } from '@/components/education/EducationChartCard';
import { EducationAssetTables } from '@/components/education/EducationAssetTables';
import { getEducationPage, getEducationPages } from '@/api/education';
import { getClientBrands } from '@/api/clients';

interface PeriodSearch {
  from?: string;
  to?: string;
}

export const Route = createFileRoute('/dashboard/$clientSlug/education/')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: EducationResults,
});

function EducationResults() {
  const { clientSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const pages = useQuery({
    queryKey: ['education', 'pages', clientSlug],
    queryFn: () => getEducationPages(clientSlug),
    staleTime: 60 * 1000,
  });
  const { data: clientData } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });
  const brandColors = Object.fromEntries(
    (clientData?.brands ?? []).filter((b) => b.color).map((b) => [b.name.toLowerCase(), b.color!]),
  );

  const details = useQueries({
    queries: (pages.data ?? []).map((p) => ({
      queryKey: ['education', 'page', clientSlug, p.slug, from ?? '', to ?? ''],
      queryFn: () => getEducationPage(clientSlug, p.slug, { from, to }),
      staleTime: 0,
      refetchOnWindowFocus: true,
    })),
  });
  const first = details.find((d) => d.data)?.data;
  const loaded = details.filter((d) => d.data).map((d) => d.data!);
  const withContent = loaded.filter((d) => d.charts.length > 0 || d.assets.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ph-charcoal">Education Results</h1>
        {first && (
          <PeriodFilter period={first.period} onChange={(f, t) => navigate({ search: { from: f, to: t } })} />
        )}
      </div>

      {pages.isPending && <DashboardSkeleton />}
      {pages.error && <DashboardError error={pages.error} onRetry={() => pages.refetch()} />}
      {pages.data && pages.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
          No education dashboards are available yet.
        </div>
      )}
      {details.map((d, i) =>
        d.error ? <DashboardError key={pages.data?.[i]?.id ?? i} error={d.error} onRetry={() => d.refetch()} /> : null,
      )}
      {withContent.map((d) => (
        <section key={d.page.id} className="flex flex-col gap-6">
          {withContent.length > 1 && <h2 className="text-lg font-semibold text-ph-charcoal">{d.page.name}</h2>}
          {d.charts.map((chart) => (
            <EducationChartCard key={chart.id} chart={chart} />
          ))}
          <EducationAssetTables assets={d.assets} from={d.period.from} to={d.period.to} brandColors={brandColors} />
        </section>
      ))}
    </div>
  );
}
