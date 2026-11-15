"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
export function AccountMenu() {
  const { data, isPending, error } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  if (isPending) return <span role="status">Checking session…</span>;
  if (!data || error)
    return (
      <button
        className="min-h-11 rounded px-2 focus-visible:outline-2"
        onClick={() =>
          router.push(
            `/sign-in?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`,
          )
        }
      >
        Sign in
      </button>
    );
  const initials = (data.user.name || data.user.email)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <Dialog key={data.user.id}>
      <DialogTrigger
        aria-label="Open account"
        className="account-avatar-trigger flex size-11 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
      >
        <Avatar className="account-avatar-image">
          <AvatarImage
            src={data.user.image ?? undefined}
            alt="Your Google profile picture"
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent className="max-w-sm" closeLabel="Close account">
        <DialogTitle className="pr-10 text-xl font-semibold">
          {data.user.name || "Your account"}
        </DialogTitle>
        <p className="mt-2 text-sm break-all">{data.user.email}</p>
        <DialogDescription className="text-muted-foreground mt-4 text-sm leading-6">
          Portfolios stay in this browser. They are not cloud saved.
        </DialogDescription>
        <Button
          className="mt-6 w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setFailed(false);
            try {
              const result = await authClient.signOut();
              if (result.error) throw new Error();
              window.location.replace("/");
            } catch {
              setFailed(true);
              setBusy(false);
            }
          }}
        >
          {busy ? "Signing out…" : "Sign out"}
        </Button>
        {failed && <p role="alert">Sign-out failed. Please try again.</p>}
      </DialogContent>
    </Dialog>
  );
}
