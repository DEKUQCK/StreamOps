export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date | null;
  href: string;
  badge?: string;
};

export type CalendarViewMode = "month" | "week" | "year";
