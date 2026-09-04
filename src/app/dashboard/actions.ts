"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

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

/**
 * An event is organized by exactly one of: an organization the caller is a
 * member of, or the caller themself (a solo creator). `organizer` carries
 * that choice from the form as "self" or "org:<id>".
 */
export async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "") || null;
  const endsAt = String(formData.get("ends_at") ?? "") || null;
  const organizer = String(formData.get("organizer") ?? "self");
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const organizationId = organizer.startsWith("org:")
    ? Number(organizer.slice(4))
    : null;

  const { error } = await supabase.from("events").insert({
    name,
    starts_at: startsAt,
    ends_at: endsAt,
    organization_id: organizationId,
    organizer_user_id: organizationId ? null : user.id,
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

/**
 * Invite anyone by email to a specific event - they don't need to be in
 * any roster or organization, and don't need an account yet. They'll get
 * an event_invites row now and become an event_participants row once they
 * sign in and accept it (see acceptEventInvite).
 */
export async function inviteToEvent(eventId: number, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase.from("event_invites").insert({
    event_id: eventId,
    email,
    invited_by: user.id,
  });
  if (error) throw new Error(error.message);

  // Best-effort: this doubles as both the "you've been invited" notice and
  // a login link, so the invitee actually finds out - without it they'd
  // only learn about the invite by happening to log in themselves, or (at
  // the earliest) from the Discord reminder 48h before their slot.
  const origin = await getOrigin();
  await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function cancelEventInvite(eventId: number, inviteId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_invites")
    .delete()
    .eq("id", inviteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function acceptEventInvite(inviteId: number) {
  const supabase = await createClient();
  const { data: eventId, error } = await supabase.rpc("accept_event_invite", {
    p_invite_id: inviteId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-events");
  if (eventId) redirect(`/dashboard/events/${eventId}`);
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

/**
 * A participant updates their own RSVP - allowed by
 * event_participants_self_update_rsvp regardless of who organizes the
 * event, since it's keyed on auth.uid() rather than an org role.
 */
export async function updateRsvpStatus(
  eventId: number,
  eventParticipantId: number,
  status: "confirmed" | "declined",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_participants")
    .update({ rsvp_status: status })
    .eq("id", eventParticipantId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard/my-events");
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

/**
 * A participant marks their own checklist status - RLS
 * (checklist_status_self_all) scopes this to rows on their own
 * event_participants row, same as an organizer marking it on their behalf.
 */
export async function setChecklistItemComplete(
  eventId: number,
  eventParticipantId: number,
  checklistItemId: number,
  completed: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_participant_checklist_status")
    .upsert(
      {
        event_participant_id: eventParticipantId,
        checklist_item_id: checklistItemId,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "event_participant_id,checklist_item_id" },
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard/my-events");
}
