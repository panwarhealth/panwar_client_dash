import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, RotateCcw, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { ColResizeLines, useColumnResize } from '@/lib/columnResize';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { getClientSummary, type AssetRow } from '@/api/summary';
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
      {summary.data && summary.data.byAsset.length > 0 && <AssetSummary rows={summary.data.byAsset} />}
    </div>
  );
}

type SortKey =
  | 'print' | 'digital' | 'touchpoints' | 'tpkpi'
  | 'engagements' | 'enkpi' | 'engrate' | 'spend' | 'cpt' | 'cpe';

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
  const head = 'sticky top-0 z-10 bg-white px-3 py-2 text-right font-medium whitespace-nowrap';
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
