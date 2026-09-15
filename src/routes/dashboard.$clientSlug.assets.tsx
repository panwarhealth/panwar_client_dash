import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { ColResizeLines, useColumnResize } from '@/lib/columnResize';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { HoverCard } from '@/components/dashboard/HoverCard';
import {
  FacetFilter,
  emptySelection,
  isSelectionEmpty,
  type FacetGroup,
  type FacetSelection,
} from '@/components/dashboard/FacetFilter';
import { whenLabel } from '@/components/dashboard/PlacementCards';
import { getClientSummary, type AssetRow } from '@/api/summary';
import { getClientBrands } from '@/api/clients';
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

export const Route = createFileRoute('/dashboard/$clientSlug/assets')({
  validateSearch: (search: Record<string, unknown>): PeriodSearch => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: AssetsPage,
});

function attainmentColour(pct: number): string {
  if (pct >= 1) return 'text-emerald-600';
  if (pct >= 0.85) return 'text-amber-600';
  return 'text-rose-600';
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}${formatNumber(Math.abs(value))}`;
}

function money(v: number): string {
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });
}

const TOTAL_PRINT = '__print';
const TOTAL_DIGITAL = '__digital';

interface Figures {
  tp: number;
  tpKpi: number;
  en: number;
  enKpi: number;
  spend: number;
}

function figures(rows: AssetRow[]): Figures {
  const f: Figures = { tp: 0, tpKpi: 0, en: 0, enKpi: 0, spend: 0 };
  for (const r of rows) {
    f.tp += sumKeys(r.metrics, TOUCHPOINT_KEYS);
    f.tpKpi += sumKeys(r.targetMetrics, TOUCHPOINT_KEYS);
    f.en += sumKeys(r.metrics, ENGAGEMENT_KEYS);
    f.enKpi += sumKeys(r.targetMetrics, ENGAGEMENT_KEYS);
    f.spend += r.mediaCost + r.cpdInvestmentCost;
  }
  return f;
}

type SortKey =
  | 'touchpoints' | 'tpkpi' | 'tpdiff' | 'engagements' | 'enkpi' | 'endiff'
  | 'engrate' | 'engratekpi' | 'spend' | 'cpm' | 'cpe';

function sortValue(f: Figures, key: SortKey): number | null {
  switch (key) {
    case 'touchpoints': return f.tp;
    case 'tpkpi': return f.tpKpi > 0 ? f.tp / f.tpKpi : null;
    case 'tpdiff': return f.tpKpi > 0 ? f.tp - f.tpKpi : null;
    case 'engagements': return f.en;
    case 'enkpi': return f.enKpi > 0 ? f.en / f.enKpi : null;
    case 'endiff': return f.enKpi > 0 ? f.en - f.enKpi : null;
    case 'engrate': return f.tp > 0 ? f.en / f.tp : null;
    case 'engratekpi': return f.tpKpi > 0 && f.enKpi > 0 ? f.enKpi / f.tpKpi : null;
    case 'spend': return f.spend > 0 ? f.spend : null;
    case 'cpm': return f.tp > 0 && f.spend > 0 ? f.spend / (f.tp / 1000) : null;
    case 'cpe': return f.en > 0 && f.spend > 0 ? f.spend / f.en : null;
  }
}

const COLUMNS = {
  asset: 300, brand: 120, audience: 110, publisher: 150, mediaType: 140, liveDate: 150,
  touchpoints: 110, tpkpi: 80, tpdiff: 100, engagements: 110, enkpi: 80, endiff: 100,
  engrate: 90, engratekpi: 100, spend: 110, cpm: 90, cpe: 90, oscode: 150,
};

function AssetsPage() {
  const { clientSlug } = Route.useParams();
  const { from, to } = Route.useSearch();
  const navigate = Route.useNavigate();

  const summary = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? ''],
    queryFn: () => getClientSummary(clientSlug, { from, to }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const { data: clientData } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ph-charcoal">Summary by Asset</h1>
        {summary.data && (
          <PeriodFilter
            period={summary.data.period}
            onChange={(f, t) => navigate({ search: { from: f, to: t } })}
          />
        )}
      </div>

      {summary.isPending && <DashboardSkeleton />}
      {summary.error && <DashboardError error={summary.error} onRetry={() => summary.refetch()} />}
      {summary.data && summary.data.byAsset.length === 0 && (
        <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
          No assets in this period.
        </div>
      )}
      {summary.data && summary.data.byAsset.length > 0 && (
        <AssetSummary
          rows={summary.data.byAsset}
          brandOrder={(clientData?.brands ?? []).map((b) => b.slug)}
        />
      )}
    </div>
  );
}

function AssetSummary({ rows, brandOrder }: { rows: AssetRow[]; brandOrder: string[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const cols = useColumnResize(COLUMNS);

  const groups: FacetGroup[] = useMemo(() => {
    const uniq = (pairs: [string, string][]) => {
      const m = new Map<string, string>();
      for (const [v, l] of pairs) if (!m.has(v)) m.set(v, l);
      return [...m.entries()].map(([value, label]) => ({ value, label }));
    };
    const rank = (slug: string) => {
      const i = brandOrder.indexOf(slug);
      return i < 0 ? brandOrder.length : i;
    };
    const isPrint = (r: AssetRow) => r.templateCode === 'print';
    const formats = uniq(rows.filter((r) => !isPrint(r)).map((r) => [r.mediaType, r.mediaType] as [string, string]));
    return [
      {
        key: 'brand',
        label: 'Brand',
        options: uniq(rows.map((r) => [r.brandSlug, r.brandName])).sort((a, b) => rank(a.value) - rank(b.value)),
      },
      { key: 'audience', label: 'Audience', options: uniq(rows.map((r) => [r.audienceSlug, r.audienceName])) },
      {
        key: 'publisher',
        label: 'Publisher',
        options: uniq(rows.map((r) => [r.publisherSlug, r.publisherName])).sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        key: 'mediaType',
        label: 'Media type',
        options: [
          ...(rows.some(isPrint) ? [{ value: TOTAL_PRINT, label: 'Total Print' }] : []),
          ...(formats.length > 0 ? [{ value: TOTAL_DIGITAL, label: 'Total Digital' }] : []),
          ...formats,
        ],
      },
    ];
  }, [rows, brandOrder]);

  const [selection, setSelection] = useState<FacetSelection>(() => emptySelection(groups));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rowKey = (r: AssetRow) => [r.name, r.publisherSlug, r.audienceSlug, r.startDate ?? '', r.liveMonths.join(',')].join('|');
  const sel: FacetSelection = { ...emptySelection(groups), ...selection };
  const activeCount = Object.values(sel).reduce((n, set) => n + set.size, 0);

  const matches = (r: AssetRow, s: FacetSelection) => {
    if (s.brand.size > 0 && !s.brand.has(r.brandSlug)) return false;
    if (s.audience.size > 0 && !s.audience.has(r.audienceSlug)) return false;
    if (s.publisher.size > 0 && !s.publisher.has(r.publisherSlug)) return false;
    if (s.mediaType.size > 0) {
      const print = r.templateCode === 'print';
      const hit = (s.mediaType.has(TOTAL_PRINT) && print) || (s.mediaType.has(TOTAL_DIGITAL) && !print) || s.mediaType.has(r.mediaType);
      if (!hit) return false;
    }
    return true;
  };
  const isDisabled = (groupKey: string, value: string) =>
    !rows.some((r) => matches(r, { ...sel, [groupKey]: new Set([value]) }));

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' },
    );

  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((r) => matches(r, sel))
    .filter((r) => !q || `${r.name} ${r.publisherName} ${r.brandName} ${r.osCode ?? ''}`.toLowerCase().includes(q));

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const av = sortValue(figures([a]), sort.key);
        const bv = sortValue(figures([b]), sort.key);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : filtered;

  const total = figures(filtered);

  const num = 'px-3 py-2 text-right tabular-nums';
  const head = 'sticky top-0 z-10 bg-white px-3 py-2 text-right font-medium whitespace-nowrap';
  const textHead = 'sticky top-0 z-10 bg-white py-2 pr-3 font-medium whitespace-nowrap';
  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className={`${head} cursor-pointer select-none hover:text-ph-charcoal`}
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

  const Pct = ({ actual, kpi }: { actual: number; kpi: number }) =>
    kpi > 0 ? (
      <td className={`${num} ${attainmentColour(pctOfTarget(actual, kpi))}`}>{formatPercent(pctOfTarget(actual, kpi))}</td>
    ) : (
      <td className={`${num} text-ph-charcoal/25`}>-</td>
    );
  const Diff = ({ actual, kpi }: { actual: number; kpi: number }) =>
    kpi > 0 ? (
      <td className={`${num} ${attainmentColour(pctOfTarget(actual, kpi))}`}>{signed(actual - kpi)}</td>
    ) : (
      <td className={`${num} text-ph-charcoal/25`}>-</td>
    );

  const Metric = ({ actual, kpi, unit }: { actual: number; kpi: number; unit: string }) =>
    kpi > 0 ? (
      <HoverCard
        lines={[
          { label: 'Actual', value: formatNumber(actual) },
          { label: 'KPI', value: formatNumber(kpi) },
          { label: '% of KPI', value: formatPercent(pctOfTarget(actual, kpi)), className: `font-semibold ${attainmentColour(pctOfTarget(actual, kpi))}` },
          { label: 'vs KPI', value: `${signed(actual - kpi)} ${unit}`, className: `font-semibold ${attainmentColour(pctOfTarget(actual, kpi))}` },
        ]}
      >
        {formatNumber(actual)}
      </HoverCard>
    ) : (
      <>{formatNumber(actual)}</>
    );

  const figureCells = (f: Figures, text: string) => (
    <>
      <td className={`${num} font-medium ${text}`}><Metric actual={f.tp} kpi={f.tpKpi} unit="touchpoints" /></td>
      <Pct actual={f.tp} kpi={f.tpKpi} />
      <Diff actual={f.tp} kpi={f.tpKpi} />
      <td className={`${num} ${text}`}><Metric actual={f.en} kpi={f.enKpi} unit="engagements" /></td>
      <Pct actual={f.en} kpi={f.enKpi} />
      <Diff actual={f.en} kpi={f.enKpi} />
      <td className={`${num} ${text}`}>{f.tp > 0 ? formatPercent(f.en / f.tp, 2) : '-'}</td>
      <td className={`${num} text-ph-charcoal/50`}>{f.tpKpi > 0 && f.enKpi > 0 ? formatPercent(f.enKpi / f.tpKpi, 2) : '-'}</td>
      <td className={`${num} ${text}`}>{f.spend > 0 ? formatCurrency(f.spend) : '-'}</td>
      <td className={`${num} ${text}`}>{f.tp > 0 && f.spend > 0 ? money(f.spend / (f.tp / 1000)) : '-'}</td>
      <td className={`${num} ${text}`}>{f.en > 0 && f.spend > 0 ? money(f.spend / f.en) : '-'}</td>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="uppercase tracking-wide">Summary by asset</CardTitle>
            <CardDescription>
              Every placement with its touchpoints and engagements vs KPI, spend and cost efficiency.
              {!isSelectionEmpty(sel) && ` Showing ${filtered.length} of ${rows.length}.`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={`flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-sm transition-colors ${
                filtersOpen || activeCount > 0
                  ? 'border-client-primary text-client-primary'
                  : 'border-ph-charcoal/20 text-ph-charcoal/70 hover:border-client-primary hover:text-client-primary'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-client-primary px-1.5 text-[11px] font-semibold leading-4 text-white">{activeCount}</span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
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
        <div className="flex flex-col gap-6">
          {filtersOpen && (
            <div className="rounded-md border border-ph-charcoal/10 bg-ph-charcoal/[0.02] p-4">
              <FacetFilter groups={groups} selection={sel} onChange={setSelection} isDisabled={isDisabled} layout="row" />
            </div>
          )}
          <div className="min-w-0">
            {sorted.length === 0 ? (
              <p className="py-6 text-center text-sm text-ph-charcoal/50">No assets match.</p>
            ) : (
              <HScroll maxHeight="70vh">
                <div ref={cols.measureRef} className="relative" style={{ width: cols.totalWidth }}>
                  <table className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2">
                    <colgroup>
                      {Object.keys(COLUMNS).map((id) => (
                        <col key={id} style={{ width: cols.widths[id] }} />
                      ))}
                    </colgroup>
                    <thead className="text-xs uppercase tracking-wide text-ph-charcoal/60">
                      <tr>
                        <th className="sticky left-0 top-0 z-20 bg-white py-2 pr-3 font-medium shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]">
                          Asset
                        </th>
                        <th className={textHead}>Brand</th>
                        <th className={textHead}>Audience</th>
                        <th className={textHead}>Publisher</th>
                        <th className={textHead}>Media type</th>
                        <th className={textHead}>Live date</th>
                        <SortTh k="touchpoints" label="Touchpoints" />
                        <SortTh k="tpkpi" label="% KPI" />
                        <SortTh k="tpdiff" label="+/- KPI" />
                        <SortTh k="engagements" label="Engagements" />
                        <SortTh k="enkpi" label="% KPI" />
                        <SortTh k="endiff" label="+/- KPI" />
                        <SortTh k="engrate" label="Eng rate" />
                        <SortTh k="engratekpi" label="Eng rate KPI" />
                        <SortTh k="spend" label="Spend" />
                        <SortTh k="cpm" label="CPM" />
                        <SortTh k="cpe" label="CPE" />
                        <th className={textHead}>OneSpot code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((r, i) => {
                        const rowBg = i % 2 === 1 ? 'bg-[#f7f7f8]' : 'bg-white';
                        return (
                          <tr key={`${rowKey(r)}:${i}`} className={`${rowBg} border-b border-ph-charcoal/5`}>
                            <td className={`sticky left-0 z-[1] ${rowBg} py-2 pr-3 text-ph-charcoal shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]`}>
                              {r.name}
                            </td>
                            <td className="py-2 pr-3 font-medium text-ph-charcoal/80">{r.brandName}</td>
                            <td className="py-2 pr-3 text-ph-charcoal/70">{r.audienceName}</td>
                            <td className="py-2 pr-3 text-ph-charcoal/70">{r.publisherName}</td>
                            <td className="py-2 pr-3 text-ph-charcoal/70">{r.mediaType}</td>
                            <td className="py-2 pr-3 text-ph-charcoal/70">{whenLabel(r) ?? '-'}</td>
                            {figureCells(figures([r]), 'text-ph-charcoal/80')}
                            <td className="py-2 pl-3 pr-3 font-mono text-xs text-ph-charcoal/70">{r.osCode ?? '-'}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-ph-charcoal/20 bg-ph-charcoal/[0.03] font-semibold">
                        <td className="sticky left-0 z-[1] bg-[#f4f4f5] py-2 pr-3 text-ph-charcoal shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]">
                          Grand total
                        </td>
                        <td className="py-2 pr-3 text-ph-charcoal/60">{filtered.length} assets</td>
                        <td /><td /><td /><td />
                        {figureCells(total, 'text-ph-charcoal')}
                        <td />
                      </tr>
                    </tbody>
                  </table>
                  <ColResizeLines cols={cols} />
                </div>
              </HScroll>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
