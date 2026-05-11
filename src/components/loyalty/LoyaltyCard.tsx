import { compactNumber } from "@/lib/utils";

export function LoyaltyCard({
  tier,
  color,
  points,
  visits,
  systemName = "Loyalty Pass",
}: {
  tier: string;
  color?: string;
  points: number;
  visits: number;
  systemName?: string;
}) {
  return (
    <div className="loyalty-card" style={color ? { background: color } : undefined}>
      <span className="tier">{tier}</span>
      <div className="card-title">{systemName}</div>
      <div className="stats">
        <div className="stat">
          <strong>{compactNumber(points)}</strong>
          <span>Points Balance</span>
        </div>
        <div className="stat">
          <strong>{compactNumber(visits)}</strong>
          <span>Visits</span>
        </div>
      </div>
    </div>
  );
}
