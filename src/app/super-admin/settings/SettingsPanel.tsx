"use client";

import { useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Copy,
  Database,
  DollarSign,
  Edit3,
  Gift,
  HardDrive,
  Info,
  Laptop,
  Lock,
  Mail,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  Sparkles,
  Star,
  ToggleLeft,
  Trash2,
  UserCog,
  UsersRound,
  Wrench,
} from "lucide-react";
import {
  checkForSystemUpdatesAction,
  saveGeneralSettingsAction,
  saveRewardsSettingsAction,
} from "@/app/super-admin/settings/actions";
import {
  currencyOptions,
  dateFormatOptions,
  timezoneOptions,
  type CurrencyOption,
  type DateFormatOption,
  type TimezoneOption,
} from "@/lib/settings-options";
import type { SettingsReward, SettingsTier, SuperAdminSettingsData } from "@/lib/services/settings";
import { protectedModuleKeys, type RoleModuleKey } from "@/lib/rbac";
import type { RoleManagementData, RoleManagementItem } from "@/lib/services/roles";

type TabKey = "general" | "rewards" | "roles" | "system" | "security" | "notifications";
type DraftReward = Omit<SettingsReward, "id"> & {
  id?: string;
  clientKey: string;
};
type RoleDraft = {
  roleId?: string;
  protected?: boolean;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  defaultModule: RoleModuleKey;
  modules: RoleModuleKey[];
  originalModules?: RoleModuleKey[];
};
type RoleMutationResult = {
  ok?: boolean;
  message?: string;
  data?: RoleManagementData;
};

