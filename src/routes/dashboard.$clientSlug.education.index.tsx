import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEducationPages } from '@/api/education';

/**
 * Education landing for a client. One page → jump straight in. Multiple → show a
 * picker. None → empty state.
 */
export const Route = createFileRoute('/dashboard/$clientSlug/education/')({
  beforeLoad: async ({ context, params }) => {
    const pages = await context.queryClient.fetchQuery({
      queryKey: ['education', 'pages', params.clientSlug],
      queryFn: () => getEducationPages(params.clientSlug),
      staleTime: 30 * 1000,
    });
    if (pages.length === 1) {
      throw redirect({
        to: '/dashboard/$clientSlug/education/$pageSlug',
        params: { clientSlug: params.clientSlug, pageSlug: pages[0].slug },
      });
    }
  },
  component: EducationIndex,
});

function EducationIndex() {
  const { clientSlug } = Route.useParams();
  const { data: pages = [] } = useQuery({
    queryKey: ['education', 'pages', clientSlug],
    queryFn: () => getEducationPages(clientSlug),
    staleTime: 30 * 1000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard/$clientSlug"
          params={{ clientSlug }}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← Overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">Education</h1>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ph-charcoal/15 p-8 text-center text-sm text-ph-charcoal/60">
          No education dashboards are available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.id}
              to="/dashboard/$clientSlug/education/$pageSlug"
              params={{ clientSlug, pageSlug: p.slug }}
            >
              <Card className="transition-colors hover:border-client-primary">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>
                    {p.chartCount} {p.chartCount === 1 ? 'chart' : 'charts'}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
