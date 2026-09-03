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
  redirect("/dashboard");
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

export async function acceptInvite(inviteId: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_organization_invite", {
    p_invite_id: inviteId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function inviteTeamMember(organizationId: number, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase.from("organization_invites").insert({
    organization_id: organizationId,
    email,
    invited_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/team");
}

export async function cancelInvite(inviteId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/team");
}

export async function removeTeamMember(organizationId: number, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/team");
}

export async function updateEvent(eventId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "") || null;
  const endsAt = String(formData.get("ends_at") ?? "") || null;
  const status = String(formData.get("status") ?? "draft");
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ name, starts_at: startsAt, ends_at: endsAt, status })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
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

export async function updateParticipant(participantId: number, formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "") || null;
  const twitchUsername = String(formData.get("twitch_username") ?? "") || null;
  const discordUserId = String(formData.get("discord_user_id") ?? "") || null;
  if (!displayName) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("participants")
    .update({
      display_name: displayName,
      email,
      twitch_username: twitchUsername,
      discord_user_id: discordUserId,
    })
    .eq("id", participantId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/roster");
}

export async function deleteParticipant(participantId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId);
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

export async function updateEventParticipantSlot(
  eventId: number,
  eventParticipantId: number,
  formData: FormData,
) {
  const slotStartsAt = String(formData.get("slot_starts_at") ?? "") || null;
  const slotEndsAt = String(formData.get("slot_ends_at") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_participants")
    .update({ slot_starts_at: slotStartsAt, slot_ends_at: slotEndsAt })
    .eq("id", eventParticipantId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function removeEventParticipant(
  eventId: number,
  eventParticipantId: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("id", eventParticipantId);
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

export async function deleteEventAsset(eventId: number, assetId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_assets")
    .delete()
    .eq("id", assetId);
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

export async function deleteChecklistItem(eventId: number, itemId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sponsor_checklist_items")
    .delete()
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}
