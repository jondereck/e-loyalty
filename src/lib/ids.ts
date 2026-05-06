import { randomBytes } from "crypto";

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
  return randomBytes(8).toString("hex") + ":" + token.slice(-8);
}

