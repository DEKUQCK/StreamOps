"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    p_name: name,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function createEvent(organizationId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "") || null;
  const endsAt = String(formData.get("ends_at") ?? "") || null;
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    organization_id: organizationId,
    name,
    starts_at: startsAt,
    ends_at: endsAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function addParticipantToRoster(
  organizationId: number,
  formData: FormData,
) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "") || null;
  const twitchUsername = String(formData.get("twitch_username") ?? "") || null;
  const discordUserId = String(formData.get("discord_user_id") ?? "") || null;
  if (!displayName) return;

  const supabase = await createClient();
  const { error } = await supabase.from("participants").insert({
    organization_id: organizationId,
    display_name: displayName,
    email,
    twitch_username: twitchUsername,
    discord_user_id: discordUserId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/roster");
}

export async function inviteParticipantToEvent(
  eventId: number,
  formData: FormData,
) {
  const participantId = Number(formData.get("participant_id"));
  const slotStartsAt = String(formData.get("slot_starts_at") ?? "") || null;
  const slotEndsAt = String(formData.get("slot_ends_at") ?? "") || null;
  if (!participantId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    participant_id: participantId,
    slot_starts_at: slotStartsAt,
    slot_ends_at: slotEndsAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function addEventAsset(
  eventId: number,
  eventParticipantId: number,
  formData: FormData,
) {
  const assetType = String(formData.get("asset_type") ?? "other");
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const isSensitive = formData.get("is_sensitive") === "on";
  if (!label || !value) return;

  const supabase = await createClient();
  const { error } = await supabase.from("event_assets").insert({
    event_participant_id: eventParticipantId,
    asset_type: assetType,
    label,
    value,
    is_sensitive: isSensitive,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function addSponsorChecklistItem(
  eventId: number,
  formData: FormData,
) {
  const sponsorName = String(formData.get("sponsor_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueAt = String(formData.get("due_at") ?? "") || null;
  if (!sponsorName || !description) return;

  const supabase = await createClient();
  const { error } = await supabase.from("sponsor_checklist_items").insert({
    event_id: eventId,
    sponsor_name: sponsorName,
    description,
    due_at: dueAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}
