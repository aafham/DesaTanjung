"use client";

import { useMemo, useState } from "react";
import { Copy, MessageSquareText } from "lucide-react";
import type { ResidentPaymentRecord, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ResidentWithPayment = UserProfile & {
  currentPayment: ResidentPaymentRecord | null;
};

type ReminderTone = "friendly" | "firm" | "formal";

const TONE_OPTIONS: Array<{
  value: ReminderTone;
  label: string;
  description: string;
}> = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and suitable for routine monthly reminders.",
  },
  {
    value: "firm",
    label: "Firm",
    description: "More direct for overdue or repeated follow-up.",
  },
  {
    value: "formal",
    label: "Formal",
    description: "More official wording for committee use.",
  },
];

function getReminderReadyResidents(residents: ResidentWithPayment[]) {
  return residents.filter((resident) => !!resident.phone_number);
}

function buildReminderMessage({
  kind,
  currentMonthLabel,
  residents,
  tone,
}: {
  kind: "all" | "overdue" | "unpaid";
  currentMonthLabel: string;
  residents: ResidentWithPayment[];
  tone: ReminderTone;
}) {
  if (residents.length === 0) {
    if (kind === "overdue") {
      return `No overdue residents for ${currentMonthLabel}.`;
    }

    if (kind === "unpaid") {
      return `No unpaid or rejected residents for ${currentMonthLabel}.`;
    }

    return `All residents are settled for ${currentMonthLabel}.`;
  }

  const list = residents
    .map((resident, index) => `${index + 1}. ${resident.house_number} - ${resident.name}`)
    .join("\n");

  const copyByTone = {
    friendly: {
      all: {
        heading: `Friendly payment reminder for ${currentMonthLabel}`,
        intro: "The following houses are not settled yet:",
        closing: "Please update payment or upload proof when you have a moment. Thank you.",
      },
      overdue: {
        heading: `Friendly overdue reminder for ${currentMonthLabel}`,
        intro: "The following houses are already past the due date:",
        closing: "Please settle payment or upload proof as soon as possible. Thank you for your help.",
      },
      unpaid: {
        heading: `Friendly follow-up reminder for ${currentMonthLabel}`,
        intro: "The following houses still need action:",
        closing:
          "Please update payment and upload a valid receipt in the Desa Tanjung portal. Thank you.",
      },
    },
    firm: {
      all: {
        heading: `Payment reminder for ${currentMonthLabel}`,
        intro: "The following houses have not settled payment yet:",
        closing: "Please complete payment or upload proof as soon as possible.",
      },
      overdue: {
        heading: `Overdue payment notice for ${currentMonthLabel}`,
        intro: "The following houses are already overdue:",
        closing: "Please settle payment immediately or upload proof to avoid further follow-up.",
      },
      unpaid: {
        heading: `Follow-up action required for ${currentMonthLabel}`,
        intro: "The following houses still require payment action:",
        closing: "Please update payment and upload a valid receipt in the portal without delay.",
      },
    },
    formal: {
      all: {
        heading: `Monthly payment notice for ${currentMonthLabel}`,
        intro: "Please note that the following houses are still pending payment:",
        closing: "Kindly complete payment or submit proof via the Desa Tanjung portal. Thank you.",
      },
      overdue: {
        heading: `Overdue payment notice for ${currentMonthLabel}`,
        intro: "The following houses are recorded as overdue for the current cycle:",
        closing:
          "Kindly arrange payment or submit proof through the Desa Tanjung portal at your earliest convenience.",
      },
      unpaid: {
        heading: `Payment follow-up notice for ${currentMonthLabel}`,
        intro: "The following houses require further payment follow-up:",
        closing:
          "Please submit payment and upload a valid receipt in the Desa Tanjung portal for committee review.",
      },
    },
  } as const;

  const selectedCopy = copyByTone[tone][kind];

  return [
    selectedCopy.heading,
    "",
    selectedCopy.intro,
    list,
    "",
    selectedCopy.closing,
  ].join("\n");
}

