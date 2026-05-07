"use client";

import { useActionState } from "react";
import { Loader2, Mail, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { completeProfileAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

export function CompleteProfileForm({ email, name }: { email?: string; name?: string }) {
  const [state, action, pending] = useActionState(completeProfileAction, initialState);

  return (
    <form action={action} className="auth-form-stack">
      <div className="auth-field">
        <label htmlFor="email-display">Email</label>
        <div className="auth-input-wrap readonly">
          <span className="auth-input-icon"><Mail size={18} /></span>
          <input id="email-display" value={email ?? ""} readOnly />
        </div>
      </div>
      <div className="auth-field">
        <label htmlFor="fullName">Full name</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><User size={18} /></span>
          <input id="fullName" name="fullName" defaultValue={name ?? ""} autoComplete="name" />
        </div>
      </div>
      <FieldError errors={state.errors?.fullName} />
      <p className="field-hint">You can add username, mobile number, and password changes later in Manage account.</p>
      {state.message ? <p className="error-text">{state.message}</p> : null}
      <Button variant="primary" type="submit" disabled={pending} className="auth-submit">
        {pending ? <Loader2 className="spin" size={18} /> : <UserCheck size={18} />}
        Complete profile
      </Button>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}
