"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Pin, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { RangePicker } from "~/components/range-picker";
import { HistoryChart } from "~/components/history-chart";
import {
  allocation,
  equalWeights,
  metrics,
  money,
  percent,
  series,
  validAmount,
  type Portfolio,
} from "~/lib/demo";

import { Dialog, DialogContent } from "~/components/ui/dialog";
import { HoldingReturns } from "~/components/holding-returns";
import { PortfolioEditor } from "./portfolio-editor";
import { PortfolioEmptyState } from "~/components/portfolio-empty-state";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { AppShell, StorageNotice } from "~/components/app-shell";
import { PortfolioComparisons } from "./portfolio-comparisons";
import { comparisonColors, comparisonRank } from "./comparison-colors";
const panel = "rounded-xl border border-border bg-card p-5 md:p-7";
function useExitingSelections(selected: string[]) {
  const [visible, setVisible] = useState(selected);
  const selectionKey = JSON.stringify(selected);
  useEffect(() => {
    const current = JSON.parse(selectionKey) as string[];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(current);
      return;
    }
    setVisible((previous) => [...new Set([...previous, ...current])]);
    const timer = window.setTimeout(() => setVisible(current), 900);
    return () => window.clearTimeout(timer);
  }, [selectionKey]);
  return visible;
}
export default function PortfolioPage({ id }: { id: string }) {
  const store = useDemoPortfolios();
  const router = useRouter();
  if (!store.ready)
    return (
      <main role="status" className="p-10">
        Loading local demo...
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
          This local demo portfolio is not available in this browser.
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
    setPortfolios,
    setNotice,
    save,
    remove,
    setDraft: persistDraft,
  } = useDemoPortfolios();
  const [draft, updateDraft] = useState(initial);
  function setDraft(p: Portfolio) {
    updateDraft(p);
    persistDraft(p);
  }
  const [editorOpen, setEditorOpen] = useState(false);
  const [spy, setSpy] = useState(true);
  const [dollars, setDollars] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [result, setResult] = useState<Portfolio | null>(() =>
    allocation(initial.holdings).valid && validAmount(initial.amount)
      ? { ...initial, holdings: initial.holdings.map((h) => ({ ...h })) }
      : null,
  );
  const visibleComparisonLines = useExitingSelections([
    ...(spy ? ["benchmark"] : []),
    ...comparison.map((id) => `portfolio:${id}`),
  ]);
  const valid =
    draft &&
    allocation(draft.holdings).valid &&
    validAmount(draft.amount) &&
    !!draft.name.trim();
  function changeDraft(p: Portfolio) {
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
  const activePoints = result
    ? series(result.holdings, result.range, Number(result.amount))
    : [];
  const benchmark = result
    ? series(equalWeights(["SPY"]), result.range, Number(result.amount))
    : [];
  const stats = metrics(activePoints);
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
              {draft.name || "Untitled portfolio"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {draft.holdings.length}{" "}
              {draft.holdings.length === 1 ? "asset" : "assets"} - Local demo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/sign-in")}>
              Sign-in preview
            </Button>
            <Button disabled={!valid} onClick={() => save(draft)}>
              Save locally
            </Button>
          </div>
        </div>
        <div className="mb-6">
          <div
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Portfolio actions"
          >
            <Button
              variant="outline"
              onClick={() => {
                const pinned = !draft.pinned;
                setDraft({ ...draft, pinned });
                setPortfolios((old) =>
                  old.map((p) =>
                    p.id === draft.id
                      ? { ...p, pinned, updated: Date.now() }
                      : p,
                  ),
                );
              }}
            >
              <Pin className={draft.pinned ? "fill-stone-200" : ""} />
              {draft.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button variant="outline" onClick={() => setEditorOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <Button
              variant="outline"
              disabled={!portfolios.some((p) => p.id === draft.id)}
              onClick={() => {
                if (portfolios.length >= 100) {
                  setNotice("Local demo limit: 100 portfolios.");
                  return;
                }
                const original = portfolios.find((p) => p.id === draft.id)!;
                setPortfolios((old) => [
                  ...old,
                  {
                    ...original,
                    id: crypto.randomUUID(),
                    name: `${original.name.slice(0, 73)} (copy)`,
                    pinned: false,
                    updated: Date.now(),
                  },
                ]);
                setNotice("Saved portfolio duplicated locally.");
              }}
            >
              <Copy />
              Duplicate
            </Button>
            <Button
              variant="outline"
              disabled={!portfolios.some((p) => p.id === draft.id)}
              onClick={() => {
                const original = portfolios.find((p) => p.id === draft.id);
                if (!original || !window.confirm(`Delete ${original.name}?`))
                  return;
                remove(original);
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
                onChange={changeDraft}
                onClose={() => setEditorOpen(false)}
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
                      ? "Results up to date"
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
              <div className="w-full sm:w-72">
                <RangePicker
                  alignStart
                  value={draft.range}
                  onChange={(range) => {
                    changeDraft({ ...draft, range });
                    setResult((previous) =>
                      previous ? { ...previous, range } : null,
                    );
                  }}
                />
              </div>
            </div>
            {result ? (
              <>
                <p className="text-muted-foreground mt-4 text-xs">
                  {activePoints[0]?.date} · {activePoints.at(-1)?.date} ·{" "}
                  {money(Number(result.amount))} starting amount
                </p>
                <div className="my-8 grid gap-5 sm:grid-cols-3">
                  {[
                    ["Ending value", money(stats.ending)],
                    ["Total return", percent(stats.return)],
                    [
                      "Difference vs SPY",
                      `${(stats.return - metrics(benchmark).return).toFixed(2)} pp`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p
                        className={`mt-2 ${label === "Ending value" ? "text-3xl" : "text-xl"} ${label === "Total return" ? (stats.return > 0 ? "text-emerald-400" : stats.return < 0 ? "text-red-400" : "") : ""}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <p
                  className={`-mt-4 mb-6 text-sm ${stats.return > 0 ? "text-emerald-400" : stats.return < 0 ? "text-red-400" : ""}`}
                >
                  {stats.ending - Number(result.amount) >= 0 ? "+" : "-"}
                  {money(Math.abs(stats.ending - Number(result.amount)))} change
                </p>
                <HistoryChart
                  amount={Number(result.amount)}
                  dollars={dollars}
                  lines={[
                    { name: result.name, points: activePoints },
                    ...(visibleComparisonLines.includes("benchmark")
                      ? [
                          {
                            name: "SPY ETF benchmark",
                            points: benchmark,
                            kind: "benchmark" as const,
                            exiting: !spy,
                          },
                        ]
                      : []),
                    ...portfolios
                      .filter((p) => p.id !== draft.id)
                      .sort(
                        (a, b) =>
                          comparisonRank(a.id) - comparisonRank(b.id) ||
                          a.id.localeCompare(b.id),
                      )
                      .map((p, index) => ({
                        p,
                        color:
                          comparisonColors[index % comparisonColors.length],
                      }))
                      .filter(({ p }) =>
                        visibleComparisonLines.includes(`portfolio:${p.id}`),
                      )
                      .map(({ p, color }) => ({
                        kind: "comparison" as const,
                        id: p.id,
                        exiting: !comparison.includes(p.id),
                        color,
                        name: `${p.name} · comparison`,
                        points: series(
                          p.holdings,
                          result.range,
                          Number(result.amount),
                        ),
                      })),
                  ]}
                />
              </>
            ) : !draft.holdings.length ? (
              <PortfolioEmptyState />
            ) : (
              <div className="border-border text-muted-foreground my-10 grid min-h-56 place-items-center rounded-lg border border-dashed px-6 text-center text-sm">
                {valid
                  ? "Your results update automatically."
                  : "Add holdings and complete a valid allocation to see results."}
                <br />
                Use Edit above to complete the allocation and starting amount.
              </div>
            )}
            <PortfolioComparisons
              portfolios={portfolios}
              draftId={draft.id}
              comparison={comparison}
              setComparison={setComparison}
            />
          </section>
          {result && (
            <section className={`${panel} order-2`}>
              <h2 className="text-xl">Asset returns</h2>
              {resultsOutdated && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Showing the last valid allocation. Complete your edits to
                  update.
                </p>
              )}
              <HoldingReturns portfolio={result} />
            </section>
          )}
        </div>
      </>
    </AppShell>
  );
}
