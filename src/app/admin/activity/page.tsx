import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DebouncedSearchField } from "@/components/admin/DebouncedSearchField";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getActivityLog } from "@/lib/services/admin";
import { branchIdsForAdmin, requireModuleAccess } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; pageSize?: string | string[] }>;
}) {
  const profile = await requireModuleAccess("OVERVIEW");
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const page = Number(readParam(params.page) ?? "1");
  const pageSize = Number(readParam(params.pageSize) ?? "10");
  const data = await getActivityLog({
    branchIds: branchIdsForAdmin(profile),
    query,
    page,
    pageSize,
  });

  return (
    <AdminShell active="/admin/dashboard">
      <div className="lp-title-row lp-branch-hero">
        <div className="lp-page-title">
          <h1>Recent Activity</h1>
          <p>Review the latest system and loyalty activity for your accessible branches.</p>
        </div>
      </div>

      <form action="/admin/activity" className="lp-staff-toolbar">
        <DebouncedSearchField key={query} defaultValue={query} placeholder="Search activity, actor, member, cashier, or branch..." />
        <Button type="submit" variant="secondary"><Filter size={16} /> Filters</Button>
      </form>

      <section className="lp-panel lp-admin-data-panel">
        <h3>Activity Log</h3>
        <div className="lp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Subject</th>
                <th>Branch</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDateTime(event.createdAt)}</td>
                  <td><StatusBadge status={event.action} /></td>
                  <td>{event.actor?.fullName ?? "System"}</td>
                  <td>{activitySubject(event)}</td>
                  <td>{event.visit?.branch.name ?? <span className="muted">Not branch scoped</span>}</td>
                  <td>{event.visit ? <Link href={`/admin/approvals/${event.visit.id}`}>#{shortCode(event.visit.id)}</Link> : `#${shortCode(event.id)}`}</td>
                </tr>
              ))}
              {!data.events.length ? <tr><td colSpan={6}>No activity found for your selected filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="lp-branch-table-footer">
          <span>Showing {data.pagination.from} to {data.pagination.to} of {data.pagination.total} events</span>
          <div className="lp-footer-actions">
            <Pagination query={data.query} pageSize={data.pagination.pageSize} page={data.pagination.page} pageCount={data.pagination.pageCount} />
            <PageSizeSelect
              action="/admin/activity"
              value={data.pagination.pageSize}
              options={[10, 20, 50]}
              hidden={[{ name: "q", value: data.query }]}
            />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

type ActivityEvent = Awaited<ReturnType<typeof getActivityLog>>["events"][number];

function Pagination({ query, pageSize, page, pageCount }: { query: string; pageSize: number; page: number; pageCount: number }) {
  return (
    <div className="lp-pagination">
      <Link className={page <= 1 ? "disabled" : ""} href={pageHref(query, pageSize, page - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </Link>
      {Array.from({ length: Math.min(pageCount, 5) }).map((_, index) => {
        const itemPage = index + 1;
        return <Link key={itemPage} className={itemPage === page ? "active" : ""} href={pageHref(query, pageSize, itemPage)}>{itemPage}</Link>;
      })}
      <Link className={page >= pageCount ? "disabled" : ""} href={pageHref(query, pageSize, page + 1)} aria-label="Next page">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function pageHref(query: string, pageSize: number, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("pageSize", String(pageSize));
  params.set("page", String(Math.max(1, page)));
  return `/admin/activity?${params.toString()}`;
}

function activitySubject(event: ActivityEvent) {
  if (!event.visit) return <span className="muted">No linked visit</span>;
  return (
    <div className="lp-two-line">
      <strong>{event.visit.customer.fullName}</strong>
      <span>Cashier: {event.visit.cashier.fullName}</span>
    </div>
  );
}

function shortCode(value: string) {
  return value.slice(-6).toUpperCase();
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
