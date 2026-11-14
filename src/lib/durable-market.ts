import { MarketFailure, marketFailure } from "./market-errors.ts";
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
const revokedAssets = new WeakMap<MarketStorage, Set<string>>();
const revokedFor = (store: MarketStorage, symbols: string[]) =>
  symbols.some((symbol) => revokedAssets.get(store)?.has(symbol));
import { cachedAsset, rememberAsset } from "./market-asset-memory.ts";
import { marketTrace, traceFields } from "./market-trace.ts";
import { randomUUID } from "node:crypto";
import { refreshCodes, type RefreshFailure } from "./market-failure-record.ts";
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
      d < a.from ||
      d > a.through ||
      !c.sessions.includes(d) ||
      !positive(p)
    )
      throw new Error("UNVERIFIED_DATA");
  for (const d of sessions)
    if (d >= a.firstAvailable && !Object.hasOwn(a.prices, d))
      throw new Error("MISSING_PRICE");
  const ids = new Set<string>();
  for (const e of a.actions) {
    if (e.date < from || e.date > through) continue;
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
  const cached = store.namespace
    ? cachedAsset(store.namespace, data.meta.symbol, head.revision)
    : undefined;
  if (cached) return cached;
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
  await store.confirmRead?.(data.meta.symbol, head.revision);
  if (store.namespace)
    rememberAsset(store.namespace, data.meta.symbol, head.revision, asset);
  return asset;
}

