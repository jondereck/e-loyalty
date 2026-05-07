import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getCurrentProfile } from "@/lib/services/session";

export async function AdminShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window">
        <Sidebar active={active} showSuperAdmin={profile?.roles.includes("SUPER_ADMIN")} profile={profile} />
        <section className="lp-admin-main">
          <div className="lp-admin-head">
            <h2>{active.includes("dashboard") ? "Admin Dashboard" : "Loyalty Pass"}</h2>
            <div className="lp-admin-actions">
              <span className="lp-date">Today</span>
              <button type="button" className="lp-export"><Download size={14} /> Export</button>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

