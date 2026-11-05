import "server-only";
import {
  createOnDemandBacktests,
  eligibleSessions,
  freshnessCycle,
} from "./market-cache.ts";
import type {
  BacktestRequest,
  CacheOptions,
  CacheView,
} from "./market-cache.ts";
import { backtest, preset } from "./backtest.ts";
import type { Asset, Calendar, Preset } from "./backtest.ts";
import { chunks, readValue, revision } from "./market-storage.ts";
import type { MarketStorage, Stored } from "./market-storage.ts";
const revokedStores = new WeakSet<MarketStorage>();
type AssetHead = {
  format: "monthly-v2";
  meta: Omit<Asset, "prices" | "actions">;
  prices: string[];
  pendingSession?: string;
  evidenceRevision?: string;
};
type Saved = {
  identity: string;
  view: CacheView;
  cycle: string;
  calendar: string;
  validUntil: number;
};
function validateAsset(a: Asset, c: Calendar, from: string, through: string) {
  const day = (s: string) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  const positive = (s: string) =>
    typeof s === "string" &&
    /^\d{1,18}(\.\d{1,18})?$/.test(s) &&
    /[1-9]/.test(s);
  if (
    !a.provenance ||
    !day(a.firstAvailable) ||
    !day(a.from) ||
    !day(a.through) ||
    a.from > from ||
    a.through < through ||
    !a.prices ||
    Object.keys(a.prices).length > 1300 ||
    !Array.isArray(a.actions) ||
    a.actions.length > 1000
  )
    throw new Error("UNVERIFIED_DATA");
  const sessions = c.sessions.filter((d) => d >= from && d <= through);
  for (const [d, p] of Object.entries(a.prices))
    if (
      !day(d) ||
      d < a.firstAvailable ||
      d < from ||
      d > through ||
      !sessions.includes(d) ||
      !positive(p)
    )
      throw new Error("UNVERIFIED_DATA");
  for (const d of sessions)
    if (d >= a.firstAvailable && !Object.hasOwn(a.prices, d))
      throw new Error("MISSING_PRICE");
  const ids = new Set<string>();
  for (const e of a.actions) {
    if (
      !e.id ||
      e.id.length > 128 ||
      ids.has(e.id) ||
      !sessions.includes(e.date)
    )
      throw new Error("UNVERIFIED_DATA");
    ids.add(e.id);
    if (e.type === "split") {
      if (!positive(e.numerator) || !positive(e.denominator))
        throw new Error("UNVERIFIED_DATA");
    } else if (e.type === "dividend") {
      if (
        e.basis !== "postSplit" ||
        !positive(e.amount) ||
        !day(e.paymentDate) ||
        e.paymentDate < e.date
      )
        throw new Error("UNVERIFIED_DATA");
    } else throw new Error("UNSUPPORTED_ACTION");
  }
}
export function assetRecords(
  asset: Asset,
  pendingSession?: string,
  evidenceRevision?: string,
) {
  asset = {
    ...asset,
    actions: [...asset.actions].sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    ),
  };
  const { prices, actions, ...meta } = asset;
  const months = new Map<
    string,
    { prices: Record<string, string>; actions: Asset["actions"] }
  >();
  const month = (key: string) => {
    let value = months.get(key);
    if (!value) {
      value = { prices: {}, actions: [] };
      months.set(key, value);
    }
    return value;
  };
  for (const [day, price] of Object.entries(prices))
    month(day.slice(0, 7)).prices[day] = price;
  for (const action of actions)
    month(action.date.slice(0, 7)).actions.push(action);
  if (months.size > 65) throw new Error("HISTORY_LIMIT");
  const entries: Omit<Stored, "checkedAt">[] = [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      key: `price:${asset.symbol}:${month}`,
      payload: JSON.stringify(value),
      revision: revision(value),
      dependencies: [],
    }));
  const head: AssetHead = {
    format: "monthly-v2",
    meta,
    ...(pendingSession ? { pendingSession } : {}),
    ...(evidenceRevision ? { evidenceRevision } : {}),
    prices: entries.map((e) => e.key),
  };
  entries.push({
    key: `asset:${asset.symbol}`,
    payload: JSON.stringify(head),
    revision: revision({ asset, pendingSession, evidenceRevision }),
    dependencies: [],
  });
  return entries;
}
async function loadAsset(store: MarketStorage, head: Stored): Promise<Asset> {
  const data = JSON.parse(head.payload) as AssetHead;
  if (
    data.format !== "monthly-v2" ||
    !Array.isArray(data.prices) ||
    data.prices.length > 65 ||
    new Set(data.prices).size !== data.prices.length ||
    data.prices.some((k) => !k.startsWith(`price:${data.meta.symbol}:`))
  )
    throw new Error("INVALID_MANIFEST");
  const rows = await store.read(data.prices);
  const prices: Record<string, string> = {},
    actions: Asset["actions"] = [];
  for (const key of data.prices) {
    const row = rows.find((r) => r.key === key);
    if (!row) throw new Error("REVISION_CHANGED");
    const value = JSON.parse(row.payload) as {
      prices: Record<string, string>;
      actions: Asset["actions"];
    };
    if (revision(value) !== row.revision) throw new Error("REVISION_CHANGED");
    Object.assign(prices, value.prices);
    actions.push(...value.actions);
  }
  actions.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const asset = { ...data.meta, prices, actions };
  if (
    revision({
      asset,
      pendingSession: data.pendingSession,
      evidenceRevision: data.evidenceRevision,
    }) !== head.revision
  )
    throw new Error("REVISION_CHANGED");
  return asset;
}

