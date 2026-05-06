"use client";

import { useQRCode } from "next-qrcode";

export function LoyaltyQR({ token }: { token: string }) {
  const { Canvas } = useQRCode();

  return (
    <div className="qr-shell">
      <Canvas
        text={token}
        options={{
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 4,
          width: 210,
          color: {
            dark: "#111111",
            light: "#FFFFFF",
          },
        }}
      />
    </div>
  );
}

