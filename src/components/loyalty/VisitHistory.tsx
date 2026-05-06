import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export function VisitHistory({
  visits,
}: {
  visits: Array<{
    id: string;
    scannedAt: Date;
    status: string;
    pointsAwarded: number;
    branch?: { name: string } | null;
    reason?: string | null;
  }>;
}) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Branch</th>
            <th>Status</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id}>
              <td>{formatDateTime(visit.scannedAt)}</td>
              <td>{visit.branch?.name ?? "Unknown"}</td>
              <td>
                <StatusBadge status={visit.status} />
              </td>
              <td>{visit.pointsAwarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visits.length ? <p className="muted" style={{ marginTop: 16 }}>No visits yet.</p> : null}
    </div>
  );
}

