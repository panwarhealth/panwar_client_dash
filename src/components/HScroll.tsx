import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface Thumb {
  start: number;
  size: number;
}

function thumbFor(scroll: number, client: number, offset: number): Thumb | null {
  const overflow = scroll - client;
  if (overflow <= 1) return null;
  const size = Math.max(48, (client / scroll) * client);
  const start = (offset / overflow) * (client - size);
  return { start, size };
}

export function HScroll({ children, maxHeight }: { children: ReactNode; maxHeight?: number | string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ axis: 'x' | 'y'; pointer: number; offset: number } | null>(null);
  const [hThumb, setHThumb] = useState<Thumb | null>(null);
  const [vThumb, setVThumb] = useState<Thumb | null>(null);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHThumb(thumbFor(el.scrollWidth, el.clientWidth, el.scrollLeft));
    setVThumb(maxHeight ? thumbFor(el.scrollHeight, el.clientHeight, el.scrollTop) : null);
  }, [maxHeight]);

  useEffect(() => {
    sync();
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sync]);

  const startDrag = (axis: 'x' | 'y') => (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = {
      axis,
      pointer: axis === 'x' ? e.clientX : e.clientY,
      offset: axis === 'x' ? el.scrollLeft : el.scrollTop,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const d = drag.current;
    if (!el || !d) return;
    if (d.axis === 'x') {
      if (!hThumb) return;
      const range = el.clientWidth - hThumb.size;
      if (range <= 0) return;
      el.scrollLeft = d.offset + ((e.clientX - d.pointer) / range) * (el.scrollWidth - el.clientWidth);
    } else {
      if (!vThumb) return;
      const range = el.clientHeight - vThumb.size;
      if (range <= 0) return;
      el.scrollTop = d.offset + ((e.clientY - d.pointer) / range) * (el.scrollHeight - el.clientHeight);
    }
  };
  const endDrag = () => {
    drag.current = null;
  };

  const trackJump = (axis: 'x' | 'y') => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const el = scrollRef.current;
    const t = axis === 'x' ? hThumb : vThumb;
    if (!el || !t) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (axis === 'x') {
      const range = el.clientWidth - t.size;
      if (range <= 0) return;
      el.scrollLeft = ((e.clientX - rect.left - t.size / 2) / range) * (el.scrollWidth - el.clientWidth);
    } else {
      const range = el.clientHeight - t.size;
      if (range <= 0) return;
      el.scrollTop = ((e.clientY - rect.top - t.size / 2) / range) * (el.scrollHeight - el.clientHeight);
    }
  };

  const thumbCls = 'absolute cursor-grab touch-none rounded-full bg-ph-charcoal/30 hover:bg-ph-charcoal/45 active:cursor-grabbing';

  return (
    <div className="flex gap-2.5">
      <div className="min-w-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={sync}
          className={`hscroll overflow-x-auto${maxHeight ? ' overflow-y-auto' : ''}`}
          style={maxHeight ? { maxHeight } : undefined}
        >
          {children}
        </div>
        {hThumb && (
          <div className="relative mt-2.5 h-1.5 cursor-pointer rounded-full bg-ph-charcoal/10" onPointerDown={trackJump('x')}>
            <div
              className={`${thumbCls} top-0 h-1.5`}
              style={{ left: hThumb.start, width: hThumb.size }}
              onPointerDown={startDrag('x')}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          </div>
        )}
      </div>
      {vThumb && (
        <div
          className="relative w-1.5 shrink-0 cursor-pointer rounded-full bg-ph-charcoal/10"
          style={{ height: scrollRef.current?.clientHeight }}
          onPointerDown={trackJump('y')}
        >
          <div
            className={`${thumbCls} left-0 w-1.5`}
            style={{ top: vThumb.start, height: vThumb.size }}
            onPointerDown={startDrag('y')}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          />
        </div>
      )}
    </div>
  );
}
