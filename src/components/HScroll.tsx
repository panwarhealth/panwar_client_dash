import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Horizontal scroll container with a hand-rolled, always-visible scrollbar.
 * Native bars on Windows are overlay-style and fade away unless hovered
 * (and Firefox ignores ::-webkit-scrollbar styling entirely), so we hide the
 * native bar and draw our own track + draggable thumb synced to scrollLeft.
 *
 * Pass `maxHeight` to cap the body and scroll vertically inside it - that keeps
 * the horizontal bar (drawn just below) on screen for tall tables instead of
 * forcing a scroll to the page bottom. Use with a `sticky top-0` thead.
 */
export function HScroll({ children, maxHeight }: { children: ReactNode; maxHeight?: number | string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerX: number; scrollLeft: number } | null>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow <= 1) {
      setThumb(null);
      return;
    }
    // The track is full-width below the scroll container, so its width
    // equals the container's clientWidth.
    const width = Math.max(48, (el.clientWidth / el.scrollWidth) * el.clientWidth);
    const left = (el.scrollLeft / overflow) * (el.clientWidth - width);
    setThumb({ left, width });
  }, []);

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

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { pointerX: e.clientX, scrollLeft: el.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const d = drag.current;
    if (!el || !d || !thumb) return;
    const range = el.clientWidth - thumb.width;
    if (range <= 0) return;
    const overflow = el.scrollWidth - el.clientWidth;
    el.scrollLeft = d.scrollLeft + ((e.clientX - d.pointerX) / range) * overflow;
  };
  const onThumbPointerUp = () => {
    drag.current = null;
  };

  // Click on the empty track jumps the thumb there.
  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // thumb drags handle themselves
    const el = scrollRef.current;
    if (!el || !thumb) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const range = el.clientWidth - thumb.width;
    if (range <= 0) return;
    const x = e.clientX - rect.left - thumb.width / 2;
    el.scrollLeft = (x / range) * (el.scrollWidth - el.clientWidth);
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={sync}
        className={`hscroll overflow-x-auto${maxHeight ? ' overflow-y-auto' : ''}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {thumb && (
        <div
          className="relative mt-2.5 h-1.5 cursor-pointer rounded-full bg-ph-charcoal/10"
          onPointerDown={onTrackPointerDown}
        >
          <div
            className="absolute top-0 h-1.5 cursor-grab touch-none rounded-full bg-ph-charcoal/30 hover:bg-ph-charcoal/45 active:cursor-grabbing"
            style={{ left: thumb.left, width: thumb.width }}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
          />
        </div>
      )}
    </div>
  );
}
