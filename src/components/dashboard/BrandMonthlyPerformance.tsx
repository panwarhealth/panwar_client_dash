import { useMemo, useState } from 'react';
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartArea } from '@/components/dashboard/ChartArea';
import {
  FacetFilter,
  emptySelection,
  isSelectionEmpty,
  type FacetGroup,
  type FacetSelection,
} from '@/components/dashboard/FacetFilter';
import { useClientPrimaryColor } from '@/hooks/useClientPrimaryColor';
import type { DashboardPlacement } from '@/api/summary';
import {
  MONTH_LABELS, TOUCHPOINT_KEYS, ENGAGEMENT_KEYS, formatCompact, monthsBetween, sumKeys,
} from '@/lib/metrics';

const ENGAGEMENT_LINE = '#a21caf';
const TOTAL_PRINT = 'Print';
const TOTAL_DIGITAL = '__digital';

function isPrint(p: DashboardPlacement): boolean {
  return p.templateCode === 'print';
}

function matches(p: DashboardPlacement, sel: FacetSelection): boolean {
  const aud = sel.audience;
  if (aud.size > 0 && !aud.has(p.audienceSlug)) return false;
  const pub = sel.publisher;
  if (pub.size > 0 && !pub.has(p.publisherSlug)) return false;
  const mt = sel.mediaType;
  if (mt.size > 0) {
    const hit =
      (mt.has(TOTAL_PRINT) && isPrint(p)) ||
      (mt.has(TOTAL_DIGITAL) && !isPrint(p)) ||
      mt.has(p.mediaType);
    if (!hit) return false;
  }
  return true;
}

function ChartLegend({ barColor }: { barColor: string }) {
  const item = 'flex items-center gap-1.5';
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-ph-charcoal/80">
      <span className={item}>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: barColor }} />
        Touchpoints
      </span>
      <span className={item}>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: barColor, opacity: 0.4 }} />
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

export function BrandMonthlyPerformance({
  placements,
  from,
  to,
  color,
}: {
  placements: DashboardPlacement[];
  from: string;
  to: string;
  color?: string | null;
}) {
  const primary = useClientPrimaryColor();
  const barColor = color ?? primary;

  const groups: FacetGroup[] = useMemo(() => {
    const uniq = (pairs: [string, string][]) => {
      const m = new Map<string, string>();
      for (const [v, l] of pairs) if (!m.has(v)) m.set(v, l);
      return [...m.entries()].map(([value, label]) => ({ value, label }));
    };
    const digitalFormats = uniq(
      placements.filter((p) => !isPrint(p)).map((p) => [p.mediaType, p.mediaType] as [string, string]),
    ).sort((a, b) => a.label.localeCompare(b.label));
    return [
      { key: 'audience', label: 'Audience', options: uniq(placements.map((p) => [p.audienceSlug, p.audienceName])) },
      {
        key: 'publisher',
        label: 'Publisher',
        options: uniq(placements.map((p) => [p.publisherSlug, p.publisherName])).sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        key: 'mediaType',
        label: 'Media type',
        options: [
          ...(placements.some(isPrint) ? [{ value: TOTAL_PRINT, label: 'Total Print' }] : []),
          ...(digitalFormats.length > 0 ? [{ value: TOTAL_DIGITAL, label: 'Total Digital' }] : []),
          ...digitalFormats,
        ],
      },
    ];
  }, [placements]);

  const [selection, setSelection] = useState<FacetSelection>(() => emptySelection(groups));
  const sel: FacetSelection = { ...emptySelection(groups), ...selection };

  const filtered = useMemo(() => placements.filter((p) => matches(p, sel)), [placements, sel]);

  const isDisabled = (groupKey: string, value: string) => {
    const trial: FacetSelection = { ...sel, [groupKey]: new Set([value]) };
    return !placements.some((p) => matches(p, trial));
  };

  const months = useMemo(() => monthsBetween(from, to), [from, to]);
  const multiYear = useMemo(() => new Set(months.map((m) => m.year)).size > 1, [months]);

  const chartData = useMemo(
    () =>
      months.map((m) => {
        let tp = 0, tpKpi = 0, en = 0, enKpi = 0;
        for (const p of filtered) {
          const pm = p.months.find((x) => x.year === m.year && x.month === m.month);
          if (!pm) continue;
          tp += sumKeys(pm.metrics, TOUCHPOINT_KEYS);
          tpKpi += sumKeys(pm.targetMetrics, TOUCHPOINT_KEYS);
          en += sumKeys(pm.metrics, ENGAGEMENT_KEYS);
          enKpi += sumKeys(pm.targetMetrics, ENGAGEMENT_KEYS);
        }
        return {
          month: multiYear ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}` : MONTH_LABELS[m.month - 1],
          touchpoints: tp,
          touchpointsKpi: tpKpi,
          engagements: en,
          engagementsKpi: enKpi,
        };
      }),
    [filtered, months, multiYear],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase tracking-wide">Monthly touchpoints vs engagements</CardTitle>
        <CardDescription>
          Touchpoints (bars) and engagements (line) each month against their KPIs
          {isSelectionEmpty(sel) ? '.' : `, ${filtered.length} of ${placements.length} placements.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="min-w-0">
            <ChartArea height={340}>
            {(w, h) => (
              <ComposedChart width={w} height={h} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#454646" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis yAxisId="left" stroke="#454646" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v as number)} />
                <YAxis yAxisId="right" orientation="right" stroke="#454646" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v as number)} />
                <Tooltip
                  formatter={(v) => Math.round(v as number).toLocaleString('en-AU')}
                  contentStyle={{ borderRadius: 3, border: '1px solid rgba(69, 70, 70, 0.1)', fontSize: 12 }}
                />
                <Legend content={<ChartLegend barColor={barColor} />} />
                <Bar yAxisId="left" dataKey="touchpoints" name="Touchpoints" fill={barColor} maxBarSize={28} isAnimationActive={false} />
                <Bar yAxisId="left" dataKey="touchpointsKpi" name="Touchpoints KPI" fill={barColor} fillOpacity={0.4} maxBarSize={28} isAnimationActive={false} />
                <Line yAxisId="right" type="linear" dataKey="engagements" name="Engagements" stroke={ENGAGEMENT_LINE} strokeWidth={2} isAnimationActive={false} />
                <Line yAxisId="right" type="linear" dataKey="engagementsKpi" name="Engagements KPI" stroke={ENGAGEMENT_LINE} strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.55} dot={false} isAnimationActive={false} />
              </ComposedChart>
            )}
            </ChartArea>
          </div>
          <FacetFilter groups={groups} selection={sel} onChange={setSelection} isDisabled={isDisabled} />
        </div>
      </CardContent>
    </Card>
  );
}
