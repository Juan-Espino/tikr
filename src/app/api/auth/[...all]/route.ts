import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

async function proxy(request: Request) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (!convexUrl || !convexSiteUrl)
    return Response.json(
      { message: "Sign-in is unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  try {
    const { handler } = convexBetterAuthNextJs({ convexUrl, convexSiteUrl });
    const response =
      await handler[request.method === "POST" ? "POST" : "GET"](request);
    // Fetch responses can have immutable headers (notably OAuth responses).
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return Response.json(
      { message: "Sign-in is unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
