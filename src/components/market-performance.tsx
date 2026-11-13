"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { marketErrorMessage } from "~/lib/market-errors";
import type { MarketRequest, MarketResponse } from "~/lib/market-contract";
import type { Portfolio, Range } from "~/lib/demo";
import { HoldingReturns } from "./holding-returns";
import { HistoryChart } from "./history-chart";
import { readBrowserHistory, saveBrowserHistory } from "~/lib/browser-history";
import { fetchMarket } from "~/lib/market-client-batch";
// Only the explicitly marked synthetic review may bypass the server. Real-data
// requests must pass the server's correction and revocation checks every time.
const reviewCache = new Map<string, { value: MarketResponse; until: number }>();
const REVIEW_CACHE_LIMIT = 8;
const REVIEW_CACHE_MS = 30_000;
export function useMarketResults(
  portfolios: Portfolio[],
  range: Range,
  amount: string,
) {
  const [view, setView] = useState<MarketResponse>({ status: "refreshing" });
  const [attempt, setAttempt] = useState(0);
  const retryIntent = useRef<{ key: string; nonce: number } | null>(null),
    retryNonce = useRef(0);
  const key = JSON.stringify({
    portfolios: portfolios.map((p) => ({
      id: p.id,
      holdings: p.holdings.map((h) => ({ symbol: h.ticker, weight: h.weight })),
    })),
    range,
    amount,
  });
  const [receivedFor, setReceivedFor] = useState("");
  const [displayPortfolios, setDisplayPortfolios] = useState(portfolios);
  const [displayAmount, setDisplayAmount] = useState(amount);
  const latestInputs = useRef({ portfolios, amount });
  const displayedRef = useRef({ view, displayPortfolios });
  displayedRef.current = { view, displayPortfolios };
  latestInputs.current = { portfolios, amount };
  useEffect(() => {
    const inputs = latestInputs.current;
    const abort = new AbortController();
    if (retryIntent.current?.key !== key) retryIntent.current = null;
    const previous = displayedRef.current;
    const removedComparison =
      previous.view.series &&
      previous.displayPortfolios
        .slice(1)
        .some((p) => !inputs.portfolios.some((active) => active.id === p.id));
    const exitDelay =
      removedComparison &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 900
        : 0;
    const started = Date.now();
    let exitTimer: number | undefined;
    const publish = (value: MarketResponse) => {
      const remaining = Math.max(0, exitDelay - (Date.now() - started));
      const commit = () => {
        if (abort.signal.aborted) return;
        if (
          value.evidenceExpiresAt &&
          !(Date.parse(value.evidenceExpiresAt) > Date.now())
        ) {
          setReceivedFor(key);
          setView({ status: "blocked", code: "EVIDENCE_EXPIRED" });
          return;
        }
        if (value.series) {
          setDisplayPortfolios(inputs.portfolios);
          setDisplayAmount(inputs.amount);
        }
        setReceivedFor(key);
        setView(value);
      };
      if (remaining) exitTimer = window.setTimeout(commit, remaining);
      else commit();
    };
    const cached = reviewCache.get(key);
    if (
      !retryIntent.current &&
      cached &&
      cached.until > Date.now() &&
      (!cached.value.evidenceExpiresAt ||
        Date.parse(cached.value.evidenceExpiresAt) > Date.now())
    ) {
      publish(cached.value);
      return () => {
        abort.abort();
        if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      };
    }
    if (cached) reviewCache.delete(key);
    const timer = window.setTimeout(() => {
      setView((previous) =>
        previous.series
          ? { ...previous, status: "refreshing" }
          : { status: "refreshing" },
      );
      void (async () => {
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        try {
          const body = JSON.parse(key) as MarketRequest;
          const history = await readBrowserHistory([
            ...new Set([
              "SPY",
              ...body.portfolios.flatMap((p) =>
                p.holdings.map((h) => h.symbol),
              ),
            ]),
          ]);
          const retry =
            retryIntent.current?.key === key &&
            retryIntent.current.nonce === attempt;
          retryIntent.current = null;
          const response = await fetchMarket(
            { ...body, retry, ...(history.length ? { history } : {}) },
            AbortSignal.any([abort.signal, AbortSignal.timeout(55000)]),
          );
          if (!response.ok || !response.body) {
            if (!abort.signal.aborted) {
              const failure = (await response.json().catch(() => undefined)) as
                MarketResponse | undefined;
              publish({
                status: "blocked",
                issues: failure?.issues,
                code: marketErrorMessage(failure?.code)
                  ? failure?.code
                  : "DATA_UNAVAILABLE",
                retryAt: Number.isSafeInteger(failure?.retryAt)
                  ? failure?.retryAt
                  : undefined,
              });
            }
            return;
          }
          reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = "",
            bytes = 0;
          let finalValue: MarketResponse | undefined;
          const syntheticReview =
            response.headers.get("X-Tikr-Synthetic-Review") === "1";
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 5_000_000) throw new Error("RESPONSE_LIMIT");
            pending += decoder.decode(chunk.value, { stream: true });
            let split;
            while ((split = pending.indexOf("\n")) >= 0) {
              const value = JSON.parse(
                pending.slice(0, split),
              ) as MarketResponse;
              pending = pending.slice(split + 1);
              if (
                !["ready", "stale", "refreshing", "blocked"].includes(
                  value.status,
                )
              )
                throw new Error("INVALID_RESPONSE");
              if (value.status !== "refreshing") finalValue = value;
            }
          }
          if (pending.trim() || !finalValue)
            throw new Error("INCOMPLETE_RESPONSE");
          if (!abort.signal.aborted) {
            if (finalValue.status === "ready" && finalValue.history)
              void saveBrowserHistory(finalValue.history);
            delete finalValue.history;
            if (
              syntheticReview &&
              finalValue.status === "ready" &&
              finalValue.series
            ) {
              reviewCache.delete(key);
              reviewCache.set(key, {
                value: finalValue,
                until: Date.now() + REVIEW_CACHE_MS,
              });
              if (reviewCache.size > REVIEW_CACHE_LIMIT)
                reviewCache.delete(reviewCache.keys().next().value!);
            }
            publish(finalValue);
          }
        } catch {
          if (!abort.signal.aborted) {
            setReceivedFor(key);
            setView({ status: "blocked", code: "DATA_UNAVAILABLE" });
          }
        } finally {
          await reader?.cancel().catch(() => undefined);
          reader?.releaseLock();
        }
      })();
    }, 250);
    return () => {
      window.clearTimeout(timer);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      abort.abort();
    };
  }, [key, attempt]);
  useEffect(() => {
    if (!view.evidenceExpiresAt) return;
    const delay = Date.parse(view.evidenceExpiresAt) - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) {
      setView({ status: "blocked", code: "EVIDENCE_EXPIRED" });
      return;
    }
    const timeout = window.setTimeout(
      () => setView({ status: "blocked", code: "EVIDENCE_EXPIRED" }),
      Math.min(delay, 2_147_483_647),
    );
    return () => window.clearTimeout(timeout);
  }, [view.evidenceExpiresAt]);
  const visibleView = useMemo(
    () =>
      receivedFor === key
        ? view
        : view.series &&
            (!view.evidenceExpiresAt ||
              Date.parse(view.evidenceExpiresAt) > Date.now())
          ? { ...view, status: "refreshing" as const }
          : { status: "refreshing" as const },
    [receivedFor, key, view],
  );
  const retry = useCallback(() => {
    const nonce = ++retryNonce.current;
    retryIntent.current = { key, nonce };
    setAttempt(nonce);
  }, [key]);
  return { view: visibleView, displayPortfolios, displayAmount, retry };
}
export function DataStatus({
  view,
  compact = false,
}: {
  view: MarketResponse;
  compact?: boolean;
}) {
  if (
    compact &&
    view.dataQuality !== "personal-provisional" &&
    view.dataQuality !== "synthetic" &&
    (view.status === "ready" || view.status === "refreshing") &&
    !view.shortenedBy?.length &&
    (!view.requested ||
      !view.period ||
      view.requested.start === view.period.start)
  )
    return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground mt-3 text-xs leading-relaxed"
    >
      {view.dataQuality === "synthetic" && (
        <span className="block">Synthetic QA data; not market history.</span>
      )}
      {view.dataQuality === "personal-provisional" && view.series && (
        <span className="block">
          Personal provisional Alpaca data; subject to corrections.
          Corporate-action completeness is not independently verified.
        </span>
      )}
      {marketErrorMessage(view.code) ??
        (view.status === "blocked"
          ? view.dataQuality === "personal-provisional"
            ? "We couldn't load market history right now. Please try again later."
            : "We couldn't load market history right now. Please try again later."
          : view.status === "refreshing"
            ? view.series
              ? view.dataQuality === "personal-provisional"
                ? "Refreshing; showing the last provisional result."
                : "Refreshing; showing the last verified result."
              : "Loading market history…"
            : view.status === "stale"
              ? view.dataQuality === "personal-provisional"
                ? "Showing the last provisional result; newer data is unavailable."
                : "Showing the last verified result; newer data is unavailable."
              : compact
                ? null
                : "Alpaca SIP daily closes · dividends reinvested on payment date")}
      {view.status === "stale" && marketErrorMessage(view.code) ? (
        <span className="block">
          Showing the last{" "}
          {view.dataQuality === "personal-provisional"
            ? "provisional"
            : "verified"}{" "}
          result.
        </span>
      ) : null}
      {view.retryAt && Number.isSafeInteger(view.retryAt) ? (
        <span className="block">
          Retry after {new Date(view.retryAt).toLocaleString()}.
        </span>
      ) : null}
      {view.issues?.length ? (
        <ul
          aria-label="History limitations"
          className="text-destructive mt-2 space-y-1"
        >
          {view.issues.map((issue) => (
            <li key={issue.symbol}>
              <strong>{issue.symbol}</strong>:{" "}
              {issue.code === "SHORT_HISTORY" && issue.firstAvailable
                ? `Confirmed available history starts ${issue.firstAvailable}. This portfolio cannot cover the requested period. Choose a shorter period.`
                : (marketErrorMessage(issue.code) ??
                  "History could not be loaded. The underlying cause is unknown.")}
            </li>
          ))}
        </ul>
      ) : null}
      {view.requested &&
        view.period &&
        view.requested.start !== view.period.start && (
          <span className="block">
            Requested from {view.requested.start}; actual shared start{" "}
            {view.period.start}.
          </span>
        )}
      {(!compact || view.status === "stale") && view.asOf && (
        <span className="block">
          Market data as of {view.asOf}
          {view.dataCheckedAt
            ? ` · checked ${new Date(view.dataCheckedAt).toLocaleString()}`
            : ""}
        </span>
      )}
    </div>
  );
}
export const currency = (text: string) =>
  `${text.startsWith("-") ? "-" : ""}$${text.replace(/^-/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
export type MarketResult = ReturnType<typeof useMarketResults>;
export function MarketPerformance(props: {
  portfolios: Portfolio[];
  range: Range;
  amount: string;
  spy: boolean;
  dollars?: boolean;
  compact?: boolean;
  comparisons?: ReactNode;
  comparisonColors?: Record<string, string>;
}) {
  const result = useMarketResults(props.portfolios, props.range, props.amount);
  return <MarketPerformanceView {...props} result={result} />;
}
export function MarketPerformanceView({
  portfolios,
  spy,
  dollars = false,
  compact = false,
  comparisons,
  comparisonColors,
  result,
}: {
  portfolios: Portfolio[];
  range: Range;
  amount: string;
  spy: boolean;
  dollars?: boolean;
  compact?: boolean;
  comparisons?: ReactNode;
  comparisonColors?: Record<string, string>;
  result: MarketResult;
}) {
  const { view, retry, displayPortfolios, displayAmount } = result;
  const main = view.series?.find((s) => s.id === displayPortfolios[0]?.id);
  const lines: Parameters<typeof HistoryChart>[0]["lines"] =
    displayPortfolios.map((p, i) => ({
      id: p.id,
      name: p.name,
      points: view.series?.find((s) => s.id === p.id)?.points ?? [],
      ...(i
        ? {
            kind: "comparison" as const,
            color: comparisonColors?.[p.id] ?? "#91b8d0",
            exiting: !portfolios.some((active) => active.id === p.id),
          }
        : {}),
    }));
  if (spy && view.series?.some((s) => s.id === "SPY"))
    lines.push({
      id: "SPY",
      name: "SPY ETF benchmark",
      points: view.series.find((s) => s.id === "SPY")?.points ?? [],
      kind: "benchmark" as const,
      color: undefined,
    });
  return (
    <div className={compact ? "flex min-h-0 flex-1 flex-col" : ""}>
      {main && (
        <>
          {!compact && (
            <p className="text-muted-foreground mt-4 text-xs">
              {view.period?.start} – {view.period?.end} ·{" "}
              {currency(Number(displayAmount).toFixed(2))} starting amount
              {view.status === "refreshing" && <span> · Updating…</span>}
            </p>
          )}
          <div className={compact ? "mt-4" : "my-7 grid gap-5 sm:grid-cols-4"}>
            {(compact
              ? [["Total return", `${main.totalReturn}%`]]
              : [
                  ["Ending value", currency(main.ending)],
                  ["Total return", `${main.totalReturn}%`],
                  ["Difference vs SPY", `${main.difference ?? "—"} pp`],
                  ["Largest decline", `${main.drawdown}%`],
                ]
            ).map(([label, value]) => (
              <div key={label}>
                {!compact && (
                  <p className="text-muted-foreground text-xs">{label}</p>
                )}
                <p
                  className={`mt-2 text-2xl tabular-nums ${view.status === "refreshing" ? "market-pulse" : ""}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div
            className={`${compact ? "flex min-h-0 flex-1 flex-col pt-4" : ""} ${view.status === "refreshing" ? "market-pulse" : ""}`}
          >
            <HistoryChart
              compact={compact}
              table={false}
              amount={Number(displayAmount)}
              dollars={dollars}
              lines={lines}
            />
          </div>
        </>
      )}
      {!main &&
        (view.status === "refreshing" ? (
          <div
            role="status"
            className={
              compact
                ? "mt-6 flex min-h-56 flex-1 flex-col"
                : "mt-4 min-h-[440px]"
            }
          >
            <span className="sr-only">Loading history…</span>
            <div
              aria-hidden="true"
              className="market-pulse flex h-full flex-1 flex-col gap-5"
            >
              <div className="bg-muted h-6 w-24 rounded" />
              <div
                className={
                  compact
                    ? "border-border min-h-44 flex-1 rounded border"
                    : "border-border h-72 rounded border"
                }
              />
              <div className="bg-muted h-4 w-32 rounded" />
            </div>
          </div>
        ) : (
          <div
            className={`text-muted-foreground grid place-items-center text-center text-sm ${compact ? "min-h-56 flex-1" : "min-h-[440px]"}`}
          >
            Market history unavailable
          </div>
        ))}
      {!compact && main && (
        <div className="sr-only">
          <div>
            <table className="w-full text-right tabular-nums">
              <caption className="text-muted-foreground py-3 text-left">
                Daily values for the same shared period; displayed dollars
                rounded to two decimals.
              </caption>
              <thead>
                <tr>
                  <th className="p-2 text-left">Date</th>
                  {lines.map((l) => (
                    <th key={l.id} className="p-2">
                      {l.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {main.points.map((p, i) => (
                  <tr key={p.date}>
                    <th className="p-2 text-left font-normal">{p.date}</th>
                    {lines.map((l) => (
                      <td key={l.id} className="p-2">
                        {l.points[i]?.dollars
                          ? currency(l.points[i].dollars)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {compact && main && (
        <p
          className={`text-muted-foreground mt-1 text-sm ${view.status === "refreshing" ? "market-pulse" : ""}`}
        >
          {main.change.startsWith("-") ? "" : "+"}
          {currency(main.change)} change
        </p>
      )}
      {!compact && comparisons}
      {!compact && main && (
        <section className="border-border mt-6 border-t pt-5">
          <h3 className="text-lg">Asset returns</h3>
          <HoldingReturns
            portfolio={displayPortfolios[0] ?? null}
            verifiedReturns={view.assetReturns}
          />
        </section>
      )}
      <DataStatus view={view} compact={compact} />
      {!compact && view.status !== "ready" && view.status !== "refreshing" && (
        <button
          type="button"
          className="mt-3 min-h-10 text-sm underline underline-offset-4"
          onClick={retry}
        >
          Retry data check
        </button>
      )}
    </div>
  );
}
