"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import type { CalendarEvent } from "@/components/calendar/types";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cnUtils";
import { eventColorClass } from "@/utils/eventColors";

type Props = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
};

export function EventDetailModal({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  const start = useMemo(() => {
    if (!event) return null;
    return new Date(event.startAtISO);
  }, [event]);
  const end = useMemo(() => {
    if (!event) return null;
    return new Date(event.endAtISO);
  }, [event]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!event) return null;

  const dateTimeLabel =
    start && end
      ? `${format(start, "EEEE, d 'de' MMMM", { locale: ptBR })} • ${format(start, "HH:mm", { locale: ptBR })} – ${format(end, "HH:mm", { locale: ptBR })}`
      : "";

  const colorClass = eventColorClass(event.id);

  function handleDeleteClick() {
    setDeleteConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!event) return;
    onDelete(event);
    setDeleteConfirmOpen(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-full max-w-md overflow-hidden flex flex-col sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogDescription className="sr-only">
            Detalhes do evento selecionado
          </DialogDescription>
          <div className="flex items-start gap-3 pr-8">
            <div
              className={cn("mt-0.5 size-4 shrink-0 rounded-sm", colorClass)}
              aria-hidden
            />
            <DialogTitle className="text-left text-lg font-semibold leading-tight">
              {event.title || "(Sem título)"}
            </DialogTitle>
          </div>
          {dateTimeLabel ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="size-4 shrink-0" />
              <span className="capitalize">{dateTimeLabel}</span>
            </p>
          ) : null}
        </DialogHeader>

        {event.description ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t pt-4">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(event);
                onOpenChange(false);
              }}
            >
              <PencilIcon className="size-4" />
              Editar
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2Icon className="size-4" />
            Excluir
          </Button>
        </div>
      </DialogContent>

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir evento"
        description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Dialog>
  );
}
