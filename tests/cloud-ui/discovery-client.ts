// Standalone browser proof for the production client adapter. This module lives
// outside app routes; every response is synthetic, never an inference request.
import { state } from "./state";
import type {
  DiscoveryResponse,
  DiscoveryUsage,
} from "../../src/lib/ai-discovery";
import { DISCOVERY, discoveryDay } from "../../src/lib/ai-discovery";

let remaining = 20;
let held = false;
let release: (() => void) | null = null;
const calls: Record<string, unknown>[] = [];
const usage = (): DiscoveryUsage => ({
  limit: 20,
  remaining,
  resetAt: discoveryDay(Date.now()).resetAt,
});
export const discoveryClient = {
  query: async () => usage(),
  action: async (
    _fn: unknown,
    args: Record<string, unknown>,
  ): Promise<DiscoveryResponse> => {
    calls.push(args);
    if (!state.account || args.sessionFence !== `session-${state.account}`)
      throw Error("SIGN_IN_REQUIRED");
    if (held)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    if (String(args.prompt).length > DISCOVERY.maxPrompt)
      throw Error("INVALID_PROMPT");
    remaining--;
    return {
      usage: usage(),
      result: {
        kind: "results",
        summary: "Synthetic backend-adapter result",
        assets: [
          {
            ticker: "NVDA",
            name: "Synthetic canonical NVIDIA",
            why: "Synthetic AI suggestion for adapter verification.",
          },
        ],
      },
    };
  },
};
export const discoveryQA = {
  calls: () => calls,
  hold: () => {
    held = true;
  },
  release: () => {
    held = false;
    release?.();
    release = null;
  },
};
declare global {
  interface Window {
    __discoveryQA: typeof discoveryQA;
  }
}
