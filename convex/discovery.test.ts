/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import { afterEach, expect, test, vi } from "vitest";
import { api, internal, components } from "./_generated/api";
import schema from "./schema";
import { DISCOVERY, discoveryDay } from "../src/lib/ai-discovery";
import { catalogShard, packCatalogShard } from "../src/lib/asset-catalog";
import { requestDiscoveryCandidates } from "../src/lib/discovery-provider";
const modules = import.meta.glob("./**/*.ts");
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
const valid = {
  kind: "results",
  summary: "Computing infrastructure suggestions",
  candidates: [{ ticker: "NVDA", why: "Computing hardware" }],
  question: "",
  answers: [],
};
function response(content: unknown = valid, finish_reason = "stop") {
  return Response.json({
    choices: [{ finish_reason, message: { content: JSON.stringify(content) } }],
  });
}
function liveFixture() {
  // Pure fake process bindings; never load keys or access a live deployment.
  vi.stubEnv("TIKR_AI_DISCOVERY_ENABLED", "explicit");
  vi.stubEnv("GROQ_API_KEY", "synthetic-noncredential");
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => response());
}
function request(prompt = "data center infrastructure") {
  return {
    prompt,
    requestId: `${discoveryDay(Date.now()).day}:${crypto.randomUUID()}`,
    sessionFence: "",
  };
}
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const identities: { subject: string; sessionId: string }[] = [];
  const now = Date.now();
  for (const name of ["A", "B"]) {
    const user = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: "user",
        data: {
          name,
          email: `${name}@example.test`,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const session = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: "session",
        data: {
          userId: user._id,
          token: `synthetic-${name}`,
          expiresAt: now + 3 * 86400000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    identities.push({ subject: user._id, sessionId: session._id });
  }
  await t.run(async (ctx) => {
    const assets = ["SPY", "NVDA", "MSFT"].map((ticker) => ({
      ticker,
      name: `Canonical ${ticker}`,
      exchange: "NASDAQ",
    }));
    for (const shard of Array.from({ length: 32 }, (_, index) => index))
      await ctx.db.insert("marketEntries", {
        key: `catalog:${shard}`,
        payload: JSON.stringify(
          packCatalogShard(
            assets.filter((a) => catalogShard(a.ticker) === shard),
          ),
        ),
        revision: "synthetic-catalog",
        dependencies: [],
        checkedAt: now,
        cost: 100,
      });
  });
  return {
    t,
    identities,
    a: t.withIdentity(identities[0]!),
    b: t.withIdentity(identities[1]!),
  };
}
test("guests, forged accounts, wrong session and expired sessions are refused before provider work", async () => {
  const fetcher = liveFixture();
  const { t, a, identities } = await setup();
  await expect(t.action(api.discovery.search, request())).rejects.toThrow(
    "SIGN_IN_REQUIRED",
  );
  await expect(
    a.action(api.discovery.search, {
      ...request(),
      sessionFence: "wrong-session",
    }),
  ).rejects.toThrow("SESSION_CHANGED");
  await expect(
    a.action(api.discovery.search, {
      ...request(),
      sessionFence: identities[0]!.sessionId,
      ownerId: identities[1]!.subject,
    } as never),
  ).rejects.toThrow();
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: "session",
      where: [{ field: "_id", value: identities[0]!.sessionId }],
      update: { expiresAt: Date.now() - 1 },
    },
  });
  await expect(
    a.action(api.discovery.search, {
      ...request(),
      sessionFence: identities[0]!.sessionId,
    }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  expect(fetcher).not.toHaveBeenCalled();
});
test("default-off and invalid input do not reserve quota or call any provider", async () => {
  const { t, a, identities } = await setup();
  const fetcher = vi.spyOn(globalThis, "fetch");
  const args = { ...request(), sessionFence: identities[0]!.sessionId };
  vi.stubEnv("TIKR_AI_DISCOVERY_ENABLED", "");
  expect((await a.action(api.discovery.search, args)).result.kind).toBe(
    "unavailable",
  );
  for (const prompt of [" ", "x".repeat(501), "bad\u0000input"])
    expect(
      (await a.action(api.discovery.search, { ...args, prompt })).result.kind,
    ).toBe("error");
  expect(fetcher).not.toHaveBeenCalled();
  expect(
    await t.run((ctx) => ctx.db.query("discoveryRequests").collect()),
  ).toEqual([]);
});
test("candidates are deduplicated and matched exactly to canonical cached assets; retries are idempotent", async () => {
  const fetcher = liveFixture();
  const { t, a, b, identities } = await setup();
  fetcher.mockImplementation(async () =>
    response({
      ...valid,
      candidates: [
        { ticker: "NVDA", why: "hardware" },
        { ticker: "nvda", why: "duplicate" },
        { ticker: "MADEUP", why: "unsupported" },
        { ticker: "bad$", why: "invalid" },
        { ticker: "MSFT", why: "cloud" },
      ],
    }),
  );
  const args = { ...request(), sessionFence: identities[0]!.sessionId };
  const answer = await a.action(api.discovery.search, args);
  expect(answer.result).toMatchObject({
    kind: "results",
    assets: [
      { ticker: "NVDA", name: "Canonical NVDA", why: "hardware" },
      { ticker: "MSFT", name: "Canonical MSFT", why: "cloud" },
    ],
  });
  expect(answer.usage?.remaining).toBe(19);
  expect((await a.action(api.discovery.search, args)).result.kind).toBe(
    "error",
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(
    a.action(api.discovery.search, { ...args, prompt: "different" }),
  ).rejects.toThrow("REQUEST_CONFLICT");
  expect(
    (
      await b.query(api.discoveryQuota.usage, {
        sessionFence: identities[1]!.sessionId,
      })
    ).remaining,
  ).toBe(20);
  const receipts = await t.run((ctx) =>
    ctx.db.query("discoveryRequests").collect(),
  );
  expect(Object.keys(receipts[0]!)).not.toContain("prompt");
  expect(JSON.stringify(receipts)).not.toContain(args.prompt);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test("concurrent final-slot reservations cannot overspend across tabs; completed requests cannot count twice", async () => {
  const { a, identities } = await setup();
  const sessionFence = identities[0]!.sessionId;
  const reserve = () =>
    a.mutation(internal.discoveryQuota.reserve, {
      sessionFence,
      requestId: request().requestId,
      promptHash: "a".repeat(64),
    });
  for (let i = 0; i < 19; i++) {
    const slot = await reserve();
    if (slot.kind !== "reserved") throw Error("Missing fixture reservation");
    expect(
      await a.mutation(internal.discoveryQuota.finish, {
        receipt: slot.receipt,
        success: true,
        sessionFence,
      }),
    ).toBe(true);
  }
  const slots = await Promise.all([reserve(), reserve()]);
  expect(slots.map((s) => s.kind).sort()).toEqual(["busy", "reserved"]);
  const slot = slots.find((s) => s.kind === "reserved")!;
  expect(
    await a.mutation(internal.discoveryQuota.finish, {
      receipt: slot.receipt,
      success: true,
      sessionFence,
    }),
  ).toBe(true);
  expect(
    await a.mutation(internal.discoveryQuota.finish, {
      receipt: slot.receipt,
      success: true,
      sessionFence,
    }),
  ).toBe(false);
  expect((await reserve()).kind).toBe("limit");
  expect(
    (await a.query(api.discoveryQuota.usage, { sessionFence })).remaining,
  ).toBe(0);
});
test.each(["provider", "malformed", "truncated", "oversize"])(
  "%s failures release the reservation and reveal no raw errors",
  async (failure) => {
    const fetcher = liveFixture();
    const { a, identities } = await setup();
    fetcher.mockImplementation(async () =>
      failure === "provider"
        ? new Response("private error text", { status: 429 })
        : failure === "malformed"
          ? response({ wrong: true })
          : failure === "truncated"
            ? response(valid, "length")
            : new Response("x".repeat(64001)),
    );
    const answer = await a.action(api.discovery.search, {
      ...request(),
      sessionFence: identities[0]!.sessionId,
    });
    expect(answer.result.kind).toBe("unavailable");
    expect(answer.usage?.remaining).toBe(20);
    expect(JSON.stringify(answer)).not.toContain("private error text");
  },
);
test.each(["empty", "clarification", "unknown"])(
  "completed %s responses consume one search",
  async (kind) => {
    const fetcher = liveFixture();
    const { a, identities } = await setup();
    const payload =
      kind === "unknown"
        ? { ...valid, candidates: [{ ticker: "MADEUP", why: "unmatched" }] }
        : {
            kind,
            summary: "No confident supported suggestions",
            candidates: [],
            question:
              kind === "clarification" ? "Equipment or generation?" : "",
            answers:
              kind === "clarification" ? ["Equipment", "Generation"] : [],
          };
    fetcher.mockImplementation(async () => response(payload));
    const answer = await a.action(api.discovery.search, {
      ...request(),
      sessionFence: identities[0]!.sessionId,
    });
    expect(answer.result.kind).toBe(kind === "unknown" ? "empty" : kind);
    expect(answer.usage?.remaining).toBe(19);
  },
);
test("stale catalog fails before inference; it never imports provider data or falls back to samples", async () => {
  const fetcher = liveFixture();
  const { t, a, identities } = await setup();
  await t.run(async (ctx) => {
    for (const row of await ctx.db.query("marketEntries").collect())
      await ctx.db.patch(row._id, { checkedAt: Date.now() - 8 * 86400000 });
  });
  const answer = await a.action(api.discovery.search, {
    ...request(),
    sessionFence: identities[0]!.sessionId,
  });
  expect(answer.result.kind).toBe("unavailable");
  expect(answer.usage?.remaining).toBe(20);
  expect(fetcher).not.toHaveBeenCalled();
});
test("mixed catalog revisions refuse the complete result and refund the user", async () => {
  const fetcher = liveFixture();
  const { t, a, identities } = await setup();
  fetcher.mockImplementation(async () => {
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("marketEntries")
        .withIndex("by_key", (q) =>
          q.eq("key", `catalog:${catalogShard("NVDA")}`),
        )
        .unique();
      await ctx.db.patch(row!._id, { revision: "different-revision" });
    });
    return response();
  });
  const answer = await a.action(api.discovery.search, {
    ...request(),
    sessionFence: identities[0]!.sessionId,
  });
  expect(answer.result.kind).toBe("unavailable");
  expect(answer.usage?.remaining).toBe(20);
});
test("daily usage belongs to the account across sessions, not to one browser login", async () => {
  liveFixture();
  const { t, a, identities } = await setup();
  await a.action(api.discovery.search, {
    ...request(),
    sessionFence: identities[0]!.sessionId,
  });
  const now = Date.now();
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "session",
      data: {
        userId: identities[0]!.subject,
        token: "second-device",
        expiresAt: now + 60000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const second = t.withIdentity({
    subject: identities[0]!.subject,
    sessionId: session._id,
  });
  expect(
    (
      await second.query(api.discoveryQuota.usage, {
        sessionFence: session._id,
      })
    ).remaining,
  ).toBe(19);
});
test("receipts and expired daily usage are retired without resetting today's allowance", async () => {
  const { t, a, identities } = await setup();
  const now = Date.now(),
    sessionFence = identities[0]!.sessionId;
  const reserved = await a.mutation(internal.discoveryQuota.reserve, {
    sessionFence,
    requestId: request().requestId,
    promptHash: "a".repeat(64),
  });
  if (reserved.kind !== "reserved") throw Error("Fixture failed");
  await a.mutation(internal.discoveryQuota.finish, {
    receipt: reserved.receipt,
    success: true,
    sessionFence,
  });
  const row = (
    await t.run((ctx) => ctx.db.query("discoveryUsage").collect())
  )[0]!;
  vi.spyOn(Date, "now").mockReturnValue(now + DISCOVERY.receiptMs + 1);
  await t.mutation(internal.discoveryQuota.retire, {
    receipt: reserved.receipt,
    usageId: row._id,
  });
  expect(await t.run((ctx) => ctx.db.get(reserved.receipt))).toBeNull();
  expect(await t.run((ctx) => ctx.db.get(row._id))).toBeNull();
  expect(
    (await a.query(api.discoveryQuota.usage, { sessionFence })).remaining,
  ).toBe(20);
});
test("logout during inference refuses late output and releases the slot", async () => {
  const fetcher = liveFixture();
  const { t, a, identities } = await setup();
  let resolve!: (response: Response) => void, started!: () => void;
  const ready = new Promise<void>((r) => {
    started = r;
  });
  fetcher.mockImplementation(() => {
    started();
    return new Promise<Response>((r) => {
      resolve = r;
    });
  });
  const pending = a.action(api.discovery.search, {
    ...request(),
    sessionFence: identities[0]!.sessionId,
  });
  await ready;
  await t.mutation(components.betterAuth.adapter.deleteOne, {
    input: {
      model: "session",
      where: [{ field: "_id", value: identities[0]!.sessionId }],
    },
  });
  resolve(response());
  await expect(pending).rejects.toThrow("SIGN_IN_REQUIRED");
  const rows = await t.run((ctx) => ctx.db.query("discoveryUsage").collect());
  expect(rows[0]?.completed).toBe(0);
  expect(rows[0]?.pendingId).toBeUndefined();
});
test("expired reservations fence late completions; allowance resets by UTC day and old IDs expire", async () => {
  const { a, identities } = await setup();
  const now = Date.now(),
    sessionFence = identities[0]!.sessionId;
  const args = {
    sessionFence,
    requestId: request().requestId,
    promptHash: "a".repeat(64),
  };
  const first = await a.mutation(internal.discoveryQuota.reserve, args);
  if (first.kind !== "reserved") throw Error("Fixture failed");
  vi.spyOn(Date, "now").mockReturnValue(now + DISCOVERY.leaseMs + 1);
  const second = await a.mutation(internal.discoveryQuota.reserve, {
    ...args,
    requestId: request().requestId,
  });
  if (second.kind !== "reserved") throw Error("Fixture failed");
  expect(
    await a.mutation(internal.discoveryQuota.finish, {
      receipt: first.receipt,
      success: true,
      sessionFence,
    }),
  ).toBe(false);
  expect(
    await a.mutation(internal.discoveryQuota.finish, {
      receipt: second.receipt,
      success: true,
      sessionFence,
    }),
  ).toBe(true);
  expect(
    (await a.query(api.discoveryQuota.usage, { sessionFence })).remaining,
  ).toBe(19);
  vi.spyOn(Date, "now").mockReturnValue(now + 86_400_000);
  expect(
    (await a.query(api.discoveryQuota.usage, { sessionFence })).remaining,
  ).toBe(20);
  await expect(
    a.mutation(internal.discoveryQuota.reserve, args),
  ).rejects.toThrow("INVALID_REQUEST");
});
test("transport sends only bounded prompt instructions and stops on deadline", async () => {
  const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: DISCOVERY.model,
      reasoning_effort: "low",
      max_completion_tokens: 1024,
      include_reasoning: false,
      response_format: { json_schema: { strict: true } },
    });
    expect(body.messages).toHaveLength(2);
    expect(body).not.toHaveProperty("tools");
    return response();
  });
  await requestDiscoveryCandidates("data centers", {
    apiKey: "fake",
    fetch: fetcher,
  });
  vi.useFakeTimers();
  const hanging = vi.fn<typeof fetch>(
    (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Deadline", "AbortError")),
        ),
      ),
  );
  const timed = requestDiscoveryCandidates("data centers", {
    apiKey: "fake",
    fetch: hanging,
  });
  const rejected = expect(timed).rejects.toThrow("Deadline");
  await vi.advanceTimersByTimeAsync(DISCOVERY.timeoutMs + 1);
  await rejected;
});
