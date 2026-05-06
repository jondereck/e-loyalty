import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <>
      <AppNav />
      <main className="auth-wrap">
        <section className="card auth-card glass">
          <div className="eyebrow">Customer onboarding</div>
          <h2>Create your account</h2>
          <p className="muted">Your profile, loyalty card, card number, and secure QR token are created after signup.</p>
          <SignupForm />
          <p className="muted" style={{ marginTop: 18 }}>
            Already registered? <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>Login</Link>
          </p>
        </section>
      </main>
    </>
  );
}

