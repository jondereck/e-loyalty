import { AdminDetailGridSkeleton, AdminPageTitleSkeleton, AdminSkeletonShell, AdminTablePanelSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminSkeletonShell active="/admin/branches" heading="Loyalty Pass">
      <AdminPageTitleSkeleton title="Loading branch" subtitle="Branch detail and recent activity." />
      <AdminDetailGridSkeleton panels={2} rows={5} />
      <AdminTablePanelSkeleton title="Assigned staff" rows={2} columns={["Name", "Email", "Role"]} />
      <div style={{ marginTop: 18 }}>
        <AdminTablePanelSkeleton title="Recent activity" rows={3} columns={["Time", "Member", "Cashier", "Points", "Status"]} />
      </div>
    </AdminSkeletonShell>
  );
}
