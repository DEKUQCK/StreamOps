"use client";

import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export function RosterRow({
  participant,
  updateParticipant,
  deleteParticipant,
}: {
  participant: {
    display_name: string;
    email: string | null;
    twitch_username: string | null;
    discord_user_id: string | null;
    portal_token: string;
  };
  updateParticipant: (formData: FormData) => Promise<void>;
  deleteParticipant: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="card p-4">
        <form
          action={async (formData) => {
            await updateParticipant(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <input
            name="display_name"
            required
            defaultValue={participant.display_name}
            placeholder="Anzeigename"
            className="input"
          />
          <input
            name="twitch_username"
            defaultValue={participant.twitch_username ?? ""}
            placeholder="Twitch-Username"
            className="input"
          />
          <input
            name="email"
            type="email"
            defaultValue={participant.email ?? ""}
            placeholder="E-Mail"
            className="input"
          />
          <input
            name="discord_user_id"
            defaultValue={participant.discord_user_id ?? ""}
            placeholder="Discord-User-ID"
            className="input"
          />
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
      </li>
    );
  }

  return (
    <li className="card flex items-start justify-between gap-3 px-4 py-3.5">
      <div>
        <p className="font-medium">{participant.display_name}</p>
        <p className="text-xs text-muted-foreground">
          {[
            participant.twitch_username && `Twitch: ${participant.twitch_username}`,
            participant.email,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1.5 break-all text-xs text-muted-foreground">
          Kalender-Link: /my-events/{participant.portal_token}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => setEditing(true)} className="btn-secondary px-2.5 py-1 text-xs">
          Bearbeiten
        </button>
        <ConfirmDeleteButton
          action={deleteParticipant}
          confirmMessage={`${participant.display_name} wirklich aus dem Roster löschen? Alle Event-Einladungen dieser Person werden mitgelöscht.`}
          className="btn-danger px-2.5 py-1 text-xs"
        >
          Löschen
        </ConfirmDeleteButton>
      </div>
    </li>
  );
}
