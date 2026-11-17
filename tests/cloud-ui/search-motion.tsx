// Isolated test-only mount, imported explicitly by the motion browser check.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  AnimatedSearchRows,
  SearchResultsViewport,
} from "../../src/components/animated-search-results";
import {
  AiAssetSearch,
  DiscoveryAllowance,
} from "../../src/components/ai-asset-search";

export function mountMotionQA() {
  document.getElementById("root")!.style.display = "none";
  const host = document.createElement("div");
  document.body.append(host);
  function Fixture() {
    const [ids, setIds] = useState<string[]>([]);
    const [remaining, setRemaining] = useState(6);
    const [allowanceOnly, setAllowanceOnly] = useState(false);
    Object.assign(window, {
      __motionQA: {
        rows: setIds,
        remaining: setRemaining,
        allowance: () => setAllowanceOnly(true),
      },
    });
    if (allowanceOnly)
      return (
        <DiscoveryAllowance
          value={{ remaining, limit: 20, resetAt: Date.now() + 3600000 }}
        >
          <AiAssetSearch
            signedIn
            selected={[]}
            onAdd={() => undefined}
            normal={<input aria-label="Search assets" />}
            normalResults={null}
          />
        </DiscoveryAllowance>
      );
    return (
      <div
        role="dialog"
        className="dialog-popup portfolio-editor-dialog bg-card fixed top-1/2 left-1/2 w-[calc(100%_-_2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl p-6"
        style={{ maxHeight: "90dvh" }}
      >
        <h2>Isolated search motion</h2>
        <input aria-label="Fixed search" className="my-4 h-12" />
        <section>
          <SearchResultsViewport>
            <AnimatedSearchRows
              className="grid gap-2 sm:grid-cols-2"
              items={ids.map((id) => ({
                key: id,
                content: (
                  <button
                    className="w-full rounded-lg border p-4 text-left"
                    onClick={() => undefined}
                  >
                    {id} — Synthetic asset
                  </button>
                ),
              }))}
            />
          </SearchResultsViewport>
        </section>
        <section data-editor-allocation className="mt-6 border-t pt-5">
          <h3>Allocation</h3>
          <p>Existing controls remain visible.</p>
        </section>
        <footer className="mt-5 py-4">Done</footer>
      </div>
    );
  }
  createRoot(host).render(<Fixture />);
}
