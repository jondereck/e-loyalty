import { AdminBranchDetailSkeleton, getAdminSkeletonAccess } from "@/components/admin/AdminSkeletons";

export default async function Loading() {
  const access = await getAdminSkeletonAccess();
  return <AdminBranchDetailSkeleton {...access} />;
}
