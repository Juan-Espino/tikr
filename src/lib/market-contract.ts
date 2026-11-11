import { validTicker } from "./asset-catalog.ts";
import { z } from "zod";
import { allocation, validAmount } from "./demo";
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
  status: "ready" | "refreshing" | "stale" | "blocked";
  code?: string;
  retryAt?: number;
  asOf?: string;
  evidenceExpiresAt?: string;
  dataQuality?: "personal-provisional" | "reviewed";
  assetReturns?: Record<string, string>;
  dataCheckedAt?: string;
  period?: { start: string; end: string };
  requested?: { start: string; end: string };
  issues?: { symbol: string; code: string }[];
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
