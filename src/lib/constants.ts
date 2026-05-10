export const BUSINESS_TIMEZONE = "Asia/Manila";
export const POINTS_PER_VISIT = 100;

export const roleRedirects = {
  CUSTOMER: "/card",
  CASHIER: "/cashier/scan",
  BRANCH_ADMIN: "/admin/approvals",
  SUPER_ADMIN: "/admin/dashboard",
} as const;

export const rolePriority = ["SUPER_ADMIN", "BRANCH_ADMIN", "CASHIER", "CUSTOMER"] as const;
