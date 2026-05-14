"use client";

import { useEffect } from "react";

const SW_PATH = "/my-nextjs-pwa-cache-v3.js";

export default function PwaBootstrap() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register(SW_PATH).catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  }, []);

  return null;
}
