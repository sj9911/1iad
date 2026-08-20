// Scratch page for testing the logo intro animation. Not linked from anywhere.
import { LogoIntro } from "@/components/logo-intro";
import { getLogoSlots } from "@/lib/logo-slots";

export default async function Lab() {
  const slots = await getLogoSlots();

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center gap-10 bg-surface px-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
        backgroundSize: "18px 18px",
      }}
    >
      <LogoIntro slots={slots} />
      <p className="text-sm text-muted">click the logo to replay</p>
    </main>
  );
}
