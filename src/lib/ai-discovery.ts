import { z } from "zod";

export const DISCOVERY = {
  maxPrompt: 500,
  dailyLimit: 20,
  maxCandidates: 6,
  model: "openai/gpt-oss-20b",
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
      assets: { ticker: string; name: string; why: string }[];
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

// AI explanations are suggestions, never independently verified sector metadata.
const boundedText = (max: number) => z.string().trim().min(1).max(max);
export const candidateResponse = z
  .object({
    kind: z.enum(["results", "clarification", "empty"]),
    summary: boundedText(240),
    candidates: z
      .array(
        z.object({ ticker: boundedText(16), why: boundedText(180) }).strict(),
      )
      .max(DISCOVERY.maxCandidates),
    question: z.string().max(160),
    answers: z.array(boundedText(80)).max(3),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.kind === "results" &&
      (!value.candidates.length || value.question || value.answers.length)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid result shape",
      });
    if (
      value.kind === "clarification" &&
      (value.candidates.length ||
        !value.question.trim() ||
        value.answers.length < 2)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid clarification",
      });
    if (
      value.kind === "empty" &&
      (value.candidates.length || value.question || value.answers.length)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid empty response",
      });
  });
export type DiscoveryCandidates = z.infer<typeof candidateResponse>;
