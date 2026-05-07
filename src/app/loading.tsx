import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container section">
      <Skeleton className="skeleton-hero" />
      <div className="grid three" style={{ marginTop: 18 }}>
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
      </div>
    </main>
  );
}
