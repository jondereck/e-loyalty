import { Check, Clock, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export function ScanResultCard({
  status,
  title,
  message,
  branch,
  customer,
  scannedAt,
  nextEligibleAt,
}: {
  status: string;
  title: string;
  message?: string | null;
  branch?: string | null;
  customer?: string | null;
  scannedAt?: Date | null;
  nextEligibleAt?: Date | null;
}) {
  const approved = status.includes("APPROVED");
  const pending = status.includes("PENDING");
  const Icon = approved ? Check : pending ? Clock : X;

  return (
    <Card>
      <div className={`circle ${pending ? "pending" : approved ? "" : "blocked"}`}>
        <Icon size={44} />
      </div>
      <h2 style={{ textAlign: "center", fontSize: 30 }}>{title}</h2>
      <p className="muted" style={{ textAlign: "center" }}>{message}</p>
      <div className="list">
        <div className="row"><span>Status</span><StatusBadge status={status} /></div>
        <div className="row"><span>Customer</span><strong>{customer ?? "Unknown"}</strong></div>
        <div className="row"><span>Branch</span><strong>{branch ?? "Unknown"}</strong></div>
        <div className="row"><span>Scan time</span><strong>{formatDateTime(scannedAt)}</strong></div>
        {nextEligibleAt ? <div className="row"><span>Next eligible</span><strong>{formatDateTime(nextEligibleAt)}</strong></div> : null}
      </div>
    </Card>
  );
}

