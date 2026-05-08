import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Download, Eye, Filter, MoreVertical, Star, UserCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DebouncedSearchField } from "@/components/admin/DebouncedSearchField";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getMemberManagementData } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MemberStatusParam = "all" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
type CardStatusParam = "all" | "ACTIVE" | "BLOCKED";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    branchId?: string | string[];
    cardStatus?: string | string[];
    tier?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const status = readMemberStatus(readParam(params.status));
  const branchId = readParam(params.branchId) ?? "all";
  const cardStatus = readCardStatus(readParam(params.cardStatus));
  const tier = readParam(params.tier) ?? "all";
  const dateFrom = readParam(params.from);
  const dateTo = readParam(params.to);
  const page = Number(readParam(params.page) ?? "1");
  const pageSize = Number(readParam(params.pageSize) ?? "8");
  const data = await getMemberManagementData({
    branchIds: branchIdsForAdmin(profile),
    query,
    status,
    branchId,
    cardStatus,
    tier,
    dateFrom,
    dateTo,
    page,
    pageSize,
  });
  const exportHref = `/api/admin/members/export?${memberParams(data.filters, data.pagination.pageSize).toString()}`;

  return (
    <AdminShell active="/admin/members">
      <div className="lp-title-row lp-branch-hero">
        <div className="lp-page-title">
          <h1>Members</h1>
          <p>Manage customer loyalty accounts, cards, points, and visit activity.</p>
        </div>
        <div className="lp-title-actions">
          <form action="/admin/members" className="lp-date-range-form">
            <input type="hidden" name="q" value={query} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="branchId" value={branchId} />
            <input type="hidden" name="cardStatus" value={cardStatus} />
            <input type="hidden" name="tier" value={tier} />
            <input type="hidden" name="pageSize" value={String(data.pagination.pageSize)} />
            <input type="date" name="from" defaultValue={data.filters.dateFrom} aria-label="Date from" />
            <input type="date" name="to" defaultValue={data.filters.dateTo} aria-label="Date to" />
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
          <Link className="btn primary" href={exportHref}><Download size={16} /> Export</Link>
        </div>
      </div>

      <div className="lp-member-metrics">
        <MemberMetric label="Total Members" value={data.metrics.total} sub="Customer accounts" icon={<Users size={28} />} />
        <MemberMetric label="Active Members" value={data.metrics.active} sub="Can use loyalty pass" icon={<UserCheck size={28} />} tone="green" />
        <MemberMetric label="Blocked Cards" value={data.metrics.blockedCards} sub="Blocked from scans" icon={<CreditCard size={28} />} tone="red" />
        <MemberMetric label="Total Points" value={data.metrics.totalPoints} sub="Current balances" icon={<Star size={28} />} tone="orange" />
      </div>

      <form action="/admin/members" className="lp-member-toolbar">
        <input type="hidden" name="from" value={data.filters.dateFrom} />
        <input type="hidden" name="to" value={data.filters.dateTo} />
        <input type="hidden" name="pageSize" value={String(data.pagination.pageSize)} />
        <DebouncedSearchField key={query} defaultValue={query} placeholder="Search members by name, email, or phone..." />
        <select name="status" defaultValue={status} aria-label="Profile status">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select name="branchId" defaultValue={branchId} aria-label="Branch">
          <option value="all">All Branches</option>
          {data.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
        <select name="tier" defaultValue={tier} aria-label="Card tier">
          <option value="all">All Card Types</option>
          {data.tiers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="hidden" name="cardStatus" value={cardStatus} />
        <Button type="submit" variant="secondary"><Filter size={16} /> Filters</Button>
      </form>

      <section className="lp-panel lp-admin-data-panel">
        <div className="lp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Card Number</th>
                <th>Points</th>
                <th>Visits</th>
                <th>Last Visit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="lp-person-cell">
                      <span className="lp-avatar tiny">{initials(member.fullName)}</span>
                      <strong>{member.fullName}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="lp-two-line"><span>{member.email}</span><span>{member.mobile ?? "No phone"}</span></div>
                  </td>
                  <td>{member.loyaltyCard?.cardNumber ?? "No card"}</td>
                  <td><Link className="lp-points-link" href={`/admin/members/${member.id}`}>{compactNumber(member.loyaltyCard?.pointsBalance ?? 0)}</Link></td>
                  <td>{compactNumber(member._count.visits)}</td>
                  <td>{formatDateTime(member.visits[0]?.scannedAt)}</td>
                  <td><StatusBadge status={member.status === "ACTIVE" ? member.loyaltyCard?.status ?? member.status : member.status} /></td>
                  <td>
                    <div className="lp-row-actions">
                      <Link className="lp-icon-button" href={`/admin/members/${member.id}`} aria-label={`View ${member.fullName}`}>
                        <Eye size={15} />
                      </Link>
                      <Link className="lp-icon-button" href={`/admin/members/${member.id}`} aria-label={`Manage ${member.fullName}`}>
                        <MoreVertical size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!data.members.length ? <tr><td colSpan={8}>No customer members found for your selected filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="lp-branch-table-footer">
          <span>Showing {data.pagination.from} to {data.pagination.to} of {data.pagination.total} members</span>
          <div className="lp-footer-actions">
            <Pagination filters={data.filters} pageSize={data.pagination.pageSize} page={data.pagination.page} pageCount={data.pagination.pageCount} />
            <PageSizeSelect
              action="/admin/members"
              value={data.pagination.pageSize}
              options={[8, 10, 20, 50]}
              hidden={pageSizeHiddenInputs(data.filters)}
            />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function MemberMetric({ label, value, sub, icon, tone = "purple" }: { label: string; value: number; sub: string; icon: ReactNode; tone?: "purple" | "green" | "red" | "orange" }) {
  return (
    <div className="lp-branch-metric">
      <span className={`lp-metric-icon ${tone === "red" ? "orange" : tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{compactNumber(value)}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

function Pagination({ filters, pageSize, page, pageCount }: { filters: MemberFilters; pageSize: number; page: number; pageCount: number }) {
  return (
    <div className="lp-pagination">
      <Link className={page <= 1 ? "disabled" : ""} href={pageHref(filters, pageSize, page - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </Link>
      {Array.from({ length: Math.min(pageCount, 5) }).map((_, index) => {
        const itemPage = index + 1;
        return <Link key={itemPage} className={itemPage === page ? "active" : ""} href={pageHref(filters, pageSize, itemPage)}>{itemPage}</Link>;
      })}
      <Link className={page >= pageCount ? "disabled" : ""} href={pageHref(filters, pageSize, page + 1)} aria-label="Next page">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

type MemberFilters = {
  query: string;
  status: MemberStatusParam;
  branchId: string;
  cardStatus: CardStatusParam;
  tier: string;
  dateFrom: string;
  dateTo: string;
};

function memberParams(filters: MemberFilters, pageSize: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  params.set("status", filters.status);
  params.set("branchId", filters.branchId);
  params.set("cardStatus", filters.cardStatus);
  params.set("tier", filters.tier);
  params.set("from", filters.dateFrom);
  params.set("to", filters.dateTo);
  params.set("pageSize", String(pageSize));
  return params;
}

function pageHref(filters: MemberFilters, pageSize: number, page: number) {
  const params = memberParams(filters, pageSize);
  params.set("page", String(Math.max(1, page)));
  return `/admin/members?${params.toString()}`;
}

function pageSizeHiddenInputs(filters: MemberFilters) {
  return [
    { name: "q", value: filters.query },
    { name: "status", value: filters.status },
    { name: "branchId", value: filters.branchId },
    { name: "cardStatus", value: filters.cardStatus },
    { name: "tier", value: filters.tier },
    { name: "from", value: filters.dateFrom },
    { name: "to", value: filters.dateTo },
  ];
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readMemberStatus(value?: string): MemberStatusParam {
  return value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED" ? value : "all";
}

function readCardStatus(value?: string): CardStatusParam {
  return value === "ACTIVE" || value === "BLOCKED" ? value : "all";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NA";
}
