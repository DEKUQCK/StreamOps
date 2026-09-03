"use client";

import { useState } from "react";
import { addMonths, addWeeks, addYears, format } from "date-fns";
import { de } from "date-fns/locale";
import { MonthView, formatMonthLabel } from "./month-view";
import { WeekView, formatWeekLabel } from "./week-view";
import { YearView } from "./year-view";
import type { CalendarEvent, CalendarViewMode } from "./types";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  month: "Monat",
  week: "Woche",
  year: "Jahr",
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  function goToday() {
    setAnchorDate(new Date());
  }

  function goPrev() {
    setAnchorDate((d) =>
      view === "month" ? addMonths(d, -1) : view === "week" ? addWeeks(d, -1) : addYears(d, -1),
    );
  }

  function goNext() {
    setAnchorDate((d) =>
      view === "month" ? addMonths(d, 1) : view === "week" ? addWeeks(d, 1) : addYears(d, 1),
    );
  }

  const label =
    view === "month"
      ? formatMonthLabel(anchorDate)
      : view === "week"
        ? formatWeekLabel(anchorDate)
        : format(anchorDate, "yyyy", { locale: de });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} aria-label="Zurück" className="btn-secondary px-2.5 py-1.5">
            ‹
          </button>
          <button onClick={goToday} className="btn-secondary px-3 py-1.5 text-sm">
            Heute
          </button>
          <button onClick={goNext} aria-label="Weiter" className="btn-secondary px-2.5 py-1.5">
            ›
          </button>
          <span className="ml-2 text-sm font-semibold capitalize">{label}</span>
        </div>

        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && <MonthView anchorDate={anchorDate} events={events} />}
      {view === "week" && <WeekView anchorDate={anchorDate} events={events} />}
      {view === "year" && (
        <YearView
          anchorDate={anchorDate}
          events={events}
          onSelectMonth={(date) => {
            setAnchorDate(date);
            setView("month");
          }}
        />
      )}
    </div>
  );
}
