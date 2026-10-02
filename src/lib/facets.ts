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
