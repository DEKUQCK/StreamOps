import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // No organization is a valid state now - a solo creator can organize
  // their own events without ever joining or creating one.
  const hasOrganization = Boolean(memberships && memberships.length > 0);

  const links = [
    { href: "/dashboard", label: "Events" },
    { href: "/dashboard/my-events", label: "Meine Events" },
    { href: "/dashboard/calendar", label: "Kalender" },
    hasOrganization
      ? { href: "/dashboard/team", label: "Team" }
      : { href: "/onboarding", label: "Organisation gründen" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Stream<span className="text-primary">Ops</span>
          </Link>
          <DashboardNav links={links} email={user.email ?? ""} signOut={signOut} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
