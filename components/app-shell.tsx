"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  LoaderCircle,
  Bell,
  CreditCard,
  HeartPulse,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
} from "lucide-react";
import { SidebarCalendar } from "@/components/sidebar-calendar";
import { SignOutButton } from "@/components/sign-out-button";
import { LanguageToggle } from "@/components/language-toggle";
import type { Locale } from "@/lib/i18n";
import type { Role, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const adminNavItems: Record<Locale, Array<{ href: string; label: string; icon: typeof LayoutDashboard }>> = {
  ms: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/approvals", label: "Kelulusan", icon: ShieldCheck },
    { href: "/admin/residents", label: "Penduduk", icon: UserCircle2 },
    { href: "/admin/search", label: "Carian", icon: Search },
    { href: "/admin/reports", label: "Laporan", icon: ReceiptText },
    { href: "/admin/health", label: "Kesihatan", icon: HeartPulse },
    { href: "/admin/activity", label: "Aktiviti", icon: Activity },
    { href: "/admin/announcements", label: "Notis", icon: Megaphone },
    { href: "/admin/users", label: "Akaun", icon: Users },
    { href: "/admin/settings", label: "Tetapan", icon: Settings },
  ],
  en: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck },
    { href: "/admin/residents", label: "Residents", icon: UserCircle2 },
    { href: "/admin/search", label: "Search", icon: Search },
    { href: "/admin/reports", label: "Reports", icon: ReceiptText },
    { href: "/admin/health", label: "Health", icon: HeartPulse },
    { href: "/admin/activity", label: "Activity", icon: Activity },
    { href: "/admin/announcements", label: "Notices", icon: Megaphone },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

const userNavItems: Record<Locale, Array<{ href: string; label: string; icon: typeof LayoutDashboard }>> = {
  ms: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/payments", label: "Bayaran", icon: CreditCard },
    { href: "/notifications", label: "Notifikasi", icon: Bell },
    { href: "/profile", label: "Profil", icon: UserCircle2 },
  ],
  en: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: UserCircle2 },
  ],
};

const shellCopy: Record<Locale, {
  skip: string;
  adminTitle: string;
  residentTitle: string;
  signedIn: string;
  adminMenu: string;
  residentMenu: string;
  quickNoteTitle: string;
  adminQuickNote: string;
  residentQuickNote: string;
  loadingLabel: string;
  loadingTitle: string;
  loadingBody: string;
}> = {
  ms: {
    skip: "Langkau ke kandungan utama",
    adminTitle: "Panel Jawatankuasa",
    residentTitle: "Portal Penduduk",
    signedIn: "Log masuk sebagai",
    adminMenu: "Alat admin",
    residentMenu: "Menu penduduk",
    quickNoteTitle: "Nota ringkas",
    adminQuickNote: "Muat naik baharu akan muncul di sini secara automatik setiap 30 saat.",
    residentQuickNote: "Muat naik resit selepas membuat bayaran supaya jawatankuasa boleh semak dengan cepat.",
    loadingLabel: "Membuka halaman",
    loadingTitle: "Memuatkan",
    loadingBody: "Sila tunggu seketika sementara sistem memuatkan maklumat terkini.",
  },
  en: {
    skip: "Skip to main content",
    adminTitle: "Committee Panel",
    residentTitle: "Resident Portal",
    signedIn: "Signed in as",
    adminMenu: "Admin tools",
    residentMenu: "Resident menu",
    quickNoteTitle: "Quick note",
    adminQuickNote: "New uploads appear here automatically every 30 seconds.",
    residentQuickNote: "Upload your receipt after payment so the committee can review it quickly.",
    loadingLabel: "Opening page",
    loadingTitle: "Loading",
    loadingBody: "Please wait while the portal loads the latest information.",
  },
};

export function AppShell({
  profile,
  badgeCounts,
  locale,
  children,
}: {
  profile: UserProfile;
  badgeCounts?: Partial<Record<"notifications" | "approvals", number>>;
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const copy = shellCopy[locale];
  const items = profile.role === "admin" ? adminNavItems[locale] : userNavItems[locale];
  const printOnlyReportRoute =
    profile.role === "admin" && pathname.startsWith("/admin/reports");
  const activeLoadingItem = useMemo(
    () => items.find((item) => item.href === loadingHref) ?? null,
    [items, loadingHref],
  );

  useEffect(() => {
    setLoadingHref(null);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-hero-glow">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white focus:not-sr-only"
      >
        {copy.skip}
      </a>
      <div
        className={`mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-7 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-8 ${
          printOnlyReportRoute ? "print:max-w-none print:px-0 print:py-0" : ""
        }`}
      >
        <aside
          className={`min-w-0 shrink-0 rounded-4xl border border-line bg-surface/95 p-5 shadow-soft backdrop-blur lg:sticky lg:top-8 lg:w-80 ${
            printOnlyReportRoute ? "print:hidden" : ""
          }`}
        >
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
              Desa Tanjung
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-slate-950">
              {profile.role === "admin" ? copy.adminTitle : copy.residentTitle}
            </h1>
            <p className="mt-3 text-base text-muted">
              {copy.signedIn} {profile.house_number} - {profile.name}
            </p>
          </div>

          <div className="mb-3 px-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {profile.role === "admin" ? copy.adminMenu : copy.residentMenu}
            </p>
          </div>

          <nav className="space-y-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => {
                    if (item.href !== pathname) {
                      setLoadingHref(item.href);
                    }
                  }}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-3xl px-4 py-3 text-base font-bold transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border border-slate-100 bg-white/85 text-slate-800 hover:bg-slate-50",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {loadingHref === item.href ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span className="flex flex-1 items-center justify-between gap-3">
                    <span>{item.label}</span>
                    {profile.role === "user" && item.href === "/notifications" && (badgeCounts?.notifications ?? 0) > 0 ? (
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900",
                      )}>
                        {badgeCounts?.notifications}
                      </span>
                    ) : null}
                    {profile.role === "admin" && item.href === "/admin/approvals" && (badgeCounts?.approvals ?? 0) > 0 ? (
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900",
                      )}>
                        {badgeCounts?.approvals}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-7 rounded-3xl border border-slate-100 bg-white/90 p-5">
            <p className="text-base font-bold text-slate-950">
              {copy.quickNoteTitle}
            </p>
            <p className="mt-2 text-base text-muted">
              {profile.role === "admin"
                ? copy.adminQuickNote
                : copy.residentQuickNote}
            </p>
          </div>

          <SidebarCalendar />

          <LanguageToggle locale={locale} />

          <div className="mt-7">
            <SignOutButton locale={locale} />
          </div>
        </aside>

        <div className={`relative min-w-0 w-full max-w-full flex-1 ${printOnlyReportRoute ? "print:w-full" : ""}`}>
          {loadingHref ? (
            <div className="pointer-events-none absolute inset-0 z-20 rounded-4xl bg-white/72 backdrop-blur-[2px] print:hidden">
              <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
                <div className="w-full max-w-md rounded-4xl border border-line bg-white px-6 py-7 text-center shadow-soft">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                    <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
                  </div>
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">
                    {copy.loadingLabel}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                    {activeLoadingItem?.label ?? copy.loadingTitle}
                  </h3>
                  <p className="mt-3 text-base leading-8 text-slate-600">
                    {copy.loadingBody}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <main
            id="main-content"
            aria-busy={loadingHref ? "true" : "false"}
            className="min-w-0 max-w-full overflow-x-clip"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
