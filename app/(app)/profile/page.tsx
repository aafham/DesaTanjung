import Link from "next/link";
import { KeyRound, MapPinned, Phone, UserRound } from "lucide-react";
import { formatMalaysianPhoneNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ResidentNotificationList } from "@/components/resident-notification-list";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageToast } from "@/components/page-toast";
import { getResidentNotifications, requireUserProfile } from "@/lib/data";
import { updateProfileAction } from "@/lib/actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireUserProfile();
  const notifications = await getResidentNotifications(profile.id, 3);

  return (
    <div className="space-y-6">
      <PageToast message={params.message} error={params.error} />
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Profil</p>
        <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-950">
          Maklumat penduduk
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Semak maklumat rumah, nombor telefon, dan pastikan profil anda sentiasa terkini.
        </p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-base leading-8 text-slate-700">
        Pastikan nombor telefon dan alamat betul supaya jawatankuasa boleh menghubungi anda jika ada isu bayaran, notis penyelenggaraan, atau makluman penting.
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Nombor rumah</p>
          <p className="font-display text-4xl font-bold leading-tight text-slate-950">
            {profile.house_number}
          </p>
        </Card>
        <Card>
          <UserRound className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Nama pemilik</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">{profile.name}</p>
        </Card>
        <Card>
          <MapPinned className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Alamat</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">{profile.address}</p>
        </Card>
        <Card>
          <Phone className="h-6 w-6 text-primary" />
          <p className="mt-4 text-base font-bold text-muted">Nombor telefon</p>
          <p className="text-2xl font-bold leading-tight text-slate-950">
            {profile.phone_number
              ? formatMalaysianPhoneNumber(profile.phone_number)
              : "Belum disimpan"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="h-full">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Kemas kini profil</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              Edit maklumat penduduk
            </h3>
            <p className="mt-2 text-base text-muted">
              Kemas kini nama pemilik, alamat rumah, dan nombor telefon jika ada perubahan.
            </p>
          </div>

          <form action={updateProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="profile-house-number" className="mb-2 block text-base font-bold text-slate-950">
                Nombor rumah / Username
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
                Nama pemilik
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
                Alamat rumah
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
                Nombor telefon
              </label>
              <input
                id="profile-phone"
                name="phone_number"
                required
                defaultValue={profile.phone_number ? formatMalaysianPhoneNumber(profile.phone_number) : ""}
                placeholder="012-345 6789"
                className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
              />
              <p className="mt-2 text-sm text-muted">Gunakan format nombor telefon Malaysia seperti 012-345 6789.</p>
            </div>
            <div className="md:col-span-2">
              <FormSubmitButton className="min-h-14 px-6 py-3" pendingLabel="Menyimpan profil...">
                Simpan perubahan profil
              </FormSubmitButton>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-slate-50/80">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Status profil</p>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
              {profile.phone_number ? "Maklumat sudah lengkap" : "Lengkapkan nombor telefon"}
            </h3>
            <p className="mt-3 text-base text-slate-700">
              {profile.phone_number
                ? "Nombor telefon anda sudah disimpan, jadi jawatankuasa boleh menghubungi anda jika perlu."
                : "Tambah nombor telefon supaya jawatankuasa mudah menghubungi anda untuk bayaran atau makluman komuniti."}
            </p>
          </Card>

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Keselamatan</p>
              <h3 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-950">
                Tukar kata laluan
              </h3>
              <p className="mt-2 text-base text-muted">
                Anda boleh tukar kata laluan jika mahu kemas kini keselamatan akaun.
              </p>
            </div>
            <Link
              href="/change-password"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-base font-bold text-white"
            >
              <KeyRound className="h-4 w-4" />
              Tukar kata laluan
            </Link>
          </Card>

          <ResidentNotificationList notifications={notifications} compact />
        </div>
      </div>
    </div>
  );
}
