"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Pin, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { RangePicker } from "~/components/range-picker";
import { MarketPerformance } from "~/components/market-performance";
import {
  allocation,
  validAmount,
  portfolioNameError,
  suggestedPortfolioName,
  type Portfolio,
} from "~/lib/demo";

import { Dialog, DialogContent } from "~/components/ui/dialog";
import { PortfolioEditor } from "./portfolio-editor";
import { PortfolioEmptyState } from "~/components/portfolio-empty-state";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { AppShell, StorageNotice } from "~/components/app-shell";
import { PortfolioComparisons } from "./portfolio-comparisons";
import { comparisonColors, comparisonRank } from "./comparison-colors";
const panel = "rounded-xl border border-border bg-card p-5 md:p-7";
export default function PortfolioPage({ id }: { id: string }) {
  const store = useDemoPortfolios();
  const router = useRouter();
  if (!store.ready)
    return (
      <main role="status" className="p-10">
        {store.cloud
          ? "Loading account portfolios…"
          : "Loading local portfolios…"}
      </main>
    );
  const selected =
    store.draft?.id === id
      ? store.draft
      : store.portfolios.find((p) => p.id === id);
  if (!selected)
    return (
      <main className="p-10">
        <StorageNotice />
        <h1 className="text-2xl">Portfolio not found</h1>
        <p className="mt-4">
          This portfolio is not available in the active collection.
        </p>
        <Button className="mt-5" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </main>
    );
  return <PortfolioContent key={id} initial={selected} />;
}
function PortfolioContent({ initial }: { initial: Portfolio }) {
  const router = useRouter();
  const {
    portfolios,
    setNotice,
    save,
    remove,
    setDraft: persistDraft,
    open,
    cloud,
    busy,
    pin,
    saveError,
    conflict,
    draft: storedDraft,
  } = useDemoPortfolios();
  const [draft, updateDraft] = useState(initial);
  useEffect(() => {
    if (storedDraft?.id === initial.id && storedDraft.revision !== undefined)
      updateDraft(storedDraft);
    // Only an explicit cloud save or conflict reload changes this draft's revision.
    // Reactive remote changes must not replace unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedDraft?.revision, initial.id]);
  const initialNameConflict = portfolios.some(
    (other) =>
      other.id !== initial.id &&
      other.name.trim().toLowerCase() === initial.name.trim().toLowerCase() &&
      !!initial.name.trim(),
  );
  const [nameValidationAttempted, setNameValidationAttempted] = useState(false);
  function setDraft(p: Portfolio) {
    updateDraft(p);
    persistDraft(p);
  }
  const [editorOpen, setEditorOpen] = useState(
    !initial.name.trim() || initialNameConflict,
  );
  const [rejectedName, setRejectedName] = useState<string | null>(null);
  useEffect(() => {
    if (saveError.startsWith("A portfolio with this name")) {
      setRejectedName(draft.name);
      setEditorOpen(true);
    }
    // Capture the submitted name once; typing a replacement must clear its inline error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveError]);
  const nameError =
    rejectedName === draft.name &&
    saveError.startsWith("A portfolio with this name")
      ? saveError
      : nameValidationAttempted
        ? portfolioNameError(draft, portfolios)
        : "";
  const saveNameError = portfolioNameError(draft, portfolios);
  const suggestedName =
    nameError && draft.name.trim()
      ? suggestedPortfolioName(draft.name, portfolios)
      : undefined;
  const [spy, setSpy] = useState(true);
  const [dollars, setDollars] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [result, setResult] = useState<Portfolio | null>(() =>
    allocation(initial.holdings).valid && validAmount(initial.amount)
      ? { ...initial, holdings: initial.holdings.map((h) => ({ ...h })) }
      : null,
  );
  const valid =
    draft &&
    allocation(draft.holdings).valid &&
    validAmount(draft.amount) &&
    !saveNameError;
  function finishEditing() {
    if (portfolioNameError(draft, portfolios)) {
      setNameValidationAttempted(true);
      return;
    }
    setNameValidationAttempted(false);
    setEditorOpen(false);
  }
  function changeDraft(p: Portfolio) {
    if (p.name !== draft.name) setNameValidationAttempted(false);
    setDraft(p);
    if (!p.holdings.length) {
      setResult(null);
    } else if (
      allocation(p.holdings).valid &&
      validAmount(p.amount) &&
      p.name.trim()
    ) {
      setResult({
        ...p,
        holdings: p.holdings.map((holding) => ({ ...holding })),
      });
    }
  }
  const resultsOutdated =
    !!result &&
    !!draft &&
    (result.name !== draft.name ||
      result.amount !== draft.amount ||
      result.range !== draft.range ||
      JSON.stringify(result.holdings) !== JSON.stringify(draft.holdings));
  return (
    <AppShell portfolio>
      {" "}
      <>
        <button
          className="text-muted-foreground mb-5 text-sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 inline size-4" />
          All experiments
        </button>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-full min-w-0">
            <p className="text-muted-foreground text-xs tracking-[.18em] uppercase">
              Portfolio editor
            </p>
            <h1 className="mt-2 text-3xl break-words">
              {draft.name.trim() || "New portfolio"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {draft.holdings.length}{" "}
              {draft.holdings.length === 1 ? "asset" : "assets"} ·{" "}
              {cloud
                ? "account portfolio · save to sync edits"
                : "browser-local portfolio"}
            </p>
          </div>
          <div className="flex gap-2">
            {!cloud && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`,
                  )
                }
              >
                Sign in
              </Button>
            )}
            <Button
              disabled={!valid || busy || conflict}
              onClick={() => {
                if (saveError.startsWith("A portfolio with this name")) {
                  setNameValidationAttempted(true);
                  setEditorOpen(true);
                }
                save(draft);
              }}
            >
              {busy ? "Saving…" : cloud ? "Save to cloud" : "Save locally"}
            </Button>
          </div>
        </div>
        {nameError && (
          <p role="status" className="mb-4 text-sm text-stone-300">
            {nameError}
            {suggestedName ? ` Try “${suggestedName}”.` : ""} Edit the name
            before saving.
          </p>
        )}
        <div className="mb-6">
          <div
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Portfolio actions"
          >
            <Button
              variant="outline"
              disabled={busy || conflict}
              onClick={() => {
                const pinned = !draft.pinned;
                setDraft({ ...draft, pinned });
                pin({ ...draft, pinned });
              }}
            >
              <Pin className={draft.pinned ? "fill-stone-200" : ""} />
              {draft.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setEditorOpen(true)}
            >
              <Pencil />
              Edit
            </Button>
            <Button
              variant="outline"
              disabled={
                busy ||
                (!conflict && !portfolios.some((p) => p.id === draft.id))
              }
              onClick={() => {
                if (!cloud && portfolios.length >= 100) {
                  setNotice("Local demo limit: 100 portfolios.");
                  return;
                }
                const original = conflict
                  ? draft
                  : portfolios.find((p) => p.id === draft.id)!;
                open({
                  ...original,
                  id: crypto.randomUUID(),
                  revision: undefined,
                  pinned: false,
                  updated: Date.now(),
                });
                setNotice("Choose a unique name, then save the duplicate.");
              }}
            >
              <Copy />
              Duplicate
            </Button>
            <Button
              variant="outline"
              disabled={busy || !portfolios.some((p) => p.id === draft.id)}
              onClick={() => {
                const original = portfolios.find((p) => p.id === draft.id);
                if (!original || !window.confirm(`Delete ${original.name}?`))
                  return;
                void remove(draft);
              }}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
            <DialogContent>
              <PortfolioEditor
                portfolio={draft}
                isNew={
                  !portfolios.some((portfolio) => portfolio.id === draft.id)
                }
                nameError={nameError}
                suggestedName={suggestedName}
                onChange={changeDraft}
                onClose={finishEditing}
              />
            </DialogContent>
          </Dialog>
          <section className={`${panel} order-1 min-w-0`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl">Historical performance</h2>
                <p className="text-muted-foreground mt-2 text-xs" role="status">
                  {resultsOutdated
                    ? "Incomplete edits - showing the last valid result"
                    : result
                      ? "Historical simulation · verified data required"
                      : draft.holdings.length
                        ? "Complete your portfolio to see results."
                        : ""}
                </p>
              </div>
            </div>
            <div className="my-5 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                aria-pressed={spy}
                onClick={() => setSpy((value) => !value)}
                className={
                  spy
                    ? "!bg-card hover:!bg-muted"
                    : "!bg-background hover:!bg-muted"
                }
              >
                Show SPY
              </Button>
              <Button
                variant="outline"
                aria-pressed={dollars}
                onClick={() => setDollars((value) => !value)}
                className={
                  dollars
                    ? "!bg-card hover:!bg-muted"
                    : "!bg-background hover:!bg-muted"
                }
              >
                Dollar value
              </Button>
              <fieldset disabled={busy} className="w-full sm:w-72">
                <RangePicker
                  alignStart
                  value={draft.range}
                  onChange={(range) => {
                    changeDraft({ ...draft, range, rangeChoice: "explicit" });
                    setResult((previous) =>
                      previous ? { ...previous, range } : null,
                    );
                  }}
                />
              </fieldset>
            </div>
            {result ? (
              <MarketPerformance
                portfolios={[
                  result,
                  ...portfolios.filter(
                    (p) => p.id !== draft.id && comparison.includes(p.id),
                  ),
                ]}
                range={result.range}
                amount={result.amount}
                spy={spy}
                dollars={dollars}
                comparisonColors={Object.fromEntries(
                  portfolios
                    .filter((p) => p.id !== draft.id)
                    .sort(
                      (a, b) =>
                        comparisonRank(a.id) - comparisonRank(b.id) ||
                        a.id.localeCompare(b.id),
                    )
                    .map((p, index) => [
                      p.id,
                      comparisonColors[index % comparisonColors.length]!,
                    ]),
                )}
                comparisons={
                  <PortfolioComparisons
                    portfolios={portfolios}
                    draftId={draft.id}
                    comparison={comparison}
                    setComparison={setComparison}
                  />
                }
              />
            ) : !draft.holdings.length ? (
              <PortfolioEmptyState />
            ) : (
              <p className="text-muted-foreground my-10 text-sm">
                Complete the allocation and starting amount to load market
                history.
              </p>
            )}
          </section>
        </div>
      </>
    </AppShell>
  );
}
