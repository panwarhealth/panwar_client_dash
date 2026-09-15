import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Newspaper, Mail, MonitorSmartphone, FileText, GraduationCap, ImageOff, Search, RotateCcw, X, ExternalLink } from 'lucide-react';
import { Bar, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartArea } from '@/components/dashboard/ChartArea';
import { HoverCard } from '@/components/dashboard/HoverCard';
import {
  TOUCHPOINT_KEYS,
  ENGAGEMENT_KEYS,
  sumKeys,
  formatCompact,
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
import type { DashboardPlacement } from '@/api/summary';

export function whenLabel(p: {
  sendDates: string[];
  startDate: string | null;
  endDate: string | null;
  liveMonths: number[];
}): string | null {
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

/** Media-type icon for the no-artwork placeholder. */
function templateIcon(code: string) {
  switch (code) {
    case 'print': return Newspaper;
    case 'edm': return Mail;
    case 'digital_display': return MonitorSmartphone;
    case 'education': return GraduationCap;
    case 'sponsored_content': return FileText;
    default: return ImageOff;
  }
}

/** Full-screen artwork viewer: dark backdrop, large centred image, Esc / click
 *  outside to close, with an "open original" escape hatch. Portalled to body so
 *  no card overflow or stacking context can clip it. */
function Lightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind from scrolling while the viewer is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
      {/* Stop clicks on the image/caption from bubbling to the backdrop. */}
      <figure className="flex max-h-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={name} className="max-h-[82vh] max-w-full rounded object-contain shadow-2xl" />
        <figcaption className="mt-6 flex items-center gap-3 text-sm text-white/80">
          <span className="max-w-md truncate">{name}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open original
          </a>
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}

function Artwork({ url, name, templateCode }: { url: string | null; name: string; templateCode: string }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  if (!url || failed) {
    const Icon = templateIcon(templateCode);
    // Intentional placeholder (not a broken-image void): media-type icon + label
    // on a soft tint, same height so the grid rows still line up.
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-b from-ph-charcoal/[0.04] to-ph-charcoal/[0.07] text-ph-charcoal/30">
        <Icon className="h-9 w-9" strokeWidth={1.5} />
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {formatTemplateCode(templateCode)}
        </span>
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-md bg-ph-charcoal/5"
        aria-label={`View artwork: ${name}`}
      >
        <img src={url} alt={name} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      </button>
      {open && <Lightbox url={url} name={name} onClose={() => setOpen(false)} />}
    </>
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
  const tone = pct != null ? `font-semibold ${attainmentColour(pct)}` : '';
  const inner = (
    <span className="flex items-baseline gap-2 tabular-nums">
      <span className="font-medium text-ph-charcoal">{formatNumber(actual)}</span>
      {target ? <span className="text-xs text-ph-charcoal/40">/ {formatNumber(target)}</span> : null}
      {pct != null && <span className={`text-xs ${tone}`}>{formatPercent(pct)}</span>}
    </span>
  );
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 text-sm">
      <span className="text-ph-charcoal/60">{label}</span>
      {target && pct != null ? (
        <HoverCard
          title={label}
          lines={[
            { label: 'Actual', value: formatNumber(actual) },
            { label: 'KPI', value: formatNumber(target) },
            { label: '% of KPI', value: formatPercent(pct), className: tone },
            { label: 'vs KPI', value: `${actual - target >= 0 ? '+' : '-'}${formatNumber(Math.abs(actual - target))}`, className: tone },
          ]}
        >
          {inner}
        </HoverCard>
      ) : (
        inner
      )}
    </div>
  );
}

function EngagementRateRow({ p, isPlan }: { p: DashboardPlacement; isPlan: boolean }) {
  const tp = sumKeys(p.totals, TOUCHPOINT_KEYS);
  const en = sumKeys(p.totals, ENGAGEMENT_KEYS);
  const tpKpi = sumKeys(p.targets, TOUCHPOINT_KEYS);
  const enKpi = sumKeys(p.targets, ENGAGEMENT_KEYS);
  const kpiRate = tpKpi > 0 && enKpi > 0 ? enKpi / tpKpi : null;
  if (isPlan) {
    if (kpiRate === null) return null;
    return (
      <div className="flex items-baseline justify-between gap-2 py-1 text-sm">
        <span className="text-ph-charcoal/60">Engagement rate</span>
        <span className="flex items-baseline gap-2 tabular-nums">
          <span className="font-medium text-ph-charcoal">{formatPercent(kpiRate, 2)}</span>
          <span className="text-xs text-ph-charcoal/40">target</span>
        </span>
      </div>
    );
  }
  if (tp <= 0 || (en <= 0 && kpiRate === null)) return null;
  const rate = en / tp;
  const pct = kpiRate ? pctOfTarget(rate, kpiRate) : null;
  const tone = pct != null ? `font-semibold ${attainmentColour(pct)}` : '';
  const inner = (
    <span className="flex items-baseline gap-2 tabular-nums">
      <span className="font-medium text-ph-charcoal">{formatPercent(rate, 2)}</span>
      {kpiRate !== null && <span className="text-xs text-ph-charcoal/40">/ {formatPercent(kpiRate, 2)}</span>}
      {pct != null && <span className={`text-xs ${tone}`}>{formatPercent(pct)}</span>}
    </span>
  );
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 text-sm">
      <span className="text-ph-charcoal/60">Engagement rate</span>
      {kpiRate !== null && pct != null ? (
        <HoverCard
          title="Engagement rate"
          lines={[
            { label: 'Engagements', value: formatNumber(en) },
            { label: 'Touchpoints', value: formatNumber(tp) },
            { label: 'Actual rate', value: formatPercent(rate, 2) },
            { label: 'KPI rate', value: formatPercent(kpiRate, 2) },
            { label: '% of KPI', value: formatPercent(pct), className: tone },
          ]}
        >
          {inner}
        </HoverCard>
      ) : (
        inner
      )}
    </div>
  );
}

