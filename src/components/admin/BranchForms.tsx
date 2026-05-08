"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const initialState: BranchActionState = {};

type BranchActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

type BranchFormData = {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  _count?: { staffAssignments?: number; visits?: number };
};

export function CreateBranchForm() {
  const router = useRouter();
  const [state, setState] = useState<BranchActionState>(initialState);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="lp-form-grid"
      onSubmit={(event) => submitBranchForm({
        event,
        method: "POST",
        setPending,
        setState,
        onSuccess: () => router.refresh(),
      })}
    >
      <div className="field">
        <label htmlFor="code">Code</label>
        <input id="code" name="code" placeholder="MAIN" />
        <FieldError errors={state.errors?.code} />
      </div>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Main Branch" />
        <FieldError errors={state.errors?.name} />
      </div>
      <div className="field wide">
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" placeholder="Street address, city, province" rows={3} />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" placeholder="(02) 8123 4567" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="branch@example.com" />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>
      <ActionMessage state={state} />
      <SubmitButton pending={pending} label="Create Branch" pendingLabel="Creating branch" />
    </form>
  );
}

export function UpdateBranchForm({ branch }: { branch: BranchFormData }) {
  const router = useRouter();
  const [state, setState] = useState<BranchActionState>(initialState);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="lp-form-grid"
      onSubmit={(event) => submitBranchForm({
        event,
        method: "PATCH",
        setPending,
        setState,
        onSuccess: () => router.refresh(),
      })}
    >
      <input type="hidden" name="branchId" value={branch.id} />
      <div className="field">
        <label htmlFor={`code-${branch.id}`}>Code</label>
        <input id={`code-${branch.id}`} name="code" defaultValue={branch.code} />
        <FieldError errors={state.errors?.code} />
      </div>
      <div className="field">
        <label htmlFor={`name-${branch.id}`}>Name</label>
        <input id={`name-${branch.id}`} name="name" defaultValue={branch.name} />
        <FieldError errors={state.errors?.name} />
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
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="field">
        <label htmlFor={`status-${branch.id}`}>Status</label>
        <select id={`status-${branch.id}`} name="status" defaultValue={branch.status}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>
      <ActionMessage state={state} />
      <SubmitButton pending={pending} label="Save Branch" pendingLabel="Saving branch" />
    </form>
  );
}

export function DeleteBranchForm({ branch }: { branch: BranchFormData }) {
  const [state, setState] = useState<BranchActionState>(initialState);
  const [pending, setPending] = useState(false);
  const staffCount = branch._count?.staffAssignments ?? 0;
  const activityCount = (branch._count?.visits ?? 0);
  const disabled = staffCount > 0 || activityCount > 0;

  useEffect(() => {
    if (state.ok) window.location.href = "/admin/branches";
  }, [state.ok]);

  return (
    <form
      className="lp-form-grid"
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${branch.name}? This cannot be undone.`)) {
          event.preventDefault();
          return;
        }
        submitBranchForm({
          event,
          method: "DELETE",
          setPending,
          setState,
        });
      }}
    >
      <input type="hidden" name="branchId" value={branch.id} />
      <p className="muted wide">
        Delete is available only when the branch has no assigned staff and no activity history.
      </p>
      <ActionMessage state={state} />
      {disabled ? (
        <p className="error-text wide">
          {staffCount > 0 ? "Remove assigned staff before deleting this branch." : "This branch has activity history and cannot be deleted."}
        </p>
      ) : null}
      <Button type="submit" variant="danger" disabled={pending || disabled} className="wide">
        {pending ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
        {pending ? "Deleting branch" : "Delete Branch"}
      </Button>
    </form>
  );
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? <Loader2 className="spin" size={16} /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ActionMessage({ state }: { state: BranchActionState }) {
  if (!state.message) return null;
  return <p className={state.ok ? "success-text wide" : "error-text wide"}>{state.message}</p>;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}

async function submitBranchForm({
  event,
  method,
  setPending,
  setState,
  onSuccess,
}: {
  event: FormEvent<HTMLFormElement>;
  method: "POST" | "PATCH" | "DELETE";
  setPending: (pending: boolean) => void;
  setState: (state: BranchActionState) => void;
  onSuccess?: () => void;
}) {
  event.preventDefault();
  setPending(true);
  setState(initialState);

  try {
    const response = await fetch("/api/admin/branches", {
      method,
      body: new FormData(event.currentTarget),
    });
    const result = await response.json() as BranchActionState;
    setState(result);
    if (response.ok && result.ok) onSuccess?.();
  } catch {
    setState({ message: "Branch action failed. Please try again." });
  } finally {
    setPending(false);
  }
}
