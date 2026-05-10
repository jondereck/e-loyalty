import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/services/session";
import { getNotifications, markAllAsRead, markAsRead } from "@/lib/services/notifications";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getNotifications(profile.id);
  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, all } = await request.json();

  if (all) {
    await markAllAsRead(profile.id);
  } else if (id) {
    await markAsRead(id);
  }

  return NextResponse.json({ success: true });
}
