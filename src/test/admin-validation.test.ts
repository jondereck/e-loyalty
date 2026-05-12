import { describe, expect, it } from "vitest";
import { createStaffAccountSchema } from "@/lib/validations/admin";

describe("staff account creation validation", () => {
  it("accepts staff account creation without a password field", () => {
    expect(createStaffAccountSchema.safeParse({
      fullName: "Staff One",
      username: "staff.one",
      branchId: "branch-1",
      roleId: "role-cashier",
      assignmentStatus: "ACTIVE",
    }).success).toBe(true);
  });

  it("still validates username rules", () => {
    const result = createStaffAccountSchema.safeParse({
      fullName: "Staff One",
      username: "STAFF ONE",
      branchId: "branch-1",
      roleId: "role-cashier",
      assignmentStatus: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });
});
