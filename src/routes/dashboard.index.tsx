import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { ClientPicker } from '@/components/picker/ClientPicker';
import { getMyClients } from '@/api/clients';

/**
 * Dashboard landing — smart router based on how many clients the user
 * can access:
 *   0 → empty state
 *   1 → redirect straight to that client
 *   N → show the picker
 */
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async ({ context }) => {
    const clients = await context.queryClient.fetchQuery({
      queryKey: ['my', 'clients'],
      queryFn: getMyClients,
      staleTime: 60 * 1000,
    });
    if (clients.length === 1) {
      throw redirect({
        to: '/dashboard/$clientSlug',
        params: { clientSlug: clients[0].slug },
      });
    }
  },
  component: DashboardLanding,
});

function DashboardLanding() {
  const { data: clients = [] } = useQuery({
    queryKey: ['my', 'clients'],
    queryFn: getMyClients,
    staleTime: 60 * 1000,
  });

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-lg font-semibold text-ph-charcoal">No dashboards yet</h2>
          <p className="mt-1 text-sm text-ph-charcoal/70">
            You don&rsquo;t have access to any client dashboards. If you think
            that&rsquo;s wrong, reach out to your Panwar Health contact.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ph-charcoal">Choose a client</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          You have access to {clients.length} client dashboards.
        </p>
      </div>
      <ClientPicker clients={clients} />
    </div>
  );
}
