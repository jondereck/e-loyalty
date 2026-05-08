import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsPanel } from "@/app/super-admin/settings/SettingsPanel";
import { requireProfile } from "@/lib/services/session";
import { getSuperAdminSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  await requireProfile(["SUPER_ADMIN"]);
  const settings = await getSuperAdminSettings();

  return (
    <AdminShell active="/super-admin/settings">
      <SettingsPanel initialSettings={settings} />
    </AdminShell>
  );
}

