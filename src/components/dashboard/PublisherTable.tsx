import { useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { ColResizeLines, useColumnResize } from '@/lib/columnResize';
import { TOUCHPOINT_KEYS, formatCurrency, sumKeys } from '@/lib/metrics';
import type { DashboardPublisher } from '@/api/dashboard';

type PubSortKey = 'placements' | 'spend' | 'touchpoints';

/** Column order + default widths (px). Stable module const - drives resize. */
const COLUMNS = { publisher: 220, placements: 120, spend: 140, touchpoints: 140 };

/** Sort value for a publisher row + column. */
function publisherSortValue(p: DashboardPublisher, key: PubSortKey): number {
  switch (key) {
    case 'placements': return p.placementCount;
    case 'spend': return p.mediaCost;
    case 'touchpoints': return sumKeys(p.metrics, TOUCHPOINT_KEYS);
  }
}

export function PublisherTable({ publishers }: { publishers: DashboardPublisher[] }) {
  const [sort, setSort] = useState<{ key: PubSortKey; dir: 'asc' | 'desc' } | null>(null);
  const cols = useColumnResize(COLUMNS);

  // Click a column: sort desc, click again to flip asc. The reset button
  // clears sorting and column widths back to defaults.
  const toggleSort = (key: PubSortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' },
    );

  const rows = sort
    ? [...publishers].sort((a, b) => {
        const av = publisherSortValue(a, sort.key);
        const bv = publisherSortValue(b, sort.key);
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : publishers;

  const SortTh = ({ k, label }: { k: PubSortKey; label: string }) => (
    <th
      className="cursor-pointer select-none whitespace-nowrap py-2 pr-4 text-right font-medium hover:text-ph-charcoal"
      onClick={() => toggleSort(k)}
      aria-sort={sort?.key === k ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <span className="inline-flex items-center justify-end gap-0.5">
        {label}
        {sort?.key === k &&
          (sort.dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Publishers</CardTitle>
            <CardDescription>Spend and reach by publisher, sorted by spend.</CardDescription>
          </div>
          {sort !== null && (
            <button
              type="button"
              onClick={() => setSort(null)}
              title="Clear sorting"
              aria-label="Clear sorting"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <HScroll>
          <div ref={cols.measureRef} className="relative" style={{ width: cols.totalWidth }}>
          <table
            className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2"
          >
            <colgroup>
              <col style={{ width: cols.widths.publisher }} />
              <col style={{ width: cols.widths.placements }} />
              <col style={{ width: cols.widths.spend }} />
              <col style={{ width: cols.widths.touchpoints }} />
            </colgroup>
            <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
              <tr>
                <th className="py-2 pr-4 font-medium">Publisher</th>
                <SortTh k="placements" label="Placements" />
                <SortTh k="spend" label="Spend" />
                <SortTh k="touchpoints" label="Touchpoints" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-ph-charcoal/5 last:border-0">
                  <td className="py-2 pr-4 font-medium text-ph-charcoal">{p.name}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">{p.placementCount}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {formatCurrency(p.mediaCost)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-ph-charcoal/80">
                    {sumKeys(p.metrics, TOUCHPOINT_KEYS).toLocaleString('en-AU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ColResizeLines cols={cols} />
          </div>
        </HScroll>
      </CardContent>
    </Card>
  );
}
