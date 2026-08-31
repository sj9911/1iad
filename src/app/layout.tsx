import type { Metadata } from "next";
import { Bricolage_Grotesque, Roboto_Flex } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/interactions/meta";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
});

// Text Lift needs a true width + weight variable font. Keep it scoped through
// a CSS variable so the rest of 1IAD retains its Bricolage typography.
const textLift = Roboto_Flex({
  subsets: ["latin"],
  variable: "--font-text-lift",
  axes: ["opsz", "wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "1IAD — One Interaction A Day",
    template: "%s — 1IAD",
  },
  description:
    "A free, open-source collection of Apple-grade animated React interactions — one new component every day. Built with Tailwind CSS and Motion, installable in one command with the shadcn CLI. MIT licensed.",
  openGraph: {
    siteName: "1IAD",
    type: "website",
    url: "/",
    title: "1IAD — One Interaction A Day",
    description:
      "Free, open-source animated React interactions — one new component every day. Install any of them with the shadcn CLI.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@sunnyxdesign",
  },
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "1IAD",
  alternateName: "One Interaction A Day",
  url: SITE_URL,
  description:
    "A free, open-source collection of Apple-grade animated React interactions, built daily in public.",
  author: {
    "@type": "Person",
    name: "Sunny Joshi",
    url: "https://x.com/sunnyxdesign",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolage.variable} ${textLift.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.theme;if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        {children}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token":"790b70302d6d4345a17ad6f48a4404de"}'
        />
        <Analytics />
      </body>
    </html>
  );
}
