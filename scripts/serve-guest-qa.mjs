// Isolated synthetic UI harness: no DEV/auth/provider requests.
import { createServer } from "vite";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname, "..");
const fixture = join(root, "tests/cloud-ui");
const server = await createServer({
  configFile: false,
  root: fixture,
  publicDir: join(root, "public"),
  oxc: { jsx: { runtime: "automatic" } },
  define: {
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
        replacement: join(fixture, "market.tsx"),
      },
      { find: "~", replacement: join(root, "src") },
    ],
  },
  css: { postcss: join(root, "postcss.config.js") },
  server: { host: "127.0.0.1", port: 5177, fs: { allow: [root] } },
});
await server.listen();
console.log("Synthetic guest QA: http://127.0.0.1:5177");
