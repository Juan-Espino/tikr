import type { RefreshFailure } from "./market-failure-record.ts";
import { validTicker } from "./asset-catalog.ts";
import { z } from "zod";
import { allocation, validAmount } from "./demo";
import type { HistoryChunk } from "./market-history-wire.ts";
const holding = z
  .object({
    symbol: z.string().refine(validTicker),
    weight: z.string().max(12),
  })
  .strict();
export const marketRequestSchema = z
  .object({
    portfolios: z
      .array(
        z
          .object({
            id: z
              .string()
              .min(1)
              .max(80)
              .refine((id) => id !== "SPY"),
            holdings: z.array(holding).min(1).max(6),
          })
          .strict(),
      )
      .min(1)
      .max(3),
    amount: z.string().max(16).refine(validAmount),
    range: z.enum(["1W", "1M", "YTD", "1Y", "5Y", "Max"]),
    retry: z.boolean().optional(),
    history: z
      .array(
        z
          .object({
            key: z.string().regex(/^price:[A-Z0-9.-]+:\d{4}-\d{2}$/),
            payload: z.string().max(30000),
            revision: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict(),
      )
      .max(1235)
      .optional(),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (
      new Set(r.portfolios.map((p) => p.id)).size !== r.portfolios.length ||
      r.portfolios.some(
        (p) =>
          !allocation(
            p.holdings.map((h) => ({ ticker: h.symbol, weight: h.weight })),
          ).valid,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Invalid allocation or duplicate portfolios",
      });
  });
export type MarketRequest = z.infer<typeof marketRequestSchema>;
export type MarketResponse = {
  history?: HistoryChunk[];
  status: "ready" | "refreshing" | "stale" | "blocked";
  code?: string;
  retryAt?: number;
  reference?: string;
  guardState?: "active" | "abandoned";
  originalFailure?: RefreshFailure;
  asOf?: string;
  evidenceExpiresAt?: string;
  dataQuality?: "personal-provisional" | "reviewed" | "synthetic";
  assetReturns?: Record<string, string>;
  dataCheckedAt?: string;
  period?: { start: string; end: string };
  requested?: { start: string; end: string };
  issues?: { symbol: string; code: string; firstAvailable?: string }[];
  shortenedBy?: { symbol: string; firstAvailable: string }[];
  series?: {
    id: string;
    points: { date: string; value: number; dollars: string; growth: string }[];
    ending: string;
    change: string;
    totalReturn: string;
    difference?: string;
    drawdown: string;
  }[];
};
