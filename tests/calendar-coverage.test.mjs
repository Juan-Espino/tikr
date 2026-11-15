import test from "node:test";
import assert from "node:assert/strict";
import { calendarFixture } from "./support/calendar-fixture.mjs";
import { fetchPersonalCalendar } from "../src/lib/alpaca/personal-loader.ts";
import {
  calendarBoundary,
  eligibleSessions,
} from "../src/lib/market-calendar.ts";
const request = {
  portfolios: [
    { id: "a", holdings: [{ symbol: "AAA", weight: "100" }] },
    { id: "b", holdings: [{ symbol: "BBB", weight: "100" }] },
  ],
  amount: "1000",
};
const cases = [
  ["Saturday", "2026-11-14T15:00Z", ["2026-11-12", "2026-11-13"], "2026-11-13"],
  ["Sunday", "2026-11-15T15:00Z", ["2026-11-12", "2026-11-13"], "2026-11-13"],
  [
    "Monday before nine",
    "2026-11-16T13:59Z",
    ["2026-11-12", "2026-11-13"],
    "2026-11-13",
  ],
  [
    "Friday holiday weekend",
    "2026-04-05T14:00Z",
    ["2026-04-01", "2026-04-02"],
    "2026-04-02",
  ],
  [
    "Monday holiday Tuesday before nine",
    "2026-09-08T12:59Z",
    ["2026-09-03", "2026-09-04", "2026-09-08"],
    "2026-09-04",
  ],
  [
    "Monday holiday Tuesday nine",
    "2026-09-08T13:00Z",
    ["2026-09-03", "2026-09-04", "2026-09-08"],
    "2026-09-04",
  ],
  [
    "Wednesday nine",
    "2026-09-09T13:00Z",
    ["2026-09-03", "2026-09-04", "2026-09-08"],
    "2026-09-08",
  ],
  [
    "synthetic consecutive closures/year boundary",
    "2027-01-03T15:00Z",
    ["2026-12-29", "2026-12-30"],
    "2026-12-30",
  ],
  [
    "early close before next nine",
    "2026-11-28T13:59Z",
    ["2026-11-25", "2026-11-27"],
    "2026-11-25",
  ],
  [
    "early close next nine",
    "2026-11-28T14:00Z",
    ["2026-11-25", "2026-11-27"],
    "2026-11-27",
  ],
  [
    "spring DST",
    "2026-03-08T13:00Z",
    ["2026-03-05", "2026-03-06"],
    "2026-03-06",
  ],
  ["fall DST", "2026-11-01T14:00Z", ["2026-10-29", "2026-10-30"], "2026-10-30"],
  [
    "leap/month transition",
    "2024-03-01T14:00Z",
    ["2024-02-28", "2024-02-29"],
    "2024-02-29",
  ],
];
for (const [name, now, dates, latest] of cases)
  test(`loader -> durable initial/settled: ${name}`, async () => {
    const f = calendarFixture(
      dates,
      now,
      new Date(Date.parse(dates[0]) - 8 * 86400000).toISOString().slice(0, 10),
    );
    const c = await f.calendar();
    assert.equal(c.through, now.slice(0, 10));
    assert.equal(c.sessions.at(-1), latest);
    const opened = await f.run(request);
    const result = await opened.settled;
    if (c.sessions.length < 2) {
      assert.equal(result.status, "blocked");
      assert.equal(result.code, "INSUFFICIENT_COVERAGE");
      return;
    }
    assert.equal(opened.initial.status, "refreshing");
    assert.equal(result.status, "ready", JSON.stringify(result));
    assert.equal(result.result.actual.end, latest);
    assert.equal(result.result.portfolios.length, 2);
    const n = f.calls();
    assert.equal((await (await f.run(request)).settled).status, "ready");
    assert.equal(f.calls(), n, "fresh coordinator reuses durable fixture");
  });
test("DST cutoff instants and next CALENDAR day, including today exclusion", () => {
  for (const [now, cutoff] of [
    ["2026-03-08T12:59Z", "2026-03-06"],
    ["2026-03-08T13:00Z", "2026-03-07"],
    ["2026-11-01T13:59Z", "2026-10-30"],
    ["2026-11-01T14:00Z", "2026-10-31"],
    ["2024-03-01T13:59Z", "2024-02-28"],
    ["2024-03-01T14:00Z", "2024-02-29"],
  ])
    assert.equal(calendarBoundary(new Date(now)).eligibleThrough, cutoff);
  assert.deepEqual(
    eligibleSessions(
      ["2026-09-08", "2026-09-09"],
      new Date("2026-09-09T20:00Z"),
    ),
    ["2026-09-08"],
  );
});
test("invalid bounds, malformed/duplicate/unordered/truncated/oversized responses fail closed", async () => {
  const good = [{ date: "2026-11-12" }, { date: "2026-11-13" }];
  for (const body of [
    [],
    [good[0], good[0]],
    [good[1], good[0]],
    [{ date: "2026-02-30" }],
    [{ date: "2026-11-16" }],
    null,
    Array(1301).fill(good[0]),
    "x".repeat(256001),
  ]) {
    await assert.rejects(
      fetchPersonalCalendar(
        {
          keyId: "synthetic",
          secret: "synthetic",
          transport: async () => Response.json(body),
        },
        "2026-11-12",
        "2026-11-15",
        new Date("2026-11-15T15:00Z"),
      ),
    );
  }
  for (const response of [
    new Response('[{"date":'),
    new Response(JSON.stringify(good), {
      headers: { "content-length": "999" },
    }),
  ])
    await assert.rejects(
      fetchPersonalCalendar(
        {
          keyId: "synthetic",
          secret: "synthetic",
          transport: async () => response,
        },
        "2026-11-12",
        "2026-11-15",
        new Date("2026-11-15T15:00Z"),
      ),
    );
  for (const [start, end] of [
    [undefined, "2026-11-15"],
    ["2026-11-16", "2026-11-15"],
    ["2026-02-30", "2026-11-15"],
  ])
    await assert.rejects(
      fetchPersonalCalendar(
        {
          transport: async () => {
            throw Error("must not fetch");
          },
        },
        start,
        end,
        new Date("2026-11-15T15:00Z"),
      ),
    );
});
test("old last-session metadata cannot fabricate Sunday coverage; missing trading close stays MISSING_PRICE", async () => {
  const f = calendarFixture(
    ["2026-11-12", "2026-11-13"],
    "2026-11-15T15:00Z",
    "2026-11-01",
  );
  const c = await f.calendar();
  f.setCalendar({ ...c, through: "2026-11-13" });
  await assert.rejects(f.run(request), /CALENDAR_UNAVAILABLE/);
  assert.equal(f.calls(), 0);
  f.setCalendar(c);
  f.setMissing(true);
  const blocked = await (await f.run(request)).settled;
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.code, "MISSING_PRICE");
});

