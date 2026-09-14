import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { BrandMonthlyChart } from '@/components/dashboard/BrandMonthlyChart';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getClientBrands, getMyClients } from '@/api/clients';
import { BrandPerformance } from '@/components/dashboard/BrandPerformance';
import { AudiencePerformance } from '@/components/dashboard/AudiencePerformance';
import { PublisherPerformance } from '@/components/dashboard/PublisherPerformance';
import { DimensionPerformance } from '@/components/dashboard/DimensionPerformance';
import { getClientSummary } from '@/api/summary';

interface PeriodSearch {
  from?: string;
  to?: string;
}

export const Route = createFileRoute('/dashboard/$clientSlug/')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: ClientOverviewPage,
});

function ClientOverviewPage() {
  const { clientSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const summary = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? ''],
    queryFn: () => getClientSummary(clientSlug, { from, to }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: myClients = [] } = useQuery({
    queryKey: ['my', 'clients'],
    queryFn: getMyClients,
    staleTime: 60 * 1000,
  });
  const showBackLink = myClients.length > 1;

  const { data: clientData } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });
  const audiences = clientData?.audiences ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        {showBackLink && (
          <Link
            to="/dashboard"
            className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
          >
            ← All clients
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ph-charcoal">
            YTD Overview
            {summary.data?.isPlan && <PlanBadge />}
          </h1>
          {summary.data && (
            <PeriodFilter
              period={summary.data.period}
              onChange={(f, t) => navigate({ search: { from: f, to: t } })}
            />
          )}
        </div>
      </div>

      {summary.isPending && <DashboardSkeleton />}
      {summary.error && <DashboardError error={summary.error} onRetry={() => summary.refetch()} />}
      {summary.data && (
        <div className="flex flex-col gap-6">
          <SummaryBanner totals={summary.data.totals} isPlan={summary.data.isPlan} />
          {summary.data.summary && (
            <YearSummaryCard summary={summary.data.summary} isPlan={summary.data.isPlan} />
          )}
          <BrandPerformance
            clientSlug={clientSlug}
            from={from}
            to={to}
            summary={summary.data}
            audiences={audiences}
          />
          <AudiencePerformance summary={summary.data} audiences={audiences} />
          {summary.data.showBrandMonthlyChart &&
            !summary.data.isPlan &&
            summary.data.monthlyByBrand.length > 0 && (
              <BrandMonthlyChart
                brands={summary.data.monthlyByBrand}
                from={summary.data.period.from}
                to={summary.data.period.to}
              />
            )}
          <PublisherPerformance
            clientSlug={clientSlug}
            from={from}
            to={to}
            summary={summary.data}
            audiences={audiences}
          />

          <DimensionPerformance
            clientSlug={clientSlug}
            from={from}
            to={to}
            summary={summary.data}
            audiences={audiences}
            dimension="byCategory"
            title="Category performance"
            subtitle="Touchpoints, engagements and spend by category."
            dimensionLabel="Category"
          />

          <DimensionPerformance
            clientSlug={clientSlug}
            from={from}
            to={to}
            summary={summary.data}
            audiences={audiences}
            dimension="byDigitalFormat"
            title="Digital format performance"
            subtitle="Touchpoints, engagements and spend by digital format."
            dimensionLabel="Format"
          />

        </div>
      )}
    </div>
  );
}

function PlanBadge() {
  return (
    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
      Plan
    </span>
  );
}

function YearSummaryCard({
  summary,
  isPlan,
}: {
  summary: { year: number; text: string };
  isPlan: boolean;
}) {
  // The summary is authored as blank-line-separated chunks (Overall /
  // Pharmacists / GPs / recommendations); render each as its own paragraph.
  const sections = summary.text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isPlan ? `FY${summary.year} plan notes` : `FY${summary.year} results summary`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Full-width prose with extra top + bottom breathing room so it
            separates from the title and the card edge. Horizontal padding stays
            at the card default so it lines up with the other cards' content. */}
        <div className="flex flex-col gap-5 pb-3 pt-4">
          {sections.map((s, i) => (
            <p key={i} className="whitespace-pre-line text-[15px] leading-[1.75] text-ph-charcoal/90">
              {s}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
