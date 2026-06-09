import { apiFetch } from './client';
import type { DashboardPeriod, DashboardTotals } from './dashboard';

/** Mirror of the API's ClientSummaryResponse (Panwar.Api.Models.DTOs). */
export interface ClientSummary {
  client: { id: string; name: string; slug: string };
  period: DashboardPeriod;
  totals: DashboardTotals;
  byBrandAudience: SummaryRow[];
  byPublisher: SummaryRow[];
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
