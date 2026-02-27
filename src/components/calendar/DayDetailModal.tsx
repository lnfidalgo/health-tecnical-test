"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

import type { CalendarEvent } from "@/components/calendar/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cnUtils";
import { eventColorBgStyle } from "@/utils/eventColors";

import { CreateEventDialog } from "./CreateEventDialog";
import { EventCard } from "./EventCard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

export function DayDetailModal({
  open,
  onOpenChange,
  date,
  events,
  onSelectEvent,
}: Props) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.startAtISO.localeCompare(b.startAtISO)),
    [events],
  );

  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] w-full max-w-lg overflow-hidden flex flex-col sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-left text-lg">
              {labelCapitalized}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {sortedEvents.length} evento{sortedEvents.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex shrink-0 justify-end">
              <CreateEventDialog
                selectedDate={date}
                triggerLabel="Novo evento"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-muted/30 p-3">
              {sortedEvents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum evento neste dia. Clique em &quot;Novo evento&quot;
                  para adicionar.
                </p>
              ) : (
                <>
                  {onSelectEvent ? (
                    <p className="mb-3 text-center text-sm text-muted-foreground">
                      Clique para visualizar mais detalhes
                    </p>
                  ) : null}
                  <ul className="flex flex-col gap-2">
                    {sortedEvents.map((event) => {
                      const colorStyle = eventColorBgStyle(event.id);
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full gap-3 text-left transition-colors rounded-lg hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              onSelectEvent && "cursor-pointer",
                            )}
                            onClick={() => onSelectEvent?.(event)}
                          >
                            <div
                              className="mt-1.5 size-2.5 shrink-0 rounded-full"
                              style={colorStyle}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <EventCard
                                event={event}
                                className="w-full border bg-card shadow-sm"
                              />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
