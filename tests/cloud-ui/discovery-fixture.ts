import type { DiscoveryAdapter } from "../../src/components/ai-asset-search";
// Illustrative matches only. No catalog/sector verification or network requests.
export const discoveryFixture: DiscoveryAdapter = async ({
  prompt,
  signal,
}) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      resolve,
      prompt.toLowerCase().includes("slow") ? 1800 : 650,
    );
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("Cancelled"));
      },
      { once: true },
    );
  });
  const q = prompt.toLowerCase();
  if (q.includes("error"))
    return {
      kind: "error",
      message: "Sample search failed. Edit and resubmit or use ticker search.",
    };
  if (q.includes("unavailable"))
    return {
      kind: "unavailable",
      message: "Sample AI unavailable. Ticker search remains available.",
    };
  if (q.includes("limit"))
    return {
      kind: "limit",
      message:
        "Preview limit state only — no product quota has been approved. Use ticker search.",
    };
  if (q.includes("no match"))
    return {
      kind: "empty",
      message: "No sample matches. Try another description or ticker search.",
    };
  if (q === "energy")
    return {
      kind: "clarification",
      question: "Which part of energy do you mean?",
      answers: ["Generation", "Equipment"],
    };
  return {
    kind: "results",
    summary: `Illustrative sample rows for this prompt. Not verified catalog or industry evidence.`,
    assets: [
      {
        ticker: "NVDA",
        name: "NVIDIA",
        why: "Illustrative match: computing hardware for a data-center prompt.",
      },
      {
        ticker: "MSFT",
        name: "Microsoft",
        why: "Illustrative match: cloud infrastructure for a data-center prompt.",
      },
      {
        ticker: "AAPL",
        name: "Apple",
        why: "Sample row to review selection behavior; not a verified theme match.",
      },
    ],
  };
};
