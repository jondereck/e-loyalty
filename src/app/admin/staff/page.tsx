import { AdminShell } from "@/components/admin/AdminShell";
import { DebouncedSearchField } from "@/components/admin/DebouncedSearchField";
import { StaffActionsDropdown, StaffActionsProvider } from "@/components/admin/StaffActionsDropdown";
import { AssignExistingStaffForm, CreateStaffAccountForm, UpdateStaffAssignmentForm } from "@/components/admin/StaffForms";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStaffSetupData, listStaff } from "@/lib/services/admin";
import { branchIdsForAdmin, requireModuleAccess } from "@/lib/services/session";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const profile = await requireModuleAccess("STAFF");
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const branchIds = branchIdsForAdmin(profile);
  const [staff, setup] = await Promise.all([listStaff(branchIds, query), getStaffSetupData(branchIds)]);
  const isSuperAdmin = profile.roles.includes("SUPER_ADMIN");

  return (
    <AdminShell active="/admin/staff">
      <div className="lp-title-row">
        <div className="lp-page-title">
          <h1>Staff</h1>
          <p>Cashier and branch-admin assignments.</p>
        </div>
        <div className="lp-title-actions">
          <Modal title="Create staff account" trigger={<Button type="button" variant="primary">Create Staff</Button>}>
            <CreateStaffAccountForm branches={setup.branches} roleOptions={setup.roleOptions} />
          </Modal>
          <Modal title="Assign existing staff" trigger={<Button type="button" variant="secondary">Assign Existing Staff</Button>}>
            <AssignExistingStaffForm branches={setup.branches} staffProfiles={setup.staffProfiles} roleOptions={setup.roleOptions} />
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
              <thead><tr><th>Name</th><th>Email</th><th>Number</th><th>Branch</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
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
                      <td>{assignment.roleDefinition?.name ?? assignment.role.replaceAll("_", " ")}</td>
                      <td><StatusBadge status={assignment.status} /></td>
                      <td>
                        {canManage ? (
                          <div className="lp-row-actions">
                            <Modal title="Edit staff" trigger={<button type="button" className="lp-icon-button" aria-label={`Edit ${assignment.profile.fullName}`}><Pencil size={15} /></button>}>
                              <UpdateStaffAssignmentForm
                                branches={setup.branches}
                                roleOptions={setup.roleOptions}
                                assignment={{
                                  id: assignment.id,
                                  profileId: assignment.profileId,
                                  fullName: assignment.profile.fullName,
                                  mobile: assignment.profile.mobile,
                                  branchId: assignment.branchId,
                                  role: assignment.role,
                                  roleId: assignment.roleId,
                                  status: assignment.status,
                                }}
                              />
                            </Modal>
                            <StaffActionsDropdown
                              assignmentId={assignment.id}
                              profileId={assignment.profileId}
                              profileName={assignment.profile.fullName}
                              status={assignment.status}
                              canDeleteAccount={canDeleteAccount}
                              deleteAccountReason={deleteAccountReason}
                            />
                          </div>
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

