import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listStaff } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const staff = await listStaff(branchIdsForAdmin(profile));

  return (
    <AdminShell active="/admin/staff">
      <div className="lp-page-title">
        <h1>Staff</h1>
        <p>Cashier and branch-admin assignments.</p>
      </div>
      <div className="lp-metrics compact">
        <div className="lp-metric"><div><small>Total Staff Rows</small><b>{staff.length}</b><span className="up">All assignments</span></div></div>
        <div className="lp-metric"><div><small>Active</small><b>{staff.filter((item) => item.status === "ACTIVE").length}</b><span className="up">Can operate</span></div></div>
        <div className="lp-metric"><div><small>Users</small><b>{new Set(staff.map((item) => item.profileId)).size}</b><span className="up">Unique staff</span></div></div>
      </div>
      <div className="lp-panel">
        <h3>Assigned Staff</h3>
        <div className="lp-table-wrap">
          <table>
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
      </div>
    </AdminShell>
  );
}

