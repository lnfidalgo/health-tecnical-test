"use client";

import {
  MobileEventsList,
  mobileEventsListTitle,
} from "@/components/calendar/MobileEventsList";
import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/utils/cnUtils";
import { eventColorBgStyle } from "@/utils/eventColors";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useSyncExternalStore } from "react";

const MAX_EVENTS_PER_CELL = 4;

const WEEKDAY_BASE = new Date(2023, 0, 1);

let clientToday: Date | null = null;
function subscribeClientToday(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (clientToday === null) {
    clientToday = new Date();
    cb();
  }
  return () => {};
}
function getClientToday() {
  return clientToday;
}

let clientMounted = false;
function subscribeMounted(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (!clientMounted) {
    queueMicrotask(() => {
      clientMounted = true;
      cb();
    });
  }
  return () => {};
}
function getMounted() {
  return clientMounted;
}

type Props = {
  monthCursor: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  getEventsForDay: (dayKey: string) => CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

function dateAtNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

export function MonthGrid({
  monthCursor,
  selectedDate,
  onSelectDate,
  getEventsForDay,
  onSelectEvent,
}: Props) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMounted,
    () => false,
  );
  const today = useSyncExternalStore(
    subscribeClientToday,
    getClientToday,
    () => null,
  );

  const monthStart = useMemo(
    () => dateAtNoon(startOfMonth(monthCursor)),
    [monthCursor],
  );
  const monthEnd = useMemo(
    () => dateAtNoon(endOfMonth(monthCursor)),
    [monthCursor],
  );

  const gridStart = useMemo(
    () => dateAtNoon(startOfWeek(monthStart, { weekStartsOn: 0 })),
    [monthStart],
  );
  const gridEnd = useMemo(
    () => dateAtNoon(endOfWeek(monthEnd, { weekStartsOn: 0 })),
    [monthEnd],
  );

  const days: Date[] = useMemo(() => {
    const out: Date[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
      out.push(dateAtNoon(d));
    }
    return out;
  }, [gridStart, gridEnd]);

  const weekCount = useMemo(() => {
    return Math.ceil(days.length / 7);
  }, [days.length]);

  const weekdays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) =>
      format(addDays(WEEKDAY_BASE, idx), "EEE", { locale: ptBR }),
    );
  }, []);

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = getEventsForDay(selectedDayKey);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-7 gap-1 px-1">
          {weekdays.map((w) => (
            <div
              key={w}
              className="text-center text-[11px] font-medium text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div
            className="grid min-h-0 flex-1 grid-cols-7 gap-1 p-1"
            style={{
              gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))`,
            }}
          >
            {days.map((d) => {
              const inMonth = isSameMonth(d, monthCursor);
              const isSelected = isSameDay(d, selectedDate);
              const isToday = today !== null && isSameDay(d, today);
              const key = format(d, "yyyy-MM-dd");
              const dayEvents = getEventsForDay(key);
              const sortedEvents = [...dayEvents].sort((a, b) =>
                a.startAtISO.localeCompare(b.startAtISO),
              );
              const displayEvents = mounted
                ? sortedEvents.slice(0, MAX_EVENTS_PER_CELL)
                : [];
              const hasMore =
                mounted && sortedEvents.length > MAX_EVENTS_PER_CELL;
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate(d)}
                  className={cn(
                    "group relative flex h-full min-h-0 w-full flex-col items-stretch overflow-hidden rounded-xl border bg-background/40 px-1.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer hover:bg-primary/10",
                    !inMonth && "opacity-55",
                    isSelected &&
                      "border-primary/50 bg-primary/8 ring-1 ring-primary/25",
                    isToday && "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
                  )}
                  aria-current={isToday ? "date" : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {format(d, "d")}
                    </span>
                    {mounted && hasEvents && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary/60 md:hidden"
                        aria-hidden
                      />
                    )}
                  </div>

                  <div className="mt-1 hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden md:flex">
                    {displayEvents.map((event) => {
                      const start = new Date(event.startAtISO);
                      const timeStr = mounted
                        ? format(start, "HH:mm", { locale: ptBR })
                        : null;
                      return (
                        <div
                          key={event.id}
                          className="flex min-h-0 shrink-0 items-center gap-1 overflow-hidden text-[10px]"
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={eventColorBgStyle(event.id)}
                            aria-hidden
                          />
                          <span className="min-w-0 shrink-0 truncate text-muted-foreground">
                            {timeStr ?? "\u00A0"}
                          </span>
                          <span className="min-w-0 shrink truncate font-medium text-foreground">
                            {event.title}
                          </span>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <span className="text-[10px] text-muted-foreground">
                        +{sortedEvents.length - MAX_EVENTS_PER_CELL} mais
                      </span>
                    )}
                  </div>

                  {isSelected && <span className="sr-only">Selecionado</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border/60 pt-3 md:hidden">
        <MobileEventsList
          title={mobileEventsListTitle(selectedDate)}
          events={mounted ? selectedDayEvents : []}
          onSelectEvent={onSelectEvent}
        />
      </div>
    </div>
  );
}
