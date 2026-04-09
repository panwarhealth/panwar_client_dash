import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * UTM link tracking view — first-party click data per destination per month.
 * Stub for now.
 */
export const Route = createFileRoute('/dashboard/utm')({
  component: UtmView,
});

function UtmView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ph-charcoal">UTM tracking</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          First-party click data per destination per month.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            The UTM tracking view will land once Phase C of the Reckitt importer is in (parsing
            the UTM URL Tracking tab from the master workbook).
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
