import { useSyncExternalStore } from "react";
import { mutate, state, subscribe, version } from "./state";
import { getFunctionName, type FunctionReference } from "convex/server";
import { discoveryClient } from "./discovery-client";
export const deletionFixture = {
  state: "unknown" as "unknown" | "pending" | "completed",
  failure: false,
  reauth: false,
  starts: 0,
};
const mockClient = {
  mutation: async (fn: FunctionReference<"mutation">) => {
    if (getFunctionName(fn) === "auth:beginDeletion") {
      deletionFixture.starts++;
      if (deletionFixture.failure) throw Error("synthetic network failure");
      if (deletionFixture.reauth) return "reauth_required";
      deletionFixture.state = "pending";
      return "accepted";
    }
    return null;
  },
  ...discoveryClient,
  query: async (
    fn: FunctionReference<"query">,
    args: { clientId?: string },
  ) => {
    if (getFunctionName(fn) === "auth:deletionProgress")
      return deletionFixture.state;
    if (getFunctionName(fn) === "portfolios:get") {
      const row = state.rows.find(
        (r) =>
          r.clientId === args.clientId &&
          r.ownerId === state.account &&
          !r.deleted,
      );
      if (!row) throw Error("PORTFOLIO_UNAVAILABLE");
      return structuredClone(row);
    }
    return discoveryClient.query();
  },
};
export function useConvex() {
  return mockClient;
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
