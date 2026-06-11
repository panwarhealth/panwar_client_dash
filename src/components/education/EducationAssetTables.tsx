import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HScroll } from '@/components/HScroll';
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
  brandColors = {},
}: {
  assets: EducationAsset[];
  from: string;
  to: string;
  /** Lowercased brand name → admin-set hex colour. */
  brandColors?: Record<string, string>;
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
            <CardTitle>
              <span className="rounded bg-yellow-200 px-2 py-0.5">{group.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HScroll>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ph-charcoal/10 text-xs uppercase tracking-wide text-ph-charcoal/60">
                  <tr>
                    {/* Brand + Type + Title stay pinned while the months scroll.
                        Widths are fixed so the cumulative left offsets line up. */}
                    <th className="sticky left-0 z-10 w-28 min-w-28 bg-white py-2 pr-3 font-medium">Brand</th>
                    <th className="sticky left-28 z-10 w-24 min-w-24 bg-white py-2 pr-3 font-medium">Type</th>
                    <th className="sticky left-52 z-10 w-72 min-w-72 bg-white py-2 pr-3 font-medium shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]">
                      Title
                    </th>
                    <th className="min-w-32 py-2 pr-3 font-medium">By</th>
                    <th className="py-2 pr-3 font-medium">Expiry</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    {months.map((m) => (
                      <th key={`${m.year}-${m.month}`} className="px-2 py-2 text-right font-medium whitespace-nowrap">
                        {monthLabel(m)}
                      </th>
                    ))}
                    <th className="min-w-24 border-l border-ph-charcoal/10 bg-yellow-50/70 py-2 pl-3 pr-3 text-right font-medium">
                      Total
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
                                className={`sticky left-28 z-10 ${stickyBg} py-2 pr-3 align-top text-ph-charcoal/70`}
                              >
                                {a.type ?? '-'}
                              </td>
                              <td
                                rowSpan={statuses.length}
                                className={`sticky left-52 z-10 ${stickyBg} py-2 pr-3 align-top text-ph-charcoal shadow-[inset_-1px_0_0_rgba(69,70,70,0.12)]`}
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
                          <td className={`py-1 pr-3 whitespace-nowrap ${si === 0 ? 'text-ph-charcoal/80' : 'italic text-ph-charcoal/60'}`}>
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
            </HScroll>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
