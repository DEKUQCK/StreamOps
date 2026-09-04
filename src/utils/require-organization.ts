import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Not every user belongs to an organization - a solo creator organizing
 * their own events is a fully valid state. Returns null rather than
 * redirecting so callers can render a solo-friendly page instead of
 * forcing everyone through org creation.
 */
export async function getOrganizationId(
  supabase: SupabaseClient<Database>,
  user: { id: string } | null,
): Promise<number | null> {
  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);

  return data?.[0]?.organization_id ?? null;
}

/**
 * For pages that only make sense with an organization (e.g. team
 * management) - checking the array ourselves and redirecting rather than
 * using .single() is what guards this, since .single() 406s on 0 rows.
 */
export async function requireOrganizationId(
  supabase: SupabaseClient<Database>,
  user: { id: string } | null,
): Promise<number> {
  const organizationId = await getOrganizationId(supabase, user);
  if (organizationId == null) {
    redirect("/onboarding");
  }
  return organizationId;
}
