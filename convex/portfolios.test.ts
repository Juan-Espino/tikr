/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import { expect, test } from "vitest";
import { api, components } from "./_generated/api";
import schema from "./schema";
import { equalWeights } from "../src/lib/demo";
const modules = import.meta.glob("./**/*.ts");
const definition = {
  name: "Core",
  holdings: [{ ticker: "SPY", weight: "100.00" }],
  manual: false,
  pinned: false,
  amount: "10000",
  range: "1W" as const,
  rangeChoice: "default" as const,
};
const page = {
  paginationOpts: { numItems: 100, cursor: null },
  sessionKey: "synthetic",
};

test("session fences reject delayed writes after switching accounts or sessions", async () => {
  const { a, b, identities } = await setup();
  await expect(
    b.mutation(api.portfolios.create, {
      clientId: "delayed-a",
      sessionFence: identities[0]!.sessionId,
      definition,
    }),
  ).rejects.toThrow("SESSION_CHANGED");
  await expect(
    a.mutation(api.portfolios.create, {
      clientId: "old-session",
      sessionFence: "expired-session",
      definition,
    }),
  ).rejects.toThrow("SESSION_CHANGED");
  expect((await b.query(api.portfolios.list, page)).page).toEqual([]);
});

test("ordinary create retries are idempotent and deleted definitions retain only fencing receipts", async () => {
  const { t, a, identities } = await setup();
  const args = {
    clientId: "retry",
    sessionFence: identities[0]!.sessionId,
    definition,
  };
  const first = await a.mutation(api.portfolios.create, args);
  expect((await a.mutation(api.portfolios.create, args))._id).toBe(first._id);
  await expect(
    a.mutation(api.portfolios.create, {
      ...args,
      sourceId: "removed-import-source",
    } as never),
  ).rejects.toThrow();
  await a.mutation(api.portfolios.remove, {
    clientId: "retry",
    sessionFence: identities[0]!.sessionId,
    revision: 1,
  });
  const receipt = await t.run((ctx) => ctx.db.get("portfolios", first._id));
  expect(receipt?.deleted).toBe(true);
  expect(receipt?.definition.name).toBe("");
  expect(receipt?.definition.holdings).toEqual([]);
  expect(receipt?.definition.amount).toBe("");
});
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const now = Date.now();
  const identities: { subject: string; sessionId: string }[] = [];
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
          expiresAt: now + 60000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    identities.push({ subject: user._id, sessionId: session._id });
  }
  return {
    t,
    a: t.withIdentity(identities[0]!),
    b: t.withIdentity(identities[1]!),
    identities,
  };
}
test("CRUD, pin and rename isolate two live Better Auth identities; guests and supplied owner IDs are refused", async () => {
  const { t, a, b, identities } = await setup();
  const first = await a.mutation(api.portfolios.create, {
    sessionFence: identities[0]!.sessionId,
    clientId: "a",
    definition,
  });
  await b.mutation(api.portfolios.create, {
    sessionFence: identities[1]!.sessionId,
    clientId: "b",
    definition,
  });
  expect(
    (await a.query(api.portfolios.list, page)).page.map((p) => p.clientId),
  ).toEqual(["a"]);
  expect(
    (await b.query(api.portfolios.list, page)).page.map((p) => p.clientId),
  ).toEqual(["b"]);
  expect((await t.query(api.portfolios.list, page)).page).toEqual([]);
  for (const client of [b]) {
    await expect(
      client.query(api.portfolios.get, { clientId: "a" }),
    ).rejects.toThrow();
    await expect(
      client.mutation(api.portfolios.update, {
        sessionFence: identities[1]!.sessionId,
        clientId: "a",
        revision: 1,
        definition,
      }),
    ).rejects.toThrow();
    await expect(
      client.mutation(api.portfolios.remove, {
        sessionFence: identities[1]!.sessionId,
        clientId: "a",
        revision: 1,
      }),
    ).rejects.toThrow();
  }
  await expect(
    t.mutation(api.portfolios.create, {
      clientId: "guest",
      definition,
      sessionFence: "guest",
    }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  await expect(t.query(api.portfolios.get, { clientId: "a" })).rejects.toThrow(
    "SIGN_IN_REQUIRED",
  );
  await expect(
    t.mutation(api.portfolios.update, {
      clientId: "a",
      revision: 1,
      definition,
      sessionFence: "guest",
    }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  await expect(
    t.mutation(api.portfolios.remove, {
      clientId: "a",
      revision: 1,
      sessionFence: "guest",
    }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  await expect(
    b.mutation(api.portfolios.create, {
      sessionFence: identities[1]!.sessionId,
      clientId: "evil",
      definition,
      ownerId: first.ownerId,
    } as never),
  ).rejects.toThrow();
  await expect(
    b.query(api.portfolios.list, { ...page, userId: first.ownerId } as never),
  ).rejects.toThrow();
  const changed = await a.mutation(api.portfolios.update, {
    sessionFence: identities[0]!.sessionId,
    clientId: "a",
    revision: 1,
    definition: {
      ...definition,
      name: "Renamed",
      pinned: true,
      amount: "0.01",
    },
  });
  expect(changed.revision).toBe(2);
  expect(changed.definition.pinned).toBe(true);
  expect(changed.created).toBe(first.created);
  await a.mutation(api.portfolios.remove, {
    sessionFence: identities[0]!.sessionId,
    clientId: "a",
    revision: 2,
  });
  expect((await a.query(api.portfolios.list, page)).page).toEqual([]);
  expect((await b.query(api.portfolios.list, page)).page).toHaveLength(1);
});
test("expired, revoked, missing and mismatched sessions cannot read or mutate private portfolios", async () => {
  const { t, a, identities } = await setup();
  await a.mutation(api.portfolios.create, {
    sessionFence: identities[0]!.sessionId,
    clientId: "a",
    definition,
  });
  const wrongSession = t.withIdentity({
    subject: identities[0]!.subject,
    sessionId: identities[1]!.sessionId,
  });
  await expect(
    wrongSession.query(api.portfolios.get, { clientId: "a" }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: "session",
      where: [{ field: "_id", value: identities[0]!.sessionId }],
      update: { expiresAt: Date.now() - 1 },
    },
  });
  expect((await a.query(api.portfolios.list, page)).page).toEqual([]);
  await expect(
    a.mutation(api.portfolios.update, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: 1,
      definition,
    }),
  ).rejects.toThrow("SIGN_IN_REQUIRED");
  await t.mutation(components.betterAuth.adapter.deleteOne, {
    input: {
      model: "session",
      where: [{ field: "_id", value: identities[0]!.sessionId }],
    },
  });
  await expect(a.query(api.portfolios.get, { clientId: "a" })).rejects.toThrow(
    "SIGN_IN_REQUIRED",
  );
});
test("atomic name checks handle case/trim, rename races and concurrent creation", async () => {
  const { a, identities } = await setup();
  const outcomes = await Promise.allSettled([
    a.mutation(api.portfolios.create, {
      sessionFence: identities[0]!.sessionId,
      clientId: "one",
      definition,
    }),
    a.mutation(api.portfolios.create, {
      sessionFence: identities[0]!.sessionId,
      clientId: "two",
      definition: { ...definition, name: "  cOrE  " },
    }),
  ]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(outcomes.filter((r) => r.status === "rejected")).toHaveLength(1);
  const saved = (await a.query(api.portfolios.list, page)).page[0]!;
  await a.mutation(api.portfolios.create, {
    sessionFence: identities[0]!.sessionId,
    clientId: "three",
    definition: { ...definition, name: "Other" },
  });
  await expect(
    a.mutation(api.portfolios.update, {
      sessionFence: identities[0]!.sessionId,
      clientId: "three",
      revision: 1,
      definition: { ...definition, name: " CORE " },
    }),
  ).rejects.toThrow("NAME_CONFLICT");
  expect(
    (
      await a.query(api.portfolios.get, { clientId: saved.clientId })
    ).definition.name.toLowerCase(),
  ).toBe("core");
});
test("stale writes and delete races cannot lose changes or recreate deleted rows", async () => {
  const { a, identities } = await setup();
  await a.mutation(api.portfolios.create, {
    sessionFence: identities[0]!.sessionId,
    clientId: "a",
    definition,
  });
  const outcomes = await Promise.allSettled(
    ["Left", "Right"].map((name) =>
      a.mutation(api.portfolios.update, {
        sessionFence: identities[0]!.sessionId,
        clientId: "a",
        revision: 1,
        definition: { ...definition, name },
      }),
    ),
  );
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(outcomes.filter((r) => r.status === "rejected")).toHaveLength(1);
  await expect(
    a.mutation(api.portfolios.remove, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: 1,
    }),
  ).rejects.toThrow("REVISION_CONFLICT");
  const race = await Promise.allSettled([
    a.mutation(api.portfolios.remove, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: 2,
    }),
    a.mutation(api.portfolios.update, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: 2,
      definition,
    }),
  ]);
  expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const live = (await a.query(api.portfolios.list, page)).page[0];
  if (live)
    await a.mutation(api.portfolios.remove, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: live.revision,
    });
  await expect(
    a.mutation(api.portfolios.update, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      revision: 2,
      definition,
    }),
  ).rejects.toThrow("PORTFOLIO_UNAVAILABLE");
  await expect(
    a.mutation(api.portfolios.create, {
      sessionFence: identities[0]!.sessionId,
      clientId: "a",
      definition,
    }),
  ).rejects.toThrow("REVISION_CONFLICT");
});
test("bounded server validation enforces financial, range, allocation and name contracts", async () => {
  const { a, identities } = await setup();
  const invalid = [
    { name: " " },
    { name: "a".repeat(81) },
    { name: "bad\nname" },
    { amount: "0" },
    { amount: "NaN" },
    { amount: "100000000.01" },
    { amount: "1.001" },
    { amount: "1".repeat(17) },
    { holdings: [] },
    {
      holdings: Array.from({ length: 7 }, (_, i) => ({
        ticker: `A${i}`,
        weight: "14.28",
      })),
    },
    { holdings: [{ ticker: "SPY", weight: "99.99" }] },
    {
      holdings: [
        { ticker: "SPY", weight: "0" },
        { ticker: "MSFT", weight: "100" },
      ],
    },
    {
      holdings: [
        { ticker: "SPY", weight: "50" },
        { ticker: "SPY", weight: "50" },
      ],
    },
    { holdings: [{ ticker: "bad", weight: "100" }] },
    {
      holdings: [
        { ticker: "SPY", weight: "50.001" },
        { ticker: "MSFT", weight: "49.999" },
      ],
    },
    { range: "Max" },
    { range: "5Y", rangeChoice: "default" },
    {
      holdings: [
        { ticker: "SPY", weight: "60" },
        { ticker: "MSFT", weight: "40" },
      ],
    },
  ];
  for (const patch of invalid)
    await expect(
      a.mutation(api.portfolios.create, {
        sessionFence: identities[0]!.sessionId,
        clientId: "invalid",
        definition: { ...definition, ...patch },
      } as never),
    ).rejects.toThrow();
  for (const range of ["1W", "1M", "YTD", "1Y", "5Y"] as const) {
    const saved = await a.mutation(api.portfolios.create, {
      sessionFence: identities[0]!.sessionId,
      clientId: range,
      definition: {
        ...definition,
        name: range,
        range,
        rangeChoice: "explicit",
        amount: "100000000",
        holdings: equalWeights(["SPY", "MSFT", "NVDA"]),
      },
    });
    expect(saved.definition.range).toBe(range);
    expect(saved.definition.holdings.map((h) => h.weight)).toEqual([
      "33.33",
      "33.33",
      "33.34",
    ]);
  }
  await a.mutation(api.portfolios.create, {
    sessionFence: identities[0]!.sessionId,
    clientId: "manual",
    definition: {
      ...definition,
      name: "Manual",
      manual: true,
      holdings: [
        { ticker: "SPY", weight: "99.99" },
        { ticker: "MSFT", weight: "0.01" },
      ],
    },
  });
  for (const clientId of ["SPY", "a".repeat(81)]) {
    await expect(
      a.mutation(api.portfolios.create, {
        sessionFence: identities[0]!.sessionId,
        clientId,
        definition,
      }),
    ).rejects.toThrow("INVALID_ID");
  }
  await expect(
    a.query(api.portfolios.list, {
      ...page,
      paginationOpts: { numItems: 1000, cursor: null },
    }),
  ).rejects.toThrow("INVALID_PAGE");
});
