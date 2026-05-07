import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BUSINESS_TIMEZONE } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(value));
}

export function formatTime(value?: Date | string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(value));
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

