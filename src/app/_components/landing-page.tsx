"use client";

import { useRouter } from "next/navigation";

import { Landing } from "~/components/intro";
import { Button } from "~/components/ui/button";

import { examples, newPortfolio } from "~/lib/demo";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { StorageNotice } from "~/components/app-shell";
export default function LandingPage() {
  const router = useRouter();
  const { draft, open, ready } = useDemoPortfolios();
  if (!ready)
    return (
      <main role="status" className="p-10">
        Loading local demo...
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
          {draft ? "Resume local draft" : "Start an empty portfolio"}
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">
          Local demo only · No real authentication, market data or AI
          connection.
        </p>
      </div>
    </>
  );
}
