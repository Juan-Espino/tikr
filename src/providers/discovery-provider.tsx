"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "~/lib/auth-client";
import {
  DiscoveryPreview,
  DiscoveryAllowance,
  DiscoveryAllowancePending,
  DiscoveryPreviewMode,
} from "~/components/ai-asset-search";
import {
  discoveryDay,
  type DiscoveryAdapter,
  type DiscoveryUsage,
} from "~/lib/ai-discovery";

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const client = useConvex();
  const session = authClient.useSession();
  const scope =
    !session.isPending &&
    !session.error &&
    session.data &&
    new Date(session.data.session.expiresAt).getTime() > Date.now()
      ? session.data.session.id
      : null;
  const enabled = process.env.NEXT_PUBLIC_AI_DISCOVERY_ENABLED === "true";
  const current = useRef(scope);
  current.current = scope;
  const [loadingScope, setLoadingScope] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    scope: string;
    value: DiscoveryUsage;
  } | null>(null);
  useEffect(() => {
    if (!scope || !enabled) return;
    let alive = true;
    const refresh = () => {
      setLoadingScope(scope);
      void client
        .query(api.discoveryQuota.usage, { sessionFence: scope })
        .then((value) => {
          if (alive && current.current === scope) setUsage({ scope, value });
        })
        .catch(() => {
          /* An unconfigured backend never blocks normal search. */
        })
        .finally(() => {
          if (alive && current.current === scope) setLoadingScope(null);
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      alive = false;
      window.removeEventListener("focus", refresh);
    };
  }, [client, scope, enabled]);
  useEffect(() => {
    if (!enabled || !scope || usage?.scope !== scope) return;
    const timer = window.setTimeout(
      () => {
        void client
          .query(api.discoveryQuota.usage, { sessionFence: scope })
          .then((value) => {
            if (current.current === scope) setUsage({ scope, value });
          })
          .catch(() => {
            if (current.current === scope) setUsage(null);
          });
      },
      Math.max(1, usage.value.resetAt - Date.now() + 100),
    );
    return () => window.clearTimeout(timer);
  }, [client, enabled, scope, usage]);
  const adapter: DiscoveryAdapter = useCallback(
    async ({ prompt, signal }) => {
      if (!scope || current.current !== scope || signal.aborted)
        throw new DOMException("Cancelled", "AbortError");
      // No transparent retries. A request ID scopes one explicit submit, with the
      // server's receipt preventing duplicate execution/charging during recovery.
      const requestId = `${discoveryDay(Date.now()).day}:${crypto.randomUUID()}`;
      try {
        const response = await client.action(api.discovery.search, {
          prompt,
          requestId,
          sessionFence: scope,
        });
        if (current.current !== scope)
          throw new DOMException("Cancelled", "AbortError");
        if (response.usage) setUsage({ scope, value: response.usage });
        if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
        return response.result;
      } catch {
        if (current.current !== scope || signal.aborted)
          throw new DOMException("Cancelled", "AbortError");
        // Never surface raw server/provider errors or credentials.
        return {
          kind: "unavailable",
          message:
            "AI discovery is unavailable. Check your session and try again, or use ticker search.",
        };
      }
    },
    [client, scope],
  );
  return (
    <DiscoveryPreviewMode.Provider value={false}>
      <DiscoveryAllowancePending.Provider
        value={scope !== null && loadingScope === scope}
      >
        <DiscoveryAllowance.Provider
          value={usage?.scope === scope ? usage.value : null}
        >
          <DiscoveryPreview.Provider value={enabled && scope ? adapter : null}>
            {children}
          </DiscoveryPreview.Provider>
        </DiscoveryAllowance.Provider>
      </DiscoveryAllowancePending.Provider>
    </DiscoveryPreviewMode.Provider>
  );
}
