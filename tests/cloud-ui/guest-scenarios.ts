// Runs only inside the isolated synthetic harness, through integrated preview or Playwright.
const sleep = () => new Promise((resolve) => setTimeout(resolve, 80));
function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(label);
}
async function until(fn: () => boolean, label: string) {
  for (let i = 0; i < 60; i++) {
    if (fn()) return;
    await sleep();
  }
  throw new Error(label);
}
const button = (name: string) =>
  [...document.querySelectorAll("button")].find(
    (b) => (b.getAttribute("aria-label") || b.textContent?.trim()) === name,
  );
async function click(name: string) {
  const b = button(name);
  check(b, `Missing button: ${name}`);
  check(!b.disabled, `Disabled: ${name}`);
  b.click();
  await sleep();
}
async function input(id: string, value: string) {
  const e = document.getElementById(id) as HTMLInputElement;
  check(e, `Missing input ${id}`);
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!.call(e, value);
  e.dispatchEvent(new Event("input", { bubbles: true }));
  await sleep();
}
const text = () => document.body.innerText;
const legacy = () => localStorage.getItem("tikr-demo-v1");
const trial = () =>
  JSON.parse(localStorage.getItem("tikr-trial-v1") || "null") as {
    draft: { id: string; name: string; amount: string };
    owner: string | null;
  } | null;
