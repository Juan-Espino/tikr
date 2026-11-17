import { state } from "./state";
import { equalWeights } from "../../src/lib/demo";
if (new URLSearchParams(location.search).has("shared-refresh")) {
  state.account = "synthetic-refresh";
  state.rows = [
    ["war", ["PLTR", "RTX", "BA", "LMT", "NOC"]],
    ["burger", ["MCD", "RRBG", "QSR"]],
    ["buffet", ["AAPL", "KO", "USB", "BAC", "AXP", "KHC"]],
    ["meme", ["RBLX", "GME", "AMC"]],
  ].map(([name, symbols], index) => ({
    _id: `synthetic-refresh-${index}`,
    _creationTime: 1,
    ownerId: state.account,
    clientId: `refresh-${index}`,
    definition: {
      name,
      holdings: equalWeights(symbols as string[]),
      manual: false,
      pinned: false,
      amount: "10000",
      range: "YTD",
      rangeChoice: "explicit",
    },
    normalizedName: name,
    revision: 1,
    created: 1,
    updated: 1,
    deleted: false,
  })) as typeof state.rows;
}

if (new URLSearchParams(location.search).has("shared-refresh")) {
  const observations = {
    errors: [] as string[],
    loadingSeen: false,
    complete: 0,
  };
  Object.assign(window, { __sharedRefreshQA: observations });
  new MutationObserver(() => {
    const text = document.body.innerText;
    if (/unavailable|couldn't load/i.test(text))
      observations.errors.push(text.slice(0, 500));
    if (text.includes("Loading history")) observations.loadingSeen = true;
    observations.complete = (text.match(/Synthetic QA data/g) ?? []).length;
  }).observe(document.body, { subtree: true, childList: true });
  const select = () => {
    const button = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "YTD",
    );
    if (button) button.click();
    else requestAnimationFrame(select);
  };
  requestAnimationFrame(select);
}
