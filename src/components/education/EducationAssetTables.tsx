import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MONTH_LABELS, formatNumber, monthsBetween } from '@/lib/metrics';
import type { EducationAsset } from '@/api/education';

/** "2025-03-31" → "31 Mar 2025". */
function formatExpiry(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
}

/**
 * The workbook's per-asset education detail tables: one card per publisher
 * block, one row per asset status (Completed / Enrolled / Views) with monthly
 * columns across the selected window. Assets with no in-window data are
 * hidden; an all-time window mirrors the workbook's full history.
 */
export function EducationAssetTables({
  assets,
  from,
  to,
}: {
  assets: EducationAsset[];
  from: string;
  to: string;
}) {
  const months = useMemo(() => monthsBetween(from, to), [from, to]);
  const multiYear = useMemo(() => new Set(months.map((m) => m.year)).size > 1, [months]);
  const monthLabel = (m: { year: number; month: number }) =>
    multiYear ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}` : MONTH_LABELS[m.month - 1];

  // Group by the publisher block label, preserving entry order; drop assets
  // with nothing in the window.
  const groups = useMemo(() => {
    const out: { label: string; rows: EducationAsset[] }[] = [];
    for (const a of assets) {
      if (!a.statuses.some((s) => s.points.length > 0)) continue;
      const g = out.find((x) => x.label === a.groupLabel);
      if (g) g.rows.push(a);
      else out.push({ label: a.groupLabel, rows: [a] });
    }
    return out;
  }, [assets]);

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Brand</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="min-w-56 py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 font-medium">By</th>
                    <th className="py-2 pr-3 font-medium">Expiry</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    {months.map((m) => (
                      <th key={`${m.year}-${m.month}`} className="px-2 py-2 text-right font-medium whitespace-nowrap">
                        {monthLabel(m)}
                      </th>
                    ))}
                    <th className="py-2 pl-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((a) => {
                    const statuses = a.statuses.length > 0 ? a.statuses : [];
                    return statuses.map((s, si) => {
                      const byMonth = new Map(s.points.map((p) => [`${p.year}-${p.month}`, p.value]));
                      return (
                        <tr
                          key={`${a.id}:${s.status}`}
                          className={si === statuses.length - 1 ? 'border-b border-ph-charcoal/5 last:border-0' : ''}
                        >
                          {si === 0 && (
                            <>
                              <td rowSpan={statuses.length} className="py-2 pr-3 align-top font-medium text-ph-charcoal">
                                {a.brand ?? '-'}
                              </td>
                              <td rowSpan={statuses.length} className="py-2 pr-3 align-top text-ph-charcoal/70">
                                {a.type ?? '-'}
                              </td>
                              <td rowSpan={statuses.length} className="py-2 pr-3 align-top text-ph-charcoal">
                                {a.title}
                              </td>
                              <td rowSpan={statuses.length} className="py-2 pr-3 align-top text-ph-charcoal/70">
                                {a.author ?? '-'}
                              </td>
                              <td rowSpan={statuses.length} className="py-2 pr-3 align-top whitespace-nowrap text-ph-charcoal/70">
                                {a.expiry ? formatExpiry(a.expiry) : '-'}
                              </td>
                            </>
                          )}
                          <td className={`py-1.5 pr-3 whitespace-nowrap ${si === 0 ? 'text-ph-charcoal/80' : 'italic text-ph-charcoal/60'}`}>
                            {s.status}
                          </td>
                          {months.map((m) => {
                            const v = byMonth.get(`${m.year}-${m.month}`);
                            return (
                              <td key={`${m.year}-${m.month}`} className="px-2 py-1.5 text-right tabular-nums text-ph-charcoal/80">
                                {v != null ? formatNumber(v) : ''}
                              </td>
                            );
                          })}
                          <td className="py-1.5 pl-2 text-right font-semibold tabular-nums text-ph-charcoal">
                            {formatNumber(s.total)}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
