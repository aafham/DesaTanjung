import { signOutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" className="w-full sm:w-auto">
        Sign out
      </Button>
    </form>
  );
}
