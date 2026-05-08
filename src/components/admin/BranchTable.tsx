import Link from "next/link";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { UpdateBranchForm } from "@/components/admin/BranchForms";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function BranchTable({
  branches,
  canEdit = false,
}: {
  branches: Array<{
    id: string;
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    status: string;
    _count?: { visits?: number; staffAssignments?: number };
  }>;
  canEdit?: boolean;
}) {
  return (
    <div className="lp-panel lp-branch-table-panel">
      <h3>All Branches</h3>
      <div className="lp-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Branch</th>
              <th>Visits</th>
              <th>Staff</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.code}</td>
                <td>
                  <Link className="lp-branch-name" href={`/admin/branches/${branch.id}`}>
                    <strong>{branch.name}</strong>
                    <span>{branch.address || "Not provided"}</span>
                  </Link>
                </td>
                <td>{(branch._count?.visits ?? 0).toLocaleString("en")}</td>
                <td>{branch._count?.staffAssignments ?? 0}</td>
                <td><StatusBadge status={branch.status} /></td>
                <td>
                  <div className="lp-row-actions">
                    {canEdit ? (
                      <Modal title="Edit branch" trigger={<button type="button" className="lp-icon-button" aria-label={`Edit ${branch.name}`}><Pencil size={15} /></button>}>
                        <UpdateBranchForm branch={branch} />
                      </Modal>
                    ) : (
                      <Link className="lp-icon-button" href={`/admin/branches/${branch.id}`} aria-label={`View ${branch.name}`}>
                        <Eye size={15} />
                      </Link>
                    )}
                    <Link className="lp-icon-button" href={`/admin/branches/${branch.id}`} aria-label={`Open ${branch.name} details`}>
                      <MoreHorizontal size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!branches.length ? (
              <tr>
                <td colSpan={6}>No branches found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

