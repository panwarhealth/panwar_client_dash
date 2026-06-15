import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
import { useColumnResize, type ColumnResize } from '@/lib/columnResize';
import { MONTH_LABELS, formatNumber, monthsBetween } from '@/lib/metrics';
import type { EducationAsset } from '@/api/education';

/** "2025-03-31" → "31 Mar 2025". */
function formatExpiry(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
}

/**
 * Brand cell colours, like the workbook's highlighting. Admin-set Brand
 * colours win (matched by name, case-insensitive); education-only brands
 * that aren't Brand entities (e.g. "C&F") get a stable palette colour
 * hashed from the name so it never shifts between visits.
 */
const FALLBACK_PALETTE = [
  '#d62728', '#ff7f0e', '#1f77b4', '#2ca02c', '#9467bd',
  '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#7f7f7f',
];

function brandColor(name: string, adminColors: Record<string, string>): string {
  const admin = adminColors[name.toLowerCase()];
  if (admin) return admin;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

/** Black or white text, whichever reads better on the given hex background. */
function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Perceived luminance (ITU-R BT.601).
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1f2937' : '#ffffff';
}

type AssetSortKey = 'brand' | 'type' | 'title' | 'total';

/** Free-text haystack for an asset - everything the filter matches against. */
function assetHaystack(a: EducationAsset): string {
  return [a.brand ?? '', a.type ?? '', a.title, a.author ?? ''].join(' ').toLowerCase();
}

/** Primary-status total - the figure a reader scans the Total column for. */
function assetTotal(a: EducationAsset): number {
  return a.statuses[0]?.total ?? 0;
}

/** Fixed width (px) of each monthly column - these are not individually resized. */
const MONTH_W = 56;
/** Order + default widths (px) of the resizable (non-month) columns. */
const EDU_COLUMNS = { brand: 112, type: 96, title: 288, by: 128, expiry: 110, status: 96, total: 96 };
/** Resizable columns left of the month block, in order. */
const EDU_PRE_MONTH = ['brand', 'type', 'title', 'by', 'expiry', 'status'] as const;

/**
 * Divider lines for the education table. Like the generic `ColResizeLines` but
 * the Total column sits after the month block, so its divider is pinned to the
 * table's right edge rather than a running sum of the resizable widths.
 */
function EduResizeLines({ cols, tableWidth }: { cols: ColumnResize; tableWidth: number }) {
  const lines: { id: string; x: number }[] = [];
  let x = 0;
  for (const id of EDU_PRE_MONTH) {
    x += cols.widths[id];
    lines.push({ id, x });
  }
  lines.push({ id: 'total', x: tableWidth });
  return (
    <>
      {lines.map(({ id, x: left }) => (
        <span
          key={id}
          onPointerDown={cols.startResize(id)}
          onDoubleClick={() => cols.resetColumn(id)}
          aria-hidden
          // Left-anchored so the rightmost line never protrudes past the table edge.
          className="group absolute top-0 z-30 h-full w-2 -translate-x-full cursor-col-resize touch-none select-none"
          style={{ left }}
        >
          <span className="absolute inset-y-0 right-0 w-px bg-transparent group-hover:bg-client-primary/40" />
        </span>
      ))}
    </>
  );
}

/**
 * The workbook's per-asset education detail tables: one card per publisher
 * block, one row per asset status (Completed / Enrolled / Views) with monthly
 * columns across the selected window. Assets with no in-window data are
 * hidden; an all-time window mirrors the workbook's full history.
 *
 * A page-level text filter narrows the assets (Brand / Type / Title / By), and
 * the Brand / Type / Title / Total headers sort assets within each block -
 * keeping every asset's status rows together.
 */
