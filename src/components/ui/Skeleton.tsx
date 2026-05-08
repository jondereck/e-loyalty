import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      <div className="skeleton skeleton-title" />
      <div className="list">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="skeleton skeleton-row" key={index} />
        ))}
      </div>
    </div>
  );
}
