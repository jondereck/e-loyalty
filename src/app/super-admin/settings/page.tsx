import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsPanel } from "@/app/super-admin/settings/SettingsPanel";
import { requireProfile } from "@/lib/services/session";
import { getSuperAdminSettings } from "@/lib/services/settings";
import { getRoleManagementData } from "@/lib/services/roles";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  await requireProfile(["SUPER_ADMIN"]);
  const params = await searchParams;
  const initialTab = readParam(params.tab) === "roles" ? "roles" : undefined;
  const [settings, roles] = await Promise.all([getSuperAdminSettings(), getRoleManagementData()]);

  return (
    <AdminShell active="/super-admin/settings">
      <SettingsPanel initialSettings={settings} initialRoles={roles} initialTab={initialTab} />
    </AdminShell>
  );
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

