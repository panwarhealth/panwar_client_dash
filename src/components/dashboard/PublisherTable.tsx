import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TOUCHPOINT_KEYS, formatCurrency, sumKeys } from '@/lib/metrics';
import type { DashboardPublisher } from '@/api/dashboard';

export function PublisherTable({ publishers }: { publishers: DashboardPublisher[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishers</CardTitle>
        <CardDescription>Spend and reach by publisher, sorted by spend.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 text-right font-medium">Placements</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 text-right font-medium">Touchpoints</th>
              </tr>
            </thead>
            <tbody>
              {publishers.map((p) => (
                <tr key={p.id} className="border-b border-ph-charcoal/5 last:border-0">
                  <td className="py-2 pr-4 font-medium text-ph-charcoal">{p.name}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{p.placementCount}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {formatCurrency(p.mediaCost)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.metrics, TOUCHPOINT_KEYS).toLocaleString('en-AU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
