import { Card, CardContent } from '@/components/ui/card';

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <span className="text-xs uppercase tracking-wide text-ph-charcoal/60">{label}</span>
        <span className="text-2xl font-semibold text-ph-charcoal">{value}</span>
      </CardContent>
    </Card>
  );
}
