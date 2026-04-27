"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { submitPaymentProofAction } from "@/lib/actions";
import { PAYMENT_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n";
import { getMonthKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const uploadCopy = {
  ms: {
    invalidType: "Hanya gambar resit PNG atau JPG dibenarkan.",
    tooLarge: "Saiz gambar resit mesti 10MB atau lebih kecil.",
    imageUnreadable: "Gambar yang dipilih tidak dapat dibaca.",
    prepareFailed: "Gambar yang dipilih tidak dapat disediakan.",
    chooseFirst: "Sila pilih gambar resit dahulu.",
    waitPreparing: "Sila tunggu sehingga gambar selesai disediakan.",
    cleanupFailed: "Resit tidak berjaya dihantar. Gambar sudah dimuat naik tetapi sistem gagal membersihkan fail sementara. Sila hubungi jawatankuasa sebelum cuba semula.",
    uploadedRemoved: "Gambar yang dimuat naik sudah dibuang, jadi anda boleh cuba semula.",
    saveFailed: "Rekod bayaran tidak berjaya disimpan. Gambar yang dimuat naik sudah dibuang, jadi anda boleh cuba semula.",
    success: "Resit bayaran berjaya dihantar dan sedang menunggu semakan jawatankuasa.",
    chooseTitle: "Tekan di sini untuk pilih resit",
    chooseHelp: "PNG atau JPG sehingga 10MB. Gambar besar akan dikecilkan secara automatik sebelum dimuat naik.",
    selected: "Dipilih",
    summary: "Ringkasan gambar resit",
    optimized: "Dikecilkan sebelum muat naik",
    ready: "Sedia untuk dimuat naik",
    originalSize: "Saiz asal",
    uploadSize: "Saiz muat naik",
    previewAlt: "Pratonton resit",
    previewHelp: "Semak resit ini dengan teliti sebelum dihantar.",
    removeImage: "Buang gambar",
    uploadProcess: "Proses muat naik",
    stage: {
      preparing: "Menyediakan gambar supaya muat naik lebih cepat.",
      uploading: "Memuat naik gambar resit ke simpanan selamat.",
      saving: "Menyimpan rekod bayaran dan menghantar kemas kini kepada jawatankuasa.",
      refreshing: "Memuat semula status terkini.",
      idle: "",
    },
    retry: "Cuba muat naik semula",
    chooseAnother: "Pilih gambar lain",
    saving: "Menyimpan rekod bayaran...",
    refreshing: "Memuat semula status...",
    uploading: "Memuat naik resit...",
    preparingButton: "Menyediakan gambar...",
    submit: "Hantar resit untuk semakan",
  },
  en: {
    invalidType: "Only PNG or JPG receipt images are allowed.",
    tooLarge: "Receipt image size must be 10MB or smaller.",
    imageUnreadable: "The selected image could not be read.",
    prepareFailed: "The selected image could not be prepared.",
    chooseFirst: "Please choose a receipt image first.",
    waitPreparing: "Please wait until the image is ready.",
    cleanupFailed: "Receipt submission failed. The image was uploaded, but the system could not clean up the temporary file. Please contact the committee before trying again.",
    uploadedRemoved: "The uploaded image has been removed, so you can try again.",
    saveFailed: "The payment record could not be saved. The uploaded image has been removed, so you can try again.",
    success: "Payment receipt uploaded successfully and is waiting for committee review.",
    chooseTitle: "Press here to choose receipt",
    chooseHelp: "PNG or JPG up to 10MB. Large images will be compressed automatically before upload.",
    selected: "Selected",
    summary: "Receipt image summary",
    optimized: "Compressed before upload",
    ready: "Ready to upload",
    originalSize: "Original size",
    uploadSize: "Upload size",
    previewAlt: "Receipt preview",
    previewHelp: "Check this receipt carefully before submitting.",
    removeImage: "Remove image",
    uploadProcess: "Upload process",
    stage: {
      preparing: "Preparing the image so upload is faster.",
      uploading: "Uploading the receipt image to secure storage.",
      saving: "Saving the payment record and updating the committee.",
      refreshing: "Refreshing the latest status.",
      idle: "",
    },
    retry: "Try uploading again",
    chooseAnother: "Choose another image",
    saving: "Saving payment record...",
    refreshing: "Refreshing status...",
    uploading: "Uploading receipt...",
    preparingButton: "Preparing image...",
    submit: "Submit receipt for review",
  },
} as const;

export function PaymentUploadForm({
  userId,
  houseNumber,
  locale = "en",
}: {
  userId: string;
  houseNumber: string;
  locale?: Locale;
}) {
  const copy = uploadCopy[locale];
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "preparing" | "uploading" | "saving" | "refreshing"
  >("idle");
  const [fileSummary, setFileSummary] = useState<{
    originalSizeLabel: string;
    finalSizeLabel: string;
    optimized: boolean;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function resetSelection() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setFileSummary(null);
    setUploadStage("idle");
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function validateReceiptFile(selected: File) {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(selected.type)) {
      return copy.invalidType;
    }

    if (selected.size > 10 * 1024 * 1024) {
      return copy.tooLarge;
    }

    return null;
  }

  async function optimizeReceiptImage(selected: File) {
    const objectUrl = URL.createObjectURL(selected);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new window.Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(copy.imageUnreadable));
        element.src = objectUrl;
      });

      const maxDimension = 1800;
      const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        return {
          file: selected,
          optimized: false,
        };
      }

      context.drawImage(image, 0, 0, width, height);

      const outputType =
        selected.type === "image/png" && selected.size <= 3 * 1024 * 1024
          ? "image/png"
          : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputType, 0.82);
      });

      if (!blob) {
        return {
          file: selected,
          optimized: false,
        };
      }

      const extension = outputType === "image/png" ? "png" : "jpg";
      const baseName = selected.name.replace(/\.[^.]+$/, "");
      const optimizedFile = new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      });

      if (
        optimizedFile.size >= selected.size * 0.95 &&
        width === image.width &&
        height === image.height
      ) {
        return {
          file: selected,
          optimized: false,
        };
      }

      return {
        file: optimizedFile,
        optimized: true,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function prepareFile(selected: File | null) {
    setError(null);
    setMessage(null);

    if (!selected) {
      setFile(null);
      setPreview(null);
      setFileSummary(null);
      setUploadStage("idle");
      return;
    }

    const validationError = validateReceiptFile(selected);

    if (validationError) {
      setFile(null);
      setPreview(null);
      setFileSummary(null);
      setUploadStage("idle");
      setError(validationError);
      return;
    }

    setUploadStage("preparing");

    try {
      const prepared = await optimizeReceiptImage(selected);
      const previewUrl = URL.createObjectURL(prepared.file);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setFile(prepared.file);
      setPreview(previewUrl);
      setFileSummary({
        originalSizeLabel: formatFileSize(selected.size),
        finalSizeLabel: formatFileSize(prepared.file.size),
        optimized: prepared.optimized,
      });
      setUploadStage("idle");
    } catch (preparationError) {
      setFile(null);
      setPreview(null);
      setFileSummary(null);
      setUploadStage("idle");
      setError(
        preparationError instanceof Error
          ? preparationError.message
          : copy.prepareFailed,
      );
    }
  }

  async function handleUpload() {
    if (!file) {
      setError(copy.chooseFirst);
      setMessage(null);
      return;
    }

    if (uploadStage === "preparing") {
      setError(copy.waitPreparing);
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);
    setIsUploading(true);
    setUploadStage("uploading");

    const supabase = createClient();
    const month = getMonthKey();
    const path = `${userId}/${month}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error: uploadError } = await supabase.storage.from(PAYMENT_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploadStage("idle");
      setIsUploading(false);
      return;
    }

    try {
      setUploadStage("saving");
      await submitPaymentProofAction(path, houseNumber, month);
    } catch (submissionError) {
      const { error: cleanupError } = await supabase.storage.from(PAYMENT_BUCKET).remove([path]);
      setError(
        cleanupError
          ? copy.cleanupFailed
          : submissionError instanceof Error
            ? `${submissionError.message} ${copy.uploadedRemoved}`
            : copy.saveFailed,
      );
      setUploadStage("idle");
      setIsUploading(false);
      return;
    }

    setUploadStage("refreshing");
    startTransition(async () => {
      router.refresh();
    });

    setMessage(copy.success);
    resetSelection();
    setIsUploading(false);
  }

  return (
    <div className="space-y-4">
      <label
        role="button"
        tabIndex={isUploading || isPending || uploadStage === "preparing" ? -1 : 0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-line bg-slate-50 px-4 py-10 text-center transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
      >
        <UploadCloud className="h-9 w-9 text-primary" />
        <div>
          <p className="text-xl font-bold text-slate-950">{copy.chooseTitle}</p>
          <p className="mt-1 text-base text-muted">{copy.chooseHelp}</p>
          {file ? (
            <p className="mt-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900">
              {copy.selected}: {file.name}
            </p>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          aria-label={copy.chooseTitle}
          data-testid="payment-receipt-input"
          className="hidden"
          disabled={isUploading || isPending || uploadStage === "preparing"}
          onChange={(event) => {
            void prepareFile(event.target.files?.[0] ?? null);
          }}
        />
      </label>

      {fileSummary ? (
        <div className="rounded-3xl border border-line bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-slate-950">{copy.summary}</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                fileSummary.optimized
                  ? "bg-teal-100 text-teal-950"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {fileSummary.optimized ? copy.optimized : copy.ready}
            </span>
          </div>
          <p className="mt-2">
            {copy.originalSize}: <span className="font-bold text-slate-950">{fileSummary.originalSizeLabel}</span>
            {" | "}
            {copy.uploadSize}: <span className="font-bold text-slate-950">{fileSummary.finalSizeLabel}</span>
          </p>
        </div>
      ) : null}

      {preview ? (
        <div className="overflow-hidden rounded-4xl border border-line">
          <Image
            src={preview}
            alt={copy.previewAlt}
            width={900}
            height={900}
            className="h-auto w-full object-cover"
            unoptimized
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">
              {copy.previewHelp}
            </p>
            <button
              type="button"
              onClick={resetSelection}
              disabled={isUploading || isPending}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
            >
              {copy.removeImage}
            </button>
          </div>
        </div>
      ) : null}

      {uploadStage !== "idle" ? (
        <div className="rounded-3xl border border-teal-200 bg-teal-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-teal-900">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {copy.uploadProcess}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${
                  {
                    preparing: 25,
                    uploading: 60,
                    saving: 85,
                    refreshing: 100,
                    idle: 0,
                  }[uploadStage]
                }%`,
              }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-teal-950">
            {copy.stage[uploadStage]}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-800">
          <p className="flex items-center gap-2 text-base font-bold">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
          {file ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleUpload();
                }}
                className="rounded-full bg-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-800"
              >
                {copy.retry}
              </button>
              <button
                type="button"
                onClick={resetSelection}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.chooseAnother}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      ) : null}

      <Button
        data-testid="submit-receipt-button"
        className="w-full"
        onClick={() => {
          void handleUpload();
        }}
        disabled={!file || isUploading || isPending || uploadStage === "preparing"}
      >
        {isUploading || isPending ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            {uploadStage === "saving"
              ? copy.saving
              : uploadStage === "refreshing"
                ? copy.refreshing
                : copy.uploading}
          </>
        ) : uploadStage === "preparing" ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            {copy.preparingButton}
          </>
        ) : (
          copy.submit
        )}
      </Button>
    </div>
  );
}
