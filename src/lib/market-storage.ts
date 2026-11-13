import { MarketFailure } from "./market-errors.ts";
import "server-only";
import { hosted, gateway, control, policyIdentity } from "./market-hosted.ts";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { ConvexHttpClient } from "convex/browser";
import { localAdmission } from "./market-admission.ts";
import { makeFunctionReference } from "convex/server";
import { ConvexError } from "convex/values";
import { withMarketWriteTurn } from "./market-write-queue.ts";
import { storageReservation } from "./market-reservation.ts";
import type { PERSONAL_SOURCE_POLICY } from "./market-policy.ts";
export type Stored = {
  key: string;
  payload: string;
  revision: string;
  dependencies: { key: string; revision: string }[];
  checkedAt: number;
};
export interface MarketStorage {
  readonly namespace?: string;
  /** Durably revoke the affected asset (or whole scope), independently of Convex availability. */
  revoke(symbol?: string): Promise<void>;
  assertReadable(symbols: string[]): Promise<void>;
  beginRefresh(
    symbol: string,
  ): Promise<(() => Promise<void>) & { endObservation?: () => Promise<void> }>;
  recoverySymbols?(symbols: string[]): Promise<string[]>;
  confirmRefresh?(symbol: string, headRevision: string): Promise<void>;
  /** Publish disposable content only after its complete normalized asset root matches. */
  confirmRead?(symbol: string, headRevision: string): Promise<void>;
  read(keys: string[]): Promise<Stored[]>;
  acquire(
    key: string,
    cycle: string,
    retry: boolean,
    from?: string,
  ): Promise<string | null>;
  write(
    key: string,
    token: string,
    entries: Omit<Stored, "checkedAt">[],
  ): Promise<void>;
  release(key: string, token: string): Promise<void>;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export const revision = (v: unknown) =>
  createHash("sha256")
    .update(canonical(JSON.parse(JSON.stringify(v))))
    .digest("hex");
export function chunks(
  key: string,
  value: unknown,
  dependencies: Stored["dependencies"] = [],
) {
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json) > 1_000_000) throw new Error("PAYLOAD_LIMIT");
  const packed = gzipSync(Buffer.from(json), { level: 6 }).toString("base64");
  const rev = revision(value),
    entries: Omit<Stored, "checkedAt">[] = [];
  for (let i = 0; i < packed.length; i += 12000)
    entries.push({
      key: `${key}:part${i / 12000}`,
      payload: packed.slice(i, i + 12000),
      revision: rev,
      dependencies: [],
    });
  entries.push({
    key,
    payload: JSON.stringify({
      encoding: "gzip-v1",
      parts: entries.map((e) => e.key),
    }),
    revision: rev,
    dependencies,
  });
  return entries;
}
export async function readValue<T>(
  storage: MarketStorage,
  head: Stored,
): Promise<T> {
  const m = JSON.parse(head.payload) as { encoding: string; parts: string[] };
  if (
    m.encoding !== "gzip-v1" ||
    !Array.isArray(m.parts) ||
    m.parts.length > 79 ||
    m.parts.some((k) => !k.startsWith(head.key + ":part"))
  )
    throw new Error("INVALID_MANIFEST");
  const parts = await storage.read(m.parts);
  const text = m.parts
    .map((k) => {
      const p = parts.find((p) => p.key === k);
      if (p?.revision !== head.revision) throw new Error("REVISION_CHANGED");
      return p.payload;
    })
    .join("");
  if (Buffer.byteLength(text) > 1_000_000) throw new Error("PAYLOAD_LIMIT");
  let value: T;
  try {
    value = JSON.parse(
      gunzipSync(Buffer.from(text, "base64"), {
        maxOutputLength: 1_000_000,
      }).toString("utf8"),
    ) as T;
  } catch {
    throw new Error("REVISION_CHANGED");
  }

  if (revision(value) !== head.revision) throw new Error("REVISION_CHANGED");
  return value;
}
export function convexStorage(
  url: string,
  adminKey: string,
  evidenceRevision: string,
  reviewedPolicy?: typeof PERSONAL_SOURCE_POLICY,
): MarketStorage {
  if (
    (!hosted() && !/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(url)) ||
    (!hosted() && !adminKey)
  )
    throw new Error("CONFIG_REQUIRED");
  // Version-bound SDK server interface. Admin credentials never enter function arguments or client code.
  const client = new ConvexHttpClient(url, {
    logger: false,
    fetch: async (input, init) => {
      if (
        (typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url) !== `${url}/api/mutation`
      )
        throw new Error("STORAGE_ENDPOINT");
      const signal = AbortSignal.any([
        ...(init?.signal ? [init.signal] : []),
        AbortSignal.timeout(20000),
      ]);
      const response = await fetch(input, {
        ...init,
        signal,
        redirect: "error",
      });
      if (!response.body) return response;
      const reader = response.body.getReader(),
        parts: Uint8Array[] = [];
      let bytes = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > 12_000_000) {
            await reader.cancel();
            throw new Error("STORAGE_RESPONSE_LIMIT");
          }
          parts.push(part.value);
        }
      } finally {
        reader.releaseLock();
      }
      return new Response(Buffer.concat(parts), {
        status: response.status,
        headers: response.headers,
      });
    },
  }) as ConvexHttpClient & { setAdminAuth(token: string): void };
  if (!hosted()) client.setAdminAuth(adminKey);
  // A calendar-window change is not a reviewed recovery from a real correction.
  // Bind new personal revocations to the reviewed policy as well as its window.
  const revocationScope = reviewedPolicy
    ? revision({ revocationPolicy: reviewedPolicy })
    : evidenceRevision;
  async function assertPolicyActive(symbols: string[]) {
    await (await localAdmission()).assertNotRevoked(revocationScope, symbols);
  }
  async function call<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    if (!hosted())
      return withMarketWriteTurn(() => callAdmitted<T>(name, args));
    return callAdmitted<T>(name, args);
  }
  async function callAdmitted<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    if (hosted()) return gateway<T>(name, args);
    const admission = await localAdmission();
    const reserved = storageReservation(name, args);
    const settle = await admission.reserve(
      reserved,
      evidenceRevision,
      "database",
    );
    try {
      const result = await client.mutation(
        makeFunctionReference<"mutation", Record<string, unknown>, T>(
          `market:${name}`,
        ),
        args,
      );
      // Conservative control units, never observed billing. Decode old deployed functions too.
      const charged =
        result && typeof result === "object"
          ? "admissionUnits" in result &&
            typeof result.admissionUnits === "number"
            ? result.admissionUnits
            : "chargedIo" in result && typeof result.chargedIo === "number"
              ? result.chargedIo
              : reserved
          : reserved;
      await settle(charged);
      return result;
    } catch (error) {
      const data: unknown =
        error instanceof ConvexError ? error.data : undefined;
      if (
        data &&
        typeof data === "object" &&
        "code" in data &&
        data.code === "TEAM_BUDGET_UNVERIFIED"
      )
        throw new MarketFailure("TEAM_BUDGET_UNVERIFIED");
      throw new Error("STORAGE_UNAVAILABLE");
    }
  }
  const hostedLeases = new Map<string, string>();
  const hostedGuards = new Map<string, string>();
  return {
    namespace: revision({
      url,
      evidenceRevision,
      site: hosted() ? process.env.TIKR_CONVEX_SITE_URL : undefined,
    }),
    async revoke(symbol) {
      if (hosted()) {
        await control("revoke", evidenceRevision);
        return;
      }
      const admission = await localAdmission();
      await admission.revoke(revocationScope, symbol);
      if (revocationScope !== evidenceRevision)
        await admission.revoke(evidenceRevision, symbol);
    },
    async assertReadable(symbols) {
      if (hosted()) {
        await control("check", evidenceRevision, symbols);
        return;
      }
      const admission = await localAdmission();
      await assertPolicyActive(symbols);
      try {
        await admission.assertLegacyReadable(
          evidenceRevision,
          symbols,
          {},
          reviewedPolicy,
        );
        await admission.assertReadable(evidenceRevision, symbols);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "REFRESH_GUARDED")
          throw error;
        const { rows } = await call<{ rows: Stored[] }>("read", {
          keys: symbols.map((s) => `asset:${s}`),
        });
        await admission.assertReadable(
          evidenceRevision,
          symbols,
          Object.fromEntries(
            rows.map((row) => [row.key.slice(6), row.revision]),
          ),
        );
        await admission.assertLegacyReadable(
          evidenceRevision,
          symbols,
          Object.fromEntries(
            rows.map((row) => [row.key.slice(6), row.revision]),
          ),
          reviewedPolicy,
        );
      }
      await assertPolicyActive(symbols);
    },
    ...(hosted()
      ? {
          recoverySymbols: (symbols: string[]) =>
            gateway<string[]>("control", {
              ...policyIdentity(evidenceRevision),
              op: "recover",
              scope: evidenceRevision,
              symbols,
              token: randomUUID(),
            }),
        }
      : {}),
    ...(!hosted()
      ? {
          async recoverySymbols(symbols: string[]) {
            await assertPolicyActive(symbols);
            const guarded = await (
              await localAdmission()
            ).guardedSymbols(evidenceRevision, symbols);
            await assertPolicyActive(symbols);
            return guarded;
          },
          async confirmRefresh(symbol: string, headRevision: string) {
            await assertPolicyActive([symbol]);
            const { rows } = await call<{ rows: Stored[] }>("read", {
              keys: [`asset:${symbol}`],
            });
            const head = rows.find((row) => row.key === `asset:${symbol}`);
            const manifest = head
              ? (JSON.parse(head.payload) as {
                  evidenceRevision?: string;
                  meta?: { symbol?: string };
                  format?: string;
                })
              : undefined;
            if (
              head?.revision !== headRevision ||
              manifest?.evidenceRevision !== evidenceRevision ||
              manifest?.meta?.symbol !== symbol ||
              manifest.format !== "monthly-v2"
            )
              throw Error("REVISION_CHANGED");
            await (
              await localAdmission()
            ).confirmRefresh(evidenceRevision, symbol, headRevision);
            await assertPolicyActive([symbol]);
          },
        }
      : {}),
    async beginRefresh(symbol) {
      if (hosted()) {
        const token = randomUUID();
        await gateway("control", {
          ...policyIdentity(evidenceRevision),
          op: "begin",
          scope: evidenceRevision,
          symbols: [symbol],
          token,
          leaseToken: hostedLeases.get(`asset:${symbol}`),
        });
        hostedGuards.set(`asset:${symbol}`, token);
        return async () => {
          await gateway("control", {
            op: "finish",
            scope: evidenceRevision,
            symbols: [symbol],
            token,
            leaseToken: hostedLeases.get(`asset:${symbol}`),
          });
        };
      }
      await assertPolicyActive([symbol]);
      return (await localAdmission()).beginRefresh(evidenceRevision, symbol);
    },
    async read(keys) {
      if (keys.length > 80 || new Set(keys).size !== keys.length)
        throw Error("READ_LIMIT");
      const rows: Stored[] = [];
      const batchSize = hosted() ? 80 : 8;
      // Bound cold-cache in-flight reservations without weakening per-document bounds.
      for (
        let offset = 0;
        offset < Math.max(1, keys.length);
        offset += batchSize
      ) {
        const r = await call<{ status: string; rows: Stored[] }>("read", {
          keys: keys.slice(offset, offset + batchSize),
        });
        if (r.status !== "ok")
          throw new MarketFailure("SHARED_BUDGET_EXHAUSTED");
        rows.push(...r.rows);
      }
      return rows;
    },
    async acquire(key, cycle, retry, from) {
      const token = randomUUID();
      const r = await call<{ status: string; retryAt?: number }>("acquire", {
        key,
        token,
        cycle,
        retry,
        ...(from ? { from } : {}),
        ...(reviewedPolicy ? { reviewedPolicy } : {}),
      });
      if (r.status === "budget")
        throw new MarketFailure("SHARED_BUDGET_EXHAUSTED");
      // Calculation-slot contention must not throttle calculations from fresh assets.
      // Only source/calendar leases authorize provider work.
      if (key.startsWith("job:") && r.status !== "acquired") return null;
      if (r.status === "cooldown")
        throw new MarketFailure("REFRESH_COOLDOWN", r.retryAt);
      if (r.status === "daily")
        throw new MarketFailure("REFRESH_COOLDOWN", r.retryAt);
      if (hosted() && key.startsWith("asset:") && r.status === "acquired")
        hostedLeases.set(key, token);
      return r.status === "acquired" ? token : null;
    },
    async write(leaseKey, token, entries) {
      const r = await call<{ status: string }>("write", {
        leaseKey,
        token,
        entries,
        ...(hosted() && hostedGuards.has(leaseKey)
          ? {
              guard: {
                scope: evidenceRevision,
                token: hostedGuards.get(leaseKey)!,
              },
            }
          : {}),
      });
      if (r.status === "storage") throw new MarketFailure("STORAGE_CAPACITY");
      if (r.status !== "ok") throw new MarketFailure("SHARED_BUDGET_EXHAUSTED");
    },
    async release(key, token) {
      try {
        await call("release", { key, token });
      } finally {
        if (hostedLeases.get(key) === token) {
          hostedLeases.delete(key);
          hostedGuards.delete(key);
        }
      }
    },
  };
}