export function AdminReminderTools({
  residents,
  currentMonthLabel,
}: {
  residents: ResidentWithPayment[];
  currentMonthLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedKind, setCopiedKind] = useState<"all" | "overdue" | "unpaid" | null>(null);
  const [tone, setTone] = useState<ReminderTone>("friendly");

  const whatsappResidents = useMemo(() => getReminderReadyResidents(residents), [residents]);
  const overdueResidents = useMemo(
    () =>
      residents.filter(
        (resident) => resident.currentPayment?.display_status === "overdue",
      ),
    [residents],
  );
  const unpaidResidents = useMemo(
    () =>
      residents.filter((resident) => {
        const status = resident.currentPayment?.display_status ?? "unpaid";
        return status === "unpaid" || status === "rejected";
      }),
    [residents],
  );

  const reminderText = useMemo(() => {
    return buildReminderMessage({
      kind: "all",
      currentMonthLabel,
      residents,
      tone,
    });
  }, [currentMonthLabel, residents, tone]);

  const overdueReminderText = useMemo(() => {
    return buildReminderMessage({
      kind: "overdue",
      currentMonthLabel,
      residents: overdueResidents,
      tone,
    });
  }, [currentMonthLabel, overdueResidents, tone]);

  const unpaidReminderText = useMemo(() => {
    return buildReminderMessage({
      kind: "unpaid",
      currentMonthLabel,
      residents: unpaidResidents,
      tone,
    });
  }, [currentMonthLabel, tone, unpaidResidents]);

  const whatsappComposeLink = useMemo(() => {
    if (whatsappResidents.length === 0) {
      return null;
    }

    return `https://wa.me/?text=${encodeURIComponent(reminderText)}`;
  }, [reminderText, whatsappResidents]);

  const overdueWhatsAppLink = useMemo(() => {
    if (overdueResidents.length === 0) {
      return null;
    }

    return `https://wa.me/?text=${encodeURIComponent(overdueReminderText)}`;
  }, [overdueReminderText, overdueResidents.length]);

  const unpaidWhatsAppLink = useMemo(() => {
    if (unpaidResidents.length === 0) {
      return null;
    }

    return `https://wa.me/?text=${encodeURIComponent(unpaidReminderText)}`;
  }, [unpaidReminderText, unpaidResidents.length]);

  async function copyReminder() {
    await navigator.clipboard.writeText(reminderText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copyPresetReminder(kind: "all" | "overdue" | "unpaid") {
    const text =
      kind === "overdue"
        ? overdueReminderText
        : kind === "unpaid"
          ? unpaidReminderText
          : reminderText;

    await navigator.clipboard.writeText(text);
    setCopiedKind(kind);
    window.setTimeout(() => setCopiedKind(null), 2000);
  }

  return (
    <Card className="bg-gradient-to-br from-slate-950 to-emerald-950 text-white">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <MessageSquareText className="h-5 w-5 text-teal-100" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-100">Reminder helper</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight">
            Copy unpaid list for WhatsApp
          </h3>
          <p className="mt-2 text-base text-slate-100">
            Use this when the committee wants to send a quick monthly reminder.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/15 bg-white/5 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-50">Reminder tone</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {TONE_OPTIONS.map((option) => {
            const active = tone === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                aria-pressed={active}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-teal-200 bg-teal-200 text-slate-950"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <p className="text-base font-bold">{option.label}</p>
                <p className={`mt-2 text-sm leading-6 ${active ? "text-slate-800" : "text-slate-100"}`}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        readOnly
        value={reminderText}
        aria-label={`${tone} reminder draft for ${currentMonthLabel}`}
        className="mt-5 h-48 w-full resize-none rounded-3xl border border-white/20 bg-white/10 p-4 text-base leading-relaxed text-white outline-none"
      />

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <Button
            type="button"
            onClick={copyReminder}
            aria-label={`Copy WhatsApp reminder text for ${currentMonthLabel}`}
            className="w-full gap-2 bg-teal-300 px-6 text-slate-950 hover:bg-teal-200"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy reminder text"}
          </Button>
          {whatsappComposeLink ? (
            <a
              href={whatsappComposeLink}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open WhatsApp draft for ${currentMonthLabel}`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-center text-base font-bold leading-tight text-white transition hover:bg-white/20"
            >
              <MessageSquareText className="h-4 w-4" />
              Open WhatsApp draft
            </a>
          ) : (
            <div className="flex min-h-12 w-full items-center justify-center rounded-3xl border border-dashed border-white/20 px-5 py-3 text-center text-sm font-semibold leading-relaxed text-slate-100">
              Add at least one resident phone number to open WhatsApp draft.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-4 py-4 text-left">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-100">
              Overdue list
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{overdueResidents.length}</p>
            <p className="mt-2 text-sm text-slate-100">
              {copiedKind === "overdue" ? "Copied overdue reminder." : "Copy or open WhatsApp draft for overdue residents."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyPresetReminder("overdue")}
                aria-label={`Copy overdue reminder for ${currentMonthLabel}`}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold whitespace-nowrap text-white transition hover:bg-white/20"
              >
                Copy text
              </button>
              {overdueWhatsAppLink ? (
                <a
                  href={overdueWhatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open overdue WhatsApp draft for ${currentMonthLabel}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold whitespace-nowrap text-white transition hover:bg-white/20"
                >
                  Open draft
                </a>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-amber-300/30 bg-amber-500/10 px-4 py-4 text-left">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-100">
              Unpaid / rejected
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{unpaidResidents.length}</p>
            <p className="mt-2 text-sm text-slate-100">
              {copiedKind === "unpaid" ? "Copied follow-up reminder." : "Copy or open a follow-up draft for residents who still need action."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyPresetReminder("unpaid")}
                aria-label={`Copy unpaid or rejected reminder for ${currentMonthLabel}`}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold whitespace-nowrap text-white transition hover:bg-white/20"
              >
                Copy text
              </button>
              {unpaidWhatsAppLink ? (
                <a
                  href={unpaidWhatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open unpaid or rejected WhatsApp draft for ${currentMonthLabel}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold whitespace-nowrap text-white transition hover:bg-white/20"
                >
                  Open draft
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
