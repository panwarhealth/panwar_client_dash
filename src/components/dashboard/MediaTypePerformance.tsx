import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { BrandSelect } from '@/components/dashboard/BrandSelect';
import { getClientSummary, type ClientSummary } from '@/api/summary';

const TOTAL_BAR = '#6b7280';
const FORMAT_BARS = ['#0e7490', '#d97706', '#7c3aed', '#16a34a', '#db2777', '#2563eb'];

export function MediaTypePerformance({
  clientSlug,
  from,
  to,
  summary,
  hideBrandFilter = false,
}: {
  clientSlug: string;
  from?: string;
  to?: string;
  summary: ClientSummary;
  hideBrandFilter?: boolean;
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

  const formats: PerfRow[] = data.byDigitalFormat.map((r, i) =>
    perfRow(r.label, r.label, [r], FORMAT_BARS[i % FORMAT_BARS.length]),
  );
  const rows: PerfRow[] = data.byCategory.map((r) => {
    const row = perfRow(r.label, `Total ${r.label}`, [r], TOTAL_BAR);
    if (r.label === 'Digital') row.children = formats;
    return row;
  });
  const chartRows = rows.flatMap((r) => [r, ...(r.children ?? [])]);
  const total = perfTotal('Grand total', data.totals);

  return (
    <PerformanceSection
      title="Performance by media type"
      subtitle={
        scope
          ? `${scope}: touchpoints, engagements and spend by media type.`
          : 'Touchpoints, engagements and spend by media type. Digital formats add up to Total Digital.'
      }
      dimensionLabel="Media type"
      rows={rows}
      chartRows={chartRows}
      total={total}
      showChart={summary.showPublisherChart && !summary.isPlan}
      controls={hideBrandFilter ? undefined : <BrandSelect brands={summary.brands} value={brand} onChange={setBrand} />}
    />
  );
}
