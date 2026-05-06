"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="identifier">Email, mobile, or username</label>
        <input id="identifier" name="identifier" autoComplete="username" />
      </div>
      {state.errors?.identifier?.[0] ? <p className="error-text">{state.errors.identifier[0]}</p> : null}
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" />
      </div>
      {state.errors?.password?.[0] ? <p className="error-text">{state.errors.password[0]}</p> : null}
      {state.message ? <p className="error-text">{state.message}</p> : null}
      <Button variant="primary" type="submit" disabled={pending} style={{ width: "100%" }}>
        <LogIn size={18} />
        Sign in
      </Button>
    </form>
  );
}
