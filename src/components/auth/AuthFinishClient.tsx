"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthFinishClient() {
  useEffect(() => {
    window.location.replace("/auth/finalize");
  }, []);

  return (
    <main className="auth-spinner-screen" aria-live="polite" aria-busy="true">
      <Loader2 className="spin auth-spinner" size={28} />
    </main>
  );
}
