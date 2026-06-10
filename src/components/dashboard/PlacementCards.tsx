import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatTemplateCode,
  formatSubcategory,
  formatSendDate,
  formatMonthYear,
  formatMetricKey,
  MONTH_LABELS,
  ctr,
  cpm,
  cpc,
  pctOfTarget,
} from '@/lib/metrics';
import type { DashboardPlacement } from '@/api/dashboard';

/** The dates/sends descriptor under a placement's name, per its date shape. */
function whenLabel(p: DashboardPlacement): string | null {
  if (p.sendDates.length > 1) {
    return `${p.sendDates.length} sends: ${p.sendDates.map(formatSendDate).join(', ')}`;
  }
  if (p.sendDates.length === 1) return formatSendDate(p.sendDates[0]);
  if (p.startDate && p.endDate) return `${formatMonthYear(p.startDate)} - ${formatMonthYear(p.endDate)}`;
  if (p.startDate) return formatSendDate(p.startDate);
  if (p.liveMonths.length > 0) return p.liveMonths.map((m) => MONTH_LABELS[m - 1]).join(', ');
  return null;
}

function attainmentColour(pct: number): string {
  if (pct >= 1) return 'text-emerald-600';
  if (pct >= 0.85) return 'text-amber-600';
  return 'text-rose-600';
}

function Artwork({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-ph-charcoal/5 text-xs text-ph-charcoal/40">
        No artwork
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block aspect-[4/3] w-full overflow-hidden rounded-md bg-ph-charcoal/5">
      <img src={url} alt={name} className="h-full w-full object-contain" onError={() => setFailed(true)} />
    </a>
  );
}

function MetricRow({
  label,
  actual,
  target,
  isPlan,
}: {
  label: string;
  actual: number;
  target?: number;
  isPlan: boolean;
}) {
  // A plan has no results yet — show the target as the number, with no
  // red/amber attainment colouring against an inevitable zero.
  if (isPlan) {
    return (
      <div className="flex items-baseline justify-between gap-2 py-1 text-sm">
        <span className="text-ph-charcoal/60">{label}</span>
        <span className="flex items-baseline gap-2 tabular-nums">
          <span className="font-medium text-ph-charcoal">{target ? formatNumber(target) : '—'}</span>
          <span className="text-xs text-ph-charcoal/40">target</span>
        </span>
      </div>
    );
  }
  const pct = target ? pctOfTarget(actual, target) : null;
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 text-sm">
      <span className="text-ph-charcoal/60">{label}</span>
      <span className="flex items-baseline gap-2 tabular-nums">
        <span className="font-medium text-ph-charcoal">{formatNumber(actual)}</span>
        {target ? <span className="text-xs text-ph-charcoal/40">/ {formatNumber(target)}</span> : null}
        {pct != null && (
          <span className={`text-xs font-semibold ${attainmentColour(pct)}`}>{formatPercent(pct)}</span>
        )}
      </span>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-ph-charcoal/5 px-2 py-1 text-xs text-ph-charcoal/70">
      <span className="text-ph-charcoal/45">{label}</span>{' '}
      <span className="font-semibold tabular-nums text-ph-charcoal/80">{value}</span>
    </span>
  );
}

function PlacementCard({ p, isPlan }: { p: DashboardPlacement; isPlan: boolean }) {
  const impressions = p.totals['impressions'] ?? 0;
  const clicks = p.totals['clicks'] ?? 0;
  const metricKeys = p.metricKeys.filter((k) => k in p.totals || k in p.targets);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <Artwork url={p.artworkViewUrl} name={p.name} />

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug text-ph-charcoal">{p.name}</h3>
            <div className="flex shrink-0 gap-1">
              {p.isBonus && <span className="rounded bg-ph-sky/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ph-sky">Bonus</span>}
              {p.isCpdPackage && <span className="rounded bg-ph-coral/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ph-coral">CPD</span>}
            </div>
          </div>
          <p className="mt-0.5 text-xs text-ph-charcoal/50">
            {p.publisherName} · {formatTemplateCode(p.templateCode)}
            {p.subcategory && <> · {formatSubcategory(p.subcategory)}</>}
            {whenLabel(p) && <> · {whenLabel(p)}</>}
          </p>
        </div>

        {metricKeys.length > 0 && (
          <div className="divide-y divide-ph-charcoal/5 border-y border-ph-charcoal/10">
            {metricKeys.map((key) => (
              <MetricRow
                key={key}
                label={formatMetricKey(key)}
                actual={p.totals[key] ?? 0}
                target={p.targets[key]}
                isPlan={isPlan}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Chip
            label={isPlan ? 'Planned spend' : 'Spend'}
            value={formatCurrency(isPlan ? p.plannedMediaCost ?? p.mediaCost : p.mediaCost)}
          />
          {impressions > 0 && clicks > 0 && <Chip label="CTR" value={formatPercent(ctr(clicks, impressions), 2)} />}
          {impressions > 0 && <Chip label="CPM" value={formatCurrency(cpm(p.mediaCost, impressions))} />}
          {clicks > 0 && <Chip label="CPC" value={formatCurrency(cpc(p.mediaCost, clicks))} />}
          {p.cpdInvestmentCost != null && p.cpdInvestmentCost > 0 && (
            <Chip label="CPD" value={formatCurrency(p.cpdInvestmentCost)} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlacementCards({
  placements,
  isPlan = false,
}: {
  placements: DashboardPlacement[];
  isPlan?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placements</CardTitle>
        <CardDescription>
          {placements.length} placements {isPlan ? 'planned for' : 'running across'} this brand × audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placements.map((p) => (
            <PlacementCard key={p.id} p={p} isPlan={isPlan} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
