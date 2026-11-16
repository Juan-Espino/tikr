import "./guest-scenarios";
import { assets } from "../../src/lib/demo";
import { searchCatalog } from "../../src/lib/asset-catalog";
// Standalone review has no API server. Keep normal search usable with explicitly
// labeled local samples, without altering the production search source contract.
if (
  new URLSearchParams(location.search).has("ai-preview") &&
  !new URLSearchParams(location.search).has("network-qa")
) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      location.href,
    );
    if (url.origin === location.origin && url.pathname === "/api/assets") {
      if (init?.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      return Response.json(
        searchCatalog(
          assets.map((a) => ({
            ticker: a.ticker,
            name: a.name,
            exchange: "Sample",
          })),
          url.searchParams.get("q") ?? "",
        ),
        { headers: { "X-Tikr-Catalog": "sample" } },
      );
    }
    return originalFetch(input, init);
  };
}
import { DiscoveryPreview } from "../../src/components/ai-asset-search";
import { discoveryFixture } from "./discovery-fixture";
import { DiscoveryProvider } from "../../src/providers/discovery-provider";
import { discoveryQA } from "./discovery-client";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import {
  DemoPortfoliosProvider,
  useDemoPortfolios,
} from "../../src/providers/demo-portfolios-provider";
import { Toaster } from "../../src/components/ui/sonner";
import SignInPage from "../../src/app/sign-in/_components/sign-in-page";
import Dashboard from "../../src/app/dashboard/_components/dashboard";
import PortfolioPage from "../../src/app/portfolio/[id]/_components/portfolio-page";
import { qa, subscribe, version } from "./state";
import "../../src/styles/globals.css";
window.__cloudQA = qa;
window.__discoveryQA = discoveryQA;
function Probe() {
  const store = useDemoPortfolios();
  window.__portfolioStore = store;
  return null;
}
declare global {
  interface Window {
    __portfolioStore: ReturnType<typeof useDemoPortfolios>;
  }
}
function App() {
  useSyncExternalStore(subscribe, version, version);
  const id = location.pathname.startsWith("/portfolio/")
    ? location.pathname.split("/")[2]
    : null;
  return (
    <DemoPortfoliosProvider>
      <Probe />
      {id ? (
        <PortfolioPage id={id} />
      ) : location.pathname === "/sign-in" ? (
        <SignInPage />
      ) : (
        <Dashboard />
      )}
    </DemoPortfoliosProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DiscoveryPreview.Provider
      value={
        new URLSearchParams(location.search).has("ai-preview")
          ? discoveryFixture
          : null
      }
    >
      {new URLSearchParams(location.search).has("ai-backend") ? (
        <DiscoveryProvider>
          <App />
        </DiscoveryProvider>
      ) : (
        <App />
      )}
    </DiscoveryPreview.Provider>
    <Toaster />
  </StrictMode>,
);
