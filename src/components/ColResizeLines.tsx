import type { ColumnResize } from '@/lib/columnResize';

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
