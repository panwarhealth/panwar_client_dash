import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EducationBarChart, PALETTE, type ChartSeries } from '@/components/education/EducationBarChart';
import { cn } from '@/lib/utils';
import type { EducationChart } from '@/api/education';

type View = 'brand' | 'activity';

function seriesSpan(series: ChartSeries[]): { from: string; to: string } | null {
  const yms = series.flatMap((s) => s.points).map((p) => `${p.year}-${String(p.month).padStart(2, '0')}`);
  if (yms.length === 0) return null;
  return {
    from: yms.reduce((a, b) => (a < b ? a : b)),
    to: yms.reduce((a, b) => (a > b ? a : b)),
  };
}

export function EducationChartCard({ chart }: { chart: EducationChart }) {
  const [view, setView] = useState<View>('brand');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const coloured: ChartSeries[] = useMemo(() => {
    const raw = view === 'brand' ? chart.brandSeries : chart.activitySeries;
    const used = new Set<string>();
    let next = 0;
    return raw.map((s) => {
      let color = s.color;
      if (!color || (view === 'activity' && used.has(color))) {
        color = PALETTE[next % PALETTE.length];
        next += 1;
      }
      used.add(color);
      return { id: s.id, label: s.label, color, points: s.points };
    });
  }, [chart, view]);

  const visible = coloured.filter((s) => !hidden.has(s.id));
  const span = seriesSpan(visible);
  const annotations = view === 'brand' ? chart.annotations.map((a) => ({ ...a, seriesId: a.brand })) : [];

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const switchView = (v: View) => {
    setView(v);
    setHidden(new Set());
  };

  const pill = 'rounded-md px-3 py-1.5 text-xs font-medium transition-colors';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="uppercase tracking-wide">{chart.title}</CardTitle>
            {chart.subtitle && <CardDescription>{chart.subtitle}</CardDescription>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hidden.size > 0 && (
              <button
                type="button"
                onClick={() => setHidden(new Set())}
                title="Show all"
                aria-label="Show all"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-1 rounded-md border border-ph-charcoal/15 bg-white p-0.5" role="group" aria-label="Chart view">
              <button type="button" onClick={() => switchView('brand')} className={cn(pill, view === 'brand' ? 'bg-client-primary text-white' : 'text-ph-charcoal/70 hover:text-ph-charcoal')}>
                By brand
              </button>
              <button type="button" onClick={() => switchView('activity')} className={cn(pill, view === 'activity' ? 'bg-client-primary text-white' : 'text-ph-charcoal/70 hover:text-ph-charcoal')}>
                By activity
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {coloured.length === 0 ? (
          <p className="py-8 text-center text-sm text-ph-charcoal/50">No data for this period.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {span === null || visible.length === 0 ? (
                <p className="py-8 text-center text-sm text-ph-charcoal/50">Nothing selected.</p>
              ) : (
                <EducationBarChart series={visible} annotations={annotations} from={span.from} to={span.to} />
              )}
            </div>
            <ul className="flex flex-col gap-1 text-xs text-ph-charcoal/80 lg:max-h-[360px] lg:overflow-y-auto">
              {coloured.map((s) => {
                const on = !hidden.has(s.id);
                return (
                  <li key={s.id}>
                    <label className={cn('flex cursor-pointer items-start gap-2', !on && 'opacity-45')}>
                      <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-client-primary" />
                      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color ?? undefined }} />
                      <span className="leading-tight">{s.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
