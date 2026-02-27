export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startAtISO: string;
  endAtISO: string;
  createdAtISO: string;
};

export type CalendarEventDraft = Omit<CalendarEvent, "id" | "createdAtISO">;
