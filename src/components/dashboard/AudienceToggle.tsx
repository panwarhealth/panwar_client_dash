import type { AudienceSummary } from '@/api/clients';
import { cn } from '@/lib/utils';

export function AudienceToggle({
  audiences,
  value,
  onChange,
}: {
  audiences: AudienceSummary[];
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  if (audiences.length < 2) return null;
  const options = [{ slug: null as string | null, name: 'Total' }, ...audiences.map((a) => ({ slug: a.slug as string | null, name: a.name }))];
  return (
    <div className="flex items-center gap-1 rounded-md border border-ph-charcoal/15 bg-white p-0.5" role="group" aria-label="Audience view">
      {options.map((o) => (
        <button
          key={o.slug ?? 'total'}
          type="button"
          onClick={() => onChange(o.slug)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            value === o.slug ? 'bg-client-primary text-white' : 'text-ph-charcoal/70 hover:text-ph-charcoal',
          )}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}
