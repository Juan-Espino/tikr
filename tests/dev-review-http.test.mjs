import test from "node:test";
import assert from "node:assert/strict";
import { reviewTarget } from "../scripts/dev-review-http.mjs";
const request = (url, headers = {}, method = "GET") => ({
  url,
  method,
  headers: { host: "localhost:43202", ...headers },
});

test("review adapter only targets owned loopback and blocks normalized private controls", () => {
  for (const path of [
    "//example.com/",
    "/\\example.com/",
    "/%5cexample.com/",
    "/__rehearsal/health",
    "/a/../__rehearsal/health",
    "/%5f%5frehearsal/stop",
    "/%2e%2e/__rehearsal/health",
    "/%ff",
  ]) {
    assert.equal(reviewTarget(request(path)), null, path);
  }
  assert.equal(
    reviewTarget(request("/_next/static/app.js")).origin,
    "https://localhost:43201",
  );
  assert.equal(
    reviewTarget(
      request("/api/market", { origin: "http://localhost:43202" }, "POST"),
    ).pathname,
    "/api/market",
  );
  assert.equal(reviewTarget(request("/api/market", {}, "POST")), null);
  assert.equal(
    reviewTarget(
      request("/api/market", { origin: "https://foreign.example" }, "POST"),
    ),
    null,
  );
  assert.equal(reviewTarget(request("/", { host: "foreign.example" })), null);
});
