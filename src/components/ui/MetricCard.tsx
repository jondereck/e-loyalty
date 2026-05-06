import { Card } from "@/components/ui/Card";

export function MetricCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number;
  badge?: string;
}) {
  return (
    <Card className="metric">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {badge ? <span className="badge green">{badge}</span> : null}
    </Card>
  );
}

