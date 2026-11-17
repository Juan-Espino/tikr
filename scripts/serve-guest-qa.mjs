// Isolated synthetic UI harness: no DEV/auth/provider requests.
import { createServer } from "vite";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname, "..");
const fixture = join(root, "tests/cloud-ui");
const refreshQA = process.argv.includes("--shared-refresh");
const market = refreshQA
  ? await import("../tests/support/market-fixture.ts")
  : undefined;
const fixtureMarket = market?.createFixture("after", "shared-refresh", {
  symbols: [
    "SPY",
    "PLTR",
    "RTX",
    "BA",
    "LMT",
    "NOC",
    "MCD",
    "RRBG",
    "QSR",
    "AAPL",
    "KO",
    "USB",
    "BAC",
    "AXP",
    "KHC",
    "RBLX",
    "GME",
    "AMC",
  ],
  delayMs: 1800,
});
const publicView = refreshQA
  ? (await import("../src/lib/market-runtime.ts")).publicView
  : undefined;
const server = await createServer({
  plugins: refreshQA
    ? [
        {
          name: "synthetic-shared-refresh",
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url?.startsWith("/api/market")) return next();
              try {
                let text = "";
                for await (const chunk of req) {
                  text += chunk;
                  if (text.length > 2_036_000) throw Error("LIMIT");
                }
                const input = JSON.parse(text);
                res.setHeader("Content-Type", "application/x-ndjson");
                const run = async (request) => {
                  const result = await fixtureMarket.run(
                    request,
                    request.range,
                    request.retry,
                    request.history,
                  );
                  return (
                    JSON.stringify({
                      ...publicView(result.final, request.amount),
                      dataQuality: "synthetic",
                    }) + "\n"
                  );
                };
                if (input.requests) {
                  await Promise.all(
                    input.requests.map(async (request, index) =>
                      res.write(
                        JSON.stringify({
                          index,
                          status: 200,
                          body: await run(request),
                        }) + "\n",
                      ),
                    ),
                  );
                } else res.write(await run(input));
                res.end();
              } catch {
                res.statusCode = 503;
                res.end('{"status":"blocked","code":"DATA_UNAVAILABLE"}\n');
              }
            });
          },
        },
      ]
    : [],
  configFile: false,
  root: fixture,
  publicDir: join(root, "public"),
  oxc: { jsx: { runtime: "automatic" } },
  define: {
    "process.env.NEXT_PUBLIC_AI_DISCOVERY_ENABLED": JSON.stringify("true"),
    "process.env.NEXT_PUBLIC_CONVEX_URL": JSON.stringify(
      "https://synthetic.invalid",
    ),
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  resolve: {
    alias: [
      { find: "next/image", replacement: join(fixture, "image.tsx") },
      { find: "~/lib/auth-client", replacement: join(fixture, "auth.ts") },
      { find: "convex/react", replacement: join(fixture, "convex.ts") },
      { find: "next/navigation", replacement: join(fixture, "navigation.ts") },
      {
        find: "~/components/market-performance",
        replacement: refreshQA
          ? join(root, "src/components/market-performance.tsx")
          : join(fixture, "market.tsx"),
      },
      { find: "~", replacement: join(root, "src") },
    ],
  },
  css: { postcss: join(root, "postcss.config.js") },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.TIKR_QA_PORT ?? 5177),
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
console.log(
  `Synthetic guest QA: http://127.0.0.1:${process.env.TIKR_QA_PORT ?? 5177}`,
);
