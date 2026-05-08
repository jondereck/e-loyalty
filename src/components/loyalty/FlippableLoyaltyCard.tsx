"use client";

import { useState } from "react";
import { ChevronRight, QrCode } from "lucide-react";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";
import { LoyaltyQR } from "@/components/loyalty/LoyaltyQR";

export function FlippableLoyaltyCard({
  tier,
  points,
  visits,
  qrToken,
  cardNumber,
  systemName,
}: {
  tier: string;
  points: number;
  visits: number;
  qrToken: string;
  cardNumber: string;
  systemName?: string;
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
              <LoyaltyCard tier={tier} points={points} visits={visits} systemName={systemName} />
            </div>
            <div className="lp-card-face lp-card-back" aria-hidden={!showQr}>
              <span className="lp-card-back-title">Customer QR</span>
              <LoyaltyQR token={qrToken} size={116} className="compact" />
              <span className="lp-card-number">Card {cardNumber}</span>
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="lp-glass-row lp-pass-toggle"
        aria-label={showQr ? "Return to loyalty card" : "Show my pass QR"}
        aria-pressed={showQr}
        onClick={togglePass}
      >
        <span className="lp-soft-icon"><QrCode size={22} /></span>
        <div>
          <h3>{showQr ? "Hide My Pass" : "Show My Pass"}</h3>
          <p>{showQr ? "Tap to return card" : "Tap to open QR"}</p>
        </div>
        <ChevronRight className={showQr ? "lp-row-chevron flipped" : "lp-row-chevron"} size={18} />
      </button>
    </>
  );
}
