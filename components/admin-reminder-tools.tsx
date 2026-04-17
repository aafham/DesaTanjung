"use client";

import { useMemo, useState } from "react";
import { Copy, MessageSquareText } from "lucide-react";
import type { PaymentRecord, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ResidentWithPayment = UserProfile & {
  currentPayment: PaymentRecord | null;
};

export function AdminReminderTools({
  residents,
  currentMonthLabel,
}: {
  residents: ResidentWithPayment[];
  currentMonthLabel: string;
}) {
  const [copied, setCopied] = useState(false);

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

  async function copyReminder() {
    await navigator.clipboard.writeText(reminderText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="bg-gradient-to-br from-slate-950 to-emerald-950 text-white">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <MessageSquareText className="h-5 w-5 text-teal-200" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-teal-200">Reminder helper</p>
          <h3 className="mt-2 font-display text-2xl font-bold">
            Copy unpaid list for WhatsApp
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Use this when the committee wants to send a quick monthly reminder.
          </p>
        </div>
      </div>

      <textarea
        readOnly
        value={reminderText}
        className="mt-5 h-44 w-full resize-none rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white outline-none"
      />

      <Button
        type="button"
        onClick={copyReminder}
        className="mt-4 w-full gap-2 bg-teal-300 text-slate-950 hover:bg-teal-200"
      >
        <Copy className="h-4 w-4" />
        {copied ? "Copied" : "Copy reminder text"}
      </Button>
    </Card>
  );
}
