import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listStaff } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const staff = await listStaff();

  return (
    <AdminShell active="/admin/staff">
      <div className="eyebrow">Admin</div>
      <h2>Staff</h2>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Branch</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {staff.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.profile.fullName}</td>
                <td>{assignment.branch.name}</td>
                <td>{assignment.role.replaceAll("_", " ")}</td>
                <td><StatusBadge status={assignment.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

