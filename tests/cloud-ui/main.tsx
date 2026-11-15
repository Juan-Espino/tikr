import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { DemoPortfoliosProvider } from "../../src/providers/demo-portfolios-provider";
import Dashboard from "../../src/app/dashboard/_components/dashboard";
import PortfolioPage from "../../src/app/portfolio/[id]/_components/portfolio-page";
import { qa, subscribe, version } from "./state";
import "../../src/styles/globals.css";
window.__cloudQA = qa;
function App() {
  useSyncExternalStore(subscribe, version, version);
  const id = location.pathname.startsWith("/portfolio/")
    ? location.pathname.split("/")[2]
    : null;
  return (
    <DemoPortfoliosProvider>
      {id ? <PortfolioPage id={id} /> : <Dashboard />}
    </DemoPortfoliosProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
