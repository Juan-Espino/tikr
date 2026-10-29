"use client";

import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { TikrLogo } from "~/components/tikr-logo";

import { newPortfolio } from "~/lib/demo";

import type { ReactNode } from "react";
import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
export function StorageNotice() {
  const { notice, setNotice, storageBlocked, resetStorage } =
    useDemoPortfolios();
  return (
    <>
      {notice && (
        <div
          role="status"
          className="border-border mx-auto my-4 flex max-w-6xl flex-wrap items-center gap-4 rounded-lg border p-4 text-sm"
        >
          <span>{notice}</span>
          <Button
            variant="ghost"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X />
          </Button>
        </div>
      )}
      {storageBlocked && (
        <Button variant="outline" onClick={resetStorage}>
          Reset local demo storage
        </Button>
      )}
    </>
  );
}
export function AppShell({
  children,
  centered = false,
  portfolio = false,
}: {
  children: ReactNode;
  centered?: boolean;
  portfolio?: boolean;
}) {
  const router = useRouter();
  const { open, ready } = useDemoPortfolios();
  if (!ready)
    return (
      <main role="status" className="p-10">
        Loading local demo...
      </main>
    );
  return (
    <main
      className={`min-h-screen ${portfolio ? "portfolio-editor-copy" : ""}`}
    >
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-9">
        <button
          className="text-lg font-semibold"
          onClick={() => router.push("/")}
        >
          <TikrLogo />
        </button>
        <span className="text-muted-foreground text-xs">
          Local demo · synthetic sample data
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Experiments
          </Button>
          <Button onClick={() => open(newPortfolio())}>
            <Plus />
            Create portfolio
          </Button>
        </div>
      </header>
      <div
        className={`${centered ? "min-h-[calc(100svh-81px)] content-center" : ""} mx-auto max-w-7xl px-5 py-8 md:px-9 md:py-12`}
      >
        <StorageNotice />
        {children}
      </div>
    </main>
  );
}
