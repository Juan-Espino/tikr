import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../src/app/api/market/route", () => ({ POST: vi.fn() }));
import { POST as single } from "../src/app/api/market/route";
import { POST } from "../src/app/api/market/batch/route";
const input = {
  portfolios: [{ id: "a", holdings: [{ symbol: "SPY", weight: "100" }] }],
  range: "1W",
  amount: "10000",
};
const request = (body: unknown, origin = "http://127.0.0.1:43139") =>
  new Request("http://127.0.0.1:43139/api/market/batch", {
    method: "POST",
    headers: {
      host: "127.0.0.1:43139",
      origin,
      "Content-Type": "application/json",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("batch publishes completed portfolios independently and validates all inputs before source work", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", undefined);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  vi.mocked(single).mockImplementation(async (req) => {
    const body = await req.json();
    if (body.amount === "20000") await gate;
    return new Response('{"status":"ready"}\n');
  });
  const response = await POST(
    request({ requests: [input, { ...input, amount: "20000" }], history: [] }),
  );
  expect(response.status).toBe(200);
  const reader = response.body!.getReader();
  const first = await reader.read();
  expect(JSON.parse(new TextDecoder().decode(first.value)).index).toBe(0);
  release();
  const second = await reader.read();
  expect(JSON.parse(new TextDecoder().decode(second.value)).index).toBe(1);
  await reader.cancel();
  vi.mocked(single).mockClear();
  for (const body of [
    { requests: [input, input, input, input], history: [] },
    { requests: [{ ...input, amount: "-1" }], history: [] },
    { requests: [input], history: [], unknown: true },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect((await POST(request("x".repeat(2_036_001)))).status).toBe(413);
  expect(
    (
      await POST(
        request({ requests: [input], history: [] }, "https://foreign.invalid"),
      )
    ).status,
  ).toBe(403);
  expect(single).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

test("HTTP 200 NDJSON can contain a blocked history result", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", undefined);
  try {
    vi.mocked(single).mockResolvedValue(
      new Response(
        JSON.stringify({ status: "blocked", code: "EVIDENCE_REVOKED" }) + "\n",
      ),
    );
    const response = await POST(request({ requests: [input], history: [] }));
    expect(response.status).toBe(200);
    const record = JSON.parse((await response.text()).trim());
    expect(record.status).toBe(200);
    expect(JSON.parse(record.body)).toMatchObject({
      status: "blocked",
      code: "EVIDENCE_REVOKED",
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
