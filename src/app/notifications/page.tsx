import { CustomerShell } from "@/components/customer/CustomerShell";
import { getCurrentProfile } from "@/lib/services/session";
import { getNotifications, markAllAsRead } from "@/lib/services/notifications";
import { Bell, Info, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotifications(profile.id, 50);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case "WARNING":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <CustomerShell active="notifications" eyebrow="Updates & Alerts" title="Inbox">
      <div className="customer-page-grid customer-page-grid-main">
        <section className="customer-primary-stack">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
            <form action={async () => {
                "use server";
                await markAllAsRead(profile.id);
            }}>
                <button type="submit" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Mark all as read
                </button>
            </form>
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group rounded-2xl border p-4 transition-all hover:border-indigo-200 hover:shadow-sm ${
                    !notification.isRead ? "bg-indigo-50/30 border-indigo-100" : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        !notification.isRead ? "bg-indigo-100" : "bg-slate-100"
                    }`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-bold truncate ${
                            !notification.isRead ? "text-slate-900" : "text-slate-700"
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          View Details
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                    {!notification.isRead && (
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-[240px]">
                  You don't have any notifications at the moment.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
