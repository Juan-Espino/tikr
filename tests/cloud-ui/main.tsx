import "./guest-scenarios";
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
    <App />
    <Toaster />
  </StrictMode>,
);
