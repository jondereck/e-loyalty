import { describe, expect, it } from "vitest";
import { canAccessDuringMaintenance, generalSettingsSchema, rewardsSettingsSchema } from "@/lib/services/settings";

describe("general settings validation", () => {
  const validGeneralSettings = {
    systemName: "Loyalty Pass",
    supportEmail: "support@example.com",
    businessTimezone: "Asia/Manila",
    dateFormat: "MMM_DD_YYYY",
    currency: "PHP",
    maintenanceEnabled: false,
    maintenanceMessage: "We are performing scheduled maintenance.",
  };

  it("accepts valid general settings", () => {
    expect(generalSettingsSchema.parse(validGeneralSettings)).toMatchObject({
      systemName: "Loyalty Pass",
      supportEmail: "support@example.com",
      businessTimezone: "Asia/Manila",
    });
  });

  it("rejects invalid general settings", () => {
    expect(() => generalSettingsSchema.parse({ ...validGeneralSettings, supportEmail: "bad-email" })).toThrow();
    expect(() => generalSettingsSchema.parse({ ...validGeneralSettings, businessTimezone: "Asia/Tokyo" })).toThrow();
    expect(() => generalSettingsSchema.parse({ ...validGeneralSettings, systemName: "" })).toThrow();
    expect(() => generalSettingsSchema.parse({ ...validGeneralSettings, maintenanceMessage: "" })).toThrow();
  });
});

describe("maintenance access", () => {
  it("allows admins and blocks customer/cashier routes during maintenance", () => {
    expect(canAccessDuringMaintenance({ path: "/admin/dashboard", roles: ["BRANCH_ADMIN"], maintenanceEnabled: true })).toBe(true);
    expect(canAccessDuringMaintenance({ path: "/super-admin/settings", roles: ["SUPER_ADMIN"], maintenanceEnabled: true })).toBe(true);
    expect(canAccessDuringMaintenance({ path: "/card", roles: ["CUSTOMER"], maintenanceEnabled: true })).toBe(false);
    expect(canAccessDuringMaintenance({ path: "/cashier/scan", roles: ["CASHIER"], maintenanceEnabled: true })).toBe(false);
  });

  it("allows auth and maintenance bypass paths", () => {
    expect(canAccessDuringMaintenance({ path: "/login", roles: [], maintenanceEnabled: true })).toBe(true);
    expect(canAccessDuringMaintenance({ path: "/auth/finish", roles: [], maintenanceEnabled: true })).toBe(true);
    expect(canAccessDuringMaintenance({ path: "/maintenance", roles: [], maintenanceEnabled: true })).toBe(true);
  });
});

describe("rewards settings validation", () => {
  it("accepts points and reward milestone settings", () => {
    expect(
      rewardsSettingsSchema.parse({
        pointsPerVisit: "120",
        rewards: [
          {
            id: "reward-1",
            name: "Free Drink",
            description: "A complimentary regular drink.",
            pointsRequired: "1000",
            pointsCost: "0",
            status: "AVAILABLE",
          },
        ],
      }),
    ).toMatchObject({
      pointsPerVisit: 120,
      rewards: [{ pointsRequired: 1000, pointsCost: 0 }],
    });
  });

  it("rejects duplicate reward names", () => {
    expect(() =>
      rewardsSettingsSchema.parse({
        pointsPerVisit: 100,
        rewards: [
          { name: "Free Drink", description: "First reward.", pointsRequired: 1000, pointsCost: 0, status: "AVAILABLE" },
          { name: "free drink", description: "Duplicate reward.", pointsRequired: 2000, pointsCost: 0, status: "DISABLED" },
        ],
      }),
    ).toThrow("Reward names must be unique.");
  });
});