const tabs: Array<{ key: TabKey; label: string; icon: ComponentType<{ size?: number }> }> = [
  { key: "general", label: "General", icon: Settings },
  { key: "rewards", label: "Points & Rewards", icon: Star },
  { key: "roles", label: "Roles & Permissions", icon: UsersRound },
  { key: "system", label: "System", icon: Server },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsPanel({
  initialSettings,
  initialRoles,
  initialTab,
}: {
  initialSettings: SuperAdminSettingsData;
  initialRoles: RoleManagementData;
  initialTab?: TabKey;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? "general");
  const [systemName, setSystemName] = useState(initialSettings.general.systemName);
  const [supportEmail, setSupportEmail] = useState(initialSettings.general.supportEmail);
  const [businessTimezone, setBusinessTimezone] = useState<TimezoneOption>(initialSettings.general.businessTimezone);
  const [dateFormat, setDateFormat] = useState<DateFormatOption>(initialSettings.general.dateFormat);
  const [currency, setCurrency] = useState<CurrencyOption>(initialSettings.general.currency);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(initialSettings.general.maintenanceEnabled);
  const [maintenanceMessage, setMaintenanceMessage] = useState(initialSettings.general.maintenanceMessage);
  const [updateLastCheckedAt, setUpdateLastCheckedAt] = useState(initialSettings.general.updateLastCheckedAt);
  const [updateAppVersion, setUpdateAppVersion] = useState(initialSettings.general.updateAppVersion);
  const [pointsPerVisit, setPointsPerVisit] = useState(String(initialSettings.pointsPerVisit));
  const [rewards, setRewards] = useState<DraftReward[]>(() => initialSettings.rewards.map(toDraftReward));
  const [tiers, setTiers] = useState<SettingsTier[]>(initialSettings.tiers);
  const [isPending, startTransition] = useTransition();
  const [isRolePending, startRoleTransition] = useTransition();
  const [roleData, setRoleData] = useState<RoleManagementData>(initialRoles);
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);

  const visibleRewards = useMemo(
    () => rewards.slice().sort((a, b) => a.pointsRequired - b.pointsRequired || a.name.localeCompare(b.name)),
    [rewards],
  );

  function saveSettings() {
    if (activeTab === "roles") return;
    startTransition(async () => {
      try {
        const saved = activeTab === "rewards"
          ? await saveRewardsSettingsAction({
              pointsPerVisit,
              rewards: rewards.map((reward) => ({
                id: reward.id,
                name: reward.name,
                description: reward.description,
                pointsRequired: reward.pointsRequired,
                pointsCost: reward.pointsCost,
                status: reward.status,
              })),
              tiers,
            })
          : await saveGeneralSettingsAction({
              systemName,
              supportEmail,
              businessTimezone,
              dateFormat,
              currency,
              maintenanceEnabled,
              maintenanceMessage,
            });
        applySavedSettings(saved);
        toast.success("Settings saved successfully.");
      } catch (saveError) {
        toast.error(saveError instanceof Error ? saveError.message : "Settings could not be saved.");
      }
    });
  }

  function updateReward(clientKey: string, patch: Partial<DraftReward>) {
    setRewards((current) => current.map((reward) => (reward.clientKey === clientKey ? { ...reward, ...patch } : reward)));
  }

  function addReward() {
    setActiveTab("rewards");
    setRewards((current) => [
      ...current,
      {
        clientKey: createClientKey(),
        name: "New Reward",
        description: "Describe the reward customers can unlock.",
        pointsRequired: 1000,
        pointsCost: 0,
        status: "AVAILABLE",
      },
    ]);
  }

  function removeOrDisableReward(clientKey: string) {
    setRewards((current) =>
      current.flatMap((reward) => {
        if (reward.clientKey !== clientKey) return [reward];
        return reward.id ? [{ ...reward, status: "DISABLED" as const }] : [];
      }),
    );
  }

  function checkForUpdates() {
    startTransition(async () => {
      try {
        const saved = await checkForSystemUpdatesAction();
        applySavedSettings(saved);
        toast.success("Update status refreshed.");
      } catch (updateError) {
        toast.error(updateError instanceof Error ? updateError.message : "Update status could not be refreshed.");
      }
    });
  }

  function openCreateRole() {
    setRoleDraft({
      name: "",
      description: "",
      status: "ACTIVE",
      defaultModule: "SCAN",
      modules: ["SCAN"],
    });
  }

  function openEditRole(role: RoleManagementItem) {
    setRoleDraft({
      roleId: role.id,
      protected: role.protected,
      name: role.name,
      description: role.description,
      status: role.status,
      defaultModule: role.defaultModule,
      modules: role.modules,
      originalModules: role.modules,
    });
  }

  function updateRoleDraft(patch: Partial<RoleDraft>) {
    setRoleDraft((current) => current ? { ...current, ...patch } : current);
  }

  function toggleRoleModule(module: RoleModuleKey) {
    setRoleDraft((current) => {
      if (!current || current.protected) return current;
      const modules = current.modules.includes(module)
        ? current.modules.filter((item) => item !== module)
        : [...current.modules, module];
      const defaultModule = modules.includes(current.defaultModule) ? current.defaultModule : modules[0] ?? current.defaultModule;
      return { ...current, modules, defaultModule };
    });
  }

  function resetRoleDraft() {
    if (!roleDraft?.roleId) {
      openCreateRole();
      return;
    }
    const role = roleData.roles.find((item) => item.id === roleDraft.roleId);
    if (role) openEditRole(role);
  }

  function saveRoleDraft() {
    if (!roleDraft) return;
    if (!roleDraft.modules.length) {
      toast.error("Select at least one module before saving.");
      return;
    }
    const removedImportant = protectedModuleKeys.filter(
      (module) => roleDraft.originalModules?.includes(module) && !roleDraft.modules.includes(module),
    );
    if (removedImportant.length && !window.confirm(`This removes important access: ${removedImportant.map(moduleLabel).join(", ")}. Continue?`)) {
      return;
    }

    startRoleTransition(async () => {
      try {
        const payload = {
          name: roleDraft.name,
          description: roleDraft.description,
          status: roleDraft.status,
          defaultModule: roleDraft.defaultModule,
          modules: roleDraft.modules,
        };
        const result = roleDraft.roleId
          ? await mutateRole({ action: "update", ...payload, roleId: roleDraft.roleId })
          : await mutateRole({ action: "create", ...payload });
        if (result?.ok && result.data) {
          setRoleData(result.data);
          setRoleDraft(null);
          toast.success(result.message ?? "Role saved.");
          return;
        }
        toast.error(result?.message ?? "Role could not be saved.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Role could not be saved.");
      }
    });
  }

  function duplicateRole(roleId: string) {
    startRoleTransition(async () => {
      try {
        const result = await mutateRole({ action: "duplicate", roleId });
        if (result?.ok && result.data) {
          setRoleData(result.data);
          toast.success(result.message ?? "Role duplicated.");
          return;
        }
        toast.error(result?.message ?? "Role could not be duplicated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Role could not be duplicated.");
      }
    });
  }

  function disableRole(role: RoleManagementItem) {
    if (!window.confirm(`Disable ${role.name}? Users assigned to this role will lose its module access.`)) return;
    startRoleTransition(async () => {
      try {
        const result = await mutateRole({ action: "disable", roleId: role.id });
        if (result?.ok && result.data) {
          setRoleData(result.data);
          toast.success(result.message ?? "Role disabled.");
          return;
        }
        toast.error(result?.message ?? "Role could not be disabled.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Role could not be disabled.");
      }
    });
  }

  function applySavedSettings(saved: SuperAdminSettingsData) {
    setSystemName(saved.general.systemName);
    setSupportEmail(saved.general.supportEmail);
    setBusinessTimezone(saved.general.businessTimezone);
    setDateFormat(saved.general.dateFormat);
    setCurrency(saved.general.currency);
    setMaintenanceEnabled(saved.general.maintenanceEnabled);
    setMaintenanceMessage(saved.general.maintenanceMessage);
    setUpdateLastCheckedAt(saved.general.updateLastCheckedAt);
    setUpdateAppVersion(saved.general.updateAppVersion);
    setPointsPerVisit(String(saved.pointsPerVisit));
    setRewards(saved.rewards.map(toDraftReward));
    setTiers(saved.tiers);
  }

  function addTier() {
    setTiers(current => [
      ...current,
      { name: "New Tier", threshold: 0, multiplier: 1.0, color: "#7a50ff" }
    ]);
  }

  function updateTier(index: number, patch: Partial<SettingsTier>) {
    setTiers(current => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function removeTier(index: number) {
    setTiers((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form
      className="lp-settings-page"
      onSubmit={(event) => {
        event.preventDefault();
        saveSettings();
      }}
    >
      <div className="lp-settings-head">
        <div>
          <h1>System Settings</h1>
          <p>Manage global system settings and preferences.</p>
        </div>
        {activeTab === "roles" ? null : (
          <button className="lp-settings-save" type="submit" disabled={isPending}>
            <Save size={18} />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div className="lp-settings-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>


      {activeTab === "general" ? (
        <GeneralTab
          systemName={systemName}
          supportEmail={supportEmail}
          businessTimezone={businessTimezone}
          dateFormat={dateFormat}
          currency={currency}
          maintenanceEnabled={maintenanceEnabled}
          maintenanceMessage={maintenanceMessage}
          updateLastCheckedAt={updateLastCheckedAt}
          updateAppVersion={updateAppVersion}
          isPending={isPending}
          onSystemNameChange={setSystemName}
          onSupportEmailChange={setSupportEmail}
          onBusinessTimezoneChange={setBusinessTimezone}
          onDateFormatChange={setDateFormat}
          onCurrencyChange={setCurrency}
          onMaintenanceEnabledChange={setMaintenanceEnabled}
          onMaintenanceMessageChange={setMaintenanceMessage}
          onCheckForUpdates={checkForUpdates}
        />
      ) : null}
      {activeTab === "rewards" ? (
        <RewardsTab
          pointsPerVisit={pointsPerVisit}
          rewards={visibleRewards}
          tiers={tiers}
          onPointsChange={setPointsPerVisit}
          onRewardChange={updateReward}
          onAddReward={addReward}
          onRemoveReward={removeOrDisableReward}
          onTierChange={updateTier}
          onAddTier={addTier}
          onRemoveTier={removeTier}
        />
      ) : null}
      {activeTab === "roles" ? (
        <RolesTab
          data={roleData}
          draft={roleDraft}
          isPending={isRolePending}
          onCreate={openCreateRole}
          onEdit={openEditRole}
          onDuplicate={duplicateRole}
          onDisable={disableRole}
          onDraftChange={updateRoleDraft}
          onToggleModule={toggleRoleModule}
          onSave={saveRoleDraft}
          onCancel={() => setRoleDraft(null)}
          onReset={resetRoleDraft}
        />
      ) : null}
      {activeTab === "system" ? <SystemTab /> : null}
      {activeTab === "security" ? <SecurityTab /> : null}
      {activeTab === "notifications" ? <NotificationsTab /> : null}
    </form>
  );
}

function GeneralTab({
  systemName,
  supportEmail,
  businessTimezone,
  dateFormat,
  currency,
  maintenanceEnabled,
  maintenanceMessage,
  updateLastCheckedAt,
  updateAppVersion,
  isPending,
  onSystemNameChange,
  onSupportEmailChange,
  onBusinessTimezoneChange,
  onDateFormatChange,
  onCurrencyChange,
  onMaintenanceEnabledChange,
  onMaintenanceMessageChange,
  onCheckForUpdates,
}: {
  systemName: string;
  supportEmail: string;
  businessTimezone: TimezoneOption;
  dateFormat: DateFormatOption;
  currency: CurrencyOption;
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  updateLastCheckedAt: string | null;
  updateAppVersion: string;
  isPending: boolean;
  onSystemNameChange: (value: string) => void;
  onSupportEmailChange: (value: string) => void;
  onBusinessTimezoneChange: (value: TimezoneOption) => void;
  onDateFormatChange: (value: DateFormatOption) => void;
  onCurrencyChange: (value: CurrencyOption) => void;
  onMaintenanceEnabledChange: (value: boolean) => void;
  onMaintenanceMessageChange: (value: string) => void;
  onCheckForUpdates: () => void;
}) {
  return (
    <div className="lp-settings-grid">
      <section className="lp-settings-card lp-settings-card-large">
        <SettingsCardTitle icon={Info} title="System Information" />
        <SettingsInputRow icon={Monitor} label="System Name" hint="The name of your loyalty system">
          <input value={systemName} onChange={(event) => onSystemNameChange(event.target.value)} />
        </SettingsInputRow>
        <SettingsInputRow icon={Mail} label="Support Email" hint="Customer support contact email">
          <input type="email" value={supportEmail} onChange={(event) => onSupportEmailChange(event.target.value)} />
        </SettingsInputRow>
        <SettingsInputRow icon={Calendar} label="Timezone" hint="Default timezone for the system">
          <select value={businessTimezone} onChange={(event) => onBusinessTimezoneChange(event.target.value as TimezoneOption)}>
            {timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </SettingsInputRow>
        <SettingsInputRow icon={Calendar} label="Date Format" hint="Default date format">
          <select value={dateFormat} onChange={(event) => onDateFormatChange(event.target.value as DateFormatOption)}>
            {dateFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </SettingsInputRow>
        <SettingsInputRow icon={DollarSign} label="Currency" hint="Default currency for transactions" last>
          <select value={currency} onChange={(event) => onCurrencyChange(event.target.value as CurrencyOption)}>
            {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </SettingsInputRow>
      </section>

      <section className="lp-settings-card">
        <SettingsCardTitle icon={Wrench} title="Maintenance Mode" />
        <p className="lp-settings-card-copy">Enable maintenance mode to prevent users from accessing the system while you perform updates or maintenance.</p>
        <div className="lp-settings-divider" />
        <div className="lp-settings-switch-row">
          <div>
            <b>Maintenance Mode</b>
            <span>When enabled, only administrators can access the system.</span>
          </div>
          <button
            type="button"
            className={maintenanceEnabled ? "lp-settings-toggle active" : "lp-settings-toggle"}
            aria-pressed={maintenanceEnabled}
            onClick={() => onMaintenanceEnabledChange(!maintenanceEnabled)}
          />
        </div>
        <div className="lp-settings-note">
          <Info size={18} />
          <span>During maintenance mode, this message will be shown to customers and cashiers.</span>
        </div>
        <label className="lp-settings-field">
          <span>Maintenance message</span>
          <textarea value={maintenanceMessage} onChange={(event) => onMaintenanceMessageChange(event.target.value)} rows={4} />
        </label>
      </section>

      <section className="lp-settings-card lp-settings-card-large">
        <SettingsCardTitle icon={RefreshCw} title="System Updates" />
        <p className="lp-settings-card-copy">Keep your system up to date with the latest features and security improvements.</p>
        <div className="lp-settings-update-box">
          <CheckCircle2 size={19} />
          <div>
            <b>Your system is up to date</b>
            <span>Version {updateAppVersion} - Last checked: {formatUpdateCheckedAt(updateLastCheckedAt)}</span>
          </div>
          <button type="button" onClick={onCheckForUpdates} disabled={isPending}>Check for Updates</button>
        </div>
      </section>

      <section className="lp-settings-card">
        <SettingsCardTitle icon={Database} title="Data Management" />
        <p className="lp-settings-card-copy">Manage system data, backups, and cache to ensure optimal performance and security.</p>
        <SettingsActionRow icon={CloudUpload} title="Backup Now" text="Create a full backup of your system data." button="Backup Now" />
        <SettingsActionRow icon={Trash2} title="Clear Cache" text="Clear system cache to improve performance." button="Clear Cache" danger />
        <div className="lp-settings-backup-note">
          <Info size={15} />
          Last backup: June 10, 2024, 9:15 AM
        </div>
      </section>
    </div>
  );
}

function SettingsInputRow({
  icon: Icon,
  label,
  hint,
  last = false,
  children,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  hint: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "lp-settings-info-row lp-settings-edit-row last" : "lp-settings-info-row lp-settings-edit-row"}>
      <span className="lp-settings-soft-icon">
        <Icon size={20} />
      </span>
      <div>
        <b>{label}</b>
        <span>{hint}</span>
      </div>
      <div className="lp-settings-control">{children}</div>
    </div>
  );
}

function RewardsTab({
  pointsPerVisit,
  rewards,
  tiers,
  onPointsChange,
  onRewardChange,
  onAddReward,
  onRemoveReward,
  onTierChange,
  onAddTier,
  onRemoveTier,
}: {
  pointsPerVisit: string;
  rewards: DraftReward[];
  tiers: SettingsTier[];
  onPointsChange: (value: string) => void;
  onRewardChange: (clientKey: string, patch: Partial<DraftReward>) => void;
  onAddReward: () => void;
  onRemoveReward: (clientKey: string) => void;
  onTierChange: (index: number, patch: Partial<SettingsTier>) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
}) {
  return (
    <div className="lp-settings-rewards">
      <div className="lp-settings-grid">
        <section className="lp-settings-card">
          <SettingsCardTitle icon={Star} title="Points Rules" />
          <p className="lp-settings-card-copy">Customize how many points customers earn per approved visit.</p>
          <label className="lp-settings-field">
            <span>Points per approved visit</span>
            <input
              min={1}
              max={100000}
              type="number"
              inputMode="numeric"
              value={pointsPerVisit}
              onChange={(event) => onPointsChange(event.target.value)}
            />
          </label>
          <div className="lp-settings-note compact">
            <Info size={18} />
            <span>This value is used by new auto-approved scans and admin-approved visits.</span>
          </div>
        </section>

        <section className="lp-settings-card">
          <div className="lp-settings-section-head">
            <SettingsCardTitle icon={Sparkles} title="Loyalty Tiers" />
            <button type="button" className="lp-settings-outline-button" onClick={onAddTier}>
              <Plus size={17} />
              Add Tier
            </button>
          </div>
          <p className="lp-settings-card-copy">Define loyalty levels and multipliers based on total points earned.</p>
          <div className="lp-settings-tier-list">
            {tiers.map((tier, index) => (
              <div key={index} className="lp-settings-tier-row">
                <div className="lp-settings-tier-icon" style={{ backgroundColor: tier.color }}>
                  <Star size={18} />
                </div>
                <div className="lp-settings-tier-field">
                  <span>Name</span>
                  <input value={tier.name} onChange={(e) => onTierChange(index, { name: e.target.value })} placeholder="e.g. Gold" />
                </div>
                <div className="lp-settings-tier-field">
                  <span>Threshold</span>
                  <input type="number" min={0} value={tier.threshold} onChange={(e) => onTierChange(index, { threshold: Number(e.target.value) })} />
                </div>
                <div className="lp-settings-tier-field">
                  <span>Multiplier</span>
                  <input type="number" step="0.1" min={1} value={tier.multiplier} onChange={(e) => onTierChange(index, { multiplier: Number(e.target.value) })} />
                </div>
                <div className="lp-settings-tier-field">
                  <span>Color</span>
                  <input type="color" className="lp-settings-tier-color" value={tier.color} onChange={(e) => onTierChange(index, { color: e.target.value })} />
                </div>
                <button type="button" className="lp-settings-tier-delete" onClick={() => onRemoveTier(index)} aria-label="Delete tier">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="lp-settings-card lp-settings-reward-list-card">
        <div className="lp-settings-section-head">
          <SettingsCardTitle icon={Gift} title="Reward Milestones" />
          <button type="button" className="lp-settings-outline-button" onClick={onAddReward}>
            <Plus size={17} />
            Add Reward
          </button>
        </div>
        <div className="lp-settings-reward-list">
          {rewards.map((reward) => (
            <div className={reward.status === "DISABLED" ? "lp-settings-reward-row disabled" : "lp-settings-reward-row"} key={reward.clientKey}>
              <div className="lp-settings-reward-icon">
                <Gift size={19} />
              </div>
              <label>
                <span>Name</span>
                <input value={reward.name} onChange={(event) => onRewardChange(reward.clientKey, { name: event.target.value })} />
              </label>
              <label className="wide">
                <span>Description</span>
                <input value={reward.description} onChange={(event) => onRewardChange(reward.clientKey, { description: event.target.value })} />
              </label>
              <label>
                <span>Required</span>
                <input
                  min={1}
                  type="number"
                  value={reward.pointsRequired}
                  onChange={(event) => onRewardChange(reward.clientKey, { pointsRequired: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>Cost</span>
                <input
                  min={0}
                  type="number"
                  value={reward.pointsCost}
                  onChange={(event) => onRewardChange(reward.clientKey, { pointsCost: Number(event.target.value) })}
                />
              </label>
              <button
                type="button"
                className={reward.status === "AVAILABLE" ? "lp-settings-status-toggle active" : "lp-settings-status-toggle"}
                onClick={() => onRewardChange(reward.clientKey, { status: reward.status === "AVAILABLE" ? "DISABLED" : "AVAILABLE" })}
              >
                {reward.status === "AVAILABLE" ? "Active" : "Disabled"}
              </button>
              <button type="button" className="lp-settings-icon-button danger" onClick={() => onRemoveReward(reward.clientKey)} aria-label="Disable reward">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RolesTab({
  data,
  draft,
  isPending,
  onCreate,
  onEdit,
  onDuplicate,
  onDisable,
  onDraftChange,
  onToggleModule,
  onSave,
  onCancel,
  onReset,
}: {
  data: RoleManagementData;
  draft: RoleDraft | null;
  isPending: boolean;
  onCreate: () => void;
  onEdit: (role: RoleManagementItem) => void;
  onDuplicate: (roleId: string) => void;
  onDisable: (role: RoleManagementItem) => void;
  onDraftChange: (patch: Partial<RoleDraft>) => void;
  onToggleModule: (module: RoleModuleKey) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const customRoles = data.roles.filter((role) => !role.protected);
  const enabledDraftModules = draft?.modules ?? [];

  return (
    <div className="lp-settings-roles">
      <section className="lp-settings-card lp-settings-card-large lp-role-hero-card">
        <div>
          <SettingsCardTitle icon={UsersRound} title="Roles & Permissions" />
          <p className="lp-settings-card-copy">Manage custom roles, module visibility, and access permissions.</p>
        </div>
        <button type="button" className="lp-settings-save" onClick={onCreate} disabled={isPending}>
          <Plus size={18} />
          Create Role
        </button>
      </section>

      {draft ? (
        <section className="lp-settings-card lp-role-editor">
          <div className="lp-settings-section-head">
            <SettingsCardTitle icon={UserCog} title={draft.roleId ? "Edit Permissions" : "Create Role"} />
            {draft.protected ? <span className="lp-role-lock">Protected system role</span> : null}
          </div>
          <div className="lp-role-form-grid">
            <label className="lp-settings-field">
              <span>Role name</span>
              <input value={draft.name} onChange={(event) => onDraftChange({ name: event.target.value })} disabled={draft.protected || isPending} />
            </label>
            <label className="lp-settings-field">
              <span>Status</span>
              <select value={draft.status} onChange={(event) => onDraftChange({ status: event.target.value as RoleDraft["status"] })} disabled={draft.protected || isPending}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label className="lp-settings-field wide">
              <span>Description</span>
              <textarea value={draft.description} rows={3} onChange={(event) => onDraftChange({ description: event.target.value })} disabled={isPending} />
            </label>
            <label className="lp-settings-field">
              <span>Default landing page</span>
              <select
                value={draft.defaultModule}
                onChange={(event) => onDraftChange({ defaultModule: event.target.value as RoleModuleKey })}
                disabled={!enabledDraftModules.length || isPending}
              >
                {enabledDraftModules.map((module) => (
                  <option key={module} value={module}>{moduleLabel(module)}</option>
                ))}
              </select>
            </label>
          </div>

          {!enabledDraftModules.length ? (
            <div className="lp-settings-note warning">
              <Info size={18} />
              <span>This role has no enabled modules. Users assigned to it will be redirected away from staff/admin pages.</span>
            </div>
          ) : null}

          <div className="lp-role-permission-grid">
            {permissionCategories(data.modules).map(([category, modules]) => (
              <div className="lp-role-permission-group" key={category}>
                <h3>{category}</h3>
                {modules.map((module) => {
                  const checked = enabledDraftModules.includes(module.key);
                  return (
                    <button
                      key={module.key}
                      type="button"
                      className={checked ? "lp-role-module active" : "lp-role-module"}
                      aria-pressed={checked}
                      disabled={draft.protected || isPending}
                      onClick={() => onToggleModule(module.key)}
                    >
                      <i aria-hidden="true">{checked ? <CheckCircle2 size={15} /> : null}</i>
                      <span>
                        <b>{module.label}</b>
                        <small>{module.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="lp-role-editor-actions">
            <button type="button" className="lp-settings-outline-button" onClick={onReset} disabled={isPending}>Reset</button>
            <button type="button" className="lp-settings-outline-button" onClick={onCancel} disabled={isPending}>Cancel</button>
            <button type="button" className="lp-settings-save" onClick={onSave} disabled={isPending || !enabledDraftModules.length}>
              <Save size={17} />
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="lp-settings-card lp-role-list-card">
        <div className="lp-settings-section-head">
          <SettingsCardTitle icon={Shield} title="Role List" />
          <span className="lp-role-count">{data.roles.length} roles</span>
        </div>
        {!customRoles.length ? (
          <div className="lp-role-empty">
            <CheckCircle2 size={22} />
            <b>No custom roles yet</b>
            <span>Protected system roles are ready. Create a custom staff/admin role when you need different access.</span>
          </div>
        ) : null}
        <div className="lp-role-table-wrap">
          <table className="lp-role-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Default page</th>
                <th>Modules</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="lp-role-name-cell">
                      <b>{role.name}</b>
                      <span>{role.description}</span>
                    </div>
                  </td>
                  <td><span className={role.status === "ACTIVE" ? "lp-role-status active" : "lp-role-status"}>{role.status === "ACTIVE" ? "Active" : "Inactive"}</span></td>
                  <td>{moduleLabel(role.defaultModule)}</td>
                  <td>{role.enabledModulesCount}</td>
                  <td>{role.assignedUsersCount}</td>
                  <td>
                    <div className="lp-role-actions">
                      <button type="button" onClick={() => onEdit(role)} disabled={isPending}>
                        <Edit3 size={15} />
                        Edit Permissions
                      </button>
                      <button type="button" onClick={() => onDuplicate(role.id)} disabled={isPending}>
                        <Copy size={15} />
                        Duplicate
                      </button>
                      <button type="button" className="danger" onClick={() => onDisable(role)} disabled={isPending || role.protected || role.status === "INACTIVE"}>
                        <Trash2 size={15} />
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function permissionCategories(modules: RoleManagementData["modules"]) {
  const map = new Map<string, RoleManagementData["modules"]>();
  modules.forEach((module) => {
    map.set(module.category, [...(map.get(module.category) ?? []), module]);
  });
  return Array.from(map.entries());
}

async function mutateRole(payload: Record<string, unknown>): Promise<RoleMutationResult> {
  const response = await fetch("/api/super-admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null) as RoleMutationResult | null;
  if (!response.ok) {
    throw new Error(result?.message ?? "Role request failed.");
  }
  return result ?? { ok: false, message: "Role request failed." };
}

function moduleLabel(module: RoleModuleKey) {
  return module.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SystemTab() {
  return (
    <div className="lp-settings-grid two">
      <PlaceholderCard icon={Server} title="System Services" copy="Service controls mirror the final settings layout for system operations.">
        <SettingsActionRow icon={HardDrive} title="Storage Health" text="Monitor local and cloud storage usage." button="View Details" />
        <SettingsActionRow icon={RefreshCw} title="Background Jobs" text="Review scheduled maintenance and sync jobs." button="Review Jobs" />
      </PlaceholderCard>
      <PlaceholderCard icon={Laptop} title="Runtime Preferences" copy="Default runtime options for admin tools and dashboards.">
        <SettingsInfoRow icon={ToggleLeft} label="Auto Refresh" hint="Refresh dashboard metrics automatically" value="Enabled" dropdown />
        <SettingsInfoRow icon={Database} label="Cache Strategy" hint="How system data is cached" value="Balanced" dropdown last />
      </PlaceholderCard>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="lp-settings-grid two">
      <PlaceholderCard icon={Shield} title="Access Controls" copy="Security controls are prepared for the next implementation pass.">
        <SettingsActionRow icon={Lock} title="Password Policy" text="Require strong passwords for staff accounts." button="Configure" />
        <SettingsActionRow icon={UserCog} title="Session Rules" text="Manage admin session duration and device limits." button="Configure" />
      </PlaceholderCard>
      <PlaceholderCard icon={Info} title="Audit & Review" copy="Audit review preferences for sensitive system changes.">
        <SettingsInfoRow icon={Shield} label="Audit Logging" hint="Record privileged admin actions" value="Enabled" dropdown />
        <SettingsInfoRow icon={Mail} label="Security Contact" hint="Where security alerts are sent" value="security@loyaltypass.com" last />
      </PlaceholderCard>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="lp-settings-grid two">
      <PlaceholderCard icon={Bell} title="Notification Channels" copy="Notification settings are UI-ready and can be wired to delivery services later.">
        <SettingsInfoRow icon={Mail} label="Email Alerts" hint="Send important system notices by email" value="Enabled" dropdown />
        <SettingsInfoRow icon={Bell} label="Admin Alerts" hint="Notify admins about pending reviews" value="Enabled" dropdown last />
      </PlaceholderCard>
      <PlaceholderCard icon={Calendar} title="Notification Schedule" copy="Choose when operational summaries and reminders should be sent.">
        <SettingsActionRow icon={Calendar} title="Daily Summary" text="Send daily performance summaries at 9:00 AM." button="Edit" />
        <SettingsActionRow icon={Info} title="Pending Reviews" text="Remind admins when scans need review." button="Edit" />
      </PlaceholderCard>
    </div>
  );
}

function PlaceholderCard({
  icon,
  title,
  copy,
  children,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className="lp-settings-card">
      <SettingsCardTitle icon={icon} title={title} />
      <p className="lp-settings-card-copy">{copy}</p>
      {children}
    </section>
  );
}

function SettingsCardTitle({ icon: Icon, title }: { icon: ComponentType<{ size?: number }>; title: string }) {
  return (
    <h2 className="lp-settings-card-title">
      <span>
        <Icon size={22} />
      </span>
      {title}
    </h2>
  );
}

function SettingsInfoRow({
  icon: Icon,
  label,
  hint,
  value,
  dropdown = false,
  last = false,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  hint: string;
  value: string;
  dropdown?: boolean;
  last?: boolean;
}) {
  return (
    <div className={last ? "lp-settings-info-row last" : "lp-settings-info-row"}>
      <span className="lp-settings-soft-icon">
        <Icon size={20} />
      </span>
      <div>
        <b>{label}</b>
        <span>{hint}</span>
      </div>
      <strong>
        {value}
        {dropdown ? <ChevronDown size={16} /> : null}
      </strong>
    </div>
  );
}

function SettingsActionRow({
  icon: Icon,
  title,
  text,
  button,
  danger = false,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  text: string;
  button: string;
  danger?: boolean;
}) {
  return (
    <div className="lp-settings-action-row">
      <span className={danger ? "lp-settings-soft-icon danger" : "lp-settings-soft-icon"}>
        <Icon size={21} />
      </span>
      <div>
        <b>{title}</b>
        <span>{text}</span>
      </div>
      <button type="button" className={danger ? "danger" : ""}>
        {button}
      </button>
    </div>
  );
}

function toDraftReward(reward: SettingsReward): DraftReward {
  return {
    ...reward,
    clientKey: reward.id,
  };
}

function createClientKey() {
  return globalThis.crypto?.randomUUID?.() ?? `reward-${Date.now()}`;
}

function formatUpdateCheckedAt(value: string | null) {
  if (!value) return "Not checked yet";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
