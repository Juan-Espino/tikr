import { defineConfig } from "vitest/config";
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "~": new URL("./src", import.meta.url).pathname.replace(
        /^\/([A-Za-z]:)/,
        "$1",
      ),
    },
  },
  test: {
    environment: "edge-runtime",
    include: [
      "convex/**/*.test.ts",
      "tests/hosted-*.test.ts",
      "tests/auth-*.test.ts",
    ],
  },
});
