import { afterEach, expect, test, vi } from "vitest";
import { fetchMarket } from "../src/lib/market-client-batch";
afterEach(() => vi.unstubAllGlobals());
const body = {
  portfolios: [
    { id: "private-a", holdings: [{ symbol: "SPY", weight: "100" }] },
  ],
  amount: "1000",
  range: "YTD" as const,
};
test("identical session requests share transport; aborting one consumer leaves its peer healthy", async () => {
  let finish!: (value: Response) => void;
  const transport = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", transport);
  const a = new AbortController(),
    b = new AbortController();
  const first = fetchMarket(body, a.signal, "session-a").catch(
    (e: unknown) => e,
  );
  const second = fetchMarket(body, b.signal, "session-a");
  await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
  a.abort();
  finish(new Response('{"status":"ready"}\n'));
  expect(await first).toBeInstanceOf(Error);
  expect(await (await second).text()).toContain('"ready"');
});
test("different sessions, history bytes, ranges and explicit retries retain separate requests", async () => {
  const transport = vi.fn(async (_url, init) => {
    const input = JSON.parse(init.body);
    return new Response(
      input.requests
        ? input.requests
            .map((_r: unknown, index: number) =>
              JSON.stringify({
                index,
                status: 200,
                body: '{"status":"ready"}\n',
              }),
            )
            .join("\n") + "\n"
        : '{"status":"ready"}\n',
    );
  });
  vi.stubGlobal("fetch", transport);
  const signal = new AbortController().signal;
  const responses = await Promise.all([
    fetchMarket(body, signal, "a"),
    fetchMarket(body, signal, "b"),
    fetchMarket({ ...body, range: "1W" }, signal, "a"),
    fetchMarket({ ...body, retry: true }, signal, "a"),
    fetchMarket(
      {
        ...body,
        history: [
          {
            key: "price:SPY:2026-11",
            payload: "first",
            revision: "a".repeat(64),
          },
        ],
      },
      signal,
      "a",
    ),
    fetchMarket(
      {
        ...body,
        history: [
          {
            key: "price:SPY:2026-11",
            payload: "second",
            revision: "a".repeat(64),
          },
        ],
      },
      signal,
      "a",
    ),
  ]);
  expect(responses).toHaveLength(6);
  const requests = transport.mock.calls.flatMap(([, init]) => {
    const parsed = JSON.parse(init.body);
    return parsed.requests ?? [parsed];
  });
  expect(requests).toHaveLength(6);
});
