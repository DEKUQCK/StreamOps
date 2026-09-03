"use client";

import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  live: "Live",
  completed: "Abgeschlossen",
  cancelled: "Abgesagt",
};

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventHeaderEditor({
  event,
  updateEvent,
  deleteEvent,
}: {
  event: {
    name: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
  };
  updateEvent: (formData: FormData) => Promise<void>;
  deleteEvent: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.starts_at
              ? new Date(event.starts_at).toLocaleString("de-DE")
              : "Termin offen"}
            {event.ends_at &&
              ` – ${new Date(event.ends_at).toLocaleString("de-DE")}`}
            {" · "}
            {STATUS_LABELS[event.status] ?? event.status}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setEditing(true)} className="btn-secondary px-3 py-1.5 text-xs">
            Bearbeiten
          </button>
          <ConfirmDeleteButton
            action={deleteEvent}
            confirmMessage="Event wirklich löschen? Alle Teilnehmer, Assets und die Sponsoren-Checkliste dieses Events werden mitgelöscht."
            className="btn-danger px-3 py-1.5 text-xs"
          >
            Löschen
          </ConfirmDeleteButton>
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateEvent(formData);
        setEditing(false);
      }}
      className="card flex flex-col gap-2 p-4"
    >
      <input
        name="name"
        required
        defaultValue={event.name}
        placeholder="Event-Name"
        className="input"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="label-xs">
          Start
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={toDatetimeLocalValue(event.starts_at)}
            className="input mt-1"
          />
        </label>
        <label className="label-xs">
          Ende
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={toDatetimeLocalValue(event.ends_at)}
            className="input mt-1"
          />
        </label>
      </div>
      <label className="label-xs">
        Status
        <select name="status" defaultValue={event.status} className="input mt-1">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-1 flex gap-2">
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
          Speichern
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
