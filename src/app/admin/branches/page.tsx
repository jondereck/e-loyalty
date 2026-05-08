import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, MapPin, Plus, Store } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateBranchForm } from "@/components/admin/BranchForms";
import { BranchTable } from "@/components/admin/BranchTable";
import { DebouncedSearchField } from "@/components/admin/DebouncedSearchField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getBranchManagementData } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; pageSize?: string | string[] }>;
}) {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const page = Number(readParam(params.page) ?? "1");
  const pageSize = Number(readParam(params.pageSize) ?? "10");
  const data = await getBranchManagementData({ branchIds: branchIdsForAdmin(profile), query, page, pageSize });
  const canCreate = profile.roles.includes("SUPER_ADMIN");
  const canEdit = profile.roles.includes("SUPER_ADMIN") || profile.roles.includes("BRANCH_ADMIN");
  const canDelete = profile.roles.includes("SUPER_ADMIN");
  const exportHref = `/api/admin/branches/export${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  return (
    <AdminShell active="/admin/branches">
      <div className="lp-title-row lp-branch-hero">
        <div className="lp-page-title">
          <h1>Branches</h1>
          <p>Monitor branch activity and manage assigned staff across all locations.</p>
        </div>
        <div className="lp-title-actions">
          {canCreate ? (
            <Modal title="Create branch" trigger={<Button type="button" variant="primary"><Plus size={18} /> Create Branch</Button>}>
              <CreateBranchForm />
            </Modal>
          ) : null}
          <Link className="btn secondary" href={exportHref}><Download size={16} /> Export</Link>
        </div>
      </div>

      <div className="lp-branch-metrics">
        <BranchMetric label="Total Branches" value={data.metrics.totalBranches} sub="All visible branches" icon={<MapPin size={25} />} />
        <BranchMetric label="Active Branches" value={data.metrics.activeBranches} sub={`${data.metrics.activePercent}% of total branches`} icon={<Store size={25} />} tone="green" />
      </div>

      <form action="/admin/branches" className="lp-branch-toolbar">
        <DebouncedSearchField key={query} defaultValue={query} placeholder="Search branches" />
        <select name="pageSize" defaultValue={String(data.pagination.pageSize)} aria-label="Rows per page">
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <BranchTable branches={data.branches} canEdit={canEdit} canDelete={canDelete} />
      <div className="lp-branch-table-footer">
        <span>Showing {data.pagination.from} to {data.pagination.to} of {data.pagination.total} branches</span>
        <div className="lp-pagination">
          <Link aria-disabled={data.pagination.page <= 1} className={data.pagination.page <= 1 ? "disabled" : ""} href={pageHref(query, data.pagination.pageSize, data.pagination.page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </Link>
          {Array.from({ length: data.pagination.pageCount }).slice(0, 5).map((_, index) => {
            const itemPage = index + 1;
            return (
              <Link key={itemPage} className={itemPage === data.pagination.page ? "active" : ""} href={pageHref(query, data.pagination.pageSize, itemPage)}>
                {itemPage}
              </Link>
            );
          })}
          <Link aria-disabled={data.pagination.page >= data.pagination.pageCount} className={data.pagination.page >= data.pagination.pageCount ? "disabled" : ""} href={pageHref(query, data.pagination.pageSize, data.pagination.page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

function BranchMetric({
  label,
  value,
  sub,
  icon,
  tone = "purple",
}: {
  label: string;
  value: number;
  sub: string;
  icon: ReactNode;
  tone?: "purple" | "green" | "orange";
}) {
  return (
    <div className="lp-branch-metric">
      <span className={`lp-metric-icon ${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value.toLocaleString("en")}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(query: string, pageSize: number, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("pageSize", String(pageSize));
  params.set("page", String(Math.max(1, page)));
  return `/admin/branches?${params.toString()}`;
}

