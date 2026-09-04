"use client";

import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

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
  no_show: "Nicht erschienen",
};

const RSVP_BADGE_CLASS: Record<string, string> = {
  confirmed: "badge-success",
  declined: "badge-danger",
  cancelled: "badge-danger",
  no_show: "badge-danger",
};

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Asset = {
  id: number;
  asset_type: string;
  label: string;
  value: string;
  is_sensitive: boolean;
  deleteAction: () => Promise<void>;
};

export function ParticipantSlotCard({
  displayName,
  rsvpStatus,
  isWaitlist,
  slotStartsAt,
  slotEndsAt,
  assets,
  updateSlot,
  removeParticipant,
  addAsset,
  toggleWaitlist,
  markNoShow,
}: {
  displayName: string;
  rsvpStatus: string;
  isWaitlist: boolean;
  slotStartsAt: string | null;
  slotEndsAt: string | null;
  assets: Asset[];
  updateSlot: (formData: FormData) => Promise<void>;
  removeParticipant: () => Promise<void>;
  addAsset: (formData: FormData) => Promise<void>;
  toggleWaitlist: () => Promise<void>;
  markNoShow: () => Promise<void>;
}) {
  const [editingSlot, setEditingSlot] = useState(false);
  const canMarkNoShow = !["no_show", "declined", "cancelled"].includes(rsvpStatus);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{displayName}</p>
          {!editingSlot && (
            <p className="text-xs text-muted-foreground">
              {slotStartsAt
                ? new Date(slotStartsAt).toLocaleString("de-DE")
                : "Kein Slot gesetzt"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isWaitlist && <span className="badge">Warteliste</span>}
          <span className={`badge ${RSVP_BADGE_CLASS[rsvpStatus] ?? ""}`}>
            {RSVP_LABELS[rsvpStatus] ?? rsvpStatus}
          </span>
          <button
            onClick={() => setEditingSlot((v) => !v)}
            className="btn-secondary px-2.5 py-1 text-xs"
          >
            Slot
          </button>
          <ConfirmDeleteButton
            action={removeParticipant}
            confirmMessage={`${displayName} wirklich aus dem Event entfernen? Assets und Checklisten-Status für diese Person gehen dabei verloren.`}
            className="btn-danger px-2.5 py-1 text-xs"
          >
            Entfernen
          </ConfirmDeleteButton>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <button
          onClick={toggleWaitlist}
          className="text-muted-foreground hover:underline"
        >
          {isWaitlist ? "Nachrücken lassen" : "Auf Warteliste setzen"}
        </button>
        {canMarkNoShow && (
          <button onClick={markNoShow} className="text-muted-foreground hover:underline">
            Als No-Show markieren
          </button>
        )}
      </div>

      {editingSlot && (
        <form
          action={async (formData) => {
            await updateSlot(formData);
            setEditingSlot(false);
          }}
          className="mt-2 flex flex-wrap items-end gap-2 border-t border-border pt-2"
        >
          <label className="label-xs">
            Slot-Start
            <input
              type="datetime-local"
              name="slot_starts_at"
              defaultValue={toDatetimeLocalValue(slotStartsAt)}
              className="input mt-1"
            />
          </label>
          <label className="label-xs">
            Slot-Ende
            <input
              type="datetime-local"
              name="slot_ends_at"
              defaultValue={toDatetimeLocalValue(slotEndsAt)}
              className="input mt-1"
            />
          </label>
          <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
            Speichern
          </button>
        </form>
      )}

      {/* Asset-Tresor */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="label-xs">Asset-Tresor</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sensible Einträge werden 24h nach Event-Ende automatisch gelöscht.
        </p>
        {assets.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Noch keine Assets hinterlegt.
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-1">
          {assets.map((asset) => (
            <li key={asset.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="text-muted-foreground">
                  {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}:
                </span>{" "}
                {asset.label}
                {asset.is_sensitive && (
                  <span className="ml-1 text-xs text-warning-foreground">
                    (sensibel)
                  </span>
                )}
              </span>
              <ConfirmDeleteButton
                action={asset.deleteAction}
                confirmMessage={`Asset "${asset.label}" wirklich löschen?`}
                className="text-xs text-danger hover:underline"
              >
                Löschen
              </ConfirmDeleteButton>
            </li>
          ))}
        </ul>

        <form action={addAsset} className="mt-2 flex flex-wrap items-center gap-2">
          <select
            name="asset_type"
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="label"
            required
            placeholder="Beschriftung"
            className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
          />
          <input
            name="value"
            required
            placeholder="Wert"
            className="w-40 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" name="is_sensitive" />
            sensibel
          </label>
          <button type="submit" className="btn-primary px-3 py-1 text-xs">
            Hinzufügen
          </button>
        </form>
      </div>
    </div>
  );
}
