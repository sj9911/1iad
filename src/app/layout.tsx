import type { Metadata } from "next";
import { STIX_Two_Text } from "next/font/google";
import "./globals.css";

const stix = STIX_Two_Text({
  subsets: ["latin"],
  variable: "--font-stix",
});

export const metadata: Metadata = {
  title: "OIAD — One Interaction A Day",
  description:
    "One tiny, Apple-grade UI interaction every day. Live, open source, copy-pasteable. Built in public.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${stix.variable} antialiased`}>
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
