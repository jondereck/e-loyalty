import type { ReactNode } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  LayoutGrid,
  MapPin,
  PackageCheck,
  Search,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  User,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getVisibleAdminNavLinks } from "@/components/admin/adminNav";
import { Skeleton } from "@/components/ui/Skeleton";

type MetricTone = "purple" | "green" | "orange";

type MetricItem = {
  label: string;
  icon: LucideIcon;
  tone?: MetricTone;
  variant?: "branch" | "dashboard" | "performance";
  valueWidth?: string;
  sublineWidth?: string;
};

export function AdminSkeletonShell({
  active = "/admin/dashboard",
  heading = active.includes("dashboard") ? "Admin Dashboard" : "Loyalty Pass",
  showSuperAdmin = true,
  children,
}: {
  active?: string;
  heading?: string;
  showSuperAdmin?: boolean;
  children: ReactNode;
}) {
  const sidebarLinks = getVisibleAdminNavLinks(showSuperAdmin);
  const showShellHeader = heading !== "Loyalty Pass";

  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window lp-admin-skeleton">
        <aside className="lp-admin-sidebar">
          <div className="lp-admin-brand">
            <span className="lp-brand-icon"><Sparkles size={18} /></span>
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
          <div className="lp-admin-account lp-admin-account-static">
            <div className="lp-admin-user">
              <Skeleton className="lp-avatar small" />
              <div>
                <Skeleton className="lp-skeleton-account-name" />
                <Skeleton className="lp-skeleton-account-role" />
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </aside>
        <section className="lp-admin-main">
          {showShellHeader ? (
            <div className="lp-admin-head">
              <h2>{heading}</h2>
            </div>
          ) : null}
          {children}
        </section>
      </div>
    </main>
  );
}

