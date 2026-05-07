"use client";

import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AtSign, KeyRound, Loader2, Lock, Mail, Phone, Save, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { updateCustomerAccountAction } from "@/lib/services/auth";
import type { AuthActionState } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

type ClientAuthResult = {
  error?: { message?: string } | null;
};

export function AccountSettingsForm({
  email,
  fullName,
  username,
  mobile,
}: {
  email: string;
  fullName: string;
  username?: string | null;
  mobile?: string | null;
}) {
  const [state, action, pending] = useActionState(updateCustomerAccountAction, initialState);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function sendPasswordOtp() {
    setPasswordPending(true);
    setPasswordMessage(null);
    const result = await authClient.forgetPassword.emailOtp({ email }) as ClientAuthResult;
    setPasswordPending(false);
    setPasswordMessage(result.error?.message ?? "OTP sent to your email.");
  }

  async function resetPassword() {
    if (!otp.trim() || !newPassword.trim()) {
      setPasswordMessage("Enter the OTP and your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setPasswordPending(true);
    setPasswordMessage(null);
    const result = await authClient.emailOtp.resetPassword({
      email,
      otp: otp.trim(),
      password: newPassword,
    }) as ClientAuthResult;
    setPasswordPending(false);

    if (result.error) {
      setPasswordMessage(result.error.message ?? "Password reset failed.");
      return;
    }

    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated.");
  }

  const profileMessageClass = state.ok ? "success-text" : "error-text";
  const passwordMessageClass = passwordMessage?.includes("sent") || passwordMessage?.includes("updated")
    ? "success-text"
    : "error-text";

  return (
    <div className="lp-account-stack">
      <form action={action} className="auth-form-stack lp-mini-card lp-account-section">
        <div className="lp-mini-head">
          <div>
            <b>Manage account</b>
            <span>Add your username or mobile later here.</span>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email-display">Email</label>
          <div className="auth-input-wrap readonly">
            <span className="auth-input-icon"><Mail size={18} /></span>
            <input id="email-display" value={email} readOnly />
          </div>
        </div>

        <AuthField icon={<User size={18} />} id="fullName" name="fullName" label="Full name" defaultValue={fullName} autoComplete="name" />
        <FieldError errors={state.errors?.fullName} />

        <AuthField icon={<AtSign size={18} />} id="username" name="username" label="Username (optional)" defaultValue={username ?? ""} autoComplete="username" />
        <FieldError errors={state.errors?.username} />
        <p className="field-hint">Use lowercase letters, numbers, and underscores only.</p>

        <AuthField icon={<Phone size={18} />} id="mobile" name="mobile" label="Mobile number (optional)" defaultValue={mobile ?? ""} autoComplete="tel" />
        <FieldError errors={state.errors?.mobile} />

        {state.message ? <p className={profileMessageClass}>{state.message}</p> : null}

        <Button variant="primary" type="submit" disabled={pending} className="auth-submit">
          {pending ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          Save account changes
        </Button>
      </form>

      <div className="auth-form-stack lp-mini-card lp-account-section">
        <div className="lp-mini-head">
          <div>
            <b>Change password</b>
            <span>We send an OTP to your email before password reset.</span>
          </div>
        </div>

        <div className="lp-account-actions">
          <Button type="button" variant="secondary" disabled={passwordPending} onClick={sendPasswordOtp}>
            {passwordPending ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />}
            Send OTP
          </Button>
        </div>

        <AuthField icon={<KeyRound size={18} />} id="password-otp" label="OTP code" value={otp} onChange={(event) => setOtp(event.currentTarget.value)} />
        <AuthField icon={<Lock size={18} />} id="new-password" label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.currentTarget.value)} />
        <AuthField icon={<Lock size={18} />} id="confirm-password" label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} />

        {passwordMessage ? <p className={passwordMessageClass}>{passwordMessage}</p> : null}

        <Button type="button" variant="primary" disabled={passwordPending} className="auth-submit" onClick={resetPassword}>
          {passwordPending ? <Loader2 className="spin" size={18} /> : <Lock size={18} />}
          Update password
        </Button>
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
