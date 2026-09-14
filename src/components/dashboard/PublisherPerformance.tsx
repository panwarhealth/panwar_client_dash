import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PerformanceSection, perfRow, perfTotal, type PerfRow } from '@/components/dashboard/PerformanceSection';
import { AudienceToggle } from '@/components/dashboard/AudienceToggle';
import { getClientSummary, type ClientSummary } from '@/api/summary';
import type { AudienceSummary } from '@/api/clients';

function publisherAbbrev(label: string): string {
  const words = label.split(' ');
  if (words.length === 1) return label;
  return words
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join('');
}

export function PublisherPerformance({
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
    queryKey: ['summary', clientSlug, from ?? '', to ?? '', '', audience ?? ''],
    queryFn: () => getClientSummary(clientSlug, { from, to, audience: audience ?? undefined }),
    enabled: !!audience,
    staleTime: 0,
  });
  const data = audience && filtered.data ? filtered.data : summary;
  const audienceName = audiences.find((a) => a.slug === audience)?.name;

  const rows: PerfRow[] = data.byPublisher.map((r) => perfRow(r.label, r.label, [r]));
  const total = perfTotal('Grand total', data.totals);

  return (
    <PerformanceSection
      title="Performance by publisher"
      subtitle={
        audienceName
          ? `${audienceName} touchpoints, engagements and spend (incl. CPD) by publisher.`
          : 'Touchpoints, engagements and spend (incl. CPD) by publisher.'
      }
      dimensionLabel="Publisher"
      rows={rows}
      total={total}
      showChart={summary.showPublisherChart && !summary.isPlan}
      abbreviate={publisherAbbrev}
      controls={<AudienceToggle audiences={audiences} value={audience} onChange={setAudience} />}
    />
  );
}
