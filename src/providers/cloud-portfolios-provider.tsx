"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useConvexConnectionState,
} from "convex/react";
import { ConvexError } from "convex/values";
import { authClient } from "~/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { storageSchema, portfolioNameError, type Portfolio } from "~/lib/demo";
import {
  PortfolioContext,
  type PortfolioStore,
} from "./demo-portfolios-provider";

export function cloudPortfolio(row: Doc<"portfolios">): Portfolio {
  return {
    ...row.definition,
    id: row.clientId,
    updated: row.updated,
    revision: row.revision,
  };
}
export function cloudDefinition(p: Portfolio) {
  return {
    name: p.name,
    holdings: p.holdings,
    manual: p.manual,
    pinned: p.pinned,
    amount: p.amount,
    range: p.range,
    rangeChoice: p.rangeChoice,
  };
}
export function cloudError(error: unknown) {
  const code = error instanceof ConvexError ? String(error.data) : "";
  return (
    (
      {
        NAME_CONFLICT:
          "A portfolio with this name already exists. Choose another name.",
        REVISION_CONFLICT:
          "This portfolio changed in another tab or device. Your edits are still here. Load the cloud version or duplicate your edits with a new name.",
        PORTFOLIO_UNAVAILABLE:
          "This portfolio was deleted or is unavailable. Your edits are still here; duplicate them to save a new portfolio.",
        SIGN_IN_REQUIRED:
          "Your session expired. Sign in again before saving. This change has not been saved.",
        SESSION_CHANGED:
          "Your account session changed. This pending change was refused. Sign in to the original account and retry.",
        INVALID_FINANCIAL_DATA:
          "Use up to six unique holdings with positive weights totaling exactly 100% and a valid starting amount.",
        INVALID_EQUAL_WEIGHTS:
          "Equal weights must use the deterministic allocation. Choose Equal weights again or set manual weights.",
        INVALID_RANGE_CHOICE: "Choose the period again before saving.",
        INVALID_NAME:
          "Enter a portfolio name of up to 80 characters without control characters.",
      } as Record<string, string>
    )[code] ??
    "Cloud saving failed. Your edits are still here. Check your connection and retry; no local copy was saved."
  );
}
export function CloudPortfoliosProvider({
  children,
  sessionFence,
  accountId,
  suspended = false,
}: {
  children: ReactNode;
  sessionFence: string;
  accountId: string;
  suspended?: boolean;
}) {
  const router = useRouter();
  const auth = useConvexAuth();
  const connection = useConvexConnectionState();
  const [sessionKey] = useState(() => crypto.randomUUID());
  const { results, status, loadMore } = usePaginatedQuery(
    api.portfolios.list,
    auth.isAuthenticated ? { sessionKey } : "skip",
    { initialNumItems: 100 },
  );
  // The auth provider may briefly be transitioning JWTs during an account switch.
  // Show rows only when the server-verified account matches this mounted session.
  const accountResults = results.filter(
    (row) => row.sessionAccountId === accountId,
  );
  useEffect(() => {
    if (status === "CanLoadMore") loadMore(100);
  }, [status, loadMore]);
  const create = useMutation(api.portfolios.create);
  const update = useMutation(api.portfolios.update);
  const deletePortfolio = useMutation(api.portfolios.remove);
  const [draft, setDraft] = useState<Portfolio | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const retryAction = useRef<null | (() => Promise<void>)>(null);
  const lastOperation = useRef("save");
  const adoptedGuest = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    // Read the guest draft once. Cloud actions never write this browser key.
    try {
      const raw = localStorage.getItem("tikr-demo-v1");
      if (raw) {
        const local = storageSchema.parse(JSON.parse(raw));
        if (local.draft) setDraft({ ...local.draft, revision: undefined });
      }
    } catch {
      setNotice(
        "Browser portfolios could not be read. The originals have not been changed.",
      );
    }
    setLocalReady(true);
    return () => {
      mounted.current = false;
    };
  }, []);
  const portfolios = auth.isAuthenticated
    ? accountResults.map(cloudPortfolio)
    : [];
  useEffect(() => {
    if (!localReady || status !== "Exhausted" || adoptedGuest.current) return;
    adoptedGuest.current = true;
    // After a cloud save/reload the matching cloud record wins over the untouched guest draft.
    const saved = accountResults.find((row) => row.clientId === draft?.id);
    if (saved) setDraft(cloudPortfolio(saved));
  }, [localReady, status, accountResults, draft?.id]);
  const available =
    !suspended && auth.isAuthenticated && connection.isWebSocketConnected;
  const ready = localReady && status === "Exhausted";
  function canWrite(reportError = true) {
    if (!available) {
      if (reportError)
        setSaveError(
          "Cloud saving is unavailable. Keep this page open to preserve your edits and retry when connected. Nothing is queued or saved locally.",
        );
      return false;
    }
    return true;
  }
  async function run(
    action: () => Promise<void>,
    operation = "save",
    reportError = true,
  ) {
    if (lock.current) return false;
    retryAction.current = action;
    lastOperation.current = operation;
    if (!canWrite(reportError)) return false;
    lock.current = true;
    setBusy(true);
    setSaveError("");
    setConflict(false);
    try {
      await action();
      return true;
    } catch (error) {
      if (mounted.current && reportError) {
        setSaveError(cloudError(error));
        setConflict(
          error instanceof ConvexError &&
            ["REVISION_CONFLICT", "PORTFOLIO_UNAVAILABLE"].includes(
              String(error.data),
            ),
        );
      }
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function persist(p: Portfolio, navigate: boolean) {
    const nameError = portfolioNameError(p, portfolios);
    if (nameError) {
      setSaveError(nameError);
      return;
    }
    await run(async () => {
      const row =
        p.revision === undefined
          ? await create({
              clientId: p.id,
              definition: cloudDefinition(p),
              sessionFence,
            })
          : await update({
              clientId: p.id,
              revision: p.revision,
              definition: cloudDefinition(p),
              sessionFence,
            });
      if (!mounted.current) return;
      setDraft(cloudPortfolio(row));
      setNotice("Saved to your account.");
      if (navigate) router.push("/dashboard");
    });
  }
  const store: PortfolioStore = {
    portfolios,
    draft: auth.isAuthenticated ? draft : null,
    setDraft,
    setPortfolios: () =>
      setNotice("Create a portfolio and choose Save to cloud."),
    ready,
    storageBlocked: false,
    notice,
    setNotice,
    open: (p) => {
      if (lock.current) {
        setNotice(
          "Wait for the current cloud save to finish before opening another portfolio.",
        );
        return;
      }
      setDraft(p);
      setSaveError("");
      setConflict(false);
      router.push(`/portfolio/${encodeURIComponent(p.id)}`);
    },
    save: (p) => {
      void persist(p, true);
    },
    pin: (p) => {
      setDraft(p);
      const saved = portfolios.find((row) => row.id === p.id);
      if (!saved || p.revision === undefined) return;
      const revision = p.revision;
      void run(async () => {
        const row = await update({
          clientId: p.id,
          revision,
          definition: cloudDefinition({ ...saved, pinned: p.pinned }),
          sessionFence,
        });
        if (!mounted.current) return;
        setDraft((current) =>
          current?.id === p.id
            ? {
                ...current,
                pinned: p.pinned,
                revision: row.revision,
                updated: row.updated,
              }
            : current,
        );
        setNotice(
          "Pin saved to your account. Other edits still need Save to cloud.",
        );
      }, "pin");
    },
    remove: (p) =>
      run(async () => {
        if (p.revision === undefined) return;
        await deletePortfolio({
          clientId: p.id,
          revision: p.revision,
          sessionFence,
        });
        if (!mounted.current) return;
        setDraft(null);
        setNotice(`Deleted ${p.name} from your account.`);
        router.push("/dashboard");
      }, "delete"),
    resetStorage: () => undefined,
    cloud: true,
    busy,
    saveError,
    conflict,
    reloadDraft: () => {
      const latest = portfolios.find((p) => p.id === draft?.id);
      if (latest) {
        setDraft(latest);
        setSaveError("");
        setConflict(false);
      } else
        setSaveError(
          "This portfolio is no longer in your account. Your edits are still here; choose Duplicate to save a new portfolio.",
        );
    },
    retry: () => {
      if (lastOperation.current === "save" && draft) void persist(draft, true);
      else if (
        ["delete", "pin"].includes(lastOperation.current) &&
        retryAction.current
      )
        void run(retryAction.current, lastOperation.current);
    },
    retryLabel:
      lastOperation.current === "delete"
        ? "Retry delete"
        : lastOperation.current === "pin"
          ? "Retry pin"
          : "Retry save",
  };
  return (
    <PortfolioContext.Provider value={store}>
      {suspended ? (
        <div role="status" className="p-10">
          Unable to verify your session. Private portfolios are hidden; unsaved
          edits remain in this tab.{" "}
          <button
            onClick={() => {
              void authClient.getSession();
            }}
          >
            Retry session
          </button>
        </div>
      ) : (
        children
      )}
    </PortfolioContext.Provider>
  );
}
