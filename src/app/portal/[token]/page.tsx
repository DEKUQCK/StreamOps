import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PortalView, type PortalData } from "./portal-view";

export default async function ParticipantPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_participant_portal", {
    p_token: token,
  });

  if (error || !data) {
    notFound();
  }

  return <PortalView token={token} data={data as unknown as PortalData} />;
}

export type { PortalData };
