import { Card, CardContent } from '@/components/ui/card';
import {
  TOUCHPOINT_KEYS,
  ENGAGEMENT_KEYS,
  sumKeys,
  formatCurrency,
  formatNumber,
  formatPercent,
  engagementRate,
  costPer,
  pctOfTarget,
} from '@/lib/metrics';
import type { DashboardTotals } from '@/api/dashboard';

/** Colour band for a % of KPI attainment. */
function bandClass(pct: number): string {
  if (pct >= 1) return 'bg-emerald-500';
  if (pct >= 0.85) return 'bg-amber-500';
  return 'bg-rose-500';
}

function AttainmentBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(pct, 1.5));
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ph-charcoal/10">
        <div className={`h-full rounded-full ${bandClass(pct)}`} style={{ width: `${(clamped / 1.5) * 100}%` }} />
      </div>
      <span className="mt-1 block text-xs font-medium text-ph-charcoal/60">
        {formatPercent(pct)} of KPI
      </span>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col p-5">
        <span className="text-xs uppercase tracking-wide text-ph-charcoal/60">{label}</span>
        <span className="mt-1 text-2xl font-semibold tabular-nums text-ph-charcoal">{value}</span>
        {sub && <span className="mt-0.5 text-xs text-ph-charcoal/50">{sub}</span>}
        {children}
      </CardContent>
    </Card>
  );
}

export function SummaryBanner({ totals }: { totals: DashboardTotals }) {
  const touchpoints = sumKeys(totals.metrics, TOUCHPOINT_KEYS);
  const touchpointsTarget = sumKeys(totals.targetMetrics, TOUCHPOINT_KEYS);
  const engagements = sumKeys(totals.metrics, ENGAGEMENT_KEYS);
  const engagementsTarget = sumKeys(totals.targetMetrics, ENGAGEMENT_KEYS);
  const spend = totals.mediaCost + totals.cpdInvestmentCost;
  const planned = totals.plannedMediaCost;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile label="Total Touchpoints" value={formatNumber(touchpoints)} sub={`vs ${formatNumber(touchpointsTarget)} expected`}>
        {touchpointsTarget > 0 && <AttainmentBar pct={pctOfTarget(touchpoints, touchpointsTarget)} />}
      </Tile>

      <Tile label="Total Engagements" value={formatNumber(engagements)} sub={`vs ${formatNumber(engagementsTarget)} expected`}>
        {engagementsTarget > 0 && <AttainmentBar pct={pctOfTarget(engagements, engagementsTarget)} />}
      </Tile>

      <Tile label="Engagement Rate" value={formatPercent(engagementRate(engagements, touchpoints), 2)} sub="engagements ÷ touchpoints" />

      <Tile
        label="Spend (incl CPD)"
        value={formatCurrency(spend)}
        sub={planned != null ? `of ${formatCurrency(planned)} planned` : `${formatCurrency(totals.cpdInvestmentCost)} CPD investment`}
      >
        {planned != null && planned > 0 && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ph-charcoal/10">
              <div
                className="h-full rounded-full bg-client-primary"
                style={{ width: `${Math.min((spend / planned) * 100, 100)}%` }}
              />
            </div>
            <span className="mt-1 block text-xs font-medium text-ph-charcoal/60">
              {formatPercent(pctOfTarget(spend, planned))} of plan
            </span>
          </div>
        )}
      </Tile>

      <Tile label="Cost per Touchpoint" value={formatCurrency(costPer(spend, touchpoints / 1000))} sub="per 1,000 touchpoints" />
      <Tile label="Cost per Engagement" value={formatCurrency(costPer(spend, engagements))} sub="per engagement" />
    </div>
  );
}
