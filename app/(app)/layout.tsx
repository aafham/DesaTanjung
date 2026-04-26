import { AppShell } from "@/components/app-shell";
import { getAppShellBadgeCounts, requireUserProfile } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, locale] = await Promise.all([requireUserProfile(), getLocale()]);
  const badgeCounts = await getAppShellBadgeCounts(profile);

  return <AppShell profile={profile} badgeCounts={badgeCounts} locale={locale}>{children}</AppShell>;
}
