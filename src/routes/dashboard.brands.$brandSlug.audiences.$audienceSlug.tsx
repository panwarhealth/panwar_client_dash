import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboard, type DashboardResponse } from '@/api/dashboard';

/**
 * Brand × audience dashboard — the main page type.
 *
 * Loads `/api/dashboards/{brandSlug}/{audienceSlug}`, then renders:
 *  - KPI cards (placement count, YTD spend, touchpoints, engagements)
 *  - Monthly touchpoints area chart
 *  - Per-publisher breakdown table
 *  - Per-placement detail table
 *
 * "Touchpoints" sums every reach metric (impressions/views/page_views) and
 * "Engagements" sums every action metric (clicks/opens/completions/downloads)
 * — these are the brief's preferred client-facing rollups since the underlying
 * metric mix differs between digital/print/sponsored content/education.
 */
export const Route = createFileRoute('/dashboard/brands/$brandSlug/audiences/$audienceSlug')({
  component: BrandAudienceDashboard,
});

const TOUCHPOINT_KEYS = ['impressions', 'views', 'page_views'] as const;
const ENGAGEMENT_KEYS = ['clicks', 'opens', 'completions', 'downloads'] as const;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function BrandAudienceDashboard() {
  const { brandSlug, audienceSlug } = Route.useParams();

  const query = useQuery({
    queryKey: ['dashboard', brandSlug, audienceSlug],
    queryFn: () => getDashboard(brandSlug, audienceSlug),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard/brands/$brandSlug"
          params={{ brandSlug }}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← Brand overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">
          {query.data ? `${query.data.brand.name} · ${query.data.audience.name}` : 'Loading…'}
        </h1>
        {query.data && (
          <p className="mt-1 text-sm text-ph-charcoal/70">
            YTD performance for {query.data.year}.
          </p>
        )}
      </div>

      {query.isPending && <DashboardSkeleton />}
      {query.error && <DashboardError error={query.error} onRetry={() => query.refetch()} />}
      {query.data && <DashboardBody data={query.data} />}
    </div>
  );
}

function DashboardBody({ data }: { data: DashboardResponse }) {
  const touchpoints = sumKeys(data.totals.metrics, TOUCHPOINT_KEYS);
  const engagements = sumKeys(data.totals.metrics, ENGAGEMENT_KEYS);

  const chartData = useMemo(
    () =>
      data.monthly.map((m) => ({
        month: MONTH_LABELS[m.month - 1] ?? String(m.month),
        touchpoints: sumKeys(m.metrics, TOUCHPOINT_KEYS),
      })),
    [data.monthly],
  );

  const primaryColor = useClientPrimaryColor();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Placements" value={data.totals.placementCount.toLocaleString('en-AU')} />
        <KpiCard label="YTD spend" value={formatCurrency(data.totals.mediaCost)} />
        <KpiCard label="Touchpoints" value={touchpoints.toLocaleString('en-AU')} />
        <KpiCard label="Engagements" value={engagements.toLocaleString('en-AU')} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly touchpoints</CardTitle>
          <CardDescription>
            Impressions, sponsored-content views and education page views, summed across every
            placement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="touchpointFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#454646"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#454646"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(v as number)}
                />
                <Tooltip
                  formatter={(v) => (v as number).toLocaleString('en-AU')}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(69, 70, 70, 0.1)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="touchpoints"
                  stroke={primaryColor}
                  strokeWidth={2}
                  fill="url(#touchpointFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <PublishersCard data={data} />
      <PlacementsCard data={data} />
    </div>
  );
}

function PublishersCard({ data }: { data: DashboardResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishers</CardTitle>
        <CardDescription>Spend and reach by publisher, sorted by spend.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 text-right font-medium">Placements</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 text-right font-medium">Touchpoints</th>
              </tr>
            </thead>
            <tbody>
              {data.publishers.map((p) => (
                <tr key={p.id} className="border-b border-ph-charcoal/5 last:border-0">
                  <td className="py-2 pr-4 font-medium text-ph-charcoal">{p.name}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {p.placementCount}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {formatCurrency(p.mediaCost)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.metrics, TOUCHPOINT_KEYS).toLocaleString('en-AU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PlacementsCard({ data }: { data: DashboardResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placements</CardTitle>
        <CardDescription>
          {data.placements.length} placements running across this brand × audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Placement</th>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 pr-4 text-right font-medium">Touchpoints</th>
                <th className="py-2 text-right font-medium">Engagements</th>
              </tr>
            </thead>
            <tbody>
              {data.placements.map((p) => (
                <tr key={p.id} className="border-b border-ph-charcoal/5 last:border-0">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-ph-charcoal">{p.name}</div>
                    {(p.isBonus || p.isCpdPackage) && (
                      <div className="mt-0.5 flex gap-1 text-[10px] uppercase tracking-wide">
                        {p.isBonus && (
                          <span className="rounded bg-ph-sky/10 px-1.5 py-0.5 text-ph-sky">
                            Bonus
                          </span>
                        )}
                        {p.isCpdPackage && (
                          <span className="rounded bg-ph-coral/10 px-1.5 py-0.5 text-ph-coral">
                            CPD
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ph-charcoal/80">{p.publisherName}</td>
                  <td className="py-2 pr-4 text-ph-charcoal/60">
                    {formatTemplateCode(p.templateCode)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {formatCurrency(p.mediaCost)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.totals, TOUCHPOINT_KEYS).toLocaleString('en-AU')}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.totals, ENGAGEMENT_KEYS).toLocaleString('en-AU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <span className="text-xs uppercase tracking-wide text-ph-charcoal/60">{label}</span>
        <span className="text-2xl font-semibold text-ph-charcoal">{value}</span>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-3 w-20 animate-pulse rounded bg-ph-charcoal/10" />
              <div className="mt-3 h-7 w-28 animate-pulse rounded bg-ph-charcoal/10" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-72 w-full animate-pulse rounded bg-ph-charcoal/5" />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof Error ? error.message : 'Failed to load dashboard';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Couldn't load dashboard</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-ph-charcoal/20 px-3 py-1.5 text-sm font-medium text-ph-charcoal transition-colors hover:border-client-primary hover:text-client-primary"
        >
          Try again
        </button>
      </CardContent>
    </Card>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function sumKeys(metrics: Record<string, number>, keys: readonly string[]): number {
  let total = 0;
  for (const key of keys) {
    const v = metrics[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatTemplateCode(code: string): string {
  switch (code) {
    case 'digital_display':
      return 'Digital';
    case 'edm':
      return 'eDM';
    case 'print':
      return 'Print';
    case 'sponsored_content':
      return 'Sponsored';
    case 'education_video':
      return 'Edu video';
    case 'education_course':
      return 'Edu course';
    default:
      return code;
  }
}

/**
 * Reads the live `--client-primary` CSS variable (set on the root by useAuth)
 * so the chart uses the active client's brand colour. Recharts paints into SVG
 * attributes so we can't just rely on Tailwind's class-based theming here.
 */
function useClientPrimaryColor(): string {
  const [color, setColor] = useState('#702f8f');
  useEffect(() => {
    const rgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--client-primary')
      .trim();
    if (rgb) setColor(`rgb(${rgb})`);
  }, []);
  return color;
}
