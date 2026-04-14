import { Card, CardContent } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-3 w-20 animate-pulse rounded bg-ph-charcoal/10" />
              <div className="mt-3 h-7 w-28 animate-pulse rounded bg-ph-charcoal/10" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-72 w-full animate-pulse rounded bg-ph-charcoal/5" />
        </CardContent>
      </Card>
    </div>
  );
}
