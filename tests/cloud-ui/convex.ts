import { useSyncExternalStore } from "react";
import { mutate, state, subscribe, version } from "./state";
import type { FunctionReference } from "convex/server";
import { discoveryClient } from "./discovery-client";
export function useConvex() {
  return discoveryClient;
}
function useSnapshot() {
  useSyncExternalStore(subscribe, version, version);
}
export function useConvexAuth() {
  useSnapshot();
  return { isLoading: false, isAuthenticated: !!state.account };
}
export function useConvexConnectionState() {
  useSnapshot();
  return { isWebSocketConnected: state.online };
}
export function useMutation(fn: FunctionReference<"mutation">) {
  return (args: Parameters<typeof mutate>[1]) => mutate(fn, args);
}
export function usePaginatedQuery() {
  useSnapshot();
  const responseAccount = state.responseAccount || state.account;
  return {
    results: structuredClone(
      state.rows
        .filter((r) => r.ownerId === responseAccount && !r.deleted)
        .map((row) => ({ ...row, sessionAccountId: responseAccount })),
    ),
    status: "Exhausted",
    loadMore: () => undefined,
  };
}
