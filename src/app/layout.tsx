import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import PwaBootstrap from "@/components/PwaBootstrap";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "E-Loyalty",
  description: "Digital loyalty cards, QR earning, approvals, and rewards.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-Loyalty",
  },
};

export const viewport: Viewport = {
  themeColor: "#5d51ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <PwaBootstrap />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