export function EducationAssetTables({
  assets,
  from,
  to,
  brandColors = {},
}: {
  assets: EducationAsset[];
  from: string;
  to: string;
  /** Lowercased brand name → admin-set hex colour. */
  brandColors?: Record<string, string>;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: AssetSortKey; dir: 'asc' | 'desc' } | null>(null);
  const months = useMemo(() => monthsBetween(from, to), [from, to]);
  const cols = useColumnResize(EDU_COLUMNS, months.length * MONTH_W);
  const multiYear = useMemo(() => new Set(months.map((m) => m.year)).size > 1, [months]);
  const monthLabel = (m: { year: number; month: number }) =>
    multiYear ? `${MONTH_LABELS[m.month - 1]} '${String(m.year).slice(2)}` : MONTH_LABELS[m.month - 1];

  // Assets with anything in the window - the page has detail tables at all only
  // if this is non-empty (independent of the filter, so the controls persist
  // even when a filter matches nothing).
  const windowAssets = useMemo(
    () => assets.filter((a) => a.statuses.some((s) => s.points.length > 0)),
    [assets],
  );

  // Click a column: text columns sort A→Z first, Total sorts high→low first;
  // click again to flip. The reset button clears filter + sort together.
  const defaultDir = (key: AssetSortKey): 'asc' | 'desc' => (key === 'total' ? 'desc' : 'asc');
  const toggleSort = (key: AssetSortKey) =>
    setSort((prev) =>
      !prev || prev.key !== key
        ? { key, dir: defaultDir(key) }
        : { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' },
    );

  // Filter (whole page), group by publisher block (entry order), then sort the
  // assets within each block - status rows ride along with their asset.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: { label: string; rows: EducationAsset[] }[] = [];
    for (const a of windowAssets) {
      if (q !== '' && !assetHaystack(a).includes(q)) continue;
      const g = out.find((x) => x.label === a.groupLabel);
      if (g) g.rows.push(a);
      else out.push({ label: a.groupLabel, rows: [a] });
    }
    if (sort) {
      for (const g of out) {
        g.rows = [...g.rows].sort((a, b) => {
          if (sort.key === 'total') {
            return sort.dir === 'desc' ? assetTotal(b) - assetTotal(a) : assetTotal(a) - assetTotal(b);
          }
          const av = (sort.key === 'brand' ? a.brand : sort.key === 'type' ? a.type : a.title) ?? '';
          const bv = (sort.key === 'brand' ? b.brand : sort.key === 'type' ? b.type : b.title) ?? '';
          const cmp = av.localeCompare(bv);
          return sort.dir === 'desc' ? -cmp : cmp;
        });
      }
    }
    return out;
  }, [windowAssets, query, sort]);

  if (windowAssets.length === 0) return null;

  const SortArrow = ({ k }: { k: AssetSortKey }) =>
    sort?.key === k ? (
      sort.dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
    ) : null;
  const ariaSort = (k: AssetSortKey) =>
    sort?.key === k ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none';

  // Sticky left offsets follow the live widths so resizing Brand/Type shifts the
  // columns pinned to their right. Table width = resizable cols + the month block.
  const typeLeft = cols.widths.brand;
  const titleLeft = cols.widths.brand + cols.widths.type;
  const tableWidth = cols.totalWidth + months.length * MONTH_W;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ph-charcoal">Education detail</h2>
        <div className="flex items-center gap-2">
          {(query !== '' || sort !== null) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSort(null);
              }}
              title="Clear filter and sorting"
              aria-label="Clear filter and sorting"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ph-charcoal/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter assets…"
              className="h-9 w-56 rounded-md border border-ph-charcoal/20 bg-white pl-8 pr-2 text-sm text-ph-charcoal focus:border-client-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-ph-charcoal/50">No assets match "{query}".</p>
      ) : (
        groups.map((group) => (
          <Card key={group.label}>
            <CardHeader>
              <CardTitle>
                <span className="rounded bg-yellow-200 px-2 py-0.5">{group.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HScroll>
                <div ref={cols.measureRef} className="relative" style={{ width: tableWidth }}>
                <table className="w-full table-fixed text-left text-sm tracking-[0.02em] [&_td:not(:first-child)]:pl-2 [&_th:not(:first-child)]:pl-2">
                  <colgroup>
                    <col style={{ width: cols.widths.brand }} />
                    <col style={{ width: cols.widths.type }} />
                    <col style={{ width: cols.widths.title }} />
                    <col style={{ width: cols.widths.by }} />
                    <col style={{ width: cols.widths.expiry }} />
                    <col style={{ width: cols.widths.status }} />
                    {months.map((m) => (
                      <col key={`${m.year}-${m.month}`} style={{ width: MONTH_W }} />
                    ))}
                    <col style={{ width: cols.widths.total }} />
                  </colgroup>
                  <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
                    <tr>
                      {/* Brand + Type + Title stay pinned while the months scroll;
                          their left offsets follow the live (resizable) widths. */}
                      <th
                        className="sticky left-0 z-10 cursor-pointer select-none bg-white py-2 pr-3 font-medium hover:text-ph-charcoal"
                        onClick={() => toggleSort('brand')}
                        aria-sort={ariaSort('brand')}
                      >
                        <span className="inline-flex items-center gap-0.5">Brand <SortArrow k="brand" /></span>
                      </th>
                      <th
                        className="sticky z-10 cursor-pointer select-none bg-white py-2 pr-3 font-medium hover:text-ph-charcoal"
                        style={{ left: typeLeft }}
                        onClick={() => toggleSort('type')}
                        aria-sort={ariaSort('type')}
                      >
                        <span className="inline-flex items-center gap-0.5">Type <SortArrow k="type" /></span>
                      </th>
                      <th
                        className="sticky z-10 cursor-pointer select-none bg-white py-2 pr-3 font-medium shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)] hover:text-ph-charcoal"
                        style={{ left: titleLeft }}
                        onClick={() => toggleSort('title')}
                        aria-sort={ariaSort('title')}
                      >
                        <span className="inline-flex items-center gap-0.5">Title <SortArrow k="title" /></span>
                      </th>
                      <th className="py-2 pr-3 font-medium">By</th>
                      <th className="py-2 pr-3 font-medium">Expiry</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      {months.map((m) => (
                        <th key={`${m.year}-${m.month}`} className="px-2 py-2 text-right font-medium whitespace-nowrap">
                          {monthLabel(m)}
                        </th>
                      ))}
                      <th
                        className="cursor-pointer select-none border-l border-ph-charcoal/10 bg-yellow-50/70 py-2 pl-3 pr-3 text-right font-medium hover:text-ph-charcoal"
                        onClick={() => toggleSort('total')}
                        aria-sort={ariaSort('total')}
                      >
                        <span className="inline-flex items-center justify-end gap-0.5">Total <SortArrow k="total" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((a, ai) => {
                      const statuses = a.statuses.length > 0 ? a.statuses : [];
                      // Banding alternates per asset, not per row, so a Completed/
                      // Enrolled pair always shares one background. Sticky cells
                      // restate it as a solid colour - a transparent sticky cell
                      // would show the scrolling numbers through it.
                      const band = ai % 2 === 1;
                      const stickyBg = band ? 'bg-[#f6f6f7]' : 'bg-white';
                      return statuses.map((s, si) => {
                        const byMonth = new Map(s.points.map((p) => [`${p.year}-${p.month}`, p.value]));
                        return (
                          <tr
                            key={`${a.id}:${s.status}`}
                            className={
                              (band ? 'bg-[#f6f6f7] ' : '') +
                              (si === statuses.length - 1 ? 'border-b border-ph-charcoal/5 last:border-0' : '')
                            }
                          >
                            {si === 0 && (
                              <>
                                <td rowSpan={statuses.length} className={`sticky left-0 z-10 ${stickyBg} py-2 pr-3 align-top`}>
                                  {a.brand ? (
                                    (() => {
                                      const bg = brandColor(a.brand, brandColors);
                                      return (
                                        <span
                                          className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
                                          style={{ backgroundColor: bg, color: textOn(bg) }}
                                        >
                                          {a.brand}
                                        </span>
                                      );
                                    })()
                                  ) : (
                                    <span className="font-medium text-ph-charcoal">-</span>
                                  )}
                                </td>
                                <td
                                  rowSpan={statuses.length}
                                  className={`sticky z-10 ${stickyBg} py-2 pr-3 align-top text-ph-charcoal/70`}
                                  style={{ left: typeLeft }}
                                >
                                  {a.type ?? '-'}
                                </td>
                                <td
                                  rowSpan={statuses.length}
                                  className={`sticky z-10 ${stickyBg} py-2 pr-3 align-top text-ph-charcoal shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]`}
                                  style={{ left: titleLeft }}
                                >
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
                            <td className={`py-1 pl-2 pr-3 whitespace-nowrap ${si === 0 ? 'text-ph-charcoal/80' : 'italic text-ph-charcoal/60'}`}>
                              {s.status}
                            </td>
                            {months.map((m) => {
                              const v = byMonth.get(`${m.year}-${m.month}`);
                              return (
                                <td
                                  key={`${m.year}-${m.month}`}
                                  // Zeros stay legible but faint so real activity stands out.
                                  className={`px-2 py-1 text-right tabular-nums ${v ? 'text-ph-charcoal/80' : 'text-ph-charcoal/25'}`}
                                >
                                  {v != null ? formatNumber(v) : ''}
                                </td>
                              );
                            })}
                            <td
                              className={`border-l border-ph-charcoal/10 bg-yellow-50/70 py-1 pl-3 pr-3 text-right font-semibold tabular-nums ${s.total ? 'text-ph-charcoal' : 'text-ph-charcoal/30'}`}
                            >
                              {formatNumber(s.total)}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
                <EduResizeLines cols={cols} tableWidth={tableWidth} />
                </div>
              </HScroll>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
