// Synthetic UI transport only. Real authorization is tested in convex/portfolios.test.ts.
import type { Doc } from "../../convex/_generated/dataModel";
import type { Portfolio } from "../../src/lib/demo";
import { ConvexError } from "convex/values";
import { getFunctionName, type FunctionReference } from "convex/server";
export const state = {
  version: 0,
  account: "" as string,
  online: true,
  fail: "",
  hold: false,
  responseAccount: "",
  sessionFailure: false,
  expiresAt: Date.now() + 3600000,
  rows: [] as Doc<"portfolios">[],
  release: null as null | (() => void),
};
const listeners = new Set<() => void>();
export function emit() {
  state.version++;
  for (const listener of listeners) listener();
}
export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const version = () => state.version;
export function session() {
  return {
    data:
      state.account && !state.sessionFailure
        ? {
            user: {
              id: state.account,
              name: `Synthetic ${state.account}`,
              email: `${state.account}@example.test`,
              image: null,
            },
            session: {
              id: `session-${state.account}`,
              expiresAt: new Date(state.expiresAt),
            },
          }
        : null,
    isPending: false,
    error: state.sessionFailure
      ? new Error("Synthetic session check failure")
      : null,
  };
}
export async function mutate(
  fn: FunctionReference<"mutation">,
  args: {
    clientId: string;
    definition?: Doc<"portfolios">["definition"];
    revision?: number;
    sessionFence: string;
  },
) {
  if (state.hold) {
    state.hold = false;
    await new Promise<void>((resolve) => {
      state.release = resolve;
    });
  }
  if (state.fail) {
    const code = state.fail;
    state.fail = "";
    throw new ConvexError(code);
  }
  if (args.sessionFence !== `session-${state.account}`)
    throw new ConvexError("SESSION_CHANGED");
  const name = getFunctionName(fn);
  const row = state.rows.find(
    (r) => r.ownerId === state.account && r.clientId === args.clientId,
  );
  if (name.endsWith(":remove")) {
    if (!row || row.deleted) throw new ConvexError("PORTFOLIO_UNAVAILABLE");
    if (row.revision !== args.revision)
      throw new ConvexError("REVISION_CONFLICT");
    row.deleted = true;
    row.revision++;
    emit();
    return null;
  }
  const value = args.definition!;
  if (name.endsWith(":update") && (!row || row.deleted))
    throw new ConvexError("PORTFOLIO_UNAVAILABLE");
  if (name.endsWith(":create") && row) {
    if (
      row.deleted ||
      JSON.stringify(row.definition) !== JSON.stringify(args.definition)
    )
      throw new ConvexError("REVISION_CONFLICT");
    return structuredClone(row);
  }
  if (row && row.revision !== args.revision)
    throw new ConvexError("REVISION_CONFLICT");
  if (
    state.rows.some(
      (r) =>
        r.ownerId === state.account &&
        !r.deleted &&
        r.clientId !== args.clientId &&
        r.definition.name.trim().toLowerCase() ===
          value.name.trim().toLowerCase(),
    )
  )
    throw new ConvexError("NAME_CONFLICT");
  if (row) {
    row.definition = structuredClone(value);
    row.revision++;
    row.updated = Date.now();
    emit();
    return structuredClone(row);
  }
  const created = {
    _id: `synthetic-${args.clientId}`,
    _creationTime: Date.now(),
    ownerId: state.account,
    clientId: args.clientId,
    definition: structuredClone(value),
    normalizedName: value.name.trim().toLowerCase(),
    revision: 1,
    created: Date.now(),
    updated: Date.now(),
    deleted: false,
  } as Doc<"portfolios">;
  state.rows.push(created);
  emit();
  return structuredClone(created);
}
export const qa = {
  account: (value: string) => {
    state.account = value;
    state.expiresAt = Date.now() + 3600000;
    emit();
  },
  staleResponse: (value: string) => {
    state.responseAccount = value;
    emit();
  },
  sessionFailure: (value: boolean) => {
    state.sessionFailure = value;
    emit();
  },
  expiresAt: (value: number) => {
    state.expiresAt = value;
    emit();
  },
  online: (value: boolean) => {
    state.online = value;
    emit();
  },
  fail: (value: string) => {
    state.fail = value;
  },
  hold: () => {
    state.hold = true;
  },
  release: () => {
    state.release?.();
    state.release = null;
  },
  rows: () => structuredClone(state.rows),
  remote: (id: string, patch: Partial<Portfolio>) => {
    const row = state.rows.find((r) => r.clientId === id)!;
    row.definition = { ...row.definition, ...patch };
    row.revision++;
    emit();
  },
  deleted: (id: string) => {
    const row = state.rows.find((r) => r.clientId === id)!;
    row.deleted = true;
    row.revision++;
    emit();
  },
};
declare global {
  interface Window {
    __cloudQA: typeof qa;
  }
}
