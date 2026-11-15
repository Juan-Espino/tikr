import { afterEach, expect, test, vi } from "vitest";
const upstream = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock("@convex-dev/better-auth/nextjs", () => ({
  convexBetterAuthNextJs: () => ({ handler: upstream }),
}));
import { GET, POST } from "../src/app/api/auth/[...all]/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
test("missing proxy configuration returns a safe uncacheable failure", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "");
  const r = await GET(
    new Request("http://localhost:5000/api/auth/get-session"),
  );
  expect(r.status).toBe(503);
  expect(r.headers.get("cache-control")).toBe("no-store");
  expect(upstream.GET).not.toHaveBeenCalled();
});
test("proxy preserves the request and cookie response but never caches identity", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "https://test.convex.site");
  const request = new Request("http://localhost:5000/api/auth/sign-out", {
    method: "POST",
    headers: { Cookie: "synthetic-cookie" },
  });
  upstream.POST.mockResolvedValue(
    new Response("{}", {
      headers: { "Set-Cookie": "synthetic=; Max-Age=0; HttpOnly" },
    }),
  );
  const response = await POST(request);
  expect(upstream.POST).toHaveBeenCalledWith(request);
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
test("upstream failure does not disclose internal diagnostics", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "https://test.convex.site");
  upstream.GET.mockRejectedValue(new Error("synthetic-private-diagnostic"));
  const response = await GET(
    new Request("http://localhost:5000/api/auth/get-session"),
  );
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("synthetic-private");
});

test("immutable OAuth response headers are copied without turning success into 503", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
  vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "https://test.convex.site");
  const immutable = Response.redirect(
    "https://accounts.google.com/synthetic",
    302,
  );
  expect(() => immutable.headers.set("Cache-Control", "no-store")).toThrow();
  upstream.POST.mockResolvedValue(immutable);
  const response = await POST(
    new Request("http://localhost:5000/api/auth/sign-in/social", {
      method: "POST",
    }),
  );
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(
    "https://accounts.google.com/synthetic",
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
});
