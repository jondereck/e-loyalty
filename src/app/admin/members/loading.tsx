import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return (
    <AdminListSkeleton
      active="/admin/members"
      title="Members"
      subtitle="Customer loyalty accounts, cards, points, and visit activity."
      tableTitle="Customer Members"
      columns={["Name", "Contact", "Card", "Points", "Visits", "Last Visit", "Profile", "Card Status"]}
      metrics
      metricLabels={["Total Members", "Active Members", "Blocked Cards", "Total Points"]}
    />
  );
}
