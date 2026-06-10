import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { BrandMonthlyChart } from '@/components/dashboard/BrandMonthlyChart';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getMyClients } from '@/api/clients';
import { getClientSummary, type SummaryRow } from '@/api/summary';
import { getEducationPages, type EducationPageSummary } from '@/api/education';
import {
  TOUCHPOINT_KEYS,
  ENGAGEMENT_KEYS,
  sumKeys,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  pctOfTarget,
} from '@/lib/metrics';

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

function attainmentColour(pct: number): string {
  if (pct >= 1) return 'text-emerald-600';
  if (pct >= 0.85) return 'text-amber-600';
  return 'text-rose-600';
}

function ClientOverviewPage() {
  const { clientSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();
  const period = { from, to };

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

  const { data: eduPages = [] } = useQuery({
    queryKey: ['education', 'pages', clientSlug],
    queryFn: () => getEducationPages(clientSlug),
    staleTime: 30 * 1000,
  });

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
            {summary.data?.client.name ?? 'Loading…'}
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
          <BrandAudienceRollup clientSlug={clientSlug} rows={summary.data.byBrandAudience} period={period} />
          {eduPages.length > 0 && (
            <EducationLinks clientSlug={clientSlug} pages={eduPages} period={period} />
          )}
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
            rows={summary.data.byPublisher}
            showChart={summary.data.showPublisherChart && !summary.data.isPlan}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isPlan ? `FY${summary.year} plan notes` : `FY${summary.year} results summary`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ph-charcoal/80">
          {summary.text}
        </p>
      </CardContent>
    </Card>
  );
}

function BrandAudienceRollup({
  clientSlug,
  rows,
  period,
}: {
  clientSlug: string;
  rows: SummaryRow[];
  period: PeriodSearch;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brands &amp; audiences</CardTitle>
        <CardDescription>Select one to view its performance dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const touchpoints = sumKeys(r.metrics, TOUCHPOINT_KEYS);
            const target = sumKeys(r.targetMetrics, TOUCHPOINT_KEYS);
            const engagements = sumKeys(r.metrics, ENGAGEMENT_KEYS);
            const spend = r.mediaCost + r.cpdInvestmentCost;
            const pct = target > 0 ? pctOfTarget(touchpoints, target) : null;
            return (
              <Link
                key={r.label}
                to="/dashboard/$clientSlug/$brandSlug/$audienceSlug"
                params={{ clientSlug, brandSlug: r.brandSlug!, audienceSlug: r.audienceSlug! }}
                search={period}
                className="rounded-lg border border-ph-charcoal/10 p-4 transition-colors hover:border-client-primary"
              >
                <div className="text-sm font-semibold text-ph-charcoal">{r.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Touchpoints" value={formatNumber(touchpoints)} />
                  <Stat label="Engagements" value={formatNumber(engagements)} />
                  <Stat label="Spend" value={formatCurrency(spend)} />
                  <Stat
                    label="% of KPI"
                    value={pct != null ? formatPercent(pct) : '—'}
                    className={pct != null ? attainmentColour(pct) : undefined}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EducationLinks({
  clientSlug,
  pages,
  period,
}: {
  clientSlug: string;
  pages: EducationPageSummary[];
  period: PeriodSearch;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>CPD and module completion dashboards.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.id}
              to="/dashboard/$clientSlug/education/$pageSlug"
              params={{ clientSlug, pageSlug: p.slug }}
              search={period}
              className="rounded-lg border border-ph-charcoal/10 p-4 transition-colors hover:border-client-primary"
            >
              <div className="text-sm font-semibold text-ph-charcoal">{p.name}</div>
              <div className="mt-1 text-xs text-ph-charcoal/50">
                {p.chartCount} {p.chartCount === 1 ? 'chart' : 'charts'}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** "Australian Journal of Pharmacy" → "AJP"; single-word names stay as-is. */
function publisherAbbrev(label: string): string {
  const words = label.split(' ');
  if (words.length === 1) return label;
  return words
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join('');
}

function PublisherPerformance({ rows, showChart }: { rows: SummaryRow[]; showChart: boolean }) {
  const chartData = rows.map((r) => ({
    name: r.label,
    touchpoints: sumKeys(r.metrics, TOUCHPOINT_KEYS),
    engagements: sumKeys(r.metrics, ENGAGEMENT_KEYS),
  }));
  const money = (v: number) =>
    v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publisher performance</CardTitle>
        <CardDescription>Touchpoints, engagements and spend (incl. CPD) by publisher.</CardDescription>
      </CardHeader>
      <CardContent>
        {showChart && (
          <div className="mb-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#454646"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tickFormatter={publisherAbbrev}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#454646"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(v as number)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#454646"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(v as number)}
                />
                <Tooltip
                  formatter={(v) => (v as number).toLocaleString('en-AU')}
                  contentStyle={{
                    borderRadius: 3,
                    border: '1px solid rgba(69, 70, 70, 0.1)',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="touchpoints" name="Touchpoints" fill="#6b7280" maxBarSize={36} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="engagements"
                  name="Engagements"
                  stroke="#a21caf"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 text-right font-medium">Placements</th>
                <th className="py-2 pr-4 text-right font-medium">Touchpoints</th>
                <th className="py-2 pr-4 text-right font-medium">Engagements</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 pr-4 text-right font-medium">Planned</th>
                <th className="py-2 pr-4 text-right font-medium">CPM</th>
                <th className="py-2 text-right font-medium">CPE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const spend = r.mediaCost + r.cpdInvestmentCost;
                const touchpoints = sumKeys(r.metrics, TOUCHPOINT_KEYS);
                const engagements = sumKeys(r.metrics, ENGAGEMENT_KEYS);
                return (
                  <tr key={r.label} className="border-b border-ph-charcoal/5 last:border-0">
                    <td className="py-2 pr-4 font-medium text-ph-charcoal">{r.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{r.placementCount}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{formatNumber(touchpoints)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{formatNumber(engagements)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{formatCurrency(spend)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/60">
                      {r.plannedMediaCost != null ? formatCurrency(r.plannedMediaCost) : '-'}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                      {touchpoints > 0 ? money(spend / (touchpoints / 1000)) : '-'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                      {engagements > 0 ? money(spend / engagements) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-ph-charcoal/45">{label}</div>
      <div className={`font-semibold tabular-nums ${className ?? 'text-ph-charcoal/80'}`}>{value}</div>
    </div>
  );
}
