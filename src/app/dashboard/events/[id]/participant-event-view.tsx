"use client";

import { useState } from "react";
import { SensitiveField } from "@/components/sensitive-field";

const ASSET_TYPE_LABELS: Record<string, string> = {
  overlay_url: "Overlay-URL",
  stream_title: "Stream-Titel",
  rules: "Regeln",
  server_ip: "Server-IP",
  server_password: "Server-Passwort",
  discord_invite: "Discord-Invite",
  other: "Sonstiges",
};

const RSVP_LABELS: Record<string, string> = {
  invited: "Eingeladen",
  confirmed: "Zugesagt",
  declined: "Abgesagt",
  cancelled: "Storniert",
};

export type ParticipantAsset = {
  id: number;
  asset_type: string;
  label: string;
  value: string;
  is_sensitive: boolean;
};

export type ParticipantChecklistItem = {
  id: number;
  sponsor_name: string;
  description: string;
  due_at: string | null;
  completed_at: string | null;
};

export function ParticipantEventView({
  eventName,
  rsvpStatus,
  slotStartsAt,
  slotEndsAt,
  assets,
  checklist,
  updateRsvp,
  setChecklistItemComplete,
}: {
  eventName: string;
  rsvpStatus: string;
  slotStartsAt: string | null;
  slotEndsAt: string | null;
  assets: ParticipantAsset[];
  checklist: ParticipantChecklistItem[];
  updateRsvp: (status: "confirmed" | "declined") => Promise<void>;
  setChecklistItemComplete: (
    checklistItemId: number,
    completed: boolean,
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(rsvpStatus);
  const [items, setItems] = useState(checklist);
  const [pending, setPending] = useState(false);

  async function respond(next: "confirmed" | "declined") {
    setPending(true);
    await updateRsvp(next);
    setStatus(next);
    setPending(false);
  }

  async function toggle(itemId: number, completed: boolean) {
    await setChecklistItemComplete(itemId, completed);
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, completed_at: completed ? new Date().toISOString() : null }
          : item,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-xs">{eventName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Deine Teilnahme
        </h1>
        {slotStartsAt && (
          <p className="mt-1 text-sm text-muted-foreground">
            Dein Slot: {new Date(slotStartsAt).toLocaleString("de-DE")}
            {slotEndsAt && ` – ${new Date(slotEndsAt).toLocaleString("de-DE")}`}
          </p>
        )}
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Teilnahme</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Aktueller Status:{" "}
          <span className="font-medium text-foreground">
            {RSVP_LABELS[status] ?? status}
          </span>
        </p>
        <div className="mt-3 flex gap-2">
          <button disabled={pending} onClick={() => respond("confirmed")} className="btn-success">
            Zusagen
          </button>
          <button disabled={pending} onClick={() => respond("declined")} className="btn-danger">
            Absagen
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Deine Unterlagen</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sensible Felder sind ausgeblendet und verstecken sich automatisch
          wieder, sobald du das Fenster wechselst. Sie werden außerdem 24h
          nach Event-Ende automatisch gelöscht.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Unterlagen hinterlegt.
            </p>
          ) : (
            assets.map((asset) =>
              asset.is_sensitive ? (
                <SensitiveField
                  key={asset.id}
                  label={`${ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type} · ${asset.label}`}
                  value={asset.value}
                />
              ) : (
                <div key={asset.id} className="rounded-lg bg-muted px-3 py-2.5 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type} ·{" "}
                    {asset.label}
                  </p>
                  <p className="mt-0.5 break-words">{asset.value}</p>
                </div>
              ),
            )
          )}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Sponsoren-Checkliste</h2>
        <div className="mt-3 flex flex-col gap-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Sponsoren-Vorgaben.
            </p>
          ) : (
            items.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.completed_at)}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="font-medium">{item.sponsor_name}:</span>{" "}
                  {item.description}
                  {item.due_at && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (fällig {new Date(item.due_at).toLocaleString("de-DE")})
                    </span>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
