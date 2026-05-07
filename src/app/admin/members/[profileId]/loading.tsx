import {
  AdminDetailGridSkeleton,
  AdminPageTitleSkeleton,
  AdminSkeletonShell,
  AdminTablePanelSkeleton,
} from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminSkeletonShell active="/admin/members" heading="Loyalty Pass">
      <AdminPageTitleSkeleton title="Member" subtitle="Member profile, loyalty card, points, visits, and management actions." />
      <AdminDetailGridSkeleton panels={2} rows={5} />
      <AdminDetailGridSkeleton panels={2} rows={3} />
      <div className="lp-detail-grid">
        <AdminTablePanelSkeleton title="Recent visits" columns={["Time", "Branch", "Cashier", "Points", "Status"]} />
        <AdminTablePanelSkeleton title="Point ledger" columns={["Time", "Type", "Points", "Description"]} />
      </div>
    </AdminSkeletonShell>
  );
}
