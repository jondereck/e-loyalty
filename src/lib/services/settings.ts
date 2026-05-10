import { z } from "zod";
import packageJson from "../../../package.json";
import type { Prisma } from "@/generated/prisma/client";
import { POINTS_PER_VISIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  currencyOptions,
  dateFormatOptions,
  defaultGeneralSettings,
  timezoneOptions,
  type CurrencyOption,
  type DateFormatOption,
  type TimezoneOption,
} from "@/lib/settings-options";

export const POINTS_PER_VISIT_SETTING_KEY = "points_per_visit";
export const TIERS_SETTING_KEY = "loyalty_tiers";
export const SYSTEM_NAME_SETTING_KEY = "system_name";
export const SUPPORT_EMAIL_SETTING_KEY = "support_email";
export const BUSINESS_TIMEZONE_SETTING_KEY = "business_timezone";
export const DATE_FORMAT_SETTING_KEY = "date_format";
export const CURRENCY_SETTING_KEY = "currency";
export const MAINTENANCE_ENABLED_SETTING_KEY = "maintenance_enabled";
export const MAINTENANCE_MESSAGE_SETTING_KEY = "maintenance_message";
export const UPDATE_LAST_CHECKED_AT_SETTING_KEY = "update_last_checked_at";
export const UPDATE_APP_VERSION_SETTING_KEY = "update_app_version";

const generalSettingsDefaults = {
  ...defaultGeneralSettings,
  updateAppVersion: packageJson.version,
};

export type SettingsReward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  pointsCost: number;
  status: "AVAILABLE" | "DISABLED";
};

export type TierSetting = {
  key: string;
  name: string;
  threshold: number;
  multiplier: number;
};

export type SuperAdminSettingsData = {
  general: GeneralSettingsData;
  pointsPerVisit: number;
  tiers: TierSetting[];
  rewards: SettingsReward[];
};

export const defaultTiers: TierSetting[] = [
  { key: "STARTER", name: "Starter", threshold: 0, multiplier: 1.0 },
  { key: "SILVER", name: "Silver", threshold: 1000, multiplier: 1.1 },
  { key: "GOLD", name: "Gold", threshold: 5000, multiplier: 1.2 },
  { key: "PLATINUM", name: "Platinum", threshold: 10000, multiplier: 1.5 },
];

export type GeneralSettingsData = typeof generalSettingsDefaults;

export type MaintenanceSettingsData = Pick<
  GeneralSettingsData,
  "maintenanceEnabled" | "maintenanceMessage" | "supportEmail" | "systemName"
>;

const rewardSettingsSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Reward name is required.").max(90),
  description: z.string().trim().min(3, "Reward description is required.").max(240),
  pointsRequired: z.coerce.number().int().min(1).max(1_000_000),
  pointsCost: z.coerce.number().int().min(0).max(1_000_000),
  status: z.enum(["AVAILABLE", "DISABLED"]),
});

export const tierSettingsSchema = z.object({
  key: z.string(),
  name: z.string().trim().min(2).max(40),
  threshold: z.coerce.number().int().min(0).max(1_000_000),
  multiplier: z.coerce.number().min(1.0).max(10.0),
});

export const rewardsSettingsSchema = z.object({
  pointsPerVisit: z.coerce.number().int().min(1).max(100_000),
  tiers: z.array(tierSettingsSchema).min(1).max(10),
  rewards: z.array(rewardSettingsSchema).max(50),
}).superRefine((value, ctx) => {
  // Validate tiers thresholds are ascending
  for (let i = 1; i < value.tiers.length; i++) {
    if (value.tiers[i].threshold <= value.tiers[i - 1].threshold) {
      ctx.addIssue({
        code: "custom",
        message: "Tier thresholds must be in ascending order.",
        path: ["tiers", i, "threshold"],
      });
    }
  }

  const names = new Set<string>();
  value.rewards.forEach((reward, index) => {
    const normalized = reward.name.toLowerCase();
    if (names.has(normalized)) {
      ctx.addIssue({
        code: "custom",
        message: "Reward names must be unique.",
        path: ["rewards", index, "name"],
      });
    }
    names.add(normalized);
  });
});

export type RewardsSettingsInput = z.input<typeof rewardsSettingsSchema>;

