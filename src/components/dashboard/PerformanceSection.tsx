import { useState, type ReactNode } from 'react';
import { HoverCard } from '@/components/dashboard/HoverCard';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartArea } from '@/components/dashboard/ChartArea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { ColResizeLines, useColumnResize } from '@/lib/columnResize';
import type { SummaryRow } from '@/api/summary';
import type { DashboardTotals } from '@/api/summary';
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

export interface PerfRow {
  key: string;
  label: string;
  color?: string | null;
  placementCount: number;
  touchpoints: number;
  touchpointsKpi: number;
  engagements: number;
  engagementsKpi: number;
  spend: number;
  children?: PerfRow[];
}

export function perfRow(key: string, label: string, rows: SummaryRow[], color?: string | null): PerfRow {
  return {
    key,
    label,
    color,
    placementCount: rows.reduce((n, r) => n + r.placementCount, 0),
    touchpoints: rows.reduce((n, r) => n + sumKeys(r.metrics, TOUCHPOINT_KEYS), 0),
    touchpointsKpi: rows.reduce((n, r) => n + sumKeys(r.targetMetrics, TOUCHPOINT_KEYS), 0),
    engagements: rows.reduce((n, r) => n + sumKeys(r.metrics, ENGAGEMENT_KEYS), 0),
    engagementsKpi: rows.reduce((n, r) => n + sumKeys(r.targetMetrics, ENGAGEMENT_KEYS), 0),
    spend: rows.reduce((n, r) => n + r.mediaCost + r.cpdInvestmentCost, 0),
  };
}

export function perfTotal(label: string, totals: DashboardTotals, children?: PerfRow[]): PerfRow {
  return {
    key: '__total',
    label,
    placementCount: totals.placementCount,
    touchpoints: sumKeys(totals.metrics, TOUCHPOINT_KEYS),
    touchpointsKpi: sumKeys(totals.targetMetrics, TOUCHPOINT_KEYS),
    engagements: sumKeys(totals.metrics, ENGAGEMENT_KEYS),
    engagementsKpi: sumKeys(totals.targetMetrics, ENGAGEMENT_KEYS),
    spend: totals.mediaCost + totals.cpdInvestmentCost,
    children,
  };
}

type SortKey = 'placements' | 'touchpoints' | 'tpkpi' | 'engagements' | 'enkpi' | 'engrate' | 'spend' | 'cpm' | 'cpe';

function sortValue(r: PerfRow, key: SortKey): number | null {
  switch (key) {
    case 'placements': return r.placementCount;
    case 'touchpoints': return r.touchpoints;
    case 'tpkpi': return r.touchpointsKpi > 0 ? r.touchpoints / r.touchpointsKpi : null;
    case 'engagements': return r.engagements;
    case 'enkpi': return r.engagementsKpi > 0 ? r.engagements / r.engagementsKpi : null;
    case 'engrate': return r.touchpoints > 0 ? r.engagements / r.touchpoints : null;
    case 'spend': return r.spend;
    case 'cpm': return r.touchpoints > 0 ? r.spend / (r.touchpoints / 1000) : null;
    case 'cpe': return r.engagements > 0 ? r.spend / r.engagements : null;
  }
}

