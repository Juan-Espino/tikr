/// <reference types="vite/client" />
import { createFunctionHandle } from "convex/server";
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import { expect, test, vi } from "vitest";
import { api, components, internal } from "./_generated/api";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
const token = "12345678-1234-4123-8123-123456789abc";
const definition = {
  name: "Core",
  holdings: [{ ticker: "SPY", weight: "100.00" }],
  manual: false,
  pinned: false,
  amount: "10000",
  range: "1W" as const,
  rangeChoice: "default" as const,
};
async function setup(age = 0) {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const people = [];
  for (const name of ["A", "B"]) {
    const now = Date.now();
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
          token: `token-${name}`,
          expiresAt: now + 1000000,
          createdAt: now - age,
          updatedAt: now,
        },
      },
    });
    const identity = {
      subject: user._id,
      sessionId: session._id,
      issuer: "https://synthetic.test",
      tokenIdentifier: `https://synthetic.test|${user._id}`,
    };
    people.push({ user, session, identity, client: t.withIdentity(identity) });
  }
  return { t, a: people[0]!, b: people[1]! };
}
test("guests, stale sessions, victim arguments and account-switch fences are refused", async () => {
  const { t, a, b } = await setup(300001);
  const args = { token, sessionFence: a.session._id };
  await expect(t.mutation(api.auth.beginDeletion, args)).rejects.toThrow(
    "SIGN_IN_REQUIRED",
  );
  await expect(b.client.mutation(api.auth.beginDeletion, args)).rejects.toThrow(
    "SESSION_CHANGED",
  );
  expect(await a.client.mutation(api.auth.beginDeletion, args)).toBe(
    "reauth_required",
  );
  await expect(
    a.client.mutation(api.auth.beginDeletion, {
      ...args,
      userId: b.user._id,
    } as never),
  ).rejects.toThrow();
  expect(
    await t.run((ctx) => ctx.db.query("accountDeletions").collect()),
  ).toEqual([]);
});
test("bounded deletion drains all personal tables; B/shared data survive; retries, late writes and new lifecycle", async () => {
  vi.useFakeTimers();
  try {
    const { t, a, b } = await setup();
    const bRow = await b.client.mutation(api.portfolios.create, {
      clientId: "b",
      definition,
      sessionFence: b.session._id,
    });
    const shared = await t.run((ctx) =>
      ctx.db.insert("marketHosted", {
        key: "global-guard",
        payload: "preserve",
      }),
    );
    for (let i = 0; i < 205; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("portfolios", {
          ownerId: a.identity.tokenIdentifier,
          clientId: `a-${i}`,
          definition,
          normalizedName: "core",
          revision: 1,
          created: 1,
          updated: 1,
          deleted: i % 2 === 0,
        });
        await ctx.db.insert("discoveryUsage", {
          ownerId: a.identity.tokenIdentifier,
          day: `${i}`,
          completed: 1,
        });
        await ctx.db.insert("discoveryRequests", {
          ownerId: a.identity.tokenIdentifier,
          requestId: `${i}`,
          promptHash: "hash",
          day: `${i}`,
          status: "pending",
          leaseUntil: Date.now() + 100000,
          expiresAt: Date.now() + 200000,
        });
      });
    }
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: "account",
        data: {
          userId: a.user._id,
          providerId: "google",
          accountId: "synthetic-google-A",
          accessToken: "synthetic-only",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    for (let i = 0; i < 105; i++) {
      await t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: "session",
          data: {
            userId: a.user._id,
            token: `old-${i}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            expiresAt: Date.now() + 100000,
          },
        },
      });
      await t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: "account",
          data: {
            userId: a.user._id,
            providerId: "synthetic",
            accountId: `link-${i}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      });
    }
    const args = { token, sessionFence: a.session._id };
    await a.client.mutation(api.auth.beginDeletion, args);
    await a.client.mutation(api.auth.beginDeletion, args);
    const job = (
      await t.run((ctx) => ctx.db.query("accountDeletions").collect())
    )[0]!;
    await expect(
      a.client.mutation(api.portfolios.create, {
        clientId: "late",
        definition,
        sessionFence: a.session._id,
      }),
    ).rejects.toThrow("ACCOUNT_DELETING");
    await expect(
      a.client.query(api.discoveryQuota.usage, { sessionFence: a.session._id }),
    ).rejects.toThrow("ACCOUNT_DELETING");
    const receipt = (await t.run((ctx) =>
      ctx.db.query("discoveryRequests").first(),
    ))!;
    expect(
      await a.client.mutation(internal.discoveryQuota.finish, {
        receipt: receipt._id,
        success: false,
        sessionFence: a.session._id,
      }),
    ).toBe(false);
    // Explicitly drive one batch: an interrupted workflow leaves its fence and remaining work.
    await t.mutation(internal.auth.cleanDeletion, { id: job._id });
    expect(
      (await t.run((ctx) => ctx.db.query("portfolios").collect())).length,
    ).toBe(156);
    expect(await t.query(api.auth.deletionProgress, { token })).toBe("pending");
    await t.mutation(api.auth.resumeDeletion, { token });
    for (let i = 0; i < 40; i++)
      await t.mutation(internal.auth.cleanDeletion, { id: job._id });
    expect(await t.query(api.auth.deletionProgress, { token })).toBe(
      "completed",
    );
    await t.run(async (ctx) => {
      expect(await ctx.db.query("accountDeletions").collect()).toEqual([]);
      expect(await ctx.db.query("discoveryRequests").collect()).toEqual([]);
      expect(await ctx.db.query("discoveryUsage").collect()).toEqual([]);
      expect(await ctx.db.query("portfolios").collect()).toEqual([bRow]);
      expect(await ctx.db.get(shared)).toMatchObject({ payload: "preserve" });
      const done = await ctx.db.query("deletionCompletions").unique();
      expect(Object.keys(done!).sort()).toEqual([
        "_creationTime",
        "_id",
        "expiresAt",
        "token",
      ]);
    });
    for (const model of ["user", "session", "account"] as const) {
      const result = await t.query(components.betterAuth.adapter.findMany, {
        model,
        where: [
          { field: model === "user" ? "_id" : "userId", value: a.user._id },
        ],
        paginationOpts: { numItems: 100, cursor: null },
      });
      expect(result.page).toEqual([]);
    }
    await expect(
      a.client.mutation(api.portfolios.create, {
        clientId: "late",
        definition,
        sessionFence: a.session._id,
      }),
    ).rejects.toThrow("SIGN_IN_REQUIRED");
    const fresh = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: "user",
        data: {
          name: "A",
          email: a.user.email,
          emailVerified: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    expect(fresh._id).not.toBe(a.user._id);
    expect(await b.client.query(api.portfolios.get, { clientId: "b" })).toEqual(
      bRow,
    );
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(
      await t.run((ctx) => ctx.db.query("deletionCompletions").collect()),
    ).toEqual([]);
  } finally {
    vi.useRealTimers();
  }
});