export function AdminPageTitleSkeleton({
  title = "Loading",
  subtitle = "Loading page data.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="lp-page-title">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
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

export function AdminDashboardSkeleton({
  active = "/admin/dashboard",
  heading = "Admin Dashboard",
  showSuperAdmin = false,
}: {
  active?: string;
  heading?: string;
  showSuperAdmin?: boolean;
}) {
  const items: MetricItem[] = [
    { label: "Total Members", icon: Users, valueWidth: "62px", sublineWidth: "96px" },
    { label: "Visits Today", icon: TrendingUp, valueWidth: "58px", sublineWidth: "112px" },
    { label: "Pending Reviews", icon: LayoutGrid, tone: "orange", valueWidth: "54px", sublineWidth: "104px" },
    { label: "Redemption Rate", icon: Gift, tone: "green", valueWidth: "72px", sublineWidth: "96px" },
  ];

  return (
    <AdminSkeletonShell active={active} heading={heading} showSuperAdmin={showSuperAdmin}>
      <MetricGrid items={items} variant="dashboard" />
      <div className="lp-admin-grid">
        <AdminTablePanelSkeleton title="Pending Scans" footer="View all pending" />
        <AdminTablePanelSkeleton title="Branch Performance" columns={["Branch", "Visits", "Points Earned", "Staff", "Activity"]} footer="View full report" />
        <AdminActivityPanelSkeleton />
      </div>
    </AdminSkeletonShell>
  );
}

export function SuperAdminDashboardSkeleton() {
  const items: MetricItem[] = [
    { label: "Total Users", icon: Users, variant: "dashboard", valueWidth: "64px", sublineWidth: "80px" },
    { label: "Total Visits", icon: TrendingUp, variant: "dashboard", valueWidth: "60px", sublineWidth: "90px" },
    { label: "Branches", icon: Store, tone: "orange", variant: "dashboard", valueWidth: "48px", sublineWidth: "72px" },
    { label: "Pending", icon: AlertTriangle, tone: "orange", variant: "dashboard", valueWidth: "48px", sublineWidth: "92px" },
  ];

  return (
    <AdminSkeletonShell active="/super-admin/dashboard" heading="Admin Dashboard" showSuperAdmin>
      <div className="lp-page-title">
        <h1>Platform control</h1>
        <p>Global loyalty system activity.</p>
      </div>
      <MetricGrid items={items} variant="dashboard" />
      <section className="lp-panel lp-padded-panel" style={{ marginTop: 18 }}>
        <h3>Reward usage</h3>
        <Skeleton className="lp-skeleton-note-line" style={{ width: "220px" }} />
      </section>
    </AdminSkeletonShell>
  );
}

export function AdminMembersSkeleton() {
  const items: MetricItem[] = [
    { label: "Total Members", icon: Users, tone: "purple", valueWidth: "54px", sublineWidth: "124px" },
    { label: "Active Members", icon: UserCheck, tone: "green", valueWidth: "54px", sublineWidth: "126px" },
    { label: "Blocked Cards", icon: CreditCard, tone: "orange", valueWidth: "46px", sublineWidth: "118px" },
    { label: "Total Points", icon: Star, tone: "orange", valueWidth: "46px", sublineWidth: "108px" },
  ];

  return (
    <AdminSkeletonShell active="/admin/members" heading="Loyalty Pass">
      <div className="lp-title-row lp-branch-hero">
        <AdminPageTitleSkeleton title="Members" subtitle="Manage customer loyalty accounts, cards, points, and visit activity." />
        <div className="lp-title-actions">
          <div className="lp-date-range-form lp-skeleton-date-range">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-date" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-date" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
          </div>
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
        </div>
      </div>

      <MetricGrid items={items} variant="branch" className="lp-member-metrics" />

      <div className="lp-member-toolbar">
        <SkeletonSearchField />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-select" />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-select" />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-select" />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
      </div>

      <AdminDataTableSkeleton
        columns={["Name", "Contact", "Card Number", "Points", "Visits", "Last Visit", "Status", "Actions"]}
        rowCount={3}
        columnKinds={{ Name: "person", Contact: "copy", Status: "status", Actions: "actions" }}
        footer
      />
    </AdminSkeletonShell>
  );
}

export function AdminBranchesSkeleton() {
  const items: MetricItem[] = [
    { label: "Total Branches", icon: MapPin, valueWidth: "52px", sublineWidth: "120px" },
    { label: "Active Branches", icon: Store, tone: "green", valueWidth: "56px", sublineWidth: "136px" },
  ];

  return (
    <AdminSkeletonShell active="/admin/branches" heading="Loyalty Pass">
      <div className="lp-title-row lp-branch-hero">
        <AdminPageTitleSkeleton title="Branches" subtitle="Monitor branch activity and manage assigned staff across all locations." />
        <div className="lp-title-actions">
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-lg" />
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
        </div>
      </div>

      <MetricGrid items={items} variant="branch" className="lp-branch-metrics" />

      <div className="lp-branch-toolbar">
        <SkeletonSearchField />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-select" />
        <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
      </div>

      <AdminDataTableSkeleton
        title="All Branches"
        columns={["Code", "Branch", "Visits", "Staff", "Status", "Actions"]}
        rowCount={3}
        columnKinds={{ Branch: "copy", Status: "status", Actions: "actions" }}
        footer
      />
    </AdminSkeletonShell>
  );
}

export function AdminApprovalsSkeleton() {
  return (
    <AdminSkeletonShell active="/admin/approvals" heading="Loyalty Pass">
      <div className="lp-title-row lp-branch-hero">
        <AdminPageTitleSkeleton title="Approvals" subtitle="Review pending scans before points are awarded." />
        <div className="lp-title-actions">
          <div className="lp-date-range-form lp-skeleton-date-range">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-date" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-date" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
          </div>
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
        </div>
      </div>

      <div className="lp-approval-filter-row">
        <div className="lp-status-tabs lp-skeleton-status-tabs">
          <StatusTabSkeleton active label="All" />
          <StatusTabSkeleton label="Pending" />
          <StatusTabSkeleton label="Approved" />
          <StatusTabSkeleton label="Rejected" />
        </div>
        <div className="lp-approval-search-form">
          <SkeletonSearchField />
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
        </div>
      </div>

      <AdminDataTableSkeleton
        title="All Scans"
        columns={["Scan Time", "Member", "Branch", "Cashier", "Conflict", "Status", "Actions"]}
        rowCount={4}
        columnKinds={{ Member: "person", Branch: "copy", Cashier: "person", Status: "status", Actions: "actions" }}
        footer
      />
    </AdminSkeletonShell>
  );
}

export function AdminStaffSkeleton() {
  const items: MetricItem[] = [
    { label: "Total Staff Rows", icon: User, variant: "dashboard", valueWidth: "48px", sublineWidth: "104px" },
    { label: "Active", icon: UserCheck, tone: "green", variant: "dashboard", valueWidth: "44px", sublineWidth: "84px" },
    { label: "Users", icon: WalletCards, variant: "dashboard", valueWidth: "46px", sublineWidth: "94px" },
  ];

  return (
    <AdminSkeletonShell active="/admin/staff" heading="Loyalty Pass">
      <div className="lp-title-row">
        <AdminPageTitleSkeleton title="Staff" subtitle="Cashier and branch-admin assignments." />
        <div className="lp-title-actions">
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-lg" />
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-lg" />
        </div>
      </div>

      <MetricGrid items={items} variant="dashboard" compact />

      <AdminDataTableSkeleton
        title="Assigned Staff"
        columns={["Name", "Email", "Number", "Branch", "Role", "Status", "Manage"]}
        rowCount={3}
        columnKinds={{ Email: "copy", Number: "text", Status: "status", Manage: "actions" }}
      />
    </AdminSkeletonShell>
  );
}

export function AdminBranchDetailSkeleton() {
  return (
    <AdminSkeletonShell active="/admin/branches" heading="Loyalty Pass">
      <DetailHeaderSkeleton backLabel="Back to Branches" title="Branch Details" subtitle="View comprehensive information and performance for this branch." actionWidth="140px" />

      <div className="lp-branch-detail-grid">
        <ReviewPanelSkeleton title="Branch Information" icon={<MapPin size={18} />} rows={6} />
        <section className="lp-panel lp-branch-performance-panel">
          <h3><span className="lp-panel-icon"><TrendingUp size={17} /></span> Branch Performance</h3>
          <MetricGrid
            items={[
              { label: "Visits", icon: Users, valueWidth: "50px", sublineWidth: "104px" },
              { label: "Points Earned", icon: TrendingUp, tone: "orange", valueWidth: "54px", sublineWidth: "108px" },
              { label: "Redemptions", icon: Gift, valueWidth: "48px", sublineWidth: "76px" },
              { label: "Redemption Rate", icon: TrendingUp, tone: "green", valueWidth: "68px", sublineWidth: "72px" },
            ]}
            variant="performance"
            className="lp-performance-grid"
          />
        </section>
      </div>

      <section className="lp-panel lp-assigned-staff-panel">
        <h3><span className="lp-panel-icon"><Users size={17} /></span> Assigned Staff</h3>
        <div className="lp-staff-card-grid lp-skeleton-card-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="lp-staff-card lp-skeleton-card" key={index}>
              <Skeleton className="lp-avatar small" />
              <div className="lp-skeleton-review-copy">
                <Skeleton className="lp-skeleton-review-label" style={{ width: "96px" }} />
                <Skeleton className="lp-skeleton-review-value" style={{ width: "128px" }} />
              </div>
              <Skeleton className="lp-skeleton-chip" />
            </div>
          ))}
        </div>
      </section>

      <AdminDataTableSkeleton
        title="Recent Activity"
        columns={["Time", "Member", "Cashier", "Points", "Status"]}
        rowCount={3}
        columnKinds={{ Status: "status" }}
      />
    </AdminSkeletonShell>
  );
}

