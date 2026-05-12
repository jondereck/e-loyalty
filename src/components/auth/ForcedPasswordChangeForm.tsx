"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { changeForcedPasswordAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

export function ForcedPasswordChangeForm() {
  const [state, action, pending] = useActionState(changeForcedPasswordAction, initialState);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={action} className="auth-form-stack">
      <div className="auth-force-password-note">
        <ShieldAlert size={18} />
        <span>Use your temporary password once, then replace it before continuing.</span>
      </div>

      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Temporary password"
        show={showCurrentPassword}
        onToggle={() => setShowCurrentPassword((value) => !value)}
        autoComplete="current-password"
      />
      <FieldError errors={state.errors?.currentPassword} />

      <PasswordField
        id="newPassword"
        name="newPassword"
        label="New password"
        show={showNewPassword}
        onToggle={() => setShowNewPassword((value) => !value)}
        autoComplete="new-password"
      />
      <FieldError errors={state.errors?.newPassword} />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        show={showConfirmPassword}
        onToggle={() => setShowConfirmPassword((value) => !value)}
        autoComplete="new-password"
      />
      <FieldError errors={state.errors?.confirmPassword} />

      {state.message ? <p className={state.ok ? "success-text" : "error-text"}>{state.message}</p> : null}

      <Button variant="primary" type="submit" disabled={pending} className="auth-submit">
        {pending ? <Loader2 className="spin" size={18} /> : <Lock size={18} />}
        Update password
      </Button>
    </form>
  );
}

function PasswordField({
  id,
  name,
  label,
  show,
  onToggle,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon"><Lock size={18} /></span>
        <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} />
        <button type="button" className="input-icon-button" aria-label={show ? "Hide password" : "Show password"} onClick={onToggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}
