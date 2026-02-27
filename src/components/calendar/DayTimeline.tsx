"use client";

import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLayoutEffect, useMemo, useRef } from "react";

import {
  MobileEventsList,
  mobileEventsListTitle,
} from "@/components/calendar/MobileEventsList";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/utils/cnUtils";
import {
  dayKey,
  dayKeyToLocalStart,
  minutesDiff,
  minutesSinceStartOfDay,
  overlaps,
} from "@/utils/time";

type Props = {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

type PositionedEvent = {
  event: CalendarEvent;
  start: Date;
  end: Date;
  colIndex: number;
  colCount: number;
  continuesFromPreviousDay: boolean;
  continuesNextDay: boolean;
};

type Segment = {
  event: CalendarEvent;
  start: Date;
  end: Date;
  continuesFromPreviousDay: boolean;
  continuesNextDay: boolean;
};

function buildOverlapsLayoutFromSegments(segments: Segment[]) {
  const items = segments
    .filter(
      (x) =>
        Number.isFinite(x.start.getTime()) &&
        Number.isFinite(x.end.getTime()) &&
        x.start.getTime() < x.end.getTime(),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const groups: Array<Array<(typeof items)[number]>> = [];
  for (const item of items) {
    const lastGroup = groups.at(-1);
    if (!lastGroup) {
      groups.push([item]);
      continue;
    }
    const groupEnd = lastGroup.reduce(
      (max, it) => (it.end.getTime() > max ? it.end.getTime() : max),
      0,
    );
    if (item.start.getTime() < groupEnd) lastGroup.push(item);
    else groups.push([item]);
  }

  const positioned: PositionedEvent[] = [];
  for (const group of groups) {
    const columns: Array<Array<(typeof items)[number]>> = [];

    for (const item of group) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col].at(-1);
        if (!lastInCol) continue;
        if (!overlaps(lastInCol.start, lastInCol.end, item.start, item.end)) {
          columns[col].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([item]);
    }

    const colCount = Math.max(1, columns.length);
    columns.forEach((colItems, colIndex) => {
      for (const item of colItems) {
        positioned.push({
          event: item.event,
          start: item.start,
          end: item.end,
          colIndex,
          colCount,
          continuesFromPreviousDay: item.continuesFromPreviousDay,
          continuesNextDay: item.continuesNextDay,
        });
      }
    });
  }

  return positioned;
}

export function DayTimeline({
  selectedDate,
  events: eventsProp,
  onSelectEvent,
}: Props) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const scrollRef = useRef<HTMLDivElement>(null);

  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return (
      sp.has("debugDay") ||
      window.localStorage?.getItem("debugDayTimeline") === "1"
    );
  }, []);

  const dayKeyStr = useMemo(() => dayKey(selectedDate), [selectedDate]);
  const dayStart = useMemo(() => dayKeyToLocalStart(dayKeyStr), [dayKeyStr]);
  const dayEnd = useMemo(() => addDays(dayStart, 1), [dayStart]);

  const events = useMemo(() => {
    if (
      !Number.isFinite(dayStart.getTime()) ||
      !Number.isFinite(dayEnd.getTime())
    )
      return [];
    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayEnd.getTime();

    return eventsProp
      .filter((e) => {
        const start = new Date(e.startAtISO).getTime();
        const end = new Date(e.endAtISO).getTime();
        return start < dayEndMs && end > dayStartMs;
      })
      .sort((a, b) => a.startAtISO.localeCompare(b.startAtISO));
  }, [eventsProp, dayStart, dayEnd]);

  const positioned = useMemo(() => {
    if (
      !Number.isFinite(dayStart.getTime()) ||
      !Number.isFinite(dayEnd.getTime())
    )
      return [];
    const segments: Segment[] = events
      .map((e) => {
        const start = new Date(e.startAtISO);
        const end = new Date(e.endAtISO);
        const segStart =
          start.getTime() < dayStart.getTime() ? dayStart : start;
        const segEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;
        return {
          event: e,
          start: segStart,
          end: segEnd,
          continuesFromPreviousDay: start.getTime() < dayStart.getTime(),
          continuesNextDay: end.getTime() > dayEnd.getTime(),
        };
      })
      .filter((s) => s.start.getTime() < s.end.getTime());

    return buildOverlapsLayoutFromSegments(segments);
  }, [events, dayStart, dayEnd]);

  const headerHeight = 88;
  const pxPerMinute = 1.2;
  const hourHeight = 60 * pxPerMinute;
  const totalHeight = headerHeight + hourHeight * 24;
  const endOfDayTop = headerHeight + 24 * hourHeight;
  const gutterWidth = 56;
  const timeFormat = (h: number) => `${String(h).padStart(2, "0")}:00`;

  const autoScrollRef = useRef<{ dayKey: string; done: boolean }>({
    dayKey: "",
    done: false,
  });

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    if (autoScrollRef.current.dayKey !== dayKeyStr) {
      autoScrollRef.current = { dayKey: dayKeyStr, done: false };
    }
    if (autoScrollRef.current.done) return;

    if (eventsProp.length > 0 && positioned.length === 0) return;

    const first = positioned[0];
    const firstStart =
      first?.start instanceof Date
        ? first.start
        : first
          ? new Date(first.start as string)
          : null;
    const targetMin = firstStart
      ? minutesSinceStartOfDay(firstStart)
      : (() => {
          const now = new Date();
          return dayKey(now) === dayKeyStr
            ? minutesSinceStartOfDay(now)
            : 8 * 60;
        })();

    const targetTop = headerHeight + targetMin * pxPerMinute;
    const padding = headerHeight + hourHeight * 1.5;
    const nextScrollTop = Math.max(0, targetTop - padding);

    scroller.scrollTo({
      top: nextScrollTop,
      behavior: "instant" as ScrollBehavior,
    });
    autoScrollRef.current.done = true;
  }, [
    dayKeyStr,
    eventsProp.length,
    headerHeight,
    hourHeight,
    positioned,
    pxPerMinute,
  ]);

  return (
    <div className="flex min-h-0 h-full flex-1 flex-col">
      {/* Mobile: apenas lista de eventos abaixo (sem timeline) */}
      <div className="flex-1 overflow-y-auto border-t border-border/60 pt-3 md:hidden">
        <MobileEventsList
          title={mobileEventsListTitle(selectedDate)}
          events={events}
          onSelectEvent={onSelectEvent}
          compact
        />
      </div>

      {/* Desktop: timeline completa (comportamento atual) */}
      <div className="hidden flex-1 flex-col overflow-hidden md:flex">
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-auto"
          style={{ scrollbarGutter: "stable" }}
          ref={scrollRef}
        >
          <div
            className="relative min-w-0 shrink-0"
            style={{
              height: totalHeight,
              minHeight: totalHeight,
              maxHeight: totalHeight,
            }}
          >
            <div
              className="relative"
              style={{ height: totalHeight, minHeight: totalHeight }}
            >
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />

              <div
                className="absolute left-0 top-0 flex flex-col gap-0.5 px-2 pt-2"
                style={{ height: headerHeight, width: gutterWidth }}
              >
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                  {format(selectedDate, "EEE", { locale: ptBR }).replace(
                    ".",
                    "",
                  )}
                </span>
                <span className="flex size-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[13px] font-semibold leading-none text-primary tabular-nums">
                  {format(selectedDate, "d")}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  GMT-03
                </span>
              </div>

              {positioned.length === 0 && (
                <div
                  className="absolute inset-0 flex items-start justify-center pt-24 text-sm text-muted-foreground"
                  aria-hidden
                >
                  Nenhum evento neste dia. Use as setas para navegar ou crie um
                  novo evento.
                </div>
              )}

              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute left-0 w-14 pr-2 text-right text-[11px] text-muted-foreground tabular-nums"
                  style={{
                    top: headerHeight + h * hourHeight,
                    height: hourHeight,
                  }}
                  aria-hidden
                >
                  <span className="mt-[-6px] block">{timeFormat(h)}</span>
                </div>
              ))}

              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute right-0 border-t border-border/60"
                  style={{
                    top: headerHeight + h * hourHeight,
                    left: gutterWidth,
                  }}
                  aria-hidden
                />
              ))}

              <div
                className="pointer-events-none absolute right-0 border-t border-border/70"
                style={{ top: endOfDayTop, left: gutterWidth }}
                aria-hidden
              />

              <div
                className="absolute inset-y-0 right-0"
                style={{ left: gutterWidth }}
              >
                {positioned.map((p) => {
                  const startDate =
                    p.start instanceof Date
                      ? p.start
                      : new Date(p.start as string);
                  const endDate =
                    p.end instanceof Date ? p.end : new Date(p.end as string);

                  const startMin = minutesSinceStartOfDay(startDate);
                  const durationMin = Math.max(
                    15,
                    minutesDiff(endDate, startDate),
                  );
                  const minBlockHeight = 24;

                  if (
                    !Number.isFinite(startMin) ||
                    !Number.isFinite(durationMin) ||
                    durationMin <= 0
                  ) {
                    return null;
                  }

                  const top = headerHeight + startMin * pxPerMinute;
                  const height = Math.max(
                    minBlockHeight,
                    durationMin * pxPerMinute,
                  );
                  const maxHeight = Math.max(0, endOfDayTop - top);
                  const clippedHeight = Math.min(height, maxHeight);

                  if (clippedHeight <= 0) return null;
                  const renderedHeight = Math.max(8, clippedHeight);

                  const safeColCount = Math.max(1, p.colCount || 1);
                  const colWidthPct = 100 / safeColCount;
                  const leftPct = p.colIndex * colWidthPct;
                  const left = `${leftPct}%`;
                  const width = `${colWidthPct}%`;
                  const startLabel = format(startDate, "HH:mm", {
                    locale: ptBR,
                  });
                  const endLabel = format(endDate, "HH:mm", { locale: ptBR });

                  return (
                    <div
                      key={p.event.id}
                      role={onSelectEvent ? "button" : undefined}
                      tabIndex={onSelectEvent ? 0 : undefined}
                      className={cn(
                        "absolute px-1",
                        onSelectEvent && "cursor-pointer",
                      )}
                      style={{
                        top,
                        left,
                        width,
                        height: renderedHeight,
                        zIndex: 20 + p.colIndex,
                        minWidth: 0,
                      }}
                      onClick={() => onSelectEvent?.(p.event)}
                      onKeyDown={(e) => {
                        if (
                          onSelectEvent &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          onSelectEvent(p.event);
                        }
                      }}
                    >
                      {debugEnabled && (
                        <div
                          className="pointer-events-none absolute inset-0 rounded-lg border border-red-500/70"
                          aria-hidden
                        />
                      )}
                      <div
                        className={cn(
                          "h-full w-full rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-black/5 overflow-hidden",
                          "px-2 py-1.5",
                          p.continuesFromPreviousDay &&
                            "rounded-l-none border-l-2 border-l-blue-300",
                        )}
                      >
                        <div className="truncate text-[13px] font-semibold leading-tight">
                          {p.event.title?.trim() || "(Sem título)"}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-tight text-white/95 tabular-nums">
                          {startLabel} – {endLabel}
                        </div>
                        {(p.continuesFromPreviousDay || p.continuesNextDay) && (
                          <div className="mt-1 text-[10px] italic text-white/80 leading-tight">
                            {p.continuesFromPreviousDay
                              ? "Continua do dia anterior"
                              : null}
                            {p.continuesFromPreviousDay && p.continuesNextDay
                              ? " • "
                              : null}
                            {p.continuesNextDay
                              ? "Continua no dia seguinte"
                              : null}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
