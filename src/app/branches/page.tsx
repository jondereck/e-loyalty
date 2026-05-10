import { CustomerShell } from "@/components/customer/CustomerShell";
import { BranchList } from "@/components/customer/BranchList";
import { listBranches } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  await requireProfile(["CUSTOMER"]);
  const branches = await listBranches();
  const activeBranches = branches.filter((b) => b.status === "ACTIVE");

  return (
    <CustomerShell active="branches" eyebrow="Locations" title="Find a Branch">
      <div className="lp-mobile-topbar">
        <h2>Branches</h2>
      </div>
      <BranchList branches={activeBranches} />
    </CustomerShell>
  );
}
