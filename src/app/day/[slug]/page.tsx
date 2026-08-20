// 0.5s: one live component floating alone on white — this hero IS the recording frame
import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { interactions } from "@/interactions/registry";
import { SITE_URL } from "@/interactions/meta";
import { CopyButton } from "@/components/copy-button";
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

  const source = await fs.readFile(
    path.join(process.cwd(), "src/interactions", item.file),
    "utf-8",
  );
  const install = `npx shadcn@latest add ${SITE_URL}/r/${item.slug}`;

  return (
    <main>
      {/* The stage — record this section as-is */}
      <section
        className="relative flex min-h-[85svh] flex-col items-center justify-center bg-surface px-6"
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

      {/* Below the fold: take it home */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Make it yours</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          {item.description} One self-contained file. Paste it into any React
          + Tailwind project, or let your AI agent install it:
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4">
          <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-foreground">
            {install}
          </code>
          <CopyButton text={install} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <span className="font-mono text-xs text-muted">{item.file}</span>
            <CopyButton text={source} />
          </div>
          <pre className="max-h-[60vh] overflow-auto p-5 font-mono text-[13px] leading-relaxed text-foreground">
            {source}
          </pre>
        </div>

        <p className="mt-10 text-sm text-muted">
          {item.dependencies.length > 0 ? (
            <>
              Needs{" "}
              {item.dependencies.map((d, i) => (
                <span key={d}>
                  {i > 0 && ", "}
                  <code className="font-mono">{d}</code>
                </span>
              ))}{" "}
              and Tailwind.
            </>
          ) : (
            <>Needs only Tailwind.</>
          )}{" "}
          MIT, do whatever you like.
        </p>
      </section>
    </main>
  );
}
