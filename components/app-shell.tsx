"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, ShieldCheck, UserCircle2, Users } from "lucide-react";
import { SidebarCalendar } from "@/components/sidebar-calendar";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems: Record<
  Role,
  Array<{ href: string; label: string; icon: typeof LayoutDashboard }>
> = {
  user: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/profile", label: "Profile", icon: UserCircle2 },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck },
    { href: "/admin/residents", label: "Residents", icon: UserCircle2 },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
};

export function AppShell({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navItems[profile.role];

  return (
    <div className="min-h-screen bg-hero-glow">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-8">
        <aside className="rounded-4xl border border-line bg-surface/90 p-5 shadow-soft backdrop-blur lg:sticky lg:top-8 lg:w-80">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Desa Tanjung
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-slate-950">
              {profile.role === "admin" ? "Committee Panel" : "Resident Portal"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Signed in as {profile.house_number} · {profile.name}
            </p>
          </div>

          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Quick note</p>
            <p className="mt-2 text-sm text-muted">
              {profile.role === "admin"
                ? "New uploads appear here automatically every 30 seconds."
                : "Upload your receipt after each transfer so the committee can verify it quickly."}
            </p>
          </div>

          <SidebarCalendar />

          <div className="mt-6">
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
