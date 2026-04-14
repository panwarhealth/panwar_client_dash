import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AudienceTabs } from '@/components/picker/AudienceTabs';
import { getClientBrands } from '@/api/clients';

/**
 * Brand overview. If exactly one audience exists, redirect straight to it;
 * otherwise show the audience picker.
 */
export const Route = createFileRoute('/dashboard/$clientSlug/$brandSlug/')({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.fetchQuery({
      queryKey: ['client', params.clientSlug],
      queryFn: () => getClientBrands(params.clientSlug),
      staleTime: 60 * 1000,
    });
    if (data.audiences.length === 1) {
      throw redirect({
        to: '/dashboard/$clientSlug/$brandSlug/$audienceSlug',
        params: {
          clientSlug: params.clientSlug,
          brandSlug: params.brandSlug,
          audienceSlug: data.audiences[0].slug,
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
        <p className="mt-1 text-sm text-ph-charcoal/70">Choose an audience.</p>
      </div>
      {data && (
        <AudienceTabs
          clientSlug={clientSlug}
          brandSlug={brandSlug}
          audiences={data.audiences}
        />
      )}
    </div>
  );
}
