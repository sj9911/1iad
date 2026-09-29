import { BalloonNumbers } from "@/interactions/balloon-numbers";

export default function BalloonNumbersPreviewPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <BalloonNumbers value="2026" />
    </main>
  );
}
