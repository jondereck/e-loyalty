import { AdminSkeletonShell } from "@/components/admin/AdminSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { resolveProfileModules } from "@/lib/rbac";
import { getCurrentProfile } from "@/lib/services/session";

export default async function Loading() {
  const profile = await getCurrentProfile();
  const enabledModules = resolveProfileModules(profile);

  return (
    <AdminSkeletonShell
      active="/cashier/scan"
      heading="Loyalty Pass"
      showSuperAdmin={Boolean(profile?.roles.includes("SUPER_ADMIN"))}
      enabledModules={enabledModules}
    >
      <section className="lp-scan-result-page">
        <div className="lp-scan-result-panel lp-scan-result-skeleton">
          <div className="lp-mobile-topbar">
            <Skeleton className="lp-skeleton-line medium" />
            <Skeleton className="lp-skeleton-icon-button" />
          </div>
          <Skeleton className="lp-skeleton-autoclose" />
          <Skeleton className="lp-skeleton-result-orb" />
          <Skeleton className="lp-skeleton-line title centered" />
          <Skeleton className="lp-skeleton-line medium centered" />
          <Skeleton className="lp-skeleton-line small centered" />

          <div className="lp-skeleton-scan-result-card">
            <div className="lp-scan-branch">
              <Skeleton className="lp-skeleton-soft-icon" />
              <div>
                <Skeleton className="lp-skeleton-review-label" style={{ width: 150 }} />
                <Skeleton className="lp-skeleton-review-value" style={{ width: 118, marginTop: 8 }} />
              </div>
            </div>
            <Skeleton className="lp-skeleton-line small centered" />
            <Skeleton className="lp-skeleton-line title centered" />
          </div>

          <Skeleton className="lp-skeleton-line small" />
          <div className="lp-skeleton-scan-detail-row">
            <Skeleton className="lp-skeleton-soft-icon" />
            <div>
              <Skeleton className="lp-skeleton-review-label" style={{ width: 180 }} />
              <Skeleton className="lp-skeleton-review-value" style={{ width: 220, marginTop: 8 }} />
            </div>
          </div>

          <Skeleton className="lp-skeleton-button" />
          <Skeleton className="lp-skeleton-button muted" />
        </div>
      </section>
    </AdminSkeletonShell>
  );
}
