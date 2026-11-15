import { type Portfolio } from "./demo.ts";
import { validTicker } from "./asset-catalog.ts";
import { z } from "zod";
// New recovery records are not legacy data: never migrate their tickers or explicit periods.
const trialSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9-]+$/)
    .refine((id) => !id.startsWith("example-")),
  revision: z.undefined().optional(),
  name: z.string().max(80),
  holdings: z
    .array(
      z.object({
        ticker: z.string().refine(validTicker),
        weight: z.string().max(12),
      }),
    )
    .max(6),
  manual: z.boolean(),
  pinned: z.boolean(),
  updated: z.number().finite(),
  amount: z.string().max(16),
  rangeChoice: z.enum(["default", "explicit"]),
  range: z.enum(["1W", "1M", "YTD", "1Y", "5Y"]),
});
export const TRIAL_KEY = "tikr-trial-v1";
export const LEGACY_KEY = "tikr-demo-v1";
export const isExample = (id: string) => id.startsWith("example-");
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
export function readTrial(
  storage: Storage,
  owner: string | null = null,
): Portfolio | null {
  const raw = storage.getItem(TRIAL_KEY);
  if (!raw) return null;
  if (raw.length > 16000) throw new Error("Invalid draft");
  const value = JSON.parse(raw) as {
    version?: number;
    draft?: unknown;
    owner?: string | null;
  };
  if (value.version !== 1) throw new Error("Invalid draft");
  const p = trialSchema.parse(value.draft);
  if (
    p.id.length > 80 ||
    !/^[a-zA-Z0-9-]+$/.test(p.id) ||
    isExample(p.id) ||
    p.revision !== undefined
  )
    throw new Error("Invalid draft");
  if (
    value.owner !== undefined &&
    value.owner !== null &&
    (typeof value.owner !== "string" || value.owner.length > 256)
  )
    throw new Error("Invalid owner");
  return value.owner && value.owner !== owner ? null : p;
}
// Compare before writing: a stale tab must never replace a newer trial.
export function writeTrial(
  storage: Storage,
  next: Portfolio | null,
  expected: Portfolio | null,
  owner: string | null = null,
  replaceHidden = false,
) {
  const rawCurrent = storage.getItem(TRIAL_KEY);
  const current = readTrial(storage, owner);
  if (rawCurrent && !current && !replaceHidden)
    throw new Error("Private draft");
  if (
    JSON.stringify(current) !==
    JSON.stringify(expected ? trialSchema.parse(expected) : null)
  )
    throw new Error("Draft changed");
  if (next) {
    if (isExample(next.id) || next.revision !== undefined)
      throw new Error("Read only");
    const raw = JSON.stringify({ version: 1, owner, draft: next });
    if (raw.length > 16000) throw new Error("Invalid draft");
    trialSchema.parse(next);
    storage.setItem(TRIAL_KEY, raw);
  } else storage.removeItem(TRIAL_KEY);
}
export function settleTrial(storage: Storage, saved: Portfolio, owner: string) {
  const current = readTrial(storage, owner);
  // An acknowledgement must not discard newer edits or a replacement draft.
  if (
    current?.id === saved.id &&
    JSON.stringify(current) === JSON.stringify(trialSchema.parse(saved))
  )
    writeTrial(storage, null, current, owner);
}
