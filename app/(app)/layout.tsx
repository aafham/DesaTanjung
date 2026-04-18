import { AppShell } from "@/components/app-shell";
import { getAppShellBadgeCounts, requireUserProfile } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUserProfile();
  const badgeCounts = await getAppShellBadgeCounts(profile);

  return <AppShell profile={profile} badgeCounts={badgeCounts}>{children}</AppShell>;
}
