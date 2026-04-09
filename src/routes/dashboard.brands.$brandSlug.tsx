import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Brand overview — shows all audiences for a single brand. Currently a stub.
 */
export const Route = createFileRoute('/dashboard/brands/$brandSlug')({
  component: BrandOverview,
});

function BrandOverview() {
  const { brandSlug } = Route.useParams();
  const displayName = brandDisplayName(brandSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard"
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← All brands
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">{displayName}</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">Choose an audience to view.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audiences</CardTitle>
          <CardDescription>
            {displayName} runs media to two HCP audiences. Pick one to see the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <AudienceLink brandSlug={brandSlug} audienceSlug="pharmacists" name="Pharmacists" />
          <AudienceLink brandSlug={brandSlug} audienceSlug="gps" name="GPs" />
        </CardContent>
      </Card>
    </div>
  );
}

function AudienceLink({
  brandSlug,
  audienceSlug,
  name,
}: {
  brandSlug: string;
  audienceSlug: string;
  name: string;
}) {
  return (
    <Link
      to="/dashboard/brands/$brandSlug/audiences/$audienceSlug"
      params={{ brandSlug, audienceSlug }}
      className="rounded-md border border-ph-charcoal/10 px-4 py-2 text-sm font-medium text-ph-charcoal transition-colors hover:border-client-primary hover:text-client-primary"
    >
      {name}
    </Link>
  );
}

function brandDisplayName(slug: string): string {
  switch (slug) {
    case 'nurofen':
      return 'Nurofen';
    case 'nfc':
      return 'Nurofen for Children';
    case 'gaviscon':
      return 'Gaviscon';
    default:
      return slug;
  }
}
