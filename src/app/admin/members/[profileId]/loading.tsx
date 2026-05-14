import { AdminMemberDetailSkeleton, getAdminSkeletonAccess } from "@/components/admin/AdminSkeletons";

export default async function Loading() {
  const access = await getAdminSkeletonAccess();
  return <AdminMemberDetailSkeleton {...access} />;
}
