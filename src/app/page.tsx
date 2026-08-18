// 0.5s: giant STIX serif "One interaction a day." on Apple-gray, live white tiles below
import Link from "next/link";
import { interactions } from "@/interactions/registry";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <header className="pb-16 pt-20 sm:pt-28">
        <p className="font-serif text-lg italic text-muted">OIAD</p>
        <h1 className="mt-3 max-w-2xl font-serif text-5xl leading-[1.08] tracking-tight sm:text-7xl">
          One interaction a&nbsp;day.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
          A tiny, Apple-grade UI interaction every day — live on this page,
          open source, yours to copy. Built in public.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {interactions.map(({ slug, day, title, date, Component }) => (
          <div
            key={slug}
            className="group overflow-hidden rounded-[28px] border border-hairline bg-surface transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          >
            <div className="flex aspect-[4/3] items-center justify-center px-10">
              <Component />
            </div>
            <Link
              href={`/day/${slug}`}
              className="flex items-baseline justify-between border-t border-hairline px-6 py-4"
            >
              <span className="text-sm">
                <span className="font-medium">Day {day}</span>
                <span className="text-muted"> · {title}</span>
              </span>
              <span className="text-sm text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Get the code →
              </span>
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}
