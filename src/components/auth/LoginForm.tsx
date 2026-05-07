"use client";

import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { loginAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

type ClientAuthResult = {
  data?: unknown;
  error?: { message?: string } | null;
};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"password" | "email-code" | "forgot">("password");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [clientPending, setClientPending] = useState(false);

  async function startGoogleSignIn() {
    setClientPending(true);
    setClientMessage(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/finish",
      newUserCallbackURL: "/auth/finish",
      errorCallbackURL: "/login?error=google",
    }) as ClientAuthResult;

    if (result.error) {
      setClientMessage(result.error.message ?? "Google sign-in failed.");
      setClientPending(false);
    }
  }

  async function sendEmailCode(type: "sign-in" | "forget-password") {
    if (!email.trim()) {
      setClientMessage("Enter your email first.");
      return;
    }
    setClientPending(true);
    setClientMessage(null);
    const result = type === "sign-in"
      ? await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type }) as ClientAuthResult
      : await authClient.forgetPassword.emailOtp({ email: email.trim() }) as ClientAuthResult;
    setClientPending(false);
    setClientMessage(result.error?.message ?? "Email code sent.");
  }

  async function verifyEmailCode() {
    if (!email.trim() || !otp.trim()) {
      setClientMessage("Enter your email and code.");
      return;
    }
    setClientPending(true);
    setClientMessage(null);
    const result = await authClient.signIn.emailOtp({ email: email.trim(), otp: otp.trim() }) as ClientAuthResult;
    if (result.error) {
      setClientMessage(result.error.message ?? "Email code sign-in failed.");
      setClientPending(false);
      return;
    }
    window.location.href = "/auth/finish";
  }

  async function resetPassword() {
    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      setClientMessage("Enter your email, code, and new password.");
      return;
    }
    setClientPending(true);
    setClientMessage(null);
    const result = await authClient.emailOtp.resetPassword({
      email: email.trim(),
      otp: otp.trim(),
      password: newPassword,
    }) as ClientAuthResult;
    setClientPending(false);
    if (result.error) {
      setClientMessage(result.error.message ?? "Password reset failed.");
      return;
    }
    setMode("password");
    setClientMessage("Password updated. Sign in with your new password.");
  }

  return (
    <div className="auth-form-stack">
      {mode === "password" ? (
        <form action={action} className="auth-form-stack">
          <AuthField
            icon={<Mail size={18} />}
            id="identifier"
            name="identifier"
            label="Email or Username"
            placeholder="Enter your email or username"
            autoComplete="username"
          />
          <FieldError errors={state.errors?.identifier} />
          <AuthField
            icon={<Lock size={18} />}
            id="password"
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            rightControl={
              <button
                type="button"
                className="input-icon-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <FieldError errors={state.errors?.password} />
          <div className="auth-options-row">
            <label className="checkbox-row">
              <input type="checkbox" name="rememberMe" value="true" />
              <span>Remember me</span>
            </label>
            <button type="button" className="text-button" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          </div>
          {state.message ? <p className="error-text">{state.message}</p> : null}
          {clientMessage ? <p className={clientMessage.includes("sent") || clientMessage.includes("updated") ? "success-text" : "error-text"}>{clientMessage}</p> : null}
          <Button variant="primary" type="submit" disabled={pending || clientPending} className="auth-submit">
            {pending ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            Sign In
          </Button>
        </form>
      ) : null}

      {mode === "email-code" ? (
        <div className="auth-form-stack">
          <AuthField
            icon={<Mail size={18} />}
            id="email-code-email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <AuthField
            icon={<KeyRound size={18} />}
            id="email-code"
            label="Email code"
            placeholder="6-digit code"
            value={otp}
            onChange={(event) => setOtp(event.currentTarget.value)}
          />
          {clientMessage ? <p className={clientMessage.includes("sent") ? "success-text" : "error-text"}>{clientMessage}</p> : null}
          <div className="auth-split-actions">
            <Button type="button" variant="secondary" disabled={clientPending} onClick={() => sendEmailCode("sign-in")}>
              {clientPending ? <Loader2 className="spin" size={16} /> : <Mail size={16} />}
              Send code
            </Button>
            <Button type="button" variant="primary" disabled={clientPending} onClick={verifyEmailCode}>
              <KeyRound size={16} />
              Verify
            </Button>
          </div>
          <button type="button" className="text-button center" onClick={() => setMode("password")}>
            Back to password sign in
          </button>
        </div>
      ) : null}

      {mode === "forgot" ? (
        <div className="auth-form-stack">
          <AuthField
            icon={<Mail size={18} />}
            id="forgot-email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <AuthField
            icon={<KeyRound size={18} />}
            id="forgot-code"
            label="Reset code"
            placeholder="Email reset code"
            value={otp}
            onChange={(event) => setOtp(event.currentTarget.value)}
          />
          <AuthField
            icon={<Lock size={18} />}
            id="new-password"
            label="New password"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
          />
          {clientMessage ? <p className={clientMessage.includes("sent") || clientMessage.includes("updated") ? "success-text" : "error-text"}>{clientMessage}</p> : null}
          <div className="auth-split-actions">
            <Button type="button" variant="secondary" disabled={clientPending} onClick={() => sendEmailCode("forget-password")}>
              {clientPending ? <Loader2 className="spin" size={16} /> : <Mail size={16} />}
              Send code
            </Button>
            <Button type="button" variant="primary" disabled={clientPending} onClick={resetPassword}>
              <KeyRound size={16} />
              Reset
            </Button>
          </div>
          <button type="button" className="text-button center" onClick={() => setMode("password")}>
            Back to sign in
          </button>
        </div>
      ) : null}

      <div className="auth-divider"><span>OR</span></div>
      <div className="auth-provider-row">
        <Button type="button" variant="secondary" className="auth-provider-button" disabled={clientPending || pending} onClick={startGoogleSignIn}>
          {clientPending ? <Loader2 className="spin" size={16} /> : <span className="google-mark">G</span>}
          Continue with Google
        </Button>
        <Button type="button" variant="secondary" className="auth-provider-button" disabled={clientPending || pending} onClick={() => setMode("email-code")}>
          <KeyRound size={16} />
          Sign in with email code
        </Button>
      </div>
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
  rightControl?: ReactNode;
};

function AuthField({ icon, label, rightControl, className, ...props }: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={props.id}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">{icon}</span>
        <input className={className} {...props} />
        {rightControl}
      </div>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="error-text">{errors[0]}</p> : null;
}
