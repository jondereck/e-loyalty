import type { ReactNode } from "react";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  await requireProfile(["SUPER_ADMIN"]);

  return children;
}
