"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import {
  AnimatedSearchRows,
  SearchResultsViewport,
} from "~/components/animated-search-results";
import { Skeleton } from "~/components/ui/skeleton";
import { SearchRowsSkeleton } from "~/components/loading-skeletons";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DISCOVERY,
  type DiscoveryAdapter,
  type DiscoveryResult,
  type DiscoveryUsage,
} from "~/lib/ai-discovery";
export type { DiscoveryAdapter, DiscoveryResult } from "~/lib/ai-discovery";
// Default remains unavailable. Production injects an authenticated adapter only
// when explicitly enabled; the separate test harness supplies its own fixture.
export const DiscoveryPreview = createContext<DiscoveryAdapter | null>(null);
export const DiscoveryAllowancePending = createContext(false);
export const DiscoveryAllowance = createContext<DiscoveryUsage | null>(null);
export const DiscoveryPreviewMode = createContext(true);
export function AiAssetSearch({
  normal,
  normalResults,
  signedIn,
  selected,
  onAdd,
}: {
  normal: React.ReactNode;
  normalResults: React.ReactNode;
  signedIn: boolean;
  selected: string[];
  onAdd: (ticker: string) => void;
}) {
  const adapter = useContext(DiscoveryPreview);
  const allowance = useContext(DiscoveryAllowance);
  const allowancePending = useContext(DiscoveryAllowancePending);
  const preview = useContext(DiscoveryPreviewMode);
  const shimmerId = useId();
  const [ai, setAi] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => active.current?.abort(), [adapter]);
  useEffect(() => {
    if (!signedIn) {
      active.current?.abort();
      active.current = null;
      setBusy(false);
      setAi(false);
    } else if (ai) input.current?.focus();
  }, [ai, signedIn]);
  function cancel() {
    active.current?.abort();
    active.current = null;
    setBusy(false);
  }
  function requireSignIn() {
    if (signedIn) return true;
    toast("You must be signed in.", {
      id: "ai-sign-in-required",
      dismissible: false,
    });
    return false;
  }
  async function submit() {
    if (!requireSignIn() || !prompt.trim()) return;
    cancel();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    try {
      const next = adapter
        ? await adapter({ prompt: prompt.trim(), signal: controller.signal })
        : {
            kind: "unavailable" as const,
            message:
              "AI discovery is not available yet. Use ticker or company search.",
          };
      if (!controller.signal.aborted && active.current === controller) {
        setSubmitted(prompt);
        setResult(next);
      }
    } catch {
      if (!controller.signal.aborted && active.current === controller)
        setResult({
          kind: "error",
          message: "Could not find assets. Try again or use ticker search.",
        });
    } finally {
      if (active.current === controller) {
        setBusy(false);
        active.current = null;
      }
    }
  }
  return (
    <div data-ui className="mt-3">
      <div
        className="asset-search-field ai-discovery-field relative h-[104px] w-full cursor-text rounded-lg border"
        data-ai={ai}
        data-busy={busy}
        onClick={(event) => {
          // Keep controls and native text selection independent of field clicks.
          if ((event.target as Element).closest("button, input, textarea"))
            return;
          if (ai) input.current?.focus();
          else event.currentTarget.querySelector("input")?.focus();
        }}
      >
        <div
          aria-hidden={ai}
          inert={ai}
          data-mode="normal"
          className="ai-mode-text absolute top-0 right-0 left-0"
        >
          {normal}
        </div>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            {/* Electric edge adapted from Balint Ferenczy's CodePen KwdoyEN. */}
            <filter
              id={shimmerId}
              x="-20%"
              y="-80%"
              width="140%"
              height="260%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="turbulence"
                baseFrequency="0.025"
                numOctaves="3"
                seed="1"
                result="noise"
              />
              <feOffset in="noise" result="first">
                <animate
                  attributeName="dy"
                  values="160;0"
                  dur={busy ? "3s" : "6s"}
                  repeatCount="indefinite"
                />
              </feOffset>
              <feOffset in="noise" result="second">
                <animate
                  attributeName="dy"
                  values="0;-160"
                  dur={busy ? "3s" : "6s"}
                  repeatCount="indefinite"
                />
              </feOffset>
              <feBlend
                in="first"
                in2="second"
                mode="color-dodge"
                result="movingNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="movingNoise"
                scale="12"
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
          </defs>
          <rect
            className="ai-discovery-rim"
            pathLength="100"
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="7"
          />
          <rect
            className="ai-discovery-electric"
            pathLength="100"
            style={{ filter: `url(#${shimmerId})` }}
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="7"
          />
        </svg>
        <textarea
          aria-hidden={!ai}
          inert={!ai}
          tabIndex={ai ? 0 : -1}
          data-mode="ai"
          ref={input}
          aria-label="Describe assets"
          aria-describedby={adapter && preview ? "ai-preview-note" : undefined}
          rows={4}
          maxLength={DISCOVERY.maxPrompt}
          value={prompt}
          placeholder="Describe an industry, theme, or kind of company…"
          onChange={(e) => {
            cancel();
            setPrompt(e.target.value);
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault();
              void submit();
            }
          }}
          className="ai-mode-text absolute inset-0 block h-full min-h-0 w-full resize-none rounded-lg bg-transparent py-2.5 pr-[5.25rem] pl-2.5 text-sm focus-visible:outline-none"
        />
        <div className="absolute top-2 right-2 bottom-2 flex flex-col justify-between">
          <Button
            variant="outline"
            className={`ai-mode-control shrink-0 ${ai ? "!bg-muted ai-mode-active border-stone-500" : ""}`}
            aria-pressed={ai}
            onClick={() => {
              if (!ai && !requireSignIn()) return;
              cancel();
              setAi(!ai);
            }}
          >
            <Sparkles aria-hidden="true" />
            AI
          </Button>
          <div
            className="ai-mode-submit shrink-0"
            aria-hidden={!ai}
            inert={!ai}
          >
            <Button
              className="ai-mode-control"
              aria-label="Find assets"
              disabled={!prompt.trim()}
              onClick={() => {
                if (ai) void submit();
              }}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
      <SearchResultsViewport>
        {!ai && normalResults}
        {ai &&
          (adapter !== null ||
            busy ||
            result !== null ||
            allowance !== null) && (
            <div className="mt-3 space-y-3 text-sm">
              {allowancePending && !allowance && (
                <div role="status" aria-label="Loading AI allowance">
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
              )}
              {allowance && (
                <p role="status" className="text-muted-foreground">
                  <span
                    className={
                      allowance.remaining <= 5 ? "ai-allowance-low" : undefined
                    }
                  >
                    {allowance.remaining}
                  </span>{" "}
                  of {allowance.limit} AI searches remaining today. Resets{" "}
                  {new Date(allowance.resetAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  .
                </p>
              )}
              {adapter && preview && (
                <p id="ai-preview-note" className="text-muted-foreground">
                  AI interaction preview - sample results; no AI request.
                </p>
              )}
              {!prompt && adapter && preview && (
                <div className="flex flex-wrap gap-2">
                  {[
                    "Semiconductor equipment",
                    "Renewable energy beyond solar",
                    "Data-center infrastructure",
                  ].map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      className="h-auto min-h-11 text-left text-xs whitespace-normal"
                      onClick={() => {
                        setPrompt(s);
                        input.current?.focus();
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
              <div role="status" aria-live="polite">
                {busy
                  ? preview
                    ? "Finding sample assets…"
                    : "Finding assets…"
                  : result?.kind === "results"
                    ? result.summary
                    : result?.kind === "clarification"
                      ? result.question
                      : result?.message}
                {result && submitted !== prompt && (
                  <p className="text-muted-foreground mt-2 text-xs italic">
                    Previous prompt results. Submit your edited prompt to
                    update.
                  </p>
                )}
              </div>
              {busy && result?.kind !== "results" && <SearchRowsSkeleton />}
              {busy && (
                <Button variant="outline" onClick={cancel}>
                  Cancel search
                </Button>
              )}
              {result?.kind === "clarification" && (
                <div className="flex flex-wrap gap-2">
                  {result.answers.map((s) => (
                    <Button
                      variant="outline"
                      key={s}
                      className="h-auto min-h-11 text-left whitespace-normal"
                      onClick={() => {
                        setPrompt(`${submitted}: ${s}`);
                        input.current?.focus();
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
              <AnimatedSearchRows
                className="space-y-1"
                items={
                  result?.kind === "results"
                    ? result.assets.map((a) => {
                        const added = selected.includes(a.ticker);
                        return {
                          key: a.ticker,
                          content: (
                            <div className="flex items-center gap-3 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold">
                                  {a.ticker}{" "}
                                  <span className="font-normal text-stone-300">
                                    {a.name}
                                  </span>
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                disabled={added || selected.length >= 6}
                                onClick={() => onAdd(a.ticker)}
                              >
                                {added ? "Added" : "Add"}
                              </Button>
                            </div>
                          ),
                        };
                      })
                    : []
                }
              />
            </div>
          )}
      </SearchResultsViewport>
    </div>
  );
}
