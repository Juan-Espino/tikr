import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  captureCase,
  replayCase,
  auditCase,
  capturingTransport,
  LIMITS,
  sha256,
  caseHash,
  snapshotHash,
  numericFidelity,
} from "../scripts/lib/alpaca-validation.mjs";
import { getCase } from "../scripts/lib/alpaca-cases.mjs";

const credentials = {
  keyId: "synthetic-key-canary",
  secret: "synthetic-secret-canary",
};
const spec = {
  id: "synthetic-payment",
  holding: "AAA",
  symbols: ["AAA", "SPY"],
  amount: "100",
  start: "2024-01-02",
  end: "2024-01-04",
  sessions: ["2024-01-02", "2024-01-03", "2024-01-04"],
  references: ["https://example.invalid/synthetic-source"],
  expectedActions: [
    {
      symbol: "AAA",
      kind: "cash_dividends",
      date: "2024-01-03",
      paymentDate: "2024-01-04",
      amount: "2",
    },
  ],
};
function provider(caseSpec = spec, edit = (x) => x) {
  const bars = Object.fromEntries(
    caseSpec.symbols.map((symbol) => [
      symbol,
      caseSpec.sessions
        .filter(
          (day) =>
            !caseSpec.firstAvailable?.[symbol] ||
            day >= caseSpec.firstAvailable[symbol],
        )
        .map((day, i) => ({
          t: `${day}T12:00:00Z`,
          c: symbol === "SPY" ? 100 : ([100, 101, 110][i] ?? 110),
        })),
    ]),
  );
  const corporate_actions = {};
  for (const [i, action] of caseSpec.expectedActions.entries()) {
    const row = {
      id: `synthetic-${i}`,
      symbol: action.symbol,
      process_date: caseSpec.end,
      ex_date: action.date,
      ...(action.kind === "cash_dividends"
        ? {
            rate: Number(action.amount),
            payable_date: action.paymentDate,
            special: false,
            foreign: false,
          }
        : {
            new_rate: Number(action.numerator),
            old_rate: Number(action.denominator),
          }),
    };
    (corporate_actions[action.kind] ??= []).push(row);
  }
  return async (url) => {
    const body =
      new URL(url).pathname === "/v2/stocks/bars"
        ? { bars, next_page_token: null }
        : { corporate_actions, next_page_token: null };
    return new Response(edit(JSON.stringify(body)), { status: 200 });
  };
}
async function fixture(caseSpec = spec, transport = provider(caseSpec)) {
  const snapshot = await captureCase(caseSpec, "sip", credentials, transport);
  const candidates = await replayCase(snapshot, caseSpec);
  return { snapshot, candidates };
}
function reviewed(snapshot, caseSpec = spec) {
  const proof = {
    status: "verified",
    source: "synthetic complete fixture",
    method: "independent synthetic oracle",
    from: caseSpec.start,
    through: caseSpec.end,
  };
  const evidence = {
    calendar: proof,
    finality: proof,
    actions: {},
    inception: {},
    prices: {},
    access: {},
    dividendUnits: {},
  };
  for (const symbol of caseSpec.symbols) {
    for (const key of ["actions", "prices", "access"])
      evidence[key][symbol] = { ...proof };
    evidence.inception[symbol] = {
      ...proof,
      firstAvailable: caseSpec.firstAvailable?.[symbol] ?? "1990-01-01",
    };
    evidence.dividendUnits[symbol] = { ...proof, basis: "postSplit" };
  }
  const comparisonPrices = Object.fromEntries(
    caseSpec.symbols.map((symbol) => [
      symbol,
      Object.fromEntries(
        caseSpec.sessions
          .filter(
            (day) =>
              !caseSpec.firstAvailable?.[symbol] ||
              day >= caseSpec.firstAvailable[symbol],
          )
          .map((day, i) => [
            day,
            {
              price: String(
                symbol === "SPY" ? 100 : ([100, 101, 110][i] ?? 110),
              ),
              source:
                "https://example.invalid/independent-synthetic-price-record",
              feed: "sip",
              basis: "raw-matching-feed-close",
              checkedAt: new Date().toISOString(),
            },
          ]),
      ),
    ]),
  );
  return {
    comparisonPrices,
    review: {
      caseHash: caseHash(caseSpec),
      snapshotHash: snapshotHash(snapshot),
      reviewer: "Synthetic test author",
      reviewedAt: new Date().toISOString(),
      sources: caseSpec.references,
    },
    evidence,
  };
}
const check = (report, id) => report.checks.find((c) => c.id === id).status;

