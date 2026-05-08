"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AdminMutationResult } from "@/lib/admin/mutations";
import { cn } from "@/lib/utils";

type AdminMutationContextValue = {
  pending: boolean;
  state: AdminMutationResult;
};

const AdminMutationContext = createContext<AdminMutationContextValue | null>(null);
const emptyState: AdminMutationResult = {};

export function AdminMutationForm({
  action,
  method = "POST",
  children,
  className,
  confirm,
  resetOnSuccess = false,
  refreshOnSuccess = true,
  redirectOnSuccess,
  successMessage,
  failureMessage,
  id,
}: {
  action: string;
  method?: "POST" | "PATCH" | "DELETE";
  children: ReactNode;
  className?: string;
  confirm?: string;
  resetOnSuccess?: boolean;
  refreshOnSuccess?: boolean;
  redirectOnSuccess?: string;
  successMessage?: string;
  failureMessage?: string;
  id?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<AdminMutationResult>(emptyState);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) {
      event.currentTarget.dispatchEvent(new CustomEvent("adminmutationdone"));
      return;
    }

    setPending(true);
    setState(emptyState);
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;

    try {
      const response = await fetch(action, {
        method,
        body: new FormData(form, submitter instanceof HTMLElement ? submitter : undefined),
      });
      const result = await response.json() as AdminMutationResult;
      const nextState = successMessage && response.ok && result.ok ? { ...result, message: successMessage } : result;
      setState(nextState);

      if (response.ok && result.ok) {
        if (resetOnSuccess) form.reset();
        if (redirectOnSuccess) {
          router.replace(redirectOnSuccess);
        } else if (refreshOnSuccess) {
          router.refresh();
        }
      }
    } catch {
      setState({ message: failureMessage ?? "Action failed. Please try again." });
    } finally {
      setPending(false);
      form.dispatchEvent(new CustomEvent("adminmutationdone"));
    }
  }

  return (
    <AdminMutationContext.Provider value={{ pending, state }}>
      <form id={id} className={className} onSubmit={onSubmit}>
        {children}
      </form>
    </AdminMutationContext.Provider>
  );
}

export function AdminActionMessage({ className }: { className?: string }) {
  const { state } = useAdminMutationContext();
  if (!state.message) return null;
  return <p className={cn(state.ok ? "success-text wide" : "error-text wide", className)}>{state.message}</p>;
}

export function AdminFieldError({ name }: { name: string }) {
  const { state } = useAdminMutationContext();
  const error = state.errors?.[name]?.[0];
  return error ? <p className="error-text">{error}</p> : null;
}

export function AdminSubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "danger";
}) {
  const { pending } = useAdminMutationContext();
  return (
    <Button {...props} type="submit" variant={variant} className={className} disabled={pending || props.disabled}>
      {pending ? <Loader2 className="spin" size={16} /> : children}
      {pending ? pendingLabel ?? label : label}
    </Button>
  );
}

export function AdminExternalSubmitButton({
  form,
  label,
  pendingLabel,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  form: string;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "danger";
}) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const element = document.getElementById(form);
    if (!element) return;

    function handleSubmit() {
      setPending(true);
    }

    function handleDone() {
      setPending(false);
    }

    element.addEventListener("submit", handleSubmit);
    element.addEventListener("adminmutationdone", handleDone);
    return () => {
      element.removeEventListener("submit", handleSubmit);
      element.removeEventListener("adminmutationdone", handleDone);
    };
  }, [form]);

  return (
    <Button {...props} form={form} type="submit" variant={variant} className={className} disabled={pending || props.disabled}>
      {pending ? <Loader2 className="spin" size={16} /> : children}
      {pending ? pendingLabel ?? label : label}
    </Button>
  );
}

export function AdminPlainSubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: ReactNode;
}) {
  const { pending } = useAdminMutationContext();
  return (
    <button {...props} type="submit" className={className} disabled={pending || disabled}>
      {pending ? pendingLabel ?? <Loader2 className="spin" size={16} /> : children}
    </button>
  );
}

export function AdminIconMutationForm({
  action,
  method = "POST",
  fields,
  label,
  children,
  confirm,
  className,
  buttonClassName = "lp-icon-button",
  disabled = false,
}: {
  action: string;
  method?: "POST" | "PATCH" | "DELETE";
  fields: Record<string, string | number | boolean | null | undefined>;
  label: string;
  children: ReactNode;
  confirm?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  return (
    <AdminMutationForm action={action} method={method} className={cn("lp-inline-mutation-form", className)} confirm={confirm}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value ?? "")} />
      ))}
      <AdminIconSubmitButton label={label} className={buttonClassName} disabled={disabled}>
        {children}
      </AdminIconSubmitButton>
    </AdminMutationForm>
  );
}

function AdminIconSubmitButton({
  label,
  children,
  className,
  disabled,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useAdminMutationContext();
  return (
    <button type="submit" className={className} aria-label={label} disabled={pending || disabled}>
      {pending ? <Loader2 className="spin" size={15} /> : children}
    </button>
  );
}

function useAdminMutationContext() {
  const context = useContext(AdminMutationContext);
  if (!context) throw new Error("Admin mutation components must be used inside AdminMutationForm.");
  return context;
}
