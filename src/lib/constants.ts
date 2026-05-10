export const BUSINESS_TIMEZONE = "Asia/Manila";
export const POINTS_PER_VISIT = 100;

export const roleRedirects = {
  CUSTOMER: "/card",
  CASHIER: "/cashier/scan",
  BRANCH_ADMIN: "/admin/approvals",
  SUPER_ADMIN: "/admin/dashboard",
} as const;

export const rolePriority = ["SUPER_ADMIN", "BRANCH_ADMIN", "CASHIER", "CUSTOMER"] as const;

export const TIER_THRESHOLDS = {
  STARTER: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000,
} as const;

export const TIER_MULTIPLIERS = {
  STARTER: 1.0,
  SILVER: 1.1,
  GOLD: 1.2,
  PLATINUM: 1.5,
} as const;

export type TierName = keyof typeof TIER_THRESHOLDS;
