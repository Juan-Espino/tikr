"use client";
import { useAccountDeletion } from "~/providers/account-deletion-provider";
import { Skeleton } from "~/components/ui/skeleton";
import { PortfolioContext } from "~/providers/demo-portfolios-provider";
import { useContext, useState, useEffect, useRef } from "react";
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
export function AccountMenu({
  quietPending = false,
  prepareToLeave,
}: { quietPending?: boolean; prepareToLeave?: () => Promise<boolean> } = {}) {
  const { data, isPending, error } = authClient.useSession();
  const deletion = useAccountDeletion();
  const [confirmDelete, setConfirmDelete] = useState<null | {
    accountId: string;
    sessionFence: string;
    readyAt: number;
  }>(null);
  const [deleteSeconds, setDeleteSeconds] = useState(3);
  const deleteReady = deleteSeconds === 0;
  const [needsReauth, setNeedsReauth] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteEntryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setDeleteSeconds(3);
    if (!confirmDelete) return;
    cancelRef.current?.focus();
    const updateCountdown = () => {
      setDeleteSeconds(
        Math.max(0, Math.ceil((confirmDelete.readyAt - Date.now()) / 1000)),
      );
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 100);
    return () => clearInterval(timer);
  }, [confirmDelete]);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const portfolios = useContext(PortfolioContext);
  if (isPending && quietPending)
    return (
      <span
        className="inline-flex h-9 w-14"
        role="status"
        aria-label="Checking session"
      />
    );
  if (isPending)
    return (
      <span role="status" aria-label="Checking session">
        <Skeleton className="size-11 rounded-full" />
      </span>
    );
  if (
    !data ||
    error ||
    (data.session && new Date(data.session.expiresAt).getTime() <= Date.now())
  )
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-11"
        onClick={() =>
          router.push(
            `/sign-in?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`,
          )
        }
      >
        Sign in
      </Button>
    );
  const initials = (data.user.name || data.user.email)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <Dialog
      key={data.user.id}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmDelete(null);
          setDeleteError("");
        }
      }}
    >
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
          {confirmDelete
            ? "Permanently delete your account?"
            : data.user.name || "Your account"}
        </DialogTitle>
        <p className="mt-2 text-sm break-all">{data.user.email}</p>
        {confirmDelete ? (
          <>
            <DialogDescription className="mt-4 text-sm leading-6">
              This will permanently delete your Tikr account and ALL your
              portfolios. This cannot be undone. Your Google account is not
              deleted.
            </DialogDescription>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="min-h-11"
                variant="outline"
                disabled={busy}
                ref={cancelRef}
                onClick={() => {
                  setConfirmDelete(null);
                  queueMicrotask(() => deleteEntryRef.current?.focus());
                }}
              >
                Cancel
              </Button>
              <div className="inline-flex items-center gap-2">
                <Button
                  className="min-h-11"
                  variant="destructive"
                  disabled={busy || !deleteReady || needsReauth}
                  onClick={async () => {
                    if (
                      busy ||
                      !deletion ||
                      Date.now() < confirmDelete.readyAt ||
                      needsReauth
                    )
                      return;
                    setBusy(true);
                    try {
                      if (
                        confirmDelete.accountId !== data.user.id ||
                        confirmDelete.sessionFence !== data.session.id
                      )
                        throw Error(
                          "Your account changed. Cancel and reopen confirmation.",
                        );
                      const outcome = await deletion.begin(
                        confirmDelete.accountId,
                        confirmDelete.sessionFence,
                      );
                      if (outcome === "reauth_required") {
                        setNeedsReauth(true);
                        setDeleteError(
                          "For your security, sign in again before permanently deleting your account. Nothing has been deleted.",
                        );
                      }
                    } catch (error) {
                      setDeleteError(
                        error instanceof Error
                          ? error.message
                          : "Unable to begin deletion.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Permanently delete account
                </Button>
                <span
                  className="text-destructive w-5 text-sm tabular-nums"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {deleteSeconds > 0 && (
                    <>
                      <span className="sr-only">Available in </span>
                      {deleteSeconds}s
                    </>
                  )}
                </span>
              </div>
            </div>
            {needsReauth && deletion && (
              <Button
                className="mt-4 min-h-11"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    await deletion.reauthenticate(
                      confirmDelete.accountId,
                      confirmDelete.sessionFence,
                    );
                  } catch (error) {
                    setDeleteError(
                      error instanceof Error
                        ? error.message
                        : "Unable to start sign-in.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Sign in again
              </Button>
            )}
            {deleteError && (
              <p role="alert" className="mt-4">
                {deleteError}
              </p>
            )}
          </>
        ) : (
          <>
            <DialogDescription className="text-muted-foreground mt-4 text-sm leading-6">
              Named portfolios with a valid allocation save automatically to
              your account. Private account edits stay in this tab.
            </DialogDescription>
            <Button
              className="mt-6 w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setFailed(false);
                try {
                  const leave = prepareToLeave ?? portfolios?.prepareToLeave;
                  if (leave && !(await leave())) {
                    setBusy(false);
                    return;
                  }
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
            {deletion && (
              <Button
                ref={deleteEntryRef}
                className="mt-3 min-h-11 w-full"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  setNeedsReauth(false);
                  setDeleteError("");
                  setDeleteSeconds(3);
                  setConfirmDelete({
                    accountId: data.user.id,
                    sessionFence: data.session.id,
                    readyAt: Date.now() + 3000,
                  });
                }}
              >
                Delete account
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
