import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function BranchTable({
  branches,
}: {
  branches: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    _count?: { visits?: number; staffAssignments?: number };
  }>;
}) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Branch</th>
            <th>Visits</th>
            <th>Staff</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch.id}>
              <td>{branch.code}</td>
              <td><Link href={`/admin/branches/${branch.id}`}><strong>{branch.name}</strong></Link></td>
              <td>{branch._count?.visits ?? 0}</td>
              <td>{branch._count?.staffAssignments ?? 0}</td>
              <td><StatusBadge status={branch.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

