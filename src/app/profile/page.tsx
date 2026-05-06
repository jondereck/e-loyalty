import { LogOut } from "lucide-react";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/services/auth";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile(["CUSTOMER"]);

  return (
    <CustomerShell active="profile" eyebrow="Profile" title="Account details">
      <div className="customer-page-grid">
        <aside className="card customer-summary-card">
          <h2>{profile.fullName}</h2>
          <p className="muted">{profile.status}</p>
        </aside>
        <section className="card">
          <div className="list">
            <div className="row"><span>Name</span><strong>{profile.fullName}</strong></div>
            <div className="row"><span>Username</span><strong>{profile.username}</strong></div>
            <div className="row"><span>Email</span><strong>{profile.email}</strong></div>
            <div className="row"><span>Mobile</span><strong>{profile.mobile}</strong></div>
            <div className="row"><span>Status</span><strong>{profile.status}</strong></div>
          </div>
          <form action={logoutAction} className="actions">
            <Button variant="secondary" type="submit"><LogOut size={18} /> Logout</Button>
          </form>
        </section>
      </div>
    </CustomerShell>
  );
}
