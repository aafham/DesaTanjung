import { AppShell } from "@/components/app-shell";
import { requireUserProfile } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUserProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
