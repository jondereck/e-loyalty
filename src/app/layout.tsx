import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "E-Loyalty",
  description: "Digital loyalty cards, QR earning, approvals, and rewards.",
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
