// Accept app paths only, including query/hash for a local draft's current view.
export function safeAuthReturn(value: string | null | undefined): string {
  if (
    !value ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const url = new URL(value, "http://localhost");
    if (
      url.origin !== "http://localhost" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/sign-in")
    )
      return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}
