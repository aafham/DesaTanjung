import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-[2.65rem] font-bold leading-[1.05] text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-lg leading-8 text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="w-full max-w-2xl">{actions}</div> : null}
    </section>
  );
}
