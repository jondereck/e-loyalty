"use client";

import {
  AdminFieldError,
  AdminMutationForm,
  AdminSubmitButton,
} from "@/components/admin/AdminMutationForm";

type StaffBranchOption = {
  id: string;
  name: string;
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
  status: string;
};

export function CreateStaffAccountForm({
  branches,
  roleOptions,
}: {
  branches: StaffBranchOption[];
  roleOptions: string[];
}) {
  return (
    <AdminMutationForm action="/api/admin/staff" className="lp-form-grid" resetOnSuccess>
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
      <div className="field">
        <label htmlFor="password">Temporary password</label>
        <input id="password" name="password" type="password" placeholder="At least 8 characters" />
        <AdminFieldError name="password" />
      </div>
      <div className="field">
        <label htmlFor="branchId">Branch</label>
        <select id="branchId" name="branchId" disabled={!branches.length}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        <AdminFieldError name="branchId" />
      </div>
      <div className="field">
        <label htmlFor="role">Role</label>
        <select id="role" name="role">
          {roleOptions.map((role) => (
            <option key={role} value={role}>{roleLabel(role)}</option>
          ))}
        </select>
      </div>
      <input type="hidden" name="assignmentStatus" value="ACTIVE" />
      <AdminSubmitButton label="Create Staff" pendingLabel="Creating staff" disabled={!branches.length} />
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
  roleOptions: string[];
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
      <div className="field">
        <label htmlFor="existingBranchId">Branch</label>
        <select id="existingBranchId" name="branchId">
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="existingRole">Role</label>
        <select id="existingRole" name="role">
          {roleOptions.map((role) => (
            <option key={role} value={role}>{roleLabel(role)}</option>
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
  roleOptions: string[];
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
      <div className="field">
        <label htmlFor={`staff-branch-${assignment.id}`}>Branch</label>
        <select id={`staff-branch-${assignment.id}`} name="branchId" defaultValue={assignment.branchId}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`staff-role-${assignment.id}`}>Role</label>
        <select id={`staff-role-${assignment.id}`} name="role" defaultValue={assignment.role}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>{roleLabel(role)}</option>
          ))}
        </select>
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

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}
