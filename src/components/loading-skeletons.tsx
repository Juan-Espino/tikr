"use client";
import { usePathname } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton";

export function SearchRowsSkeleton({ grid = false }: { grid?: boolean }) {
  if (grid)
    return (
      <div
        role="status"
        aria-label="Loading asset results"
        data-loading="search"
        className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        <span className="sr-only">Loading asset results</span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border flex min-h-14 items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="size-4" />
          </div>
        ))}
      </div>
    );

  return (
    <div
      role="status"
      aria-label="Loading asset results"
      className="space-y-3 py-3"
      data-loading="search"
    >
      <span className="sr-only">Loading asset results…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-9 w-14" />
        </div>
      ))}
    </div>
  );
}
export function MarketSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading history"
      data-loading="history"
      className={
        compact
          ? "mt-6 flex min-h-56 flex-1 flex-col gap-4"
          : "mt-4 min-h-[440px] space-y-6"
      }
    >
      <span className="sr-only">Loading history…</span>
      <div
        className={
          compact ? "space-y-2" : "grid grid-cols-2 gap-5 sm:grid-cols-4"
        }
      >
        {Array.from({ length: compact ? 1 : 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <Skeleton
        className={compact ? "min-h-44 w-full flex-1" : "h-72 w-full"}
      />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
export function PageSkeleton({
  variant,
  label = "Loading portfolios…",
}: {
  variant?: "landing" | "dashboard" | "portfolio" | "signin";
  label?: string;
}) {
  const pathname = usePathname();
  const page =
    variant ??
    (pathname === "/"
      ? "landing"
      : pathname?.startsWith("/portfolio/")
        ? "portfolio"
        : pathname === "/sign-in"
          ? "signin"
          : "dashboard");
  if (page === "signin")
    return (
      <main
        role="status"
        aria-label="Checking sign-in session"
        aria-busy="true"
        data-loading="signin"
        className="grid min-h-screen bg-stone-100 md:grid-cols-2"
      >
        <span className="sr-only">Checking sign-in session</span>
        <section
          aria-hidden="true"
          className="flex flex-col px-6 py-7 md:px-16 md:py-10"
        >
          <Skeleton className="h-8 w-20 bg-stone-300" />
          <div className="m-auto w-full max-w-sm space-y-5 py-14">
            <Skeleton className="h-3 w-28 bg-stone-300" />
            <Skeleton className="h-12 w-48 bg-stone-300" />
            <Skeleton className="h-12 w-24 bg-stone-300" />
            <Skeleton className="h-4 w-full bg-stone-300" />
            <Skeleton className="h-4 w-3/4 bg-stone-300" />
            <Skeleton className="mt-8 h-12 w-full bg-stone-300" />
            <Skeleton className="mx-auto h-4 w-32 bg-stone-300" />
          </div>
          <Skeleton className="h-8 w-64 max-w-full bg-stone-300" />
        </section>
        <section
          aria-hidden="true"
          className="hidden items-center justify-center bg-[#0b0b0b] p-12 md:flex"
        >
          <Skeleton className="aspect-square w-full max-w-[440px] rounded-full" />
        </section>
      </main>
    );
  return (
    <main
      role="status"
      aria-label={label}
      aria-busy="true"
      data-loading={page}
      className="min-h-screen"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <header className="border-border flex items-center justify-between border-b px-5 py-5 md:px-10">
          <Skeleton className="h-8 w-20" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </header>
        {page === "landing" ? (
          <div className="mx-auto grid min-h-[75svh] max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:px-10">
            <div className="space-y-5">
              <Skeleton className="h-16 w-4/5" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-3/4" />
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-12 w-40 rounded-full" />
                <Skeleton className="h-12 w-36 rounded-full" />
              </div>
            </div>
            <Skeleton className="mx-auto aspect-square w-full max-w-[440px] rounded-full" />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-9">
            <div className="flex justify-between gap-6">
              <Skeleton className="h-9 w-52" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-64" />
            {page === "portfolio" ? (
              <>
                <MarketSkeleton />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border-border rounded-xl border p-5">
                    <Skeleton className="h-6 w-32" />
                    <MarketSkeleton compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
