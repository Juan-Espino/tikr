import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import {
  DISCOVERY,
  validateDiscoveryPrompt,
  type DiscoveryResponse,
  type DiscoveryUsage,
} from "../src/lib/ai-discovery";
import { validTicker, type CatalogAsset } from "../src/lib/asset-catalog";
import { requestDiscoveryCandidates } from "../src/lib/discovery-provider";
import { responseValidator } from "./discoveryFields";

export const search = action({
  args: { prompt: v.string(), requestId: v.string(), sessionFence: v.string() },
  returns: responseValidator,
  handler: async (ctx, args): Promise<DiscoveryResponse> => {
    // Authentication is checked even when inference is disabled. Never trust a
    // browser-provided account ID or its displayed allowance.
    let usage: DiscoveryUsage = await ctx.runQuery(api.discoveryQuota.usage, {
      sessionFence: args.sessionFence,
    });
    let prompt: string;
    try {
      prompt = validateDiscoveryPrompt(args.prompt);
    } catch {
      return {
        usage,
        result: {
          kind: "error",
          message: `Enter a description of 1 to ${DISCOVERY.maxPrompt} characters.`,
        },
      };
    }
    if (
      process.env.TIKR_AI_DISCOVERY_ENABLED !== "explicit" ||
      !process.env.GROQ_API_KEY
    )
      return {
        usage,
        result: {
          kind: "unavailable",
          message:
            "AI discovery is not available yet. Use ticker or company search.",
        },
      };
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(prompt),
    );
    const promptHash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const reserved = await ctx.runMutation(internal.discoveryQuota.reserve, {
      sessionFence: args.sessionFence,
      requestId: args.requestId,
      promptHash,
    });
    if (reserved.kind !== "reserved") {
      usage = await ctx.runQuery(api.discoveryQuota.usage, {
        sessionFence: args.sessionFence,
      });
      return {
        usage,
        result:
          reserved.kind === "limit"
            ? {
                kind: "limit",
                message:
                  "You have used today's AI searches. Ticker search is still available.",
              }
            : {
                kind: "error",
                message:
                  reserved.kind === "busy"
                    ? "An AI search is already running. Please wait for it to finish."
                    : "This request was already submitted. Submit again to start a new search.",
              },
      };
    }
    try {
      // Preflight cached availability before spending model tokens.
      await ctx.runMutation(internal.discoveryCatalog.lookup, {
        tickers: ["SPY"],
      });
      const candidates = await requestDiscoveryCandidates(prompt, {
        apiKey: process.env.GROQ_API_KEY,
        fetch,
      });
      let result: DiscoveryResponse["result"];
      if (candidates.kind === "clarification") {
        result = {
          kind: "clarification",
          question: candidates.question,
          answers: candidates.answers,
        };
      } else if (candidates.kind === "empty") {
        result = { kind: "empty", message: candidates.summary };
      } else {
        const tickers = [
          ...new Set(
            candidates.candidates
              .map((c) => c.ticker.trim().toUpperCase())
              .filter(validTicker),
          ),
        ];
        const catalog: CatalogAsset[] = await ctx.runMutation(
          internal.discoveryCatalog.lookup,
          { tickers },
        );
        const assets = catalog.map((asset) => ({
          ticker: asset.ticker,
          name: asset.name,
          why: candidates.candidates.find(
            (c) => c.ticker.trim().toUpperCase() === asset.ticker,
          )!.why,
        }));
        result = assets.length
          ? {
              kind: "results",
              summary: `AI-suggested matches. ${candidates.summary}`,
              assets,
            }
          : {
              kind: "empty",
              message:
                "No supported assets matched these AI suggestions. Refine your description or use ticker search.",
            };
      }
      const committed = await ctx.runMutation(internal.discoveryQuota.finish, {
        receipt: reserved.receipt,
        success: true,
        sessionFence: args.sessionFence,
      });
      if (!committed) throw Error("REQUEST_EXPIRED");
      usage = await ctx.runQuery(api.discoveryQuota.usage, {
        sessionFence: args.sessionFence,
      });
      return { usage, result };
    } catch (error) {
      // A failed/lost session cannot expose late results. Private settlement only
      // releases this server-created reservation; it cannot charge another account.
      await ctx.runMutation(internal.discoveryQuota.finish, {
        receipt: reserved.receipt,
        success: false,
        sessionFence: args.sessionFence,
      });
      usage = await ctx.runQuery(api.discoveryQuota.usage, {
        sessionFence: args.sessionFence,
      });
      const limited =
        error instanceof Error && error.message === "PROVIDER_LIMIT";
      return {
        usage,
        result: {
          kind: "unavailable",
          message: limited
            ? "AI discovery is temporarily at capacity. Please try later or use ticker search."
            : "AI discovery could not complete this search. Your allowance was not used. Try again or use ticker search.",
        },
      };
    }
  },
});
