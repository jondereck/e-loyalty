import { AdminDetailGridSkeleton, AdminPageTitleSkeleton, AdminSkeletonShell } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminSkeletonShell active="/super-admin/settings" heading="Loyalty Pass">
      <AdminPageTitleSkeleton title="Settings" subtitle="Core loyalty rules and security defaults." />
      <AdminDetailGridSkeleton panels={4} rows={2} />
    </AdminSkeletonShell>
  );
}
