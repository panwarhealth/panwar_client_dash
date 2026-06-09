import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getClientBrands } from '@/api/clients';

/**
 * Brand overview. Jumps straight to the brand's first available audience (the
 * ones with placements) so the user never lands on an empty page. Only renders
 * its own body when the brand has no populated audiences yet.
 */
export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/')({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.fetchQuery({
      queryKey: ['client', params.clientSlug],
      queryFn: () => getClientBrands(params.clientSlug),
      staleTime: 60 * 1000,
    });
    const brand = data.brands.find((b) => b.slug === params.brandSlug);
    const firstAudienceSlug = brand?.audienceSlugs[0];
    if (firstAudienceSlug) {
      throw redirect({
        to: '/dashboard/$clientSlug/$brandSlug/$audienceSlug',
        params: {
          clientSlug: params.clientSlug,
          brandSlug: params.brandSlug,
          audienceSlug: firstAudienceSlug,
        },
      });
    }
  },
  component: BrandOverview,
});

function BrandOverview() {
  const { clientSlug, brandSlug } = Route.useParams();
  const { data } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  const brand = data?.brands.find((b) => b.slug === brandSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard/$clientSlug"
          params={{ clientSlug }}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← All brands
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">{brand?.name ?? brandSlug}</h1>
      </div>
      <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
        No dashboards are available for this brand yet.
      </div>
    </div>
  );
}
