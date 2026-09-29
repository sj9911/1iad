// Inner study pages: /study/[slug] — one promoted study on a full stage,
// with a live tuner slide-over (bottom-right dock button).

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IconArrowLeft } from "@tabler/icons-react";
import { StudyRuntime } from "@/studies/registry";
import { studiesData } from "@/studies/registry-data";

export function generateStaticParams() {
  return studiesData.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = studiesData.find((s) => s.slug === slug);
  if (!study) return {};
  return {
    title: `${study.title} — 1IAD study`,
    description: study.blurb,
  };
}

export default async function StudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = studiesData.find((s) => s.slug === slug);
  if (!study) notFound();
  return (
    <main
      className="min-h-svh bg-background px-4 py-6 text-foreground sm:px-8 sm:py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"
        >
          <IconArrowLeft size={16} />
          Back
        </Link>
        <header className="mt-8 max-w-2xl sm:mt-12">
          <p className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--oiad-blue)]">
            {study.kicker}
          </p>
          <h1 className="font-bricolage mt-3 text-5xl font-semibold tracking-[-.06em] sm:text-6xl">
            {study.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{study.blurb}</p>
        </header>
        <StudyRuntime slug={study.slug} />
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[.2em] text-muted">
          {study.hint}
        </p>
      </div>
    </main>
  );
}
