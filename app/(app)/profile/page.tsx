import Link from "next/link";
import { KeyRound, MapPinned, Phone, UserRound } from "lucide-react";
import { formatMalaysianPhoneNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { requireUserProfile } from "@/lib/data";
import { updateProfileAction } from "@/lib/actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireUserProfile();

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Profile</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Resident details
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Check your registered house details, phone number, and keep your profile up to date.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
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
        <Card>
          <Phone className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Phone number</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">
            {profile.phone_number
              ? formatMalaysianPhoneNumber(profile.phone_number)
              : "Not saved yet"}
          </p>
        </Card>
      </div>

      <Card>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Update profile</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
            Edit your resident information
          </h3>
          <p className="mt-2 text-base text-muted">
            Keep your owner name, house address, and phone number current so the committee can contact you if needed.
          </p>
        </div>

        <form action={updateProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="profile-house-number" className="mb-2 block text-base font-bold text-slate-950">
              House number / Username
            </label>
            <input
              id="profile-house-number"
              value={profile.house_number}
              disabled
              className="min-h-14 w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-base text-slate-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="profile-name" className="mb-2 block text-base font-bold text-slate-950">
              Owner name
            </label>
            <input
              id="profile-name"
              name="name"
              required
              defaultValue={profile.name}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="profile-address" className="mb-2 block text-base font-bold text-slate-950">
              House address
            </label>
            <input
              id="profile-address"
              name="address"
              required
              defaultValue={profile.address}
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="mb-2 block text-base font-bold text-slate-950">
              Phone number
            </label>
            <input
              id="profile-phone"
              name="phone_number"
              required
              defaultValue={profile.phone_number ? formatMalaysianPhoneNumber(profile.phone_number) : ""}
              placeholder="012-345 6789"
              className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
            />
            <p className="mt-2 text-sm text-muted">Use Malaysian mobile format such as 012-345 6789.</p>
          </div>
          <div className="md:col-span-2">
            <FormSubmitButton className="min-h-14 px-6 py-3" pendingLabel="Saving profile...">
              Save profile changes
            </FormSubmitButton>
          </div>
        </form>
      </Card>

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
