import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Plain-language definitions for the metrics shown across the dashboards.
 * Static content, generic across clients, so it lives in code rather than
 * the database.
 */
export const Route = createFileRoute('/dashboard/definitions')({
  component: DefinitionsView,
});

interface Definition {
  term: string;
  body: string;
}

const DEFINITIONS: Definition[] = [
  {
    term: 'Print Impressions',
    body: 'Number of print ad placements multiplied by the circulation of the publication. Represents how many people have the opportunity to see the print ad based on the publication readership.',
  },
  {
    term: 'Digital Impressions',
    body: 'Number of times a digital asset was served or viewed. For e-newsletter placements and solus eDMs, this is the number of opens.',
  },
  {
    term: 'Total Touchpoints',
    body: 'The sum of print and digital impressions - the total amount of touchpoints the brand has achieved. The accompanying percentage figure refers to actual performance vs KPIs, based on publisher averages and benchmarks.',
  },
  {
    term: 'Total Engagements',
    body: 'The total amount of clicks, video views and completions achieved through digital assets. The accompanying percentage figure refers to actual performance vs KPIs, based on publisher averages and benchmarks.',
  },
  {
    term: 'Engagement Rate',
    body: 'Total Engagements divided by Total Touchpoints. Represents the percentage of touchpoints which translated into a further action from the user.',
  },
  {
    term: 'Total Spend',
    body: 'Cost of media for all assets included in the analysis, including CPD education packages.',
  },
  {
    term: 'Average Cost per Touchpoint',
    body: 'Total Spend divided by Total Touchpoints, per thousand. The average cost for one thousand impressions (print or digital), based on actual results and actual spend.',
  },
  {
    term: 'Average Cost per Engagement',
    body: 'Total Spend divided by Total Engagements. The average cost for each click through, based on actual results and actual spend.',
  },
];

function DefinitionsView() {
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
        <h1 className="mt-2 text-2xl font-semibold text-ph-charcoal">Definitions</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          How the headline metrics across these dashboards are measured.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-ph-charcoal/10 p-0">
          {DEFINITIONS.map((d) => (
            <div key={d.term} className="px-5 py-4">
              <h2 className="text-sm font-semibold text-ph-charcoal">{d.term}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ph-charcoal/70">{d.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