test("transactional auth trigger handles roll back session/account reissue during and after deletion", async () => {
  vi.useFakeTimers();
  try {
    const { t, a } = await setup();
    const handle = await t.run(() =>
      createFunctionHandle(internal.auth.onCreate),
    );
    await a.client.mutation(api.auth.beginDeletion, {
      token,
      sessionFence: a.session._id,
    });
    const job = (await t.run((ctx) =>
      ctx.db.query("accountDeletions").unique(),
    ))!;
    for (const after of [false, true]) {
      if (after)
        for (let i = 0; i < 8; i++)
          await t.mutation(internal.auth.cleanDeletion, { id: job._id });
      await expect(
        t.mutation(components.betterAuth.adapter.create, {
          onCreateHandle: handle,
          input: {
            model: "session",
            data: {
              userId: a.user._id,
              token: "late-session",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              expiresAt: Date.now() + 10000,
            },
          },
        }),
      ).rejects.toThrow(after ? "SIGN_IN_REQUIRED" : "ACCOUNT_DELETING");
      await expect(
        t.mutation(components.betterAuth.adapter.create, {
          onCreateHandle: handle,
          input: {
            model: "account",
            data: {
              userId: a.user._id,
              providerId: "google",
              accountId: "late-provider",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          },
        }),
      ).rejects.toThrow(after ? "SIGN_IN_REQUIRED" : "ACCOUNT_DELETING");
      const sessions = await t.query(components.betterAuth.adapter.findMany, {
        model: "session",
        where: [{ field: "token", value: "late-session" }],
        paginationOpts: { cursor: null, numItems: 10 },
      });
      expect(sessions.page).toEqual([]);
    }
    await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally {
    vi.useRealTimers();
  }
});
