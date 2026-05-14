"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AutoCloseScanResult({ href = "/cashier/scan", seconds = 3 }: { href?: string; seconds?: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      router.replace(href);
    }, seconds * 1000);
    const countdown = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdown);
    };
  }, [href, router, seconds]);

  return (
    <p className="lp-scan-autoclose" aria-live="polite">
      Returning to scanner in {remaining}s
    </p>
  );
}
