// @vitest-environment node
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MutationCtx } from "../convex/_generated/server";
import schema from "../convex/schema";
import { read, write, acquire, release } from "../convex/market";
import {
  observeDatabase,
  type DbObservation,
} from "./support/observe-database";
import { createFixture, portfolios } from "./support/market-fixture.ts";
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../convex/**/*.ts");
test("full request/body/actual database API matrix keeps control units separate from observations", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  const output: unknown[] = [];
  try {
    for (const mode of ["before", "after"]) {
      vi.setSystemTime(new Date("2026-11-11T15:00:00Z"));
      const t = convexTest(schema, modules);
      await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
        otherStorage: 0,
        otherIo: 0,
        otherCalls: 0,
        reviewedThrough: Date.now() + 3 * 86400000,
      });
      const f = createFixture(mode, `actual-db-${mode}`);
      let stats: DbObservation = {
        readOperations: 0,
        documentsReturned: 0,
        returnedValueBytes: 0,
        writeOperations: 0,
        writeArgumentBytes: 0,
      };
      const invoke = async (
        registered: unknown,
        args: unknown,
      ): Promise<Record<string, unknown>> =>
        t.run((ctx) =>
          (
            registered as {
              _handler: (
                ctx: MutationCtx,
                args: unknown,
              ) => Promise<Record<string, unknown>>;
            }
          )._handler({ ...ctx, db: observeDatabase(ctx.db, stats) }, args),
        );
      f.store.read = async (keys: string[]) => {
        const result = await invoke(read, { keys });
        if (result.status !== "ok") throw Error("SHARED_BUDGET_EXHAUSTED");
        return result.rows as import("../src/lib/market-storage").Stored[];
      };
      f.store.acquire = async (
        key: string,
        cycle: string,
        retry: boolean,
        from?: string,
      ) => {
        const token = crypto.randomUUID();
        const result = await invoke(acquire, {
          key,
          cycle,
          retry,
          token,
          ...(from ? { from } : {}),
        });
        return result.status === "acquired" ? token : null;
      };
      f.store.write = async (
        leaseKey: string,
        token: string,
        entries: unknown[],
      ) => {
        const result = await invoke(write, { leaseKey, token, entries });
        if (result.status !== "ok") throw Error("STORAGE_UNAVAILABLE");
      };
      f.store.release = async (key: string, token: string) => {
        await invoke(release, { key, token });
      };
      let hints: import("../src/lib/market-history-wire").HistoryChunk[] = [];
      for (const [scenario, range] of [
        ["cold", "5Y"],
        ["warm", "5Y"],
        ["1W", "1W"],
        ["1M", "1M"],
        ["YTD", "YTD"],
        ["1Y", "1Y"],
        ["amount-weights", "1Y"],
        ["overlap-add", "1Y"],
        ["remove-holding", "1Y"],
        ["restart", "1Y"],
        ["next-day", "5Y"],
      ] as const) {
        if (scenario === "restart") f.restart();
        if (scenario === "next-day") {
          f.setNow("2026-11-12T15:00:00Z");
          vi.setSystemTime(new Date("2026-11-12T15:00:00Z"));
        }
        stats = {
          readOperations: 0,
          documentsReturned: 0,
          returnedValueBytes: 0,
          writeOperations: 0,
          writeArgumentBytes: 0,
        };
        const network = { ...f.provider };
        const selected = structuredClone(portfolios);
        if (scenario === "amount-weights")
          selected[0]!.holdings.forEach(
            (h: { weight: string }, i: number) =>
              (h.weight = i === 0 ? "50" : "25"),
          );
        if (scenario === "overlap-add") {
          selected[1]!.holdings.push({ symbol: "AAA", weight: "25" });
          selected[1]!.holdings.forEach(
            (h: { weight: string }) => (h.weight = "25"),
          );
        }
        if (scenario === "remove-holding") {
          selected[0]!.holdings.pop();
          selected[0]!.holdings.forEach(
            (h: { weight: string }) => (h.weight = "50"),
          );
        }
        const result = await f.run(
          {
            portfolios: selected,
            amount: scenario === "amount-weights" ? "12345.67" : "10000",
          },
          range,
          false,
          hints,
        );
        expect(
          result.final.status,
          `${mode}/${scenario}: ${result.final.code}`,
        ).toBe("ready");
        hints = [
          ...new Map(
            [...hints, ...result.history].map((row) => [row.key, row] as const),
          ).values(),
        ];
        output.push({
          mode,
          scenario,
          providerRequests: f.provider.requests - network.requests,
          providerReceivedBytes:
            f.provider.receivedBytes - network.receivedBytes,
          ...stats,
        });
      }
    }
    const file = join(tmpdir(), "tikr-redesign-actual-db-matrix.json");
    await writeFile(
      file,
      JSON.stringify(
        {
          scope:
            "Synthetic actual local Convex API calls/documents/value bytes; write arguments differ from rewritten document/index bytes. No platform billing claims.",
          output,
        },
        null,
        2,
      ),
    );
    console.info(file);
  } finally {
    vi.useRealTimers();
  }
}, 90000);
