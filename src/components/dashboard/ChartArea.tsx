import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Sizes a Recharts chart to its container width without Recharts'
 * ResponsiveContainer, which can get stuck re-rendering on a sub-pixel resize
 * oscillation and leak its observer on unmount. We measure with our own
 * ResizeObserver (rAF-batched, with a 1px dead-band and a real cleanup) and
 * pass explicit width/height to the chart.
 */
export function ChartArea({
  height,
  children,
}: {
  height: number;
  children: (width: number, height: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.floor(el.clientWidth);
        setWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {width > 0 && children(width, height)}
    </div>
  );
}
