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
import {
  createRoleAction,
  disableRoleAction,
  duplicateRoleAction,
  updateRolePermissionsAction,
} from "@/lib/services/roles";
import type { RoleFormInput, RoleUpdateInput } from "@/lib/validations/roles";

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

export async function createRoleSettingsAction(input: RoleFormInput) {
  await requireProfile(["SUPER_ADMIN"]);
  return createRoleAction(input);
}

export async function updateRoleSettingsAction(input: RoleUpdateInput) {
  await requireProfile(["SUPER_ADMIN"]);
  return updateRolePermissionsAction(input);
}

export async function duplicateRoleSettingsAction(roleId: string) {
  await requireProfile(["SUPER_ADMIN"]);
  return duplicateRoleAction({ roleId });
}

export async function disableRoleSettingsAction(roleId: string) {
  await requireProfile(["SUPER_ADMIN"]);
  return disableRoleAction({ roleId });
}

function revalidateSettingsPaths() {
  settingsPaths.forEach((path) => revalidatePath(path));
}
