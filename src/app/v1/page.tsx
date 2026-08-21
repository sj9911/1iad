// 0.5s: frosted glass pill floating over Apple-gray, STIX serif H1 left, big "№ 001" right
import Link from "next/link";
import { interactions } from "@/interactions/registry";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoIntro } from "@/components/logo-intro";
import { getLogoSlots } from "@/lib/logo-slots";

function Socials() {
  return (
    <span className="flex items-center gap-4">
      <a
        href="https://x.com/sunnyxdesign"
        target="_blank"
        rel="noreferrer"
        aria-label="Sunny on X"
        className="text-muted transition-colors duration-150 hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
        </svg>
      </a>
      <a
        href="https://www.linkedin.com/in/thesunnyjoshi/"
        target="_blank"
        rel="noreferrer"
        aria-label="Sunny on LinkedIn"
        className="text-muted transition-colors duration-150 hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0Z" />
        </svg>
      </a>
    </span>
  );
}

export default async function Home() {
  const logoSlots = await getLogoSlots();
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-4">
      <div className="sticky top-4 z-10 mx-auto flex w-fit items-center gap-4 rounded-full border border-hairline bg-white/70 px-6 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-colors duration-300 dark:bg-[#1d1d1f]/70">
        <LogoIntro slots={logoSlots} className="h-[20px]" />
        <span className="h-4 w-px bg-hairline" />
        <span className="text-sm text-muted">by Sunny Joshi</span>
        <Socials />
        <span className="h-4 w-px bg-hairline" />
        <ThemeToggle />
      </div>

      <header className="flex flex-wrap items-end justify-between gap-8 pb-16 pt-16 sm:pt-24">
        <div>
          <h1 className="mt-3 max-w-2xl text-[2.69rem] font-semibold uppercase leading-[0.95] tracking-tight sm:text-[4.03rem]">
            One
            <br />
            Interaction
            <br />
            A&nbsp;Day
          </h1>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted">
            1IAD is a free, open-source collection of animated React
            interactions, built daily in public. Browse them in action below
            and install any component with the shadcn CLI.
          </p>
        </div>
        <div className="pb-1 text-right text-lg leading-relaxed text-muted">
          <p>
            {interactions.length} interaction{interactions.length > 1 && "s"}
          </p>
          <p>open source · MIT</p>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {interactions.map(({ slug, day, title, Component, StageComponent }) => (
          <div
            key={slug}
            className="group overflow-hidden rounded-[28px] border border-hairline bg-surface transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
          >
            <div className="relative flex aspect-[4/3] items-center justify-center px-10">
              {StageComponent ? <StageComponent /> : <Component />}
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
