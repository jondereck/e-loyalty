import { createHash, randomBytes } from "crypto";

export function generateQrToken() {
  return randomBytes(32).toString("base64url");
}

export function generateCardNumber() {
  const partA = randomBytes(2).toString("hex").toUpperCase();
  const partB = randomBytes(2).toString("hex").toUpperCase();
  return `LP-${new Date().getFullYear()}-${partA}-${partB}`;
}

export function safeTokenPreview(token?: string | null) {
  if (!token) return null;
  const digest = createHash("sha256").update(token).digest("hex");
  return `${digest.slice(0, 16)}:${token.slice(-8)}`;
}

