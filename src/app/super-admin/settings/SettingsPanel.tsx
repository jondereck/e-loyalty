"use client";

import { useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Database,
  DollarSign,
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
  Star,
  ToggleLeft,
  TrendingUp,
  Trash2,
  UserCog,
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
import type { SettingsReward, SuperAdminSettingsData } from "@/lib/services/settings";

type TabKey = "general" | "rewards" | "system" | "security" | "notifications";
type DraftReward = Omit<SettingsReward, "id"> & {
  id?: string;
  clientKey: string;
};

const tabs: Array<{ key: TabKey; label: string; icon: ComponentType<{ size?: number }> }> = [
  { key: "general", label: "General", icon: Settings },
  { key: "rewards", label: "Points & Rewards", icon: Star },
  { key: "system", label: "System", icon: Server },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsPanel({ initialSettings }: { initialSettings: SuperAdminSettingsData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
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
  const [tiers, setTiers] = useState(initialSettings.tiers);
  const [rewards, setRewards] = useState<DraftReward[]>(() => initialSettings.rewards.map(toDraftReward));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleRewards = useMemo(
    () => rewards.slice().sort((a, b) => a.pointsRequired - b.pointsRequired || a.name.localeCompare(b.name)),
    [rewards],
  );

  function saveSettings() {
    setStatus(null);
    setError(null);
    startTransition(async () => {
      try {
        const saved = activeTab === "rewards"
          ? await saveRewardsSettingsAction({
              pointsPerVisit,
              tiers,
              rewards: rewards.map((reward) => ({
                id: reward.id,
                name: reward.name,
                description: reward.description,
                pointsRequired: reward.pointsRequired,
                pointsCost: reward.pointsCost,
                status: reward.status,
              })),
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
        setStatus("Changes saved.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Settings could not be saved.");
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
    setStatus(null);
    setError(null);
    startTransition(async () => {
      try {
        const saved = await checkForSystemUpdatesAction();
        applySavedSettings(saved);
        setStatus("Update status refreshed.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Update status could not be refreshed.");
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
    setTiers(saved.tiers);
    setRewards(saved.rewards.map(toDraftReward));
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
        <button className="lp-settings-save" type="submit" disabled={isPending}>
          <Save size={18} />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
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

      {status ? <p className="lp-settings-feedback success">{status}</p> : null}
      {error ? <p className="lp-settings-feedback error">{error}</p> : null}

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
          tiers={tiers}
          rewards={visibleRewards}
          onPointsChange={setPointsPerVisit}
          onTiersChange={setTiers}
          onRewardChange={updateReward}
          onAddReward={addReward}
          onRemoveReward={removeOrDisableReward}
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

import type { TierSetting } from "@/lib/services/settings";

function RewardsTab({
  pointsPerVisit,
  tiers,
  rewards,
  onPointsChange,
  onTiersChange,
  onRewardChange,
  onAddReward,
  onRemoveReward,
}: {
  pointsPerVisit: string;
  tiers: TierSetting[];
  rewards: DraftReward[];
  onPointsChange: (value: string) => void;
  onTiersChange: (value: TierSetting[]) => void;
  onRewardChange: (clientKey: string, patch: Partial<DraftReward>) => void;
  onAddReward: () => void;
  onRemoveReward: (clientKey: string) => void;
}) {
  function updateTier(index: number, patch: Partial<TierSetting>) {
    onTiersChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  return (
    <div className="lp-settings-rewards">
      <div className="lp-settings-grid two">
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
          <SettingsCardTitle icon={TrendingUp} title="Loyalty Tiers" />
          <p className="lp-settings-card-copy">Adjust multipliers and thresholds for customer progression.</p>
          <div className="lp-settings-tier-list">
            {tiers.map((tier, index) => (
              <div key={tier.key} className="lp-settings-tier-row">
                <div className="lp-settings-reward-icon">
                  <Star size={16} />
                </div>
                <label className="wide">
                  <span>Tier Name</span>
                  <input value={tier.name} onChange={(e) => updateTier(index, { name: e.target.value })} />
                </label>
                <label>
                  <span>Threshold</span>
                  <input
                    type="number"
                    value={tier.threshold}
                    disabled={index === 0}
                    onChange={(e) => updateTier(index, { threshold: Number(e.target.value) })}
                  />
                </label>
                <label>
                  <span>Multiplier</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={tier.multiplier}
                    onChange={(e) => updateTier(index, { multiplier: Number(e.target.value) })}
                  />
                </label>
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
