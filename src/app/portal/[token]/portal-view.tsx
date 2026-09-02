"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SensitiveField } from "./sensitive-field";

export type PortalAsset = {
  id: number;
  asset_type: string;
  label: string;
  value: string;
  is_sensitive: boolean;
};

export type PortalChecklistItem = {
  id: number;
  sponsor_name: string;
  description: string;
  due_at: string | null;
  completed_at: string | null;
};

export type PortalData = {
  participant: {
    display_name: string;
    rsvp_status: string;
    slot_starts_at: string | null;
    slot_ends_at: string | null;
  };
  event: {
    name: string;
    starts_at: string | null;
    ends_at: string | null;
  };
  assets: PortalAsset[];
  checklist: PortalChecklistItem[];
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  overlay_url: "Overlay-URL",
  stream_title: "Stream-Titel",
  rules: "Regeln",
  server_ip: "Server-IP",
  server_password: "Server-Passwort",
  discord_invite: "Discord-Invite",
  other: "Sonstiges",
};

export function PortalView({
  token,
  data,
}: {
  token: string;
  data: PortalData;
}) {
  const [rsvpStatus, setRsvpStatus] = useState(data.participant.rsvp_status);
  const [checklist, setChecklist] = useState(data.checklist);
  const [pending, setPending] = useState(false);

  async function respond(status: "confirmed" | "declined") {
    setPending(true);
    const supabase = createClient();
    const { data: ok } = await supabase.rpc("set_rsvp_status", {
      p_token: token,
      p_status: status,
    });
    if (ok) setRsvpStatus(status);
    setPending(false);
  }

  async function toggleChecklistItem(itemId: number) {
    const supabase = createClient();
    const { data: ok } = await supabase.rpc("complete_checklist_item", {
      p_token: token,
      p_checklist_item_id: itemId,
    });
    if (ok) {
      setChecklist((items) =>
        items.map((item) =>
          item.id === itemId
            ? { ...item, completed_at: new Date().toISOString() }
            : item,
        ),
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <p className="text-sm text-zinc-500">{data.event.name}</p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Hi {data.participant.display_name} 👋
        </h1>
        {data.participant.slot_starts_at && (
          <p className="mt-1 text-sm text-zinc-600">
            Dein Slot:{" "}
            {new Date(data.participant.slot_starts_at).toLocaleString("de-DE")}
          </p>
        )}
      </div>

      {/* RSVP */}
      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Teilnahme</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Aktueller Status:{" "}
          <span className="font-medium text-zinc-700">{rsvpStatus}</span>
        </p>
        <div className="mt-3 flex gap-2">
          <button
            disabled={pending}
            onClick={() => respond("confirmed")}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            Zusagen
          </button>
          <button
            disabled={pending}
            onClick={() => respond("declined")}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
          >
            Absagen
          </button>
        </div>
      </section>

      {/* Asset-Tresor / Stream-Proof Mode */}
      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Deine Unterlagen</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Sensible Felder sind ausgeblendet und verstecken sich automatisch
          wieder, sobald du das Fenster wechselst.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {data.assets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Noch keine Unterlagen hinterlegt.
            </p>
          ) : (
            data.assets.map((asset) =>
              asset.is_sensitive ? (
                <SensitiveField
                  key={asset.id}
                  label={`${ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type} · ${asset.label}`}
                  value={asset.value}
                />
              ) : (
                <div
                  key={asset.id}
                  className="rounded-md bg-zinc-50 px-3 py-2 text-sm"
                >
                  <p className="text-xs font-medium text-zinc-500">
                    {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type} ·{" "}
                    {asset.label}
                  </p>
                  <p className="mt-0.5 break-words text-zinc-800">
                    {asset.value}
                  </p>
                </div>
              ),
            )
          )}
        </div>
      </section>

      {/* Sponsoren-Checkliste */}
      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Sponsoren-Checkliste
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {checklist.length === 0 ? (
            <p className="text-sm text-zinc-500">Keine Vorgaben.</p>
          ) : (
            checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 rounded-md bg-zinc-50 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.completed_at)}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-zinc-900">
                    {item.sponsor_name}:
                  </span>{" "}
                  {item.description}
                  {item.due_at && (
                    <span className="ml-1 text-xs text-zinc-500">
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
