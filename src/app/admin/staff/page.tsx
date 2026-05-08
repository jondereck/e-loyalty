import { AdminShell } from "@/components/admin/AdminShell";
import { DebouncedSearchField } from "@/components/admin/DebouncedSearchField";
import { StaffActionsDropdown, StaffActionsProvider } from "@/components/admin/StaffActionsDropdown";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  createStaffAccountAction,
  createStaffAssignmentAction,
  getStaffSetupData,
  listStaff,
} from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const branchIds = branchIdsForAdmin(profile);
  const [staff, setup] = await Promise.all([listStaff(branchIds, query), getStaffSetupData(branchIds)]);
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
      <form action="/admin/staff" className="lp-staff-toolbar">
        <DebouncedSearchField key={query} defaultValue={query} placeholder="Search staff by name, email, phone, branch, or role..." />
      </form>
      <div className="lp-panel lp-staff-panel">
        <h3>Assigned Staff</h3>
        <div className="lp-table-wrap lp-staff-table-wrap">
          <StaffActionsProvider>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Number</th><th>Branch</th><th>Role</th><th>Status</th><th>Manage</th></tr></thead>
              <tbody>
                {staff.map((assignment) => {
                  const canManage = canManageAssignment({
                    isSuperAdmin,
                    branchIds,
                    branchId: assignment.branchId,
                    role: assignment.role,
                    profileId: assignment.profileId,
                    currentProfileId: profile.id,
                  });
                  const canDeleteAccount = canManage && canDeleteStaffAccount({
                    isSuperAdmin,
                    branchIds,
                    currentProfileId: profile.id,
                    profileId: assignment.profileId,
                    roles: assignment.profile.roles,
                    assignments: assignment.profile.staffAssignments,
                    cashierVisits: assignment.profile._count.cashierVisits,
                  });
                  const deleteAccountReason = canManage && !canDeleteAccount ? staffDeleteBlockReason({
                    isSuperAdmin,
                    branchIds,
                    currentProfileId: profile.id,
                    profileId: assignment.profileId,
                    roles: assignment.profile.roles,
                    assignments: assignment.profile.staffAssignments,
                    cashierVisits: assignment.profile._count.cashierVisits,
                  }) : undefined;

                  return (
                    <tr key={assignment.id}>
                      <td>{assignment.profile.fullName}</td>
                      <td>{assignment.profile.email}</td>
                      <td>{assignment.profile.mobile ?? <span className="muted">No number</span>}</td>
                      <td>{assignment.branch.name}</td>
                      <td>{assignment.role.replaceAll("_", " ")}</td>
                      <td><StatusBadge status={assignment.status} /></td>
                      <td>
                        {canManage ? (
                          <StaffActionsDropdown
                            assignmentId={assignment.id}
                            profileId={assignment.profileId}
                            profileName={assignment.profile.fullName}
                            status={assignment.status}
                            canDeleteAccount={canDeleteAccount}
                            deleteAccountReason={deleteAccountReason}
                          />
                        ) : (
                          <span className="muted">Super Admin only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!staff.length ? <tr><td colSpan={7}>No staff assignments found.</td></tr> : null}
              </tbody>
            </table>
          </StaffActionsProvider>
        </div>
      </div>
    </AdminShell>
  );
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function canManageAssignment({
  isSuperAdmin,
  branchIds,
  branchId,
  role,
  profileId,
  currentProfileId,
}: {
  isSuperAdmin: boolean;
  branchIds?: string[];
  branchId: string;
  role: string;
  profileId: string;
  currentProfileId: string;
}) {
  if (isSuperAdmin) return true;
  if (profileId === currentProfileId) return false;
  return role === "CASHIER" && Boolean(branchIds?.includes(branchId));
}

function canDeleteStaffAccount({
  isSuperAdmin,
  branchIds,
  currentProfileId,
  profileId,
  roles,
  assignments,
  cashierVisits,
}: {
  isSuperAdmin: boolean;
  branchIds?: string[];
  currentProfileId: string;
  profileId: string;
  roles: string[];
  assignments: Array<{ branchId: string; role: string }>;
  cashierVisits: number;
}) {
  if (profileId === currentProfileId || roles.includes("CUSTOMER") || cashierVisits > 0) return false;
  if (isSuperAdmin) return true;
  return assignments.length > 0 && assignments.every((assignment) => assignment.role === "CASHIER" && branchIds?.includes(assignment.branchId));
}

function staffDeleteBlockReason(input: {
  isSuperAdmin: boolean;
  branchIds?: string[];
  currentProfileId: string;
  profileId: string;
  roles: string[];
  assignments: Array<{ branchId: string; role: string }>;
  cashierVisits: number;
}) {
  if (input.profileId === input.currentProfileId) return "Self";
  if (input.roles.includes("CUSTOMER")) return "Customer";
  if (input.cashierVisits > 0) return "Has history";
  if (!input.isSuperAdmin && !input.assignments.every((assignment) => assignment.role === "CASHIER" && input.branchIds?.includes(assignment.branchId))) {
    return "No access";
  }
  return undefined;
}

