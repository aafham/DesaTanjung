import Link from "next/link";
import { KeyRound, MapPinned, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUserProfile } from "@/lib/data";

export default async function ProfilePage() {
  const profile = await requireUserProfile();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.18em] text-primary">Profile</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
          Resident details
        </h2>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm text-muted">House number</p>
          <p className="font-display text-2xl font-bold text-slate-950">
            {profile.house_number}
          </p>
        </Card>
        <Card>
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm text-muted">Owner name</p>
          <p className="font-semibold text-slate-950">{profile.name}</p>
        </Card>
        <Card>
          <MapPinned className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm text-muted">Address</p>
          <p className="font-semibold text-slate-950">{profile.address}</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Security</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Change password
          </h3>
          <p className="mt-2 text-sm text-muted">
            You can reopen the password reset screen whenever you need a fresh password.
          </p>
        </div>
        <Link
          href="/change-password"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          <KeyRound className="h-4 w-4" />
          Update password
        </Link>
      </Card>
    </div>
  );
}
