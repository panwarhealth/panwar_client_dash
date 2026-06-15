import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Terms of Service. Adapted from Panwar Health's master ToS template for the
 * Panwar Portals reporting dashboards - the CPD/AHPRA/clinical-audit/sponsorship
 * clauses from the source (written for the HCP CPD platforms) have been removed
 * and the remaining body reworded for a B2B reporting portal. Values still in
 * [SQUARE BRACKETS] need to be filled before going live. Plain hyphens only; no
 * mention of Entra/SSO in this client-facing copy.
 */
export const Route = createFileRoute('/dashboard/terms')({
  component: TermsView,
});

interface Section {
  heading: string;
  body: string;
}

const LAST_UPDATED = '[DATE]';

const SECTIONS: Section[] = [
  {
    heading: '1. Acceptance',
    body: 'By accessing or using Panwar Portals, you agree to these Terms of Service. If you do not agree, do not use the Portal.',
  },
  {
    heading: '2. About Panwar Portals',
    body: 'Panwar Portals provides online dashboards through which authorised clients and staff can view media performance reporting and related analytics. It is operated by Sciety Pty Ltd (ABN 91 648 319 331), PO Box 3227, Wamberal NSW 2260, Australia. Access is provided to authorised users only.',
  },
  {
    heading: '3. Definitions',
    body:
      'Privacy Act means the Privacy Act 1988 (Cth), including the Australian Privacy Principles (APPs) and any rules, regulations, codes of conduct or other instruments made or issued under that Act, as amended.\n' +
      'Australian Consumer Law means the Competition and Consumer Act 2010 (Cth), Schedule 2, as amended.\n' +
      'Services means the Panwar Portals dashboards, websites, applications and associated services we provide for accessing media performance reporting.\n' +
      'Confidential Information means any information disclosed by one party to the other which is designated as confidential or should reasonably be understood to be confidential by its nature, excluding information that is public or independently obtained.',
  },
  {
    heading: '4. Amendments',
    body:
      'a. We may update these Terms from time to time.\n' +
      'b. The Terms currently displayed in the Portal apply to all use of the Services. Please review them regularly. Continued use constitutes acceptance.',
  },
  {
    heading: '5. Account Access',
    body:
      'a. Access to the Portal is granted to authorised users only.\n' +
      'b. Keep your account and sign-in details confidential. Report any unauthorised access to [CONTACT EMAIL].\n' +
      'c. Accounts are for the named individual and must not be shared.',
  },
  {
    heading: '6. Acceptable Use',
    body:
      'a. Use the Services for your authorised business purposes only.\n' +
      'b. Do not share your access or allow others to use your account.\n' +
      'c. Do not reproduce, distribute, modify or create derivative works from the dashboards, reports or other content without our prior written consent.\n' +
      'd. Do not circumvent access controls or use automated tools to access the Services.\n' +
      'e. Do not submit false or misleading information.\n' +
      'f. Do not use the Services for any unlawful purpose or in a way that contravenes applicable legislation, regulations or codes of practice.',
  },
  {
    heading: '7. Intellectual Property',
    body:
      'a. All intellectual property rights in the Services are owned by Sciety Pty Ltd and/or its content and data publishers.\n' +
      'b. All content is protected by copyright and all rights are reserved.\n' +
      'c. We grant you a limited, non-exclusive, non-transferable licence to access and use the Services for your authorised business purposes. You must not reproduce, distribute, publicly communicate, record, scrape or create derivative works from the content without our prior written consent.',
  },
  {
    heading: '8. Reporting and Data Accuracy',
    body:
      'a. The dashboards and reports are provided for general informational and business reporting purposes.\n' +
      'b. While we take reasonable care to ensure the reporting is accurate, we do not warrant that it is complete, current or error-free, and figures may be subject to revision.\n' +
      'c. You are responsible for verifying any information before relying on it, and for any decisions made on the basis of the reporting.\n' +
      'd. To the maximum extent permitted by law, we disclaim liability for any reliance on the information provided through the Services.',
  },
  {
    heading: '9. Aggregated and De-identified Data',
    body:
      'a. We may collect, generate and use aggregated, de-identified information from use of the Services ("Aggregated Information") that does not identify individuals and is not reasonably capable of re-identification, for purposes including platform improvement, analytics and benchmarking.\n' +
      'b. Aggregated Information may be shared with service providers or clients at a cohort or population level only.\n' +
      'c. We do not sell identifiable personal information for advertising or marketing.',
  },
  {
    heading: '10. Third-Party Providers',
    body:
      'We engage providers for services such as analytics, hosting and security under confidentiality obligations. Personal information shared with them is limited to what is necessary, and they must comply with applicable privacy and confidentiality obligations and may not use identifiable information for their own marketing.',
  },
  {
    heading: '11. Australian Consumer Law',
    body:
      'a. Our Services come with guarantees that cannot be excluded under the Australian Consumer Law.\n' +
      'b. If the Services fail to comply with a consumer guarantee and you are a consumer under the Australian Consumer Law, you are entitled to a remedy in accordance with that law.\n' +
      'c. To the extent permitted by law, our liability is limited as set out in the Limitation of Liability section, and nothing in these Terms excludes, restricts or modifies any rights or remedies you have under the Australian Consumer Law.',
  },
  {
    heading: '12. Limitation of Liability',
    body:
      'a. Subject to the Australian Consumer Law section and to the extent permitted by law, we are not liable for any indirect, consequential, incidental, special or punitive loss, for service interruptions, or for decisions made in reliance on the reporting.\n' +
      'b. To the extent permitted by section 64A of the Australian Consumer Law, where our Services are not ordinarily acquired for personal, domestic or household use, our liability for non-major consumer guarantee failures is limited to resupplying the Services or paying the cost of resupply.',
  },
  {
    heading: '13. Indemnity',
    body:
      'a. You indemnify us against any claims, liabilities, losses, damages, actions, proceedings or expenses (including legal expenses on a full-indemnity basis) arising from your breach of these Terms or your use of the Services in violation of applicable law.\n' +
      'b. This indemnity does not apply to claims arising from our own negligence or breach of law.',
  },
  {
    heading: '14. Privacy and Data',
    body:
      'a. We comply with the Privacy Act and the Australian Privacy Principles. Full details are set out in our Privacy Policy.\n' +
      'b. You can access, correct or request deletion of your personal information by contacting our Privacy Officer at [PRIVACY OFFICER CONTACT]. We will respond within a reasonable timeframe and in accordance with the APPs.\n' +
      'c. We take reasonable steps to protect personal information against loss, misuse, interference, and unauthorised access, modification or disclosure, including appropriate data security systems and staff privacy training.\n' +
      'd. [DATA LOCATION - confirm where personal information is stored and processed and whether any provider is located overseas, then state the cross-border (APP 8) position here.]\n' +
      'e. If you have a complaint about our handling of personal information, contact our Privacy Officer. If you are not satisfied, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.\n' +
      'f. If we become aware of a notifiable data breach under the Privacy Act, we will promptly assess it, notify affected individuals and the OAIC within the time prescribed by law, and take reasonable steps to mitigate any harm.',
  },
  {
    heading: '15. Data Retention',
    body:
      'a. We retain personal information only for as long as necessary for the purposes for which it was collected, or as required by law.\n' +
      'b. On request, we will delete or de-identify your personal information within a reasonable period, except where we are required or permitted by law to retain it.\n' +
      'c. Aggregated, de-identified data may be retained indefinitely.',
  },
  {
    heading: '16. Availability',
    body:
      'a. We do not guarantee uninterrupted access to the Services.\n' +
      'b. We may modify or discontinue features with reasonable notice.',
  },
  {
    heading: '17. Termination',
    body:
      'a. We may suspend or terminate your access for breach of these Terms, misuse, or dishonest conduct.\n' +
      'b. Access granted to client users may also end in accordance with the agreement between us and the relevant client.',
  },
  {
    heading: '18. Force Majeure',
    body: 'We are not liable for failures or delays due to circumstances beyond our reasonable control.',
  },
  {
    heading: '19. Severability',
    body: 'If any provision is invalid, it is modified to the minimum extent necessary, and the remaining provisions continue in full force.',
  },
  {
    heading: '20. Governing Law',
    body: 'These Terms are governed by the laws of New South Wales, Australia.',
  },
  {
    heading: '21. Dispute Resolution',
    body:
      'a. If a dispute arises, the parties must first attempt to resolve it through good faith negotiation.\n' +
      'b. If it cannot be resolved within a reasonable period of written notice, the parties must attempt mediation through an independent mediator agreed by both parties, or the Australian Disputes Centre if agreement cannot be reached.\n' +
      'c. Neither party may commence legal proceedings until reasonable efforts at negotiation and mediation have concluded, except where urgent injunctive relief is required.',
  },
  {
    heading: '22. Assignment',
    body:
      'a. We may transfer or assign our rights and obligations under these Terms to another entity without your consent, provided this does not materially reduce your rights.\n' +
      'b. You may only transfer or assign your rights and obligations with our prior written consent.',
  },
  {
    heading: '23. Contact',
    body:
      '[CONTACT EMAIL] | Sciety Pty Ltd | ABN 91 648 319 331 | PO Box 3227, Wamberal NSW 2260, Australia\n' +
      'Privacy complaints: Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.',
  },
  {
    heading: '24. Entire Agreement',
    body:
      'These Terms, together with our Privacy Policy and any other documents expressly incorporated, constitute the entire agreement between you and us concerning your use of the Services. No other terms, representations or warranties apply except as expressly stated in these Terms.',
  },
];

function TermsView() {
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
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">Terms of Service</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          The terms that apply to your use of the Panwar Portals dashboards.
        </p>
        <p className="mt-1 text-xs text-ph-charcoal/50">Last updated: {LAST_UPDATED}</p>
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
