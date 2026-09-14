import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { getClientSummary, type ClientSummary } from '@/api/summary';
import type { AudienceSummary } from '@/api/clients';
import { AudienceToggle } from '@/components/dashboard/AudienceToggle';

export function BrandPerformance({
  clientSlug,
  from,
  to,
  summary,
  audiences,
}: {
  clientSlug: string;
  from?: string;
  to?: string;
  summary: ClientSummary;
  audiences: AudienceSummary[];
}) {
  const [audience, setAudience] = useState<string | null>(null);
  const filtered = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', '', audience],
    queryFn: () => getClientSummary(clientSlug, { from, to, audience: audience ?? undefined }),
    enabled: !!audience,
    staleTime: 0,
  });
  const data = audience && filtered.data ? filtered.data : summary;
  const audienceName = (slug: string | null) => audiences.find((a) => a.slug === slug)?.name ?? slug ?? '';

  const rows: PerfRow[] = summary.brands
    .map((b) => {
      const brandRows = data.byBrandAudience.filter((r) => r.brandSlug === b.slug);
      if (brandRows.length === 0) return null;
      const row = perfRow(b.slug, b.name, brandRows, b.color);
      if (!audience) {
        row.children = audiences
          .map((a) => {
            const ar = brandRows.filter((r) => r.audienceSlug === a.slug);
            return ar.length > 0 ? perfRow(`${b.slug}:${a.slug}`, a.name, ar) : null;
          })
          .filter((r): r is PerfRow => r !== null);
      }
      return row;
    })
    .filter((r): r is PerfRow => r !== null);

  const totalChildren = audience
    ? undefined
    : audiences
        .map((a) => {
          const ar = data.byBrandAudience.filter((r) => r.audienceSlug === a.slug);
          return ar.length > 0 ? perfRow(`total:${a.slug}`, a.name, ar) : null;
        })
        .filter((r): r is PerfRow => r !== null);
  const total = perfTotal('Grand total', data.totals, totalChildren);

  const controls = <AudienceToggle audiences={audiences} value={audience} onChange={setAudience} />;

  return (
    <PerformanceSection
      title="Performance by brand"
      subtitle={
        audience
          ? `${audienceName(audience)} touchpoints, engagements and spend (incl. CPD) by brand.`
          : 'Touchpoints, engagements and spend (incl. CPD) by brand, split by audience.'
      }
      dimensionLabel="Brand"
      rows={rows}
      total={total}
      showChart={!summary.isPlan}
      controls={controls}
    />
  );
}
