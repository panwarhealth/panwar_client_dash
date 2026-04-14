import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getClientBrands } from '@/api/clients';
import { useClientBranding } from '@/hooks/useClientBranding';

/**
 * Client-scoped layout. Loads the client's brands + audiences once and
 * paints the client's brand colours onto the document root so nested
 * routes inherit the theme.
 */
export const Route = createFileRoute('/dashboard/$clientSlug')({
  loader: async ({ context, params }) => {
    return context.queryClient.fetchQuery({
      queryKey: ['client', params.clientSlug],
      queryFn: () => getClientBrands(params.clientSlug),
      staleTime: 60 * 1000,
    });
  },
  component: ClientLayout,
});

function ClientLayout() {
  const { clientSlug } = Route.useParams();
  const { data } = useQuery({
    queryKey: ['client', clientSlug],
    queryFn: () => getClientBrands(clientSlug),
    staleTime: 60 * 1000,
  });

  useClientBranding(data?.client ?? null);

  return <Outlet />;
}