export function AdminMemberDetailSkeleton() {
  const items: MetricItem[] = [
    { label: "Points", icon: Star, tone: "purple", valueWidth: "58px", sublineWidth: "96px" },
    { label: "Visits", icon: TrendingUp, tone: "green", valueWidth: "52px", sublineWidth: "92px" },
    { label: "Earned", icon: WalletCards, tone: "purple", valueWidth: "60px", sublineWidth: "98px" },
    { label: "Redeemed", icon: CreditCard, tone: "orange", valueWidth: "56px", sublineWidth: "92px" },
  ];

  return (
    <AdminSkeletonShell active="/admin/members" heading="Loyalty Pass">
      <DetailHeaderSkeleton backLabel="Back to Members" title="Member" subtitle="Member profile, loyalty card, points, visits, and management actions." actionWidth="132px" />

      <MetricGrid items={items} variant="branch" className="lp-member-metrics" />

      <div className="lp-approval-detail-grid">
        <ReviewPanelSkeleton title="Member Profile" icon={<User size={18} />} rows={6} />
        <ReviewPanelSkeleton title="Loyalty Card" icon={<CreditCard size={18} />} rows={4} compact />
      </div>

      <div className="lp-approval-detail-grid">
        <section className="lp-panel lp-action-panel">
          <h3>Manage Member</h3>
          <div className="lp-inline-action-grid lp-skeleton-inline-actions">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-sm" />
          </div>
        </section>
        <section className="lp-panel lp-action-panel">
          <h3>Adjust Points</h3>
          <div className="lp-adjust-form">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-input" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-textarea" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
          </div>
        </section>
      </div>

      <div className="lp-approval-detail-grid">
        <AdminDataTableSkeleton title="Recent Visits" columns={["Time", "Branch", "Cashier", "Points", "Status"]} rowCount={3} columnKinds={{ Status: "status" }} />
        <AdminDataTableSkeleton title="Point Ledger" columns={["Time", "Type", "Points", "Description"]} rowCount={3} />
      </div>

      <AdminDataTableSkeleton title="Redemptions" columns={["Time", "Reward", "Branch", "Status"]} rowCount={3} columnKinds={{ Status: "status" }} />
    </AdminSkeletonShell>
  );
}

