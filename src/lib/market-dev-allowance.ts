import { MARKET_BUDGET } from "./market-budget.ts";

// Owner-approved bounded local test headroom; never changes hosted/production budgets.
export function developmentIoAllowance(
  env: Record<string, string | undefined>,
  month: string,
): number {
  if (
    env.NODE_ENV !== "development" ||
    env.TIKR_MARKET_HOSTED_ORIGIN !== undefined
  )
    return MARKET_BUDGET.monthlyIoBytes;
  const reviewedMonth = env.TIKR_DEV_IO_ALLOWANCE_MONTH,
    amount = env.TIKR_DEV_IO_ALLOWANCE_BYTES;
  if (!reviewedMonth && !amount) return MARKET_BUDGET.monthlyIoBytes;
  if (
    !reviewedMonth ||
    !/^\d{4}-\d{2}$/.test(reviewedMonth) ||
    !amount ||
    !/^\d+$/.test(amount)
  )
    throw Error("ADMISSION_CONFIG");
  const bytes = Number(amount);
  if (
    !Number.isSafeInteger(bytes) ||
    bytes < MARKET_BUDGET.monthlyIoBytes ||
    bytes > 750_000_000
  )
    throw Error("ADMISSION_CONFIG");
  return reviewedMonth === "2026-11" && reviewedMonth === month
    ? bytes
    : MARKET_BUDGET.monthlyIoBytes;
}
