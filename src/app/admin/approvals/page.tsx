import Link from "next/link";
import { Check, Download, Eye, Filter, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { approveVisitAction, getApprovalManagementData } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ApprovalStatusParam = "all" | "pending" | "approved" | "rejected";

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const status = readStatus(readParam(params.status));
  const query = readParam(params.q) ?? "";
  const dateFrom = readParam(params.from);
  const dateTo = readParam(params.to);
  const page = Number(readParam(params.page) ?? "1");
  const pageSize = Number(readParam(params.pageSize) ?? "7");
  const data = await getApprovalManagementData({
    branchIds: branchIdsForAdmin(profile),
    status,
    query,
    dateFrom,
    dateTo,
    page,
    pageSize,
  });
  const exportHref = `/api/admin/approvals/export?${filterParams(data.filters, data.pagination.pageSize).toString()}`;

  return (
    <AdminShell active="/admin/approvals">
      <div className="lp-title-row lp-branch-hero">
        <div className="lp-page-title">
          <h1>Approvals</h1>
          <p>Review pending scans before points are awarded.</p>
        </div>
        <div className="lp-title-actions">
          <form action="/admin/approvals" className="lp-date-range-form">
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="q" value={query} />
            <input type="date" name="from" defaultValue={data.filters.dateFrom} aria-label="Date from" />
            <input type="date" name="to" defaultValue={data.filters.dateTo} aria-label="Date to" />
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
          <Link className="btn primary" href={exportHref}><Download size={16} /> Export</Link>
        </div>
      </div>

      <div className="lp-approval-filter-row">
        <nav className="lp-status-tabs" aria-label="Approval status">
          <Tab href={tabHref("all", data.filters)} active={status === "all"} label="All" count={data.counts.all} />
          <Tab href={tabHref("pending", data.filters)} active={status === "pending"} label="Pending" count={data.counts.pending} tone="orange" />
          <Tab href={tabHref("approved", data.filters)} active={status === "approved"} label="Approved" count={data.counts.approved} tone="green" />
          <Tab href={tabHref("rejected", data.filters)} active={status === "rejected"} label="Rejected" count={data.counts.rejected} tone="red" />
        </nav>
        <form action="/admin/approvals" className="lp-approval-search-form">
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="from" value={data.filters.dateFrom} />
          <input type="hidden" name="to" value={data.filters.dateTo} />
          <label className="lp-search-field">
            <Search size={17} />
            <input name="q" defaultValue={query} placeholder="Search by member, branch, cashier..." />
          </label>
          <Button type="submit" variant="secondary"><Filter size={16} /> Filters</Button>
        </form>
      </div>

      <section className="lp-panel lp-admin-data-panel">
        <h3>{status === "pending" ? "Pending Scans" : "Approval Scans"}</h3>
        <div className="lp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scan Time</th>
                <th>Member</th>
                <th>Branch</th>
                <th>Cashier</th>
                <th>Conflict</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDateTime(visit.scannedAt)}</td>
                  <td>
                    <div className="lp-person-cell">
                      <span className="lp-avatar tiny">{initials(visit.customer.fullName)}</span>
                      <div><strong>{visit.customer.fullName}</strong><span>Member #{shortCode(visit.customerId)}</span></div>
                    </div>
                  </td>
                  <td>
                    <div className="lp-two-line"><strong>{visit.branch.name}</strong><span>#{visit.branch.code}</span></div>
                  </td>
                  <td>
                    <div className="lp-person-cell">
                      <span className="lp-avatar tiny">{initials(visit.cashier.fullName)}</span>
                      <div><strong>{visit.cashier.fullName}</strong><span>Cashier #{shortCode(visit.cashierId)}</span></div>
                    </div>
                  </td>
                  <td>{conflictLabel(visit.reasonCode, visit.reason)}</td>
                  <td><StatusBadge status={visit.status} /></td>
                  <td>
                    <div className="lp-row-actions">
                      <Link className="lp-icon-button" href={`/admin/approvals/${visit.id}`} aria-label={`View ${visit.customer.fullName} approval`}>
                        <Eye size={15} />
                      </Link>
                      {visit.status === "PENDING" ? (
                        <form action={approveVisitAction}>
                          <input type="hidden" name="visitId" value={visit.id} />
                          <button type="submit" className="lp-icon-button" aria-label={`Approve ${visit.customer.fullName}`}>
                            <Check size={16} />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!data.visits.length ? <tr><td colSpan={7}>No approvals found for the selected filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="lp-branch-table-footer">
          <span>Showing {data.pagination.from} to {data.pagination.to} of {data.pagination.total} scans</span>
          <Pagination baseFilters={data.filters} pageSize={data.pagination.pageSize} page={data.pagination.page} pageCount={data.pagination.pageCount} />
        </div>
      </section>
    </AdminShell>
  );
}

function Tab({ href, active, label, count, tone = "purple" }: { href: string; active: boolean; label: string; count: number; tone?: "purple" | "orange" | "green" | "red" }) {
  return <Link href={href} className={active ? "active" : ""}><i className={tone} />{label}<span>{count}</span></Link>;
}

function Pagination({ baseFilters, pageSize, page, pageCount }: { baseFilters: { status: ApprovalStatusParam; query: string; dateFrom: string; dateTo: string }; pageSize: number; page: number; pageCount: number }) {
  return (
    <div className="lp-pagination">
      <Link className={page <= 1 ? "disabled" : ""} href={pageHref(baseFilters, pageSize, page - 1)}>‹</Link>
      {Array.from({ length: Math.min(pageCount, 5) }).map((_, index) => {
        const itemPage = index + 1;
        return <Link key={itemPage} className={itemPage === page ? "active" : ""} href={pageHref(baseFilters, pageSize, itemPage)}>{itemPage}</Link>;
      })}
      <Link className={page >= pageCount ? "disabled" : ""} href={pageHref(baseFilters, pageSize, page + 1)}>›</Link>
    </div>
  );
}

function filterParams(filters: { status: ApprovalStatusParam; query: string; dateFrom: string; dateTo: string }, pageSize: number) {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("from", filters.dateFrom);
  params.set("to", filters.dateTo);
  params.set("pageSize", String(pageSize));
  if (filters.query) params.set("q", filters.query);
  return params;
}

function tabHref(status: ApprovalStatusParam, filters: { query: string; dateFrom: string; dateTo: string }) {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("from", filters.dateFrom);
  params.set("to", filters.dateTo);
  if (filters.query) params.set("q", filters.query);
  return `/admin/approvals?${params.toString()}`;
}

function pageHref(filters: { status: ApprovalStatusParam; query: string; dateFrom: string; dateTo: string }, pageSize: number, page: number) {
  const params = filterParams(filters, pageSize);
  params.set("page", String(Math.max(1, page)));
  return `/admin/approvals?${params.toString()}`;
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readStatus(value?: string): ApprovalStatusParam {
  return value === "pending" || value === "approved" || value === "rejected" ? value : "all";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NA";
}

function shortCode(value: string) {
  return value.slice(-5).toUpperCase();
}

function conflictLabel(reasonCode?: string | null, reason?: string | null) {
  if (reasonCode) return reasonCode.replaceAll("_", " ").toLowerCase();
  return reason || "—";
}
