// Per the workbook's definitions sheet: touchpoints = print + digital
// impressions, where eDM opens count as digital impressions; engagements =
// clicks / completions / downloads (further actions). Unique variants
// (unique_opens, unique_clicks, …) are per-placement detail only — rolling
// them up would double-count.
export const TOUCHPOINT_KEYS = ['impressions', 'views', 'page_views', 'opens'] as const;
export const ENGAGEMENT_KEYS = ['clicks', 'completions', 'downloads'] as const;

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function sumKeys(metrics: Record<string, number>, keys: readonly string[]): number {
  let total = 0;
  for (const key of keys) {
    const v = metrics[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatTemplateCode(code: string): string {
  switch (code) {
    case 'digital_display': return 'Digital';
    case 'edm': return 'eDM';
    case 'print': return 'Print';
    case 'sponsored_content': return 'Sponsored';
    case 'education': return 'Education';
    default: return code;
  }
}

const SUBCATEGORY_LABELS: Record<string, string> = {
  solus: 'Solus',
  sponsored_content: 'Sponsored content',
  banner: 'Banner',
  module: 'Module',
  article: 'Article',
  podcast_webinar: 'Podcast / Webinar',
  clinical_audit: 'Clinical audit',
  research_paper: 'Research paper',
  quiz: 'Quiz',
};

/** Sub-category snake_case → label, e.g. "podcast_webinar" -> "Podcast / Webinar". */
export function formatSubcategory(value: string): string {
  return SUBCATEGORY_LABELS[value] ?? value;
}

/** "2025-03-05" → "5 Mar". */
export function formatSendDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTH_LABELS[m - 1]}`;
}

/** "2025-03-01" → "Mar 2025". */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return iso;
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

/** Title-case a raw metric key, e.g. "page_views" -> "Page Views". */
export function formatMetricKey(key: string): string {
  if (key.toLowerCase() === 'ctr') return 'CTR';
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-AU');
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toLocaleString('en-AU', { maximumFractionDigits: digits })}%`;
}

// ── Derived metrics (the API returns raw fields; we compute the rest) ────────
const ratio = (num: number, den: number): number => (den > 0 ? num / den : 0);

export const pctOfTarget = (actual: number, target: number): number => ratio(actual, target);
export const ctr = (clicks: number, impressions: number): number => ratio(clicks, impressions);
export const cpm = (cost: number, impressions: number): number => ratio(cost, impressions / 1000);
export const cpc = (cost: number, clicks: number): number => ratio(cost, clicks);
export const engagementRate = (engagements: number, touchpoints: number): number => ratio(engagements, touchpoints);
export const costPer = (cost: number, count: number): number => ratio(cost, count);

// ── Period helpers (month granularity, "YYYY-MM") ───────────────────────────
export interface YearMonth { year: number; month: number }

export function parseYm(ym: string): YearMonth {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}
export const toYm = ({ year, month }: YearMonth): string =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
const ord = ({ year, month }: YearMonth): number => year * 12 + (month - 1);

/** A human label for a from→to window, e.g. "Jan – Dec 2025" or "Mar 2025". */
export function formatRange(from: string, to: string): string {
  const a = parseYm(from);
  const b = parseYm(to);
  const lbl = (ym: YearMonth) => `${MONTH_LABELS[ym.month - 1]} ${ym.year}`;
  if (a.year === b.year && a.month === b.month) return lbl(a);
  if (a.year === b.year) return `${MONTH_LABELS[a.month - 1]} – ${MONTH_LABELS[b.month - 1]} ${a.year}`;
  return `${lbl(a)} – ${lbl(b)}`;
}

/** Inclusive list of months between two "YYYY-MM" bounds. */
export function monthsBetween(from: string, to: string): YearMonth[] {
  const out: YearMonth[] = [];
  for (let o = ord(parseYm(from)); o <= ord(parseYm(to)); o++) {
    out.push({ year: Math.floor(o / 12), month: (o % 12) + 1 });
  }
  return out;
}

export interface PeriodPreset { label: string; from: string; to: string }

/**
 * Build the year preset list bounded to the available data span: the full span
 * ("All time") plus one entry per calendar year (clamped to its in-data months).
 * Individual months are reached via the filter's Custom range, not presets.
 */
export function periodPresets(availableFrom: string, availableTo: string): PeriodPreset[] {
  const months = monthsBetween(availableFrom, availableTo);
  const years = [...new Set(months.map((m) => m.year))];
  const presets: PeriodPreset[] = [{ label: 'All time', from: availableFrom, to: availableTo }];
  for (const y of years) {
    const inYear = months.filter((m) => m.year === y);
    presets.push({
      label: String(y),
      from: toYm(inYear[0]),
      to: toYm(inYear[inYear.length - 1]),
    });
  }
  return presets;
}
