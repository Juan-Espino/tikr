"use client";
import { useEffect, useRef } from "react";
import { useLandingActions } from "~/components/landing-surface";

import { Button } from "~/components/ui/button";

import { examples, newPortfolio, hasResumablePortfolio } from "~/lib/demo";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { StorageNotice } from "~/components/app-shell";
export default function LandingPage() {
  const publish = useLandingActions();
  const {
    draft: activeDraft,
    portfolios,
    open,
    ready,
    cloud,
    prepareToLeave,
  } = useDemoPortfolios();
  const draft = hasResumablePortfolio(activeDraft, portfolios)
    ? activeDraft
    : null;
  const current = useRef({ draft, open, prepareToLeave });
  current.current = { draft, open, prepareToLeave };
  useEffect(() => {
    publish?.({
      ready,
      prepareToLeave: async () =>
        (await current.current.prepareToLeave?.()) ?? true,
      build: () => {
        void current.current.open(current.current.draft ?? newPortfolio());
      },
      example: () => {
        void current.current.open(examples()[0]!);
      },
    });
    return () => publish?.(null);
  }, [publish, ready]);
  return (
    <>
      <StorageNotice />
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <Button disabled={!ready} onClick={() => open(draft ?? newPortfolio())}>
          {draft
            ? cloud
              ? "Resume draft"
              : "Resume draft"
            : "Start an empty portfolio"}
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">
          {cloud
            ? "Saved portfolios sync to your account. Unsaved edits stay in this tab."
            : "Try a temporary draft without an account. Sign in to save your named portfolio automatically."}
        </p>
      </div>
    </>
  );
}
