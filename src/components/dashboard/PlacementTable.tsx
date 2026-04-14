import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ENGAGEMENT_KEYS, TOUCHPOINT_KEYS, formatCurrency, formatTemplateCode, sumKeys } from '@/lib/metrics';
import type { DashboardPlacement } from '@/api/dashboard';

export function PlacementTable({ placements }: { placements: DashboardPlacement[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placements</CardTitle>
        <CardDescription>
          {placements.length} placements running across this brand × audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Placement</th>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 text-right font-medium">Spend</th>
                <th className="py-2 pr-4 text-right font-medium">Touchpoints</th>
                <th className="py-2 text-right font-medium">Engagements</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id} className="border-b border-ph-charcoal/5 last:border-0">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-ph-charcoal">{p.name}</div>
                    {(p.isBonus || p.isCpdPackage) && (
                      <div className="mt-0.5 flex gap-1 text-[10px] uppercase tracking-wide">
                        {p.isBonus && (
                          <span className="rounded bg-ph-sky/10 px-1.5 py-0.5 text-ph-sky">Bonus</span>
                        )}
                        {p.isCpdPackage && (
                          <span className="rounded bg-ph-coral/10 px-1.5 py-0.5 text-ph-coral">CPD</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ph-charcoal/80">{p.publisherName}</td>
                  <td className="py-2 pr-4 text-ph-charcoal/60">{formatTemplateCode(p.templateCode)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {formatCurrency(p.mediaCost)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.totals, TOUCHPOINT_KEYS).toLocaleString('en-AU')}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.totals, ENGAGEMENT_KEYS).toLocaleString('en-AU')}
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
