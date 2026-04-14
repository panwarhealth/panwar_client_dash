export const TOUCHPOINT_KEYS = ['impressions', 'views', 'page_views'] as const;
export const ENGAGEMENT_KEYS = ['clicks', 'opens', 'completions', 'downloads'] as const;

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
    case 'education_video': return 'Edu video';
    case 'education_course': return 'Edu course';
    default: return code;
  }
}
