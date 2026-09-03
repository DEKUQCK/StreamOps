import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Every dashboard page needs the caller's organization_id, and a user who
 * hasn't joined one yet (pending invite, brand new signup) must never see
 * a page built on the assumption that one exists - only .single() would
 * throw for that case, which surfaced as an unhandled 406 crash. Checking
 * the array ourselves and redirecting is what actually guards each page,
 * regardless of whatever the layout above it does.
 */
export async function requireOrganizationId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  const organizationId = data?.[0]?.organization_id;
  if (organizationId == null) {
    redirect("/onboarding");
  }
  return organizationId;
}
