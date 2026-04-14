import { useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientPrimaryColor } from '@/hooks/useClientPrimaryColor';
import { MONTH_LABELS, TOUCHPOINT_KEYS, formatCompact, sumKeys } from '@/lib/metrics';
import type { DashboardMonth } from '@/api/dashboard';

export function MonthlyChart({ monthly }: { monthly: DashboardMonth[] }) {
  const primaryColor = useClientPrimaryColor();

  const chartData = useMemo(
    () => monthly.map((m) => ({
      month: MONTH_LABELS[m.month - 1] ?? String(m.month),
      touchpoints: sumKeys(m.metrics, TOUCHPOINT_KEYS),
    })),
    [monthly],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly touchpoints</CardTitle>
        <CardDescription>
          Impressions, sponsored-content views and education page views, summed across every placement.
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
  );
}
