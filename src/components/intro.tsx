"use client";
import Link from "next/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ArrowRight } from "lucide-react";
import { WireframeGlobe } from "./wireframe-globe";
import { TikrLogo } from "./tikr-logo";
import { AccountMenu } from "./account-menu";

function AppHeader({
  onDashboard,
  prepareToLeave,
}: {
  onLogin: () => void;
  onDashboard: () => void;
  prepareToLeave?: () => Promise<boolean>;
}) {
  return (
    <header className="flex items-center justify-between px-5 py-5 md:px-10">
      <button onClick={onDashboard} aria-label="View portfolios">
        <TikrLogo />
      </button>
      <nav className="flex items-center gap-4 text-[12px] text-stone-400 md:flex">
        <Button variant="ghost" size="sm" onClick={onDashboard}>
          Portfolios
        </Button>
        <Link
          href="/methodology"
          data-slot="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-h-9",
          )}
        >
          Methodology
        </Link>
        <AccountMenu quietPending prepareToLeave={prepareToLeave} />
      </nav>
    </header>
  );
}

export function Landing({
  onLogin,
  onDashboard,
  onBuild,
  onExample,
  pending = false,
  prepareToLeave,
}: {
  onLogin: () => void;
  onDashboard: () => void;
  onBuild: () => void;
  onExample: () => void;
  pending?: boolean;
  prepareToLeave?: () => Promise<boolean>;
}) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#080808] text-stone-200">
      <div className="flex min-h-screen flex-col">
        <AppHeader
          onLogin={onLogin}
          onDashboard={onDashboard}
          prepareToLeave={prepareToLeave}
        />
        <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-12 md:grid-cols-[1.05fr_.95fr] md:px-10 md:py-16">
          <div className="relative z-10">
            <h1 className="max-w-xl text-[clamp(3rem,5.5vw,4.5rem)] leading-[.92] font-bold tracking-[-0.07em] text-stone-100">
              <span className="sr-only">
                Building a portfolio should feel simpler.
              </span>
              <span aria-hidden="true" className="hero-headline">
                <span>Building</span> <span>a</span> <span>portfolio</span>{" "}
                <span>should</span> <span>feel</span> <span>simpler.</span>
              </span>
            </h1>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                disabled={pending}
                onClick={onBuild}
                className="rounded-full bg-stone-100 px-5 py-3 text-[13px] font-medium text-black transition hover:bg-white"
              >
                Build a portfolio <ArrowRight className="ml-2 inline size-4" />
              </button>
              <button
                disabled={pending}
                onClick={onExample}
                className="rounded-full border border-stone-700 px-5 py-3 text-[13px] text-stone-300 hover:border-stone-500"
              >
                Explore an example
              </button>
            </div>
            <p className="supporting-copy mt-16 text-[11px] text-stone-400">
              Tikr is a historical sandbox. Not financial advice.
            </p>
          </div>
          <div className="hero-globe-entrance">
            <WireframeGlobe />
          </div>
        </section>
      </div>
    </main>
  );
}

export function Login({
  onDashboard,
  onLanding,
  onGoogle,
  pending,
  error,
}: {
  onDashboard: () => void;
  onLanding: () => void;
  onGoogle: () => void;
  pending: boolean;
  error: string;
}) {
  return (
    <main className="grid min-h-screen bg-[#f5f5f4] text-[#191918] md:grid-cols-2">
      <section className="flex flex-col px-6 py-7 md:px-16 md:py-10">
        <button
          onClick={onLanding}
          aria-label="Go to landing page"
          className="self-start"
        >
          <TikrLogo />
        </button>
        <div className="m-auto w-full max-w-sm py-14">
          <p className="supporting-copy mb-4 text-[11px] tracking-[.18em] text-stone-600 uppercase">
            Your workspace
          </p>
          <h1 className="text-4xl tracking-[-.06em]">
            Welcome to
            <br />
            Tikr.
          </h1>
          <p className="supporting-copy mt-4 text-sm leading-6 text-stone-600">
            Sign in with Google to save your named draft automatically once it
            has a valid allocation.
          </p>
          <button
            disabled={pending}
            onClick={onGoogle}
            className="mt-9 flex w-full items-center justify-center gap-3 rounded-md border border-stone-300 bg-white py-3 text-sm font-medium shadow-sm hover:bg-stone-50"
          >
            <span className="font-bold text-[#4285f4]">G</span>{" "}
            {pending ? "Connecting…" : "Continue with Google"}
          </button>
          {pending && (
            <p role="status" className="mt-3 text-sm">
              Checking your session or opening Google…
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            onClick={onDashboard}
            className="mt-3 min-h-11 w-full py-3 text-xs text-stone-600 underline underline-offset-4"
          >
            Continue as guest
          </button>
        </div>
        <p className="supporting-copy max-w-xs text-[10px] leading-5 text-stone-600">
          Google sign-in creates an account and session. Terms and Privacy
          policies are pending before launch. Hypothetical results only. Past
          performance does not guarantee future returns.
        </p>
      </section>
      <section className="relative hidden overflow-hidden bg-[#0b0b0b] md:flex md:items-center md:justify-center">
        <div className="w-full max-w-[520px]">
          <WireframeGlobe />
        </div>
        <div className="absolute right-12 bottom-12 left-12 flex items-end justify-between">
          <div>
            <p className="supporting-copy text-[11px] tracking-[.2em] text-stone-400 uppercase">
              A clearer view of the past
            </p>
            <p className="mt-3 max-w-xs text-xl tracking-[-.04em] text-stone-200">
              Ideas are easy.
              <br />
              The context is the work.
            </p>
          </div>
          <span className="supporting-copy text-[10px] text-stone-400">
            Tikr / 2026
          </span>
        </div>
      </section>
    </main>
  );
}
