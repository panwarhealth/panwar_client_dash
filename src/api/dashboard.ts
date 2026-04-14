import { apiFetch } from './client';

/**
 * Mirror of the API's DashboardResponse record (Panwar.Api.Models.DTOs).
 *
 * Metric values are returned as flexible `metricKey -> number` maps so the
 * payload can carry whichever metrics each placement template tracks
 * (impressions/clicks/views/sends/page_views/etc.) without a column-per-metric
 * schema. The frontend looks up the metrics it cares about by key.
 */
export interface DashboardResponse {
  brand: DashboardBrand;
  audience: DashboardAudience;
  year: number;
  totals: DashboardTotals;
  monthly: DashboardMonth[];
  publishers: DashboardPublisher[];
  placements: DashboardPlacement[];
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

export interface DashboardTotals {
  placementCount: number;
  mediaCost: number;
  metrics: Record<string, number>;
}

export interface DashboardMonth {
  month: number;
  metrics: Record<string, number>;
}

export interface DashboardPublisher {
  id: string;
  name: string;
  slug: string;
  placementCount: number;
  mediaCost: number;
  metrics: Record<string, number>;
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
  liveMonths: number[];
  totals: Record<string, number>;
  targets: Record<string, number>;
}

export async function getDashboard(
  clientSlug: string,
  brandSlug: string,
  audienceSlug: string,
): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>(
    `/dashboards/${encodeURIComponent(clientSlug)}/${encodeURIComponent(brandSlug)}/${encodeURIComponent(audienceSlug)}`,
  );
}
