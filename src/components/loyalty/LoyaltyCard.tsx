import type { CSSProperties } from "react";
import { compactNumber } from "@/lib/utils";

export function LoyaltyCard({
  tier,
  color,
  points,
  visits,
  systemName = "Loyalty Pass",
  variant = "classic",
  className = "",
}: {
  tier: string;
  color?: string;
  points: number;
  visits: number;
  systemName?: string;
  variant?: "classic" | "homepage";
  className?: string;
}) {
  const style = buildCardStyle(color);

  if (variant === "homepage") {
    return (
      <div className={`lp-home-pass-card loyalty-card-homepage ${className}`.trim()} style={style}>
        <span className="lp-home-tier">{tier}</span>
        <strong>{systemName}</strong>
        <div className="lp-home-pass-stats">
          <span>
            <b>{compactNumber(points)}</b>
            Points Balance
          </span>
          <span>
            <b>{compactNumber(visits)}</b>
            Visits
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`loyalty-card ${className}`.trim()} style={style}>
      <span className="tier">{tier}</span>
      <div className="card-title">{systemName}</div>
      <div className="stats">
        <div className="stat">
          <strong>{compactNumber(points)}</strong>
          <span>Points Balance</span>
        </div>
        <div className="stat">
          <strong>{compactNumber(visits)}</strong>
          <span>Visits</span>
        </div>
      </div>
    </div>
  );
}

function buildCardStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined;

  return {
    "--lp-card-accent": color,
    "--lp-card-shadow": hexToRgba(color, 0.22),
  } as CSSProperties;
}

function hexToRgba(color: string, alpha: number) {
  const normalized = color.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  if (!/^[A-Fa-f0-9]{6}$/.test(expanded)) {
    return `rgba(108, 78, 255, ${alpha})`;
  }

  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
