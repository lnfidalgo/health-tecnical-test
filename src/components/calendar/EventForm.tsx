"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes } from "date-fns";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type {
  CalendarEvent,
  CalendarEventDraft,
} from "@/components/calendar/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cnUtils";
import {
  fromLocalDatetimeInputValue,
  toLocalDatetimeInputValue,
} from "@/utils/time";

const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(80, "Máx 80 caracteres"),
    description: z
      .string()
      .trim()
      .max(500, "Máx 500 caracteres")
      .optional()
      .or(z.literal("")),
    startLocal: z.string().min(1, "Início é obrigatório"),
    endLocal: z.string().min(1, "Fim é obrigatório"),
  })
  .superRefine((v, ctx) => {
    const start = fromLocalDatetimeInputValue(v.startLocal);
    const end = fromLocalDatetimeInputValue(v.endLocal);
    if (!start) {
      ctx.addIssue({
        code: "custom",
        path: ["startLocal"],
        message: "Data/hora inválida",
      });
      return;
    }
    if (!end) {
      ctx.addIssue({
        code: "custom",
        path: ["endLocal"],
        message: "Data/hora inválida",
      });
      return;
    }
    if (start >= end) {
      ctx.addIssue({
        code: "custom",
        path: ["endLocal"],
        message: "Fim deve ser após o início",
      });
    }
    const minutes = (end.getTime() - start.getTime()) / 60000;
    if (minutes > 24 * 60) {
      ctx.addIssue({
        code: "custom",
        path: ["endLocal"],
        message: "Evento muito longo (máx 24h no MVP)",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  initialDate: Date;
  initialEvent?: CalendarEvent | null;
  onSubmitDraft: (draft: CalendarEventDraft) => void | Promise<void>;
  onSubmitUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
};

export function EventForm({
  initialDate,
  initialEvent,
  onSubmitDraft,
  onSubmitUpdate,
  onCancel,
  className,
}: Props) {
  const defaultStart = useMemo(() => {
    if (initialEvent) return new Date(initialEvent.startAtISO);
    const base = new Date(initialDate);
    base.setSeconds(0, 0);
    if (base.getMinutes() !== 0) base.setMinutes(0);
    return base;
  }, [initialDate, initialEvent]);

  const defaultEnd = useMemo(() => {
    if (initialEvent) return new Date(initialEvent.endAtISO);
    return addMinutes(defaultStart, 60);
  }, [defaultStart, initialEvent]);

  const defaultValues = useMemo<FormValues>(
    () => ({
      title: initialEvent?.title ?? "",
      description: initialEvent?.description ?? "",
      startLocal: toLocalDatetimeInputValue(defaultStart),
      endLocal: toLocalDatetimeInputValue(defaultEnd),
    }),
    [initialEvent, defaultStart, defaultEnd],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const {
    watch,
    setValue,
    formState: { isSubmitting, isValid },
  } = form;

  const startLocal = watch("startLocal");
  const endLocal = watch("endLocal");

  const { minEnd, maxEnd } = useMemo(() => {
    const start = startLocal ? fromLocalDatetimeInputValue(startLocal) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return { minEnd: "", maxEnd: "" };
    }
    const min = toLocalDatetimeInputValue(start);
    const max = toLocalDatetimeInputValue(addMinutes(start, 24 * 60));
    return { minEnd: min, maxEnd: max };
  }, [startLocal]);

  useEffect(() => {
    if (!minEnd || !maxEnd || !endLocal) return;
    const end = fromLocalDatetimeInputValue(endLocal);
    const start = fromLocalDatetimeInputValue(startLocal);
    if (!end || !start) return;
    if (end < start) {
      setValue("endLocal", minEnd, { shouldValidate: true });
    } else if (end.getTime() > addMinutes(start, 24 * 60).getTime()) {
      setValue("endLocal", maxEnd, { shouldValidate: true });
    }
  }, [startLocal, endLocal, minEnd, maxEnd, setValue]);

  const isEditMode = Boolean(initialEvent && onSubmitUpdate);

  return (
    <Form {...form}>
      <form
        className={cn("grid gap-4", className)}
        onSubmit={form.handleSubmit(async (values) => {
          const start = fromLocalDatetimeInputValue(values.startLocal)!;
          const end = fromLocalDatetimeInputValue(values.endLocal)!;

          const draft: CalendarEventDraft = {
            title: values.title.trim(),
            description: values.description?.trim()
              ? values.description.trim()
              : undefined,
            startAtISO: start.toISOString(),
            endAtISO: end.toISOString(),
          };

          if (isEditMode && initialEvent) {
            await onSubmitUpdate?.({
              ...draft,
              id: initialEvent.id,
              createdAtISO: initialEvent.createdAtISO,
            });
          } else {
            await onSubmitDraft(draft);
          }
        })}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="grid gap-1.5">
              <FormLabel>Título*</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Consulta, Reunião, Treino..."
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
          <FormField
            control={form.control}
            name="startLocal"
            render={({ field }) => (
              <FormItem className="grid grid-rows-[auto_auto_1.25rem] gap-1.5">
                <FormLabel>Início</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endLocal"
            render={({ field }) => (
              <FormItem className="grid grid-rows-[auto_auto_1.25rem] gap-1.5">
                <FormLabel>Fim (range máximo de 24h)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    min={minEnd || undefined}
                    max={maxEnd || undefined}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="grid gap-1.5">
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione detalhes, local, link..."
                  className="min-h-20 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? "Atualizando..."
                : "Salvando..."
              : isEditMode
                ? "Atualizar"
                : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
