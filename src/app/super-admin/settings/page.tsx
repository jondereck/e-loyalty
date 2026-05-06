import { AdminShell } from "@/components/admin/AdminShell";
import { POINTS_PER_VISIT, BUSINESS_TIMEZONE } from "@/lib/constants";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  await requireProfile(["SUPER_ADMIN"]);

  return (
    <AdminShell active="/super-admin/settings">
      <div className="eyebrow">Super Admin</div>
      <h2>Settings</h2>
      <div className="grid two">
        <div className="card"><h3>Timezone</h3><p className="muted">{BUSINESS_TIMEZONE}</p></div>
        <div className="card"><h3>Once-per-day rule</h3><p className="muted">Customers can earn again at the start of the next business day.</p></div>
        <div className="card"><h3>QR config</h3><p className="muted">Opaque secure tokens stored server-side.</p></div>
        <div className="card"><h3>Reward defaults</h3><p className="muted">{POINTS_PER_VISIT} points per approved visit.</p></div>
      </div>
    </AdminShell>
  );
}