export function createDurableBacktests(options: {
  storage: MarketStorage;
  calendar: () => Calendar;
  load: CacheOptions["load"];
  supportedSymbols: string[];
  historyStart: string;
  clock?: () => Date;
  timeoutMs?: number;
  evidenceRevision?: string;
  normalizationRevision?: string;
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
    let recovering: string[] = [];
    try {
      await storage.assertReadable(symbols);
    } catch (error) {
      if (
        !retry ||
        !storage.recoverySymbols ||
        !(error instanceof Error) ||
        error.message !== "REFRESH_GUARDED"
      )
        throw error;
      recovering = await storage.recoverySymbols(symbols);
      if (!recovering.length) throw error;
    }
    if (revokedFor(storage, symbols)) throw new Error("EVIDENCE_REVOKED");
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
    const covers = (row: Stored, from: string) => {
      const head = JSON.parse(row.payload) as AssetHead;
      return (
        head.format === "monthly-v2" &&
        head.meta.from <= from &&
        (head.meta.through >= period.end ||
          (head.pendingSession === period.end &&
            head.meta.through === sessions.at(-2)))
      );
    };
    const identity = revision({
      request,
      range,
      evidenceRevision: options.evidenceRevision,
      normalizationRevision: options.normalizationRevision,
      policy: "raw-sip-payment-close-0900-requested-v3",
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
    const availableContent = new Map<string, Asset>();
    const missingContent = new Map<string, RefreshFailure>();
    const cacheMiss = (symbol: string) => {
      if (missingContent.has(symbol)) return;
      const failure: RefreshFailure = {
        trace: marketTrace() ?? randomUUID(),
        at: clock().valueOf(),
        stage: "cache",
        code: "CACHE_CONTENT_UNAVAILABLE",
      };
      missingContent.set(symbol, failure);
      console.error(
        JSON.stringify({
          event: "market_cache_miss",
          symbol,
          ...failure,
          sourceRevision: options.evidenceRevision,
        }),
      );
    };
    if (retry)
      await Promise.all(
        symbols
          .filter((symbol) => !recovering.includes(symbol))
          .map(async (symbol) => {
            const head = headMap.get(`asset:${symbol}`);
            if (
              !head ||
              freshnessCycle(new Date(head.checkedAt)) !== cycle ||
              (JSON.parse(head.payload) as AssetHead).evidenceRevision !==
                options.evidenceRevision ||
              !covers(head, period.start)
            )
              return;
            try {
              availableContent.set(symbol, await loadAsset(storage, head));
            } catch (error) {
              if (
                !(error instanceof Error) ||
                error.message !== "REVISION_CHANGED"
              )
                throw error;
              cacheMiss(symbol);
            }
          }),
      );
    const completingRequest =
      retry &&
      symbols.some((symbol) => {
        if (missingContent.has(symbol)) return true;
        const head = headMap.get(`asset:${symbol}`);
        if (!head) return true;
        const meta = JSON.parse(head.payload) as AssetHead;
        return (
          freshnessCycle(new Date(head.checkedAt)) !== cycle ||
          meta.evidenceRevision !== options.evidenceRevision ||
          !covers(head, period.start)
        );
      });
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
    if (!recovering.length) await storage.assertReadable(symbols);
    if (revokedFor(storage, symbols)) throw new Error("EVIDENCE_REVOKED");
    assertEvidence();
    if (saved?.cycle === cycle && !retry)
      return { initial: saved.view, settled: Promise.resolve(saved.view) };
    const initial: CacheView =
      !recovering.length && saved?.view.result
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
          const limitationKey = `limitation:${q.symbol}:${range}`;
          const old = headMap.get(key);
          if (
            old &&
            freshnessCycle(new Date(old.checkedAt)) === cycle &&
            (!retry ||
              ((recovering.length > 0 || completingRequest) &&
                !recovering.includes(q.symbol))) &&
            !old.payload.includes('"invalidated":true') &&
            (JSON.parse(old.payload) as AssetHead).evidenceRevision ===
              options.evidenceRevision &&
            covers(old, q.from)
          ) {
            let asset = availableContent.get(q.symbol);
            if (!asset && !missingContent.has(q.symbol)) {
              try {
                asset = await loadAsset(storage, old);
              } catch (error) {
                if (
                  !(error instanceof Error) ||
                  error.message !== "REVISION_CHANGED"
                )
                  throw error;
                cacheMiss(q.symbol);
              }
            }
            if (asset) {
              loadedHeads.set(key, old);
              loadedAssets.set(q.symbol, asset);
              return {
                feed: "sip",
                asset,
                pendingSession: (JSON.parse(old.payload) as AssetHead)
                  .pendingSession,
              };
            }
          }
          if (!retry) {
            const limited = (await storage.read([limitationKey]))[0];
            if (limited) {
              let limitation:
                | {
                    symbol?: string;
                    code?: string;
                    from?: string;
                    through?: string;
                    cycle?: string;
                    evidenceRevision?: string;
                    normalizationRevision?: string;
                  }
                | undefined;
              try {
                limitation = JSON.parse(limited.payload) as typeof limitation;
              } catch {
                /* A corrupt limitation is never evidence. */
              }
              if (
                limitation &&
                limited.revision === revision(limitation) &&
                limitation.symbol === q.symbol &&
                limitation.cycle === cycle &&
                limitation.evidenceRevision === options.evidenceRevision &&
                limitation.normalizationRevision ===
                  options.normalizationRevision &&
                limitation.from === q.from &&
                limitation.through === q.through &&
                (limitation.code === "MISSING_PRICE" ||
                  limitation.code === "UNSUPPORTED_ACTION")
              )
                throw new MarketFailure(limitation.code);
            }
          }
          const token = await storage
            .acquire(key, cycle, retry, q.from)
            .catch((error) => {
              const failure = marketFailure(error),
                original = missingContent.get(q.symbol);
              if (failure && original)
                throw new MarketFailure(
                  failure.code,
                  failure.retryAt,
                  failure.originalFailure ?? original,
                  failure.guardState,
                );
              throw error;
            });
          if (!token) {
            let current: Stored | undefined;
            for (let i = 0; i < 3; i++) {
              current = (await storage.read([key]))[0];
              if (
                current &&
                freshnessCycle(new Date(current.checkedAt)) === cycle &&
                !current.payload.includes('"invalidated":true') &&
                (JSON.parse(current.payload) as AssetHead).evidenceRevision ===
                  options.evidenceRevision &&
                covers(current, q.from)
              )
                break;
              await new Promise((resolve) => setTimeout(resolve, 400));
            }
            if (
              current &&
              freshnessCycle(new Date(current.checkedAt)) === cycle &&
              !current.payload.includes('"invalidated":true') &&
              (JSON.parse(current.payload) as AssetHead).evidenceRevision ===
                options.evidenceRevision &&
              covers(current, q.from)
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
          let finishGuard:
            Awaited<ReturnType<MarketStorage["beginRefresh"]>> | undefined;
          let received = false,
            safeToRelease = false;
          let stage: RefreshFailure["stage"] = "guard";
          try {
            stage = "guard";
            finishGuard = await storage.beginRefresh(q.symbol);
            stage = "source";
            const previous = old
              ? await loadAsset(storage, old).catch(() => undefined)
              : undefined;
            const oldManifest = old
              ? (JSON.parse(old.payload) as AssetHead)
              : undefined;
            const authoritativeFrom =
              oldManifest?.format === "monthly-v2" &&
              oldManifest.evidenceRevision === options.evidenceRevision &&
              oldManifest.meta.symbol === q.symbol &&
              /^\d{4}-\d{2}-\d{2}$/.test(oldManifest.meta.from) &&
              Number.isFinite(Date.parse(oldManifest.meta.from)) &&
              new Date(oldManifest.meta.from).toISOString().slice(0, 10) ===
                oldManifest.meta.from
                ? oldManifest.meta.from
                : q.from;
            const retainedFrom = [
              previous?.from ?? q.from,
              authoritativeFrom,
              q.from,
            ].sort()[0]!;
            const refreshed = await options.load({
              ...q,
              // Explicit retries must not replace a wider validated cache with a narrow window.
              // A monthly window rollover must not request dates outside the new calendar.
              from:
                retainedFrom < options.historyStart
                  ? options.historyStart
                  : retainedFrom,
              previous,
            });
            received = true;
            stage = "validation";
            const asset = refreshed.asset;
            if (
              refreshed.feed !== "sip" ||
              asset.symbol !== q.symbol ||
              asset.complete !== true ||
              (asset.inceptionVerified !== true &&
                !(
                  asset.periodCoverageVerified === true &&
                  asset.firstAvailable <= q.from
                )) ||
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
            stage = "storage-read";
            await storage.progressRefresh?.(q.symbol);
            const existing = await storage.read(records.map((r) => r.key));
            const changed = records.filter(
              (r) =>
                r.key === key ||
                existing.find((e) => e.key === r.key)?.revision !== r.revision,
            );
            stage = "storage-write";
            await storage.write(key, token, changed);
            await storage.confirmRefresh?.(q.symbol, records.at(-1)!.revision);
            if (storage.namespace)
              rememberAsset(
                storage.namespace,
                q.symbol,
                records.at(-1)!.revision,
                asset,
              );
            loadedHeads.set(key, {
              ...records.at(-1)!,
              checkedAt: clock().valueOf(),
            });
            loadedAssets.set(q.symbol, asset);
            safeToRelease = true;
            return refreshed;
          } catch (error) {
            const candidate =
              error instanceof Error && "code" in error
                ? error.code
                : error instanceof Error
                  ? error.message
                  : undefined;
            const failureRecord: RefreshFailure = {
              trace: marketTrace() ?? randomUUID(),
              at: clock().valueOf(),
              stage,
              code: refreshCodes.includes(candidate as never)
                ? (candidate as RefreshFailure["code"])
                : "UNKNOWN_FAILURE",
            };
            console.error(
              JSON.stringify({
                event: "market_refresh_failure",
                symbol: q.symbol,
                ...failureRecord,
                ...traceFields(),
                sourceRevision: options.evidenceRevision,
                received,
              }),
            );
            if (finishGuard)
              await storage
                .recordFailure?.(q.symbol, failureRecord)
                .catch(() => undefined);
            if (
              old &&
              error instanceof Error &&
              "code" in error &&
              error.code === "EVIDENCE_CHANGED"
            ) {
              knownCorrection = true;
              const revoked = revokedAssets.get(storage) ?? new Set<string>();
              revoked.add(q.symbol);
              revokedAssets.set(storage, revoked);
              await storage.revoke(q.symbol);
              const payload = JSON.stringify({
                invalidated: true,
                reason: "EVIDENCE_CHANGED",
                symbol: q.symbol,
                from: q.from,
                through: q.through,
                limitation: marketFailure(error)?.code ?? "UNVERIFIED_DATA",
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
            const failure = marketFailure(error);
            if (
              !received &&
              !knownCorrection &&
              (failure?.code === "MISSING_PRICE" ||
                failure?.code === "UNSUPPORTED_ACTION")
            ) {
              const limitation = {
                symbol: q.symbol,
                code: failure.code,
                from: q.from,
                through: q.through,
                cycle,
                evidenceRevision: options.evidenceRevision,
                normalizationRevision: options.normalizationRevision,
              };
              await storage
                .write(key, token, [
                  {
                    key: limitationKey,
                    payload: JSON.stringify(limitation),
                    revision: revision(limitation),
                    dependencies: [],
                  },
                ])
                .catch((cacheError) => {
                  console.error(
                    JSON.stringify({
                      event: "market_limitation_cache_failure",
                      symbol: q.symbol,
                      code:
                        marketFailure(cacheError)?.code ??
                        "STORAGE_UNAVAILABLE",
                    }),
                  );
                });
            }
            if (failure)
              throw new MarketFailure(
                failure.code,
                failure.retryAt,
                failureRecord,
              );
            throw error;
          } finally {
            try {
              try {
                if (safeToRelease) await finishGuard?.();
              } finally {
                await finishGuard?.endObservation?.();
              }
            } finally {
              await storage.release(key, token).catch(() => undefined);
            }
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
      if (knownCorrection || revokedFor(storage, symbols))
        return {
          status: "blocked",
          requested: period,
          code: "UNVERIFIED_DATA",
          issues: view.issues,
        };
      if (!view.result) {
        const current = await storage.read(symbols.map((s) => `asset:${s}`));
        if (
          !recovering.length &&
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
            retryAt: view.retryAt,
            issues: view.issues,
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
          // A retained guard is expected after failed provider work. Preserve
          // that original blocked result instead of replacing it with a guard.
          if (view.result) await storage.assertReadable(symbols);
          if (revokedFor(storage, symbols)) throw new Error("EVIDENCE_REVOKED");
          assertEvidence();
          return view;
        })
        .catch(async (error): Promise<CacheView> => {
          // A user retry authorizes one attempt, not recursive guard recovery.
          if (
            !retry &&
            error instanceof Error &&
            error.message === "REFRESH_GUARDED"
          )
            return (await open(request, range, false)).settled;
          return {
            status: "blocked",
            requested: period,
            code: marketFailure(error)?.code ?? "REFRESH_FAILED",
            retryAt: marketFailure(error)?.retryAt,
            originalFailure: marketFailure(error)?.originalFailure,
            guardState: marketFailure(error)?.guardState,
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
        if (error instanceof MarketFailure && error.guardState !== "active")
          return {
            status: "blocked",
            requested: period,
            code: error.code,
            retryAt: error.retryAt,
            originalFailure: error.originalFailure,
            guardState: error.guardState,
          };
        let last = marketFailure(error);
        for (let attempt = 0; attempt < 30; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          try {
            await storage.assertReadable(symbols);
            const next = await run(request, range, retry);
            return await next.settled;
          } catch (error) {
            last = marketFailure(error);
            if (
              last?.code === "REFRESH_GUARDED" &&
              last.guardState === "abandoned"
            )
              break;
            if (
              !(error instanceof Error) ||
              error.message !== "REFRESH_GUARDED"
            )
              return {
                status: "blocked",
                requested: period,
                code: last?.code ?? "UNVERIFIED_DATA",
                retryAt: last?.retryAt,
                originalFailure: last?.originalFailure,
              };
          }
        }
        return {
          status: "blocked",
          requested: period,
          code: "REFRESH_GUARDED",
          retryAt: last?.retryAt,
          originalFailure: last?.originalFailure,
          guardState: last?.guardState,
        };
      };
      return {
        initial: { status: "refreshing", requested: period },
        settled: wait(),
      };
    }
  };
  return open;
}
