import type { Metadata } from "next";
import Playground from "./playground";

export const metadata: Metadata = {
  title: "The next ten — 1IAD playground",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Playground />;
}
