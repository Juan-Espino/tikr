import { z } from "zod";

export const DISCOVERY = {
  maxPrompt: 500,
  dailyLimit: 20,
  maxCandidates: 6,
  model: "openai/gpt-oss-120b",
  maxCompletionTokens: 1024,
  timeoutMs: 15_000,
  leaseMs: 30_000,
  receiptMs: 2 * 86_400_000,
} as const;

export type DiscoveryUsage = {
  limit: number;
  remaining: number;
  resetAt: number;
};
export type DiscoveryResult =
  | {
      kind: "results";
      summary: string;
      assets: { ticker: string; name: string }[];
    }
  | { kind: "clarification"; question: string; answers: string[] }
  | { kind: "empty" | "error" | "unavailable" | "limit"; message: string };
export type DiscoveryResponse = {
  result: DiscoveryResult;
  usage: DiscoveryUsage | null;
};
export type DiscoveryAdapter = (request: {
  prompt: string;
  signal: AbortSignal;
}) => Promise<DiscoveryResult>;

export function validateDiscoveryPrompt(prompt: string) {
  if (
    !prompt.trim() ||
    prompt.length > DISCOVERY.maxPrompt ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(prompt)
  )
    throw Error("INVALID_PROMPT");
  return prompt.trim();
}
export function discoveryDay(now: number) {
  const day = new Date(now).toISOString().slice(0, 10);
  return { day, resetAt: Date.parse(`${day}T00:00:00Z`) + 86_400_000 };
}

// The model supplies candidate symbols only. Catalog data supplies display names.
const boundedText = (max: number) => z.string().trim().min(1).max(max);
export const candidateResponse = z
  .object({
    kind: z.enum(["results", "clarification", "empty"]),
    summary: z.string().trim().max(240),
    tickers: z.array(boundedText(16)).max(DISCOVERY.maxCandidates),
    question: z.string().max(160),
    answers: z.array(boundedText(80)).max(3),
  })
  .strict()
  .superRefine((value, ctx) => {
    const invalid =
      value.kind === "results"
        ? !value.tickers.length ||
          !!value.summary ||
          !!value.question ||
          !!value.answers.length
        : value.kind === "clarification"
          ? !!value.tickers.length ||
            !value.question.trim() ||
            value.answers.length < 2
          : !!value.tickers.length ||
            !value.summary ||
            !!value.question ||
            !!value.answers.length;
    if (invalid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid discovery shape",
      });
  });
export type DiscoveryCandidates = z.infer<typeof candidateResponse>;
