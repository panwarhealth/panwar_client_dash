import type { DashboardTotals, SummaryRow } from '@/api/summary';
import { ENGAGEMENT_KEYS, TOUCHPOINT_KEYS, sumKeys } from '@/lib/metrics';

export interface PerfRow {
  key: string;
  label: string;
  color?: string | null;
  placementCount: number;
  touchpoints: number;
  touchpointsKpi: number;
  engagements: number;
  engagementsKpi: number;
  spend: number;
  children?: PerfRow[];
}

export function perfRow(key: string, label: string, rows: SummaryRow[], color?: string | null): PerfRow {
  return {
    key,
    label,
    color,
    placementCount: rows.reduce((n, r) => n + r.placementCount, 0),
    touchpoints: rows.reduce((n, r) => n + sumKeys(r.metrics, TOUCHPOINT_KEYS), 0),
    touchpointsKpi: rows.reduce((n, r) => n + sumKeys(r.targetMetrics, TOUCHPOINT_KEYS), 0),
    engagements: rows.reduce((n, r) => n + sumKeys(r.metrics, ENGAGEMENT_KEYS), 0),
    engagementsKpi: rows.reduce((n, r) => n + sumKeys(r.targetMetrics, ENGAGEMENT_KEYS), 0),
    spend: rows.reduce((n, r) => n + r.mediaCost + r.cpdInvestmentCost, 0),
  };
}

export function perfTotal(label: string, totals: DashboardTotals, children?: PerfRow[]): PerfRow {
  return {
    key: '__total',
    label,
    placementCount: totals.placementCount,
    touchpoints: sumKeys(totals.metrics, TOUCHPOINT_KEYS),
    touchpointsKpi: sumKeys(totals.targetMetrics, TOUCHPOINT_KEYS),
    engagements: sumKeys(totals.metrics, ENGAGEMENT_KEYS),
    engagementsKpi: sumKeys(totals.targetMetrics, ENGAGEMENT_KEYS),
    spend: totals.mediaCost + totals.cpdInvestmentCost,
    children,
  };
}
