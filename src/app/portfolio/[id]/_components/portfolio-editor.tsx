"use client";

import type { CatalogAsset } from "~/lib/asset-catalog";
import { useEffect, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import {
  allocation,
  equalWeights,
  validAmount,
  type Portfolio,
} from "~/lib/demo";
import { Button } from "~/components/ui/button";
import { DialogDescription, DialogTitle } from "~/components/ui/dialog";

const catalogMessages: Record<string, string> = {
  CATALOG_NOT_ENABLED:
    "Market data is configured but not enabled for this server. Enable the intended mode and restart; sample results are not substituted.",
  STORAGE_CAPACITY:
    "Market-data storage capacity is exhausted. Operator review is needed.",
  REFRESH_BUSY:
    "Other data requests are still running. Please retry when they finish.",
  TEAM_BUDGET_UNVERIFIED: "The shared data budget needs operator review.",
  CATALOG_PROVIDER:
    "The catalog provider could not complete the import. Retry later; persistent failures need operator review.",
  CATALOG_INVALID:
    "Catalog validation failed. Operator review is needed before search can become available.",
  CATALOG_LIMIT:
    "Catalog import exceeded its bounded capacity. Operator review is needed.",
};

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm";

export function PortfolioEditor({
  portfolio,
  onChange,
  onClose,
  nameError = "",
  suggestedName,
}: {
  portfolio: Portfolio;
  onChange: (portfolio: Portfolio) => void;
  onClose: () => void;
  nameError?: string;
  suggestedName?: string;
}) {
  const failedRetry = useRef<number | null>(null);
  const [retrySearch, setRetrySearch] = useState(0);
  const [searchFailed, setSearchFailed] = useState(false);
  const [catalogSource, setCatalogSource] = useState("unknown");
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<CatalogAsset[]>([]);
  const [searchState, setSearchState] = useState(
    "Enter a ticker or company name.",
  );
  useEffect(() => {
    const controller = new AbortController();
    if (failedRetry.current === retrySearch) return;
    setFiltered([]);
    setSearchFailed(false);
    if (!search.trim()) {
      setSearchState("Enter a ticker or company name.");
      return;
    }
    setSearchState("Searching...");
    const timer = setTimeout(() => {
      void fetch(`/api/assets?q=${encodeURIComponent(search)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })
        .then(async (response) => {
          const source = response.headers.get("X-Tikr-Catalog");
          if (!controller.signal.aborted) setCatalogSource(source ?? "unknown");
          if (!response.ok) {
            const failure = (await response.json()) as {
              code?: string;
              retryAt?: number;
            };
            const retry = failure.retryAt
              ? ` Try again after ${new Date(failure.retryAt).toLocaleTimeString()}.`
              : "";
            const message =
              catalogMessages[failure.code ?? ""] ??
              (failure.code === "BROWSING_RATE_LIMIT"
                ? "Search is temporarily rate limited."
                : failure.code === "SHARED_BUDGET_EXHAUSTED"
                  ? "The shared data budget is exhausted."
                  : failure.code === "REFRESH_COOLDOWN"
                    ? "Catalog refresh is cooling down."
                    : "Asset search unavailable. Try again later.");
            throw Error(message + retry);
          }
          const rows: unknown = await response.json();
          if (
            !Array.isArray(rows) ||
            rows.some(
              (a: unknown) =>
                !a ||
                typeof a !== "object" ||
                !("ticker" in a) ||
                typeof a.ticker !== "string" ||
                !("name" in a) ||
                typeof a.name !== "string" ||
                !("exchange" in a) ||
                typeof a.exchange !== "string",
            )
          )
            throw Error("Invalid search response");
          if (!controller.signal.aborted) {
            setFiltered(rows as CatalogAsset[]);
            setSearchState(
              rows.length
                ? `${rows.length} results. History availability is checked separately.`
                : source === "sample"
                  ? "No matches in the six-asset sample catalog. Other assets require configured market data."
                  : source === "personal" || source === "hosted"
                    ? "No matching assets in the configured catalog."
                    : "No matching assets.",
            );
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            failedRetry.current = retrySearch;
            setSearchFailed(true);
            setSearchState(
              error instanceof Error &&
                [
                  ...Object.values(catalogMessages),
                  "Search is temporarily rate limited.",
                  "The shared data budget is exhausted.",
                  "Catalog refresh is cooling down.",
                ].some((m) => error.message.startsWith(m))
                ? error.message
                : "Asset search unavailable. Try again later.",
            );
          }
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, retrySearch]);
  const { holdings } = portfolio;
  const weights = allocation(holdings);
  const amountValid = validAmount(portfolio.amount);
  function select(ticker: string) {
    if (holdings.length >= 6 && !holdings.some((h) => h.ticker === ticker))
      return;
    const tickers = holdings.some((h) => h.ticker === ticker)
      ? holdings.filter((h) => h.ticker !== ticker).map((h) => h.ticker)
      : [...holdings.map((h) => h.ticker), ticker];
    onChange({
      ...portfolio,
      holdings: portfolio.manual
        ? tickers.map(
            (t) =>
              holdings.find((h) => h.ticker === t) ?? {
                ticker: t,
                weight: "0",
              },
          )
        : equalWeights(tickers),
    });
  }
  return (
    <>
      <DialogTitle className="pr-8 text-2xl font-bold">
        Edit portfolio
      </DialogTitle>
      <DialogDescription className="text-muted-foreground mt-2 text-sm">
        Shape your mix. Valid changes update the results automatically.
      </DialogDescription>
      <div className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <label
            htmlFor="portfolio-name"
            className="text-muted-foreground text-sm"
          >
            Portfolio name
          </label>
          <input
            id="portfolio-name"
            maxLength={80}
            value={portfolio.name}
            aria-invalid={!!nameError || !portfolio.name.trim()}
            aria-describedby={nameError ? "portfolio-name-error" : undefined}
            onChange={(e) => onChange({ ...portfolio, name: e.target.value })}
            className={`${field} aria-invalid:border-destructive aria-invalid:ring-destructive/30 mt-2 aria-invalid:ring-2`}
          />
          {nameError && (
            <p
              id="portfolio-name-error"
              role="status"
              className="text-destructive mt-2 text-sm"
            >
              {nameError}
              {suggestedName ? ` Try “${suggestedName}”.` : ""}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="portfolio-amount"
            className="text-muted-foreground text-sm"
          >
            Starting amount (USD)
          </label>
          <input
            id="portfolio-amount"
            inputMode="decimal"
            maxLength={16}
            value={portfolio.amount}
            aria-invalid={!amountValid}
            aria-describedby={!amountValid ? "amount-error" : undefined}
            onChange={(e) => onChange({ ...portfolio, amount: e.target.value })}
            className={`${field} mt-2`}
          />
          {!amountValid && (
            <p id="amount-error" className="mt-2 text-sm text-red-300">
              Enter $0.01 to $100,000,000, with up to two decimals.
            </p>
          )}
        </div>
      </div>
      <section
        className="border-border mt-6 border-t pt-5"
        aria-labelledby="add-assets-title"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="add-assets-title" className="text-lg">
            Choose assets
          </h3>
          <span className="text-muted-foreground text-sm">
            {catalogSource === "sample"
              ? "Sample catalog: six demo assets; market data is not configured"
              : catalogSource === "personal"
                ? "Personal Alpaca catalog"
                : catalogSource === "hosted"
                  ? "Hosted Alpaca catalog"
                  : catalogSource === "activation-required"
                    ? "Market catalog not enabled"
                    : "Asset catalog"}
          </span>
        </div>
        <div className="relative mt-3 flex items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            aria-label="Search assets"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name"
            className={`${field} mt-0 pl-10`}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((asset) => {
            const selected = holdings.some((h) => h.ticker === asset.ticker);
            return (
              <Button
                key={asset.ticker}
                variant="outline"
                disabled={!selected && holdings.length >= 6}
                aria-pressed={selected}
                aria-label={`${asset.ticker}, ${asset.name}`}
                onClick={() => select(asset.ticker)}
                className={`h-auto min-h-14 min-w-0 justify-between gap-3 px-3 py-2 text-left ${selected ? "!bg-muted border-stone-500" : "!bg-background hover:!bg-muted"}`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{asset.ticker}</span>
                  <span className="block truncate text-xs text-stone-400">
                    {asset.name}
                  </span>
                </span>
                {selected ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )}
              </Button>
            );
          })}
        </div>
        <p role="status" className="text-muted-foreground mt-3 text-sm">
          {searchState}
        </p>
        {holdings.length >= 6 && (
          <p role="status" className="mt-2 text-sm">
            Six holdings maximum. Remove a holding to add another.
          </p>
        )}
        {searchFailed && (
          <Button
            variant="outline"
            onClick={() => setRetrySearch((n) => n + 1)}
          >
            Retry search
          </Button>
        )}
      </section>
      <section
        className="border-border mt-6 border-t pt-5"
        aria-labelledby="allocation-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="allocation-title" className="text-lg">
            Allocation{" "}
            <span className="text-muted-foreground text-sm">
              ({holdings.length})
            </span>
          </h3>
          <Button
            variant="outline"
            disabled={!holdings.length}
            aria-pressed={!portfolio.manual}
            onClick={() =>
              onChange({
                ...portfolio,
                manual: false,
                holdings: equalWeights(holdings.map((h) => h.ticker)),
              })
            }
            className={!portfolio.manual ? "!bg-muted border-stone-500" : ""}
          >
            Equal weights {!portfolio.manual && <Check aria-hidden="true" />}
          </Button>
        </div>
        <div className="divide-border mt-3 divide-y">
          {holdings.map((holding) => (
            <div key={holding.ticker} className="flex items-center gap-3 py-2">
              <label
                htmlFor={`allocation-${holding.ticker}`}
                className="flex-1 font-medium"
              >
                {holding.ticker}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`allocation-${holding.ticker}`}
                  aria-label={`${holding.ticker} allocation percent`}
                  inputMode="decimal"
                  maxLength={8}
                  value={holding.weight}
                  onChange={(e) =>
                    onChange({
                      ...portfolio,
                      manual: true,
                      holdings: holdings.map((h) =>
                        h.ticker === holding.ticker
                          ? { ...h, weight: e.target.value }
                          : h,
                      ),
                    })
                  }
                  className="border-border bg-background w-20 rounded-lg border p-2 text-right text-sm"
                />
                <span className="text-stone-400">%</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${holding.ticker}`}
                onClick={() => select(holding.ticker)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        {!holdings.length && (
          <p className="text-muted-foreground mt-3 text-sm">
            Choose an asset above to start your allocation.
          </p>
        )}
      </section>
      <div className="border-border bg-card sticky -bottom-6 -mx-6 mt-5 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
        <div role="status" className="min-w-0 flex-1 text-sm">
          <p className="font-medium">
            {(weights.total / 100).toFixed(2)}% allocated
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {weights.valid
              ? !amountValid || !portfolio.name.trim()
                ? "Complete the name and starting amount."
                : "Results are up to date."
              : weights.total > 10000
                ? `${((weights.total - 10000) / 100).toFixed(2)}% over. Adjust the weights to continue.`
                : "Use positive weights totaling exactly 100%, with up to two decimals."}
          </p>
        </div>
        <Button
          disabled={!!nameError || !portfolio.name.trim()}
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </>
  );
}
