import { AdminShell } from "@/components/admin/AdminShell";
import { BranchTable } from "@/components/admin/BranchTable";
import { listBranches } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branches = await listBranches(branchIdsForAdmin(profile));

  return (
    <AdminShell active="/admin/branches">
      <div className="lp-page-title">
        <h1>Branches</h1>
        <p>Monitor branch activity and assigned staff.</p>
      </div>
      <BranchTable branches={branches} />
    </AdminShell>
  );
}

