import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/services/session";
import { getNotifications, markAllAsRead, markAsRead } from "@/lib/services/notifications";

const notificationPatchSchema = z.union([
  z.object({ all: z.literal(true), id: z.undefined().optional() }),
  z.object({ id: z.string().min(1), all: z.undefined().optional() }),
]);

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getNotifications(profile.id);
  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = notificationPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification request." }, { status: 400 });
  }

  if ("all" in parsed.data && parsed.data.all) {
    await markAllAsRead(profile.id);
  } else {
    await markAsRead(parsed.data.id, profile.id);
  }

  return NextResponse.json({ success: true });
}
