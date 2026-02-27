"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { EventForm } from "@/components/calendar/EventForm";
import type { CalendarEvent } from "@/components/calendar/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEventsStore } from "@/store/useEventsStore";

type Props = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditEventDialog({ event, open, onOpenChange }: Props) {
  const updateEvent = useEventsStore((s) => s.updateEvent);

  const initialDate = useMemo(
    () => (event ? new Date(event.startAtISO) : new Date()),
    [event],
  );

  function handleSubmitUpdate(updated: CalendarEvent) {
    updateEvent(updated);
    toast.success("Evento atualizado");
    onOpenChange(false);
  }

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>
            Altere título, descrição ou horários do evento.
          </DialogDescription>
        </DialogHeader>

        <EventForm
          key={event.id}
          initialDate={initialDate}
          initialEvent={event}
          onSubmitDraft={() => {}}
          onSubmitUpdate={handleSubmitUpdate}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
