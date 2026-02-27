"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EventForm } from "@/components/calendar/EventForm";
import type { CalendarEventDraft } from "@/components/calendar/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEventsStore } from "@/store/useEventsStore";

type Props = {
  selectedDate: Date;
  triggerLabel?: string;
  triggerClassName?: string;
};

export function CreateEventDialog({
  selectedDate,
  triggerLabel = "Novo evento",
  triggerClassName,
}: Props) {
  const addEvent = useEventsStore((s) => s.addEvent);
  const [open, setOpen] = useState(false);

  async function onSubmitDraft(draft: CalendarEventDraft) {
    addEvent(draft);
    toast.success("Evento criado");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className={triggerClassName}>
          <PlusIcon />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Crie um evento para o dia selecionado e ajuste horários se
            necessário.
          </DialogDescription>
        </DialogHeader>

        <EventForm
          initialDate={selectedDate}
          onSubmitDraft={onSubmitDraft}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
