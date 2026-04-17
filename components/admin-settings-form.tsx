"use client";

import { useState } from "react";
import type { AppSettings } from "@/lib/types";

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
  });

  function updatePreview(name: string, value: string) {
    setPreview((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form action={action} className="grid gap-5 md:grid-cols-2 rounded-4xl border border-line bg-white p-6 shadow-soft">
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
          <label htmlFor="bank_name" className="mb-2 block text-base font-bold text-slate-950">
            Bank name
          </label>
          <input
            id="bank_name"
            name="bank_name"
            required
            defaultValue={settings.bank_name}
            onChange={(event) => updatePreview("bank_name", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
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
          <label htmlFor="payment_qr_url" className="mb-2 block text-base font-bold text-slate-950">
            Payment QR image URL
          </label>
          <input
            id="payment_qr_url"
            name="payment_qr_url"
            required
            defaultValue={settings.payment_qr_url}
            onChange={(event) => updatePreview("payment_qr_url", event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-line px-4 py-3 text-base text-slate-950 outline-none focus:border-primary"
          />
          <p className="mt-2 text-sm text-muted">
            Use a public image URL. Supabase Storage public URL also works.
          </p>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="min-h-14 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground"
          >
            Save settings
          </button>
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
        </div>

        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
            QR preview
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
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
