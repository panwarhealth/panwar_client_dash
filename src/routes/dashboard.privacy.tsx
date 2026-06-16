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

const LAST_UPDATED = '16 June 2026';

const SECTIONS: Section[] = [
  {
    heading: '1. Who we are',
    body: 'Panwar Health Pty Ltd (ABN 15 631 093 966), PO Box 3227, Wamberal NSW 2260, Australia operates the Panwar Portals reporting dashboards ("Portal"). This policy explains what personal information we collect when you use the Portal, why we collect it, and how we handle it. We are bound by the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).',
  },
  {
    heading: '2. What we collect',
    body:
      'We collect only what is necessary to operate the Portal:\n' +
      '- Email address - used to send your sign-in link and identify your account.\n' +
      '- Last login time - recorded each time you sign in.\n' +
      '- IP address - recorded when you request a sign-in link, for security purposes only.\n\n' +
      'We do not collect names, phone numbers, payment details, or any health information through this Portal. We do not use cookies for tracking or advertising. The only cookie we set is a secure, HttpOnly authentication cookie that expires with your session or after 365 days.',
  },
  {
    heading: '3. How we use your information',
    body:
      'Your information is used solely to:\n' +
      '- Authenticate your access to the Portal.\n' +
      '- Detect and respond to unauthorised access.\n\n' +
      'We do not use your information for marketing, profiling, or any purpose unrelated to operating the Portal.',
  },
  {
    heading: '4. Who we share it with',
    body:
      'We do not sell, rent, or share your personal information with third parties except:\n' +
      '- Microsoft Azure - our cloud hosting provider, which processes data on our behalf in Australia.\n' +
      '- Cloudflare - used for content delivery and security. Cloudflare may process request metadata (including IP addresses) at its edge nodes.\n\n' +
      'Both providers are bound by data processing agreements and are not permitted to use your data for their own purposes.',
  },
  {
    heading: '5. Data storage and security',
    body: 'Your data is stored in Microsoft Azure (Australia East region). We use industry-standard security practices including encrypted connections (HTTPS), HttpOnly authentication cookies, and access controls. No system is completely secure; if you believe your account has been compromised, contact us immediately at gabriel@panwarhealth.com.au.',
  },
  {
    heading: '6. Retention',
    body: 'We retain your account information for as long as your account is active. Sign-in link records are deleted automatically after 15 minutes. If you request deletion of your account, we will remove your personal information within 30 days, except where we are required by law to retain it.',
  },
  {
    heading: '7. Your rights',
    body:
      'Under the Australian Privacy Principles you have the right to:\n' +
      '- Access the personal information we hold about you.\n' +
      '- Request correction of inaccurate information.\n' +
      '- Request deletion of your information.\n' +
      '- Lodge a complaint about our handling of your information.\n\n' +
      'To exercise any of these rights, contact gabriel@panwarhealth.com.au. We will respond within a reasonable timeframe. If you are not satisfied with our response, you may contact the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.',
  },
  {
    heading: '8. Changes to this policy',
    body: 'We may update this policy from time to time. The current version is always available in the Portal footer. Continued use of the Portal after an update constitutes acceptance of the revised policy.',
  },
  {
    heading: '9. Contact',
    body: 'gabriel@panwarhealth.com.au | Panwar Health Pty Ltd | ABN 15 631 093 966 | PO Box 3227, Wamberal NSW 2260, Australia',
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
          How Panwar Health collects, uses and protects your information. Last updated {LAST_UPDATED}.
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
