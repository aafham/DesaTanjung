"use client";

import { useMemo, useState } from "react";
import { Copy, MessageSquareText } from "lucide-react";
import type { ResidentPaymentRecord, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPhoneActionLinks } from "@/lib/utils";

type ResidentWithPayment = UserProfile & {
  currentPayment: ResidentPaymentRecord | null;
};

function getReminderReadyResidents(residents: ResidentWithPayment[]) {
  return residents.filter((resident) => !!resident.phone_number);
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
    if (residents.length === 0) {
      return `All residents are settled for ${currentMonthLabel}.`;
    }

    const list = residents
      .map((resident, index) => `${index + 1}. ${resident.house_number} - ${resident.name}`)
      .join("\n");

    return [
      `Payment reminder for ${currentMonthLabel}`,
      "",
      "The following houses are not settled yet:",
      list,
      "",
      "Please update payment or upload proof as soon as possible. Thank you.",
    ].join("\n");
  }, [currentMonthLabel, residents]);

  const overdueReminderText = useMemo(() => {
    if (overdueResidents.length === 0) {
      return `No overdue residents for ${currentMonthLabel}.`;
    }

    const list = overdueResidents
      .map((resident, index) => `${index + 1}. ${resident.house_number} - ${resident.name}`)
      .join("\n");

    return [
      `Overdue payment reminder for ${currentMonthLabel}`,
      "",
      "The following houses are already past due date:",
      list,
      "",
      "Please settle payment or upload proof as soon as possible. Thank you.",
    ].join("\n");
  }, [currentMonthLabel, overdueResidents]);

  const unpaidReminderText = useMemo(() => {
    if (unpaidResidents.length === 0) {
      return `No unpaid or rejected residents for ${currentMonthLabel}.`;
    }

    const list = unpaidResidents
      .map((resident, index) => `${index + 1}. ${resident.house_number} - ${resident.name}`)
      .join("\n");

    return [
      `Follow-up reminder for ${currentMonthLabel}`,
      "",
      "The following houses still need action:",
      list,
      "",
      "Please update payment and upload a valid receipt in the Desa Tanjung portal. Thank you.",
    ].join("\n");
  }, [currentMonthLabel, unpaidResidents]);

  const whatsappComposeLink = useMemo(() => {
    const firstResident = whatsappResidents[0];
    if (!firstResident?.phone_number) {
      return null;
    }

    const links = getPhoneActionLinks(firstResident.phone_number);
    return links?.whatsappCompose(reminderText) ?? null;
  }, [reminderText, whatsappResidents]);

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
          <MessageSquareText className="h-5 w-5 text-teal-200" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-200">Reminder helper</p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight">
            Copy unpaid list for WhatsApp
          </h3>
          <p className="mt-2 text-base text-slate-200">
            Use this when the committee wants to send a quick monthly reminder.
          </p>
        </div>
      </div>

      <textarea
        readOnly
        value={reminderText}
        className="mt-5 h-48 w-full resize-none rounded-3xl border border-white/20 bg-white/10 p-4 text-base leading-relaxed text-white outline-none"
      />

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={copyReminder}
            className="w-full gap-2 bg-teal-300 text-slate-950 hover:bg-teal-200"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy reminder text"}
          </Button>
          {whatsappComposeLink ? (
            <a
              href={whatsappComposeLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-base font-bold text-white transition hover:bg-white/20"
            >
              <MessageSquareText className="h-4 w-4" />
              Open WhatsApp draft
            </a>
          ) : (
            <div className="inline-flex min-h-12 items-center justify-center rounded-full border border-dashed border-white/20 px-5 py-3 text-center text-sm font-semibold text-slate-200">
              Add at least one resident phone number to open WhatsApp draft.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => copyPresetReminder("overdue")}
            className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-4 py-4 text-left"
          >
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-rose-200">
              Overdue list
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{overdueResidents.length}</p>
            <p className="mt-2 text-sm text-slate-200">
              {copiedKind === "overdue" ? "Copied overdue reminder." : "Copy overdue WhatsApp text."}
            </p>
          </button>
          <button
            type="button"
            onClick={() => copyPresetReminder("unpaid")}
            className="rounded-3xl border border-amber-300/30 bg-amber-500/10 px-4 py-4 text-left"
          >
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-200">
              Unpaid / rejected
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{unpaidResidents.length}</p>
            <p className="mt-2 text-sm text-slate-200">
              {copiedKind === "unpaid" ? "Copied follow-up reminder." : "Copy follow-up text for residents who still need action."}
            </p>
          </button>
        </div>
      </div>
    </Card>
  );
}
