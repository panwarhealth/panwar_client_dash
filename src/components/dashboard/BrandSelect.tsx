import type { BrandRef } from '@/api/summary';

export function BrandSelect({
  brands,
  value,
  onChange,
}: {
  brands: BrandRef[];
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  if (brands.length < 2) return null;
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Filter by brand"
      className="h-9 rounded-md border border-ph-charcoal/20 bg-white px-2 text-sm text-ph-charcoal/80 transition-colors hover:border-client-primary focus:border-client-primary focus:outline-none"
    >
      <option value="">All brands</option>
      {brands.map((b) => (
        <option key={b.slug} value={b.slug}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
