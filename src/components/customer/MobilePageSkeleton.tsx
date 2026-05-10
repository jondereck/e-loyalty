import { Skeleton } from "@/components/ui/Skeleton";

type MobileSkeletonVariant = "card" | "rewards" | "history" | "profile" | "scan-result";

export function MobilePageSkeleton({
  variant = "card",
  withCard,
  withTabbar = true,
}: {
  variant?: MobileSkeletonVariant;
  withCard?: boolean;
  withTabbar?: boolean;
}) {
  const resolvedVariant = withCard ? "card" : variant;

  return (
    <main className="lp-mobile-shell" aria-label="Loading content">
      <div className="lp-mobile-content">
        {resolvedVariant === "card" ? <CardSkeleton /> : null}
        {resolvedVariant === "rewards" ? <RewardsSkeleton /> : null}
        {resolvedVariant === "history" ? <HistorySkeleton /> : null}
        {resolvedVariant === "profile" ? <ProfileSkeleton /> : null}
        {resolvedVariant === "scan-result" ? <ScanResultSkeleton /> : null}
      </div>
      {withTabbar ? (
        <div className="lp-mobile-tabbar lp-skeleton-tabbar" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="lp-skeleton-tab" key={index}>
              <Skeleton className="lp-skeleton-tab-icon" />
              <Skeleton className="lp-skeleton-tab-label" />
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function TopbarSkeleton({ greeting = false }: { greeting?: boolean }) {
  return (
    <div className="lp-mobile-topbar">
      <div className="lp-skeleton-copy">
        <Skeleton className={greeting ? "lp-skeleton-line medium" : "lp-skeleton-line title"} />
        {greeting ? <Skeleton className="lp-skeleton-line short" /> : null}
      </div>
      <Skeleton className="lp-skeleton-icon" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <>
      <TopbarSkeleton greeting />
      <div className="lp-skeleton-loyalty-card">
        <Skeleton className="lp-skeleton-pill" />
        <Skeleton className="lp-skeleton-card-heading" />
        <div className="lp-skeleton-stats">
          <div>
            <Skeleton className="lp-skeleton-stat-number" />
            <Skeleton className="lp-skeleton-stat-label" />
          </div>
          <div>
            <Skeleton className="lp-skeleton-stat-number" />
            <Skeleton className="lp-skeleton-stat-label" />
          </div>
        </div>
      </div>
      <GlassRowSkeleton />
      <MiniCardSkeleton />
      <div className="lp-skeleton-grid">
        <MiniCardSkeleton compact />
        <MiniCardSkeleton compact />
      </div>
    </>
  );
}

function RewardsSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <div className="lp-skeleton-points-card">
        <div className="lp-skeleton-copy">
          <Skeleton className="lp-skeleton-line tiny" />
          <Skeleton className="lp-skeleton-line title" />
        </div>
        <Skeleton className="lp-skeleton-icon" />
      </div>
      <SegmentSkeleton />
      <div className="lp-reward-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <RewardRowSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

function HistorySkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <SegmentSkeleton three />
      <Skeleton className="lp-skeleton-line small" />
      <div className="lp-history-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <HistoryRowSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <div className="lp-skeleton-profile-card">
        <Skeleton className="lp-skeleton-avatar" />
        <Skeleton className="lp-skeleton-line title centered" />
        <Skeleton className="lp-skeleton-line small centered" />
      </div>
      <div className="lp-skeleton-detail-card">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="lp-skeleton-detail-row" key={index}>
            <Skeleton className="lp-skeleton-line small" />
            <Skeleton className="lp-skeleton-line medium" />
          </div>
        ))}
      </div>
      <GlassRowSkeleton />
    </>
  );
}

function ScanResultSkeleton() {
  return (
    <>
      <TopbarSkeleton />
      <div className="lp-skeleton-scan-card">
        <Skeleton className="lp-skeleton-result-orb" />
        <Skeleton className="lp-skeleton-line title centered" />
        <Skeleton className="lp-skeleton-line wide centered" />
        <Skeleton className="lp-skeleton-line medium centered" />
      </div>
      <Skeleton className="lp-skeleton-button" />
      <Skeleton className="lp-skeleton-button muted" />
    </>
  );
}

function GlassRowSkeleton() {
  return (
    <div className="lp-skeleton-glass-row">
      <Skeleton className="lp-skeleton-soft-icon" />
      <div className="lp-skeleton-copy grow">
        <Skeleton className="lp-skeleton-line medium" />
        <Skeleton className="lp-skeleton-line small" />
      </div>
      <Skeleton className="lp-skeleton-chevron" />
    </div>
  );
}

function MiniCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "lp-skeleton-mini-card compact" : "lp-skeleton-mini-card"}>
      <Skeleton className="lp-skeleton-line medium" />
      <Skeleton className="lp-skeleton-line small" />
      {!compact ? <Skeleton className="lp-skeleton-progress" /> : null}
    </div>
  );
}

function SegmentSkeleton({ three = false }: { three?: boolean }) {
  return (
    <div className={three ? "lp-skeleton-segment three" : "lp-skeleton-segment"}>
      {Array.from({ length: three ? 3 : 2 }).map((_, index) => (
        <Skeleton className="lp-skeleton-segment-item" key={index} />
      ))}
    </div>
  );
}

function RewardRowSkeleton() {
  return (
    <div className="lp-skeleton-reward-row">
      <Skeleton className="lp-skeleton-soft-icon" />
      <div className="lp-skeleton-copy grow">
        <Skeleton className="lp-skeleton-line medium" />
        <Skeleton className="lp-skeleton-line wide" />
        <Skeleton className="lp-skeleton-line small" />
      </div>
      <Skeleton className="lp-skeleton-ring" />
    </div>
  );
}

function HistoryRowSkeleton() {
  return (
    <div className="lp-skeleton-history-row">
      <Skeleton className="lp-skeleton-dot" />
      <div className="lp-skeleton-copy grow">
        <Skeleton className="lp-skeleton-line small" />
        <Skeleton className="lp-skeleton-line medium" />
      </div>
      <div className="lp-skeleton-copy align-end">
        <Skeleton className="lp-skeleton-line tiny" />
        <Skeleton className="lp-skeleton-line small" />
      </div>
    </div>
  );
}
