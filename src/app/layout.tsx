import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { SITE_URL } from "@/interactions/meta";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
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
      <body className={`${bricolage.variable} antialiased`}>
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
      </body>
    </html>
  );
}
