import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { acceptInvite, createOrganization } from "../dashboard/actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  const { data: pendingInvites } = await supabase
    .from("organization_invites")
    .select("id, organization_id, organizations(name)")
    .is("accepted_at", null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-semibold tracking-tight">
          Stream<span className="text-primary">Ops</span>
        </span>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-24">
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="card w-full max-w-sm p-6">
            <h1 className="text-xl font-semibold">Du wurdest eingeladen</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tritt einer bestehenden Organisation bei:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {pendingInvites.map((invite) => {
                const orgName = (
                  invite as unknown as { organizations: { name: string } }
                ).organizations.name;
                return (
                  <form key={invite.id} action={acceptInvite.bind(null, invite.id)}>
                    <button
                      type="submit"
                      className="btn-primary w-full justify-between"
                    >
                      <span>{orgName}</span>
                      <span>Beitreten</span>
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        )}

        <div className="card w-full max-w-sm p-6">
          <h1 className="text-xl font-semibold">
            {pendingInvites && pendingInvites.length > 0
              ? "Oder eigene Organisation anlegen"
              : "Willkommen bei StreamOps"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Lege eure Agentur/Organisation an, um Events zu verwalten.
          </p>
          <form action={createOrganization} className="mt-6 flex flex-col gap-3">
            <input
              name="name"
              required
              placeholder="z. B. Freaks 4U Gaming"
              className="input"
            />
            <button type="submit" className="btn-primary">
              Organisation anlegen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
