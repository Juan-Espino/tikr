import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { ConvexHttpClient } from "convex/browser";
import { localAdmission } from "./market-admission.ts";
import { makeFunctionReference } from "convex/server";
export type Stored = {
  key: string;
  payload: string;
  revision: string;
  dependencies: { key: string; revision: string }[];
  checkedAt: number;
};
export interface MarketStorage {
  /** Must durably disable reads for the current evidence revision without relying on Convex availability. */
  revoke(): Promise<void>;
  assertReadable(symbols: string[]): Promise<void>;
  beginRefresh(symbol: string): Promise<() => Promise<void>>;
  read(keys: string[]): Promise<Stored[]>;
  acquire(key: string, cycle: string, retry: boolean): Promise<string | null>;
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
): MarketStorage {
  if (!/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(url) || !adminKey)
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
  client.setAdminAuth(adminKey);
  async function call<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const admission = await localAdmission();
    const reserved =
      name === "read" ? 10_000_000 : name === "write" ? 64_000_000 : 32_768;
    const settle = await admission.reserve(reserved, evidenceRevision);
    try {
      const result = await client.mutation(
        makeFunctionReference<"mutation", Record<string, unknown>, T>(
          `market:${name}`,
        ),
        args,
      );
      const charged =
        result &&
        typeof result === "object" &&
        "chargedIo" in result &&
        typeof result.chargedIo === "number"
          ? result.chargedIo
          : reserved;
      await settle(charged);
      return result;
    } catch {
      throw new Error("STORAGE_UNAVAILABLE");
    }
  }
  return {
    async revoke() {
      await (await localAdmission()).revoke(evidenceRevision);
    },
    async assertReadable(symbols) {
      await (await localAdmission()).assertReadable(evidenceRevision, symbols);
    },
    async beginRefresh(symbol) {
      return (await localAdmission()).beginRefresh(evidenceRevision, symbol);
    },
    async read(keys) {
      const r = await call<{ status: string; rows: Stored[] }>("read", {
        keys,
      });
      if (r.status !== "ok") throw new Error("CACHE_BUDGET");
      return r.rows;
    },
    async acquire(key, cycle, retry) {
      const token = randomUUID();
      const r = await call<{ status: string }>("acquire", {
        key,
        token,
        cycle,
        retry,
      });
      return r.status === "acquired" ? token : null;
    },
    async write(leaseKey, token, entries) {
      const r = await call<{ status: string }>("write", {
        leaseKey,
        token,
        entries,
      });
      if (r.status !== "ok") throw new Error("CACHE_BUDGET");
    },
    async release(key, token) {
      await call("release", { key, token });
    },
  };
}
