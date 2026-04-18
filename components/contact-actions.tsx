import { MessageCircle, Phone } from "lucide-react";
import { cn, getPhoneActionLinks } from "@/lib/utils";

export function ContactActions({
  phoneNumber,
  className,
  compact = false,
}: {
  phoneNumber: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const links = getPhoneActionLinks(phoneNumber);

  if (!links) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        Add a valid Malaysian mobile number to enable Call and WhatsApp.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={links.tel}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-bold transition",
          compact
            ? "min-h-10 px-4 py-2 text-sm bg-slate-100 text-slate-950 hover:bg-slate-200"
            : "min-h-11 px-4 py-2 text-sm bg-slate-100 text-slate-950 hover:bg-slate-200",
        )}
      >
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-bold transition",
          compact
            ? "min-h-10 px-4 py-2 text-sm bg-emerald-100 text-emerald-950 hover:bg-emerald-200"
            : "min-h-11 px-4 py-2 text-sm bg-emerald-100 text-emerald-950 hover:bg-emerald-200",
        )}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}
