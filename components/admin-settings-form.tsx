"use client";

import { useState } from "react";
import type { AppSettings } from "@/lib/types";
import { FormSubmitButton } from "@/components/form-submit-button";

const MALAYSIAN_BANKS = [
  "Maybank",
  "CIMB Bank",
  "Public Bank",
  "RHB Bank",
  "Hong Leong Bank",
  "AmBank",
  "Bank Islam",
  "Bank Muamalat",
  "BSN",
  "OCBC Bank",
  "UOB Malaysia",
  "Affin Bank",
  "Alliance Bank",
];

export function AdminSettingsForm({
  settings,
  action,
}: {
  settings: AppSettings;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [preview, setPreview] = useState({
    community_name: settings.community_name,
    bank_name: settings.bank_name,
    bank_account_name: settings.bank_account_name,
    bank_account_number: settings.bank_account_number,
    payment_qr_url: settings.payment_qr_url,
    monthly_fee: settings.monthly_fee ? String(settings.monthly_fee) : "",
    due_day: String(settings.due_day),
  });
  const [selectedFileName, setSelectedFileName] = useState("");

  function updatePreview(name: string, value: string) {
    setPreview((current) => ({ ...current, [name]: value }));
  }

  function handleQrPreview(file: File | null) {
    if (!file) {
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    updatePreview("payment_qr_url", objectUrl);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form
        action={action}
        encType="multipart/form-data"
        className="grid gap-5 rounded-4xl border border-line bg-white p-6 shadow-soft md:grid-cols-2"
      >
        <div>
          <label htmlFor="community_name" className="mb-2 block text-base font-bold text-slate-950">
            Community name
          </label>
          <input
            id="community_name"
            name="community_name"
            required
            defaultValue={settings.community_name}
            onChange={(event) => updatePreview("community_name", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="monthly_fee" className="mb-2 block text-base font-bold text-slate-950">
            Monthly fee amount
          </label>
          <input
            id="monthly_fee"
            name="monthly_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.monthly_fee ?? ""}
            onChange={(event) => updatePreview("monthly_fee", event.target.value)}
            placeholder="Example: 30"
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="due_day" className="mb-2 block text-base font-bold text-slate-950">
            Payment due day
          </label>
          <input
            id="due_day"
            name="due_day"
            type="number"
            min="1"
            max="28"
            defaultValue={settings.due_day}
            onChange={(event) => updatePreview("due_day", event.target.value)}
            placeholder="7"
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="bank_name" className="mb-2 block text-base font-bold text-slate-950">
            Bank name
          </label>
          <select
            id="bank_name"
            name="bank_name"
            required
            defaultValue={settings.bank_name}
            onChange={(event) => updatePreview("bank_name", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-primary"
          >
            {MALAYSIAN_BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bank_account_number" className="mb-2 block text-base font-bold text-slate-950">
            Account number
          </label>
          <input
            id="bank_account_number"
            name="bank_account_number"
            required
            defaultValue={settings.bank_account_number}
            onChange={(event) => updatePreview("bank_account_number", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="bank_account_name" className="mb-2 block text-base font-bold text-slate-950">
            Account holder name
          </label>
          <input
            id="bank_account_name"
            name="bank_account_name"
            required
            defaultValue={settings.bank_account_name}
            onChange={(event) => updatePreview("bank_account_name", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="payment_qr_image" className="mb-2 block text-base font-bold text-slate-950">
            Payment QR image
          </label>
          <input type="hidden" name="existing_payment_qr_url" value={settings.payment_qr_url} />
          <label
            htmlFor="payment_qr_image"
            data-testid="payment-qr-upload-label"
            className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-slate-50 px-4 py-6 text-center transition hover:border-primary"
          >
            <span className="text-base font-bold text-slate-950">
              Upload QR image
            </span>
            <span className="text-sm text-muted">
              PNG or JPG. Leave empty if you want to keep current QR.
            </span>
            {selectedFileName ? (
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-950">
                {selectedFileName}
              </span>
            ) : null}
          </label>
          <input
            id="payment_qr_image"
            name="payment_qr_image"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            data-testid="payment-qr-input"
            onChange={(event) => handleQrPreview(event.target.files?.[0] ?? null)}
            className="sr-only"
            aria-describedby="payment-qr-help"
          />
          <p id="payment-qr-help" className="mt-2 text-sm text-muted">
            Upload a new QR image if bank QR changes.
          </p>
          {settings.payment_qr_url ? (
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Current saved QR source is ready and will be used for residents after you save changes.
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <FormSubmitButton className="min-h-14 px-6 py-3" pendingLabel="Saving settings...">
            Save settings
          </FormSubmitButton>
        </div>
      </form>

      <div className="space-y-4">
        <div
          className="rounded-4xl border border-slate-900 p-6 text-white shadow-soft"
          style={{
            background:
              "linear-gradient(135deg, #07111f 0%, #0b2f2d 55%, #064e48 100%)",
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-100">
            Live preview
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold">
            {preview.community_name || "Community name"}
          </h3>
          <p className="mt-4 text-base text-slate-100">
            Bank: {preview.bank_name || "Bank name"}
          </p>
          <p className="mt-2 text-base text-slate-100">
            Holder: {preview.bank_account_name || "Account holder"}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {preview.bank_account_number || "Account number"}
          </p>
          <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950">
            {preview.monthly_fee ? `RM ${Number(preview.monthly_fee).toFixed(2)} / month` : "Monthly fee not set"}
          </p>
          <p className="mt-3 text-base font-bold text-slate-100">
            Payment due every month on day {preview.due_day || "7"}.
          </p>
        </div>

        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
            QR preview
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-testid="payment-qr-preview-image"
              src={preview.payment_qr_url || settings.payment_qr_url}
              alt="Payment QR preview"
              className="h-auto w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
