import { createFixture, portfolios } from "../tests/support/market-fixture.ts";
const results = [];
for (const mode of ["before", "after"]) {
  const fixture = createFixture(mode, `matrix-${mode}`);
  let hints = [];
  const steps = [
    ["cold", "5Y"],
    ["warm", "5Y"],
    ["switch-1W", "1W"],
    ["switch-1M", "1M"],
    ["switch-YTD", "YTD"],
    ["switch-1Y", "1Y"],
    ["amount-weights", "1Y"],
    ["overlap-add", "1Y"],
    ["remove-holding", "1Y"],
    ["remove-comparison", "1Y"],
    ["restart", "1Y"],
    ["next-day", "5Y"],
  ];
  for (const [name, range] of steps) {
    if (name === "restart") fixture.restart();
    if (name === "next-day") fixture.setNow("2026-11-12T15:00:00Z");
    const before = { ...fixture.database, ...fixture.provider };
    const selected = structuredClone(
      name === "remove-comparison" ? [portfolios[0]] : portfolios,
    );
    if (name === "amount-weights")
      selected[0].holdings.forEach(
        (holding, index) => (holding.weight = index === 0 ? "50" : "25"),
      );
    if (name === "overlap-add") {
      selected[1].holdings.push({ symbol: "AAA", weight: "25" });
      selected[1].holdings.forEach((holding) => (holding.weight = "25"));
    }
    if (name === "remove-holding") {
      selected[0].holdings.pop();
      selected[0].holdings.forEach((holding) => (holding.weight = "50"));
    }
    const request = {
      portfolios: selected,
      amount: name === "amount-weights" ? "12345.67" : "10000",
    };
    const result = await fixture.run(request, range, false, hints);
    hints = [
      ...new Map(
        [...hints, ...result.history].map((row) => [row.key, row]),
      ).values(),
    ];
    if (!result.final.result)
      throw Error(`${mode}/${name}: ${result.final.code}`);
    const after = { ...fixture.database, ...fixture.provider };
    results.push({
      mode,
      scenario: name,
      status: result.final.status,
      period: result.final.result.actual,
      ...Object.fromEntries(
        Object.keys(after).map((key) => [key, after[key] - before[key]]),
      ),
    });
  }
}
for (const mode of ["before", "after"]) {
  const fixture = createFixture(mode, `expansion-${mode}`);
  let hints = [];
  for (const range of ["1W", "1M", "YTD", "1Y", "5Y"]) {
    const before = { ...fixture.database, ...fixture.provider };
    const result = await fixture.run(
      { portfolios, amount: "10000" },
      range,
      false,
      hints,
    );
    if (!result.final.result)
      throw Error(`${mode}/expand-${range}: ${result.final.code}`);
    hints = [
      ...new Map(
        [...hints, ...result.history].map((row) => [row.key, row]),
      ).values(),
    ];
    const after = { ...fixture.database, ...fixture.provider };
    results.push({
      mode,
      scenario: "expand-" + range,
      status: result.final.status,
      period: result.final.result.actual,
      ...Object.fromEntries(
        Object.keys(after).map((key) => [key, after[key] - before[key]]),
      ),
    });
  }
}
console.log(
  JSON.stringify(
    {
      scope:
        "Synthetic application requests/pages, received body bytes and storage gateway operations; not provider or Convex billing. See separate convex-test database API observations.",
      results,
    },
    null,
    2,
  ),
);
