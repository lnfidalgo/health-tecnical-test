"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

import type { CalendarEvent } from "@/components/calendar/types";
import { cn } from "@/utils/cnUtils";
import { eventColorBgStyle } from "@/utils/eventColors";

type Props = {
  event: CalendarEvent;
  className?: string;
  variant?: "default" | "day";
  continuesNextDay?: boolean;
  continuesFromPreviousDay?: boolean;
};

export function EventCard({
  event,
  className,
  variant = "default",
  continuesNextDay,
  continuesFromPreviousDay,
}: Props) {
  const start = useMemo(() => new Date(event.startAtISO), [event.startAtISO]);
  const end = useMemo(() => new Date(event.endAtISO), [event.endAtISO]);

  const isDayView = variant === "day";

  return (
    <div
      className={cn(
        "group flex h-full w-full flex-col gap-1 overflow-hidden transition-colors hover:opacity-90",
        !isDayView && "rounded-2xl border px-3 py-2 shadow-sm backdrop-blur",
        isDayView &&
          "rounded-lg border-0 px-2 py-1.5 shadow-sm bg-blue-600 text-white",
        className,
      )}
      style={!isDayView ? eventColorBgStyle(event.id) : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        <div className="truncate text-sm font-semibold leading-tight">
          {event.title?.trim() || "(Sem título)"}
        </div>
        <div
          className={cn(
            "text-[11px] leading-tight",
            isDayView ? "text-white/95" : "text-muted-foreground",
          )}
        >
          {format(start, "HH:mm", { locale: ptBR })} –{" "}
          {format(end, "HH:mm", { locale: ptBR })}
        </div>
        {!isDayView && event.description ? (
          <div className="line-clamp-2 mt-0.5 text-[11px] leading-4 text-muted-foreground">
            {event.description}
          </div>
        ) : null}
      </div>
      {continuesFromPreviousDay ? (
        <div className="shrink-0">
          <span
            className={cn(
              "text-[10px] italic",
              isDayView ? "text-white/80" : "text-muted-foreground",
            )}
          >
            Continua do dia anterior
          </span>
        </div>
      ) : null}
      {continuesNextDay ? (
        <div
          className={cn(
            "shrink-0 pt-1",
            continuesFromPreviousDay ? "" : "mt-auto border-t border-white/20",
          )}
        >
          <span
            className={cn(
              "text-[10px] italic",
              isDayView ? "text-white/80" : "text-muted-foreground",
            )}
          >
            Continua no dia seguinte
          </span>
        </div>
      ) : null}
    </div>
  );
}
