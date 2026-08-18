import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
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