export function AdminApprovalDetailSkeleton() {
  return (
    <AdminSkeletonShell active="/admin/approvals" heading="Loyalty Pass">
      <div className="lp-approval-detail-head">
        <div className="lp-back-link">Back to Approvals</div>
        <div className="lp-title-row lp-branch-hero">
          <AdminPageTitleSkeleton title="Approval Detail" subtitle="Review scan details and decide on approval." />
          <div className="lp-title-actions">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" />
          </div>
        </div>
      </div>

      <div className="lp-approval-detail-grid">
        <ReviewPanelSkeleton title="Scan Information" icon={<PackageCheck size={18} />} rows={7} />
        <section className="lp-panel lp-review-card">
          <h3><span className="lp-panel-icon"><AlertTriangle size={18} /></span> Scan Status</h3>
          <div className="lp-review-list compact">
            {Array.from({ length: 3 }).map((_, index) => (
              <ReviewRowSkeleton key={index} compact />
            ))}
          </div>
          <div className="lp-history-box">
            <h4><FileText size={17} /> History</h4>
            <div className="lp-timeline">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={index === 0 ? "active" : ""} key={index}>
                  <i />
                  <Skeleton className="lp-skeleton-review-label" style={{ width: "132px", marginBottom: 6 }} />
                  <Skeleton className="lp-skeleton-review-value" style={{ width: "200px" }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="lp-panel lp-notes-panel">
        <h3><span className="lp-panel-icon"><Calendar size={18} /></span> Notes</h3>
        <p>Add notes about this approval (optional).</p>
        <Skeleton className="lp-skeleton-control lp-skeleton-control-textarea" />
      </section>
    </AdminSkeletonShell>
  );
}

export function SuperAdminSettingsSkeleton() {
  return (
    <AdminSkeletonShell active="/super-admin/settings" heading="Loyalty Pass" showSuperAdmin>
      <div className="lp-settings-page">
        <div className="lp-settings-head">
          <div>
            <h1>System Settings</h1>
            <p>Manage global system settings and preferences.</p>
          </div>
          <Skeleton className="lp-skeleton-control lp-skeleton-control-button-lg" />
        </div>
        <div className="lp-settings-tabs">
          {["General", "Points & Rewards", "System", "Security", "Notifications"].map((title, index) => (
            <div className={index === 0 ? "active" : ""} key={title}>
              <Skeleton className="lp-skeleton-activity-icon" />
              {title}
            </div>
          ))}
        </div>
        <div className="lp-settings-grid">
          {["System Information", "Maintenance Mode", "System Updates", "Data Management"].map((title) => (
            <section className="lp-settings-card" key={title}>
              <h2 className="lp-settings-card-title">
                <Skeleton className="lp-skeleton-activity-icon" />
                {title}
              </h2>
              <Skeleton className="lp-skeleton-note-line" style={{ width: "70%", marginBottom: 14 }} />
              <Skeleton className="lp-skeleton-note-line" style={{ width: "52%" }} />
            </section>
          ))}
        </div>
      </div>
    </AdminSkeletonShell>
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

function MetricGrid({
  items,
  variant,
  className,
  compact = false,
}: {
  items: MetricItem[];
  variant: "branch" | "dashboard" | "performance";
  className?: string;
  compact?: boolean;
}) {
  const resolvedClassName = className ?? (variant === "dashboard" ? (compact ? "lp-metrics compact" : "lp-metrics") : "lp-branch-metrics");

  return (
    <div className={resolvedClassName}>
      {items.map((item) => (
        <MetricCardSkeleton
          key={item.label}
          label={item.label}
          icon={item.icon}
          tone={item.tone}
          variant={variant}
          valueWidth={item.valueWidth}
          sublineWidth={item.sublineWidth}
        />
      ))}
    </div>
  );
}

function MetricCardSkeleton({
  label,
  icon: Icon,
  tone = "purple",
  variant,
  valueWidth = "58px",
  sublineWidth = "112px",
}: MetricItem & { variant: "branch" | "dashboard" | "performance" }) {
  if (variant === "dashboard") {
    return (
      <div className="lp-metric">
        <div>
          <small>{label}</small>
          <Skeleton className="lp-skeleton-metric-number" style={{ width: valueWidth }} />
          <Skeleton className="lp-skeleton-metric-subline" style={{ width: sublineWidth }} />
        </div>
        <span className={`lp-metric-icon ${tone}`}><Icon size={22} /></span>
      </div>
    );
  }

  if (variant === "performance") {
    return (
      <div className="lp-performance-card">
        <div>
          <span>{label}</span>
          <Skeleton className="lp-skeleton-metric-number" style={{ width: valueWidth }} />
          <Skeleton className="lp-skeleton-metric-subline" style={{ width: sublineWidth }} />
        </div>
        <i className={`lp-metric-icon ${tone}`}><Icon size={25} /></i>
      </div>
    );
  }

  return (
    <div className="lp-branch-metric">
      <span className={`lp-metric-icon ${tone}`}>{<Icon size={28} />}</span>
      <div>
        <small>{label}</small>
        <Skeleton className="lp-skeleton-metric-number" style={{ width: valueWidth }} />
        <Skeleton className="lp-skeleton-metric-subline" style={{ width: sublineWidth }} />
      </div>
    </div>
  );
}

function AdminDataTableSkeleton({
  title,
  columns,
  rowCount,
  columnKinds = {},
  footer = false,
}: {
  title?: string;
  columns: string[];
  rowCount: number;
  columnKinds?: Record<string, "actions" | "status" | "person" | "copy" | "text">;
  footer?: boolean;
}) {
  return (
    <section className="lp-panel lp-admin-data-panel">
      {title ? <h3>{title}</h3> : null}
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
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => {
                  const kind = columnKinds[column] ?? "text";

                  return (
                    <td key={`${column}-${rowIndex}`}>
                    {kind === "actions" ? (
                      <div className="lp-row-actions">
                        <Skeleton className="lp-skeleton-icon-button" />
                        <Skeleton className="lp-skeleton-icon-button" />
                      </div>
                    ) : kind === "status" ? (
                      <Skeleton className="lp-skeleton-pill-row" />
                    ) : kind === "person" ? (
                      <div className="lp-person-cell">
                        <Skeleton className="lp-avatar tiny" />
                        <div className="lp-skeleton-review-copy">
                          <Skeleton className="lp-skeleton-review-label" style={{ width: columnIndex === 0 ? "88px" : "94px" }} />
                          <Skeleton className="lp-skeleton-review-value" style={{ width: "110px" }} />
                        </div>
                      </div>
                    ) : kind === "copy" ? (
                      <div className="lp-two-line">
                        <Skeleton className="lp-skeleton-review-label" style={{ width: "112px", marginBottom: 6 }} />
                        <Skeleton className="lp-skeleton-review-value" style={{ width: "146px" }} />
                      </div>
                    ) : (
                      <Skeleton className={columnIndex === 0 ? "lp-skeleton-table-cell short" : "lp-skeleton-table-cell"} />
                    )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? <TableFooterSkeleton /> : null}
    </section>
  );
}

function DetailHeaderSkeleton({
  backLabel,
  title,
  subtitle,
  actionWidth,
}: {
  backLabel: string;
  title: string;
  subtitle: string;
  actionWidth?: string;
}) {
  return (
    <div className="lp-approval-detail-head">
      <div className="lp-back-link">{backLabel}</div>
      <div className="lp-title-row lp-branch-hero">
        <AdminPageTitleSkeleton title={title} subtitle={subtitle} />
        {actionWidth ? (
          <div className="lp-title-actions">
            <Skeleton className="lp-skeleton-control lp-skeleton-control-button-md" style={{ width: actionWidth }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReviewPanelSkeleton({
  title,
  icon,
  rows,
  compact = false,
}: {
  title: string;
  icon: ReactNode;
  rows: number;
  compact?: boolean;
}) {
  return (
    <section className="lp-panel lp-review-card">
      <h3><span className="lp-panel-icon">{icon}</span> {title}</h3>
      <div className={compact ? "lp-review-list compact" : "lp-review-list"}>
        {Array.from({ length: rows }).map((_, index) => (
          <ReviewRowSkeleton key={index} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function ReviewRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="lp-review-row">
      <Skeleton className="lp-skeleton-review-icon" />
      <Skeleton className="lp-skeleton-review-label" style={{ width: compact ? "72px" : "88px" }} />
      <Skeleton className="lp-skeleton-review-value" style={{ width: compact ? "110px" : "138px" }} />
    </div>
  );
}

function SkeletonSearchField() {
  return (
    <div className="lp-search-field lp-skeleton-search-field">
      <Search size={17} />
      <Skeleton className="lp-skeleton-control lp-skeleton-control-search" />
    </div>
  );
}

function StatusTabSkeleton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={active ? "active" : ""}>
      <i className="purple" />
      {label}
      <Skeleton className="lp-skeleton-status-count" />
    </div>
  );
}

function TableFooterSkeleton() {
  return (
    <div className="lp-branch-table-footer">
      <Skeleton className="lp-skeleton-footer-copy" />
      <div className="lp-footer-actions">
        <div className="lp-pagination">
          <span className="disabled"><ChevronLeft size={16} /></span>
          <span className="active">1</span>
          <span><ChevronRight size={16} /></span>
        </div>
        <Skeleton className="lp-skeleton-control lp-skeleton-control-page-size" />
      </div>
    </div>
  );
}
