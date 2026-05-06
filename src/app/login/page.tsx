import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <AppNav />
      <main className="auth-wrap">
        <section className="card auth-card glass">
          <div className="eyebrow">Existing user</div>
          <h2>Login</h2>
          <p className="muted">Use your email, mobile, or username. You will be redirected by role after authentication.</p>
          <LoginForm />
          <p className="muted" style={{ marginTop: 18 }}>
            New customer? <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 700 }}>Sign up</Link>
          </p>
        </section>
      </main>
    </>
  );
}