test("capture preserves raw bytes and replays with zero live calls or stored credentials", async () => {
  let calls = 0;
  const upstream = provider();
  const snapshot = await captureCase(
    spec,
    "sip",
    credentials,
    async (...args) => {
      calls++;
      return upstream(...args);
    },
  );
  assert.equal(calls, 2);
  await replayCase(snapshot, spec);
  assert.equal(calls, 2);
  assert.equal(snapshot.pages.length, 2);
  assert(!JSON.stringify(snapshot).includes(credentials.secret));
  assert(!JSON.stringify(snapshot).includes(credentials.keyId));
  for (const page of snapshot.pages)
    assert.equal(sha256(page.body), page.sha256);
});
test("pagination alone leaves every external evidence prerequisite unresolved", async () => {
  const { snapshot, candidates } = await fixture();
  const report = auditCase(snapshot, spec, candidates);
  assert.equal(report.status, "unresolved");
  assert.equal(check(report, "proposed-session-coverage"), "passed");
  assert.equal(check(report, "evidence:actions:AAA"), "unresolved");
  assert.equal(check(report, "independent-calculation"), "unresolved");
  assert.equal(report.actualPeriod, undefined);
});
test("explicit synthetic evidence permits engine comparison with exact independent fractions", async () => {
  const { snapshot, candidates } = await fixture();
  const report = auditCase(snapshot, spec, candidates, reviewed(snapshot));
  assert.equal(report.status, "passed");
  assert.equal(report.exactOracle.AAA.ending, "112/1");
  assert.equal(report.exactOracle.AAA.shares, "56/55");
  assert.equal(report.exactOracle.AAA.totalReturn, "3/25");
  assert.equal(report.exactOracle.SPY.ending, "100/1");
});
test("the review binds the exact snapshot, not only the case name", async () => {
  const a = await fixture();
  const b = await fixture(
    spec,
    provider(spec, (s) => s.replace('"c":110', '"c":111')),
  );
  const report = auditCase(
    b.snapshot,
    spec,
    b.candidates,
    reviewed(a.snapshot),
  );
  assert.equal(check(report, "analyst-reference-review"), "unresolved");
  assert.equal(check(report, "independent-calculation"), "unresolved");
});
test("missing and contradictory reviewer evidence fails closed", async () => {
  const { snapshot, candidates } = await fixture();
  const absent = reviewed(snapshot);
  delete absent.evidence.finality;
  assert.equal(
    check(auditCase(snapshot, spec, candidates, absent), "evidence:finality"),
    "unresolved",
  );
  const badDates = reviewed(snapshot);
  badDates.evidence.finality = {
    ...badDates.evidence.finality,
    from: "0",
    through: "zzzz",
  };
  assert.equal(
    check(auditCase(snapshot, spec, candidates, badDates), "evidence:finality"),
    "unresolved",
  );
  const wrongInception = reviewed(snapshot);
  wrongInception.evidence.inception.AAA.firstAvailable = "2024-01-03";
  assert.equal(
    check(
      auditCase(snapshot, spec, candidates, wrongInception),
      "independent-calculation",
    ),
    "failed",
  );
});
test("wrong cash amount, ex-date and missing event are observed failures", async () => {
  for (const transform of [
    (s) => s.replace('"rate":2', '"rate":3'),
    (s) => s.replace('"ex_date":"2024-01-03"', '"ex_date":"2024-01-02"'),
    (s) => s.replace(/"cash_dividends":\[.*?\]/, '"cash_dividends":[]'),
  ]) {
    const { snapshot, candidates } = await fixture(
      spec,
      provider(spec, transform),
    );
    assert.equal(
      check(
        auditCase(snapshot, spec, candidates, reviewed(snapshot)),
        "reference-events",
      ),
      "failed",
    );
  }
});
test("an actual gap in older SPY before a younger asset's entry is a failure", async () => {
  const younger = {
    ...spec,
    firstAvailable: { AAA: "2024-01-03" },
    expectedActions: [],
  };
  const transport = async (url) => {
    const response = await provider(younger)(url),
      body = await response.json();
    if (body.bars) body.bars.SPY.shift();
    return new Response(JSON.stringify(body));
  };
  const { snapshot, candidates } = await fixture(younger, transport);
  assert.equal(
    check(
      auditCase(snapshot, younger, candidates, reviewed(snapshot, younger)),
      "proposed-session-coverage",
    ),
    "failed",
  );
});
test("precision loss in numeric JSON prevents calculation even with supplied assertions", async () => {
  const { snapshot, candidates } = await fixture(
    spec,
    provider(spec, (s) => s.replace('"c":100', '"c":100.00000000000000001')),
  );
  const report = auditCase(snapshot, spec, candidates, reviewed(snapshot));
  assert.equal(check(report, "numeric-fidelity"), "failed");
  assert.equal(check(report, "independent-calculation"), "unresolved");
  assert.equal(
    numericFidelity([{ body: '{"x":1e-7,"s":"9007199254740993"}' }]),
    true,
  );
  assert.equal(numericFidelity([{ body: '{"x":9007199254740993}' }]), false);
});
test("altered hash, query, case, timestamp, URL, page order and unused page are rejected", async () => {
  const { snapshot } = await fixture();
  const mutations = [
    (s) => (s.pages[0].body += " "),
    (s) => (s.query.feed = "iex"),
    (s) => (s.caseHash = "wrong"),
    (s) => (s.capturedAt = "2024-02-30T00:00:00.000Z"),
    (s) => (s.pages[0].url = "https://attacker.invalid/"),
    (s) => s.pages.reverse(),
    (s) => s.pages.push({ ...s.pages[1] }),
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(snapshot);
    mutate(copy);
    await assert.rejects(
      () => replayCase(copy, spec),
      (e) => e.code === "SNAPSHOT_INVALID",
    );
  }
});
test("HTTP errors and secret echoes never enter a snapshot", async () => {
  const recorder = capturingTransport(
    credentials,
    async () => new Response(credentials.secret, { status: 403 }),
  );
  const response = await recorder.transport(
    "https://data.alpaca.markets/v2/stocks/bars",
    {},
  );
  assert.equal(response.status, 403);
  assert.equal(recorder.pages.length, 0);
  await assert.rejects(
    () =>
      captureCase(
        spec,
        "sip",
        credentials,
        async () => new Response(JSON.stringify({ echo: credentials.secret })),
      ),
    (e) => e.code === "SECRET_ECHO",
  );
});
test("received bytes, aggregate bytes, chunks and requests have actual hard limits", async () => {
  let cancelled = false;
  const oversized = capturingTransport(
    credentials,
    async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(LIMITS.pageBytes + 1));
          },
          cancel() {
            cancelled = true;
            return new Promise(() => {});
          },
        }),
      ),
  );
  await assert.rejects(
    () => oversized.transport("https://data.alpaca.markets/v2/stocks/bars", {}),
    (e) => e.code === "LIMIT",
  );
  assert.equal(cancelled, true);
  const body = " ".repeat(LIMITS.pageBytes);
  const aggregate = capturingTransport(
    credentials,
    async () => new Response(body),
  );
  for (let i = 0; i < 4; i++)
    await aggregate.transport("https://data.alpaca.markets/v2/stocks/bars", {});
  await assert.rejects(
    () => aggregate.transport("https://data.alpaca.markets/v2/stocks/bars", {}),
    (e) => e.code === "LIMIT",
  );
  const requests = capturingTransport(
    credentials,
    async () => new Response("{}"),
  );
  for (let i = 0; i < LIMITS.requests; i++)
    await requests.transport("https://data.alpaca.markets/v2/stocks/bars", {});
  await assert.rejects(
    () => requests.transport("https://data.alpaca.markets/v2/stocks/bars", {}),
    (e) => e.code === "LIMIT",
  );
  const chunks = capturingTransport(
    credentials,
    async () =>
      new Response(
        new ReadableStream({
          pull(c) {
            c.enqueue(new Uint8Array(0));
          },
        }),
      ),
  );
  await assert.rejects(
    () => chunks.transport("https://data.alpaca.markets/v2/stocks/bars", {}),
    (e) => e.code === "LIMIT",
  );
});
test(
  "abort cancels a stalled body without waiting for an uncooperative cancel promise",
  { timeout: 2000 },
  async () => {
    let cancelled = false;
    const controller = new AbortController();
    const recorder = capturingTransport(
      credentials,
      async () =>
        new Response(
          new ReadableStream({
            cancel() {
              cancelled = true;
              return new Promise(() => {});
            },
          }),
        ),
    );
    const pending = recorder.transport(
      "https://data.alpaca.markets/v2/stocks/bars",
      { signal: controller.signal },
    );
    setTimeout(() => controller.abort(), 5);
    await assert.rejects(
      () => pending,
      (e) => e.code === "ABORTED",
    );
    assert.equal(cancelled, true);
  },
);
test("CLI capture blocks before a request with a cleared environment", () => {
  const env = Object.fromEntries(
    ["SystemRoot", "WINDIR", "ComSpec", "TEMP", "TMP", "PATH", "USERPROFILE"]
      .filter((k) => process.env[k])
      .map((k) => [k, process.env[k]]),
  );
  const child = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--experimental-strip-types",
      "scripts/validate-alpaca-data.mjs",
      "capture",
      "--case=nyse-holiday",
    ],
    { encoding: "utf8", env },
  );
  assert.equal(child.status, 2);
  assert.match(child.stderr, /Blocked:/);
});
test("real case calendars include holiday, early-close and DST boundaries with review still required", () => {
  assert.deepEqual(getCase("nyse-holiday").sessions, [
    "2024-05-24",
    "2024-05-28",
    "2024-05-29",
  ]);
  assert(getCase("nyse-half-day").sessions.includes("2024-11-29"));
  assert.deepEqual(getCase("nyse-dst").sessions, ["2024-03-08", "2024-03-11"]);
  assert.equal(getCase("rddt-inception").firstAvailable.RDDT, "2024-03-21");
});
test("CLI replays private synthetic bytes offline and writes an ACL-protected local unresolved report", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "tikr-validation-test-"));
  let output;
  try {
    const caseSpec = getCase("nyse-holiday"),
      { snapshot } = await fixture(caseSpec);
    const input = path.join(temp, "snapshot.json");
    await writeFile(input, JSON.stringify(snapshot));
    const child = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--experimental-strip-types",
        "scripts/validate-alpaca-data.mjs",
        "replay",
        "--case=nyse-holiday",
        `--snapshot=${input}`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(child.status, 2, child.stderr);
    const summary = JSON.parse(child.stdout);
    output = summary.output;
    const report = JSON.parse(
      await readFile(path.join(output, "report.json"), "utf8"),
    );
    assert.equal(report.status, "unresolved");
    const root = await realpath(
      path.join(process.env.LOCALAPPDATA, "Tikr", "alpaca-validation"),
    );
    assert.equal(path.dirname(await realpath(output)), root);
    assert(!output.toLowerCase().includes("onedrive"));
    assert(!output.startsWith(path.resolve(".")));
    const inspect = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `
      $a = Get-Acl -LiteralPath $env:TIKR_TEST_OUTPUT
      $sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
      $r = @($a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]))
      if (-not $a.AreAccessRulesProtected -or $a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value -ne $sid -or $r.Count -ne 2) { exit 1 }
      foreach ($x in $r) { if ($x.IsInherited -or $x.IdentityReference.Value -notin @($sid,'S-1-5-18') -or $x.AccessControlType -ne 'Allow' -or $x.FileSystemRights -ne 'FullControl') { exit 2 } }
      $f = Get-Acl -LiteralPath (Join-Path $env:TIKR_TEST_OUTPUT 'report.json')
      foreach ($x in $f.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier])) { if ($x.IdentityReference.Value -notin @($sid,'S-1-5-18')) { exit 3 } }
    `,
      ],
      {
        encoding: "utf8",
        env: { SystemRoot: process.env.SystemRoot, TIKR_TEST_OUTPUT: output },
      },
    );
    assert.equal(inspect.status, 0, inspect.stderr);
    await rm(output, { recursive: true });
    output = undefined;
  } finally {
    if (output) console.error("Preserved generated report for diagnosis");
    assert(path.basename(temp).startsWith("tikr-validation-test-"));
    await rm(temp, { recursive: true });
  }
});

