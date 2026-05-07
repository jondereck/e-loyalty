import { AdminMetricSkeletonGrid, AdminPageTitleSkeleton, AdminSkeletonShell, AdminTablePanelSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminSkeletonShell active="/admin/branches" heading="Loyalty Pass">
      <AdminPageTitleSkeleton title="Loading branch" subtitle="Branch detail and recent activity." />
      <AdminMetricSkeletonGrid count={3} compact />
      <AdminTablePanelSkeleton title="Assigned staff" rows={1} columns={["Name", "Role", "Status"]} />
      <div style={{ marginTop: 18 }}>
        <AdminTablePanelSkeleton title="Recent activity" rows={3} columns={["Time", "Visit", "Status"]} />
      </div>
    </AdminSkeletonShell>
  );
}
