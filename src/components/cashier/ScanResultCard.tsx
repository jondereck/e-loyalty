import { AlertTriangle, Building2, Check, Clock, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function ScanResultCard({
  status,
  title,
  message,
  branch,
  customer,
  scannedAt,
  nextEligibleAt,
  pointsAwarded,
}: {
  status: string;
  title: string;
  message?: string | null;
  branch?: string | null;
  customer?: string | null;
  scannedAt?: Date | null;
  nextEligibleAt?: Date | null;
  pointsAwarded?: number | null;
}) {
  const approved = status.includes("APPROVED");
  const pending = status.includes("PENDING");
  const Icon = approved ? Check : pending ? Clock : X;

  return (
    <section className="lp-scan-result-card">
      <div className={`lp-result-orb ${pending ? "pending" : approved ? "" : "blocked"}`}>
        <Icon size={54} />
      </div>
      <h1 className={approved ? "" : pending ? "pending" : "blocked"}>{title}</h1>
      <p>
        <b>{customer ?? "Unknown customer"}</b>
        <br />
        {message ?? (approved ? "Eligible loyalty visit." : "Scan needs review.")}
      </p>

      <div className="lp-scan-card">
        <div className="lp-scan-branch">
          <span className="lp-soft-icon"><Building2 size={23} /></span>
          <div>
            <b>{branch ?? "Unknown branch"}</b>
            <small>{formatDateTime(scannedAt)}</small>
          </div>
        </div>
        <p>{approved ? "Points to be earned" : pending ? "Pending reason" : "Blocked reason"}</p>
        <span className={approved ? "lp-big-points" : "lp-big-points muted"}>
          {approved ? `+${pointsAwarded ?? 0} pts` : status.replaceAll("_", " ")}
        </span>
      </div>

      <p className="lp-alt-label">{nextEligibleAt ? "Next eligible" : "Details"}</p>
      <div className="lp-glass-row">
        <span className="lp-soft-icon"><AlertTriangle size={22} /></span>
        <div>
          <h3>{nextEligibleAt ? formatDateTime(nextEligibleAt) : status.replaceAll("_", " ")}</h3>
          <p>{nextEligibleAt ? "Customer can earn again at this time." : "This result was validated server-side."}</p>
        </div>
      </div>
    </section>
  );
}

