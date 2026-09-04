import { createClient } from "@/utils/supabase/server";
import { requireOrganizationId } from "@/utils/require-organization";
import { cancelInvite, inviteTeamMember, removeTeamMember } from "../actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  organizer: "Organizer",
};

type Member = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const organizationId = await requireOrganizationId(supabase, user);

  const [{ data: membersData }, { data: invites }] = await Promise.all([
    supabase.rpc("get_organization_members", {
      p_organization_id: organizationId,
    }),
    supabase
      .from("organization_invites")
      .select("id, email, created_at")
      .eq("organization_id", organizationId)
      .is("accepted_at", null)
      .order("created_at"),
  ]);

  const members = (membersData ?? []) as unknown as Member[];
  const inviteTeamMemberWithOrg = inviteTeamMember.bind(null, organizationId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wer in eurer Organisation Events verwalten kann.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-semibold">Mitglieder</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="card flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </p>
                  </div>
                  {member.user_id !== user!.id && (
                    <ConfirmDeleteButton
                      action={removeTeamMember.bind(null, organizationId, member.user_id)}
                      confirmMessage={`${member.email} wirklich aus dem Team entfernen?`}
                      className="btn-danger px-2.5 py-1 text-xs"
                    >
                      Entfernen
                    </ConfirmDeleteButton>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {invites && invites.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Ausstehende Einladungen</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="card flex items-center justify-between px-4 py-3"
                  >
                    <p className="text-sm">{invite.email}</p>
                    <ConfirmDeleteButton
                      action={cancelInvite.bind(null, invite.id)}
                      confirmMessage={`Einladung an ${invite.email} zurückziehen?`}
                      className="btn-secondary px-2.5 py-1 text-xs"
                    >
                      Zurückziehen
                    </ConfirmDeleteButton>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Kollegen einladen</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Die Person bekommt sofort eine Login-Mail, die gleichzeitig als
            Einladung dient - nach dem Anmelden tritt sie automatisch bei.
          </p>
          <form action={inviteTeamMemberWithOrg} className="mt-3 flex flex-col gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="kolleg:in@agentur.de"
              className="input"
            />
            <button type="submit" className="btn-primary mt-1">
              Einladen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
