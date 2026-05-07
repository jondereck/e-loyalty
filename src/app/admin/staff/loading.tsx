import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminListSkeleton
      active="/admin/staff"
      title="Staff"
      subtitle="Cashier and branch-admin assignments."
      tableTitle="Assigned Staff"
      columns={["Name", "Branch", "Role", "Status"]}
      metrics
    />
  );
}
