import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { AudienceToggle } from '@/components/dashboard/AudienceToggle';
import { getClientSummary, type ClientSummary } from '@/api/summary';
import type { AudienceSummary } from '@/api/clients';

export function DimensionPerformance({
  clientSlug,
  from,
  to,
  summary,
  audiences,
  dimension,
  title,
  subtitle,
  dimensionLabel,
}: {
  clientSlug: string;
  from?: string;
  to?: string;
  summary: ClientSummary;
  audiences: AudienceSummary[];
  dimension: 'byCategory' | 'byDigitalFormat';
  title: string;
  subtitle: string;
  dimensionLabel: string;
}) {
  const [audience, setAudience] = useState<string | null>(null);
  const filtered = useQuery({
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', '', audience ?? ''],
    queryFn: () => getClientSummary(clientSlug, { from, to, audience: audience ?? undefined }),
    enabled: !!audience,
    staleTime: 0,
  });
  const data = audience && filtered.data ? filtered.data : summary;
  const audienceName = audiences.find((a) => a.slug === audience)?.name;

  const rows: PerfRow[] = data[dimension].map((r) => perfRow(r.label, r.label, [r]));
  const total = perfTotal('Grand total', data.totals);

  return (
    <PerformanceSection
      title={title}
      subtitle={audienceName ? `${audienceName}: ${subtitle}` : subtitle}
      dimensionLabel={dimensionLabel}
      rows={rows}
      total={total}
      showChart={summary.showPublisherChart && !summary.isPlan}
      controls={<AudienceToggle audiences={audiences} value={audience} onChange={setAudience} />}
    />
  );
}
