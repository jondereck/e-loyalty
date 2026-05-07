import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  createStaffAccountAction,
  createStaffAssignmentAction,
  getStaffSetupData,
  listStaff,
  updateStaffAssignmentStatusAction,
} from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branchIds = branchIdsForAdmin(profile);
  const [staff, setup] = await Promise.all([listStaff(branchIds), getStaffSetupData(branchIds)]);
  const isSuperAdmin = profile.roles.includes("SUPER_ADMIN");
  const roleOptions = isSuperAdmin ? ["CASHIER", "BRANCH_ADMIN"] : ["CASHIER"];

  return (
    <AdminShell active="/admin/staff">
      <div className="lp-title-row">
        <div className="lp-page-title">
          <h1>Staff</h1>
          <p>Cashier and branch-admin assignments.</p>
        </div>
        <div className="lp-title-actions">
          <Modal title="Create staff account" trigger={<Button type="button" variant="primary">Create Staff</Button>}>
            <form action={createStaffAccountAction}>
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" placeholder="Juan Dela Cruz" />
              </div>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" placeholder="juan.cashier" />
              </div>
              <div className="field">
                <label htmlFor="password">Temporary password</label>
                <input id="password" name="password" type="password" placeholder="At least 8 characters" />
              </div>
              <div className="field">
                <label htmlFor="branchId">Branch</label>
                <select id="branchId" name="branchId" disabled={!setup.branches.length}>
                  {setup.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role">
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>
              <input type="hidden" name="assignmentStatus" value="ACTIVE" />
              <Button type="submit" variant="primary" disabled={!setup.branches.length}>Create Staff</Button>
            </form>
          </Modal>
          <Modal title="Assign existing staff" trigger={<Button type="button" variant="secondary">Assign Existing Staff</Button>}>
            {setup.staffProfiles.length && setup.branches.length ? (
              <form action={createStaffAssignmentAction}>
                <div className="field">
                  <label htmlFor="profileId">Staff</label>
                  <select id="profileId" name="profileId">
                    {setup.staffProfiles.map((staffProfile) => (
                      <option key={staffProfile.id} value={staffProfile.id}>
                        {staffProfile.fullName} ({staffProfile.username ?? staffProfile.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="existingBranchId">Branch</label>
                  <select id="existingBranchId" name="branchId">
                    {setup.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="existingRole">Role</label>
                  <select id="existingRole" name="role">
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <input type="hidden" name="status" value="ACTIVE" />
                <Button type="submit" variant="secondary">Assign Staff</Button>
              </form>
            ) : (
              <p className="muted">Create a staff account and branch before assigning existing staff.</p>
            )}
          </Modal>
        </div>
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
            <thead><tr><th>Name</th><th>Branch</th><th>Role</th><th>Status</th><th>Manage</th></tr></thead>
            <tbody>
              {staff.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.profile.fullName}</td>
                  <td>{assignment.branch.name}</td>
                  <td>{assignment.role.replaceAll("_", " ")}</td>
                  <td><StatusBadge status={assignment.status} /></td>
                  <td>
                    {isSuperAdmin || assignment.role === "CASHIER" ? (
                      <div className="actions">
                        {(["ACTIVE", "INACTIVE", "REVOKED"] as const).map((status) => (
                          <form action={updateStaffAssignmentStatusAction} key={status}>
                            <input type="hidden" name="assignmentId" value={assignment.id} />
                            <input type="hidden" name="status" value={status} />
                            <Button type="submit" variant={assignment.status === status ? "secondary" : "default"} disabled={assignment.status === status}>
                              {status}
                            </Button>
                          </form>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">Super Admin only</span>
                    )}
                  </td>
                </tr>
              ))}
              {!staff.length ? <tr><td colSpan={5}>No staff assignments found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