test("independent prices distinguish missing references, feed mismatch and real discrepancies", async () => {
  const { snapshot, candidates } = await fixture();
  const missing = reviewed(snapshot);
  delete missing.comparisonPrices.AAA;
  assert.equal(
    check(
      auditCase(snapshot, spec, candidates, missing),
      "independent-price-references",
    ),
    "unresolved",
  );
  const mismatch = reviewed(snapshot);
  mismatch.comparisonPrices.AAA[spec.start].price = "99";
  const report = auditCase(snapshot, spec, candidates, mismatch);
  assert.equal(check(report, "independent-price-references"), "failed");
  assert.equal(report.priceReferences.differences[0].expected, "99");
  const sameProvider = reviewed(snapshot);
  sameProvider.comparisonPrices.AAA[spec.start].source =
    "https://data.alpaca.markets/v2/stocks/bars";
  assert.equal(
    check(
      auditCase(snapshot, spec, candidates, sameProvider),
      "independent-price-references",
    ),
    "unresolved",
  );
  const wrongFeed = reviewed(snapshot);
  wrongFeed.comparisonPrices.AAA[spec.start].feed = "iex";
  assert.equal(
    check(
      auditCase(snapshot, spec, candidates, wrongFeed),
      "independent-price-references",
    ),
    "unresolved",
  );
});
test("snapshot byte and request counters are validated against actual pages", async () => {
  const { snapshot } = await fixture();
  for (const field of ["requests", "totalBytes"]) {
    const changed = structuredClone(snapshot);
    changed.stats[field]++;
    await assert.rejects(
      () => replayCase(changed, spec),
      (e) => e.code === "SNAPSHOT_INVALID",
    );
  }
});

