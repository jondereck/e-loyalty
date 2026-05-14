import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-Loyalty",
    short_name: "E-Loyalty",
    description: "Digital loyalty cards, QR earning, approvals, and rewards.",
    start_url: "/card",
    scope: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#5d51ff",
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
