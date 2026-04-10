import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data";

export default async function HomePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}
