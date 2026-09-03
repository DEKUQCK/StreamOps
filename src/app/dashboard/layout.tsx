import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
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

  if (!memberships || memberships.length === 0) {
    // A conditional early-return here would not stop Next.js from still
    // rendering/fetching the nested page (it resolves `children` before
    // this layout's body runs), which crashed on the organization-required
    // assumption in every dashboard page. redirect() properly aborts that.
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Stream<span className="text-primary">Ops</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Events
            </Link>
            <Link
              href="/dashboard/roster"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Streamer-Roster
            </Link>
            <Link
              href="/dashboard/calendar"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Kalender
            </Link>
            <Link
              href="/dashboard/team"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Team
            </Link>
            <span className="hidden text-muted-foreground sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <form action={signOut}>
              <button className="text-muted-foreground transition-colors hover:text-foreground">
                Abmelden
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
