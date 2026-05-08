import { BUSINESS_TIMEZONE } from "@/lib/constants";

export const timezoneOptions = [
  { value: "Asia/Manila", label: "Asia/Manila (Philippines)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (US Eastern)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (US Pacific)" },
] as const;

export const dateFormatOptions = [
  { value: "MMM_DD_YYYY", label: "June 10, 2024 (MMM DD, YYYY)" },
  { value: "MM_DD_YYYY", label: "06/10/2024 (MM/DD/YYYY)" },
  { value: "DD_MM_YYYY", label: "10/06/2024 (DD/MM/YYYY)" },
  { value: "YYYY_MM_DD", label: "2024-06-10 (YYYY-MM-DD)" },
] as const;

export const currencyOptions = [
  { value: "PHP", label: "PHP - Philippine Peso (PHP)" },
  { value: "USD", label: "USD - US Dollar (US$)" },
] as const;

export type TimezoneOption = (typeof timezoneOptions)[number]["value"];
export type DateFormatOption = (typeof dateFormatOptions)[number]["value"];
export type CurrencyOption = (typeof currencyOptions)[number]["value"];

export const defaultGeneralSettings = {
  systemName: "Loyalty Pass",
  supportEmail: "support@loyaltypass.com",
  businessTimezone: BUSINESS_TIMEZONE as TimezoneOption,
  dateFormat: "MMM_DD_YYYY" as DateFormatOption,
  currency: "USD" as CurrencyOption,
  maintenanceEnabled: false,
  maintenanceMessage: "The system is temporarily unavailable while we perform maintenance. Please check back soon.",
  updateLastCheckedAt: null as string | null,
  updateAppVersion: "0.1.0",
};
