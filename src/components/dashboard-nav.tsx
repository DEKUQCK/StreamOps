"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function DashboardNav({
  links,
  email,
  signOut,
}: {
  links: NavLink[];
  email: string;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive(pathname, link.href)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-2 flex items-center gap-2">
          <ThemeToggle />

          <div className="relative hidden sm:block">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium uppercase text-foreground hover:bg-border"
              aria-label="Konto-Menü"
            >
              {email.charAt(0)}
            </button>
            {userMenuOpen && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  aria-hidden
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="card absolute right-0 z-20 mt-2 w-56 p-2">
                  <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                    {email}
                  </p>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                  >
                    Profil
                  </Link>
                  <form action={signOut}>
                    <button className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                      Abmelden
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted sm:hidden"
            aria-label="Menü"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default sm:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div className="card absolute right-0 left-0 z-20 mt-2 flex flex-col gap-1 p-2 sm:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isActive(pathname, link.href)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <p className="truncate px-3 py-1 text-xs text-muted-foreground">
                {email}
              </p>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Profil
              </Link>
              <form action={signOut}>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
