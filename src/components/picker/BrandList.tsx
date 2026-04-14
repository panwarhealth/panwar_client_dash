import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import type { BrandSummary } from '@/api/clients';

export function BrandList({
  clientSlug,
  brands,
}: {
  clientSlug: string;
  brands: BrandSummary[];
}) {
  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-ph-charcoal/70">
          No brands have been set up for this client yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((b) => (
        <Link
          key={b.id}
          to="/dashboard/$clientSlug/$brandSlug"
          params={{ clientSlug, brandSlug: b.slug }}
          className="group"
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="text-base font-semibold text-ph-charcoal group-hover:text-client-primary">
                {b.name}
              </div>
              <div className="mt-1 text-xs text-ph-charcoal/60">View audiences</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
