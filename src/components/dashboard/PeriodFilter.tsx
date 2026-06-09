import { useState } from 'react';
import { periodPresets, formatRange } from '@/lib/metrics';
import type { DashboardPeriod } from '@/api/dashboard';

/**
 * Date filter (month granularity). The primary control is a year dropdown
 * (All time / each year with data); the month-from → month-to range inputs only
 * appear once "Custom" is chosen. The resolved window is always shown.
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
        <div className="flex items-center gap-1 text-sm text-ph-charcoal/70">
          <input
            type="month"
            value={period.from}
            min={period.availableFrom ?? undefined}
            max={period.to}
            onChange={(e) => e.target.value && onChange(e.target.value, period.to)}
            className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm focus:border-client-primary focus:outline-none"
          />
          <span className="text-ph-charcoal/40">→</span>
          <input
            type="month"
            value={period.to}
            min={period.from}
            max={period.availableTo ?? undefined}
            onChange={(e) => e.target.value && onChange(period.from, e.target.value)}
            className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm focus:border-client-primary focus:outline-none"
          />
        </div>
      )}

      <span className="rounded-md bg-client-primary/10 px-2.5 py-1 text-xs font-medium text-client-primary">
        {formatRange(period.from, period.to)}
      </span>
    </div>
  );
}
