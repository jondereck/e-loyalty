import { Building2, ChevronDown, ClipboardCheck, Download, Gift, LayoutDashboard, LayoutGrid, Settings, Shield, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/branches", label: "Branches", icon: Building2 },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/super-admin/dashboard", label: "Super Admin", icon: Shield },
];

export function AdminSkeletonShell({
  active = "/admin/dashboard",
  heading = active.includes("dashboard") ? "Admin Dashboard" : "Loyalty Pass",
  children,
}: {
  active?: string;
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window lp-admin-skeleton">
        <aside className="lp-admin-sidebar">
          <div className="lp-admin-brand">
            <span className="lp-brand-icon">L</span>
            <span>Loyalty Pass</span>
          </div>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <div key={link.href} className={active === link.href ? "lp-side-link active" : "lp-side-link"}>
                <Icon size={16} />
                {link.label}
              </div>
            );
          })}
          <div className="lp-admin-account">
            <div className="lp-admin-user">
              <Skeleton className="lp-avatar small" />
              <div className="lp-skeleton-account-copy">
                <Skeleton className="lp-skeleton-account-name" />
                <Skeleton className="lp-skeleton-account-role" />
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </aside>
        <section className="lp-admin-main">
          <div className="lp-admin-head">
            <h2>{heading}</h2>
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

export function AdminPageTitleSkeleton({ title = "Loading", subtitle = "Loading page data." }: { title?: string; subtitle?: string }) {
  return (
    <div className="lp-page-title">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

export function AdminMetricSkeletonGrid({
  count = 4,
  compact = false,
  labels,
}: {
  count?: number;
  compact?: boolean;
  labels?: string[];
}) {
  const metricLabels = labels ?? (compact
    ? ["Total Staff Rows", "Active", "Users"]
    : ["Total Members", "Visits Today", "Pending Reviews", "Redemption Rate"]);
  const icons = [Users, TrendingUp, LayoutGrid, Gift];

  return (
    <div className={compact ? "lp-metrics compact" : "lp-metrics"}>
      {Array.from({ length: count }).map((_, index) => {
        const Icon = icons[index % icons.length];
        return (
          <div className="lp-metric" key={index}>
            <div>
              <small>{metricLabels[index] ?? "Metric"}</small>
              <Skeleton className="lp-skeleton-metric-number" />
              <Skeleton className="lp-skeleton-metric-subline" />
            </div>
            <span className={`lp-metric-icon ${index === 2 ? "orange" : index === 3 ? "green" : "purple"}`}>
              <Icon size={22} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminTablePanelSkeleton({
  title = "Pending Scans",
  columns = ["Time", "Member", "Branch", "Cashier", "Status"],
  rows = 1,
  footer,
}: {
  title?: string;
  columns?: string[];
  rows?: number;
  footer?: string;
}) {
  return (
    <section className="lp-panel">
      <h3>{title}</h3>
      <div className="lp-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={`${rowIndex}-${column}`}>
                    <Skeleton className={columnIndex === 0 ? "lp-skeleton-table-cell short" : "lp-skeleton-table-cell"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? <span className="lp-panel-foot">{footer}</span> : null}
    </section>
  );
}

export function AdminActivityPanelSkeleton() {
  return (
    <section className="lp-panel">
      <h3>Recent Activity</h3>
      <div className="lp-activity">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="lp-activity-item" key={index}>
            <Skeleton className="lp-skeleton-activity-icon" />
            <div>
              <Skeleton className="lp-skeleton-activity-title" />
              <Skeleton className="lp-skeleton-activity-subtitle" />
            </div>
            <Skeleton className="lp-skeleton-activity-time" />
          </div>
        ))}
      </div>
      <span className="lp-panel-foot">View all activity</span>
    </section>
  );
}

export function AdminDetailGridSkeleton({ panels = 2, rows = 5 }: { panels?: number; rows?: number }) {
  return (
    <div className="lp-detail-grid">
      {Array.from({ length: panels }).map((_, panelIndex) => (
        <section className="lp-panel lp-padded-panel" key={panelIndex}>
          <h3>{panelIndex === 0 ? "Scan summary" : panelIndex === 1 ? "Decision" : "Details"}</h3>
          <div className="lp-admin-detail-list">
            {Array.from({ length: rows }).map((__, rowIndex) => (
              <div key={rowIndex}>
                <Skeleton className="lp-skeleton-detail-label" />
                <Skeleton className="lp-skeleton-detail-value" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AdminDashboardSkeleton({ active = "/admin/dashboard", heading = "Admin Dashboard" }: { active?: string; heading?: string }) {
  return (
    <AdminSkeletonShell active={active} heading={heading}>
      <AdminMetricSkeletonGrid />
      <div className="lp-admin-grid">
        <AdminTablePanelSkeleton title="Pending Scans" footer="View all pending" />
        <AdminTablePanelSkeleton title="Branch Performance" columns={["Branch", "Visits", "Points Earned", "Staff", "Activity"]} footer="View full report" />
        <AdminActivityPanelSkeleton />
      </div>
    </AdminSkeletonShell>
  );
}

export function AdminListSkeleton({
  active,
  title,
  subtitle,
  tableTitle,
  columns,
  metrics = false,
  metricLabels,
}: {
  active: string;
  title: string;
  subtitle: string;
  tableTitle: string;
  columns: string[];
  metrics?: boolean;
  metricLabels?: string[];
}) {
  return (
    <AdminSkeletonShell active={active} heading="Loyalty Pass">
      <AdminPageTitleSkeleton title={title} subtitle={subtitle} />
      {metrics ? <AdminMetricSkeletonGrid count={metricLabels?.length ?? 3} compact labels={metricLabels} /> : null}
      <AdminTablePanelSkeleton title={tableTitle} columns={columns} rows={1} />
    </AdminSkeletonShell>
  );
}
