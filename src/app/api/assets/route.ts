import { catalogMode } from "~/lib/catalog-mode";
import { assets } from "~/lib/demo";
import { marketFailure } from "~/lib/market-errors";
import { availableCatalog } from "~/lib/catalog-server";
import { searchCatalog } from "~/lib/asset-catalog";
import { hosted, enterHosted, validMarketOrigin } from "~/lib/market-hosted";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
// Read-only source inspection: never reads storage or initiates provider work.
export function GET() {
  return Response.json(
    { mode: catalogMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!validMarketOrigin(request)) return new Response(null, { status: 403 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > 100) return new Response(null, { status: 400 });
  if (request.body) {
    const reader = request.body.getReader();
    try {
      const first = await reader.read();
      if (!first.done) {
        void reader.cancel().catch(() => undefined);
        return new Response(null, { status: 400 });
      }
    } catch {
      return new Response(null, { status: 400 });
    } finally {
      reader.releaseLock();
    }
  }
  if (!query.trim())
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  const mode = catalogMode();
  if (mode === "activation-required")
    return Response.json(
      { code: "CATALOG_NOT_ENABLED" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "X-Tikr-Catalog": mode },
      },
    );
  if (mode === "sample")
    return Response.json(
      searchCatalog(
        assets.map((a) => ({
          ticker: a.ticker,
          name: a.name,
          exchange: "Sample",
        })),
        query,
      ),
      { headers: { "Cache-Control": "no-store", "X-Tikr-Catalog": "sample" } },
    );
  let leave: (() => Promise<unknown>) | undefined;
  try {
    if (hosted()) leave = await enterHosted(request);
    return Response.json(searchCatalog(await availableCatalog(), query), {
      headers: { "Cache-Control": "no-store", "X-Tikr-Catalog": mode },
    });
  } catch (error) {
    const failure = marketFailure(error);
    return Response.json(
      {
        code: failure?.code ?? "CATALOG_UNAVAILABLE",
        retryAt: failure?.retryAt,
      },
      {
        status:
          failure?.code === "BROWSING_RATE_LIMIT" ||
          failure?.code === "REFRESH_COOLDOWN"
            ? 429
            : 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Tikr-Catalog": mode,
          ...(failure?.retryAt
            ? {
                "Retry-After": String(
                  Math.max(1, Math.ceil((failure.retryAt - Date.now()) / 1000)),
                ),
              }
            : {}),
        },
      },
    );
  } finally {
    await leave?.().catch(() => undefined);
  }
}
