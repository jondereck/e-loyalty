"use client";

import { useState } from "react";
import { ChevronRight, QrCode } from "lucide-react";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";
import { LoyaltyQR } from "@/components/loyalty/LoyaltyQR";

export function FlippableLoyaltyCard({
  tier,
  color,
  points,
  visits,
  qrToken,
  cardNumber,
  systemName,
  cardVariant = "classic",
}: {
  tier: string;
  color?: string;
  points: number;
  visits: number;
  qrToken: string;
  cardNumber: string;
  systemName?: string;
  cardVariant?: "classic" | "homepage";
}) {
  const [showQr, setShowQr] = useState(false);
  const togglePass = () => setShowQr((value) => !value);

  return (
    <>
      <button
        type="button"
        className={showQr ? "lp-card-flip is-flipped" : "lp-card-flip"}
        aria-label={showQr ? "Hide customer QR" : "Show customer QR"}
        aria-pressed={showQr}
        onClick={togglePass}
      >
        <div className="lp-card-flip-stage">
          <div className="lp-card-flip-inner">
            <div className="lp-card-face lp-card-front" aria-hidden={showQr}>
              <LoyaltyCard
                tier={tier}
                color={color}
                points={points}
                visits={visits}
                systemName={systemName}
                variant={cardVariant}
              />
            </div>
            <div className="lp-card-face lp-card-back" aria-hidden={!showQr}>
              <span className="lp-card-back-title">Customer QR</span>
              <LoyaltyQR token={qrToken} size={116} className="compact" />
              <span className="lp-card-number">Card {cardNumber}</span>
            </div>
          </div>
        </div>
      </button>

  
    </>
  );
}
