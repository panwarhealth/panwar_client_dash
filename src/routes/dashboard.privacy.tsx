import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Privacy policy. Static page - the approved Panwar policy adapted for the
 * portals. Edit SECTIONS below to drop in the real copy (plain hyphens, no
 * em dashes; magic-link only, never mention Entra/SSO in client-facing copy).
 */
export const Route = createFileRoute('/dashboard/privacy')({
  component: PrivacyView,
});

interface Section {
  heading: string;
  body: string;
}

// PLACEHOLDER - replace with the approved, adapted privacy policy copy.
const SECTIONS: Section[] = [
  {
    heading: 'Placeholder',
    body: 'Privacy policy copy goes here. Paste the approved Panwar policy, adapted for Panwar Portals, into this SECTIONS array - one entry per heading + body.',
  },
];

function PrivacyView() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={() => router.history.back()}
          className="text-xs uppercase tracking-wide text-ph-charcoal/60 hover:text-client-primary"
        >
          ← Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">Privacy policy</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          How Panwar Health collects, uses and protects your information.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-ph-charcoal/10 p-0">
          {SECTIONS.map((s) => (
            <div key={s.heading} className="px-5 py-4">
              <h2 className="text-sm font-semibold text-ph-charcoal">{s.heading}</h2>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ph-charcoal/70">{s.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