test("all approved presets anchor to actual Friday and preserve common dates/SPY", async () => {
  const dates = [
    "2021-11-12",
    "2021-11-15",
    "2025-11-13",
    "2025-11-14",
    "2026-01-02",
    "2026-01-05",
    "2026-10-13",
    "2026-10-14",
    "2026-11-06",
    "2026-11-09",
    "2026-11-12",
    "2026-11-13",
  ];
  const f = calendarFixture(dates, "2026-11-15T15:00Z", "2021-11-01");
  await f.calendar();
  for (const range of ["1W", "1M", "YTD", "1Y", "5Y"]) {
    const v = await (await f.run(request, range)).settled;
    assert.equal(v.status, "ready", JSON.stringify(v));
    assert.equal(v.result.actual.end, "2026-11-13");
    assert.equal(v.result.portfolios.length, 2);
    assert.ok(v.result.benchmark);
  }
});
test("checked coverage extension alone preserves financial revision; corrected sessions invalidate saved result", async () => {
  const f = calendarFixture(
    ["2026-11-09", "2026-11-12", "2026-11-13"],
    "2026-11-15T15:00Z",
    "2026-11-01",
  );
  const c = await f.calendar();
  const before = await (await f.run(request)).settled;
  assert.equal(before.status, "ready");
  const revisions = [...f.rows.values()]
    .filter((r) => r.key.startsWith("result:"))
    .map((r) => r.revision);
  f.setCalendar({ ...c, through: "2026-11-16" });
  const unchanged = await f.run(request);
  assert.equal(unchanged.initial.status, "ready");
  assert.deepEqual(
    [...f.rows.values()]
      .filter((r) => r.key.startsWith("result:"))
      .map((r) => r.revision),
    revisions,
  );
  // A provider correction adds a required trading session with no corresponding close.
  f.setCalendar({
    ...c,
    sessions: ["2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13"],
  });
  const corrected = await f.run(request);
  assert.notEqual(corrected.initial.status, "ready");
  assert.notEqual((await corrected.settled).status, "ready");
});

test("calendar diagnostics classify no eligible sessions and reject malformed coverage before source work", async () => {
  const f = calendarFixture(
    ["2026-11-12", "2026-11-13"],
    "2026-11-15T15:00Z",
    "2026-11-01",
  );
  const c = await f.calendar();
  for (const patch of [
    { from: undefined },
    { through: undefined },
    { through: "2026-02-30" },
    { from: "2026-11-16" },
    { sessions: ["2026-11-13", "2026-11-12"] },
    { sessions: [] },
    { complete: false },
    { finalityVerified: false },
  ]) {
    f.setCalendar({ ...c, ...patch });
    await assert.rejects(f.run(request), /CALENDAR_UNAVAILABLE/);
  }
  assert.equal(f.calls(), 0);
  const logs = [];
  const original = console.error;
  console.error = (v) => logs.push(JSON.parse(v));
  try {
    await assert.rejects(
      fetchPersonalCalendar(
        { transport: async () => Response.json([]) },
        "2026-11-12",
        "2026-11-15",
        new Date("2026-11-15T15:00Z"),
      ),
      /CALENDAR_UNAVAILABLE/,
    );
    assert.equal(logs.at(-1).reason, "no_eligible_session");
    assert.deepEqual(Object.keys(logs.at(-1)).sort(), ["event", "reason"]);
  } finally {
    console.error = original;
  }
  for (const response of [
    Response.json([{ date: "2026-11-12", open: "25:00" }]),
    Response.json([{ date: "2026-11-12", open: "16:00", close: "09:30" }]),
    new Response("[]", { status: 206 }),
    new Response(new Uint8Array([255, 254])),
  ]) {
    await assert.rejects(
      fetchPersonalCalendar(
        { transport: async () => response },
        "2026-11-12",
        "2026-11-15",
        new Date("2026-11-15T15:00Z"),
      ),
    );
  }
});
