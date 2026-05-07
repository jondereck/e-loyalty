import { BUSINESS_TIMEZONE } from "@/lib/constants";

function zonedParts(date: Date, timeZone = BUSINESS_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function zonedDateToUtc(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}, timeZone = BUSINESS_TIMEZONE) {
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
  const actual = zonedParts(utcGuess, timeZone);
  const asUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  const wantedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return new Date(utcGuess.getTime() + (wantedUtc - asUtc));
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function computeBusinessDate(now = new Date(), timeZone = BUSINESS_TIMEZONE) {
  const current = zonedParts(now, timeZone);
  return `${current.year}-${pad2(current.month)}-${pad2(current.day)}`;
}

export function businessDayWindow(now = new Date(), timeZone = BUSINESS_TIMEZONE) {
  const current = zonedParts(now, timeZone);
  const start = zonedDateToUtc({ ...current, hour: 0, minute: 0, second: 0 }, timeZone);
  const tomorrow = new Date(Date.UTC(current.year, current.month - 1, current.day + 1));
  const nextParts = zonedParts(tomorrow, "UTC");
  const nextEligibleAt = zonedDateToUtc({
    year: nextParts.year,
    month: nextParts.month,
    day: nextParts.day,
    hour: 0,
    minute: 0,
    second: 0,
  }, timeZone);

  return { start, end: nextEligibleAt, nextEligibleAt };
}

