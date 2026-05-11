import { prisma } from "@/lib/prisma";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });
}

export async function getNotifications(userId: string | undefined, limit = 20) {
  if (!userId) return [];
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function getUnreadCount(userId: string | undefined) {
  if (!userId) return 0;
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }
}

export async function markAsRead(notificationId: string | undefined) {
  if (!notificationId) return null;
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return null;
  }
}

export async function markAllAsRead(userId: string | undefined) {
  if (!userId) return { count: 0 };
  try {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { count: 0 };
  }
}
