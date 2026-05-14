import { finishAuthSession } from "@/lib/services/auth";

export async function GET() {
  await finishAuthSession({ canMutateCookies: true });
  return new Response(null, { status: 204 });
}
