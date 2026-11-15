"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
  type ReactNode,
} from "react";
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
  };
}
const Context = createContext<ReturnType<typeof usePortfolioStore> | null>(
  null,
);
export function DemoPortfoliosProvider({ children }: { children: ReactNode }) {
  const store = usePortfolioStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useDemoPortfolios() {
  const store = useContext(Context);
  if (!store) throw new Error("DemoPortfoliosProvider is required");
  return store;
}
