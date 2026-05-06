import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export function ApprovalTable({
  visits,
}: {
  visits: Array<{
    id: string;
    scannedAt: Date;
    status: string;
    reasonCode?: string | null;
    customer: { fullName: string };
    branch: { name: string };
    cashier: { fullName: string };
  }>;
}) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Scan time</th>
            <th>Customer</th>
            <th>Branch</th>
            <th>Cashier</th>
            <th>Conflict</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id}>
              <td><Link href={`/admin/approvals/${visit.id}`}>{formatDateTime(visit.scannedAt)}</Link></td>
              <td>{visit.customer.fullName}</td>
              <td>{visit.branch.name}</td>
              <td>{visit.cashier.fullName}</td>
              <td>{visit.reasonCode?.replaceAll("_", " ") ?? "Review"}</td>
              <td><StatusBadge status={visit.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visits.length ? <p className="muted" style={{ marginTop: 16 }}>No pending approvals.</p> : null}
    </div>
  );
}

