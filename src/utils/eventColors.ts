export const EVENT_COLORS = [
  "bg-sky-400",
  "bg-blue-600",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
] as const;

const EVENT_COLOR_BG = [
  "bg-sky-400/40",
  "bg-blue-600/40",
  "bg-indigo-500/40",
  "bg-violet-500/40",
  "bg-emerald-500/40",
] as const;

const EVENT_COLOR_BG_CSS = [
  "rgba(56, 189, 248, 0.4)",
  "rgba(37, 99, 235, 0.4)",
  "rgba(99, 102, 241, 0.4)",
  "rgba(139, 92, 246, 0.4)",
  "rgba(16, 185, 129, 0.4)",
] as const;

function eventColorIndex(eventId: string, length: number): number {
  let n = 0;
  for (let i = 0; i < eventId.length; i++) n += eventId.charCodeAt(i);
  return Math.abs(n) % length;
}

export function eventColorClass(eventId: string): string {
  return EVENT_COLORS[eventColorIndex(eventId, EVENT_COLORS.length)];
}

export function eventColorBgClass(eventId: string): string {
  return EVENT_COLOR_BG[eventColorIndex(eventId, EVENT_COLOR_BG.length)];
}

export function eventColorBgStyle(eventId: string): {
  backgroundColor: string;
} {
  const index = eventColorIndex(eventId, EVENT_COLOR_BG_CSS.length);
  return { backgroundColor: EVENT_COLOR_BG_CSS[index] };
}