function attainmentColour(pct: number): string {
  if (pct >= 1) return 'text-emerald-600';
  if (pct >= 0.85) return 'text-amber-600';
  return 'text-rose-600';
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}${formatNumber(Math.abs(value))}`;
}

function KpiHover({ actual, kpi, unit }: { actual: number; kpi: number; unit: string }) {
  if (kpi <= 0) return <>{formatNumber(actual)}</>;
  const pct = pctOfTarget(actual, kpi);
  const tone = `font-semibold ${attainmentColour(pct)}`;
  return (
    <HoverCard
      lines={[
        { label: 'Actual', value: formatNumber(actual) },
        { label: 'KPI', value: formatNumber(kpi) },
        { label: '% of KPI', value: formatPercent(pct), className: tone },
        { label: 'vs KPI', value: `${signed(actual - kpi)} ${unit}`, className: tone },
      ]}
    >
      {formatNumber(actual)}
    </HoverCard>
  );
}

function money(v: number): string {
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });
}

const COLUMNS = {
  label: 200, placements: 100, touchpoints: 120, tpkpi: 150, engagements: 120, enkpi: 140,
  engrate: 100, spend: 120, cpm: 90, cpe: 90,
};

const DEFAULT_BAR = '#6b7280';
const ENGAGEMENT_LINE = '#a21caf';

function ChartLegend() {
  const item = 'flex items-center gap-1.5';
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-ph-charcoal/80">
      <span className={item}>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: DEFAULT_BAR }} />
        Touchpoints
      </span>
      <span className={item}>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: DEFAULT_BAR, opacity: 0.4 }} />
        Touchpoints KPI
      </span>
      <span className={item} style={{ color: ENGAGEMENT_LINE }}>
        <svg width="26" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="26" y2="5" stroke={ENGAGEMENT_LINE} strokeWidth="2" />
          <circle cx="13" cy="5" r="3" fill="#fff" stroke={ENGAGEMENT_LINE} strokeWidth="2" />
        </svg>
        Engagements
      </span>
      <span className={item} style={{ color: ENGAGEMENT_LINE }}>
        <svg width="26" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="26" y2="5" stroke={ENGAGEMENT_LINE} strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.55" />
        </svg>
        Engagements KPI
      </span>
    </div>
  );
}

export function PerformanceSection({
  title,
  subtitle,
  dimensionLabel,
  rows,
  chartRows,
  total,
  showChart,
  abbreviate = (s) => s,
  barColor,
  controls,
}: {
  title: string;
  subtitle: string;
  dimensionLabel: string;
  rows: PerfRow[];
  chartRows?: PerfRow[];
  total?: PerfRow;
  showChart: boolean;
  abbreviate?: (label: string) => string;
  barColor?: (row: PerfRow) => string;
  controls?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const cols = useColumnResize(COLUMNS);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' },
    );

  const tableRows = sort
    ? [...rows].sort((a, b) => {
        const av = sortValue(a, sort.key);
        const bv = sortValue(b, sort.key);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : rows;

  const colourOf = (r: PerfRow) => barColor?.(r) ?? r.color ?? DEFAULT_BAR;
  const chartData = (chartRows ?? rows).map((r) => ({
    name: r.label,
    touchpoints: r.touchpoints,
    touchpointsKpi: r.touchpointsKpi,
    engagements: r.engagements,
    engagementsKpi: r.engagementsKpi,
    fill: colourOf(r),
  }));

  const SortTh = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
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

  const num = 'py-2 pr-4 text-right tabular-nums';

  const VsKpi = ({ actual, kpi, className = '' }: { actual: number; kpi: number; className?: string }) =>
    kpi > 0 ? (
      <td className={`${num} ${attainmentColour(pctOfTarget(actual, kpi))} ${className}`}>
        {formatPercent(pctOfTarget(actual, kpi))}{' '}
        <span className="text-xs opacity-80">({signed(actual - kpi)})</span>
      </td>
    ) : (
      <td className={`${num} text-ph-charcoal/25 ${className}`}>-</td>
    );

  const renderRow = (r: PerfRow, kind: 'row' | 'child' | 'total') => {
    const rowCls =
      kind === 'total'
        ? 'border-t-2 border-ph-charcoal/20 bg-ph-charcoal/[0.03] font-semibold'
        : kind === 'child'
          ? 'border-b border-ph-charcoal/5 text-ph-charcoal/70'
          : 'border-b border-ph-charcoal/5';
    const labelCls =
      kind === 'child'
        ? 'py-1.5 pl-6 pr-4 text-ph-charcoal/70'
        : 'py-2 pr-4 font-medium text-ph-charcoal';
    const text = kind === 'total' ? 'text-ph-charcoal' : 'text-ph-charcoal/80';
    return (
      <tr key={`${kind}:${r.key}`} className={rowCls}>
        <td className={labelCls}>
          <span className="flex items-center gap-2">
            {kind !== 'total' && r.color && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: r.color }} />
            )}
            {r.label}
          </span>
        </td>
        <td className={`${num} ${text}`}>{r.placementCount}</td>
        <td className={`${num} ${text}`}><KpiHover actual={r.touchpoints} kpi={r.touchpointsKpi} unit="touchpoints" /></td>
        <VsKpi actual={r.touchpoints} kpi={r.touchpointsKpi} />
        <td className={`${num} ${text}`}><KpiHover actual={r.engagements} kpi={r.engagementsKpi} unit="engagements" /></td>
        <VsKpi actual={r.engagements} kpi={r.engagementsKpi} />
        <td className={`${num} ${text}`}>
          {r.touchpoints > 0 ? formatPercent(r.engagements / r.touchpoints, 2) : '-'}
        </td>
        <td className={`${num} ${text}`}>{formatCurrency(r.spend)}</td>
        <td className={`${num} ${text}`}>{r.touchpoints > 0 ? money(r.spend / (r.touchpoints / 1000)) : '-'}</td>
        <td className={`${num} ${text}`}>{r.engagements > 0 ? money(r.spend / r.engagements) : '-'}</td>
      </tr>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="uppercase tracking-wide">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {controls}
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
        {showChart && (chartRows ?? rows).length > 0 && (
          <div className="mb-6">
            <ChartArea height={320}>
              {(chartW, chartH) => (
                <ComposedChart width={chartW} height={chartH} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
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
                    formatter={(v) => Math.round(v as number).toLocaleString('en-AU')}
                    contentStyle={{
                      borderRadius: 3,
                      border: '1px solid rgba(69, 70, 70, 0.1)',
                      fontSize: 12,
                    }}
                  />
                  <Legend content={<ChartLegend />} />
                  <Bar yAxisId="left" dataKey="touchpoints" name="Touchpoints" maxBarSize={36} isAnimationActive={false}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                  <Bar yAxisId="left" dataKey="touchpointsKpi" name="Touchpoints KPI" maxBarSize={36} isAnimationActive={false}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.fill} fillOpacity={0.4} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="engagements"
                    name="Engagements"
                    stroke={ENGAGEMENT_LINE}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="engagementsKpi"
                    name="Engagements KPI"
                    stroke={ENGAGEMENT_LINE}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    strokeOpacity={0.55}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              )}
            </ChartArea>
          </div>
        )}
        <HScroll>
          <div ref={cols.measureRef} className="relative" style={{ width: cols.totalWidth }}>
            <table className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2">
              <colgroup>
                {Object.keys(COLUMNS).map((id) => (
                  <col key={id} style={{ width: cols.widths[id] }} />
                ))}
              </colgroup>
              <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
                <tr>
                  <th className="py-2 pr-4 font-medium">{dimensionLabel}</th>
                  <SortTh k="placements" label="Placements" />
                  <SortTh k="touchpoints" label="Touchpoints" />
                  <SortTh k="tpkpi" label="vs KPI" />
                  <SortTh k="engagements" label="Engagements" />
                  <SortTh k="enkpi" label="vs KPI" />
                  <SortTh k="engrate" label="Eng. rate" />
                  <SortTh k="spend" label="Spend" />
                  <SortTh k="cpm" label="CPM" />
                  <SortTh k="cpe" label="CPE" />
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => [renderRow(r, 'row'), ...(r.children ?? []).map((c) => renderRow(c, 'child'))])}
                {total && [renderRow(total, 'total'), ...(total.children ?? []).map((c) => renderRow(c, 'child'))]}
              </tbody>
            </table>
            <ColResizeLines cols={cols} />
          </div>
        </HScroll>
      </CardContent>
    </Card>
  );
}
