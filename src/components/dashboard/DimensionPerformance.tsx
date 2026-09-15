import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { BrandSelect } from '@/components/dashboard/BrandSelect';
import { getClientSummary, type ClientSummary } from '@/api/summary';

export function DimensionPerformance({
  clientSlug,
  from,
  to,
  summary,
  hideBrandFilter = false,
  dimension,
  title,
  subtitle,
  dimensionLabel,
  abbreviate,
}: {
  clientSlug: string;
  from?: string;
  to?: string;
  summary: ClientSummary;
  hideBrandFilter?: boolean;
  dimension: 'byPublisher';
  title: string;
  subtitle: string;
  dimensionLabel: string;
  abbreviate?: (label: string) => string;
}) {
  const [brand, setBrand] = useState<string | null>(null);
  const filtered = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', brand ?? '', ''],
    queryFn: () => getClientSummary(clientSlug, { from, to, brand: brand ?? undefined }),
    enabled: !!brand,
    staleTime: 0,
  });
  const data = brand && filtered.data ? filtered.data : summary;
  const scope = summary.brands.find((b) => b.slug === brand)?.name;

  const rows: PerfRow[] = data[dimension].map((r) => perfRow(r.label, r.label, [r]));
  const total = perfTotal('Grand total', data.totals);

  return (
    <PerformanceSection
      title={title}
      subtitle={scope ? `${scope}: ${subtitle}` : subtitle}
      dimensionLabel={dimensionLabel}
      rows={rows}
      total={total}
      showChart={summary.showPublisherChart && !summary.isPlan}
      abbreviate={abbreviate}
      controls={hideBrandFilter ? undefined : <BrandSelect brands={summary.brands} value={brand} onChange={setBrand} />}
    />
  );
}
