"use client";

import { useRouter } from "next/navigation";

import { Landing } from "~/components/intro";
import { Button } from "~/components/ui/button";

import { examples, newPortfolio } from "~/lib/demo";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { StorageNotice } from "~/components/app-shell";
export default function LandingPage() {
  const router = useRouter();
  const { draft, open, ready, cloud } = useDemoPortfolios();
  if (!ready)
    return (
      <main role="status" className="p-10">
        {cloud ? "Loading account portfolios…" : "Loading local portfolios…"}
      </main>
    );
  return (
    <>
      <StorageNotice />
      <Landing
        onBuild={() => open(draft ?? newPortfolio())}
        onExample={() => open(examples()[0]!)}
        onLogin={() => router.push("/sign-in")}
        onDashboard={() => router.push("/dashboard")}
      />
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <Button onClick={() => open(draft ?? newPortfolio())}>
          {draft
            ? cloud
              ? "Resume draft"
              : "Resume local draft"
            : "Start an empty portfolio"}
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">
          {cloud
            ? "Saved portfolios sync to your account. Unsaved edits stay in this tab."
            : "Guest portfolios stay in this browser. Sign in to save new portfolios to your account."}
        </p>
      </div>
    </>
  );
}
