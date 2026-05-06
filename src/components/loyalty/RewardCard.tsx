import { Gift } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function RewardCard({
  name,
  description,
  pointsRequired,
  pointsCost,
  status,
}: {
  name: string;
  description: string;
  pointsRequired: number;
  pointsCost: number;
  status: string;
}) {
  return (
    <div className="row">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className="icon">
          <Gift size={20} />
        </span>
        <div>
          <strong>{name}</strong>
          <br />
          <span className="muted">
            {description} - unlocks at {pointsRequired} pts{pointsCost ? `, costs ${pointsCost} pts` : ""}
          </span>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

