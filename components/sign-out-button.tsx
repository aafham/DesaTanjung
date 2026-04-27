import { signOutAction } from "@/lib/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { Locale } from "@/lib/i18n";

const signOutCopy = {
  ms: { label: "Log keluar", pending: "Sedang log keluar..." },
  en: { label: "Sign out", pending: "Signing out..." },
} as const;

export function SignOutButton({ locale = "en" }: { locale?: Locale }) {
  const copy = signOutCopy[locale];

  return (
    <form action={signOutAction}>
      <FormSubmitButton variant="ghost" className="w-full sm:w-auto" pendingLabel={copy.pending}>
        {copy.label}
      </FormSubmitButton>
    </form>
  );
}
