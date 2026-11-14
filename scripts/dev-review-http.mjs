// Local review adapter only. No credentials, deployment or remote network target.
import { createServer } from "node:http";
import { request as upstreamRequest } from "node:https";
import { pathToFileURL } from "node:url";

const upstream = "https://localhost:43201";
const hosts = new Set(["localhost:43202", "127.0.0.1:43202"]);
export function reviewTarget(request) {
  const host = request.headers.host;
  const localOrigin = `http://${host}`;
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method ?? "");
  let target, decoded;
  try {
    target = new URL(request.url, upstream);
    decoded = new URL(decodeURIComponent(target.pathname), upstream);
  } catch {
    return null;
  }
  if (
    !hosts.has(host) ||
    !request.url?.startsWith("/") ||
    request.url.startsWith("//") ||
    target.origin !== upstream ||
    decoded.origin !== upstream ||
    decoded.pathname === "/__rehearsal" ||
    decoded.pathname.startsWith("/__rehearsal/") ||
    (request.headers.origin && request.headers.origin !== localOrigin) ||
    (unsafe && request.headers.origin !== localOrigin)
  ) {
    return null;
  }
  return target;
}
export function createReviewServer() {
  return createServer((request, response) => {
    const target = reviewTarget(request);
    if (!target) {
      response.writeHead(403);
      response.end();
      return;
    }
    const localOrigin = `http://${request.headers.host}`;
    const headers = { ...request.headers, host: "localhost:43201" };
    for (const name of Object.keys(headers))
      if (name.startsWith("x-forwarded-") || name === "forwarded")
        delete headers[name];
    if (headers.origin) headers.origin = upstream;
    const outgoing = upstreamRequest(
      target,
      {
        method: request.method,
        headers,
        // Only the fixed, owned loopback TLS server has this exception.
        rejectUnauthorized: false,
        timeout: 65000,
      },
      (incoming) => {
        const headers = { ...incoming.headers };
        if (headers.location?.startsWith(upstream))
          headers.location =
            localOrigin + headers.location.slice(upstream.length);
        response.writeHead(incoming.statusCode ?? 502, headers);
        incoming.pipe(response);
      },
    );
    outgoing.on("timeout", () => outgoing.destroy());
    outgoing.on("error", () => {
      if (!response.headersSent) response.writeHead(502);
      response.end("Local DEV review server is unavailable.");
    });
    request.on("aborted", () => outgoing.destroy());
    response.on("close", () => outgoing.destroy());
    request.pipe(outgoing);
  });
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const server = createReviewServer();
  server.listen(43202, "127.0.0.1", () => {
    console.log("DEV review: http://127.0.0.1:43202 (loopback only)");
  });
  process.on("SIGINT", () => server.close());
  process.on("SIGTERM", () => server.close());
}
