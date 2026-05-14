import { AdminShell } from "@/components/admin/AdminShell";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { QRScanner } from "@/components/cashier/QRScanner";
import { NotificationBell } from "@/components/NotificationBell";
import { requireModuleAccess } from "@/lib/services/session";
import { prisma } from "@/lib/prisma";
import { businessDayWindow } from "@/lib/time";
import { getBusinessTimezone } from "@/lib/services/settings";
import { moduleHref, resolveProfileModules, type RoleModuleKey } from "@/lib/rbac";
import { formatTime } from "@/lib/utils";
import { Check, Ellipsis, Search, SquareStack, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function CashierScanPage() {
  const profile = await requireModuleAccess("SCAN");
  const activeAssignment = profile.staffAssignments.find((item) => item.status === "ACTIVE");
  const timezone = await getBusinessTimezone();
  const today = businessDayWindow(new Date(), timezone);
  const branchId = activeAssignment?.branchId;
  const cashierScanScope = {
    cashierId: profile.id,
    ...(branchId ? { branchId } : {}),
  };
  const todayScanScope = {
    ...cashierScanScope,
    createdAt: { gte: today.start, lt: today.end },
  };

  const [recent, scansToday, approvedToday, rejectedToday, pendingToday] = await Promise.all([
    prisma.scanAttempt.findMany({
      where: cashierScanScope,
      include: { loyaltyCard: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.scanAttempt.count({ where: todayScanScope }),
    prisma.scanAttempt.count({ where: { ...todayScanScope, status: { in: ["AUTO_APPROVED", "APPROVED"] } } }),
    prisma.scanAttempt.count({ where: { ...todayScanScope, status: "REJECTED" } }),
    prisma.scanAttempt.count({ where: { ...todayScanScope, status: "PENDING" } }),
  ]);

  const modules = resolveProfileModules(profile);
  const adminModules = ["OVERVIEW", "MEMBERS", "APPROVALS", "STAFF", "BRANCHES", "REPORTS"] as RoleModuleKey[];
  const adminEntryModule = adminModules.find((module) => modules.has(module));
  const adminHref = adminEntryModule ? moduleHref(adminEntryModule) : "/cashier/scan";
  const searchHref = modules.has("MEMBERS") ? "/admin/members" : modules.has("APPROVALS") ? "/admin/approvals" : adminHref;

  return (
    <AdminShell active="/cashier/scan">
      <div className="lp-cashier-page">
        <header className="lp-cashier-topbar">
          <form className="lp-cashier-search" action={searchHref}>
            <Search size={15} />
            <input name="q" placeholder="Search member, card, or scan ID" aria-label="Search member, card, or scan ID" />
          </form>
          <div className="lp-cashier-actions">
            <Link className="lp-cashier-pill active" href="/cashier/scan">Scan</Link>
            {adminEntryModule ? <Link className="lp-cashier-pill" href={adminHref}>Admin</Link> : null}
            <NotificationBell className="lp-cashier-icon-btn" />
            <form action="/api/auth/logout" method="post">
              <LogoutSubmitButton className="lp-cashier-logout" iconSize={14} />
            </form>
          </div>
        </header>

        <section className="lp-cashier-page-head">
          <div>
            <span className="eyebrow">Cashier workspace</span>
            <h1>QR Scan</h1>
            <p>Validate loyalty cards, prevent duplicate visits, and keep rewards accurate.</p>
          </div>
          <div className="lp-cashier-branch-card">
            <span />
            <div>
              <b>{activeAssignment?.branch.name ?? "No active branch"}</b>
              <small>Cashier: {profile.fullName} - Online</small>
            </div>
          </div>
        </section>

        <section className="lp-cashier-stats-grid">
          <CashierStat label="Scans Today" value={scansToday} sub="Current branch activity" tone="purple" icon={<SquareStack size={19} />} />
          <CashierStat label="Approved" value={approvedToday} sub="Points awarded" tone="green" icon={<Check size={22} />} />
          <CashierStat label="Rejected" value={rejectedToday} sub="Duplicate / inactive" tone="red" icon={<X size={21} />} />
          <CashierStat label="Pending Review" value={pendingToday} sub="Needs admin approval" tone="amber" icon={<Ellipsis size={22} />} />
        </section>

        <QRScanner
          branchId={branchId}
          recentScans={recent.map((scan) => ({
            id: scan.id,
            initials: initials(scan.loyaltyCard?.profile.fullName ?? scan.message),
            title: scan.loyaltyCard?.profile.fullName ?? "Unknown QR",
            detail: `${formatTime(scan.createdAt)} - ${scan.message}`,
            status: statusLabel(scan.status),
            tone: statusTone(scan.status),
          }))}
        />
      </div>
    </AdminShell>
  );
}

function CashierStat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "purple" | "green" | "red" | "amber";
  icon: ReactNode;
}) {
  return (
    <article className="lp-cashier-stat-card">
      <div>
        <span>{label}</span>
        <b>{value}</b>
        <small className={tone}>{sub}</small>
      </div>
      <i className={tone}>{icon}</i>
    </article>
  );
}

function statusLabel(status?: string | null) {
  if (status === "AUTO_APPROVED" || status === "APPROVED") return "Approved";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return "Blocked";
}

function statusTone(status?: string | null): "approved" | "pending" | "rejected" {
  if (status === "AUTO_APPROVED" || status === "APPROVED") return "approved";
  if (status === "PENDING") return "pending";
  return "rejected";
}

function initials(value: string) {
  return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "QR";
}