export function createDurableBacktests(options: {
  storage: MarketStorage;
  calendar: () => Calendar;
  load: CacheOptions["load"];
  supportedSymbols: string[];
  historyStart: string;
  clock?: () => Date;
  evidenceRevision?: string;
  evidenceValidUntil: () => number;
}) {
  const assertEvidence = () => {
    const until = options.evidenceValidUntil();
    if (
      !Number.isFinite(until) ||
      until <= (options.clock ?? (() => new Date()))().valueOf()
    )
      throw new Error("EVIDENCE_EXPIRED");
    return until;
  };
  const { storage } = options,
    clock = options.clock ?? (() => new Date());
  const run = async (
    request: Omit<BacktestRequest, "start" | "end">,
    range: Preset,
    retry = false,
  ): Promise<{ initial: CacheView; settled: Promise<CacheView> }> => {
    const symbols = [
      ...new Set([
        "SPY",
        ...request.portfolios.flatMap((p) => p.holdings.map((h) => h.symbol)),
      ]),
    ].sort();
    await storage.assertReadable(symbols);
    if (revokedStores.has(storage)) throw new Error("EVIDENCE_REVOKED");
    assertEvidence();
    const now = clock(),
      cycle = freshnessCycle(now),
      full = options.calendar();
    const sessions = eligibleSessions(full.sessions, now);
    if (
      full.complete !== true ||
      full.finalityVerified !== true ||
      !full.provenance ||
      sessions.length > 1300
    )
      throw new Error("CALENDAR_UNAVAILABLE");
    const calendarRevision = (end: string) =>
      revision({
        ...full,
        through: end,
        sessions: full.sessions.filter((s) => s <= end),
      });
    const period = preset({ ...full, sessions }, range);
    const req = { ...request, ...period, end: "latest" };
    const identity = revision({
      request,
      range,
      evidenceRevision: options.evidenceRevision,
      policy: "raw-sip-payment-close-0900-monthly-v2",
    });
    const resultKey = `result:slot${parseInt(identity.slice(0, 4), 16) % 16}`;
    if (
      symbols.length > 50 ||
      symbols.some((s) => !options.supportedSymbols.includes(s))
    )
      throw new Error("INVALID_INPUT");
    const heads = await storage.read([
      resultKey,
      ...symbols.map((s) => `asset:${s}`),
    ]);
    const headMap = new Map(heads.map((h) => [h.key, h]));
    const savedHead = headMap.get(resultKey);
    let saved: Saved | undefined;
    if (
      savedHead?.dependencies.every(
        (d) => headMap.get(d.key)?.revision === d.revision,
      )
    ) {
      try {
        const candidate = await readValue<Saved>(storage, savedHead);
        if (
          candidate.validUntil > clock().valueOf() &&
          candidate.identity === identity &&
          candidate.calendar ===
            calendarRevision(candidate.view.result?.actual.end ?? "")
        )
          saved = candidate;
      } catch {
        /* Missing/revised chunks cannot become a stale fallback. */
      }
    }
    await storage.assertReadable(symbols);
    if (revokedStores.has(storage)) throw new Error("EVIDENCE_REVOKED");
    assertEvidence();
    if (saved?.cycle === cycle && !retry)
      return { initial: saved.view, settled: Promise.resolve(saved.view) };
    const initial: CacheView = saved?.view.result
      ? { ...saved.view, requested: period, status: "refreshing" }
      : { status: "refreshing", requested: period };
    const settle = async (): Promise<CacheView> => {
      let knownCorrection = false;
      const loadedHeads = new Map<string, Stored>();
      const loadedAssets = new Map<string, Asset>();

      const core = createOnDemandBacktests({
        ...options,
        clock,
        calendar: () => full,
        load: async (q) => {
          const key = `asset:${q.symbol}`;
          const old = headMap.get(key);
          if (
            old &&
            freshnessCycle(new Date(old.checkedAt)) === cycle &&
            !retry &&
            !old.payload.includes('"invalidated":true') &&
            (JSON.parse(old.payload) as AssetHead).evidenceRevision ===
              options.evidenceRevision &&
            (JSON.parse(old.payload) as AssetHead).format === "monthly-v2"
          ) {
            loadedHeads.set(key, old);
            const asset = await loadAsset(storage, old);
            loadedAssets.set(q.symbol, asset);
            return {
              feed: "sip",
              asset,
              pendingSession: (JSON.parse(old.payload) as AssetHead)
                .pendingSession,
            };
          }
          const token = await storage.acquire(key, cycle, retry);
          if (!token) {
            let current: Stored | undefined;
            for (let i = 0; i < 3; i++) {
              current = (await storage.read([key]))[0];
              if (
                current &&
                freshnessCycle(new Date(current.checkedAt)) === cycle &&
                !current.payload.includes('"invalidated":true') &&
                (JSON.parse(current.payload) as AssetHead).evidenceRevision ===
                  options.evidenceRevision
              )
                break;
              await new Promise((resolve) => setTimeout(resolve, 400));
            }
            if (
              current &&
              freshnessCycle(new Date(current.checkedAt)) === cycle &&
              !current.payload.includes('"invalidated":true') &&
              (JSON.parse(current.payload) as AssetHead).evidenceRevision ===
                options.evidenceRevision
            ) {
              loadedHeads.set(key, current);
              const asset = await loadAsset(storage, current);
              loadedAssets.set(q.symbol, asset);
              return {
                feed: "sip",
                asset,
                pendingSession: (JSON.parse(current.payload) as AssetHead)
                  .pendingSession,
              };
            }
            throw new Error("REFRESH_BUSY_OR_LIMITED");
          }
          const finishGuard = await storage.beginRefresh(q.symbol);
          let received = false,
            safeToRelease = false;
          try {
            const previous = old
              ? await loadAsset(storage, old).catch(() => undefined)
              : undefined;
            const refreshed = await options.load({ ...q, previous });
            received = true;
            const asset = refreshed.asset;
            if (
              refreshed.feed !== "sip" ||
              asset.symbol !== q.symbol ||
              asset.complete !== true ||
              asset.inceptionVerified !== true ||
              asset.pricesComplete !== true ||
              asset.actionsComplete !== true ||
              asset.accessComplete !== true ||
              asset.priceBasis !== "raw"
            )
              throw new Error("UNVERIFIED_DATA");
            const previousSession = full.sessions
              .filter((s) => s < q.through)
              .at(-1);
            if (
              refreshed.pendingSession &&
              (refreshed.pendingSession !== q.through ||
                asset.through !== previousSession)
            )
              throw new Error("UNVERIFIED_DATA");
            validateAsset(
              asset,
              full,
              q.from,
              refreshed.pendingSession ? asset.through : q.through,
            );
            const records = assetRecords(
              asset,
              refreshed.pendingSession,
              options.evidenceRevision,
            );
            const existing = await storage.read(records.map((r) => r.key));
            const changed = records.filter(
              (r) =>
                r.key === key ||
                existing.find((e) => e.key === r.key)?.revision !== r.revision,
            );
            await storage.write(key, token, changed);
            loadedHeads.set(key, {
              ...records.at(-1)!,
              checkedAt: clock().valueOf(),
            });
            loadedAssets.set(q.symbol, asset);
            safeToRelease = true;
            return refreshed;
          } catch (error) {
            if (
              old &&
              error instanceof Error &&
              "code" in error &&
              error.code === "EVIDENCE_CHANGED"
            ) {
              knownCorrection = true;
              revokedStores.add(storage);
              await storage.revoke();
              const payload = JSON.stringify({
                invalidated: true,
                reason: "EVIDENCE_CHANGED",
              });
              await storage.write(key, token, [
                {
                  key,
                  payload,
                  revision: revision({ invalidated: old.revision, cycle }),
                  dependencies: [],
                },
              ]);
            }
            if (!received && !knownCorrection) safeToRelease = true;
            throw error;
          } finally {
            if (safeToRelease) await finishGuard();
            await storage.release(key, token).catch(() => undefined);
          }
        },
      });
      const opened = core.open(req);
      let view = await opened.settled;
      if (view.result && view.result.actual.end < period.end) {
        const anchored = preset(
          {
            ...full,
            sessions: sessions.filter((s) => s <= view.result!.actual.end),
          },
          range,
        );
        view = await core.open({ ...req, start: anchored.start }).settled;
      }
      assertEvidence();
      if (knownCorrection || revokedStores.has(storage))
        return {
          status: "blocked",
          requested: period,
          code: "UNVERIFIED_DATA",
        };
      if (!view.result) {
        const current = await storage.read(symbols.map((s) => `asset:${s}`));
        if (
          saved?.view.result &&
          saved.validUntil > clock().valueOf() &&
          savedHead?.dependencies.every(
            (d) =>
              current.find((h) => h.key === d.key)?.revision === d.revision,
          )
        )
          return {
            ...saved.view,
            requested: period,
            status: "stale",
            code: view.code ?? "REFRESH_FAILED",
          };
        return view;
      }
      const current = await storage.read(symbols.map((s) => `asset:${s}`));
      if (
        current.length !== symbols.length ||
        current.some((h) => loadedHeads.get(h.key)?.revision !== h.revision)
      )
        return {
          status: "blocked",
          requested: period,
          code: "UNVERIFIED_DATA",
        };
      view.assetReturns = Object.fromEntries(
        symbols.map((symbol) => {
          const result = backtest({
            calendar: full,
            assets: [...loadedAssets.values()],
            portfolios: [
              { id: "asset-return", holdings: [{ symbol, weight: "100" }] },
            ],
            amount: "100",
            start: view.result!.actual.start,
            end: view.result!.actual.end,
          });
          return [symbol, result.portfolios[0]!.totalReturn];
        }),
      );
      const token = await storage.acquire(`job:${resultKey}`, cycle, retry);
      if (token) {
        try {
          const value: Saved = {
            identity,
            view,
            cycle,
            calendar: calendarRevision(view.result.actual.end),
            validUntil: assertEvidence(),
          };
          const dependencies = current.map(({ key, revision }) => ({
            key,
            revision,
          }));
          await storage.write(
            `job:${resultKey}`,
            token,
            chunks(resultKey, value, dependencies),
          );
        } finally {
          await storage
            .release(`job:${resultKey}`, token)
            .catch(() => undefined);
        }
      }
      assertEvidence();
      return view;
    };
    return {
      initial,
      settled: settle()
        .then(async (view) => {
          await storage.assertReadable(symbols);
          if (revokedStores.has(storage)) throw new Error("EVIDENCE_REVOKED");
          assertEvidence();
          return view;
        })
        .catch(async (error): Promise<CacheView> => {
          if (error instanceof Error && error.message === "REFRESH_GUARDED")
            return (await open(request, range, retry)).settled;
          return {
            status: "blocked",
            requested: period,
            code: "REFRESH_FAILED",
          };
        }),
    };
  };
  const open = async (
    request: Omit<BacktestRequest, "start" | "end">,
    range: Preset,
    retry = false,
  ): Promise<{ initial: CacheView; settled: Promise<CacheView> }> => {
    try {
      return await run(request, range, retry);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "REFRESH_GUARDED")
        throw error;
      const now = clock(),
        calendar = options.calendar();
      const period = preset(
        { ...calendar, sessions: eligibleSessions(calendar.sessions, now) },
        range,
      );
      const symbols = [
        ...new Set([
          "SPY",
          ...request.portfolios.flatMap((p) => p.holdings.map((h) => h.symbol)),
        ]),
      ];
      const wait = async (): Promise<CacheView> => {
        for (let attempt = 0; attempt < 30; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          try {
            await storage.assertReadable(symbols);
            const next = await run(request, range, retry);
            return await next.settled;
          } catch (error) {
            if (
              !(error instanceof Error) ||
              error.message !== "REFRESH_GUARDED"
            )
              return {
                status: "blocked",
                requested: period,
                code: "UNVERIFIED_DATA",
              };
          }
        }
        return { status: "blocked", requested: period, code: "REFRESH_FAILED" };
      };
      return {
        initial: { status: "refreshing", requested: period },
        settled: wait(),
      };
    }
  };
  return open;
}
