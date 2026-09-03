import Link from "next/link";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import type { CalendarEvent } from "./types";

export function WeekView({
  anchorDate,
  events,
}: {
  anchorDate: Date;
  events: CalendarEvent[];
}) {
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((e) => isSameDay(e.start, day))
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        return (
          <div key={day.toISOString()} className="card p-3">
            <p className="label-xs">{format(day, "EEEE", { locale: de })}</p>
            <p
              className={`mt-0.5 text-lg font-semibold ${
                isToday(day) ? "text-primary" : ""
              }`}
            >
              {format(day, "d. MMM", { locale: de })}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Events</p>
              ) : (
                dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="block rounded-md bg-primary/15 px-2 py-1.5 text-xs text-primary hover:bg-primary/25"
                  >
                    <span className="font-medium">
                      {format(event.start, "HH:mm")}
                    </span>{" "}
                    {event.title}
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function formatWeekLabel(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, "d. MMM", { locale: de })} – ${format(end, "d. MMM yyyy", { locale: de })} (KW ${getISOWeek(date)})`;
}
