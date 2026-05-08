"use server";

import { revalidatePath } from "next/cache";
import {
  checkForSystemUpdates,
  saveGeneralSettings,
  saveRewardsSettings,
  type GeneralSettingsInput,
  type RewardsSettingsInput,
} from "@/lib/services/settings";
import { requireProfile } from "@/lib/services/session";

const settingsPaths = [
  "/",
  "/login",
  "/signup",
  "/maintenance",
  "/super-admin/settings",
  "/rewards",
  "/card",
  "/history",
  "/cashier/scan",
  "/admin/dashboard",
  "/admin/approvals",
] as const;

export async function saveGeneralSettingsAction(input: GeneralSettingsInput) {
  await requireProfile(["SUPER_ADMIN"]);
  const settings = await saveGeneralSettings(input);
  revalidateSettingsPaths();
  return settings;
}

export async function checkForSystemUpdatesAction() {
  await requireProfile(["SUPER_ADMIN"]);
  const settings = await checkForSystemUpdates();
  revalidateSettingsPaths();
  return settings;
}

export async function saveRewardsSettingsAction(input: RewardsSettingsInput) {
  await requireProfile(["SUPER_ADMIN"]);
  const settings = await saveRewardsSettings(input);
  revalidateSettingsPaths();
  return settings;
}

function revalidateSettingsPaths() {
  settingsPaths.forEach((path) => revalidatePath(path));
}
