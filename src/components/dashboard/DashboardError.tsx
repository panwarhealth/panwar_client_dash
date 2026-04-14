import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof Error ? error.message : 'Failed to load dashboard';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Couldn't load dashboard</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-ph-charcoal/20 px-3 py-1.5 text-sm font-medium text-ph-charcoal transition-colors hover:border-client-primary hover:text-client-primary"
        >
          Try again
        </button>
      </CardContent>
    </Card>
  );
}
