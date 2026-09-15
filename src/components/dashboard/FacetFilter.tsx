import { RotateCcw } from 'lucide-react';

export interface FacetOption {
  value: string;
  label: string;
}

export interface FacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
}

export type FacetSelection = Record<string, Set<string>>;

export function emptySelection(groups: FacetGroup[]): FacetSelection {
  return Object.fromEntries(groups.map((g) => [g.key, new Set<string>()]));
}

export function isSelectionEmpty(sel: FacetSelection): boolean {
  return Object.values(sel).every((s) => s.size === 0);
}

export function FacetFilter({
  groups,
  selection,
  onChange,
  isDisabled,
  layout = 'column',
}: {
  groups: FacetGroup[];
  selection: FacetSelection;
  onChange: (next: FacetSelection) => void;
  isDisabled?: (groupKey: string, value: string) => boolean;
  layout?: 'column' | 'row';
}) {
  const toggle = (groupKey: string, value: string) => {
    const next: FacetSelection = { ...selection, [groupKey]: new Set(selection[groupKey]) };
    if (next[groupKey].has(value)) next[groupKey].delete(value);
    else next[groupKey].add(value);
    onChange(next);
  };

  return (
    <div className={`flex text-sm ${layout === 'row' ? 'flex-col gap-3' : 'flex-col gap-4'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ph-charcoal/60">Filter</span>
        {!isSelectionEmpty(selection) && (
          <button
            type="button"
            onClick={() => onChange(emptySelection(groups))}
            title="Clear filters"
            aria-label="Clear filters"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-ph-charcoal/20 bg-white text-ph-charcoal/50 transition-colors hover:border-client-primary hover:text-client-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className={layout === 'row' ? 'grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4' : 'contents'}>
      {groups.map((g) => (
        <fieldset key={g.key} className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-semibold text-ph-charcoal">{g.label}</legend>
          <div className="contents">
          {g.options.map((o) => {
            const checked = selection[g.key]?.has(o.value) ?? false;
            const disabled = !checked && (isDisabled?.(g.key, o.value) ?? false);
            return (
              <label
                key={o.value}
                className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed text-ph-charcoal/35' : 'cursor-pointer text-ph-charcoal/85'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(g.key, o.value)}
                  className="h-3.5 w-3.5 accent-client-primary"
                />
                {o.label}
              </label>
            );
          })}
          </div>
        </fieldset>
      ))}
      </div>
    </div>
  );
}
