import { apiFetch } from './client';
import type { DashboardPeriod, DashboardTotals } from './dashboard';

/** Mirror of the API's ClientSummaryResponse (Panwar.Api.Models.DTOs). */
export interface ClientSummary {
  client: { id: string; name: string; slug: string };
  period: DashboardPeriod;
  totals: DashboardTotals;
  byBrandAudience: SummaryRow[];
  byPublisher: SummaryRow[];
  /** True when the window has no actuals - the dashboard shows a plan, not results. */
  isPlan: boolean;
  /** Analyst-written summary for the window's end year; null when none exists. */
  summary: { year: number; text: string } | null;
  /** Per-client toggle: render the monthly touchpoints-by-brand chart. */
  showBrandMonthlyChart: boolean;
  /** Per-client toggle: render the touchpoints-vs-engagements-by-publisher chart. */
  showPublisherChart: boolean;
  /** Monthly in-window metrics per brand; empty when disabled or planning. */
  monthlyByBrand: BrandMonthly[];
  /** Every placement as its own row (the workbook's FY25 Summary by Asset). */
  byAsset: AssetRow[];
}

export interface AssetRow {
  name: string;
  brandName: string;
  brandSlug: string;
  audienceName: string;
  publisherName: string;
  objective: string;
  /** Metric template code: 'print' | 'digital_display' | 'edm' | 'sponsored_content' | 'education'. */
  templateCode: string;
  mediaCost: number;
  cpdInvestmentCost: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export interface BrandMonthly {
  label: string;
  brandSlug: string;
  months: { year: number; month: number; metrics: Record<string, number> }[];
}

export interface SummaryRow {
  label: string;
  brandSlug: string | null;
  audienceSlug: string | null;
  placementCount: number;
  mediaCost: number;
  plannedMediaCost: number | null;
  cpdInvestmentCost: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export async function getClientSummary(
  clientSlug: string,
  period?: { from?: string; to?: string },
): Promise<ClientSummary> {
  const qs = new URLSearchParams();
  if (period?.from) qs.set('from', period.from);
  if (period?.to) qs.set('to', period.to);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<ClientSummary>(`/dashboards/${encodeURIComponent(clientSlug)}/summary${suffix}`);
}
