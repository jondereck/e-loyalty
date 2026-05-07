import { Loader2 } from "lucide-react";
import { finishAuthSession } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export default async function AuthFinishPage() {
  await finishAuthSession();

  return (
    <main className="auth-screen">
      <section className="auth-panel compact-auth-panel">
        <Loader2 className="spin" size={28} />
        <h1>Signing you in</h1>
      </section>
    </main>
  );
}
