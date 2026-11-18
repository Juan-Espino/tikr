"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "~/lib/auth-client";
import { readTrial, TRIAL_KEY } from "~/lib/trial";
import { Button } from "~/components/ui/button";
type Request = {
  accountId: string;
  sessionFence: string;
  token: string;
  reauth?: boolean;
};
const KEY = "tikr-account-deletion";
const Context = createContext<{
  begin: (
    accountId: string,
    sessionFence: string,
  ) => Promise<"accepted" | "reauth_required">;
  reauthenticate: (accountId: string, sessionFence: string) => Promise<void>;
} | null>(null);
export const useAccountDeletion = () => useContext(Context);
export function AccountDeletionProvider({ children }: { children: ReactNode }) {
  const client = useConvex();
  const [request, setRequest] = useState<Request | null>(null);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const value = JSON.parse(raw) as Request;
        if (
          typeof value.accountId === "string" &&
          typeof value.sessionFence === "string" &&
          /^[0-9a-f-]{36}$/.test(value.token)
        )
          setRequest(value);
      }
    } catch {
      setMessage(
        "Deletion recovery could not be read. Stored data was preserved.",
      );
    }
  }, []);
  async function begin(accountId: string, sessionFence: string) {
    if (lock.current) return "accepted" as const;
    lock.current = true;
    try {
      const current = await authClient.getSession();
      if (
        current.error ||
        current.data?.user.id !== accountId ||
        current.data.session.id !== sessionFence
      )
        throw Error("Your account changed. Close this dialog and try again.");
      if (request && request.accountId !== accountId)
        throw Error(
          "This deletion request belongs to another account. Sign in to the original account.",
        );
      const value = {
        accountId,
        sessionFence,
        token: request?.token ?? crypto.randomUUID(),
      };
      sessionStorage.setItem(KEY, JSON.stringify(value));
      try {
        const outcome = await client.mutation(api.auth.beginDeletion, {
          sessionFence,
          token: value.token,
        });
        if (outcome === "reauth_required") {
          sessionStorage.removeItem(KEY);
          setRequest(null);
          return "reauth_required" as const;
        }
        setRequest(value);
        return "accepted" as const;
      } catch {
        setRequest(value);
        setMessage(
          "The deletion response was not received. Check this request before trying again.",
        );
        return "accepted" as const;
      }
    } finally {
      lock.current = false;
    }
  }
  async function reauthenticate(accountId: string, sessionFence: string) {
    if (lock.current) return;
    lock.current = true;
    try {
      const current = await authClient.getSession();
      if (
        current.error ||
        current.data?.user.id !== accountId ||
        current.data.session.id !== sessionFence
      )
        throw Error("Your account changed. Close this dialog and try again.");
      const result = await authClient.signOut();
      if (result.error) throw Error("Sign-out failed. Please try again.");
      window.location.replace("/sign-in?returnTo=%2Fdashboard");
    } finally {
      lock.current = false;
    }
  }
  useEffect(() => {
    if (!request) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const state = await client.query(api.auth.deletionProgress, {
          token: request!.token,
        });
        if (disposed) return;
        if (state === "completed") {
          // Delete only a validated recovery entry bound to the confirmed account.
          try {
            const raw = localStorage.getItem(TRIAL_KEY);
            if (raw) {
              const value = JSON.parse(raw) as {
                version?: number;
                owner?: string;
              };
              if (
                readTrial(localStorage, request!.accountId) &&
                value.version === 1 &&
                value.owner === request!.accountId &&
                localStorage.getItem(TRIAL_KEY) === raw
              )
                localStorage.removeItem(TRIAL_KEY);
            }
          } catch {
            /* Malformed/unavailable browser data stays untouched. */
          }
          const current = await authClient.getSession();
          if (current.error) throw Error("Unable to verify browser sign-out");
          if (!current.data || current.data.user.id === request!.accountId) {
            const result = await authClient.signOut();
            if (result.error) throw Error("Browser sign-out failed");
          }
          sessionStorage.removeItem(KEY);
          window.location.replace("/");
          return;
        }
        if (state === "unknown")
          setMessage(
            "Deletion is not confirmed. Retry checks the same request; it never selects another account.",
          );
        else
          setMessage(
            "Permanently deleting your account and portfolios. You can reload to resume checking.",
          );
      } catch {
        if (!disposed)
          setMessage(
            "Unable to check deletion. Your account has not been reported as deleted. Retry when connected.",
          );
      }
      if (!disposed) timer = setTimeout(() => void check(), 2000);
    }
    void check();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [client, request]);
  return (
    <Context.Provider value={{ begin, reauthenticate }}>
      {request && !request.reauth ? (
        <main className="mx-auto max-w-lg px-5 py-20" aria-busy="true">
          <h1 className="text-2xl">Account deletion</h1>
          <p className="mt-4">
            Permanently delete your Tikr account and ALL your portfolios? This
            cannot be undone.
          </p>
          <p role="status" className="mt-4">
            {message || "Checking permanent deletion..."}
          </p>
          <Button
            className="mt-6 min-h-11"
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              try {
                const state = await client.query(api.auth.deletionProgress, {
                  token: request.token,
                });
                if (state === "pending")
                  await client.mutation(api.auth.resumeDeletion, {
                    token: request.token,
                  });
                if (state === "unknown")
                  setMessage(
                    "Deletion is not confirmed. Sign in again, then open your account dialog to confirm it.",
                  );
              } catch {
                setMessage(
                  "Deletion remains unconfirmed. A fresh sign-in may be required. No other account was selected.",
                );
              } finally {
                lock.current = false;
              }
            }}
          >
            Check deletion status
          </Button>
          <Button
            className="mt-4 min-h-11"
            variant="outline"
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              try {
                const state = await client.query(api.auth.deletionProgress, {
                  token: request.token,
                });
                if (state !== "unknown") {
                  setMessage(
                    "Deletion is already running or completed. Keep this request to check its outcome.",
                  );
                  return;
                }
                const current = await authClient.getSession();
                if (
                  current.error ||
                  (current.data && current.data.user.id !== request.accountId)
                )
                  throw Error();
                const updated = { ...request, reauth: true };
                sessionStorage.setItem(KEY, JSON.stringify(updated));
                if (current.data) {
                  const result = await authClient.signOut();
                  if (result.error) throw Error();
                }
                window.location.replace("/sign-in?returnTo=%2Fdashboard");
              } catch {
                setMessage(
                  "Unable to start fresh sign-in. The deletion request was preserved; no other account was selected.",
                );
              } finally {
                lock.current = false;
              }
            }}
          >
            Sign in again
          </Button>
        </main>
      ) : (
        children
      )}
    </Context.Provider>
  );
}
