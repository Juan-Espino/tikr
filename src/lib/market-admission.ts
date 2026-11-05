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
type Ledger = {
  version: 1;
  month: string;
  calls: number;
  io: number;
  revoked?: string[];
};
export function createAdmission(
  directory: string,
  clock: () => Date = () => new Date(),
) {
  if (!isAbsolute(directory)) throw new Error("ADMISSION_CONFIG");
  const file = join(directory, "ledger.json"),
    lock = join(directory, "ledger.lock");
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
    async assertReadable(scope: string, symbols: string[]) {
      await this.assertActive(scope);
      const directoryHandle = await opendir(directory);
      let count = 0;
      for await (const entry of directoryHandle) {
        if (++count > 2048) throw new Error("ADMISSION_DIRECTORY_LIMIT");
        if (
          symbols.some((s) => entry.name.startsWith(`refresh-${scope}-${s}-`))
        )
          throw new Error("REFRESH_GUARDED");
      }
      await this.assertActive(scope);
    },
    async beginRefresh(scope: string, symbol: string) {
      if (!/^[a-f0-9]{64}$/.test(scope) || !/^[A-Z0-9.-]{1,16}$/.test(symbol))
        throw new Error("ADMISSION_CONFIG");
      await this.assertActive(scope);
      const path = join(
        directory,
        `refresh-${scope}-${symbol}-${randomUUID()}.flag`,
      );
      const handle = await open(path, "wx", 0o600);
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
      // Leave the guard behind on any uncertain/known-correction outcome.
      return async () => {
        await unlink(path);
      };
    },
    async revoke(scope: string) {
      if (!/^[a-f0-9]{64}$/.test(scope)) throw new Error("ADMISSION_CONFIG");
      // Independent write-ahead marker: ledger lock contention cannot suppress revocation.
      const flag = join(directory, `revoked-${scope}.flag`);
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
    async reserve(bytes: number, scope?: string) {
      if (!Number.isSafeInteger(bytes) || bytes < 0)
        throw new Error("ADMISSION_CONFIG");
      if (scope) await this.assertActive(scope);
      const month = clock().toISOString().slice(0, 7);
      await transact((l) => {
        if (scope && l.revoked?.includes(scope))
          throw new Error("EVIDENCE_REVOKED");
        if (
          l.calls + 1 > MARKET_BUDGET.monthlyCalls ||
          l.io + bytes > MARKET_BUDGET.monthlyIoBytes
        )
          throw new Error("CACHE_BUDGET");
        l.calls++;
        l.io += bytes;
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
          if (l.month === month) l.io -= bytes - actualBytes;
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
