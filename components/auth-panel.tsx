import { Building2, Receipt, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="bg-teal-50">
        <Building2 className="h-6 w-6 text-primary" />
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-950">
          Satu portal
        </h3>
        <p className="mt-2 text-base text-muted">
          Semua urusan bayaran bulanan penduduk dikumpulkan dalam satu tempat yang mudah dirujuk.
        </p>
      </Card>
      <Card className="bg-slate-50">
        <Receipt className="h-6 w-6 text-primary" />
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-950">
          Resit teratur
        </h3>
        <p className="mt-2 text-base text-muted">
          Penduduk boleh muat naik resit dengan cepat dan semak status bayaran semasa dari masa ke masa.
        </p>
      </Card>
      <Card className="bg-amber-50">
        <ShieldCheck className="h-6 w-6 text-amber-800" />
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-950">
          Semakan jawatankuasa
        </h3>
        <p className="mt-2 text-base text-muted">
          Jawatankuasa boleh semak resit, luluskan bayaran, dan rekod bayaran tunai dengan kemas.
        </p>
      </Card>
    </div>
  );
}
