import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import type { ClientSummary } from '@/api/summary';
import type { AudienceSummary } from '@/api/clients';

export function AudiencePerformance({
  summary,
  audiences,
}: {
  summary: ClientSummary;
  audiences: AudienceSummary[];
}) {
  const rows: PerfRow[] = audiences
    .map((a) => {
      const ar = summary.byBrandAudience.filter((r) => r.audienceSlug === a.slug);
      return ar.length > 0 ? perfRow(a.slug, a.name, ar) : null;
    })
    .filter((r): r is PerfRow => r !== null);
  const total = perfTotal('Grand total', summary.totals);

  return (
    <PerformanceSection
      title="Performance by audience"
      subtitle="Touchpoints, engagements and spend (incl. CPD) by audience."
      dimensionLabel="Audience"
      rows={rows}
      total={total}
      showChart={!summary.isPlan}
    />
  );
}