test("private output rejects a known cloud root before creating files", async () => {
  const { privateDirectory } =
    await import("../scripts/lib/alpaca-private-storage.mjs");
  const previous = process.env.OneDrive;
  try {
    process.env.OneDrive = process.env.LOCALAPPDATA;
    await assert.rejects(privateDirectory, /Cloud-synced output rejected/);
  } finally {
    if (previous === undefined) delete process.env.OneDrive;
    else process.env.OneDrive = previous;
  }
});

test("capture requires explicit local storage acknowledgment before any request", () => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([k]) =>
      [
        "SYSTEMROOT",
        "WINDIR",
        "COMSPEC",
        "TEMP",
        "TMP",
        "PATH",
        "USERPROFILE",
      ].includes(k.toUpperCase()),
    ),
  );
  Object.assign(env, {
    ALPACA_PRIVATE_VALIDATION: "explicit",
    ALPACA_KEY_ID: "synthetic",
    ALPACA_SECRET_KEY: "synthetic",
    ALPACA_FEED: "sip",
  });
  const child = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--experimental-strip-types",
      "scripts/validate-alpaca-data.mjs",
      "capture",
      "--case=nyse-holiday",
    ],
    { encoding: "utf8", env },
  );
  assert.equal(child.status, 2);
  assert.match(child.stderr, /storage acknowledgment/);
});
