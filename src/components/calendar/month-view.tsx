import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import type { CalendarEvent } from "./types";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function MonthView({
  anchorDate,
  events,
}: {
  anchorDate: Date;
  events: CalendarEvent[];
}) {
  const gridStart = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="bg-muted px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground"
        >
          {label}
        </div>
      ))}
      {days.map((day) => {
        const dayEvents = events.filter((e) => isSameDay(e.start, day));
        const inMonth = isSameMonth(day, anchorDate);
        return (
          <div
            key={day.toISOString()}
            className={`min-h-24 bg-card p-1.5 ${inMonth ? "" : "opacity-40"}`}
          >
            <p
              className={`text-xs ${
                isToday(day)
                  ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {format(day, "d")}
            </p>
            <div className="mt-1 flex flex-col gap-1">
              {dayEvents.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="block truncate rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary hover:bg-primary/25"
                  title={event.title}
                >
                  {event.title}
                </Link>
              ))}
              {dayEvents.length > 3 && (
                <p className="px-1.5 text-xs text-muted-foreground">
                  +{dayEvents.length - 3} weitere
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function formatMonthLabel(date: Date) {
  return format(date, "LLLL yyyy", { locale: de });
}
