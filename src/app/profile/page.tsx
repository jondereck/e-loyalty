import { LogOut } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/Button";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { logoutAction } from "@/lib/services/auth";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile(["CUSTOMER"]);

  return (
    <>
      <AppNav />
      <main className="container section">
        <div className="grid two" style={{ alignItems: "start" }}>
          <PhoneFrame active="profile">
            <h3>Account</h3>
            <div className="list">
              <div className="row"><span>Name</span><strong>{profile.fullName}</strong></div>
              <div className="row"><span>Status</span><strong>{profile.status}</strong></div>
            </div>
          </PhoneFrame>
          <section>
            <div className="eyebrow">Profile</div>
            <h2>Account details</h2>
            <div className="card">
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
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
