"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react";
import { authClient } from "~/lib/auth-client";
import { CloudPortfoliosProvider } from "./cloud-portfolios-provider";
import { useRouter } from "next/navigation";
import {
  allocation,
  validAmount,
  portfolioNameError,
  storageSchema,
  type Portfolio,
} from "~/lib/demo";
const key = "tikr-demo-v1";
function usePortfolioStore() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [draft, setDraft] = useState<Portfolio | null>(null);
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [notice, setNotice] = useState("");
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
        const legacy = JSON.parse(raw) as {
          portfolios: { range: string; rangeChoice?: string }[];
          draft?: { range: string; rangeChoice?: string };
        };
        if (
          [...legacy.portfolios, legacy.draft].some(
            (p) => p?.range === "1Y" && !p.rangeChoice,
          )
        )
          setNotice(
            "Older saved 1Y periods were reset to the new 1W default. Old storage did not record whether 1Y was chosen explicitly; select 1Y again to keep it.",
          );
        setPortfolios(stored.portfolios);
        setDraft(stored.draft);
        if (/"ticker"\s*:\s*"VOO"/.test(raw)) {
          setNotice((previous) =>
            [
              previous,
              "The demo now uses SPY. Previous VOO sample holdings were updated to SPY; your saved portfolios and draft were preserved.",
            ]
              .filter(Boolean)
              .join(" "),
          );
        }
      }
    } catch {
      setStorageBlocked(true);
      setNotice(
        "Saved demo data could not be read. It has not been overwritten. Use Reset local demo to start again.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageBlocked) return;
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
  }, [ready, storageBlocked, portfolios, draft]);
  function write(next: Portfolio[], nextDraft: Portfolio | null) {
    if (storageBlocked) {
      setNotice(
        "Browser storage is unavailable; reset or restore it before continuing.",
      );
      return false;
    }
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, portfolios: next, draft: nextDraft }),
      );
      return true;
    } catch {
      setStorageBlocked(true);
      setNotice(
        "Browser storage is unavailable or full. Changes remain in memory only; keep this page open.",
      );
      return false;
    }
  }
  function open(p: Portfolio) {
    if (!write(portfolios, p)) return;
    setDraft(p);
    router.push(`/portfolio/${encodeURIComponent(p.id)}`);
  }
  function save(p: Portfolio) {
    const nameError = portfolioNameError(p, portfolios);
    if (nameError) {
      setNotice(nameError);
      return;
    }
    if (
      !allocation(p.holdings).valid ||
      !validAmount(p.amount) ||
      !p.name.trim()
    )
      return;
    if (portfolios.length >= 100 && !portfolios.some((x) => x.id === p.id)) {
      setNotice(
        "This local demo supports up to 100 portfolios. Delete one before saving another.",
      );
      return;
    }
    const saved = { ...p, name: p.name.trim(), updated: Date.now() };
    const next = [...portfolios.filter((x) => x.id !== p.id), saved];
    if (!write(next, saved)) return;
    setPortfolios(next);
    setDraft(saved);
    setNotice("Saved on this browser only. No cloud copy.");
    router.push("/dashboard");
  }
  function remove(p: Portfolio) {
    const next = portfolios.filter((x) => x.id !== p.id);
    if (!write(next, null)) return false;
    startTransition(() => {
      setPortfolios(next);
      setDraft(null);
      setNotice(`Deleted ${p.name}.`);
      router.push("/dashboard");
    });
    return true;
  }
  function resetStorage() {
    try {
      localStorage.removeItem(key);
      setStorageBlocked(false);
      setNotice(
        "Local demo storage reset; current in-memory work will be saved.",
      );
    } catch {
      setNotice("Browser storage is still unavailable.");
    }
  }
  function pin(p: Portfolio) {
    const next = portfolios.map((row) =>
      row.id === p.id ? { ...row, pinned: p.pinned, updated: Date.now() } : row,
    );
    if (!write(next, p)) return;
    setPortfolios(next);
    setDraft(p);
  }
  return {
    portfolios,
    setPortfolios,
    draft,
    setDraft,
    ready,
    storageBlocked,
    notice,
    setNotice,
    open,
    save,
    remove,
    resetStorage,
    pin,
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
  portfolios: Portfolio[];
  setPortfolios: Dispatch<SetStateAction<Portfolio[]>>;
  draft: Portfolio | null;
  setDraft: Dispatch<SetStateAction<Portfolio | null>>;
  ready: boolean;
  storageBlocked: boolean;
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
  open: (p: Portfolio) => void;
  save: (p: Portfolio) => void;
  remove: (p: Portfolio) => boolean | Promise<boolean>;
  resetStorage: () => void;
  pin: (p: Portfolio) => void;
  cloud: boolean;
  busy: boolean;
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
    </PortfolioContext.Provider>
  );
}
function AccountPortfoliosProvider({ children }: { children: ReactNode }) {
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
  if (session.isPending && !activeSession)
    return (
      <p role="status" className="p-10">
        Checking session…
      </p>
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
