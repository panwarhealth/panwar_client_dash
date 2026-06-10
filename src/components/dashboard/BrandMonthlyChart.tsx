import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientPrimaryColor } from '@/hooks/useClientPrimaryColor';
import { MONTH_LABELS, TOUCHPOINT_KEYS, formatCompact, monthsBetween, sumKeys } from '@/lib/metrics';
import type { BrandMonthly } from '@/api/summary';

const EXTRA_COLORS = ['#f59e0b', '#0e7490', '#7c3aed', '#16a34a', '#dc2626'];

/**
 * The workbook's "Total Touchpoints by Month by Brand" chart: grouped monthly
 * bars, one series per brand, zero-filled across the selected window.
 */
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

  const months = useMemo(() => monthsBetween(from, to), [from, to]);
  const multiYear = useMemo(() => new Set(months.map((m) => m.year)).size > 1, [months]);

  const chartData = useMemo(() => {
    const byBrand = new Map<string, Map<string, number>>();
    for (const b of brands) {
      const m = new Map<string, number>();
      for (const mo of b.months) m.set(`${mo.year}-${mo.month}`, sumKeys(mo.metrics, TOUCHPOINT_KEYS));
      byBrand.set(b.label, m);
    }
    return months.map((m) => {
      const row: Record<string, number | string> = {
        month: multiYear
          ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}`
          : MONTH_LABELS[m.month - 1],
      };
      for (const b of brands) row[b.label] = byBrand.get(b.label)?.get(`${m.year}-${m.month}`) ?? 0;
      return row;
    });
  }, [brands, months, multiYear]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly touchpoints by brand</CardTitle>
        <CardDescription>Print and digital touchpoints each month, split by brand.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#454646" fontSize={12} tickLine={false} axisLine={false} />
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
                  borderRadius: 3,
                  border: '1px solid rgba(69, 70, 70, 0.1)',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {brands.map((b, i) => (
                <Bar key={b.brandSlug} dataKey={b.label} fill={seriesColor(i)} maxBarSize={28} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
