import { redirect } from "next/navigation";
import { LandingHomepage } from "@/components/home/LandingHomepage";
import { getAuthUser, getCurrentProfile, isProfileComplete, redirectForProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthUser();
  if (user) {
    const profile = await getCurrentProfile();
    if (!profile) redirect("/complete-profile");
    if (!isProfileComplete(profile)) redirect("/complete-profile");
    if (profile.status !== "ACTIVE") redirect("/login?error=suspended");
    redirect(redirectForProfile(profile));
  }

  return (
    <main className="lp-home">
      <LandingHomepage />
    </main>
  );
}
