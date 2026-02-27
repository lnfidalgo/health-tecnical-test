"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/utils/cnUtils";
import { eventColorBgStyle } from "@/utils/eventColors";

type Props = {
  title?: string;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  compact?: boolean;
};

export function MobileEventsList({
  title,
  events,
  onSelectEvent,
  compact = false,
}: Props) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.startAtISO.localeCompare(b.startAtISO)),
    [events],
  );

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-center text-sm text-muted-foreground",
          compact ? "px-3 py-4" : "px-4 py-6",
        )}
      >
        Nenhum evento neste dia
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-2 overflow-hidden">
      {title && (
        <h3 className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {sorted.map((event) => {
          const start = new Date(event.startAtISO);
          const end = new Date(event.endAtISO);
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelectEvent?.(event)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background/80 text-left shadow-sm transition-colors hover:bg-muted/50",
                  onSelectEvent && "cursor-pointer",
                  compact ? "px-2.5 py-2" : "px-3 py-2.5",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={eventColorBgStyle(event.id)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {event.title?.trim() || "(Sem título)"}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {format(start, "HH:mm", { locale: ptBR })} –{" "}
                    {format(end, "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function mobileEventsListTitle(date: Date): string {
  return `Eventos — ${format(date, "EEEE, d 'de' MMM", { locale: ptBR })}`;
}
