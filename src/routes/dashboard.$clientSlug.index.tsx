import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getMyClients } from '@/api/clients';
import { getClientSummary, type SummaryRow } from '@/api/summary';
import {
  TOUCHPOINT_KEYS,
  ENGAGEMENT_KEYS,
  sumKeys,
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
          <h1 className="text-2xl font-semibold text-ph-charcoal">
            {summary.data?.client.name ?? 'Loading…'}
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
          <SummaryBanner totals={summary.data.totals} />
          <BrandAudienceRollup clientSlug={clientSlug} rows={summary.data.byBrandAudience} />
          <PublisherCostSummary rows={summary.data.byPublisher} />
        </div>
      )}
    </div>
  );
}

function BrandAudienceRollup({ clientSlug, rows }: { clientSlug: string; rows: SummaryRow[] }) {
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

function PublisherCostSummary({ rows }: { rows: SummaryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by publisher</CardTitle>
        <CardDescription>Spend (incl. CPD) versus planned, by publisher.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 text-right font-medium">Placements</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 pr-4 text-right font-medium">Planned</th>
                <th className="py-2 text-right font-medium">Touchpoints</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const spend = r.mediaCost + r.cpdInvestmentCost;
                return (
                  <tr key={r.label} className="border-b border-ph-charcoal/5 last:border-0">
                    <td className="py-2 pr-4 font-medium text-ph-charcoal">{r.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{r.placementCount}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{formatCurrency(spend)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/60">
                      {r.plannedMediaCost != null ? formatCurrency(r.plannedMediaCost) : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                      {formatNumber(sumKeys(r.metrics, TOUCHPOINT_KEYS))}
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
