import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { getClientSummary, type ClientSummary } from '@/api/summary';
import type { AudienceSummary } from '@/api/clients';
import { BrandSelect } from '@/components/dashboard/BrandSelect';

export function AudiencePerformance({
  clientSlug,
  from,
  to,
  summary,
  hideBrandFilter = false,
  audiences,
}: {
  clientSlug: string;
  from?: string;
  to?: string;
  summary: ClientSummary;
  hideBrandFilter?: boolean;
  audiences: AudienceSummary[];
}) {
  const [brand, setBrand] = useState<string | null>(null);
  const filtered = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', brand ?? '', ''],
    queryFn: () => getClientSummary(clientSlug, { from, to, brand: brand ?? undefined }),
    enabled: !!brand,
    staleTime: 0,
  });
  const data = brand && filtered.data ? filtered.data : summary;
  const activeBrand = brand ? summary.brands.find((b) => b.slug === brand) : undefined;

  const rows: PerfRow[] = audiences
    .map((a) => {
      const ar = data.byBrandAudience.filter((r) => r.audienceSlug === a.slug);
      return ar.length > 0 ? perfRow(a.slug, a.name, ar) : null;
    })
    .filter((r): r is PerfRow => r !== null);
  const total = perfTotal('Grand total', data.totals);

  const controls = hideBrandFilter ? undefined : <BrandSelect brands={summary.brands} value={brand} onChange={setBrand} />;

  return (
    <PerformanceSection
      title="Performance by audience"
      subtitle={
        activeBrand
          ? `${activeBrand.name} touchpoints, engagements and spend (incl. CPD) by audience.`
          : 'Touchpoints, engagements and spend (incl. CPD) by audience.'
      }
      dimensionLabel="Audience"
      rows={rows}
      total={total}
      showChart={!summary.isPlan}
      controls={controls}
    />
  );
}
