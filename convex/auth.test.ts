/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import { expect, test } from "vitest";
import { api, components } from "./_generated/api";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
test("guest cannot obtain private account; caller-supplied user ID is rejected", async () => {
  const t = setup();
  expect(await t.query(api.auth.currentAccount, {})).toBeNull();
  await expect(
    t.query(api.auth.currentAccount, { userId: "other" } as never),
  ).rejects.toThrow();
});
test("verified identity needs a live component session; users stay isolated and revocation takes effect", async () => {
  const t = setup();
  const now = Date.now();
  const users = await Promise.all(
    ["a", "b"].map((name) =>
      t.mutation(components.betterAuth.adapter.create, {
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
      }),
    ),
  );
  const sessions = await Promise.all(
    users.map((u, i) =>
      t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: "session",
          data: {
            userId: u._id,
            token: `synthetic-${i}`,
            expiresAt: now + 60000,
            createdAt: now,
            updatedAt: now,
          },
        },
      }),
    ),
  );
  for (let i = 0; i < 2; i++) {
    const client = t.withIdentity({
      subject: users[i]!._id,
      sessionId: sessions[i]!._id,
    });
    expect(await client.query(api.auth.currentAccount, {})).toEqual({
      name: users[i]!.name,
      email: users[i]!.email,
    });
  }
  expect(
    await t
      .withIdentity({ subject: users[0]!._id, sessionId: "missing" })
      .query(api.auth.currentAccount, {}),
  ).toBeNull();
  await t.mutation(components.betterAuth.adapter.deleteOne, {
    input: {
      model: "session",
      where: [{ field: "_id", value: sessions[0]!._id }],
    },
  });
  expect(
    await t
      .withIdentity({ subject: users[0]!._id, sessionId: sessions[0]!._id })
      .query(api.auth.currentAccount, {}),
  ).toBeNull();
});
