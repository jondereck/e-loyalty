"use client";

import { cn } from "@/lib/utils";
import { useQRCode } from "next-qrcode";

export function LoyaltyQR({
  token,
  size = 210,
  className,
}: {
  token: string;
  size?: number;
  className?: string;
}) {
  const { Canvas } = useQRCode();

  return (
    <div className={cn("qr-shell", className)}>
      <Canvas
        text={token}
        options={{
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 4,
          width: size,
          color: {
            dark: "#111111",
            light: "#FFFFFF",
          },
        }}
      />
    </div>
  );
}

