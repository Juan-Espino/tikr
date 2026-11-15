"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Login } from "~/components/intro";
import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { StorageNotice } from "~/components/app-shell";
import { authClient } from "~/lib/auth-client";
import { safeAuthReturn } from "~/lib/auth-return";
export default function SignInPage() {
  const router = useRouter();
  const { draft, ready } = useDemoPortfolios();
  const session = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [returnTo, setReturnTo] = useState<string | null>(null);
  useEffect(() => {
    const resume = () => setPending(false);
    window.addEventListener("pageshow", resume);
    return () => window.removeEventListener("pageshow", resume);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const query = new URLSearchParams(window.location.search);
    setReturnTo(
      safeAuthReturn(
        query.get("returnTo") ??
          (draft ? `/portfolio/${encodeURIComponent(draft.id)}` : "/dashboard"),
      ),
    );
    if (query.has("error"))
      setError(
        "Google sign-in was canceled or could not be completed. Try again or continue as guest.",
      );
  }, [draft, ready]);
  useEffect(() => {
    if (session.data && !session.isPending && returnTo)
      router.replace(returnTo);
  }, [session.data, session.isPending, router, returnTo]);
  return (
    <>
      <StorageNotice />
      <Login
        onLanding={() => router.push("/")}
        onDashboard={() => router.push(returnTo ?? "/dashboard")}
        pending={pending || session.isPending || !returnTo}
        error={
          error ||
          (session.error
            ? "Unable to check your session. You can retry sign-in or continue as guest."
            : "")
        }
        onGoogle={() => {
          void (async () => {
            setPending(true);
            setError("");
            try {
              const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: returnTo ?? "/dashboard",
                errorCallbackURL: `/sign-in?error=oauth&returnTo=${encodeURIComponent(returnTo ?? "/dashboard")}`,
              });
              if (result.error) throw new Error();
            } catch {
              setError(
                "Unable to start Google sign-in. Please try again or continue as guest.",
              );
              setPending(false);
            }
          })();
        }}
      />
    </>
  );
}
