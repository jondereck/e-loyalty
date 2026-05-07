"use client";

import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Loader2, Lock, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { authClient } from "@/lib/auth/client";
import { signupAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

type ClientAuthResult = {
  error?: { message?: string } | null;
};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const [clientPending, setClientPending] = useState(false);
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const hasFieldErrors = Boolean(
    state.errors?.fullName?.length ||
    state.errors?.email?.length ||
    state.errors?.password?.length ||
    state.errors?.confirmPassword?.length,
  );

  async function startGoogleSignIn() {
    setClientPending(true);
    setClientMessage(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/finish",
      newUserCallbackURL: "/auth/finish",
      errorCallbackURL: "/signup?error=google",
      requestSignUp: true,
    }) as ClientAuthResult;

    if (result.error) {
      setClientMessage(result.error.message ?? "Google sign-up failed.");
      setClientPending(false);
    }
  }

  return (
    <div className="auth-form-stack">
      <form action={action} className="auth-form-stack">
        <AuthField
          icon={<User size={18} />}
          id="fullName"
          name="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.currentTarget.value)}
        />
        <FieldError errors={state.errors?.fullName} />
        <AuthField
          icon={<Mail size={18} />}
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <FieldError errors={state.errors?.email} />
        <AuthField
          icon={<Lock size={18} />}
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        <FieldError errors={state.errors?.password} />
        <AuthField
          icon={<Lock size={18} />}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
        />
        <FieldError errors={state.errors?.confirmPassword} />
        {state.message && !hasFieldErrors ? <p className="error-text">{state.message}</p> : null}
        {clientMessage ? <p className="error-text">{clientMessage}</p> : null}
        <Button variant="primary" type="submit" disabled={pending || clientPending} className="auth-submit">
          {pending ? <Loader2 className="spin" size={18} /> : <UserPlus size={18} />}
          Sign up
        </Button>
      </form>
      <div className="auth-divider"><span>OR</span></div>
      <Button type="button" variant="secondary" className="auth-provider-button wide" disabled={pending || clientPending} onClick={startGoogleSignIn}>
        <span className="provider-icon provider-icon--google" aria-hidden="true">
          {clientPending ? <Loader2 className="spin" size={16} /> : <GoogleMark size={18} />}
        </span>
        <span className="provider-label">Continue with Google</span>
      </Button>
      <div className="auth-secure-note">
        <ShieldCheck size={15} />
        Secure access for authorized users only
      </div>
    </div>
  );
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  label: string;
};

function AuthField({ icon, label, className, ...props }: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={props.id}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">{icon}</span>
        <input className={className} {...props} />
      </div>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}
