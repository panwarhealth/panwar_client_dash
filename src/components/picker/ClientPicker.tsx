import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import type { ClientSummary } from '@/api/clients';

export function ClientPicker({ clients }: { clients: ClientSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((c) => (
        <Link
          key={c.id}
          to="/dashboard/$clientSlug"
          params={{ clientSlug: c.slug }}
          className="group"
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              {c.logoUrl ? (
                <img src={c.logoUrl} alt={c.name} className="h-12 w-12 rounded object-contain" />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded text-lg font-semibold text-white"
                  style={{ backgroundColor: c.primaryColor ?? '#702f8f' }}
                >
                  {c.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-ph-charcoal group-hover:text-ph-purple">
                  {c.name}
                </div>
                <div className="text-xs text-ph-charcoal/60">View dashboards</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
