import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { de } from "date-fns/locale";
import type { CalendarEvent } from "./types";

export function YearView({
  anchorDate,
  events,
  onSelectMonth,
}: {
  anchorDate: Date;
  events: CalendarEvent[];
  onSelectMonth: (date: Date) => void;
}) {
  const yearStart = startOfYear(anchorDate);
  const months = Array.from({ length: 12 }, (_, i) => setMonth(yearStart, i));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((monthDate) => {
        const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
        const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

        return (
          <button
            key={monthDate.toISOString()}
            onClick={() => onSelectMonth(monthDate)}
            className="card p-3 text-left hover:border-primary/50"
          >
            <p className="text-sm font-semibold capitalize">
              {format(monthDate, "LLLL", { locale: de })}
            </p>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[10px] text-muted-foreground">
              {days.map((day) => {
                const hasEvent = events.some((e) => isSameDay(e.start, day));
                const inMonth = isSameMonth(day, monthDate);
                return (
                  <span
                    key={day.toISOString()}
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      inMonth ? "" : "opacity-30",
                      isToday(day) ? "bg-primary text-primary-foreground" : "",
                      hasEvent && !isToday(day) ? "bg-primary/20 text-primary" : "",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
