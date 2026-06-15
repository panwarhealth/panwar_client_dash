import { useCallback, useEffect, useRef, useState } from 'react';

/** Smallest a column can be dragged to, in px. */
const MIN_WIDTH = 48;

export interface ColumnResize {
  /** Column ids in order (= the keys of `defaults`). */
  order: string[];
  /** Displayed px width per column id (scaled to fill until the user resizes). */
  widths: Record<string, number>;
  /** Sum of displayed widths - the table's fixed-layout width. */
  totalWidth: number;
  /** Attach to the `relative` table wrapper - its parent's width is measured to fill. */
  measureRef: React.RefObject<HTMLDivElement | null>;
  /** PointerDown handler factory for a column's drag handle. */
  startResize: (id: string) => (e: React.PointerEvent) => void;
  /** Restore one column to its default width (double-click a divider). */
  resetColumn: (id: string) => void;
  /** Restore every column to its default width. */
  reset: () => void;
  /** True when any column differs from its default. */
  isCustom: boolean;
}

/**
 * Drag-to-resize column widths for a table. Widths are session-only - a refresh
 * restores the defaults, which suits casual client viewing (a stray drag never
 * sticks).
 *
 * The default layout is scaled up to fill the available width (so a few narrow
 * columns span the card instead of bunching left); the first drag freezes the
 * shown widths into exact values, after which widths are honoured literally and
 * the table scrolls if they exceed the container. `extraWidth` is any fixed,
 * non-resizable width in the table (e.g. a block of month columns) so the fill
 * maths accounts for it. `defaults` must be a stable module-level const.
 */
export function useColumnResize(defaults: Record<string, number>, extraWidth = 0): ColumnResize {
  const order = Object.keys(defaults);
  const [base, setBase] = useState<Record<string, number>>(defaults);
  const [avail, setAvail] = useState(0);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ id: string; startX: number; startW: number } | null>(null);

  // Track the container's inner width so the default layout can fill it.
  useEffect(() => {
    const el = measureRef.current?.parentElement;
    if (!el) return;
    const update = () => setAvail(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drag listeners live on the document so tracking survives leaving the handle.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const next = Math.max(MIN_WIDTH, d.startW + (e.clientX - d.startX));
      setBase((w) => (w[d.id] === next ? w : { ...w, [d.id]: next }));
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  }, []);

  const baseTotal = order.reduce((sum, k) => sum + base[k], 0);
  const isCustom = order.some((k) => base[k] !== defaults[k]);
  // Only the untouched default layout fills; a resized table is exact (may scroll).
  const fillTarget = avail - extraWidth;
  const scale = !isCustom && baseTotal > 0 && fillTarget > baseTotal ? fillTarget / baseTotal : 1;
  // Floor the scaled widths to whole px so the browser doesn't round each column
  // up and overflow the container by a few sub-pixels (a phantom scrollbar).
  const widths =
    scale === 1 ? base : Object.fromEntries(order.map((k) => [k, Math.floor(base[k] * scale)]));
  const totalWidth = order.reduce((sum, k) => sum + widths[k], 0);

  const startResize = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation(); // don't trip a sortable header's onClick
      // Freeze the (floored) filled layout into explicit widths so the drag
      // starts from exactly what's on screen - no snap from default to base.
      if (scale !== 1) setBase({ ...widths });
      drag.current = { id, startX: e.clientX, startW: widths[id] };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [widths, scale],
  );

  const resetColumn = useCallback(
    (id: string) => {
      setBase((w) => ({ ...w, [id]: defaults[id] }));
      // defaults is a stable module const, so it is intentionally not a dep.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const reset = useCallback(() => {
    setBase(defaults);
    // defaults is a stable module const, so it is intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { order, widths, totalWidth, measureRef, startResize, resetColumn, reset, isCustom };
}

/**
 * Full-height draggable divider lines, one on each column's right edge. Render
 * as the last child of a `relative` wrapper that holds the table (and whose
 * width equals `cols.totalWidth`) so the lines span the whole table - header
 * and body - and scroll with it. Drag to resize; double-click to reset that
 * column to its default width.
 */
export function ColResizeLines({ cols }: { cols: ColumnResize }) {
  let x = 0;
  return (
    <>
      {cols.order.map((id) => {
        x += cols.widths[id];
        return (
          <span
            key={id}
            onPointerDown={cols.startResize(id)}
            onDoubleClick={() => cols.resetColumn(id)}
            aria-hidden
            // Left-anchored: the 8px grab strip sits to the LEFT of the boundary
            // so the rightmost line never protrudes past the table edge (which
            // would inflate the scroll width and spawn a phantom scrollbar).
            className="group absolute top-0 z-30 h-full w-2 -translate-x-full cursor-col-resize touch-none select-none"
            style={{ left: x }}
          >
            <span className="absolute inset-y-0 right-0 w-px bg-transparent group-hover:bg-client-primary/40" />
          </span>
        );
      })}
    </>
  );
}
