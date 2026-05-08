import { ShieldCheck, UserCircle } from "lucide-react";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { AccountSettingsForm } from "@/components/customer/AccountSettingsForm";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile(["CUSTOMER"]);

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
        <div className="lp-detail-row"><span>Username</span><b>{profile.username ?? "Not added yet"}</b></div>
        <div className="lp-detail-row"><span>Email</span><b>{profile.email}</b></div>
        <div className="lp-detail-row"><span>Mobile</span><b>{profile.mobile ?? "Not added yet"}</b></div>
        <div className="lp-detail-row"><span>Status</span><b>{profile.status}</b></div>
      </div>

      <AccountSettingsForm
        email={profile.email}
        fullName={profile.fullName}
        username={profile.username}
        mobile={profile.mobile}
      />

      <div className="lp-glass-row">
        <span className="lp-soft-icon"><ShieldCheck size={22} /></span>
        <div>
          <h3>Secure account</h3>
          <p>Your pass is validated in real time.</p>
        </div>
      </div>

      <form action="/api/auth/logout" method="post">
        <LogoutSubmitButton variant="secondary" className="lp-mobile-logout" />
      </form>
    </CustomerShell>
  );
}
