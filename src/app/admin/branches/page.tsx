import { AdminShell } from "@/components/admin/AdminShell";
import { BranchTable } from "@/components/admin/BranchTable";
import { listBranches } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branches = await listBranches();

  return (
    <AdminShell active="/admin/branches">
      <div className="eyebrow">Admin</div>
      <h2>Branches</h2>
      <BranchTable branches={branches} />
    </AdminShell>
  );
}

