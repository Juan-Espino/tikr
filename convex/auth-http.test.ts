import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import schema from "./schema";
import { safeAuthReturn } from "../src/lib/auth-return";
const modules = import.meta.glob("./**/*.ts");
beforeEach(() => {
  vi.stubEnv("SITE_URL", "http://localhost:5000");
  vi.stubEnv("CONVEX_SITE_URL", "https://test.convex.site");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "synthetic-test-secret-with-at-least-32-characters",
  );
  vi.stubEnv("GOOGLE_CLIENT_ID", "synthetic.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "synthetic-secret-never-real");
});
afterEach(() => vi.unstubAllEnvs());
test("HTTP module analysis succeeds without auth configuration and retains guest market route", async () => {
  for (const name of [
    "SITE_URL",
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ])
    vi.stubEnv(name, "");
  vi.resetModules();
  const { default: http } = await import("./http");
  expect(http.lookup("/api/auth/sign-in/social", "POST")).not.toBeNull();
  expect(http.lookup("/market-gateway", "POST")).not.toBeNull();
});
function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
function social(
  t: ReturnType<typeof setup>,
  callbackURL: string,
  origin = "http://localhost:5000",
) {
  return t.fetch("/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      errorCallbackURL: "/sign-in?error=oauth",
    }),
  });
}
test("Google generated redirect is exact app proxy callback and basic scopes only", async () => {
  const response = await social(
    setup(),
    safeAuthReturn("/portfolio/auth-test?range=1Y"),
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { url: string };
  const url = new URL(body.url);
  expect(url.hostname).toBe("accounts.google.com");
  expect(url.searchParams.get("redirect_uri")).toBe(
    "http://localhost:5000/api/auth/callback/google",
  );
  expect(new Set(url.searchParams.get("scope")!.split(" "))).toEqual(
    new Set(["openid", "profile", "email"]),
  );
  expect(url.searchParams.get("prompt")).toBe("select_account");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
});

test("production origin generates the exact production Google proxy callback", async () => {
  vi.stubEnv("SITE_URL", "https://tikr-lovat.vercel.app");
  const response = await social(
    setup(),
    "/dashboard",
    "https://tikr-lovat.vercel.app",
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { url: string };
  expect(new URL(body.url).searchParams.get("redirect_uri")).toBe(
    "https://tikr-lovat.vercel.app/api/auth/callback/google",
  );
  expect(
    (await social(setup(), "/dashboard", "http://localhost:5000")).status,
  ).toBe(403);
});
test("untrusted callback and origin are rejected by backend even bypassing client", async () => {
  expect((await social(setup(), "https://evil.example/steal")).status).toBe(
    403,
  );
  expect(
    (await social(setup(), "/dashboard", "https://evil.example")).status,
  ).toBe(403);
});
test("guest session is empty and guest logout cannot create an identity", async () => {
  const t = setup();
  const response = await t.fetch("/api/auth/get-session");
  expect(response.status).toBe(200);
  expect(await response.json()).toBeNull();
  const logout = await t.fetch("/api/auth/sign-out", {
    method: "POST",
    headers: {
      Origin: "http://localhost:5000",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  expect(logout.status).toBe(200);
  expect(await (await t.fetch("/api/auth/get-session")).json()).toBeNull();
});
test("missing configuration fails instead of using default secrets", async () => {
  vi.stubEnv("BETTER_AUTH_SECRET", "");
  await expect(social(setup(), "/dashboard")).rejects.toThrow(
    "Google authentication is not configured",
  );
});
test("canceled callback without valid state does not create a session", async () => {
  const t = setup();
  const response = await t.fetch(
    "/api/auth/callback/google?error=access_denied&state=synthetic-invalid",
  );
  expect(response.status).toBe(302);
  expect(await (await t.fetch("/api/auth/get-session")).json()).toBeNull();
});

// Signed cookies here use only synthetic test records/secrets, never DEV data.
test("signed session persists across requests, logout revokes it, and another account stays separate", async () => {
  const { makeSignature } = await import("better-auth/crypto");
  const { components } = await import("./_generated/api");
  const t = setup();
  const now = Date.now();
  const cookies: string[] = [];
  for (const name of ["first", "second"]) {
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
    const token = `synthetic-token-${name}`;
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: "session",
        data: {
          userId: user._id,
          token,
          expiresAt: now + 60000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    cookies.push(
      `better-auth.session_token=${encodeURIComponent(token + "." + (await makeSignature(token, process.env.BETTER_AUTH_SECRET!)))}`,
    );
  }
  const read = async (cookie: string) =>
    (
      await t.fetch("/api/auth/get-session", { headers: { Cookie: cookie } })
    ).json() as Promise<{ user: { name: string } } | null>;
  expect((await read(cookies[0]!))?.user.name).toBe("first");
  expect((await read(cookies[0]!))?.user.name).toBe("first");
  expect((await read(cookies[1]!))?.user.name).toBe("second");
  const logout = await t.fetch("/api/auth/sign-out", {
    method: "POST",
    headers: {
      Cookie: cookies[0]!,
      Origin: "http://localhost:5000",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  expect(logout.status).toBe(200);
  expect(await read(cookies[0]!)).toBeNull();
  expect((await read(cookies[1]!))?.user.name).toBe("second");
  expect(
    await read(cookies[1]!.replace("synthetic-token-second", "tampered-token")),
  ).toBeNull();
});

test("denied Google callback returns to app error screen with draft return intact", async () => {
  const t = setup();
  const response = await t.fetch("/api/auth/sign-in/social", {
    method: "POST",
    headers: {
      Origin: "http://localhost:5000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL: "/portfolio/auth-test",
      errorCallbackURL:
        "/sign-in?error=oauth&returnTo=%2Fportfolio%2Fauth-test",
    }),
  });
  const { url } = (await response.json()) as { url: string };
  const state = new URL(url).searchParams.get("state")!;
  const cookie = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const denied = await t.fetch(
    `/api/auth/callback/google?error=access_denied&state=${encodeURIComponent(state)}`,
    { headers: { Cookie: cookie } },
  );
  expect(denied.status).toBe(302);
  const target = new URL(
    denied.headers.get("location")!,
    "http://localhost:5000",
  );
  expect(target.origin).toBe("http://localhost:5000");
  expect(target.pathname).toBe("/sign-in");
  expect(target.searchParams.get("returnTo")).toBe("/portfolio/auth-test");
  expect(await (await t.fetch("/api/auth/get-session")).json()).toBeNull();
});
