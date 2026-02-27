"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { DayTimeline } from "@/components/calendar/DayTimeline";
import { EditEventDialog } from "@/components/calendar/EditEventDialog";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import type { CalendarEvent } from "@/components/calendar/types";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventsStore } from "@/store/useEventsStore";
import { dayKey } from "@/utils/time";

export type CalendarView = "month" | "week" | "day";

function startOfMonthLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function startOfWeekLocal(date: Date) {
  return startOfWeek(date, { weekStartsOn: 0 });
}

export default function Home() {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => startOfMonthLocal(today));
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const monthCursor = useMemo(() => startOfMonthLocal(cursor), [cursor]);
  const weekStart = useMemo(() => startOfWeekLocal(cursor), [cursor]);

  const headerLabel = useMemo(() => {
    if (view === "month")
      return format(monthCursor, "MMMM yyyy", { locale: ptBR });
    if (view === "week") {
      const end = addDays(weekStart, 6);
      return `${format(weekStart, "d", { locale: ptBR })} – ${format(end, "d 'de' MMMM yyyy", { locale: ptBR })}`;
    }
    return format(cursor, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  }, [view, monthCursor, weekStart, cursor]);

  const events = useEventsStore((s) => s.events);
  const eventsByDayKey = useEventsStore((s) => s.eventsByDayKey);
  const eventsTouchingDayKey = useEventsStore((s) => s.eventsTouchingDayKey);
  const eventsForSelectedDay = useMemo(
    () => eventsByDayKey(dayKey(selectedDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsByDayKey, selectedDate, events],
  );
  const dayViewDate = useMemo(
    () => (view === "day" ? startOfDay(cursor) : null),
    [view, cursor],
  );
  const dayViewEvents = useMemo(
    () => (dayViewDate ? eventsTouchingDayKey(dayKey(dayViewDate)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayViewDate, eventsTouchingDayKey, events],
  );

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (!isMobile) setDayModalOpen(true);
  }

  const removeEvent = useEventsStore((s) => s.removeEvent);

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  }

  function handleDeleteEvent(event: CalendarEvent) {
    removeEvent(event.id);
    toast.success("Evento excluído com sucesso");
  }

  function handleEditEvent(event: CalendarEvent) {
    setEventToEdit(event);
    setEventDetailOpen(false);
    setEditDialogOpen(true);
  }

  function goPrev() {
    if (view === "month")
      setCursor((d) => startOfMonthLocal(subMonths(startOfMonth(d), 1)));
    else if (view === "week")
      setCursor((d) => subWeeks(startOfWeekLocal(d), 1));
    else setCursor((d) => subDays(d, 1));
  }

  function goNext() {
    if (view === "month")
      setCursor((d) => startOfMonthLocal(addMonths(startOfMonth(d), 1)));
    else if (view === "week")
      setCursor((d) => addWeeks(startOfWeekLocal(d), 1));
    else setCursor((d) => addDays(d, 1));
  }

  function goToday() {
    setCursor(
      view === "month"
        ? startOfMonthLocal(today)
        : view === "week"
          ? startOfWeekLocal(today)
          : today,
    );
    setSelectedDate(today);
  }

  function handleViewChange(value: string) {
    const next = value as CalendarView;
    setView(next);
    if (next === "month") setCursor(startOfMonthLocal(cursor));
    else if (next === "week") setCursor(startOfWeekLocal(today));
    else if (next === "day") setCursor(selectedDate);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 bg-linear-to-b from-primary/10 via-background to-background" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden px-4 py-6 md:px-6 lg:px-8 2xl:max-w-[1400px]">
        <header className="flex shrink-0 flex-col gap-4 rounded-2xl border bg-card/70 px-4 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:gap-3 md:px-5 md:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-initial md:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToday}
              className="min-h-11 shrink-0 touch-manipulation px-4 md:min-h-0"
            >
              Hoje
            </Button>
            <div className="flex shrink-0 items-center gap-0.5 rounded-md border bg-muted/30 p-0.5 md:border-0 md:bg-transparent md:p-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 touch-manipulation md:size-8"
                onClick={goPrev}
                aria-label={
                  view === "month"
                    ? "Mês anterior"
                    : view === "week"
                      ? "Semana anterior"
                      : "Dia anterior"
                }
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 touch-manipulation md:size-8"
                onClick={goNext}
                aria-label={
                  view === "month"
                    ? "Próximo mês"
                    : view === "week"
                      ? "Próxima semana"
                      : "Próximo dia"
                }
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            <span className="min-w-0 truncate pl-1 text-sm font-medium md:ml-2 md:truncate-none md:text-base">
              {headerLabel.charAt(0).toUpperCase() + headerLabel.slice(1)}
            </span>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto md:flex-initial md:gap-2">
            <Select value={view} onValueChange={handleViewChange}>
              <SelectTrigger
                size="sm"
                className="min-h-11 flex-1 touch-manipulation md:min-h-8 md:w-28 md:flex-initial"
              >
                <CalendarDaysIcon className="size-4 shrink-0 opacity-70" />
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="day">Dia</SelectItem>
              </SelectContent>
            </Select>
            <CreateEventDialog
              selectedDate={selectedDate}
              triggerClassName="min-h-11 shrink-0 touch-manipulation md:min-h-0"
            />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-card/70 p-4 shadow-sm backdrop-blur md:p-6">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Calendário</h2>
            <p className="text-xs text-muted-foreground">
              {view === "day"
                ? "Timeline do dia selecionado"
                : "Clique em um dia para ver e gerenciar os eventos"}
            </p>
          </div>
          <div className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-2xl bg-background/60">
            {view === "month" && (
              <MonthGrid
                monthCursor={monthCursor}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                getEventsForDay={eventsByDayKey}
                onSelectEvent={handleSelectEvent}
              />
            )}
            {view === "week" && (
              <WeekGrid
                weekStart={weekStart}
                selectedDate={selectedDate}
                getEventsForDay={eventsTouchingDayKey}
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
              />
            )}
            {view === "day" && dayViewDate && (
              <DayTimeline
                key={dayKey(dayViewDate)}
                selectedDate={dayViewDate}
                events={dayViewEvents}
                onSelectEvent={handleSelectEvent}
              />
            )}
          </div>
        </main>
      </div>

      <DayDetailModal
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        date={selectedDate}
        events={eventsForSelectedDay}
        onSelectEvent={handleSelectEvent}
      />

      <EventDetailModal
        event={selectedEvent}
        open={eventDetailOpen}
        onOpenChange={setEventDetailOpen}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <EditEventDialog
        event={eventToEdit}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEventToEdit(null);
        }}
      />
    </div>
  );
}
