import { Bell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { FlippableLoyaltyCard } from "@/components/loyalty/FlippableLoyaltyCard";
import { BUSINESS_TIMEZONE } from "@/lib/constants";
import { getCustomerCard } from "@/lib/services/customer";
import { getUnreadCount } from "@/lib/services/notifications";
import { getBrandingSettings, getTierSettings } from "@/lib/services/settings";
import { requireProfile } from "@/lib/services/session";
import { getEffectiveTierPoints, getTierDetails } from "@/lib/tiers";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const [data, branding, tiers, unreadCount] = await Promise.all([
    getCustomerCard(profile.id),
    getBrandingSettings(),
    getTierSettings(),
    getUnreadCount(profile.id),
  ]);

  const tierProgressPoints = getEffectiveTierPoints(data.card.totalEarned, data.card.pointsBalance);
  const tier = getTierDetails(tierProgressPoints, tiers);
  const progressTarget = data.nextReward?.pointsRequired ?? Math.max(data.card.pointsBalance, 1000);
  const progress = Math.min(100, Math.round((data.card.pointsBalance / progressTarget) * 100));
  const firstName = data.profile.fullName.split(" ")[0] ?? data.profile.fullName;
  const { greeting, emoji } = getGreeting();

  return (
    <CustomerShell active="card" eyebrow="Customer Card" title={data.profile.fullName}>
      <div className="lp-mobile-topbar">
        <div className="lp-greeting">
          {greeting}, {emoji}
          <br />
          <b>{firstName}</b>
        </div>
        <Link href="/notifications" className="lp-notification-wrapper" aria-label="Open notifications">
          <Bell size={20} />
          {unreadCount > 0 ? <div className="lp-notification-dot" /> : null}
        </Link>
      </div>

      <div style={{ position: "relative", marginBottom: "24px" }}>
        <FlippableLoyaltyCard
          tier={tier.tier}
          color={tier.color}
          points={data.card.pointsBalance}
          visits={data.card.visitsEarned}
          qrToken={data.card.qrToken}
          cardNumber={data.card.cardNumber}
          systemName={branding.systemName}
          cardVariant="homepage"
        />
        <div className="lp-card-hint">Tap card to show QR code</div>
      </div>

      <div className="lp-mini-card">
        <div className="lp-mini-head">
          <div>
            <b>Tier Progress</b>
            <span>{tier.nextTier ? `${compactNumber(tier.pointsToNext)} pts to ${tier.nextTier}` : "Highest tier reached"}</span>
          </div>
          <span className="lp-pill green"><TrendingUp size={12} /> {tier.multiplier}x Multiplier</span>
        </div>
        <strong>{tier.tier} Tier</strong>
        <div className="lp-progress"><i style={{ width: `${tier.progressPercentage}%` }} /></div>
      </div>

      <div className="lp-mini-card">
        <div className="lp-mini-head">
          <div>
            <b>Next Reward</b>
            <span>{data.nextReward ? `${Math.max(0, data.nextReward.pointsRequired - data.card.pointsBalance)} pts to unlock` : "All rewards unlocked"}</span>
          </div>
          <span className="lp-pill">{data.nextReward?.pointsRequired ? `${compactNumber(data.nextReward.pointsRequired)} pts` : "Ready"}</span>
        </div>
        <strong>{data.nextReward?.name ?? "Reward ready"}</strong>
        <div className="lp-progress"><i style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="lp-status-grid">
        <div className="lp-mini-card">
          <b>{data.todayEligibility}</b>
          <span>{data.nextEligibleAt ? `Next eligible: ${formatDateTime(data.nextEligibleAt)}` : "Ready to earn today."}</span>
        </div>
        <div className="lp-mini-card">
          <b>Last visit</b>
          <span>{data.lastVisit ? `${data.lastVisit.branch.name} - ${formatDateTime(data.lastVisit.scannedAt)}` : "No approved visits yet."}</span>
        </div>
      </div>
    </CustomerShell>
  );
}

function getGreeting() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: BUSINESS_TIMEZONE,
  });
  const hour = parseInt(formatter.format(new Date()), 10);

  if (hour >= 12 && hour < 18) {
    return { greeting: "Good afternoon", emoji: "\uD83C\uDF07" };
  }

  if (hour >= 18 || hour < 5) {
    return { greeting: "Good evening", emoji: "\uD83C\uDF19" };
  }

  return { greeting: "Good morning", emoji: "\u2600\uFE0F" };
}
