import Image from "next/image";
import { approvePaymentAction, rejectPaymentAction } from "@/lib/actions";
import { formatMonthLabel, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type ApprovalCardProps = {
  payment: {
    id: string;
    month: string;
    status: "pending" | "rejected";
    created_at: string;
    signedProofUrl: string | null;
    users: {
      house_number: string;
      name: string;
      address: string;
    };
  };
};

export function AdminApprovalCard({ payment }: ApprovalCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {payment.users.house_number}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            {payment.users.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{payment.users.address}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Month</p>
          <p className="mt-1 font-semibold text-slate-900">{formatMonthLabel(payment.month)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Submitted</p>
          <p className="mt-1 font-semibold text-slate-900">{formatTimestamp(payment.created_at)}</p>
        </div>
      </div>

      {payment.signedProofUrl ? (
        <div className="overflow-hidden rounded-4xl border border-line">
          <Image
            src={payment.signedProofUrl}
            alt={`Receipt from ${payment.users.house_number}`}
            width={1200}
            height={1200}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No receipt image was uploaded for this record.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={approvePaymentAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <Button type="submit" className="w-full">
            Approve payment
          </Button>
        </form>
        <form action={rejectPaymentAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <Button type="submit" variant="danger" className="w-full">
            Reject payment
          </Button>
        </form>
      </div>
    </Card>
  );
}
