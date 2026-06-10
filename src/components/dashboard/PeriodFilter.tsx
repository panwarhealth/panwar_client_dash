import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { periodPresets, formatRange, parseYm, toYm, MONTH_LABELS } from '@/lib/metrics';
import type { DashboardPeriod } from '@/api/dashboard';

/**
 * Date filter (month granularity). The primary control is a year dropdown
 * (All time / each year with data); choosing "Custom" opens a month-range
 * calendar popover (pick a start month, then an end month). The resolved
 * window is always shown.
 */
export function PeriodFilter({
  period,
  onChange,
}: {
  period: DashboardPeriod;
  onChange: (from: string, to: string) => void;
}) {
  const presets =
    period.availableFrom && period.availableTo
      ? periodPresets(period.availableFrom, period.availableTo)
      : [];
  const activeValue = `${period.from}|${period.to}`;
  const matched = presets.find((p) => `${p.from}|${p.to}` === activeValue);

  // Custom mode is on when the user picks it, or when the active window matches
  // no year/All preset (e.g. a custom range arrived via the URL).
  const [customOpen, setCustomOpen] = useState(false);
  const isCustom = customOpen || !matched;
  const selectValue = isCustom ? 'custom' : activeValue;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            setCustomOpen(true);
            return;
          }
          setCustomOpen(false);
          const [from, to] = e.target.value.split('|');
          onChange(from, to);
        }}
        className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm text-ph-charcoal focus:border-client-primary focus:outline-none"
      >
        {presets.map((p) => (
          <option key={p.label} value={`${p.from}|${p.to}`}>{p.label}</option>
        ))}
        <option value="custom">Custom</option>
      </select>

      {isCustom && (
        <MonthRangePicker
          from={period.from}
          to={period.to}
          availableFrom={period.availableFrom}
          availableTo={period.availableTo}
          onChange={onChange}
        />
      )}

      <span className="rounded-md bg-client-primary/10 px-2.5 py-1 text-xs font-medium text-client-primary">
        {formatRange(period.from, period.to)}
      </span>
    </div>
  );
}

/**
 * Month-range calendar popover: a year of months at a time, click a start
 * month then an end month. "YYYY-MM" strings compare correctly as strings,
 * so range maths is plain min/max.
 */
function MonthRangePicker({
  from,
  to,
  availableFrom,
  availableTo,
  onChange,
}: {
  from: string;
  to: string;
  availableFrom: string | null;
  availableTo: string | null;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseYm(from).year);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setAnchor(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setAnchor(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const minYear = availableFrom ? parseYm(availableFrom).year : viewYear;
  const maxYear = availableTo ? parseYm(availableTo).year : viewYear;

  // While picking the second month, preview anchor→hovered; otherwise show the
  // applied range.
  const [rangeStart, rangeEnd] = anchor
    ? hovered
      ? [anchor, hovered].sort()
      : [anchor, anchor]
    : [from, to];

  const pick = (ym: string) => {
    if (!anchor) {
      setAnchor(ym);
      return;
    }
    const [a, b] = [anchor, ym].sort();
    setAnchor(null);
    setOpen(false);
    onChange(a, b);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setAnchor(null);
          setViewYear(parseYm(from).year);
        }}
        className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-3 text-sm text-ph-charcoal hover:border-ph-charcoal/40 focus:border-client-primary focus:outline-none"
      >
        {formatRange(from, to)}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-ph-charcoal/15 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              disabled={viewYear <= minYear}
              className="rounded p-1 text-ph-charcoal/60 hover:bg-ph-charcoal/5 disabled:cursor-not-allowed disabled:text-ph-charcoal/20 disabled:hover:bg-transparent"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-ph-charcoal">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              disabled={viewYear >= maxYear}
              className="rounded p-1 text-ph-charcoal/60 hover:bg-ph-charcoal/5 disabled:cursor-not-allowed disabled:text-ph-charcoal/20 disabled:hover:bg-transparent"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1" onMouseLeave={() => setHovered(null)}>
            {MONTH_LABELS.map((label, i) => {
              const ym = toYm({ year: viewYear, month: i + 1 });
              const disabled =
                (availableFrom !== null && ym < availableFrom) ||
                (availableTo !== null && ym > availableTo);
              const isEndpoint = ym === rangeStart || ym === rangeEnd;
              const inRange = ym >= rangeStart && ym <= rangeEnd;
              return (
                <button
                  key={ym}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(ym)}
                  onMouseEnter={() => setHovered(ym)}
                  className={`h-9 rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:text-ph-charcoal/25 ${
                    isEndpoint
                      ? 'bg-client-primary font-medium text-white'
                      : inRange
                        ? 'bg-client-primary/10 text-client-primary'
                        : 'text-ph-charcoal hover:bg-ph-charcoal/5'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-ph-charcoal/50">
            {anchor ? `${formatRange(anchor, anchor)} - pick an end month` : 'Pick a start month'}
          </p>
        </div>
      )}
    </div>
  );
}
