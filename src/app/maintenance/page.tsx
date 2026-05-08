import Link from "next/link";
import { Wrench } from "lucide-react";
import { getMaintenanceSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getMaintenanceSettings();

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="logo">{settings.systemName.charAt(0).toUpperCase()}</span>
          <span>{settings.systemName}</span>
        </div>
        <Wrench size={30} />
        <h1>Maintenance mode</h1>
        <p className="auth-subtitle">{settings.maintenanceMessage}</p>
        <div className="auth-footer-block">
          <p className="muted">
            Need help? <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
          </p>
          <p className="muted">
            Admins can <Link href="/login">sign in</Link> to manage system settings.
          </p>
        </div>
      </section>
    </main>
  );
}
