import Link from "next/link";
import { KeyRound, MapPinned, Phone, UserRound } from "lucide-react";
import { formatMalaysianPhoneNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { requireUserProfile } from "@/lib/data";
import { getResidentNotifications } from "@/lib/user-data";
import { updateProfileAction } from "@/lib/actions";
import { getLocale } from "@/lib/i18n";

const profileCopy = {
  ms: {
    eyebrow: "Profil",
    title: "Maklumat penduduk",
    intro: "Semak maklumat rumah, nombor telefon, dan pastikan profil anda sentiasa terkini.",
    notice: "Pastikan nombor telefon dan alamat betul supaya jawatankuasa boleh menghubungi anda jika ada isu bayaran, notis penyelenggaraan, atau makluman penting.",
    houseNumber: "Nombor rumah",
    ownerName: "Nama pemilik",
    address: "Alamat",
    phone: "Nombor telefon",
    notSaved: "Belum disimpan",
    updateProfile: "Kemas kini profil",
    editTitle: "Edit maklumat penduduk",
    editIntro: "Kemas kini nama pemilik, alamat rumah, dan nombor telefon jika ada perubahan.",
    username: "Nombor rumah / Username",
    homeAddress: "Alamat rumah",
    phoneHelp: "Gunakan format nombor telefon Malaysia seperti 012-345 6789.",
    saving: "Menyimpan profil...",
    save: "Simpan perubahan profil",
    profileStatus: "Status profil",
    complete: "Maklumat sudah lengkap",
    completePhone: "Lengkapkan nombor telefon",
    completeHelp: "Nombor telefon anda sudah disimpan, jadi jawatankuasa boleh menghubungi anda jika perlu.",
    missingHelp: "Tambah nombor telefon supaya jawatankuasa mudah menghubungi anda untuk bayaran atau makluman komuniti.",
    security: "Keselamatan",
    changePassword: "Tukar kata laluan",
    passwordHelp: "Anda boleh tukar kata laluan jika mahu kemas kini keselamatan akaun.",
  },
  en: {
    eyebrow: "Profile",
    title: "Resident details",
    intro: "Check your house details, phone number, and keep your profile up to date.",
    notice: "Make sure your phone number and address are correct so the committee can contact you about payment issues, maintenance notices, or important updates.",
    houseNumber: "House number",
    ownerName: "Owner name",
    address: "Address",
    phone: "Phone number",
    notSaved: "Not saved",
    updateProfile: "Update profile",
    editTitle: "Edit resident details",
    editIntro: "Update the owner name, house address, and phone number if anything changes.",
    username: "House number / Username",
    homeAddress: "House address",
    phoneHelp: "Use a Malaysian phone format such as 012-345 6789.",
    saving: "Saving profile...",
    save: "Save profile changes",
    profileStatus: "Profile status",
    complete: "Details are complete",
    completePhone: "Complete phone number",
    completeHelp: "Your phone number is saved, so the committee can contact you if needed.",
    missingHelp: "Add a phone number so the committee can contact you about payments or community updates.",
    security: "Security",
    changePassword: "Change password",
    passwordHelp: "You can change your password if you want to update account security.",
  },
} as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const [profile, locale] = await Promise.all([requireUserProfile(), getLocale()]);
  const copy = profileCopy[locale];
  const notifications = await getResidentNotifications(profile.id, 3);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} locale={locale} />
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          {copy.intro}
        </p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-700 sm:px-5 sm:leading-8">
        {copy.notice}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">{copy.houseNumber}</p>
          <p className="break-words font-display text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {profile.house_number}
          </p>
        </Card>
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">{copy.ownerName}</p>
          <p className="break-words text-2xl font-bold leading-tight text-slate-950">{profile.name}</p>
        </Card>
        <Card>
          <MapPinned className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">{copy.address}</p>
          <p className="break-words text-2xl font-bold leading-tight text-slate-950">{profile.address}</p>
        </Card>
        <Card>
          <Phone className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">{copy.phone}</p>
          <p className="break-words text-2xl font-bold leading-tight text-slate-950">
            {profile.phone_number
              ? formatMalaysianPhoneNumber(profile.phone_number)
              : copy.notSaved}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="h-full">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.updateProfile}</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              {copy.editTitle}
            </h3>
            <p className="mt-2 text-base text-muted">
              {copy.editIntro}
            </p>
          </div>

          <form action={updateProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="profile-house-number" className="mb-2 block text-base font-bold text-slate-950">
                {copy.username}
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
                {copy.ownerName}
              </label>
              <input
                id="profile-name"
                name="name"
                autoComplete="name"
                required
                defaultValue={profile.name}
                className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="profile-address" className="mb-2 block text-base font-bold text-slate-950">
                {copy.homeAddress}
              </label>
              <input
                id="profile-address"
                name="address"
                autoComplete="street-address"
                required
                defaultValue={profile.address}
                className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-2 block text-base font-bold text-slate-950">
                {copy.phone}
              </label>
              <input
                id="profile-phone"
                name="phone_number"
                autoComplete="tel"
                inputMode="tel"
                required
                defaultValue={profile.phone_number ? formatMalaysianPhoneNumber(profile.phone_number) : ""}
                placeholder="012-345 6789"
                className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
              />
              <p className="mt-2 text-sm text-muted">{copy.phoneHelp}</p>
            </div>
            <div className="md:col-span-2">
              <FormSubmitButton className="min-h-14 px-6 py-3" pendingLabel={copy.saving}>
                {copy.save}
              </FormSubmitButton>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-slate-50/80">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.profileStatus}</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              {profile.phone_number ? copy.complete : copy.completePhone}
            </h3>
            <p className="mt-3 text-base text-slate-700">
              {profile.phone_number
                ? copy.completeHelp
                : copy.missingHelp}
            </p>
          </Card>

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{copy.security}</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                {copy.changePassword}
              </h3>
              <p className="mt-2 text-base text-muted">
                {copy.passwordHelp}
              </p>
            </div>
            <Link
              href="/change-password"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white sm:w-auto"
            >
              <KeyRound className="h-4 w-4" />
              {copy.changePassword}
            </Link>
          </Card>

          <ResidentNotificationList notifications={notifications} compact locale={locale} />
        </div>
      </div>
    </div>
  );
}
