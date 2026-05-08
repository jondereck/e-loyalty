"use client";

import { AdminActionMessage, AdminMutationForm, AdminSubmitButton } from "@/components/admin/AdminMutationForm";

export function MemberCardStatusForm({
  profileId,
  nextStatus,
  blocked,
}: {
  profileId: string;
  nextStatus: "ACTIVE" | "BLOCKED";
  blocked: boolean;
}) {
  return (
    <AdminMutationForm action="/api/admin/members" className="lp-inline-mutation-form">
      <input type="hidden" name="intent" value="card-status" />
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="status" value={nextStatus} />
      <AdminSubmitButton
        label={blocked ? "Unblock Card" : "Block Card"}
        pendingLabel={blocked ? "Unblocking card" : "Blocking card"}
        variant={blocked ? "success" : "danger"}
      />
    </AdminMutationForm>
  );
}

export function MemberProfileStatusActions({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: string;
}) {
  return (
    <div className="lp-inline-action-grid">
      {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((status) => (
        <AdminMutationForm key={status} action="/api/admin/members" className="lp-inline-mutation-form">
          <input type="hidden" name="intent" value="profile-status" />
          <input type="hidden" name="profileId" value={profileId} />
          <input type="hidden" name="status" value={status} />
          <AdminSubmitButton
            label={status.replaceAll("_", " ")}
            pendingLabel="Saving"
            variant={currentStatus === status ? "secondary" : "default"}
            disabled={currentStatus === status}
          />
        </AdminMutationForm>
      ))}
    </div>
  );
}

export function AdjustMemberPointsForm({ profileId }: { profileId: string }) {
  return (
    <AdminMutationForm action="/api/admin/members" className="lp-adjust-form" resetOnSuccess>
      <input type="hidden" name="intent" value="adjust-points" />
      <input type="hidden" name="profileId" value={profileId} />
      <input name="points" type="number" step="1" placeholder="100 or -50" />
      <textarea name="reason" placeholder="Reason for adjustment" />
      <AdminActionMessage className="lp-adjust-message" />
      <AdminSubmitButton label="Save Adjustment" pendingLabel="Saving adjustment" />
    </AdminMutationForm>
  );
}
