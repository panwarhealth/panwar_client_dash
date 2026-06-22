import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, RotateCcw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { ColResizeLines, useColumnResize } from '@/lib/columnResize';
import { SummaryBanner } from '@/components/dashboard/SummaryBanner';
import { BrandMonthlyChart } from '@/components/dashboard/BrandMonthlyChart';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getMyClients } from '@/api/clients';
import { getClientSummary, type SummaryRow, type AssetRow } from '@/api/summary';
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

function readableOn(hex: string | null): string {
  if (!hex) return '#ffffff';
  const h = hex.replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#1a1a1a' : '#ffffff';
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

  const resolvedPeriod = summary.data?.period;
  const { data: eduPages = [] } = useQuery({
    queryKey: ['education', 'pages', clientSlug, resolvedPeriod?.from ?? '', resolvedPeriod?.to ?? ''],
    queryFn: () => getEducationPages(clientSlug, resolvedPeriod),
    enabled: !!resolvedPeriod,
    staleTime: 30 * 1000,
  });

  const brands = summary.data?.brands ?? [];


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
          <div id="brands" className="scroll-mt-6">
            <BrandAudienceRollup clientSlug={clientSlug} rows={summary.data.byBrandAudience} period={period} />
          </div>
          {eduPages.length > 0 && (
            <div id="education" className="scroll-mt-6">
              <EducationLinks clientSlug={clientSlug} pages={eduPages} period={period} />
            </div>
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
          <PerformanceSummary
            title="Publisher performance"
            subtitle="Touchpoints, engagements and spend (incl. CPD) by publisher."
            dimensionLabel="Publisher"
            clientSlug={clientSlug}
            from={from}
            to={to}
            dimension="byPublisher"
            rows={summary.data.byPublisher}
            showChart={summary.data.showPublisherChart && !summary.data.isPlan}
            abbreviate={publisherAbbrev}
            brands={brands}
          />

          <PerformanceSummary
            title="Category performance"
            subtitle="Touchpoints, engagements and spend by category."
            dimensionLabel="Category"
            clientSlug={clientSlug}
            from={from}
            to={to}
            dimension="byCategory"
            rows={summary.data.byCategory}
            showChart={summary.data.showPublisherChart && !summary.data.isPlan}
            brands={brands}
          />

          <PerformanceSummary
            title="Digital format performance"
            subtitle="Touchpoints, engagements and spend by digital format."
            dimensionLabel="Format"
            clientSlug={clientSlug}
            from={from}
            to={to}
            dimension="byDigitalFormat"
            rows={summary.data.byDigitalFormat}
            showChart={summary.data.showPublisherChart && !summary.data.isPlan}
            brands={brands}
          />

          {!summary.data.isPlan && summary.data.byAsset.length > 0 && (
            <AssetSummary rows={summary.data.byAsset} />
          )}
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
            const engagements = sumKeys(r.metrics, ENGAGEMENT_KEYS);
            const tpTarget = sumKeys(r.targetMetrics, TOUCHPOINT_KEYS);
            const enTarget = sumKeys(r.targetMetrics, ENGAGEMENT_KEYS);
            const spend = r.mediaCost + r.cpdInvestmentCost;
            const tpPct = tpTarget > 0 ? pctOfTarget(touchpoints, tpTarget) : null;
            const enPct = enTarget > 0 ? pctOfTarget(engagements, enTarget) : null;
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
                  <Stat
                    label="Touchpoints % of KPI"
                    value={tpPct != null ? formatPercent(tpPct) : '—'}
                    className={tpPct != null ? attainmentColour(tpPct) : undefined}
                  />
                  <Stat label="Engagements" value={formatNumber(engagements)} />
                  <Stat
                    label="Engagements % of KPI"
                    value={enPct != null ? formatPercent(enPct) : '—'}
                    className={enPct != null ? attainmentColour(enPct) : undefined}
                  />
                  <Stat label="Spend" value={formatCurrency(spend)} />
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
              {p.completions > 0 && (
                <div className="mt-1.5 text-base font-semibold tabular-nums text-ph-charcoal">
                  {formatNumber(p.completions)}
                  <span className="ml-1 text-xs font-normal text-ph-charcoal/50">completions</span>
                </div>
              )}
              <div className="mt-1 text-xs text-ph-charcoal/50">
                {p.moduleCount} {p.moduleCount === 1 ? 'module' : 'modules'} · {p.assetCount}{' '}
                {p.assetCount === 1 ? 'asset' : 'assets'}
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

type PubSortKey = 'placements' | 'touchpoints' | 'engagements' | 'spend' | 'planned' | 'cpm' | 'cpe';

/** Sort value for a publisher row + column; null = not applicable (sorts last). */
function publisherSortValue(r: SummaryRow, key: PubSortKey): number | null {
  const tp = sumKeys(r.metrics, TOUCHPOINT_KEYS);
  const en = sumKeys(r.metrics, ENGAGEMENT_KEYS);
  const spend = r.mediaCost + r.cpdInvestmentCost;
  switch (key) {
    case 'placements': return r.placementCount;
    case 'touchpoints': return tp;
    case 'engagements': return en;
    case 'spend': return spend;
    case 'planned': return r.plannedMediaCost ?? null;
    case 'cpm': return tp > 0 ? spend / (tp / 1000) : null;
    case 'cpe': return en > 0 ? spend / en : null;
  }
}

/** Column order + default widths (px) for the publisher performance table. */
const PUB_PERF_COLUMNS = {
  publisher: 180, placements: 110, touchpoints: 120, engagements: 120,
  spend: 120, planned: 110, cpm: 90, cpe: 90,
};

function PerformanceSummary({
  title,
  subtitle,
  dimensionLabel,
  clientSlug,
  from,
  to,
  dimension,
  rows,
  showChart,
  abbreviate = (s) => s,
  brands,
}: {
  title: string;
  subtitle: string;
  dimensionLabel: string;
  clientSlug: string;
  from?: string;
  to?: string;
  dimension: 'byPublisher' | 'byCategory' | 'byDigitalFormat';
  rows: SummaryRow[];
  showChart: boolean;
  abbreviate?: (label: string) => string;
  brands?: { slug: string; name: string; color: string | null }[];
}) {
  const [brand, setBrand] = useState<string | null>(null);
  const activeBrand = brand ? brands?.find((b) => b.slug === brand) : undefined;
  const brandQuery = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', brand],
    queryFn: () => getClientSummary(clientSlug, { from, to, brand: brand ?? undefined }),
    enabled: !!brand,
    staleTime: 0,
  });
  const data = brand && brandQuery.data ? brandQuery.data[dimension] : rows;

  const [sort, setSort] = useState<{ key: PubSortKey; dir: 'asc' | 'desc' } | null>(null);
  const cols = useColumnResize(PUB_PERF_COLUMNS);
  const chartData = data.map((r) => ({
    name: r.label,
    touchpoints: sumKeys(r.metrics, TOUCHPOINT_KEYS),
    engagements: sumKeys(r.metrics, ENGAGEMENT_KEYS),
  }));
  const money = (v: number) =>
    v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });

  // Click a column: sort desc, click again to flip asc. The reset button
  // clears back to the default order.
  const toggleSort = (key: PubSortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' },
    );

  // Only the table sorts; nulls always last.
  const tableRows = sort
    ? [...data].sort((a, b) => {
        const av = publisherSortValue(a, sort.key);
        const bv = publisherSortValue(b, sort.key);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : data;

  const SortTh = ({ k, label, className }: { k: PubSortKey; label: string; className?: string }) => (
    <th
      className={`${className ?? 'py-2 pr-4 text-right font-medium'} cursor-pointer select-none whitespace-nowrap hover:text-ph-charcoal`}
      onClick={() => toggleSort(k)}
      aria-sort={sort?.key === k ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <span className="inline-flex items-center justify-end gap-0.5">
        {label}
        {sort?.key === k &&
          (sort.dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            {activeBrand && (
              <span
                className="mb-1.5 inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: activeBrand.color ?? '#454646', color: readableOn(activeBrand.color) }}
              >
                {activeBrand.name}
              </span>
            )}
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {brands && brands.length > 1 && (
              <select
                value={brand ?? ''}
                onChange={(e) => setBrand(e.target.value || null)}
                aria-label="Filter by brand"
                className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm text-ph-charcoal/80 transition-colors hover:border-client-primary focus:border-client-primary focus:outline-none"
              >
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            {sort !== null && (
              <button
                type="button"
                onClick={() => setSort(null)}
                title="Clear sorting"
                aria-label="Clear sorting"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
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
                  tickFormatter={abbreviate}
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
                <Bar yAxisId="left" dataKey="touchpoints" name="Touchpoints" fill="#6b7280" maxBarSize={36} isAnimationActive={false} />
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="engagements"
                  name="Engagements"
                  stroke="#a21caf"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <HScroll>
          <div ref={cols.measureRef} className="relative" style={{ width: cols.totalWidth }}>
          <table className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2">
            <colgroup>
              {Object.keys(PUB_PERF_COLUMNS).map((id) => (
                <col key={id} style={{ width: cols.widths[id] }} />
              ))}
            </colgroup>
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">{dimensionLabel}</th>
                <SortTh k="placements" label="Placements" />
                <SortTh k="touchpoints" label="Touchpoints" />
                <SortTh k="engagements" label="Engagements" />
                <SortTh k="spend" label="Spend" />
                <SortTh k="planned" label="Planned" />
                <SortTh k="cpm" label="CPM" />
                <SortTh k="cpe" label="CPE" className="py-2 pr-4 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => {
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
                    <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                      {engagements > 0 ? money(spend / engagements) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ColResizeLines cols={cols} />
          </div>
        </HScroll>
      </CardContent>
    </Card>
  );
}

/**
 * The workbook's "FY25 Summary by Asset": every placement as one row, grouped
 * by brand, with actual-vs-expected (% of KPI) for touchpoints and engagements
 * plus spend and cost-per metrics. Print vs digital impressions are split by
 * the placement's template (print template -> print column, else digital).
 */
type SortKey =
  | 'print' | 'digital' | 'touchpoints' | 'tpkpi'
  | 'engagements' | 'enkpi' | 'engrate' | 'spend' | 'cpt' | 'cpe';

/** Sort value for a row + column; null = not applicable (always sorts last). */
function assetSortValue(r: AssetRow, key: SortKey): number | null {
  const tp = sumKeys(r.metrics, TOUCHPOINT_KEYS);
  const en = sumKeys(r.metrics, ENGAGEMENT_KEYS);
  const tpTarget = sumKeys(r.targetMetrics, TOUCHPOINT_KEYS);
  const enTarget = sumKeys(r.targetMetrics, ENGAGEMENT_KEYS);
  const spend = r.mediaCost + r.cpdInvestmentCost;
  const isPrint = r.templateCode === 'print';
  switch (key) {
    case 'print': return isPrint ? tp : 0;
    case 'digital': return isPrint ? 0 : tp;
    case 'touchpoints': return tp;
    case 'tpkpi': return tpTarget > 0 ? tp / tpTarget : null;
    case 'engagements': return en;
    case 'enkpi': return enTarget > 0 ? en / enTarget : null;
    case 'engrate': return tp > 0 ? en / tp : null;
    case 'spend': return spend > 0 ? spend : null;
    case 'cpt': return tp > 0 && spend > 0 ? spend / (tp / 1000) : null;
    case 'cpe': return en > 0 && spend > 0 ? spend / en : null;
  }
}

/** Column order + default widths (px) for the summary-by-asset table. */
const ASSET_SUMMARY_COLUMNS = {
  asset: 320, publisher: 150, brand: 130, audience: 130, print: 100, digital: 100,
  touchpoints: 120, tpkpi: 90, engagements: 130, enkpi: 90, engrate: 100,
  spend: 120, cpt: 100, cpe: 100,
};

function AssetSummary({ rows }: { rows: AssetRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const cols = useColumnResize(ASSET_SUMMARY_COLUMNS);
  const money = (v: number) =>
    v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });

  // Click a column: sort desc, click again to flip asc. The Clear button
  // resets to the workbook's natural order.
  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' },
    );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => `${r.name} ${r.publisherName} ${r.brandName}`.toLowerCase().includes(q))
    : rows;

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const av = assetSortValue(a, sort.key);
        const bv = assetSortValue(b, sort.key);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : filtered;

  const num = 'px-3 py-2 text-right tabular-nums';
  // Pinned header cells: opaque bg so rows scrolling under them don't bleed.
  const head = 'sticky top-0 z-10 bg-white px-3 py-2 text-right font-medium whitespace-nowrap';
  // Sortable numeric header: click to cycle sort, arrow shows active direction.
  const SortTh = ({ k, label, className = head }: { k: SortKey; label: string; className?: string }) => (
    <th
      className={`${className} cursor-pointer select-none hover:text-ph-charcoal`}
      onClick={() => toggleSort(k)}
      aria-sort={sort?.key === k ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <span className="inline-flex items-center justify-end gap-0.5">
        {label}
        {sort?.key === k &&
          (sort.dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Summary by asset</CardTitle>
            <CardDescription>
              Every placement with its touchpoints and engagements vs KPI, spend and cost efficiency.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {(query !== '' || sort !== null) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSort(null);
                }}
                title="Clear search and sorting"
                aria-label="Clear search and sorting"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ph-charcoal/40" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets…"
                className="h-9 w-56 rounded-md border border-ph-charcoal/20 bg-white pl-8 pr-2 text-sm text-ph-charcoal focus:border-client-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-ph-charcoal/50">No assets match "{query}".</p>
        ) : (
        <HScroll maxHeight="70vh">
          <div ref={cols.measureRef} className="relative" style={{ width: cols.totalWidth }}>
          <table className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2">
            <colgroup>
              {Object.keys(ASSET_SUMMARY_COLUMNS).map((id) => (
                <col key={id} style={{ width: cols.widths[id] }} />
              ))}
            </colgroup>
            <thead className="text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                {/* Asset is pinned both top (header) and left (column) - corner cell, highest z. */}
                <th className="sticky left-0 top-0 z-20 bg-white py-2 pr-3 font-medium shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]">
                  Asset
                </th>
                <th className="sticky top-0 z-10 bg-white py-2 pr-3 font-medium whitespace-nowrap">Publisher</th>
                <th className="sticky top-0 z-10 bg-white py-2 pr-3 font-medium whitespace-nowrap">Brand</th>
                <th className="sticky top-0 z-10 bg-white py-2 pr-3 font-medium whitespace-nowrap">Audience</th>
                <SortTh k="print" label="Print" />
                <SortTh k="digital" label="Digital" />
                <SortTh k="touchpoints" label="Touchpoints" />
                <SortTh k="tpkpi" label="% KPI" />
                <SortTh k="engagements" label="Engagements" />
                <SortTh k="enkpi" label="% KPI" />
                <SortTh k="engrate" label="Eng. rate" />
                <SortTh k="spend" label="Spend" />
                <SortTh k="cpt" label="CPT" />
                <SortTh
                  k="cpe"
                  label="CPE"
                  className="sticky top-0 z-10 bg-white py-2 pl-3 pr-3 text-right font-medium whitespace-nowrap"
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const touchpoints = sumKeys(r.metrics, TOUCHPOINT_KEYS);
                const engagements = sumKeys(r.metrics, ENGAGEMENT_KEYS);
                const tpTarget = sumKeys(r.targetMetrics, TOUCHPOINT_KEYS);
                const enTarget = sumKeys(r.targetMetrics, ENGAGEMENT_KEYS);
                const spend = r.mediaCost + r.cpdInvestmentCost;
                const isPrint = r.templateCode === 'print';
                const rowBg = i % 2 === 1 ? 'bg-[#f7f7f8]' : 'bg-white';
                return (
                  <tr key={`${r.name}:${r.publisherName}:${i}`} className={`${rowBg} border-b border-ph-charcoal/5 last:border-0`}>
                    <td className={`sticky left-0 z-[1] ${rowBg} py-2 pr-3 text-ph-charcoal shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]`}>
                      {r.name}
                    </td>
                    <td className="py-2 pr-3 text-ph-charcoal/70">{r.publisherName}</td>
                    <td className="py-2 pr-3 font-medium text-ph-charcoal/80">{r.brandName}</td>
                    <td className="py-2 pr-3 text-ph-charcoal/70">{r.audienceName}</td>
                    <td className={`${num} ${isPrint ? 'text-ph-charcoal/80' : 'text-ph-charcoal/25'}`}>
                      {isPrint ? formatNumber(touchpoints) : '-'}
                    </td>
                    <td className={`${num} ${isPrint ? 'text-ph-charcoal/25' : 'text-ph-charcoal/80'}`}>
                      {isPrint ? '-' : formatNumber(touchpoints)}
                    </td>
                    <td className={`${num} font-medium text-ph-charcoal`}>{formatNumber(touchpoints)}</td>
                    <td className={`${num} ${tpTarget > 0 ? attainmentColour(pctOfTarget(touchpoints, tpTarget)) : 'text-ph-charcoal/25'}`}>
                      {tpTarget > 0 ? formatPercent(pctOfTarget(touchpoints, tpTarget)) : '-'}
                    </td>
                    <td className={`${num} text-ph-charcoal/80`}>{formatNumber(engagements)}</td>
                    <td className={`${num} ${enTarget > 0 ? attainmentColour(pctOfTarget(engagements, enTarget)) : 'text-ph-charcoal/25'}`}>
                      {enTarget > 0 ? formatPercent(pctOfTarget(engagements, enTarget)) : '-'}
                    </td>
                    <td className={`${num} text-ph-charcoal/80`}>
                      {touchpoints > 0 ? formatPercent(engagements / touchpoints, 2) : '-'}
                    </td>
                    <td className={`${num} text-ph-charcoal/80`}>{spend > 0 ? formatCurrency(spend) : '-'}</td>
                    <td className={`${num} text-ph-charcoal/80`}>
                      {touchpoints > 0 && spend > 0 ? money(spend / (touchpoints / 1000)) : '-'}
                    </td>
                    <td className="py-2 pl-3 pr-3 text-right tabular-nums text-ph-charcoal/80">
                      {engagements > 0 && spend > 0 ? money(spend / engagements) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ColResizeLines cols={cols} />
          </div>
        </HScroll>
        )}
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
