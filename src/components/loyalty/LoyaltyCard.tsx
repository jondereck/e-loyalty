import { compactNumber } from "@/lib/utils";

export function LoyaltyCard({
  tier,
  points,
  visits,
  systemName = "Loyalty Pass",
}: {
  tier: string;
  points: number;
  visits: number;
  systemName?: string;
}) {
  return (
    <div className="loyalty-card">
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
