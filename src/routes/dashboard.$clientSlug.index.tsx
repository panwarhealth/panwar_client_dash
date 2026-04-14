import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BrandList } from '@/components/picker/BrandList';
import { getClientBrands, getMyClients } from '@/api/clients';

export const Route = createFileRoute('/dashboard/$clientSlug/')({
  component: ClientBrandsPage,
});

function ClientBrandsPage() {
  const { clientSlug } = Route.useParams();
  const { data } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  // Only show the "← All clients" back link when the user has more than one
  // accessible client; single-client users would just loop back here.
  const { data: myClients = [] } = useQuery({
    queryKey: ['my', 'clients'],
    queryFn: getMyClients,
    staleTime: 60 * 1000,
  });
  const showBackLink = myClients.length > 1;

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {showBackLink && (
          <Link
            to="/dashboard"
            className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
          >
            ← All clients
          </Link>
        )}
        <h1 className={showBackLink ? 'mt-2 text-2xl font-semibold text-ph-charcoal' : 'text-2xl font-semibold text-ph-charcoal'}>
          {data.client.name}
        </h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          Choose a brand to view its audience dashboards.
        </p>
      </div>
      <BrandList clientSlug={clientSlug} brands={data.brands} />
    </div>
  );
}
