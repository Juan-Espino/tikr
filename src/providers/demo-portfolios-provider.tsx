"use client";
import { usePathname } from "next/navigation";
import type { SaveState } from "~/lib/portfolio-autosave";
import { PageSkeleton } from "~/components/loading-skeletons";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react";
import { toast } from "sonner";
import { useConfirmation } from "~/components/confirmation-dialog";
import { isExample, readTrial, writeTrial, TRIAL_KEY } from "~/lib/trial";
import { authClient } from "~/lib/auth-client";
import { CloudPortfoliosProvider } from "./cloud-portfolios-provider";
import { useRouter } from "next/navigation";
import { hasResumablePortfolio, type Portfolio } from "~/lib/demo";
function usePortfolioStore() {
  const router = useRouter();
  const { confirm, dialog } = useConfirmation();
  const [draft, updateDraft] = useState<Portfolio | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const current = useRef<Portfolio | null>(null);
  useEffect(() => {
    try {
      current.current = readTrial(localStorage);
      updateDraft(current.current);
    } catch {
      setStorageBlocked(true);
      setNotice(
        "The temporary draft could not be read. Stored data has not been changed.",
      );
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === TRIAL_KEY) {
        setStorageBlocked(true);
        setNotice(
          "The temporary draft changed in another tab. Reload to use its latest version; this tab will not overwrite it.",
        );
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setDraft: Dispatch<SetStateAction<Portfolio | null>> = (value) => {
    const next = typeof value === "function" ? value(current.current) : value;
    if (next && isExample(next.id)) return;
    try {
      writeTrial(localStorage, next, current.current);
      current.current = next;
      updateDraft(next);
    } catch {
      setNotice(
        "The draft changed in another tab or browser storage is unavailable. Reload before continuing; stored data was preserved.",
      );
      setStorageBlocked(true);
    }
  };
  async function open(p: Portfolio) {
    if (isExample(p.id)) {
      router.push(`/portfolio/${p.id}`);
      return;
    }
    if (storageBlocked) return;
    try {
      const rawBefore = localStorage.getItem(TRIAL_KEY);
      const existing = readTrial(localStorage);
      const hidden = !existing && !!localStorage.getItem(TRIAL_KEY);
      if (
        hidden &&
        !(await confirm({
          title: "Replace this draft?",
          description:
            "A recovery draft belongs to a signed-in session. Sign in to that account to resume it, or replace it to start a new mix. This cannot be undone.",
          action: "Replace draft",
        }))
      )
        return;
      if (
        existing &&
        hasResumablePortfolio(existing, []) &&
        existing.id !== p.id &&
        !(await confirm({
          title: "Replace your unsaved draft?",
          description:
            "Starting a new mix will discard your current draft. It has not been saved to your account. This cannot be undone.",
          action: "Replace draft",
        }))
      )
        return;
      if (localStorage.getItem(TRIAL_KEY) !== rawBefore)
        throw new Error("Draft changed");
      writeTrial(localStorage, p, existing, null, hidden);
      current.current = p;
      updateDraft(p);
      router.push(`/portfolio/${encodeURIComponent(p.id)}`);
    } catch {
      setStorageBlocked(true);
      setNotice(
        "Unable to preserve the temporary draft. Existing browser data has not been changed.",
      );
    }
  }
  return {
    confirmationDialog: dialog,
    portfolios: [],
    setPortfolios: () => undefined,
    draft,
    setDraft,
    ready,
    storageBlocked,
    notice,
    setNotice,
    open,
    save: (p: Portfolio) => {
      if (!isExample(p.id))
        router.push(
          `/sign-in?returnTo=${encodeURIComponent(`/portfolio/${p.id}`)}`,
        );
    },
    remove: () => false,
    resetStorage: () => undefined,
    pin: () => undefined,
    cloud: false,
    busy: false,
    saveError: "",
    conflict: false,
    reloadDraft: () => undefined,
    retry: () => undefined,
    retryLabel: "Retry save",
  };
}
export type PortfolioStore = {
  confirmationDialog: ReactNode;
  portfolios: Portfolio[];
  setPortfolios: Dispatch<SetStateAction<Portfolio[]>>;
  draft: Portfolio | null;
  setDraft: Dispatch<SetStateAction<Portfolio | null>>;
  ready: boolean;
  storageBlocked: boolean;
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
  open: (p: Portfolio, options?: { copyOf: string }) => void | Promise<void>;
  save: (p: Portfolio) => void;
  remove: (p: Portfolio) => boolean | Promise<boolean>;
  resetStorage: () => void;
  pin: (p: Portfolio) => void;
  cloud: boolean;
  busy: boolean;
  autosaveStatus?: {
    state: SaveState;
    message: string;
  } | null;
  flush?: (id: string) => void;
  prepareToLeave?: () => Promise<boolean>;
  saveError: string;
  conflict: boolean;
  reloadDraft: () => void;
  retry: () => void;
  retryLabel: string;
};
export const PortfolioContext = createContext<PortfolioStore | null>(null);
function LocalPortfoliosProvider({ children }: { children: ReactNode }) {
  const store = usePortfolioStore();
  return (
    <PortfolioContext.Provider value={store}>
      {children}
      {store.confirmationDialog}
    </PortfolioContext.Provider>
  );
}
function AccountPortfoliosProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const lastSession = useRef(session.data);
  if (!session.isPending && !session.error) lastSession.current = session.data;
  const activeSession =
    session.isPending || session.error ? lastSession.current : session.data;
  const [, tick] = useState(0);
  const expiry = activeSession
    ? new Date(activeSession.session.expiresAt).getTime()
    : 0;
  useEffect(() => {
    if (!expiry) return;
    const timer = setTimeout(
      () => tick((value) => value + 1),
      Math.min(Math.max(0, expiry - Date.now()), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [expiry]);
  const notificationScope =
    activeSession && expiry > Date.now() ? activeSession.session.id : "guest";
  useEffect(() => {
    toast.dismiss();
  }, [notificationScope]);
  if (pathname === "/methodology" && !activeSession) return children;
  if (session.isPending && !activeSession)
    return pathname === "/" ? null : (
      <PageSkeleton label="Checking session..." />
    );
  if (activeSession && expiry > Date.now())
    return (
      <CloudPortfoliosProvider
        key={`${activeSession.user.id}:${activeSession.session.id}`}
        sessionFence={activeSession.session.id}
        accountId={activeSession.user.id}
        suspended={session.isPending || !!session.error}
      >
        {children}
      </CloudPortfoliosProvider>
    );
  if (session.error)
    return (
      <div className="p-10" role="alert">
        Unable to verify your session. Private portfolios are hidden.{" "}
        <button onClick={() => window.location.reload()}>Retry session</button>
      </div>
    );
  return (
    <LocalPortfoliosProvider key="guest">{children}</LocalPortfoliosProvider>
  );
}
export function DemoPortfoliosProvider({ children }: { children: ReactNode }) {
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <AccountPortfoliosProvider>{children}</AccountPortfoliosProvider>
  ) : (
    <LocalPortfoliosProvider>{children}</LocalPortfoliosProvider>
  );
}
export function useDemoPortfolios() {
  const store = useContext(PortfolioContext);
  if (!store) throw new Error("DemoPortfoliosProvider is required");
  return store;
}
