// 0.5s: one live component floating alone on white — this hero IS the recording frame
import Link from "next/link";
import { notFound } from "next/navigation";
import { interactions } from "@/interactions/registry";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function generateStaticParams() {
  return interactions.map(({ slug }) => ({ slug }));
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = interactions.find((i) => i.slug === slug);
  if (!item) notFound();

  return (
    <main>
      {/* The stage — record this section as-is */}
      <section
        className="relative flex min-h-svh flex-col items-center justify-center bg-surface px-6"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
          backgroundSize: "18px 18px",
        }}
      >
        <Link
          href="/"
          className="absolute left-8 top-8 z-10 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-muted transition-colors duration-150 hover:text-foreground"
        >
          <Logo className="h-[18px] w-auto" />
          OIAD
        </Link>
        <div className="absolute right-8 top-8 z-10 flex items-center gap-4">
          <p className="text-sm text-muted">Day {item.day}</p>
          <ThemeToggle />
        </div>

        {item.StageComponent ? <item.StageComponent /> : <item.Component />}

        <div className="pointer-events-none absolute bottom-10 z-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
          <p className="mt-1.5 text-base text-muted">{item.hint}</p>
        </div>
      </section>
    </main>
  );
}
