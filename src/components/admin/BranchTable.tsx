import Link from "next/link";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { updateBranchAction } from "@/lib/services/admin";

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
              <th>Actions</th>
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
                        <BranchForm branch={branch} submitLabel="Save Branch" />
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

function BranchForm({
  branch,
  submitLabel,
}: {
  branch: {
    id: string;
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    status: string;
  };
  submitLabel: string;
}) {
  return (
    <form action={updateBranchAction} className="lp-form-grid">
      <input type="hidden" name="branchId" value={branch.id} />
      <div className="field">
        <label htmlFor={`code-${branch.id}`}>Code</label>
        <input id={`code-${branch.id}`} name="code" defaultValue={branch.code} />
      </div>
      <div className="field">
        <label htmlFor={`name-${branch.id}`}>Name</label>
        <input id={`name-${branch.id}`} name="name" defaultValue={branch.name} />
      </div>
      <div className="field wide">
        <label htmlFor={`address-${branch.id}`}>Address</label>
        <textarea id={`address-${branch.id}`} name="address" defaultValue={branch.address ?? ""} rows={3} />
      </div>
      <div className="field">
        <label htmlFor={`phone-${branch.id}`}>Phone</label>
        <input id={`phone-${branch.id}`} name="phone" defaultValue={branch.phone ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`email-${branch.id}`}>Email</label>
        <input id={`email-${branch.id}`} name="email" type="email" defaultValue={branch.email ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`status-${branch.id}`}>Status</label>
        <select id={`status-${branch.id}`} name="status" defaultValue={branch.status}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>
      <Button type="submit" variant="primary">{submitLabel}</Button>
    </form>
  );
}

