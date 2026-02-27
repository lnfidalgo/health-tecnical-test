import { format } from "date-fns";

export function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function dayKeyToLocalStart(dayKeyStr: string): Date {
  const parts = dayKeyStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n)))
    return new Date(NaN);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function fromLocalDatetimeInputValue(value: string) {
  if (!value || !value.includes("T")) return null;
  const [datePart, timePart] = value.trim().split("T");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !Number.isFinite(h) ||
    !Number.isFinite(min)
  ) {
    return null;
  }
  const date = new Date(y, m - 1, d, h, min, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const MINUTES_PER_DAY = 24 * 60;

export function minutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function minutesUntilEndOfDay(date: Date) {
  return MINUTES_PER_DAY - minutesSinceStartOfDay(date);
}

export function minutesDiff(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}
