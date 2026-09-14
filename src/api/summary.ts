import { apiFetch } from './client';

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

export interface PlacementMonth {
  year: number;
  month: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export interface DashboardPlacement {
  id: string;
  name: string;
  objective: string;
  templateCode: string;
  mediaType: string;
  publisherName: string;
  publisherSlug: string;
  audienceName: string;
  audienceSlug: string;
  osCode: string | null;
  isBonus: boolean;
  mediaCost: number;
  plannedMediaCost: number | null;
  artworkViewUrl: string | null;
  liveMonths: number[];
  startDate: string | null;
  endDate: string | null;
  subcategory: string | null;
  sendDates: string[];
  metricKeys: string[];
  totals: Record<string, number>;
  targets: Record<string, number>;
  comments: string | null;
  months: PlacementMonth[];
}

export interface ClientSummary {
  client: { id: string; name: string; slug: string };
  period: DashboardPeriod;
  totals: DashboardTotals;
  byBrandAudience: SummaryRow[];
  byPublisher: SummaryRow[];
  byCategory: SummaryRow[];
  byDigitalFormat: SummaryRow[];
  brands: BrandRef[];
  isPlan: boolean;
  summary: { year: number; text: string } | null;
  showBrandMonthlyChart: boolean;
  showPublisherChart: boolean;
  byAsset: AssetRow[];
  placements: DashboardPlacement[];
}

export interface AssetRow {
  name: string;
  brandName: string;
  brandSlug: string;
  audienceName: string;
  publisherName: string;
  objective: string;
  templateCode: string;
  mediaCost: number;
  cpdInvestmentCost: number;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export interface BrandRef {
  slug: string;
  name: string;
  color: string | null;
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
  period?: { from?: string; to?: string; brand?: string; audience?: string },
): Promise<ClientSummary> {
  const qs = new URLSearchParams();
  if (period?.from) qs.set('from', period.from);
  if (period?.to) qs.set('to', period.to);
  if (period?.brand) qs.set('brand', period.brand);
  if (period?.audience) qs.set('audience', period.audience);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<ClientSummary>(`/dashboards/${encodeURIComponent(clientSlug)}/summary${suffix}`);
}
