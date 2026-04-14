import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import type { AudienceSummary } from '@/api/clients';

export function AudienceTabs({
  clientSlug,
  brandSlug,
  audiences,
  activeAudienceSlug,
}: {
  clientSlug: string;
  brandSlug: string;
  audiences: AudienceSummary[];
  activeAudienceSlug?: string;
}) {
  if (audiences.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 border-b border-ph-charcoal/10 pb-3">
      {audiences.map((a) => {
        const active = a.slug === activeAudienceSlug;
        return (
          <Link
            key={a.id}
            to="/dashboard/$clientSlug/$brandSlug/$audienceSlug"
            params={{ clientSlug, brandSlug, audienceSlug: a.slug }}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-client-primary text-white'
                : 'border border-ph-charcoal/15 text-ph-charcoal hover:border-client-primary hover:text-client-primary',
            )}
          >
            {a.name}
          </Link>
        );
      })}
    </div>
  );
}
