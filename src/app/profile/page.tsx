import { LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/services/auth";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const username = profile.username ?? "Not added yet";
  const mobile = profile.mobile ?? "Not added yet";

  return (
    <CustomerShell active="profile" eyebrow="Profile" title="Account details">
      <div className="lp-mobile-topbar">
        <h2>Account</h2>
        <UserCircle size={22} />
      </div>

      <div className="lp-profile-card">
        <span className="lp-avatar">{profile.fullName.slice(0, 2).toUpperCase()}</span>
        <h2>{profile.fullName}</h2>
        <p>{profile.status}</p>
      </div>

      <div className="lp-mini-card">
        <div className="lp-detail-row"><span>Username</span><b>{username}</b></div>
        <div className="lp-detail-row"><span>Email</span><b>{profile.email}</b></div>
        <div className="lp-detail-row"><span>Mobile</span><b>{mobile}</b></div>
        <div className="lp-detail-row"><span>Status</span><b>{profile.status}</b></div>
      </div>

      <div className="lp-glass-row">
        <span className="lp-soft-icon"><ShieldCheck size={22} /></span>
        <div>
          <h3>Secure account</h3>
          <p>Your pass is validated in real time.</p>
        </div>
      </div>

      <form action={logoutAction}>
        <Button variant="secondary" type="submit" className="lp-mobile-logout">
          <LogOut size={18} />
          Logout
        </Button>
      </form>
    </CustomerShell>
  );
}
