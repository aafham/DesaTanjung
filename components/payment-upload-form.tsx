"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
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
      return "Hanya gambar resit PNG atau JPG dibenarkan.";
    }

    if (selected.size > 10 * 1024 * 1024) {
      return "Saiz gambar resit mesti 10MB atau lebih kecil.";
    }

    return null;
  }

  async function optimizeReceiptImage(selected: File) {
    const objectUrl = URL.createObjectURL(selected);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new window.Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Gambar yang dipilih tidak dapat dibaca."));
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
          : "Gambar yang dipilih tidak dapat disediakan.",
      );
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Sila pilih gambar resit dahulu.");
      setMessage(null);
      return;
    }

    if (uploadStage === "preparing") {
      setError("Sila tunggu sehingga gambar selesai disediakan.");
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
          ? "Resit tidak berjaya dihantar. Gambar sudah dimuat naik tetapi sistem gagal membersihkan fail sementara. Sila hubungi jawatankuasa sebelum cuba semula."
          : submissionError instanceof Error
            ? `${submissionError.message} Gambar yang dimuat naik sudah dibuang, jadi anda boleh cuba semula.`
            : "Rekod bayaran tidak berjaya disimpan. Gambar yang dimuat naik sudah dibuang, jadi anda boleh cuba semula.",
      );
      setUploadStage("idle");
      setIsUploading(false);
      return;
    }

    setUploadStage("refreshing");
    startTransition(async () => {
      router.refresh();
    });

    setMessage("Resit bayaran berjaya dihantar dan sedang menunggu semakan jawatankuasa.");
    resetSelection();
    setIsUploading(false);
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-line bg-slate-50 px-4 py-10 text-center transition hover:border-primary">
        <UploadCloud className="h-9 w-9 text-primary" />
        <div>
          <p className="text-xl font-bold text-slate-950">Tekan di sini untuk pilih resit</p>
          <p className="mt-1 text-base text-muted">PNG atau JPG sehingga 10MB. Gambar besar akan dikecilkan secara automatik sebelum dimuat naik.</p>
          {file ? (
            <p className="mt-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900">
              Dipilih: {file.name}
            </p>
          ) : null}
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
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
            <p className="font-bold text-slate-950">Ringkasan gambar resit</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                fileSummary.optimized
                  ? "bg-teal-100 text-teal-950"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {fileSummary.optimized ? "Dikecilkan sebelum muat naik" : "Sedia untuk dimuat naik"}
            </span>
          </div>
          <p className="mt-2">
            Saiz asal: <span className="font-bold text-slate-950">{fileSummary.originalSizeLabel}</span>
            {" | "}
            Saiz muat naik: <span className="font-bold text-slate-950">{fileSummary.finalSizeLabel}</span>
          </p>
        </div>
      ) : null}

      {preview ? (
        <div className="overflow-hidden rounded-4xl border border-line">
          <Image
            src={preview}
            alt="Pratonton resit"
            width={900}
            height={900}
            className="h-auto w-full object-cover"
            unoptimized
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">
              Semak resit ini dengan teliti sebelum dihantar.
            </p>
            <button
              type="button"
              onClick={resetSelection}
              disabled={isUploading || isPending}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
            >
              Buang gambar
            </button>
          </div>
        </div>
      ) : null}

      {uploadStage !== "idle" ? (
        <div className="rounded-3xl border border-teal-200 bg-teal-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-teal-900">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Proses muat naik
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
            {
              {
                preparing: "Menyediakan gambar supaya muat naik lebih cepat.",
                uploading: "Memuat naik gambar resit ke simpanan selamat.",
                saving: "Menyimpan rekod bayaran dan menghantar kemas kini kepada jawatankuasa.",
                refreshing: "Memuat semula status terkini.",
                idle: "",
              }[uploadStage]
            }
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
                Cuba muat naik semula
              </button>
              <button
                type="button"
                onClick={resetSelection}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-100"
              >
                Pilih gambar lain
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
              ? "Menyimpan rekod bayaran..."
              : uploadStage === "refreshing"
                ? "Memuat semula status..."
                : "Memuat naik resit..."}
          </>
        ) : uploadStage === "preparing" ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Menyediakan gambar...
          </>
        ) : (
          "Hantar resit untuk semakan"
        )}
      </Button>
    </div>
  );
}
