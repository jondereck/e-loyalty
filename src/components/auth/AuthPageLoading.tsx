import { Loader2 } from "lucide-react";

export function AuthPageLoading() {
  return (
    <main className="auth-spinner-screen" aria-live="polite" aria-busy="true">
      <Loader2 className="spin auth-spinner" size={28} />
    </main>
  );
}
