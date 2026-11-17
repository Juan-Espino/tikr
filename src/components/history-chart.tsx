"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, type Point } from "~/lib/demo";
export function HistoryChart({
  lines: incomingLines,
  amount,
  dollars = false,
  compact = false,
  table = true,
}: {
  lines: {
    name: string;
    id?: string;
    points: (Point & { dollars?: string; growth?: string })[];
    kind?: "benchmark" | "comparison";
    color?: string;
    exiting?: boolean;
  }[];
  amount: number;
  dollars?: boolean;
  compact?: boolean;
  table?: boolean;
}) {
  const id = useId();
  const previousLines = useRef(incomingLines);
  const [exiting, setExiting] = useState<typeof incomingLines>([]);
  const identity = JSON.stringify(
    incomingLines.map((line) => line.id ?? line.name),
  );
  const period = `${incomingLines[0]?.points[0]?.date ?? ""}:${incomingLines[0]?.points.at(-1)?.date ?? ""}:${incomingLines[0]?.points.length ?? 0}`;
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const active = new Set(incomingLines.map((line) => line.id ?? line.name));
    const primary = incomingLines[0]?.points ?? [];
    const removed = reduced
      ? []
      : previousLines.current
          .filter(
            (line) =>
              line.kind &&
              !line.exiting &&
              !active.has(line.id ?? line.name) &&
              line.points.length === primary.length &&
              line.points.every((point, i) => point.date === primary[i]?.date),
          )
          .map((line) => ({ ...line, exiting: true }));
    setExiting(removed);
    if (!removed.length) return;
    const timer = window.setTimeout(() => setExiting([]), 900);
    return () => window.clearTimeout(timer);
    // A line exits only when the displayed identities or shared dates change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, period]);
  useEffect(() => {
    previousLines.current = incomingLines;
  });
  const lines = [
    ...incomingLines,
    ...exiting.filter(
      (line) =>
        !incomingLines.some(
          (active) => (active.id ?? active.name) === (line.id ?? line.name),
        ) &&
        line.points.length === (incomingLines[0]?.points.length ?? 0) &&
        line.points.every(
          (point, i) => point.date === incomingLines[0]?.points[i]?.date,
        ),
    ),
  ];
  const firstValue = lines[0]?.points[0]?.value;
  const lastValue = lines[0]?.points.at(-1)?.value;
  const mainColor =
    firstValue === undefined ||
    lastValue === undefined ||
    lastValue === firstValue
      ? "#e7e5e4"
      : lastValue > firstValue
        ? "#34d399"
        : "#f87171";
  const data = (lines[0]?.points ?? []).map((p, i) => {
    const row: Record<string, string | number> = { date: p.date };
    lines.forEach((line, j) => {
      row[`dollars${j}`] = line.points[i]?.dollars ?? "";
      row[`growth${j}`] = line.points[i]?.growth ?? "";
      row[`line${j}`] = dollars
        ? line.points[i]!.value
        : (line.points[i]!.value / amount - 1) * 100;
    });
    return row;
  });
  return (
    <div
      aria-describedby={id}
      className={`history-chart w-full min-w-0 ${compact ? "flex h-full min-h-0 flex-col" : ""}`}
    >
      <div
        className={
          compact
            ? "pointer-events-none h-44 min-h-44 w-full shrink-0"
            : "h-72 w-full"
        }
      >
        <ResponsiveContainer
          width="100%"
          height={compact ? 176 : 288}
          minWidth={0}
        >
          <LineChart
            tabIndex={compact ? -1 : undefined}
            accessibilityLayer={!compact}
            data={data}
            margin={
              compact
                ? { top: 5, right: 0, bottom: 5, left: 0 }
                : { top: 10, right: 8, bottom: 5, left: 0 }
            }
          >
            <CartesianGrid vertical={false} stroke="#2b2b28" />
            <XAxis
              dataKey="date"
              minTickGap={compact ? 40 : 70}
              tickFormatter={(date: string) => (compact ? date.slice(5) : date)}
              tick={{ fill: "#a8a29e", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={compact ? 60 : 64}
              tick={{ fill: "#a8a29e", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(n: number) =>
                dollars
                  ? Math.abs(n) < 1000
                    ? money(n)
                    : `$${(n / 1000).toFixed(1)}k`
                  : `${Math.abs(n) < 1 ? Number(n.toPrecision(2)) : Number(n.toFixed(2))}%`
              }
            />
            {!compact && (
              <Tooltip
                content={({ active, payload, label }) => {
                  const primary = payload?.find(
                    (entry) => entry.dataKey === "line0",
                  );
                  if (!active || typeof primary?.value !== "number")
                    return null;
                  const formatter = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  });
                  return (
                    <div
                      className="bg-card text-foreground max-w-[min(360px,80vw)] rounded-lg border border-stone-500 p-3 text-sm shadow-lg"
                      role="status"
                    >
                      <p className="mb-2 font-mono text-xs text-stone-400">
                        {label}
                      </p>
                      <div className="space-y-3">
                        {lines.map((line, index) => {
                          if (line.kind === "benchmark" || line.exiting)
                            return null;
                          const entry = payload?.find(
                            (item) => item.dataKey === `line${index}`,
                          );
                          if (typeof entry?.value !== "number") return null;
                          const value = dollars
                            ? entry.value
                            : amount * (1 + entry.value / 100);
                          const growth = dollars
                            ? (entry.value / amount - 1) * 100
                            : entry.value;
                          return (
                            <div
                              key={line.id ?? line.name}
                              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1"
                            >
                              <span
                                className="min-w-0 break-words"
                                style={{
                                  color:
                                    line.kind === "comparison"
                                      ? line.color
                                      : mainColor,
                                }}
                              >
                                {line.name}
                              </span>
                              <span className="text-right tabular-nums">
                                {typeof (
                                  entry.payload as
                                    Record<string, unknown> | undefined
                                )?.[`dollars${index}`] === "string" &&
                                (entry.payload as Record<string, string>)[
                                  `dollars${index}`
                                ]
                                  ? `$${(entry.payload as Record<string, string>)[`dollars${index}`]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                                  : formatter.format(value)}
                              </span>
                              <span className="col-start-2 text-right text-xs text-stone-400">
                                {growth >= 0 ? "+" : ""}
                                {(
                                  entry.payload as
                                    Record<string, string> | undefined
                                )?.[`growth${index}`] ?? growth.toFixed(2)}
                                %
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
            )}
            {lines.map((l, i) => (
              <Line
                key={l.id ?? l.name}
                name={l.name}
                className={l.exiting ? "chart-line-exiting" : undefined}
                dataKey={`line${i}`}
                stroke={
                  l.kind === "comparison"
                    ? l.color
                    : l.kind === "benchmark"
                      ? "#a8a29e"
                      : mainColor
                }
                strokeDasharray={l.kind === "benchmark" ? "5 5" : undefined}
                strokeWidth={l.kind ? 1.5 : 2}
                dot={false}
                activeDot={!compact && i === 0 ? undefined : false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p
        id={id}
        className={`text-muted-foreground text-xs ${compact ? "pt-2" : ""}`}
      >
        {lines.map((l) => (
          <span
            key={l.id ?? l.name}
            className={`mr-4 inline-flex items-center gap-2 ${l.kind ? (l.exiting ? "benchmark-legend-exiting" : "benchmark-legend-entering") : ""}`}
          >
            <svg
              aria-hidden="true"
              width="22"
              height="8"
              viewBox="0 0 22 8"
              className="shrink-0"
            >
              <line
                x1="0"
                y1="4"
                x2="22"
                y2="4"
                stroke={
                  l.kind === "comparison"
                    ? l.color
                    : l.kind === "benchmark"
                      ? "#a8a29e"
                      : mainColor
                }
                strokeDasharray={l.kind === "benchmark" ? "6 2" : undefined}
                strokeWidth={l.kind ? 1.5 : 2}
              />
            </svg>
            <span className="sr-only">
              {l.kind === "benchmark" ? "Dashed line:" : "Solid line:"}{" "}
            </span>
            {l.name === "SPY ETF benchmark" ? "SPY" : l.name}
          </span>
        ))}
        {!compact && (
          <span className="sr-only">
            {dollars ? "USD value" : "Percentage growth"}. Hover, touch, or use
            arrow keys for portfolio and comparison values.
          </span>
        )}
      </p>
      {!compact && table && (
        <div className="sr-only">
          <div>
            <table className="w-full text-left">
              <caption className="text-left">
                Demo data: daily observations, including weekends
              </caption>
              <thead>
                <tr>
                  <th>Date</th>
                  {lines.map((l) => (
                    <th key={l.id ?? l.name}>
                      {l.name} ({dollars ? "USD" : "%"})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lines[0]?.points ?? []).map((p, i) => (
                  <tr key={p.date}>
                    <td>{p.date}</td>
                    {lines.map((l) => (
                      <td key={l.id ?? l.name}>
                        {dollars
                          ? money(l.points[i]!.value)
                          : ((l.points[i]!.value / amount - 1) * 100).toFixed(
                              2,
                            )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
