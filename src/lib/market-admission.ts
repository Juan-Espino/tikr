import "server-only";
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  lstat,
  opendir,
} from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { MARKET_BUDGET } from "./market-budget.ts";
import { PERSONAL_SOURCE_POLICY } from "./market-policy.ts";
import { developmentIoAllowance } from "./market-dev-allowance.ts";
type Ledger = {
  version: 1;
  month: string;
  calls: number;
  io: number;
  revoked?: string[];
  scoped?: Partial<
    Record<
      "provider" | "database",
      { attempts: number; retainedUnits: number; measuredReceivedBytes: number }
    >
  >;
};
export function createAdmission(
  directory: string,
  clock: () => Date = () => new Date(),
) {
  if (!isAbsolute(directory)) throw new Error("ADMISSION_CONFIG");
  const file = join(directory, "ledger.json"),
    lock = join(directory, "ledger.lock");
  async function assertAssetsActive(scope: string, symbols: string[]) {
    for (const symbol of symbols) {
      if (!/^[A-Z0-9.-]{1,16}$/.test(symbol)) throw Error("ADMISSION_CONFIG");
      try {
        await lstat(join(directory, `revoked-${scope}-${symbol}.flag`));
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
          continue;
        throw error;
      }
      throw Error("EVIDENCE_REVOKED");
    }
  }
  async function observationActive(name: string) {
    const activePath = join(directory, `${name}.active`);
    try {
      const info = await lstat(activePath);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024)
        throw Error("ADMISSION_CONFIG");
      const owner = JSON.parse(await readFile(activePath, "utf8")) as {
        pid?: number;
      };
      if (!Number.isSafeInteger(owner.pid) || !owner.pid || owner.pid < 1)
        throw Error("ADMISSION_CONFIG");
      try {
        process.kill(owner.pid, 0);
        return true;
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ESRCH")
          return false;
        // Permission failure or a reused process ID is not proof of abandonment.
        return true;
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        return false;
      throw error;
    }
  }
  async function transact<T>(
    fn: (ledger: Ledger) => T,
    preserveLockOnFailure = false,
  ): Promise<T> {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("ADMISSION_CONFIG");
    // An abandoned lock fails closed. Never steal a lock from another process.
    async function lockFile() {
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          return await open(lock, "wx", 0o600);
        } catch (error) {
          if (!(
            error instanceof Error &&
            "code" in error &&
            error.code === "EEXIST"
          ))
            throw error;
          await new Promise((r) => setTimeout(r, 10));
        }
      }
      throw new Error("ADMISSION_LOCKED");
    }
    const handle = await lockFile();
    let committed = false;
    try {
      const now = clock();
      const month = now.toISOString().slice(0, 7);
      let ledger: Ledger;
      try {
        const stat = await lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048)
          throw new Error("ADMISSION_CORRUPT");
        ledger = JSON.parse(await readFile(file, "utf8")) as Ledger;
        if (
          ledger.version !== 1 ||
          !/^\d{4}-\d{2}$/.test(ledger.month) ||
          ![ledger.calls, ledger.io].every(
            (n) => Number.isSafeInteger(n) && n >= 0,
          ) ||
          ledger.month > month
        )
          throw new Error("ADMISSION_CORRUPT");
        if (
          ledger.scoped &&
          Object.entries(ledger.scoped).some(
            ([key, value]) =>
              !["provider", "database"].includes(key) ||
              !value ||
              Object.values(value).some(
                (n) => !Number.isSafeInteger(n) || n < 0,
              ),
          )
        )
          throw Error("ADMISSION_CORRUPT");
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
          ledger = { version: 1, month, calls: 0, io: 0 };
        else throw error;
      }
      if (
        ledger.revoked &&
        (!Array.isArray(ledger.revoked) ||
          ledger.revoked.length > 16 ||
          ledger.revoked.some((s) => !/^[a-f0-9]{64}$/.test(s)))
      )
        throw new Error("ADMISSION_CORRUPT");
      if (ledger.month !== month)
        ledger = {
          version: 1,
          month,
          calls: 0,
          io: 0,
          revoked: ledger.revoked ?? [],
        };
      const result = fn(ledger);
      const temp = join(directory, `ledger-${randomUUID()}.tmp`);
      const output = await open(temp, "wx", 0o600);
      try {
        await output.writeFile(JSON.stringify(ledger));
        await output.sync();
      } finally {
        await output.close();
      }
      await rename(temp, file);
      committed = true;
      return result;
    } finally {
      await handle.close();
      if (committed || !preserveLockOnFailure) await unlink(lock);
    }
  }
  return {
    async assertLegacyReadable(
      scope: string,
      symbols: string[],
      revisions: Record<string, string> = {},
      reviewedPolicy?: string,
    ) {
      // Exact PR16-reviewed v3/v4 -> v5 transition, not a general old-policy exemption.
      // These exact global scopes were superseded; asset flags, ledger
      // revocations and unknown/current-policy refresh guards remain authoritative.
      const supersededGlobals =
        reviewedPolicy === PERSONAL_SOURCE_POLICY
          ? new Set([
              "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7",
              "dcb3fad8de5e1ec032403090533da422eaa911b249dfd8511affd38539b87d8d",
            ])
          : new Set<string>();
      const scopes = new Set<string>();
      const handle = await opendir(directory);
      let count = 0;
      for await (const entry of handle) {
        if (++count > 2048) throw Error("ADMISSION_DIRECTORY_LIMIT");
        const revoked =
          /^revoked-([a-f0-9]{64})(?:-([A-Z0-9.-]+))?\.flag$/.exec(entry.name);
        if (
          revoked &&
          (!revoked[2] || symbols.includes(revoked[2])) &&
          (revoked[2] || !supersededGlobals.has(revoked[1]!))
        )
          throw Error("EVIDENCE_REVOKED");
        const guard = /^refresh-([a-f0-9]{64})-/.exec(entry.name);
        if (
          guard &&
          guard[1] !== scope &&
          !supersededGlobals.has(guard[1]!) &&
          entry.name.endsWith(".flag") &&
          symbols.some((symbol) =>
            entry.name.startsWith(`refresh-${guard[1]}-${symbol}-`),
          )
        )
          scopes.add(guard[1]!);
      }
      try {
        const info = await lstat(file);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 2048)
          throw Error("ADMISSION_CORRUPT");
        const ledger = JSON.parse(await readFile(file, "utf8")) as Ledger;
        if (ledger.revoked !== undefined && !Array.isArray(ledger.revoked))
          throw Error("ADMISSION_CORRUPT");
        if (ledger.revoked?.length) throw Error("EVIDENCE_REVOKED");
      } catch (error) {
        if (!(
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ))
          throw error;
      }
      for (const legacy of scopes)
        await this.assertReadable(legacy, symbols, revisions);
    },
    async assertActive(scope: string) {
      if (!/^[a-f0-9]{64}$/.test(scope)) throw new Error("ADMISSION_CONFIG");
      try {
        await lstat(join(directory, `revoked-${scope}.flag`));
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
          return;
        throw error;
      }
      throw new Error("EVIDENCE_REVOKED");
    },
    async assertNotRevoked(scope: string, symbols: string[]) {
      await this.assertActive(scope);
      await assertAssetsActive(scope, symbols);
    },
    async guardedSymbols(scope: string, symbols: string[]) {
      await this.assertActive(scope);
      await assertAssetsActive(scope, symbols);
      const guarded = new Set<string>();
      const directoryHandle = await opendir(directory);
      let count = 0;
      for await (const entry of directoryHandle) {
        if (++count > 2048) throw new Error("ADMISSION_DIRECTORY_LIMIT");
        for (const symbol of symbols)
          if (
            entry.name.startsWith(`refresh-${scope}-${symbol}-`) &&
            entry.name.endsWith(".flag")
          )
            guarded.add(symbol);
      }
      await this.assertActive(scope);
      await assertAssetsActive(scope, symbols);
      return [...guarded];
    },
    async assertReadable(
      scope: string,
      symbols: string[],
      revisions: Record<string, string> = {},
    ) {
      await this.assertActive(scope);
      await assertAssetsActive(scope, symbols);
      const guarded = await this.guardedSymbols(scope, symbols);
      if (!guarded.length) return;
      const entries = await opendir(directory);
      for await (const entry of entries) {
        for (const symbol of guarded) {
          if (
            !entry.name.startsWith(`refresh-${scope}-${symbol}-`) ||
            !entry.name.endsWith(".flag")
          )
            continue;
          try {
            // An exact-revision receipt can never acknowledge an observation
            // that is still in flight in this or another process.
            if (await observationActive(entry.name))
              throw Error("ACTIVE_OBSERVATION");
            const receipt = join(directory, `${entry.name}.resolved.json`);
            const stat = await lstat(receipt);
            if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048)
              throw Error();
            const resolved = JSON.parse(
              await readFile(receipt, "utf8"),
            ) as Record<string, unknown>;
            if (
              !/^[a-f0-9]{64}$/.test(revisions[symbol] ?? "") ||
              resolved.version !== 1 ||
              resolved.guard !== entry.name ||
              resolved.scope !== scope ||
              resolved.symbol !== symbol ||
              resolved.headRevision !== revisions[symbol]
            )
              throw Error();
          } catch {
            throw new Error("REFRESH_GUARDED");
          }
        }
      }
      await this.assertActive(scope);
      await assertAssetsActive(scope, symbols);
    },
    // Called only after a freshly validated head has committed and been read back.
    // Preserve every guard; receipts acknowledge exact committed revisions.
    async confirmRefresh(scope: string, symbol: string, headRevision: string) {
      await this.assertActive(scope);
      await assertAssetsActive(scope, [symbol]);
      if (
        !/^[A-Z0-9.-]{1,16}$/.test(symbol) ||
        !/^[a-f0-9]{64}$/.test(headRevision)
      )
        throw new Error("ADMISSION_CONFIG");
      const entries = await opendir(directory);
      for await (const entry of entries) {
        if (
          !entry.name.startsWith(`refresh-${scope}-${symbol}-`) ||
          !entry.name.endsWith(".flag")
        )
          continue;
        if (await observationActive(entry.name)) continue;
        const file = join(directory, `${entry.name}.resolved.json`);
        const temporary = join(directory, `resolution-${randomUUID()}.tmp`);
        const output = await open(temporary, "wx", 0o600);
        try {
          await output.writeFile(
            JSON.stringify({
              version: 1,
              scope,
              symbol,
              guard: entry.name,
              headRevision,
              confirmedAt: clock().toISOString(),
            }),
          );
          await output.sync();
        } finally {
          await output.close();
        }
        await rename(temporary, file);
      }
      await this.assertActive(scope);
      await assertAssetsActive(scope, [symbol]);
    },
    async beginRefresh(scope: string, symbol: string) {
      if (!/^[a-f0-9]{64}$/.test(scope) || !/^[A-Z0-9.-]{1,16}$/.test(symbol))
        throw new Error("ADMISSION_CONFIG");
      await this.assertActive(scope);
      await assertAssetsActive(scope, [symbol]);
      const path = join(
        directory,
        `refresh-${scope}-${symbol}-${randomUUID()}.flag`,
      );
      // Publish liveness before the guard; never expire/steal another process's observation.
      const activePath = `${path}.active`;
      const active = await open(activePath, "wx", 0o600);
      try {
        await active.writeFile(JSON.stringify({ pid: process.pid }));
        await active.sync();
      } finally {
        await active.close();
      }
      const handle = await open(path, "wx", 0o600);
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
      // Leave the guard behind on any uncertain/known-correction outcome.
      let ended = false;
      const endObservation = async () => {
        if (!ended) {
          await unlink(activePath);
          ended = true;
        }
      };
      const finish = async () => {
        await unlink(path);
        await unlink(`${path}.resolved.json`).catch((error) => {
          if (!(
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          ))
            throw error;
        });
        await endObservation();
      };
      return Object.assign(finish, { endObservation });
    },
    async revoke(scope: string, symbol?: string) {
      if (!/^[a-f0-9]{64}$/.test(scope)) throw new Error("ADMISSION_CONFIG");
      if (symbol !== undefined && !/^[A-Z0-9.-]{1,16}$/.test(symbol))
        throw Error("ADMISSION_CONFIG");
      // Independent write-ahead marker: ledger lock contention cannot suppress revocation.
      const flag = join(
        directory,
        `revoked-${scope}${symbol ? `-${symbol}` : ""}.flag`,
      );
      try {
        const marker = await open(flag, "wx", 0o600);
        try {
          await marker.sync();
        } finally {
          await marker.close();
        }
      } catch (error) {
        if (!(
          error instanceof Error &&
          "code" in error &&
          error.code === "EEXIST"
        ))
          throw error;
      }
    },
    async reserve(
      bytes: number,
      scope?: string,
      kind?: "provider" | "database",
    ) {
      if (!Number.isSafeInteger(bytes) || bytes < 0)
        throw new Error("ADMISSION_CONFIG");
      if (scope) await this.assertActive(scope);
      const month = clock().toISOString().slice(0, 7);
      const ioLimit = developmentIoAllowance(process.env, month);
      await transact((l) => {
        if (scope && l.revoked?.includes(scope))
          throw new Error("EVIDENCE_REVOKED");
        if (l.calls + 1 > MARKET_BUDGET.monthlyCalls || l.io + bytes > ioLimit)
          throw new Error("CACHE_BUDGET");
        l.calls++;
        l.io += bytes;
        if (kind) {
          l.scoped ??= {};
          const tally = (l.scoped[kind] ??= {
            attempts: 0,
            retainedUnits: 0,
            measuredReceivedBytes: 0,
          });
          tally.attempts++;
          tally.retainedUnits += bytes;
        }
      });
      if (scope) await this.assertActive(scope);
      let settled = false;
      return async (actualBytes: number) => {
        if (settled) return;
        settled = true;
        if (
          !Number.isSafeInteger(actualBytes) ||
          actualBytes < 0 ||
          actualBytes > bytes
        )
          return;
        await transact((l) => {
          if (l.month === month) {
            l.io -= bytes - actualBytes;
            if (kind && l.scoped?.[kind]) {
              l.scoped[kind].retainedUnits -= bytes - actualBytes;
              if (kind === "provider")
                l.scoped[kind].measuredReceivedBytes += actualBytes;
            }
          }
        });
      };
    },
  };
}
export async function localAdmission() {
  const base = process.env.LOCALAPPDATA;
  if (!base || !isAbsolute(base)) throw new Error("ADMISSION_CONFIG");
  let dir = base;
  for (const name of ["Tikr", "market-admission"]) {
    dir = join(dir, name);
    await mkdir(dir, { recursive: false }).catch((error) => {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "EEXIST"
      ))
        throw error;
    });
    const info = await lstat(dir);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("ADMISSION_CONFIG");
  }
  return createAdmission(dir);
}
