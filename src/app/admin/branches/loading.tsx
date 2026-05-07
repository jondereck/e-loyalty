import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminListSkeleton
      active="/admin/branches"
      title="Branches"
      subtitle="Monitor branch activity and assigned staff."
      tableTitle="Branches"
      columns={["Code", "Branch", "Visits", "Staff", "Status"]}
    />
  );
}
