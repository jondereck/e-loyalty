import { beforeEach, describe, expect, it, vi } from "vitest";
import { markAsRead } from "@/lib/services/notifications";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      updateMany: vi.fn(),
    },
  },
}));

describe("notification service", () => {
  beforeEach(() => {
    vi.mocked(prisma.notification.updateMany).mockReset();
  });

  it("marks a notification as read only for the owning user", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

    await markAsRead("notification-1", "user-1");

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notification-1", userId: "user-1" },
      data: { isRead: true },
    });
  });

  it("does not update anything without a user id", async () => {
    await expect(markAsRead("notification-1", undefined)).resolves.toEqual({ count: 0 });

    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });
});