const passed: string[] = [];
export async function guestScenarios(stage: string) {
  const qa = window.__cloudQA;
  const start = passed.length;
  if (stage === "guest") {
    if (!document.querySelector('[role="dialog"]:not([data-closed])'))
      await click("Edit");
    await input("portfolio-name", "");
    await click("Done");
    check(
      document
        .getElementById("portfolio-name")
        ?.getAttribute("aria-invalid") === "true",
      "submit-time blank name",
    );
    await input("portfolio-name", "Synthetic trial");
    await input("allocation-SPY", "0");
    check(text().includes("positive weights"), "invalid allocation feedback");
    await click("Equal weights");
    await input("portfolio-amount", "0");
    check(text().includes("Enter $0.01"), "invalid cash feedback");
    await input("portfolio-amount", "12345");
    await click("Done");
    await until(
      () => !document.querySelector('[role="dialog"]:not([data-closed])'),
      "editor closes",
    );
    check(
      text().includes("Synthetic market fixture"),
      "guest results available",
    );
    const id = trial()!.draft.id;
    await click("Sign in to save");
    check(location.pathname === "/sign-in", "safe sign-in entry");
    check(
      new URLSearchParams(location.search).get("returnTo") ===
        `/portfolio/${id}`,
      "specific draft return",
    );
    await click("Continue as guest");
    check(location.pathname === `/portfolio/${id}`, "cancel returns to draft");
    await click("Create portfolio");
    check(text().includes("Replace your unsaved draft?"), "replacement dialog");
    await click("Cancel");
    check(trial()!.draft.id === id, "replacement cancellation");
    passed.push(
      "guest allocation/cash/name validation, results, specific sign-in/cancel return and replacement cancellation",
    );
  }
  if (stage === "cloud") {
    qa.account("A");
    await until(() => !!button("Create in account"), "cloud session");
    check(qa.rows().length === 0, "no autosave");
    qa.fail("NAME_CONFLICT");
    await click("Create in account");
    await until(
      () => !!document.querySelector('[role="dialog"]:not([data-closed])'),
      "collision editor",
    );
    check(text().includes("already exists"), "collision feedback");
    await input("portfolio-name", "Synthetic resolved");
    await click("Done");
    qa.account("B");
    await sleep();
    check(
      !text().includes("Synthetic resolved"),
      "B cannot restore A-bound trial",
    );
    qa.account("A");
    await sleep();
    check(text().includes("Synthetic resolved"), "A resumes bound trial");
    qa.expiresAt(Date.now() - 1);
    await sleep();
    check(
      !text().includes("Synthetic resolved"),
      "expired session hides bound recovery",
    );
    qa.account("A");
    await sleep();
    check(text().includes("Synthetic resolved"), "trial survives expiration");
    check(qa.rows().length === 0, "session transitions never autosave");
    const beforeReplacement = window.__portfolioStore.draft!;
    void window.__portfolioStore.open({
      ...beforeReplacement,
      id: crypto.randomUUID(),
      name: "Replacement fixture",
    });
    await until(() => !!button("Replace draft"), "replacement confirmation");
    const newerRecovery = JSON.parse(
      localStorage.getItem("tikr-trial-v1")!,
    ) as { draft: { amount: string } };
    newerRecovery.draft.amount = "12347";
    localStorage.setItem("tikr-trial-v1", JSON.stringify(newerRecovery));
    await click("Replace draft");
    check(
      window.__portfolioStore.draft?.id === beforeReplacement.id &&
        trial()?.draft.amount === "12347",
      "replacement preserves intervening tab changes",
    );
    qa.account("B");
    await sleep();
    qa.account("A");
    await sleep();
    qa.online(false);
    await sleep();
    await click("Create in account");
    check(text().includes("Cloud saving is unavailable"), "offline refusal");
    check(qa.rows().length === 0, "no local fallback/cloud write");
    qa.online(true);
    await sleep();
    qa.hold();
    await click("Retry save");
    check(text().includes("Saving"), "pending feedback");
    check(button("Saving…")?.disabled, "double-click disabled");
    qa.release();
    await until(() => location.pathname === "/dashboard", "acknowledged save");
    check(qa.rows().length === 1, "one cloud row");
    check(text().includes("Saved to your account"), "truthful acknowledgement");
    check(trial() === null, "correct draft settled");
    const savedToast = [
      ...document.querySelectorAll("[data-sonner-toast]"),
    ].find((node) => node.textContent?.includes("Saved to your account"));
    check(
      savedToast &&
        !savedToast.querySelector("button") &&
        savedToast.getAttribute("data-dismissible") === "false",
      "automatic toast without dismiss control",
    );

    check(
      !text().includes("Read-only starting points"),
      "signed in examples hidden",
    );
    check(
      !text().includes("Resume draft:"),
      "saved portfolio has no resume draft",
    );
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("Synthetic unavailable browser storage");
    };
    try {
      await click("Open Synthetic resolved, 3 assets");
    } finally {
      Storage.prototype.getItem = getItem;
    }
    check(
      text().includes("Synthetic resolved"),
      "cloud opening works without browser recovery storage",
    );
    await click("Edit");
    await input("portfolio-name", "Private unsaved edit");
    await click("Done");
    check(trial() === null, "private cloud edits never persisted as trial");
    qa.sessionFailure(true);
    await sleep();
    check(
      !text().includes("Private unsaved edit"),
      "session-error hides private view",
    );
    qa.sessionFailure(false);
    await sleep();
    check(
      text().includes("Private unsaved edit"),
      "transient session restores in-tab edit",
    );
    qa.account("B");
    await sleep();
    check(!text().includes("Private unsaved edit"), "B cannot see A edits");
    check(text().includes("Portfolio not found"), "B cannot open A ID");
    qa.account("");
    await sleep();
    check(!text().includes("Private unsaved edit"), "guest cannot see A edits");
    passed.push(
      "mocked login explicit save, collision, offline/retry/pending, single acknowledgement, draft settlement, private cache and A/B/guest isolation",
    );
  }
  if (stage === "originals") {
    const example = {
      id: "example-1",
      name: "tamper",
      holdings: [{ ticker: "SPY", weight: "100.00" }],
      manual: false,
      pinned: false,
      updated: 0,
      amount: "10000",
      range: "1W",
      rangeChoice: "default",
    } as const;
    for (const account of ["", "A"]) {
      qa.account(account);
      await sleep();
      const store = window.__portfolioStore;
      const before = JSON.stringify(qa.rows());
      store.setDraft({ ...example, holdings: [...example.holdings] });
      store.pin({ ...example, holdings: [...example.holdings] });
      store.save({ ...example, holdings: [...example.holdings] });
      await store.remove({ ...example, holdings: [...example.holdings] });
      store.open({ ...example, holdings: [...example.holdings] });
      await sleep();
      check(
        text().includes("Read-only original"),
        "original source resolved centrally",
      );
      check(
        !button("Edit") &&
          !button("Create in account") &&
          !button("Duplicate") &&
          !button("Delete"),
        "no original mutation controls",
      );
      check(
        JSON.stringify(qa.rows()) === before,
        "provider mutations refuse originals",
      );
    }
    qa.account("");
    await sleep();
    passed.push(
      "guest and signed-in example originals centrally refuse setDraft/save/pin/delete and resolve canonical URL contents",
    );
  }
  return {
    synthetic: true,
    passed: passed.slice(start),
    path: location.pathname,
    legacy: legacy(),
    trial: trial(),
    errors: window.__guestErrors,
  };
}
declare global {
  interface Window {
    __guestScenarios: typeof guestScenarios;
    __guestErrors: string[];
  }
}
window.__guestScenarios = guestScenarios;
window.__guestErrors = [];
window.addEventListener("error", (e) => window.__guestErrors.push(e.message));
