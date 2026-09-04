"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const twitchUsername = String(formData.get("twitch_username") ?? "") || null;
  if (!displayName) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, twitch_username: twitchUsername })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}
