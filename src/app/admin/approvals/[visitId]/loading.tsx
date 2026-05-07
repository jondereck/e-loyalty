import { AdminDetailGridSkeleton, AdminPageTitleSkeleton, AdminSkeletonShell } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminSkeletonShell active="/admin/approvals" heading="Loyalty Pass">
      <AdminPageTitleSkeleton title="Loading approval" subtitle="Approval detail is loading." />
      <AdminDetailGridSkeleton panels={2} rows={6} />
      <AdminDetailGridSkeleton panels={2} rows={3} />
    </AdminSkeletonShell>
  );
}
