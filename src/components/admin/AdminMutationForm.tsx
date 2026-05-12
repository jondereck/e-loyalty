"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import type { AdminMutationResult } from "@/lib/admin/mutations";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";

export type AdminMutationConfirm = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type AdminMutationContextValue<T = unknown> = {
  pending: boolean;
  state: AdminMutationResult<T>;
};

const AdminMutationContext = createContext<AdminMutationContextValue | null>(null);
const emptyState: AdminMutationResult = {};

export function AdminMutationForm<T = unknown>({
  action,
  method = "POST",
  children,
  className,
  confirm,
  resetOnSuccess = false,
  refreshOnSuccess = true,
  redirectOnSuccess,
  loadingMessage,
  successMessage,
  failureMessage,
  id,
}: {
  action: string;
  method?: "POST" | "PATCH" | "DELETE";
  children: ReactNode;
  className?: string;
  confirm?: string | AdminMutationConfirm;
  resetOnSuccess?: boolean;
  refreshOnSuccess?: boolean;
  redirectOnSuccess?: string;
  loadingMessage?: string;
  successMessage?: string;
  failureMessage?: string;
  id?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<AdminMutationResult<T>>(emptyState as AdminMutationResult<T>);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingSubmissionRef = useRef<{
    form: HTMLFormElement;
    submitter?: HTMLElement;
  } | null>(null);

  async function submitForm(form: HTMLFormElement, submitter?: HTMLElement) {
    setPending(true);
    setState(emptyState as AdminMutationResult<T>);
    const toastId = toast.loading(loadingMessage ?? submitterLoadingMessage(submitter) ?? defaultLoadingMessage(method));

    try {
      const response = await fetch(action, {
        method,
        body: new FormData(form, submitter instanceof HTMLElement ? submitter : undefined),
      });
      const result = await response.json() as AdminMutationResult<T>;
      const nextState = successMessage && response.ok && result.ok ? { ...result, message: successMessage } : result;
      setState(nextState);

      if (response.ok && result.ok) {
        toast.success(nextState.message ?? "Action completed successfully.", { id: toastId });
        if (resetOnSuccess) form.reset();
        if (redirectOnSuccess) {
          router.replace(redirectOnSuccess);
        } else if (refreshOnSuccess) {
          router.refresh();
        }
      } else {
        toast.error(nextState.message ?? "Action failed.", { id: toastId });
      }
    } catch {
      const msg = failureMessage ?? "Action failed. Please try again.";
      setState({ message: msg });
      toast.error(msg, { id: toastId });
    } finally {
      setPending(false);
      form.dispatchEvent(new CustomEvent("adminmutationdone"));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;

    if (confirm) {
      pendingSubmissionRef.current = {
        form,
        submitter: submitter instanceof HTMLElement ? submitter : undefined,
      };
      setConfirmOpen(true);
      return;
    }

    await submitForm(form, submitter instanceof HTMLElement ? submitter : undefined);
  }

  async function onConfirmSubmit() {
    const pendingSubmission = pendingSubmissionRef.current;
    if (!pendingSubmission) return;
    setConfirmOpen(false);
    pendingSubmissionRef.current = null;
    await submitForm(pendingSubmission.form, pendingSubmission.submitter);
  }

  const confirmConfig = typeof confirm === "string"
    ? {
      title: "Confirm action",
      description: confirm,
      confirmLabel: "Continue",
      cancelLabel: "Cancel",
      variant: "danger" as const,
    }
    : confirm;

  return (
    <AdminMutationContext.Provider value={{ pending, state }}>
      <form id={id} className={className} onSubmit={onSubmit}>
        {children}
      </form>
      {confirmConfig ? (
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) pendingSubmissionRef.current = null;
          }}
        >
          <AlertDialogContent>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            {confirmConfig.description ? <AlertDialogDescription>{confirmConfig.description}</AlertDialogDescription> : null}
            <div className="lp-alert-dialog-actions">
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  {confirmConfig.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="button" variant={confirmConfig.variant === "danger" ? "danger" : "primary"} onClick={onConfirmSubmit}>
                  {confirmConfig.confirmLabel ?? "Confirm"}
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </AdminMutationContext.Provider>
  );
}

function defaultLoadingMessage(method: "POST" | "PATCH" | "DELETE") {
  if (method === "DELETE") return "Deleting...";
  if (method === "PATCH") return "Saving changes...";
  return "Processing...";
}

function submitterLoadingMessage(submitter?: HTMLElement) {
  const label = submitter?.getAttribute("aria-label") ?? submitter?.textContent;
  const normalized = label?.replace(/\s+/g, " ").trim();
  return normalized ? `${normalized}...` : undefined;
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
  confirm?: string | AdminMutationConfirm;
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

export function useAdminMutationState<T = unknown>() {
  return useAdminMutationContext() as AdminMutationContextValue<T>;
}
