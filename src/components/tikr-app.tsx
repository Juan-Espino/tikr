"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Landing, Login } from "~/components/intro";
import { Button } from "~/components/ui/button";
import { RangePicker } from "~/components/range-picker";
import { HistoryChart } from "~/components/history-chart";
import {
  allocation,
  equalWeights,
  examples,
  metrics,
  money,
  newPortfolio,
  percent,
  series,
  storageSchema,
  validAmount,
  type Portfolio,
  type Range,
} from "~/lib/demo";

import { Dialog, DialogContent } from "~/components/ui/dialog";
import { HoldingReturns } from "~/components/holding-returns";
import { PortfolioEditor } from "~/components/portfolio-editor";
import { PortfolioEmptyState } from "~/components/portfolio-empty-state";

const panel = "rounded-xl border border-border bg-card p-5 md:p-7";
const key = "tikr-demo-v1";
// Distinct muted blues, violets, teals and warm neutrals; no red/green signals.
const comparisonColors = [
  "#91b8d0",
  "#c1a3d3",
  "#d3b681",
  "#8dbec1",
  "#a5aad6",
  "#d0a9bd",
  "#92a9bd",
  "#baad8b",
  "#a4c4c8",
  "#b39fc1",
  "#d4c49c",
  "#87a9c8",
  "#c3b1da",
  "#b99b88",
  "#9ab5ce",
  "#b8c6d1",
  "#b59eb2",
  "#acb3c9",
  "#cabda9",
  "#9cbac0",
];
// Portfolio IDs provide a repeatable shuffled order without duplicate colors among 20 lines.
function comparisonRank(id: string) {
  let hash = 2166136261;
  for (const character of id)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
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
function Disclosure() {
  return (
    <p className="text-muted-foreground text-xs leading-6">
      Demo data only, not actual historical returns. USD, lump sum, buy and
      hold; dividends, splits, fees and taxes are not modeled. The demo includes
      weekends and ends October 22, 2026. Past performance does not guarantee
      future returns.
    </p>
  );
}
function Card({
  p,
  range,
  voo,
  onOpen,
}: {
  p: Portfolio;
  range: Range;
  voo: boolean;
  onOpen: () => void;
}) {
  const [showBenchmark, setShowBenchmark] = useState(voo);
  useEffect(() => {
    if (voo) {
      setShowBenchmark(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowBenchmark(false);
      return;
    }
    const timer = window.setTimeout(() => setShowBenchmark(false), 900);
    return () => window.clearTimeout(timer);
  }, [voo]);
  const points = series(p.holdings, range, 10000);
  const benchmark = series(equalWeights(["VOO"]), range, 10000);
  const stats = metrics(points);
  const change = stats.ending - 10000;
  const changeAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(change));
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${p.name}, ${p.holdings.length} assets, ${percent(stats.return)}, ${change >= 0 ? "gain" : "loss"} ${changeAmount}`}
      className="border-border bg-card focus-visible:ring-ring flex aspect-square w-full min-w-0 flex-col overflow-hidden rounded-xl border p-5 text-left transition-colors hover:border-stone-500 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none md:p-6"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg" title={p.name}>
          {p.name}
        </h2>
        {p.pinned && (
          <Pin
            aria-label="Pinned"
            className="size-4 shrink-0 fill-stone-200 text-stone-200"
          />
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {p.holdings.length} {p.holdings.length === 1 ? "asset" : "assets"}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-2xl tracking-tight ${stats.return > 0 ? "text-emerald-400" : stats.return < 0 ? "text-red-400" : ""}`}
        >
          {percent(stats.return)}
        </span>
        <span className="text-muted-foreground text-sm">
          {change >= 0 ? "+" : "-"}
          {changeAmount}
        </span>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col pt-4">
        <HistoryChart
          compact
          amount={10000}
          lines={[
            { name: p.name, points },
            ...(showBenchmark
              ? [
                  {
                    name: "VOO ETF benchmark",
                    points: benchmark,
                    kind: "benchmark" as const,
                    exiting: !voo,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </button>
  );
}
export default function TikrApp({
  view,
  portfolioId,
}: {
  view: "landing" | "login" | "dashboard" | "portfolio";
  portfolioId?: string;
}) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  function setView(next: "landing" | "login" | "dashboard" | "portfolio") {
    const path =
      next === "landing"
        ? "/"
        : next === "login"
          ? "/sign-in"
          : next === "dashboard"
            ? "/dashboard"
            : `/portfolio/${encodeURIComponent(draft?.id ?? "")}`;
    router.push(path);
  }
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [draft, setDraft] = useState<Portfolio | null>(null);
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [notice, setNotice] = useState("");
  const deleting = useRef(false);
  const [range, setRange] = useState<Range>("1Y");
  const [voo, setVoo] = useState(true);
  const [dollars, setDollars] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [result, setResult] = useState<Portfolio | null>(null);
  const visibleComparisonLines = useExitingSelections([
    ...(voo ? ["benchmark"] : []),
    ...comparison.map((id) => `portfolio:${id}`),
  ]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const stored = storageSchema.parse(JSON.parse(raw));
        if (
          stored.portfolios.some(
            (p) => !allocation(p.holdings).valid || !validAmount(p.amount),
          )
        )
          throw new Error("Invalid saved portfolio");
        setPortfolios(stored.portfolios);
        const selected =
          view === "portfolio"
            ? stored.draft?.id === portfolioId
              ? stored.draft
              : (stored.portfolios.find((p) => p.id === portfolioId) ?? null)
            : stored.draft;
        setDraft(selected);
        if (
          view === "portfolio" &&
          selected &&
          allocation(selected.holdings).valid &&
          validAmount(selected.amount)
        )
          setResult({
            ...selected,
            holdings: selected.holdings.map((h) => ({ ...h })),
          });
      }
    } catch {
      setNotice(
        "Saved demo data could not be read. It has not been overwritten. Use Reset local demo to start again.",
      );
      setStorageBlocked(true);
    }
    setReady(true);
  }, [view, portfolioId]);
  useEffect(() => {
    if (
      !ready ||
      storageBlocked ||
      deleting.current ||
      (view === "portfolio" && !draft)
    )
      return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, portfolios, draft }),
      );
    } catch {
      setStorageBlocked(true);
      setNotice(
        "Browser storage is unavailable or full. Changes remain in memory only; keep this page open.",
      );
    }
  }, [ready, storageBlocked, portfolios, draft, view]);
  function open(p: Portfolio) {
    if (storageBlocked) {
      setNotice(
        "Browser storage is unavailable; reset or restore it before opening a portfolio page.",
      );
      return;
    }
    setDraft(p);
    setResult(
      allocation(p.holdings).valid && validAmount(p.amount)
        ? { ...p, holdings: p.holdings.map((h) => ({ ...h })) }
        : null,
    );
    setComparison([]);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, portfolios, draft: p }),
      );
    } catch {
      setNotice(
        "Browser storage is unavailable; this portfolio cannot be opened on a separate page.",
      );
      return;
    }
    router.push(`/portfolio/${encodeURIComponent(p.id)}`);
  }
  function save() {
    if (
      !draft ||
      !allocation(draft.holdings).valid ||
      !validAmount(draft.amount) ||
      !draft.name.trim()
    )
      return;
    if (
      portfolios.length >= 100 &&
      !portfolios.some((p) => p.id === draft.id)
    ) {
      setNotice(
        "This local demo supports up to 100 portfolios. Delete one before saving another.",
      );
      return;
    }
    const p = { ...draft, name: draft.name.trim(), updated: Date.now() };
    setPortfolios((old) => [...old.filter((x) => x.id !== p.id), p]);
    setDraft(p);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          portfolios: [...portfolios.filter((x) => x.id !== p.id), p],
          draft: p,
        }),
      );
    } catch {
      setNotice("Browser storage is unavailable; your work remains in memory.");
      return;
    }
    setNotice("Saved on this browser only. No account or cloud storage.");
    setView("dashboard");
  }
  if (!ready)
    return (
      <main className="p-10" role="status">
        Loading local demo...
      </main>
    );
  if (view === "landing")
    return (
      <>
        {notice && (
          <div
            role="status"
            className="border-border mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-lg border p-4 text-sm"
          >
            <span>{notice}</span>
            {storageBlocked && (
              <Button variant="outline" onClick={() => setView("dashboard")}>
                Storage recovery
              </Button>
            )}
            <Button
              variant="ghost"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X />
            </Button>
          </div>
        )}
        <Landing
          onBuild={() => open(draft ?? newPortfolio())}
          onExample={() => open(examples()[0]!)}
          onLogin={() => setView("login")}
          onDashboard={() => setView("dashboard")}
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
  if (view === "login")
    return (
      <Login
        onLanding={() => {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
          window.scrollTo(0, 0);
          setView("landing");
        }}
        onDashboard={() => (draft ? open(draft) : setView("dashboard"))}
      />
    );
  if (view === "portfolio" && !draft)
    return (
      <main className="p-10">
        <h1 className="text-2xl">Portfolio not found</h1>
        <p className="mt-4">
          This local demo portfolio is not available in this browser.
        </p>
        <Button className="mt-5" onClick={() => setView("dashboard")}>
          Go to dashboard
        </Button>
      </main>
    );
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
    ? series(equalWeights(["VOO"]), result.range, Number(result.amount))
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
    <main
      className={`min-h-screen ${view === "portfolio" ? "portfolio-editor-copy" : ""}`}
    >
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-9">
        <button
          className="text-lg font-semibold"
          onClick={() => setView("landing")}
        >
          Tikr
        </button>
        <span className="text-muted-foreground text-xs">
          Local demo · synthetic sample data
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("dashboard")}>
            Experiments
          </Button>
          <Button onClick={() => open(newPortfolio())}>
            <Plus />
            Create portfolio
          </Button>
        </div>
      </header>
      <div
        className={`${view === "dashboard" ? "min-h-[calc(100svh-81px)] content-center" : ""} mx-auto max-w-7xl px-5 py-8 md:px-9 md:py-12`}
      >
        {notice && (
          <div
            role="status"
            className="border-border mb-5 flex flex-wrap items-center gap-4 rounded-lg border p-4 text-sm"
          >
            {notice}
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
          <Button
            variant="outline"
            onClick={() => {
              try {
                localStorage.removeItem(key);
                setStorageBlocked(false);
                setNotice(
                  "Local demo storage reset; current in-memory work will be saved.",
                );
              } catch {
                setNotice("Browser storage is still unavailable.");
              }
            }}
          >
            Reset local demo storage
          </Button>
        )}
        {view === "dashboard" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-muted-foreground text-xs tracking-[.18em] uppercase">
                  Portfolio lab
                </p>
                <h1 className="mt-2 text-3xl tracking-tight">
                  Your experiments
                </h1>
                <p className="text-muted-foreground mt-3 text-sm">
                  All your portfolios in one place.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="order-1 w-full sm:order-3 sm:w-72">
                <RangePicker alignStart value={range} onChange={setRange} />
              </div>
              {draft && (
                <Button
                  variant="outline"
                  className="order-2 max-w-full break-words whitespace-normal sm:order-1"
                  onClick={() => open(draft)}
                >
                  Resume draft: {draft.name}
                </Button>
              )}
              <Button
                variant="outline"
                aria-pressed={voo}
                onClick={() => setVoo((current) => !current)}
                className={`order-3 sm:order-2 ${voo ? "!bg-card hover:!bg-muted" : "!bg-background hover:!bg-muted"}`}
              >
                Show VOO
              </Button>
            </div>
            {portfolios.length === 0 ? (
              <section className="border-border bg-card mt-8 flex min-h-96 flex-col items-center justify-center rounded-xl border px-5 py-10 text-center md:px-7 md:py-12">
                <Image
                  src="/illustrations/dashboard-suitcase.svg"
                  alt=""
                  aria-hidden="true"
                  width={260}
                  height={230}
                  unoptimized
                  className="h-auto w-56 max-w-full"
                />
                <p className="text-muted-foreground mt-4 text-sm">
                  Your portfolios will appear here.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => open(newPortfolio())}>
                    Build a portfolio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPortfolios(examples())}
                  >
                    Load sample experiments
                  </Button>
                </div>
              </section>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...portfolios]
                  .sort(
                    (a, b) =>
                      Number(b.pinned) - Number(a.pinned) ||
                      b.updated - a.updated ||
                      a.id.localeCompare(b.id),
                  )
                  .map((p) => (
                    <Card
                      key={p.id}
                      p={p}
                      range={range}
                      onOpen={() => open(p)}
                      voo={voo}
                    />
                  ))}
              </div>
            )}
            <div className="mt-8">
              <p className="text-muted-foreground text-xs">
                Dashboard charts start at $10,000.
              </p>
              <Disclosure />
            </div>
          </>
        ) : (
          draft && (
            <>
              <button
                className="text-muted-foreground mb-5 text-sm"
                onClick={() => setView("dashboard")}
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
                    {draft.holdings.length === 1 ? "asset" : "assets"} - Local
                    demo
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setView("login")}>
                    Sign-in preview
                  </Button>
                  <Button disabled={!valid} onClick={save}>
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
                      const original = portfolios.find(
                        (p) => p.id === draft.id,
                      )!;
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
                      const original = portfolios.find(
                        (p) => p.id === draft.id,
                      );
                      if (
                        !original ||
                        !window.confirm(`Delete ${original.name}?`)
                      )
                        return;
                      const remaining = portfolios.filter(
                        (p) => p.id !== original.id,
                      );
                      try {
                        localStorage.setItem(
                          key,
                          JSON.stringify({
                            version: 1,
                            portfolios: remaining,
                            draft: null,
                          }),
                        );
                      } catch {
                        setNotice(
                          "Browser storage is unavailable; deletion could not be saved.",
                        );
                        return;
                      }
                      deleting.current = true;
                      setPortfolios(remaining);
                      setNotice(`Deleted ${original.name}.`);
                      setView("dashboard");
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
                      <p
                        className="text-muted-foreground mt-2 text-xs"
                        role="status"
                      >
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
                      aria-pressed={voo}
                      onClick={() => setVoo((value) => !value)}
                      className={
                        voo
                          ? "!bg-card hover:!bg-muted"
                          : "!bg-background hover:!bg-muted"
                      }
                    >
                      Show VOO
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
                            "Difference vs VOO",
                            `${(stats.return - metrics(benchmark).return).toFixed(2)} pp`,
                          ],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-muted-foreground text-xs">
                              {label}
                            </p>
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
                        {money(
                          Math.abs(stats.ending - Number(result.amount)),
                        )}{" "}
                        change
                      </p>
                      <HistoryChart
                        amount={Number(result.amount)}
                        dollars={dollars}
                        lines={[
                          { name: result.name, points: activePoints },
                          ...(visibleComparisonLines.includes("benchmark")
                            ? [
                                {
                                  name: "VOO ETF benchmark",
                                  points: benchmark,
                                  kind: "benchmark" as const,
                                  exiting: !voo,
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
                                comparisonColors[
                                  index % comparisonColors.length
                                ],
                            }))
                            .filter(({ p }) =>
                              visibleComparisonLines.includes(
                                `portfolio:${p.id}`,
                              ),
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
                      Use Edit above to complete the allocation and starting
                      amount.
                    </div>
                  )}
                  <fieldset
                    className="border-border mt-6 min-w-0 border-t pt-4"
                    aria-describedby="comparison-help"
                  >
                    <legend className="pr-3 text-base font-semibold">
                      Compare portfolios
                    </legend>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        id="comparison-help"
                        className="text-muted-foreground text-sm"
                      >
                        Choose up to two. Same dates and starting amount.
                      </p>
                      <span
                        className="text-muted-foreground text-sm"
                        role="status"
                      >
                        {comparison.length} / 2 selected
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {portfolios
                        .filter((p) => p.id !== draft.id)
                        .sort(
                          (a, b) =>
                            comparisonRank(a.id) - comparisonRank(b.id) ||
                            a.id.localeCompare(b.id),
                        )
                        .map((p, index) => {
                          const selected = comparison.includes(p.id);
                          return (
                            <Button
                              key={p.id}
                              variant="outline"
                              aria-pressed={selected}
                              disabled={!selected && comparison.length >= 2}
                              onClick={() =>
                                setComparison((old) =>
                                  old.includes(p.id)
                                    ? old.filter((id) => id !== p.id)
                                    : old.length < 2
                                      ? [...old, p.id]
                                      : old,
                                )
                              }
                              className={`h-auto min-h-10 max-w-full gap-2 px-3 py-2 text-left whitespace-normal ${selected ? "!bg-card hover:!bg-muted border-stone-500" : "!bg-background hover:!bg-muted"}`}
                            >
                              <span
                                className="min-w-0 break-words"
                                style={{
                                  color:
                                    comparisonColors[
                                      index % comparisonColors.length
                                    ],
                                }}
                              >
                                {p.name}
                              </span>
                              {selected ? (
                                <Check aria-hidden="true" className="size-4" />
                              ) : (
                                <Plus aria-hidden="true" className="size-4" />
                              )}
                            </Button>
                          );
                        })}
                    </div>
                    {!portfolios.some((p) => p.id !== draft.id) && (
                      <p className="text-muted-foreground mt-3 text-sm">
                        Save another portfolio to compare it here.
                      </p>
                    )}
                  </fieldset>
                </section>
                {result && (
                  <section className={`${panel} order-2`}>
                    <h2 className="text-xl">Asset returns</h2>
                    {resultsOutdated && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Showing the last valid allocation. Complete your edits
                        to update.
                      </p>
                    )}
                    <HoldingReturns portfolio={result} />
                  </section>
                )}
              </div>
            </>
          )
        )}
      </div>
    </main>
  );
}
