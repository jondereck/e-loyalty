import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminListSkeleton
      active="/admin/approvals"
      title="Approvals"
      subtitle="Review pending scans before points are awarded."
      tableTitle="Pending Scans"
      columns={["Scan Time", "Member", "Branch", "Cashier", "Conflict", "Status", "Actions"]}
    />
  );
}