const MINI_BAR = '#6b7280';
const MINI_LINE = '#a21caf';

function MiniChart({ p }: { p: DashboardPlacement }) {
  if (p.months.length === 0) return null;
  const hasEngagements = p.months.some(
    (m) => sumKeys(m.metrics, ENGAGEMENT_KEYS) > 0 || sumKeys(m.targetMetrics, ENGAGEMENT_KEYS) > 0,
  );
  const multiYear = new Set(p.months.map((m) => m.year)).size > 1;
  const data = p.months.map((m) => ({
    month: multiYear ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}` : MONTH_LABELS[m.month - 1],
    touchpoints: sumKeys(m.metrics, TOUCHPOINT_KEYS),
    touchpointsKpi: sumKeys(m.targetMetrics, TOUCHPOINT_KEYS),
    engagements: sumKeys(m.metrics, ENGAGEMENT_KEYS),
    engagementsKpi: sumKeys(m.targetMetrics, ENGAGEMENT_KEYS),
  }));
  return (
    <div className="border-t border-ph-charcoal/10 pt-2">
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-ph-charcoal/60">
        <span>Monthly vs KPI</span>
        <span className="flex items-center gap-3 normal-case tracking-normal">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: MINI_BAR }} />
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: MINI_BAR, opacity: 0.4 }} />
            Touchpoints
          </span>
          {hasEngagements && (
            <span className="flex items-center gap-1" style={{ color: MINI_LINE }}>
              <svg width="18" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="18" y2="3" stroke={MINI_LINE} strokeWidth="2" />
              </svg>
              Engagements
            </span>
          )}
        </span>
      </div>
      <ChartArea height={130}>
        {(w, h) => (
          <ComposedChart width={w} height={h} data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barGap={1}>
            <XAxis dataKey="month" stroke="#454646" fontSize={10} tickLine={false} axisLine={false} interval={0} />
            <YAxis yAxisId="left" stroke="#454646" fontSize={10} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatCompact(v as number)} />
            {hasEngagements && (
              <YAxis yAxisId="right" orientation="right" stroke="#454646" fontSize={10} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => formatCompact(v as number)} />
            )}
            <Tooltip
              formatter={(v) => Math.round(v as number).toLocaleString('en-AU')}
              contentStyle={{ borderRadius: 3, border: '1px solid rgba(69, 70, 70, 0.1)', fontSize: 11 }}
            />
            <Bar yAxisId="left" dataKey="touchpoints" name="Touchpoints" fill={MINI_BAR} maxBarSize={14} isAnimationActive={false} />
            <Bar yAxisId="left" dataKey="touchpointsKpi" name="Touchpoints KPI" fill={MINI_BAR} fillOpacity={0.4} maxBarSize={14} isAnimationActive={false} />
            {hasEngagements && (
              <Line yAxisId="right" type="linear" dataKey="engagements" name="Engagements" stroke={MINI_LINE} strokeWidth={1.5} dot={{ r: 2 }} isAnimationActive={false} />
            )}
            {hasEngagements && (
              <Line yAxisId="right" type="linear" dataKey="engagementsKpi" name="Engagements KPI" stroke={MINI_LINE} strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.55} dot={false} isAnimationActive={false} />
            )}
          </ComposedChart>
        )}
      </ChartArea>
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

/** Maria's per-placement findings from the workbook. */
function PlacementFindings({ text }: { text: string }) {
  return (
    <div className="border-t border-ph-charcoal/10 pt-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ph-charcoal">Findings</div>
      <p className="mt-1 whitespace-pre-line text-sm leading-[1.7] tracking-[0.02em] text-ph-charcoal/75">{text}</p>
    </div>
  );
}

function PlacementCard({ p, isPlan }: { p: DashboardPlacement; isPlan: boolean }) {
  const impressions = p.totals['impressions'] ?? 0;
  const clicks = p.totals['clicks'] ?? 0;
  const metricKeys = p.metricKeys.filter((k) => k !== 'media_cost' && (k in p.totals || k in p.targets));

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <Artwork url={p.artworkViewUrl} name={p.name} templateCode={p.templateCode} />

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug text-ph-charcoal">{p.name}</h3>
            <div className="flex shrink-0 gap-1">
              {p.isBonus && <span className="rounded bg-ph-sky/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ph-sky">Bonus</span>}
            </div>
          </div>
          <p className="mt-0.5 text-xs text-ph-charcoal/50">
            {p.publisherName} · {formatTemplateCode(p.templateCode)}
            {p.subcategory && <> · {formatSubcategory(p.subcategory)}</>}
            {whenLabel(p) && <> · {whenLabel(p)}</>}
          </p>
          <p className="mt-0.5 text-xs text-ph-charcoal/50">
            OneSpot code: <span className="font-mono text-ph-charcoal/70">{p.osCode ?? 'N/A'}</span>
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
            <EngagementRateRow p={p} isPlan={isPlan} />
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
        </div>

        {!isPlan && <MiniChart p={p} />}

        {p.comments && <PlacementFindings text={p.comments} />}
      </CardContent>
    </Card>
  );
}

/** Free-text haystack for a placement - everything the search filters against. */
function placementHaystack(p: DashboardPlacement): string {
  return [
    p.name,
    p.publisherName,
    formatTemplateCode(p.templateCode),
    p.subcategory ? formatSubcategory(p.subcategory) : '',
    p.osCode ?? '',
    p.comments ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

export function PlacementCards({
  placements,
  isPlan = false,
}: {
  placements: DashboardPlacement[];
  isPlan?: boolean;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q === '' ? placements : placements.filter((p) => placementHaystack(p).includes(q));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Placements</CardTitle>
            <CardDescription>
              {filtered.length}
              {q !== '' && ` of ${placements.length}`} placements{' '}
              {isPlan ? 'planned for' : 'running across'} this brand × audience.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                title="Clear filter"
                aria-label="Clear filter"
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
                placeholder="Filter placements…"
                className="h-9 w-56 rounded-md border border-ph-charcoal/20 bg-white pl-8 pr-2 text-sm text-ph-charcoal focus:border-client-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-ph-charcoal/50">No placements match "{query}".</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PlacementCard key={p.id} p={p} isPlan={isPlan} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
