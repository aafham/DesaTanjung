import Link from "next/link";
import { KeyRound, MapPinned, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUserProfile } from "@/lib/data";

export default async function ProfilePage() {
  const profile = await requireUserProfile();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Profile</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Resident details
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Check your registered house details and update password when needed.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">House number</p>
          <p className="font-display text-4xl font-bold leading-tight text-slate-950">
            {profile.house_number}
          </p>
        </Card>
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Owner name</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">{profile.name}</p>
        </Card>
        <Card>
          <MapPinned className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Address</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">{profile.address}</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Security</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Change password
          </h3>
          <p className="mt-2 text-base text-muted">
            You can reopen the password reset screen whenever you need a fresh password.
          </p>
        </div>
        <Link
          href="/change-password"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white"
        >
          <KeyRound className="h-4 w-4" />
          Update password
        </Link>
      </Card>
    </div>
  );
}
