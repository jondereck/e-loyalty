import type { ReactNode } from "react";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);

  return children;
}
