"use client";

import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import type { ReactNode, TouchEvent } from "react";
import { useRef, useState, useTransition } from "react";

const TRIGGER_DISTANCE = 78;
const MAX_PULL_DISTANCE = 112;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isRefreshing = isPending;
  const progress = Math.min(1, pullDistance / TRIGGER_DISTANCE);
  const ready = pullDistance >= TRIGGER_DISTANCE;

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (window.scrollY > 0 || isRefreshing) return;
    startY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (startY.current === null || isRefreshing) return;
    const currentY = event.touches[0]?.clientY ?? startY.current;
    const delta = currentY - startY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    if (window.scrollY > 0) {
      startY.current = null;
      setPullDistance(0);
      return;
    }

    event.preventDefault();
    setPullDistance(Math.min(MAX_PULL_DISTANCE, delta * 0.58));
  }

  function handleTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;

    if (pullDistance >= TRIGGER_DISTANCE) {
      setPullDistance(54);
      startTransition(() => {
        router.refresh();
      });
      window.setTimeout(() => setPullDistance(0), 650);
      return;
    }

    setPullDistance(0);
  }

  return (
    <div
      className="lp-pull-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ "--pull-distance": `${isRefreshing ? 54 : pullDistance}px`, "--pull-progress": progress } as React.CSSProperties}
    >
      <div className={ready || isRefreshing ? "lp-pull-indicator ready" : "lp-pull-indicator"} aria-live="polite">
        {isRefreshing ? <Loader2 size={18} /> : <RefreshCw size={18} />}
        <span>{isRefreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}</span>
      </div>
      <div className="lp-pull-content">{children}</div>
    </div>
  );
}
