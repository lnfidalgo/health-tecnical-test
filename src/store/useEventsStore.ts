"use client";

import { addDays, setHours, setMinutes } from "date-fns";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  CalendarEvent,
  CalendarEventDraft,
} from "@/components/calendar/types";
import { dayKey, dayKeyToLocalStart } from "@/utils/time";

function getMockEvents(): CalendarEvent[] {
  const base = new Date();
  const today = (d: Date) => setMinutes(setHours(d, 0), 0);

  return [
    {
      id: "mock-1",
      title: "Consulta médica",
      description: "Check-up de rotina",
      startAtISO: setMinutes(setHours(addDays(base, 0), 9), 0).toISOString(),
      endAtISO: setMinutes(setHours(addDays(base, 0), 10), 0).toISOString(),
      createdAtISO: today(base).toISOString(),
    },
    {
      id: "mock-2",
      title: "Reunião da equipe",
      description: "Planejamento semanal",
      startAtISO: setMinutes(setHours(addDays(base, 0), 14), 0).toISOString(),
      endAtISO: setMinutes(setHours(addDays(base, 0), 15), 30).toISOString(),
      createdAtISO: today(base).toISOString(),
    },
    {
      id: "mock-3",
      title: "Academia",
      description: "Treino de força",
      startAtISO: setMinutes(setHours(addDays(base, 1), 7), 0).toISOString(),
      endAtISO: setMinutes(setHours(addDays(base, 1), 8), 0).toISOString(),
      createdAtISO: today(base).toISOString(),
    },
    {
      id: "mock-4",
      title: "Dentista",
      description: "Limpeza e avaliação",
      startAtISO: setMinutes(setHours(addDays(base, 2), 10), 0).toISOString(),
      endAtISO: setMinutes(setHours(addDays(base, 2), 11), 0).toISOString(),
      createdAtISO: today(base).toISOString(),
    },
    {
      id: "mock-5",
      title: "Café com cliente",
      description: "Apresentação do projeto",
      startAtISO: setMinutes(setHours(addDays(base, 3), 15), 0).toISOString(),
      endAtISO: setMinutes(setHours(addDays(base, 3), 16), 30).toISOString(),
      createdAtISO: today(base).toISOString(),
    },
  ].sort((a, b) => a.startAtISO.localeCompare(b.startAtISO));
}

type EventsState = {
  version: 1;
  events: CalendarEvent[];
  hasHydrated: boolean;

  addEvent: (draft: CalendarEventDraft) => CalendarEvent;
  removeEvent: (id: string) => void;
  updateEvent: (event: CalendarEvent) => void;
  clearAll: () => void;

  eventsByDayKey: (day: string) => CalendarEvent[];
  eventsTouchingDayKey: (day: string) => CalendarEvent[];
  daysWithEventsInMonth: (monthCursor: Date) => Set<string>;
};

function sortByStartAsc(a: CalendarEvent, b: CalendarEvent) {
  return a.startAtISO.localeCompare(b.startAtISO);
}

function safeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isValidISO(iso: string) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t);
}

const storageKey = "calendar_events_v1";

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      version: 1,
      events: getMockEvents(),
      hasHydrated: false,

      addEvent: (draft) => {
        if (!isValidISO(draft.startAtISO) || !isValidISO(draft.endAtISO)) {
          throw new Error("Invalid event date");
        }
        const createdAtISO = new Date().toISOString();
        const next: CalendarEvent = { id: safeId(), createdAtISO, ...draft };

        set((s) => ({
          events: [...s.events, next].sort(sortByStartAsc),
        }));
        return next;
      },

      removeEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      updateEvent: (event) => {
        if (!isValidISO(event.startAtISO) || !isValidISO(event.endAtISO)) {
          throw new Error("Invalid event date");
        }

        set((s) => ({
          events: s.events
            .map((e) => (e.id === event.id ? event : e))
            .sort(sortByStartAsc),
        }));
      },

      clearAll: () => set({ events: [] }),

      eventsByDayKey: (day) => {
        const events = get().events;
        return events
          .filter((e) => {
            const start = new Date(e.startAtISO);
            return dayKey(start) === day;
          })
          .sort(sortByStartAsc);
      },

      eventsTouchingDayKey: (day) => {
        const events = get().events;
        const dayStart = dayKeyToLocalStart(day);
        if (Number.isNaN(dayStart.getTime())) return [];
        const dayEnd = addDays(dayStart, 1);
        return events
          .filter((e) => {
            const start = new Date(e.startAtISO);
            const end = new Date(e.endAtISO);
            return (
              start.getTime() < dayEnd.getTime() &&
              end.getTime() > dayStart.getTime()
            );
          })
          .sort(sortByStartAsc);
      },

      daysWithEventsInMonth: (monthCursor) => {
        const y = monthCursor.getFullYear();
        const m = monthCursor.getMonth();
        const out = new Set<string>();

        for (const e of get().events) {
          const start = new Date(e.startAtISO);
          if (start.getFullYear() === y && start.getMonth() === m) {
            out.add(dayKey(start));
          }
        }

        return out;
      },
    }),
    {
      name: storageKey,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ events: state.events, version: state.version }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    },
  ),
);
