"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  useConvexAuth,
  useConvex,
  useMutation,
  usePaginatedQuery,
  useConvexConnectionState,
} from "convex/react";
import { ConvexError } from "convex/values";
import { useConfirmation } from "~/components/confirmation-dialog";
import {
  isExample,
  readTrial,
  settleTrial,
  writeTrial,
  TRIAL_KEY,
} from "~/lib/trial";
import { authClient } from "~/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { PortfolioAutosave } from "~/lib/portfolio-autosave";
import {
  allocation,
  validAmount,
  portfolioNameError,
  hasResumablePortfolio,
  type Portfolio,
} from "~/lib/demo";
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
  const client = useConvex();
  const { confirm, dialog } = useConfirmation();
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
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [localReady, setLocalReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const retryAction = useRef<null | (() => Promise<void>)>(null);
  const lastOperation = useRef("save");
  const adoptedGuest = useRef(false);
  const ownedTrial = useRef<Portfolio | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    // Recover only the separate temporary trial, never a legacy collection or private cloud record.
    try {
      const recovered = readTrial(localStorage, accountId);
      if (recovered) writeTrial(localStorage, recovered, recovered, accountId);
      ownedTrial.current = recovered;
      setDraft(recovered);
    } catch {
      setNotice(
        "The recovery draft could not be read. Stored data has not been changed.",
      );
    }
    setLocalReady(true);
    return () => {
      mounted.current = false;
    };
  }, [accountId]);
  const portfolios = auth.isAuthenticated
    ? accountResults.map(cloudPortfolio)
    : [];
  useEffect(() => {
    if (!localReady || status !== "Exhausted" || adoptedGuest.current) return;
    adoptedGuest.current = true;
    const saved = accountResults.find((row) => row.clientId === draft?.id);
    if (saved && draft) {
      if (
        JSON.stringify(cloudDefinition(cloudPortfolio(saved))) ===
        JSON.stringify(cloudDefinition({ ...draft, name: draft.name.trim() }))
      ) {
        try {
          settleTrial(localStorage, draft, accountId);
        } catch {
          /* Preserve newer recovery state. */
        }
        setDraft(cloudPortfolio(saved));
      } else {
        setConflict(true);
        setSaveError(
          "This draft was saved differently in another tab. Your recovery edits are still here. Load the cloud version or duplicate your edits with a new name.",
        );
      }
    }
  }, [localReady, status, accountResults, draft, accountId]);
  const available =
    !suspended && auth.isAuthenticated && connection.isWebSocketConnected;
  const ready = localReady && status === "Exhausted";
  const [, redrawAutosave] = useState(0);
  const live = useRef({
    available,
    portfolios,
    update,
    create,
    client,
    sessionFence,
  });
  live.current = {
    available,
    portfolios,
    update,
    create,
    client,
    sessionFence,
  };
  const [autosave] = useState(
    () =>
      new PortfolioAutosave<Portfolio>({
        fingerprint: (p) =>
          JSON.stringify(cloudDefinition({ ...p, name: p.name.trim() })),
        validate: (p) =>
          portfolioNameError(p, live.current.portfolios) ||
          (!allocation(p.holdings).valid
            ? "Weights must be positive and total 100%."
            : !validAmount(p.amount)
              ? "Enter a valid starting amount."
              : ""),
        available: () =>
          live.current.available && !lock.current && mounted.current,
        create: async (p) =>
          cloudPortfolio(
            await live.current.create({
              clientId: p.id,
              definition: cloudDefinition({ ...p, name: p.name.trim() }),
              sessionFence: live.current.sessionFence,
            }),
          ),
        write: async (p, revision) =>
          cloudPortfolio(
            await live.current.update({
              clientId: p.id,
              revision,
              definition: cloudDefinition({ ...p, name: p.name.trim() }),
              sessionFence: live.current.sessionFence,
            }),
          ),
        read: async (id) =>
          cloudPortfolio(
            await live.current.client.query(api.portfolios.get, {
              clientId: id,
            }),
          ),
        classify: (error) =>
          error instanceof ConvexError
            ? [
                "REVISION_CONFLICT",
                "PORTFOLIO_UNAVAILABLE",
                "SIGN_IN_REQUIRED",
                "SESSION_CHANGED",
              ].includes(String(error.data))
              ? "conflict"
              : [
                    "NAME_CONFLICT",
                    "INVALID_NAME",
                    "INVALID_FINANCIAL_DATA",
                    "INVALID_EQUAL_WEIGHTS",
                    "INVALID_RANGE_CHOICE",
                  ].includes(String(error.data))
                ? "invalid"
                : "retry"
            : "retry",
        message: cloudError,
        acknowledged: (saved, latest) => {
          // Settle only acknowledged work. Newer in-flight edits and another
          // tab's recovery must survive an older creation acknowledgement.
          try {
            const bridge = readTrial(localStorage, accountId);
            if (
              bridge?.id === saved.id &&
              (JSON.stringify(cloudDefinition(bridge)) ===
                JSON.stringify(cloudDefinition(saved)) ||
                (JSON.stringify(bridge) ===
                  JSON.stringify(ownedTrial.current) &&
                  JSON.stringify(cloudDefinition(saved)) ===
                    JSON.stringify(
                      cloudDefinition({ ...latest, name: latest.name.trim() }),
                    )))
            ) {
              writeTrial(localStorage, null, bridge, accountId);
              ownedTrial.current = null;
            }
          } catch {
            /* Never overwrite another tab's recovery state. */
          }

          if (mounted.current)
            setDraft((current) =>
              current?.id === saved.id
                ? {
                    ...latest,
                    revision: saved.revision,
                    updated: saved.updated,
                  }
                : current,
            );
        },
        changed: () => {
          if (mounted.current) redrawAutosave((n) => n + 1);
        },
      }),
  );
  useEffect(() => {
    autosave.activate();
    return () => autosave.dispose();
  }, [autosave]);
  useEffect(() => {
    autosave.resume();
  }, [autosave, available]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (autosave.dirty()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [autosave]);
  const auto = draft ? autosave.status(draft.id) : null;

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
      if (mounted.current) {
        setBusy(false);
        autosave.resume();
      }
    }
  }
  function stageDraft(p: Portfolio) {
    if (isExample(p.id)) return;
    if (
      p.revision !== undefined ||
      autosave.status(p.id) ||
      (p.name.trim() &&
        p.holdings.length &&
        allocation(p.holdings).valid &&
        validAmount(p.amount))
    )
      autosave.stage(
        p,
        portfolios.find((row) => row.id === p.id),
      );
  }
  useEffect(() => {
    if (
      ready &&
      adoptedGuest.current &&
      draft &&
      !conflict &&
      !(
        draft.revision === undefined &&
        portfolios.some((p) => p.id === draft.id)
      )
    )
      stageDraft(draft);
    // Recover only after the authenticated list has checked same-ID conflicts.
    // Ordinary edits stage synchronously below; reactive lists don't restart debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, draft?.id]);
  const store: PortfolioStore = {
    confirmationDialog: dialog,
    portfolios,
    draft: auth.isAuthenticated ? draft : null,
    setDraft: (value) => {
      const next =
        typeof value === "function" ? value(draftRef.current) : value;
      if (next && isExample(next.id)) return;
      if (
        !next &&
        draftRef.current &&
        !autosave.canDiscardUncreated(draftRef.current.id)
      ) {
        setNotice(
          "Resolve the pending save before discarding. If it was created, use Delete portfolio.",
        );
        return;
      }
      // Only a guest-origin bridge is recoverable. Private cloud definitions never enter browser draft storage.
      try {
        const bridge = readTrial(localStorage, accountId);
        if (
          bridge &&
          (next?.id === bridge.id || next === null) &&
          next?.revision === undefined
        ) {
          writeTrial(
            localStorage,
            next,
            draftRef.current?.id === bridge.id ? draftRef.current : bridge,
            accountId,
          );
          ownedTrial.current = next;
        }
      } catch {
        setNotice(
          "Draft recovery could not be updated. Keep this tab open; existing browser data is preserved.",
        );
      }
      if (next) stageDraft(next);
      else if (draftRef.current?.revision === undefined) {
        const id = draftRef.current?.id;
        if (id && autosave.status(id)?.state === "saving") {
          setNotice(
            "Wait for creation to finish before discarding this portfolio.",
          );
          return;
        }
        if (id) autosave.discard(id);
      }
      draftRef.current = next;
      setDraft(next);
    },
    setPortfolios: () =>
      setNotice(
        "Add a name and a valid allocation; your portfolio saves automatically.",
      ),
    ready,
    storageBlocked: false,
    notice,
    setNotice,
    open: async (p, options) => {
      if (isExample(p.id)) {
        router.push(`/portfolio/${p.id}`);
        return;
      }
      let recoveryBefore: string | null | undefined;
      try {
        recoveryBefore = localStorage.getItem(TRIAL_KEY);
      } catch {
        /* Cloud portfolios remain usable when browser recovery storage is unavailable. */
      }
      const copyingConflict =
        !!draft &&
        options?.copyOf === draft.id &&
        p.revision === undefined &&
        (conflict || autosave.status(draft.id)?.state === "conflict") &&
        JSON.stringify(cloudDefinition(p)) ===
          JSON.stringify(cloudDefinition({ ...draft, pinned: false }));
      // Uncreated incomplete work is not a recoverable portfolio. Never discard
      // a create with an in-flight/uncertain acknowledgement or an existing cloud row.
      if (
        draft &&
        draft.id !== p.id &&
        draft.revision === undefined &&
        !hasResumablePortfolio(draft, portfolios) &&
        autosave.canDiscardUncreated(draft.id)
      ) {
        autosave.discard(draft.id);
      }
      if (
        draft &&
        draft.revision === undefined &&
        draft.id !== p.id &&
        !copyingConflict &&
        autosave.dirtyId(draft.id)
      ) {
        await autosave.flush(draft.id);
        if (autosave.dirtyId(draft.id)) {
          setNotice(
            "Changes are not saved. Resolve the current portfolio before opening another.",
          );
          return;
        }
      }
      if (
        draft &&
        draft.id !== p.id &&
        draft.revision === undefined &&
        !copyingConflict &&
        autosave.version(draft.id) === undefined &&
        hasResumablePortfolio(draft, portfolios) &&
        !(await confirm({
          title: "Replace your unsaved draft?",
          description:
            "Opening another portfolio will discard the current unsaved draft. Add a name and a valid allocation to save your mix automatically. This cannot be undone.",
          action: "Replace draft",
        }))
      )
        return;
      if (!mounted.current) return;
      if (lock.current) {
        setNotice(
          "Wait for the current cloud save to finish before opening another portfolio.",
        );
        return;
      }
      try {
        if (
          recoveryBefore !== undefined &&
          localStorage.getItem(TRIAL_KEY) !== recoveryBefore
        ) {
          setNotice(
            "The recovery draft changed in another tab. It has been preserved. Reopen the portfolio to continue.",
          );
          return;
        }
        const bridge = readTrial(localStorage, accountId);
        if (bridge && bridge.id !== p.id)
          writeTrial(localStorage, null, bridge, accountId);
      } catch {
        setNotice(
          "The previous recovery draft was preserved because it could not be settled.",
        );
      }
      if (draft && draft.id !== p.id && autosave.dirtyId(draft.id)) {
        if (copyingConflict) autosave.discard(draft.id);
        else await autosave.flush(draft.id);
        if (autosave.dirtyId(draft.id)) {
          setNotice(
            "Changes are not saved. Resolve the current portfolio before opening another.",
          );
          return;
        }
      }
      if (p.revision !== undefined) autosave.track(p);
      setDraft(p);
      setSaveError("");
      setConflict(false);
      router.push(`/portfolio/${encodeURIComponent(p.id)}`);
    },
    save: (p) => {
      stageDraft(p);
      void autosave.flush(p.id);
    },
    pin: (p) => {
      if (isExample(p.id) || p.revision === undefined) return;
      autosave.stage(
        p,
        portfolios.find((row) => row.id === p.id),
      );
      setDraft(p);
      void autosave.flush(p.id);
    },
    remove: async (p) =>
      run(async () => {
        if (isExample(p.id) || p.revision === undefined) return;
        try {
          const revision = (await autosave.beforeDelete(p.id)) ?? p.revision;
          if (!mounted.current) return;
          await deletePortfolio({ clientId: p.id, revision, sessionFence });
          if (!mounted.current) return;
          autosave.discard(p.id);
          setDraft(null);
          setNotice(`Deleted ${p.name} from your account.`);
          router.push("/dashboard");
        } finally {
          autosave.afterDeleteFailure(p.id);
        }
      }, "delete"),
    resetStorage: () => undefined,
    cloud: true,
    busy,
    autosaveStatus: auto,
    flush: (id) => {
      void autosave.flush(id);
    },
    prepareToLeave: async () => {
      if (draftRef.current && available)
        void autosave.flush(draftRef.current.id);
      if (!autosave.dirty()) return true;
      return confirm({
        title: "Sign out with unsaved changes?",
        description:
          "Some changes have not been acknowledged by your account. Sign out without waiting, or cancel to keep your edits here and wait for saving to finish. Unsent edits will be lost on sign-out.",
        action: "Sign out anyway",
      });
    },
    saveError:
      saveError ||
      (auto &&
      (["error", "conflict"].includes(auto.state) ||
        (auto.state === "invalid" &&
          auto.message.startsWith("A portfolio with this name")))
        ? auto.message
        : ""),
    conflict: conflict || auto?.state === "conflict",
    reloadDraft: () => {
      const latest = portfolios.find((p) => p.id === draft?.id);
      if (latest) {
        try {
          const bridge = readTrial(localStorage, accountId);
          if (bridge?.id === draft?.id)
            writeTrial(localStorage, null, draft, accountId);
        } catch {
          setNotice("A newer recovery draft was preserved.");
        }
        autosave.reset(latest);
        setDraft(latest);
        setSaveError("");
        setConflict(false);
      } else
        setSaveError(
          "This portfolio is no longer in your account. Your edits are still here; choose Duplicate to save a new portfolio.",
        );
    },
    retry: () => {
      if (lastOperation.current === "delete" && retryAction.current) {
        void run(retryAction.current, "delete");
        return;
      }
      if (draft && autosave.dirtyId(draft.id)) {
        autosave.retry(draft.id);
        return;
      }
      if (lastOperation.current === "save" && draft) {
        stageDraft(draft);
        autosave.retry(draft.id);
      } else if (
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
      {!suspended && dialog}
    </PortfolioContext.Provider>
  );
}
