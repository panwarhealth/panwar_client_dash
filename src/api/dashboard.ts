import { apiFetch } from './client';

/**
 * Mirror of the API's DashboardResponse record (Panwar.Api.Models.DTOs).
 *
 * Metric values are returned as flexible `metricKey -> number` maps so the
 * payload can carry whichever metrics each placement template tracks
 * (impressions/clicks/views/sends/page_views/etc.) without a column-per-metric
 * schema. Calculated metrics (CTR/CPM/CPC, engagement rate, cost-per-X) are
 * derived in the frontend — see `lib/metrics`.
 */
export interface DashboardResponse {
  brand: DashboardBrand;
  audience: DashboardAudience;
  period: DashboardPeriod;
  totals: DashboardTotals;
  monthly: DashboardMonth[];
  publishers: DashboardPublisher[];
  placements: DashboardPlacement[];
  /** True when the window has no actuals - the dashboard shows a plan, not results. */
  isPlan: boolean;
}

export interface DashboardBrand {
  id: string;
  name: string;
  slug: string;
}

export interface DashboardAudience {
  id: string;
  name: string;
  slug: string;
}

/** Resolved month window ("YYYY-MM") + the full span of data that exists. */
export interface DashboardPeriod {
  from: string;
  to: string;
  availableFrom: string | null;
  availableTo: string | null;
}

export interface DashboardTotals {
  placementCount: number;
  mediaCost: number;
  plannedMediaCost: number | null;
  cpdInvestmentCost: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export interface DashboardMonth {
  year: number;
  month: number;
  metrics: Record<string, number>;
}

export interface DashboardPublisher {
  id: string;
  name: string;
  slug: string;
  placementCount: number;
  mediaCost: number;
  plannedMediaCost: number | null;
  cpdInvestmentCost: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export interface DashboardPlacement {
  id: string;
  name: string;
  objective: string;
  templateCode: string;
  publisherName: string;
  publisherSlug: string;
  isBonus: boolean;
  isCpdPackage: boolean;
  mediaCost: number;
  plannedMediaCost: number | null;
  cpdInvestmentCost: number | null;
  artworkViewUrl: string | null;
  liveMonths: number[];
  /** eDM send date / education range start ("YYYY-MM-DD"); null for live-month placements. */
  startDate: string | null;
  /** Education range end ("YYYY-MM-DD"); null otherwise. */
  endDate: string | null;
  /** eDM or education sub-category (snake_case); null when not applicable. */
  subcategory: string | null;
  /** In-window send dates for a merged eDM group ("YYYY-MM-DD"), sorted; empty otherwise. */
  sendDates: string[];
  /** Storable metric keys in template SortOrder — use to drive display order. */
  metricKeys: string[];
  totals: Record<string, number>;
  targets: Record<string, number>;
  /** Analyst's findings/commentary for this placement (the workbook's per-placement comments); null when none. */
  comments: string | null;
}

export async function getDashboard(
  clientSlug: string,
  brandSlug: string,
  audienceSlug: string,
  period?: { from?: string; to?: string },
): Promise<DashboardResponse> {
  const qs = new URLSearchParams();
  if (period?.from) qs.set('from', period.from);
  if (period?.to) qs.set('to', period.to);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<DashboardResponse>(
    `/dashboards/${encodeURIComponent(clientSlug)}/brands/${encodeURIComponent(brandSlug)}/${encodeURIComponent(audienceSlug)}${suffix}`,
  );
}
