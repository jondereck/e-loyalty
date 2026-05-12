"use client";

import {
  AdminFieldError,
  AdminMutationForm,
  AdminSubmitButton,
  useAdminMutationState,
} from "@/components/admin/AdminMutationForm";

type CreateStaffAccountResultData = {
  username: string;
  syntheticEmail: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
};

type StaffBranchOption = {
  id: string;
  code?: string;
  name: string;
  status?: string;
};

type StaffProfileOption = {
  id: string;
  fullName: string;
  username?: string | null;
  email: string;
};

type StaffAssignmentFormData = {
  id: string;
  profileId: string;
  fullName: string;
  mobile?: string | null;
  branchId: string;
  role: string;
  roleId?: string | null;
  status: string;
};

type StaffRoleOption = {
  id: string;
  name: string;
  baseRole: string;
  systemRole?: string | null;
};

export function CreateStaffAccountForm({
  branches,
  roleOptions,
}: {
  branches: StaffBranchOption[];
  roleOptions: StaffRoleOption[];
}) {
  return (
    <AdminMutationForm<CreateStaffAccountResultData> action="/api/admin/staff" className="lp-form-grid" resetOnSuccess refreshOnSuccess={false}>
      <input type="hidden" name="intent" value="create-account" />
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" placeholder="Juan Dela Cruz" />
        <AdminFieldError name="fullName" />
      </div>
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" placeholder="juan.cashier" />
        <AdminFieldError name="username" />
      </div>
      <BranchSelect id="branchId" name="branchId" label="Branch assignment" branches={branches} />
      <div className="field">
        <label htmlFor="roleId">Role</label>
        <select id="roleId" name="roleId">
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <AdminFieldError name="roleId" />
      </div>
      <input type="hidden" name="assignmentStatus" value="ACTIVE" />
      <AdminSubmitButton label="Create Staff" pendingLabel="Creating staff" disabled={!branches.length} />
      <CreateStaffSuccessPanel />
    </AdminMutationForm>
  );
}

export function AssignExistingStaffForm({
  branches,
  staffProfiles,
  roleOptions,
}: {
  branches: StaffBranchOption[];
  staffProfiles: StaffProfileOption[];
  roleOptions: StaffRoleOption[];
}) {
  if (!staffProfiles.length || !branches.length) {
    return <p className="muted">Create a staff account and branch before assigning existing staff.</p>;
  }

  return (
    <AdminMutationForm action="/api/admin/staff" className="lp-form-grid" resetOnSuccess>
      <input type="hidden" name="intent" value="assign-existing" />
      <div className="field wide">
        <label htmlFor="profileId">Staff</label>
        <select id="profileId" name="profileId">
          {staffProfiles.map((staffProfile) => (
            <option key={staffProfile.id} value={staffProfile.id}>
              {staffProfile.fullName} ({staffProfile.username ?? staffProfile.email})
            </option>
          ))}
        </select>
      </div>
      <BranchSelect id="existingBranchId" name="branchId" label="Branch assignment" branches={branches} />
      <div className="field">
        <label htmlFor="existingRole">Role</label>
        <select id="existingRole" name="roleId">
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>
      <input type="hidden" name="status" value="ACTIVE" />
      <AdminSubmitButton label="Assign Staff" pendingLabel="Assigning staff" variant="secondary" />
    </AdminMutationForm>
  );
}

export function UpdateStaffAssignmentForm({
  assignment,
  branches,
  roleOptions,
}: {
  assignment: StaffAssignmentFormData;
  branches: StaffBranchOption[];
  roleOptions: StaffRoleOption[];
}) {
  return (
    <AdminMutationForm action="/api/admin/staff" method="PATCH" className="lp-form-grid">
      <input type="hidden" name="intent" value="update-assignment" />
      <input type="hidden" name="assignmentId" value={assignment.id} />
      <div className="field">
        <label htmlFor={`staff-name-${assignment.id}`}>Full name</label>
        <input id={`staff-name-${assignment.id}`} name="fullName" defaultValue={assignment.fullName} />
        <AdminFieldError name="fullName" />
      </div>
      <div className="field">
        <label htmlFor={`staff-mobile-${assignment.id}`}>Mobile number</label>
        <input id={`staff-mobile-${assignment.id}`} name="mobile" defaultValue={assignment.mobile ?? ""} placeholder="No number" />
        <AdminFieldError name="mobile" />
      </div>
      <BranchSelect id={`staff-branch-${assignment.id}`} name="branchId" label="Branch assignment" branches={branches} defaultValue={assignment.branchId} />
      <div className="field">
        <label htmlFor={`staff-role-${assignment.id}`}>Role</label>
        <select id={`staff-role-${assignment.id}`} name="roleId" defaultValue={assignment.roleId ?? legacyRoleOptionId(roleOptions, assignment.role)}>
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <AdminFieldError name="roleId" />
      </div>
      <div className="field wide">
        <label htmlFor={`staff-status-${assignment.id}`}>Status</label>
        <select id={`staff-status-${assignment.id}`} name="status" defaultValue={assignment.status}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>
      <AdminSubmitButton label="Save Staff" pendingLabel="Saving staff" />
    </AdminMutationForm>
  );
}

function legacyRoleOptionId(roleOptions: StaffRoleOption[], role: string) {
  return roleOptions.find((option) => option.systemRole === role || option.baseRole === role)?.id;
}

function BranchSelect({
  id,
  name,
  label,
  branches,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  branches: StaffBranchOption[];
  defaultValue?: string;
}) {
  return (
    <div className="field lp-branch-select-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} defaultValue={defaultValue} disabled={!branches.length}>
        {!branches.length ? <option value="">No branches available</option> : null}
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}{branch.code ? ` - ${branch.code}` : ""}{branch.status && branch.status !== "ACTIVE" ? ` (${branch.status})` : ""}
          </option>
        ))}
      </select>
      <small>{branches.length ? `${branches.length} branch${branches.length === 1 ? "" : "es"} available for assignment.` : "Create an active branch before assigning staff."}</small>
      <AdminFieldError name={name} />
    </div>
  );
}

function CreateStaffSuccessPanel() {
  const { state } = useAdminMutationState<CreateStaffAccountResultData>();
  const credentials = state.ok ? state.data : undefined;
  if (!credentials) return null;

  return (
    <div className="lp-admin-success-card wide">
      <div className="lp-admin-success-head">
        <strong>Staff credentials generated</strong>
        <span>Password change required on first login</span>
      </div>
      <div className="lp-admin-credential-grid">
        <CredentialRow label="Primary login" value={credentials.username} />
        <CredentialRow label="Backup login" value={credentials.syntheticEmail} />
        <CredentialRow label="Temporary password" value={credentials.temporaryPassword} />
      </div>
      <p className="muted">Give the username and temporary password to the staff member. They will be required to change the password after sign-in.</p>
    </div>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="lp-admin-credential-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
