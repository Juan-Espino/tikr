import { createHash } from "node:crypto";
import {
  fetchCandidates,
  toEngineInput,
} from "../../src/lib/alpaca/adapter.ts";
import { backtest } from "../../src/lib/backtest.ts";
import {
  decimal,
  exact,
  closeEnough,
  minus,
  holdingOracle,
} from "./alpaca-oracle.mjs";

export const sha256 = (body) => createHash("sha256").update(body).digest("hex");
export const caseHash = (spec) => sha256(JSON.stringify(spec));
export const snapshotHash = (snapshot) => sha256(JSON.stringify(snapshot));
const isoTime = (value) =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const calendarDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export const LIMITS = Object.freeze({
  requests: 12,
  pageBytes: 2 * 1024 * 1024,
  totalBytes: 8 * 1024 * 1024,
  chunks: 16384,
});
function stop(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}
function safeUrl(value) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.host !== "data.alpaca.markets" ||
    u.username ||
    u.password ||
    !["/v2/stocks/bars", "/v1/corporate-actions"].includes(u.pathname) ||
    value.length > 8000
  )
    stop("SNAPSHOT_INVALID");
  return u.href;
}
function readChunk(reader, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal?.removeEventListener("abort", abort);
      void reader.cancel().catch(() => {});
      const error = new Error("ABORTED");
      error.code = "ABORTED";
      reject(error);
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    reader.read().then(
      (value) => {
        signal?.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal?.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}
// This bounded transport preserves the original JSON bytes before JSON.parse.
// Credentials stay only in the existing adapter's request headers.
export function capturingTransport(credentials, transport = fetch) {
  const pages = [];
  let totalBytes = 0,
    requests = 0;
  return {
    pages,
    stats: () => ({ requests, totalBytes }),
    transport: async (url, options) => {
      safeUrl(String(url));
      if (++requests > LIMITS.requests) stop("LIMIT");
      const response = await transport(url, options);
      if (response.status !== 200) {
        void response.body?.cancel().catch(() => {});
        return new Response(null, { status: response.status });
      }
      if (!response.body) stop("SNAPSHOT_INVALID");
      const reader = response.body.getReader();
      const chunks = [];
      let bytes = 0,
        complete = false;
      try {
        while (true) {
          const { done, value } = await readChunk(reader, options?.signal);
          if (done) {
            complete = true;
            break;
          }
          bytes += value.byteLength;
          totalBytes += value.byteLength;
          if (
            bytes > LIMITS.pageBytes ||
            totalBytes > LIMITS.totalBytes ||
            chunks.length >= LIMITS.chunks
          )
            stop("LIMIT");
          chunks.push(value);
        }
      } finally {
        if (!complete) void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      const raw = Buffer.concat(chunks, bytes);
      const body = new TextDecoder("utf-8", { fatal: true }).decode(raw);
      if (!Buffer.from(body).equals(raw)) stop("SNAPSHOT_INVALID");
      if (
        [credentials.keyId, credentials.secret].some(
          (secret) => secret && body.includes(secret),
        )
      )
        stop("SECRET_ECHO");
      pages.push({
        url: safeUrl(String(url)),
        status: 200,
        body,
        bytes,
        sha256: sha256(raw),
      });
      return new Response(raw, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  };
}
export async function captureCase(spec, feed, credentials, transport) {
  if (!["sip", "iex"].includes(feed)) stop("CONFIG");
  const recorder = capturingTransport(credentials, transport);
  const query = {
    symbols: spec.symbols,
    start: spec.start,
    end: spec.end,
    feed,
  };
  let transportFailure;
  const transportWithFailure = async (...args) => {
    try {
      return await recorder.transport(...args);
    } catch (error) {
      if (
        ["LIMIT", "ABORTED", "SECRET_ECHO", "SNAPSHOT_INVALID"].includes(
          error.code,
        )
      )
        transportFailure = error.code;
      throw error;
    }
  };
  try {
    await fetchCandidates(
      {
        ...credentials,
        transport: transportWithFailure,
        retries: 0,
        maxPages: 6,
        maxTotalBytes: LIMITS.totalBytes,
      },
      query,
    );
  } catch (error) {
    if (transportFailure) stop(transportFailure);
    throw error;
  }
  return {
    version: 1,
    caseId: spec.id,
    caseHash: caseHash(spec),
    capturedAt: new Date().toISOString(),
    query,
    pages: recorder.pages,
    stats: recorder.stats(),
  };
}
export function validateSnapshot(snapshot, spec) {
  if (
    snapshot?.version !== 1 ||
    snapshot.caseId !== spec.id ||
    snapshot.caseHash !== caseHash(spec) ||
    !isoTime(snapshot.capturedAt) ||
    snapshot.capturedAt > new Date().toISOString() ||
    !["sip", "iex"].includes(snapshot.query?.feed) ||
    JSON.stringify(snapshot.query?.symbols) !== JSON.stringify(spec.symbols) ||
    snapshot.query.start !== spec.start ||
    snapshot.query.end !== spec.end ||
    !Array.isArray(snapshot.pages) ||
    snapshot.pages.length < 2 ||
    snapshot.pages.length > LIMITS.requests
  )
    stop("SNAPSHOT_INVALID");
  let total = 0;
  for (const page of snapshot.pages) {
    safeUrl(page.url);
    if (page.status !== 200 || typeof page.body !== "string")
      stop("SNAPSHOT_INVALID");
    const bytes = Buffer.byteLength(page.body);
    total += bytes;
    if (
      bytes !== page.bytes ||
      bytes > LIMITS.pageBytes ||
      total > LIMITS.totalBytes ||
      sha256(page.body) !== page.sha256
    )
      stop("SNAPSHOT_INVALID");
  }
  if (
    snapshot.stats?.requests !== snapshot.pages.length ||
    snapshot.stats?.totalBytes !== total
  )
    stop("SNAPSHOT_INVALID");
  return snapshot;
}
export async function replayCase(snapshot, spec) {
  validateSnapshot(snapshot, spec);
  let index = 0,
    mismatch = false;
  let candidates;
  try {
    candidates = await fetchCandidates(
      {
        keyId: "offline-replay-key",
        secret: "offline-replay-secret",
        retries: 0,
        maxPages: 6,
        transport: async (url) => {
          const page = snapshot.pages[index++];
          if (!page || safeUrl(String(url)) !== page.url) {
            mismatch = true;
            stop("SNAPSHOT_INVALID");
          }
          return new Response(page.body, { status: 200 });
        },
      },
      snapshot.query,
    );
  } catch (error) {
    if (mismatch) stop("SNAPSHOT_INVALID");
    throw error;
  }
  if (index !== snapshot.pages.length) stop("SNAPSHOT_INVALID");
  return candidates;
}
// Compare the exact lexical JSON number with the decimal produced by Number.
// Quoted strings (including escaped quotes) are skipped as complete tokens.
export function numericFidelity(pages) {
  for (const page of pages) {
    const tokens = page.body.matchAll(
      /"(?:\\.|[^"\\])*"|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    );
    for (const token of tokens) {
      if (!token[1]) continue;
      const lexical = token[1];
      const value = Number(lexical);
      if (!Number.isFinite(value)) return false;
      // Use decimal expansion via exact exponent arithmetic, independent of Number.
      const expand = (text) => {
        const [mantissa, exponent = "0"] = text.toLowerCase().split("e");
        const shift = Number(exponent);
        if (
          !Number.isInteger(shift) ||
          Math.abs(shift) > 1000 ||
          mantissa.length > 1000
        )
          stop("NUMERIC_LIMIT");
        const parts = mantissa.split(".");
        let digits = parts.join("");
        const places = (parts[1]?.length ?? 0) - shift;
        if (places < 0) digits += "0".repeat(-places);
        else if (places > 0) {
          const negative = digits.startsWith("-");
          if (negative) digits = digits.slice(1);
          digits = digits.padStart(places + 1, "0");
          digits = digits.slice(0, -places) + "." + digits.slice(-places);
          if (negative) digits = "-" + digits;
        }
        return decimal(digits);
      };
      if (exact(expand(lexical)) !== exact(expand(String(value)))) return false;
    }
  }
  return true;
}
function proofValid(proof, spec) {
  return (
    proof?.status === "verified" &&
    typeof proof.source === "string" &&
    proof.source.trim().length > 0 &&
    typeof proof.method === "string" &&
    proof.method.trim().length > 0 &&
    calendarDate(proof.from) &&
    calendarDate(proof.through) &&
    proof.from <= spec.start &&
    proof.through >= spec.end
  );
}
function independentPrices(snapshot, spec, candidates, review) {
  let missing = 0,
    checked = 0;
  const differences = [];
  for (const symbol of spec.symbols) {
    for (const [day, actual] of Object.entries(
      candidates.prices[symbol] ?? {},
    )) {
      const reference = review?.comparisonPrices?.[symbol]?.[day];
      let independent = false;
      try {
        const source = new URL(reference?.source);
        independent =
          source.protocol === "https:" &&
          !source.username &&
          !source.password &&
          source.hostname !== "alpaca.markets" &&
          !source.hostname.endsWith(".alpaca.markets");
      } catch {
        /* Missing source remains unresolved. */
      }
      if (
        !independent ||
        reference.feed !== snapshot.query.feed ||
        reference.basis !== "raw-matching-feed-close" ||
        !isoTime(reference.checkedAt) ||
        Date.parse(reference.checkedAt) > Date.now()
      ) {
        missing++;
        continue;
      }
      try {
        const expected = decimal(reference.price);
        if (expected.n <= 0n) throw new Error("Invalid reference price");
        checked++;
        if (exact(expected) !== exact(decimal(actual)))
          differences.push({
            symbol,
            date: day,
            expected: reference.price,
            actual,
          });
      } catch {
        missing++;
      }
    }
  }
  return {
    status: differences.length
      ? "failed"
      : missing || !checked
        ? "unresolved"
        : "passed",
    checked,
    missing,
    differences,
  };
}
export function auditCase(snapshot, spec, candidates, review) {
  const checks = [];
  const add = (id, status, detail) => checks.push({ id, status, detail });
  add(
    "numeric-fidelity",
    numericFidelity(snapshot.pages) ? "passed" : "failed",
    "Exact JSON numeric tokens compared with the adapter's Number representation.",
  );
  let coverage = true;
  for (const symbol of spec.symbols) {
    const first = spec.firstAvailable?.[symbol] ?? spec.start;
    const expected = spec.sessions.filter((day) => day >= first);
    const observed = Object.keys(candidates.prices[symbol] ?? {}).sort();
    if (JSON.stringify(expected) !== JSON.stringify(observed)) coverage = false;
  }
  add(
    "proposed-session-coverage",
    coverage ? "passed" : "failed",
    "Observed dates must match the independently proposed case sessions, including every older holding before a shared younger start. Calendar verification remains separate.",
  );
  let actionsMatch = true;
  for (const expected of spec.expectedActions) {
    const matches = candidates.actions.filter(
      (a) =>
        a.symbol === expected.symbol &&
        a.kind === expected.kind &&
        a.date === expected.date,
    );
    const match = matches[0];
    if (
      matches.length !== 1 ||
      Object.entries(expected).some(
        ([key, value]) =>
          !["symbol", "kind", "date"].includes(key) &&
          (["amount", "numerator", "denominator"].includes(key)
            ? !match?.[key] ||
              exact(decimal(String(match[key]))) !== exact(decimal(value))
            : String(match?.[key]) !== value),
      )
    )
      actionsMatch = false;
  }
  add(
    "reference-events",
    actionsMatch ? "passed" : "failed",
    "Required case dates, cash amounts and split units must match the reference facts; missing process-date samples remain unsuitable for this case.",
  );
  const covered = candidates.actions.every((action) =>
    spec.expectedActions.some(
      (expected) =>
        action.symbol === expected.symbol &&
        action.kind === expected.kind &&
        action.date === expected.date,
    ),
  );
  add(
    "bounded-action-scope",
    covered ? "passed" : "unresolved",
    "Every observed action must be covered by this bounded oracle; extra/out-of-period events require investigation.",
  );
  const priceReferences = independentPrices(snapshot, spec, candidates, review);
  add(
    "independent-price-references",
    priceReferences.status,
    "Every observed close needs a matching-feed/raw-basis independent price record. Missing/basis-mismatched sources are unresolved; exact price discrepancies fail the sample.",
  );
  const record = review?.review;
  const reviewed =
    record?.caseHash === caseHash(spec) &&
    record?.snapshotHash === snapshotHash(snapshot) &&
    typeof record.reviewer === "string" &&
    record.reviewer.trim() &&
    isoTime(record.reviewedAt) &&
    Date.parse(record.reviewedAt) <= Date.now() &&
    Array.isArray(record.sources) &&
    spec.references.every((url) => record.sources.includes(url));
  add(
    "analyst-reference-review",
    reviewed ? "passed" : "unresolved",
    "Case facts and proposed sessions require a dated independent review. Supplied records are reviewer attestations, not authenticated issuer proof.",
  );
  const evidence = review?.evidence;
  const required = [
    ["calendar", evidence?.calendar],
    ["finality", evidence?.finality],
  ];
  for (const symbol of spec.symbols) {
    for (const category of ["actions", "inception", "prices", "access"])
      required.push([`${category}:${symbol}`, evidence?.[category]?.[symbol]]);
    if (
      spec.expectedActions.some(
        (a) => a.symbol === symbol && a.kind === "cash_dividends",
      )
    )
      required.push([
        `dividendUnits:${symbol}`,
        evidence?.dividendUnits?.[symbol],
      ]);
  }
  for (const [key, proof] of required)
    add(
      `evidence:${key}`,
      proofValid(proof, spec) ? "passed" : "unresolved",
      "Needs independently assessed coverage, source and verification method. Traversal alone cannot establish completeness or finality.",
    );
  let result, oracle;
  if (checks.every((c) => c.status === "passed")) {
    try {
      const input = toEngineInput(
        candidates,
        spec.sessions,
        evidence,
        [{ id: "case", holdings: [{ symbol: spec.holding, weight: "100" }] }],
        spec.amount,
      );
      result = backtest(input);
      const first = spec.sessions.find((day) =>
        input.assets.every((a) => day >= a.firstAvailable),
      );
      const sessions = spec.sessions.filter((day) => day >= first);
      oracle = Object.fromEntries(
        [spec.holding, "SPY"].map((symbol) => [
          symbol,
          holdingOracle(
            symbol,
            candidates.prices[symbol],
            sessions,
            spec.amount,
            spec.expectedActions,
          ),
        ]),
      );
      const compareResult = (actual, expected) =>
        actual.points.length === expected.points.length &&
        actual.points.every(
          (point, i) =>
            point.date === expected.points[i].date &&
            closeEnough(point.value, expected.points[i].value) &&
            closeEnough(point.receivable, expected.points[i].receivable),
        ) &&
        ["ending", "totalReturn", "drawdown"].every((key) =>
          closeEnough(actual[key], expected[key]),
        );
      const matches =
        compareResult(result.portfolios[0], oracle[spec.holding]) &&
        compareResult(result.benchmark, oracle.SPY) &&
        closeEnough(
          result.portfolios[0].shares[spec.holding],
          oracle[spec.holding].shares,
        ) &&
        closeEnough(result.benchmark.shares.SPY, oracle.SPY.shares) &&
        closeEnough(
          result.portfolios[0].benchmarkDifference,
          minus(oracle[spec.holding].totalReturn, oracle.SPY.totalReturn),
        );
      add(
        "independent-calculation",
        matches ? "passed" : "failed",
        "Daily values/receivables, final shares, total return, signed drawdown and SPY difference compared with exact fractions. Tolerance is 1e-30 absolute plus 1e-32 relative for these bounded cases.",
      );
    } catch {
      add(
        "independent-calculation",
        "failed",
        "Engine conversion, supported-case oracle or calculation rejected the input.",
      );
    }
  } else
    add(
      "independent-calculation",
      "unresolved",
      "Engine execution withheld until the preceding evidence and observation checks pass.",
    );
  const status = checks.some((c) => c.status === "failed")
    ? "failed"
    : checks.some((c) => c.status === "unresolved")
      ? "unresolved"
      : "passed";
  return {
    version: 1,
    caseId: spec.id,
    caseHash: caseHash(spec),
    snapshotHash: snapshotHash(snapshot),
    capturedAt: snapshot.capturedAt,
    feed: snapshot.query.feed,
    status,
    scope:
      "This bounded sample and supplied reviewer attestations only; no universal/provider completeness certification.",
    checks,
    referenceSources: spec.references,
    priceReferences,
    actualPeriod: result?.actual,
    observations: {
      bars: Object.fromEntries(
        spec.symbols.map((s) => [s, Object.keys(candidates.prices[s]).length]),
      ),
      actions: candidates.actions.length,
    },
    dailyComparison:
      oracle &&
      result &&
      Object.entries(oracle).flatMap(([symbol, expected]) => {
        const actual =
          symbol === "SPY" ? result.benchmark : result.portfolios[0];
        return expected.points.map((point, index) => ({
          symbol,
          date: point.date,
          expectedValue: exact(point.value),
          actualValue: actual.points[index]?.value,
          expectedReceivable: exact(point.receivable),
          actualReceivable: actual.points[index]?.receivable,
          expectedShares: exact(point.shares),
        }));
      }),
    exactOracle:
      oracle &&
      Object.fromEntries(
        Object.entries(oracle).map(([s, o]) => [
          s,
          {
            ending: exact(o.ending),
            totalReturn: exact(o.totalReturn),
            drawdown: exact(o.drawdown),
            shares: exact(o.shares),
          },
        ]),
      ),
  };
}
