export const BUSINESS_TIMEZONE = "Asia/Taipei";
export const POINTS_PER_VISIT = 100;

export const roleRedirects = {
  CUSTOMER: "/card",
  CASHIER: "/cashier/scan",
  BRANCH_ADMIN: "/admin/approvals",
  SUPER_ADMIN: "/super-admin/dashboard",
} as const;

export const rolePriority = ["SUPER_ADMIN", "BRANCH_ADMIN", "CASHIER", "CUSTOMER"] as const;

