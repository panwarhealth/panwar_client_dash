import { useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientPrimaryColor } from '@/hooks/useClientPrimaryColor';
import {
  MONTH_LABELS, TOUCHPOINT_KEYS, ENGAGEMENT_KEYS, formatCompact, monthsBetween, sumKeys,
} from '@/lib/metrics';
import type { BrandMonthly } from '@/api/summary';

const EXTRA_COLORS = ['#f59e0b', '#0e7490', '#7c3aed', '#16a34a', '#dc2626'];

type View = 'all' | 'digital' | 'print';

export function BrandMonthlyChart({
  brands,
  from,
  to,
}: {
  brands: BrandMonthly[];
  from: string;
  to: string;
}) {
  const primaryColor = useClientPrimaryColor();
  const seriesColor = (i: number) => (i === 0 ? primaryColor : EXTRA_COLORS[(i - 1) % EXTRA_COLORS.length]);
  const [view, setView] = useState<View>('all');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const activeKeyRef = useRef<string | null>(null);
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const months = useMemo(() => monthsBetween(from, to), [from, to]);
  const multiYear = useMemo(() => new Set(months.map((m) => m.year)).size > 1, [months]);

  const [tpMax, enMax] = useMemo(() => {
    let tp = 0;
    let en = 0;
    for (const b of brands) {
      for (const mo of b.months) {
        tp = Math.max(tp, sumKeys(mo.metrics, TOUCHPOINT_KEYS));
        en = Math.max(en, sumKeys(mo.metrics, ENGAGEMENT_KEYS));
      }
    }
    return [tp, en];
  }, [brands]);

  const chartData = useMemo(() => {
    const tpByBrand = new Map<string, Map<string, number>>();
    const enByBrand = new Map<string, Map<string, number>>();
    for (const b of brands) {
      const tp = new Map<string, number>();
      const en = new Map<string, number>();
      for (const mo of b.months) {
        const m = view === 'digital' ? mo.digitalMetrics : view === 'print' ? mo.printMetrics : mo.metrics;
        const key = `${mo.year}-${mo.month}`;
        tp.set(key, sumKeys(m, TOUCHPOINT_KEYS));
        en.set(key, sumKeys(m, ENGAGEMENT_KEYS));
      }
      tpByBrand.set(b.label, tp);
      enByBrand.set(b.label, en);
    }
    return months.map((m) => {
      const key = `${m.year}-${m.month}`;
      const row: Record<string, number | string> = {
        month: multiYear
          ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}`
          : MONTH_LABELS[m.month - 1],
      };
      for (const b of brands) {
        row[`${b.label} touchpoints`] = tpByBrand.get(b.label)?.get(key) ?? 0;
        row[`${b.label} engagements`] = enByBrand.get(b.label)?.get(key) ?? 0;
      }
      return row;
    });
  }, [brands, months, multiYear, view]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Monthly engagement and touchpoints by brand</CardTitle>
            <CardDescription>Touchpoints (bars) and engagements (lines) each month, split by brand.</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {(hidden.size > 0 || view !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setHidden(new Set());
                  setView('all');
                }}
                title="Reset chart"
                aria-label="Reset chart"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <select
              value={view}
              onChange={(e) => setView(e.target.value as View)}
              aria-label="Filter by category"
              className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm text-ph-charcoal/80 transition-colors hover:border-client-primary focus:border-client-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="digital">Digital</option>
              <option value="print">Print</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={({ active, payload, label }) => {
                  const key = activeKeyRef.current;
                  if (!active || !key || !payload?.length) return null;
                  const item = payload.find((p) => p.dataKey === key);
                  if (item?.value == null) return null;
                  return (
                    <div className="rounded-sm border border-ph-charcoal/10 bg-white px-2.5 py-1.5 text-xs shadow-sm">
                      <div className="text-ph-charcoal/50">{label}</div>
                      <div style={{ color: item.color }}>
                        {String(item.dataKey)}: {Number(item.value).toLocaleString('en-AU')}
                      </div>
                    </div>
                  );
                }}
              />
              <XAxis dataKey="month" stroke="#454646" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                domain={[0, tpMax || 'auto']}
                stroke="#454646"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, enMax || 'auto']}
                stroke="#454646"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              {brands.map((b, i) => (
                <Bar
                  key={`${b.brandSlug}-tp`}
                  yAxisId="left"
                  dataKey={`${b.label} touchpoints`}
                  fill={seriesColor(i)}
                  maxBarSize={28}
                  isAnimationActive={false}
                  hide={hidden.has(`${b.label} touchpoints`)}
                  onMouseEnter={() => {
                    activeKeyRef.current = `${b.label} touchpoints`;
                  }}
                  onMouseLeave={() => {
                    activeKeyRef.current = null;
                  }}
                />
              ))}
              {brands.map((b, i) => {
                const key = `${b.label} engagements`;
                const color = seriesColor(i);
                return (
                  <Line
                    key={`${b.brandSlug}-en`}
                    yAxisId="right"
                    type="linear"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    isAnimationActive={false}
                    activeDot={false}
                    hide={hidden.has(key)}
                    dot={(p: { cx?: number; cy?: number; value?: number; index?: number }) => {
                      const i2 = p.index ?? 0;
                      if (p.cx == null || p.cy == null || !p.value) return <g key={`d-${i2}`} />;
                      return (
                        <g key={`d-${i2}`} className="group">
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r={14}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => {
                              activeKeyRef.current = key;
                            }}
                            onMouseLeave={() => {
                              if (activeKeyRef.current === key) activeKeyRef.current = null;
                            }}
                          />
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r={5}
                            fill={color}
                            stroke="#fff"
                            strokeWidth={1.5}
                            pointerEvents="none"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </g>
                      );
                    }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex flex-col gap-3 text-xs">
          {(['touchpoints', 'engagements'] as const).map((kind) => (
            <div key={kind} className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
              <span className="w-24 shrink-0 font-medium uppercase tracking-wide text-ph-charcoal/50">
                {kind === 'touchpoints' ? 'Touchpoints' : 'Engagements'}
              </span>
              {brands.map((b, i) => {
                const key = `${b.label} ${kind}`;
                const on = !hidden.has(key);
                return (
                  <label key={key} className="inline-flex cursor-pointer select-none items-center gap-2">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(key)}
                      className="h-3.5 w-3.5 cursor-pointer accent-client-primary"
                    />
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: on ? seriesColor(i) : '#cbcbcb' }}
                    />
                    <span className={on ? 'text-ph-charcoal/80' : 'text-ph-charcoal/40'}>{b.label}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
