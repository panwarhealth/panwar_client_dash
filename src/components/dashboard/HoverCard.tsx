import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface HoverLine {
  label: string;
  value: string;
  className?: string;
}

export function HoverCard({ title, lines, children }: { title?: string; lines: HoverLine[]; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <span
      className="cursor-help underline decoration-dotted decoration-ph-charcoal/30 underline-offset-4"
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.right, y: r.bottom });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <span
            className="pointer-events-none fixed z-50 block w-56 rounded-md border border-ph-charcoal/10 bg-white p-2.5 text-left text-xs font-normal normal-case tracking-normal text-ph-charcoal shadow-lg"
            style={{ left: pos.x, top: pos.y + 4, transform: 'translateX(-100%)' }}
          >
            {title && <span className="mb-1 block font-semibold">{title}</span>}
            {lines.map((l) => (
              <span key={l.label} className="flex justify-between gap-3">
                <span className="text-ph-charcoal/60">{l.label}</span>
                <span className={`tabular-nums ${l.className ?? ''}`}>{l.value}</span>
              </span>
            ))}
          </span>,
          document.body,
        )}
    </span>
  );
}
