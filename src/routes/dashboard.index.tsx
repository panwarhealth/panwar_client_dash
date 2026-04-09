import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

/**
 * Client overview — the landing page after sign-in. Shows a high-level
 * summary across all the client's brands. Currently a stub; will become
 * the rolled-up KPI dashboard once we wire up the data endpoints.
 */
export const Route = createFileRoute('/dashboard/')({
  component: ClientOverview,
});

function ClientOverview() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ph-charcoal">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          Your media performance summary across all brands.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            The client overview rollup is being built. In the meantime, navigate to a brand
            below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* Hardcoded for the seeded Reckitt data — will be driven by API once /clients/me/brands exists */}
          <BrandLink slug="nurofen" name="Nurofen" />
          <BrandLink slug="nfc" name="Nurofen for Children" />
          <BrandLink slug="gaviscon" name="Gaviscon" />
        </CardContent>
      </Card>
    </div>
  );
}

function BrandLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      to="/dashboard/brands/$brandSlug"
      params={{ brandSlug: slug }}
      className="rounded-md border border-ph-charcoal/10 px-4 py-2 text-sm font-medium text-ph-charcoal transition-colors hover:border-client-primary hover:text-client-primary"
    >
      {name}
    </Link>
  );
}
