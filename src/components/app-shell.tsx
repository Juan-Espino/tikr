"use client";
import { PageSkeleton } from "~/components/loading-skeletons";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { AccountMenu } from "~/components/account-menu";
import { TikrLogo } from "~/components/tikr-logo";

import { newPortfolio } from "~/lib/demo";

import type { ReactNode } from "react";
import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
export function StorageNotice() {
  const {
    notice,
    setNotice,
    storageBlocked,
    busy,
    saveError,
    conflict,
    reloadDraft,
    retry,
    retryLabel,
  } = useDemoPortfolios();
  useEffect(() => {
    if (!notice) return;
    // A notice can be observed by both sides of a route transition, and mount
    // effects are replayed in Strict Mode. Reuse its ID instead of appending it.
    toast(notice, { id: `portfolio-notice:${notice}`, dismissible: false });
    setNotice("");
  }, [notice, setNotice]);
  return (
    <>
      {saveError && (
        <div role="alert" className="my-4 rounded-lg bg-stone-900 p-4 text-sm">
          <p>{saveError}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {conflict ? (
              <Button variant="outline" onClick={reloadDraft}>
                Load cloud version
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={retry}>
                {retryLabel}
              </Button>
            )}
          </div>
        </div>
      )}
      {storageBlocked && (
        <p role="alert">
          Temporary draft recovery is unavailable. Existing browser records are
          preserved. Reload to retry.
        </p>
      )}
    </>
  );
}
export function AppShell({
  children,
  centered = false,
  portfolio = false,
  dashboard = false,
}: {
  children: ReactNode;
  centered?: boolean;
  portfolio?: boolean;
  dashboard?: boolean;
}) {
  const router = useRouter();
  const { open, ready, busy } = useDemoPortfolios();
  if (!ready)
    return <PageSkeleton variant={portfolio ? "portfolio" : "dashboard"} />;
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
        <div className="flex flex-wrap items-center gap-2">
          <AccountMenu />
          {!dashboard && (
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Portfolios
            </Button>
          )}
          <Button disabled={busy} onClick={() => open(newPortfolio())}>
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