export const generalSettingsSchema = z.object({
  systemName: z.string().trim().min(2, "System name is required.").max(80),
  supportEmail: z.string().trim().email("Support email must be a valid email address.").max(160),
  businessTimezone: z.enum(timezoneOptions.map((option) => option.value) as [TimezoneOption, ...TimezoneOption[]]),
  dateFormat: z.enum(dateFormatOptions.map((option) => option.value) as [DateFormatOption, ...DateFormatOption[]]),
  currency: z.enum(currencyOptions.map((option) => option.value) as [CurrencyOption, ...CurrencyOption[]]),
  maintenanceEnabled: z.coerce.boolean(),
  maintenanceMessage: z.string().trim().min(8, "Maintenance message is required.").max(240),
});

export type GeneralSettingsInput = z.input<typeof generalSettingsSchema>;

export const maintenanceAccessSchema = z.object({
  path: z.string(),
  roles: z.array(z.string()),
  maintenanceEnabled: z.boolean(),
});

export async function getPointsPerVisit() {
  const setting = await safeSettingsRead(
    () =>
      prisma.systemSetting.findUnique({
        where: { key: POINTS_PER_VISIT_SETTING_KEY },
        select: { value: true },
      }),
    null,
  );

  return readPositiveInt(setting?.value, POINTS_PER_VISIT);
}

export async function getBusinessTimezone() {
  const value = await safeSettingsRead(() => readSetting(BUSINESS_TIMEZONE_SETTING_KEY), null);
  return readEnum(value, timezoneOptions, generalSettingsDefaults.businessTimezone);
}

