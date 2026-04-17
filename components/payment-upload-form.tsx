"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { submitPaymentProofAction } from "@/lib/actions";
import { PAYMENT_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/browser";
import { getMonthKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PaymentUploadForm({
  userId,
  houseNumber,
}: {
  userId: string;
  houseNumber: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload() {
    if (!file) {
      setError("Please choose an image file first.");
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);

    const supabase = createClient();
    const month = getMonthKey();
    const path = `${userId}/${month}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error: uploadError } = await supabase.storage.from(PAYMENT_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    try {
      await submitPaymentProofAction(path, houseNumber, month);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save the payment record.",
      );
      return;
    }

    startTransition(async () => {
      router.refresh();
    });

    setMessage("Payment proof uploaded successfully. It is now waiting for approval.");
    setFile(null);
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-line bg-slate-50 px-4 py-10 text-center transition hover:border-primary">
        <UploadCloud className="h-9 w-9 text-primary" />
        <div>
          <p className="text-xl font-bold text-slate-950">Tap here to choose receipt</p>
          <p className="mt-1 text-base text-muted">PNG or JPG up to 10MB</p>
          {file ? (
            <p className="mt-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900">
              Selected: {file.name}
            </p>
          ) : null}
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setError(null);
            setMessage(null);

            if (selected) {
              setPreview(URL.createObjectURL(selected));
            } else {
              setPreview(null);
            }
          }}
        />
      </label>

      {preview ? (
        <div className="overflow-hidden rounded-4xl border border-line">
          <Image
            src={preview}
            alt="Receipt preview"
            width={900}
            height={900}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </div>
      ) : null}

      {error ? (
        <p className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-base font-bold text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      ) : null}

      <Button className="w-full" onClick={handleUpload} disabled={!file || isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Uploading receipt...
          </>
        ) : (
          "Submit receipt for approval"
        )}
      </Button>
    </div>
  );
}
