import { finishAuthSession } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export default async function AuthFinalizePage() {
  await finishAuthSession();

  return null;
}
