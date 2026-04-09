import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Education view — CPD courses with completion tracking, multi-year history.
 * Stub for now.
 */
export const Route = createFileRoute('/dashboard/education')({
  component: EducationView,
});

function EducationView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ph-charcoal">Education</h1>
        <p className="mt-1 text-sm text-ph-charcoal/70">
          CPD course completions across all brands and audiences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            The education view will land once Phase C of the Reckitt importer is in (parsing
            the Pharmacist Education / GP Education tabs from the master workbook).
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
