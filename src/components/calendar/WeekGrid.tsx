"use client";

import { EventCard } from "@/components/calendar/EventCard";
import {
  MobileEventsList,
  mobileEventsListTitle,
} from "@/components/calendar/MobileEventsList";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/utils/cnUtils";
import { eventColorBgClass } from "@/utils/eventColors";
import { minutesDiff, minutesSinceStartOfDay, overlaps } from "@/utils/time";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

type Segment = { event: CalendarEvent; start: Date; end: Date };

type PositionedEvent = {
  event: CalendarEvent;
  start: Date;
  end: Date;
  colIndex: number;
  colCount: number;
};

function buildOverlapsLayoutFromSegments(
  segments: Segment[],
): PositionedEvent[] {
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
        });
      }
    });
  }

  return positioned;
}

type Props = {
  weekStart: Date;
  selectedDate: Date;
  getEventsForDay: (dayKey: string) => CalendarEvent[];
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
};

function dateAtNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

export function WeekGrid({
  weekStart,
  selectedDate,
  getEventsForDay,
  onSelectDate,
  onSelectEvent,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const weekStartsOn = 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollbarW, setScrollbarW] = useState(0);

  const start = useMemo(
    () => dateAtNoon(startOfWeek(weekStart, { weekStartsOn })),
    [weekStart],
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(start, i)).map(dateAtNoon),
    [start],
  );

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const pxPerMinute = 1.2;
  const hourHeight = 60 * pxPerMinute;
  const totalHeight = hourHeight * 24;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth - el.clientWidth;
      setScrollbarW(w > 0 ? w : 0);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const timeFormat = (h: number) => `${String(h).padStart(2, "0")}:00`;

  const gridCols = "56px 1fr 1fr 1fr 1fr 1fr 1fr 1fr";

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = getEventsForDay(selectedDayKey);

  return (
    <div className="flex min-h-0 h-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-7 border-b border-border bg-background/95 md:hidden">
          {days.map((day) => {
            const dayKeyStr = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={dayKeyStr}
                type="button"
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 border-r border-border last:border-r-0 text-center transition-colors",
                  onSelectDate && "cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-primary/10",
                )}
                onClick={() => onSelectDate?.(day)}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium flex items-center gap-1",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isSelected && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  {format(day, "EEE", { locale: ptBR })
                    .slice(0, 3)
                    .replace(/^./, (c) => c.toUpperCase())}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected &&
                      !isToday &&
                      "bg-primary/15 text-primary ring-1 ring-primary/30",
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="hidden shrink-0 border-b border-border bg-background/95 md:grid"
          style={{ gridTemplateColumns: gridCols, paddingRight: scrollbarW }}
        >
          <div className="flex items-center px-2 py-3 text-[10px] text-muted-foreground border-r border-border">
            GMT-03
          </div>
          {days.map((day) => {
            const dayKeyStr = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={dayKeyStr}
                type="button"
                className={cn(
                  "flex flex-col items-center gap-0.5 py-3 border-r border-border last:border-r-0 text-center transition-colors",
                  onSelectDate && "cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-primary/10",
                )}
                onClick={() => onSelectDate?.(day)}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium flex items-center gap-1",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isSelected && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected &&
                      !isToday &&
                      "bg-primary/15 text-primary ring-1 ring-primary/30",
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-border/60 pt-3 md:hidden h-[350px]">
          <MobileEventsList
            title={mobileEventsListTitle(selectedDate)}
            events={selectedDayEvents}
            onSelectEvent={onSelectEvent}
          />
        </div>

        <div
          className="hidden min-h-0 flex-1 overflow-y-auto overflow-x-auto md:block"
          style={{ scrollbarGutter: "stable" }}
          ref={scrollRef}
        >
          <div
            className="grid min-w-0"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="sticky left-0 z-20 flex flex-col border-r border-border bg-background/95">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end border-t border-border/50 pr-2 text-[11px] text-muted-foreground"
                  style={{ height: hourHeight, minHeight: hourHeight }}
                >
                  <span className="mt-[-6px] tabular-nums">
                    {timeFormat(h)}
                  </span>
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayKeyStr = format(day, "yyyy-MM-dd");
              const dayEvents = getEventsForDay(dayKeyStr);
              const dayStart = startOfDay(day);
              const dayEnd = addDays(dayStart, 1);

              const segments: Segment[] = dayEvents
                .map((e) => {
                  const start = new Date(e.startAtISO);
                  const end = new Date(e.endAtISO);
                  const segStart =
                    start.getTime() < dayStart.getTime() ? dayStart : start;
                  const segEnd =
                    end.getTime() > dayEnd.getTime() ? dayEnd : end;
                  return { event: e, start: segStart, end: segEnd };
                })
                .filter((s) => s.start.getTime() < s.end.getTime());

              const positioned = buildOverlapsLayoutFromSegments(segments);

              return (
                <div
                  key={dayKeyStr}
                  className="relative border-r border-border/60 last:border-r-0"
                  style={{ height: totalHeight, minHeight: totalHeight }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-t border-border/60"
                      style={{ height: hourHeight }}
                    />
                  ))}

                  {positioned.map((p) => {
                    const startMin = minutesSinceStartOfDay(p.start);
                    const durationMin = Math.max(
                      15,
                      minutesDiff(p.end, p.start),
                    );
                    const eventEnd = new Date(p.event.endAtISO);
                    const continuesFromPreviousDay =
                      p.start.getTime() === dayStart.getTime();
                    const continuesNextDay =
                      p.end.getTime() === dayEnd.getTime() &&
                      eventEnd.getTime() > dayEnd.getTime();

                    const top = startMin * pxPerMinute;
                    const height = durationMin * pxPerMinute;

                    const overlapOffsetPx = 12;
                    const leftPx = p.colIndex * overlapOffsetPx;
                    const width = `calc(100% - ${leftPx}px)`;
                    const minWidth = 80;

                    return (
                      <div
                        key={`${p.event.id}-${dayKeyStr}`}
                        role={onSelectEvent ? "button" : undefined}
                        tabIndex={onSelectEvent ? 0 : undefined}
                        className={cn(
                          "absolute pr-0.5",
                          onSelectEvent && "cursor-pointer",
                        )}
                        style={{
                          top,
                          left: leftPx,
                          width,
                          minWidth,
                          height,
                          zIndex: 10 + p.colIndex,
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
                        <EventCard
                          event={p.event}
                          continuesFromPreviousDay={continuesFromPreviousDay}
                          continuesNextDay={continuesNextDay}
                          className={cn(
                            "h-full border-primary/15 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                            eventColorBgClass(p.event.id),
                            continuesFromPreviousDay &&
                              "rounded-l-none border-l-2 border-l-primary/40",
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
