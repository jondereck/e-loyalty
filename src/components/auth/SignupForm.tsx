"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signupAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" autoComplete="name" />
      </div>
      <FieldError errors={state.errors?.fullName} />
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" />
      </div>
      <FieldError errors={state.errors?.username} />
      <div className="field">
        <label htmlFor="mobile">Mobile</label>
        <input id="mobile" name="mobile" autoComplete="tel" />
      </div>
      <FieldError errors={state.errors?.mobile} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" />
      </div>
      <FieldError errors={state.errors?.email} />
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" />
      </div>
      <FieldError errors={state.errors?.password} />
      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
      </div>
      <FieldError errors={state.errors?.confirmPassword} />
      {state.message ? <p className="error-text">{state.message}</p> : null}
      <Button variant="primary" type="submit" disabled={pending} style={{ width: "100%" }}>
        <UserPlus size={18} />
        Create account
      </Button>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}

