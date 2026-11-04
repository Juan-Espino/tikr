// Independent exact arithmetic used only by the bounded validation cases.
// The engine uses decimal.js; this oracle uses reduced BigInt fractions.
function gcd(a, b) {
  a = a < 0n ? -a : a;
  while (b) [a, b] = [b, a % b];
  return a;
}
export function fraction(n, d = 1n) {
  if (d === 0n) throw new Error("Zero denominator");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
export function decimal(text) {
  if (
    typeof text !== "string" ||
    text.length > 2000 ||
    !/^-?\d+(\.\d+)?$/.test(text)
  )
    throw new Error("Invalid oracle decimal");
  const [whole, tail = ""] = text.split(".");
  return fraction(BigInt(whole + tail), 10n ** BigInt(tail.length));
}
export const plus = (a, b) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
export const minus = (a, b) => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
export const times = (a, b) => fraction(a.n * b.n, a.d * b.d);
export const over = (a, b) => fraction(a.n * b.d, a.d * b.n);
export const compare = (a, b) =>
  a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
export const exact = (a) => `${a.n}/${a.d}`;
const one = fraction(1n),
  zero = fraction(0n);
export function closeEnough(actual, expected) {
  const difference = minus(decimal(actual), expected);
  const absolute = fraction(
    difference.n < 0n ? -difference.n : difference.n,
    difference.d,
  );
  const magnitude = fraction(
    expected.n < 0n ? -expected.n : expected.n,
    expected.d,
  );
  const tolerance = plus(
    decimal("0.000000000000000000000000000001"),
    times(magnitude, decimal("0.00000000000000000000000000000001")),
  );
  return compare(absolute, tolerance) <= 0;
}
// Closed-form share counts. Bounded cases allow at most one dividend per asset.
// This deliberately does not duplicate the engine's mutable receivable loop.
export function holdingOracle(symbol, prices, sessions, amount, actions) {
  const start = sessions[0];
  const initial = over(decimal(amount), decimal(prices[start]));
  const relevant = actions.filter((a) => a.symbol === symbol && a.date > start);
  const splits = relevant.filter((a) => a.kind !== "cash_dividends");
  const dividends = relevant.filter((a) => a.kind === "cash_dividends");
  if (dividends.length > 1)
    throw new Error("Oracle case supports one dividend per asset");
  const splitFactor = (from, through) =>
    splits
      .filter((a) => a.date > from && a.date <= through)
      .reduce(
        (factor, a) =>
          times(factor, over(decimal(a.numerator), decimal(a.denominator))),
        one,
      );
  const distribution = dividends[0];
  const payment =
    distribution && sessions.find((day) => day >= distribution.paymentDate);
  const entitlement = distribution
    ? times(
        times(initial, splitFactor(start, distribution.date)),
        decimal(distribution.amount),
      )
    : zero;
  const points = sessions.map((day) => {
    let shares = times(initial, splitFactor(start, day));
    if (distribution && distribution.date <= day && payment && payment <= day)
      shares = plus(
        shares,
        times(
          over(entitlement, decimal(prices[payment])),
          splitFactor(payment, day),
        ),
      );
    const receivable =
      distribution && distribution.date <= day && (!payment || payment > day)
        ? entitlement
        : zero;
    return {
      date: day,
      shares,
      receivable,
      value: plus(times(shares, decimal(prices[day])), receivable),
    };
  });
  let peak = points[0].value,
    drawdown = zero;
  for (const point of points) {
    if (compare(point.value, peak) > 0) peak = point.value;
    const decline = minus(over(point.value, peak), one);
    if (compare(decline, drawdown) < 0) drawdown = decline;
  }
  const last = points.at(-1);
  return {
    points,
    shares: last.shares,
    ending: last.value,
    totalReturn: minus(over(last.value, decimal(amount)), one),
    drawdown,
  };
}