export async function getBrandingSettings() {
  const general = await getGeneralSettings();
  return {
    systemName: general.systemName,
    supportEmail: general.supportEmail,
  };
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettingsData> {
  const general = await getGeneralSettings();
  return {
    systemName: general.systemName,
    supportEmail: general.supportEmail,
    maintenanceEnabled: general.maintenanceEnabled,
    maintenanceMessage: general.maintenanceMessage,
  };
}

export async function getGeneralSettings(): Promise<GeneralSettingsData> {
  const values = await safeSettingsRead(
    () =>
      readSettings([
        SYSTEM_NAME_SETTING_KEY,
        SUPPORT_EMAIL_SETTING_KEY,
        BUSINESS_TIMEZONE_SETTING_KEY,
        DATE_FORMAT_SETTING_KEY,
        CURRENCY_SETTING_KEY,
        MAINTENANCE_ENABLED_SETTING_KEY,
        MAINTENANCE_MESSAGE_SETTING_KEY,
        UPDATE_LAST_CHECKED_AT_SETTING_KEY,
        UPDATE_APP_VERSION_SETTING_KEY,
      ]),
    new Map<string, unknown>(),
  );

  return {
    systemName: readString(values.get(SYSTEM_NAME_SETTING_KEY), generalSettingsDefaults.systemName),
    supportEmail: readString(values.get(SUPPORT_EMAIL_SETTING_KEY), generalSettingsDefaults.supportEmail),
    businessTimezone: readEnum(values.get(BUSINESS_TIMEZONE_SETTING_KEY), timezoneOptions, generalSettingsDefaults.businessTimezone),
    dateFormat: readEnum(values.get(DATE_FORMAT_SETTING_KEY), dateFormatOptions, generalSettingsDefaults.dateFormat),
    currency: readEnum(values.get(CURRENCY_SETTING_KEY), currencyOptions, generalSettingsDefaults.currency),
    maintenanceEnabled: readBoolean(values.get(MAINTENANCE_ENABLED_SETTING_KEY), generalSettingsDefaults.maintenanceEnabled),
    maintenanceMessage: readString(values.get(MAINTENANCE_MESSAGE_SETTING_KEY), generalSettingsDefaults.maintenanceMessage),
    updateLastCheckedAt: readNullableString(values.get(UPDATE_LAST_CHECKED_AT_SETTING_KEY)),
    updateAppVersion: readString(values.get(UPDATE_APP_VERSION_SETTING_KEY), generalSettingsDefaults.updateAppVersion),
  };
}

export async function getTierSettings(): Promise<TierSetting[]> {
  const setting = await safeSettingsRead(
    () => prisma.systemSetting.findUnique({ where: { key: TIERS_SETTING_KEY } }),
    null
  );

  if (setting && Array.isArray(setting.value)) {
    return setting.value as TierSetting[];
  }

  return defaultTiers;
}

export async function getSuperAdminSettings(): Promise<SuperAdminSettingsData> {
  const [general, pointsPerVisit, tiers, rewards] = await Promise.all([
    getGeneralSettings(),
    getPointsPerVisit(),
    getTierSettings(),
    prisma.rewardMilestone.findMany({
      orderBy: [{ pointsRequired: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        pointsRequired: true,
        pointsCost: true,
        status: true,
      },
    }),
  ]);

  return {
    general,
    pointsPerVisit,
    tiers,
    rewards: rewards.map((reward) => ({
      ...reward,
      status: reward.status === "DISABLED" ? "DISABLED" : "AVAILABLE",
    })),
  };
}

export async function saveGeneralSettings(input: GeneralSettingsInput) {
  const parsed = generalSettingsSchema.parse(input);

  await prisma.$transaction([
    upsertSetting(SYSTEM_NAME_SETTING_KEY, parsed.systemName),
    upsertSetting(SUPPORT_EMAIL_SETTING_KEY, parsed.supportEmail),
    upsertSetting(BUSINESS_TIMEZONE_SETTING_KEY, parsed.businessTimezone),
    upsertSetting(DATE_FORMAT_SETTING_KEY, parsed.dateFormat),
    upsertSetting(CURRENCY_SETTING_KEY, parsed.currency),
    upsertSetting(MAINTENANCE_ENABLED_SETTING_KEY, parsed.maintenanceEnabled),
    upsertSetting(MAINTENANCE_MESSAGE_SETTING_KEY, parsed.maintenanceMessage),
  ]);

  return getSuperAdminSettings();
}

export async function checkForSystemUpdates() {
  await prisma.$transaction([
    upsertSetting(UPDATE_LAST_CHECKED_AT_SETTING_KEY, new Date().toISOString()),
    upsertSetting(UPDATE_APP_VERSION_SETTING_KEY, packageJson.version),
  ]);

  return getSuperAdminSettings();
}

export async function saveRewardsSettings(input: RewardsSettingsInput) {
  const parsed = rewardsSettingsSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.systemSetting.upsert({
      where: { key: POINTS_PER_VISIT_SETTING_KEY },
      update: { value: parsed.pointsPerVisit },
      create: { key: POINTS_PER_VISIT_SETTING_KEY, value: parsed.pointsPerVisit },
    });

    await tx.systemSetting.upsert({
      where: { key: TIERS_SETTING_KEY },
      update: { value: parsed.tiers },
      create: { key: TIERS_SETTING_KEY, value: parsed.tiers },
    });

    const existing = await tx.rewardMilestone.findMany({
      select: { id: true },
    });
    const existingIds = new Set(existing.map((item) => item.id));

    for (const reward of parsed.rewards) {
      const data = {
        name: reward.name,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        pointsCost: reward.pointsCost,
        status: reward.status,
      };

      if (reward.id && existingIds.has(reward.id)) {
        await tx.rewardMilestone.update({
          where: { id: reward.id },
          data,
        });
      } else {
        await tx.rewardMilestone.create({ data });
      }
    }
  });

  return getSuperAdminSettings();
}

export function canAccessDuringMaintenance({
  path,
  roles,
  maintenanceEnabled,
}: z.infer<typeof maintenanceAccessSchema>) {
  if (!maintenanceEnabled) return true;
  if (path === "/maintenance") return true;
  if (path === "/login") return true;
  if (path.startsWith("/auth/")) return true;
  if (path === "/super-admin/settings") return roles.includes("SUPER_ADMIN");
  if (!path) return roles.some((role) => role === "BRANCH_ADMIN" || role === "SUPER_ADMIN");
  if (path.startsWith("/admin") || path.startsWith("/super-admin")) {
    return roles.some((role) => role === "BRANCH_ADMIN" || role === "SUPER_ADMIN");
  }
  return false;
}

function upsertSetting(key: string, value: Prisma.InputJsonValue) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function readSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return setting?.value;
}

async function readSettings(keys: string[]) {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  return new Map(settings.map((setting) => [setting.key, setting.value]));
}

async function safeSettingsRead<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("System settings read failed; using defaults.", error);
    }
    return fallback;
  }
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readEnum<T extends readonly { value: string }[]>(value: unknown, options: T, fallback: T[number]["value"]) {
  return typeof value === "string" && options.some((option) => option.value === value)
    ? (value as T[number]["value"])
    : fallback;
}

function readPositiveInt(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
