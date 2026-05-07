import { Filter } from "lucide-react";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { getCustomerHistory } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { visits, redemptions } = await getCustomerHistory(profile.id);
  const events = [
    ...visits.map((visit) => ({
      id: `visit-${visit.id}`,
      date: visit.scannedAt,
      title: visit.branch?.name ?? "Unknown branch",
      points: visit.pointsAwarded,
      type: "earned" as const,
      status: visit.status,
    })),
    ...redemptions.map((redemption) => ({
      id: `redemption-${redemption.id}`,
      date: redemption.createdAt,
      title: redemption.branch?.name ?? redemption.milestone.name,
      points: -Math.max(redemption.milestone.pointsCost, redemption.milestone.pointsRequired),
      type: "redeemed" as const,
      status: redemption.status,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <CustomerShell active="history" eyebrow="Customer" title="Visit history">
      <div className="lp-mobile-topbar">
        <h2>Visit History</h2>
        <Filter size={20} />
      </div>
      <div className="lp-segment three">
        <span className="on">All</span>
        <span>Earned</span>
        <span>Redeemed</span>
      </div>
      <p className="lp-history-month">Recent activity</p>
      <div className="lp-history-list">
        {events.map((event) => (
          <div className="lp-history-row" key={event.id}>
            <span className={event.type === "redeemed" ? "lp-dot purple" : "lp-dot"} />
            <div>
              <small>{formatDateTime(event.date)}</small>
              <b>{event.title}</b>
            </div>
            <div className="lp-points">
              {event.points >= 0 ? "+" : "-"}{compactNumber(Math.abs(event.points))} pts
              <span className={event.type === "redeemed" ? "redeemed" : "earned"}>
                {event.type === "redeemed" ? "Redeemed" : event.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        ))}
        {!events.length ? <div className="lp-mini-card">No visits or redemptions yet.</div> : null}
      </div>
    </CustomerShell>
  );
}
