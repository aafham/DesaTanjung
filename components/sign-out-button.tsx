import { signOutAction } from "@/lib/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <FormSubmitButton variant="ghost" className="w-full sm:w-auto" pendingLabel="Signing out...">
        Sign out
      </FormSubmitButton>
    </form>
  );
}
