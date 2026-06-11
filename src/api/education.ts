import { apiFetch } from './client';
import type { DashboardPeriod } from './dashboard';

/** Mirror of the API's education read DTOs (Panwar.Api.Models.DTOs). */
export interface EducationPageSummary {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  chartCount: number;
  /** Series across the page's charts. */
  moduleCount: number;
  /** Detail-table asset rows. */
  assetCount: number;
  /** Sum of the "Completed" status values (single-sourced from the asset tables). */
  completions: number;
}

export interface EducationPoint {
  year: number;
  month: number;
  value: number;
}

export interface EducationSeries {
  id: string;
  label: string;
  color: string | null;
  sortOrder: number;
  points: EducationPoint[];
}

export interface EducationAnnotation {
  id: string;
  seriesId: string;
  year: number;
  month: number;
  text: string;
}

export interface EducationChart {
  id: string;
  title: string;
  subtitle: string | null;
  sortOrder: number;
  series: EducationSeries[];
  annotations: EducationAnnotation[];
}

export interface EducationAssetStatus {
  status: string;
  points: EducationPoint[];
  total: number;
}

/** One row of the page's detail table (the workbook's per-asset education table). */
export interface EducationAsset {
  id: string;
  groupLabel: string;
  brand: string | null;
  type: string | null;
  title: string;
  author: string | null;
  expiry: string | null;
  sortOrder: number;
  statuses: EducationAssetStatus[];
}

export interface EducationPageResponse {
  page: EducationPageSummary;
  period: DashboardPeriod;
  charts: EducationChart[];
  assets: EducationAsset[];
}

export async function getEducationPages(clientSlug: string): Promise<EducationPageSummary[]> {
  const res = await apiFetch<{ pages: EducationPageSummary[] }>(
    `/dashboards/${encodeURIComponent(clientSlug)}/education`,
  );
  return res.pages;
}

export async function getEducationPage(
  clientSlug: string,
  pageSlug: string,
  period?: { from?: string; to?: string },
): Promise<EducationPageResponse> {
  const qs = new URLSearchParams();
  if (period?.from) qs.set('from', period.from);
  if (period?.to) qs.set('to', period.to);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<EducationPageResponse>(
    `/dashboards/${encodeURIComponent(clientSlug)}/education/${encodeURIComponent(pageSlug)}${suffix}`,
  );
}
