"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
type Confirmation = {
  title: string;
  description: string;
  action: string;
  destructive?: boolean;
};
export function useConfirmation() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const [open, setOpen] = useState(false);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
    },
    [],
  );
  function finish(confirmed: boolean) {
    const resolve = pending.current;
    pending.current = null;
    setOpen(false);
    resolve?.(confirmed);
  }
  function confirm(value: Confirmation) {
    if (pending.current) return Promise.resolve(false);
    setRequest(value);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }
  const dialog = (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <DialogContent className="max-w-sm" closeLabel="Close confirmation">
        <DialogTitle className="pr-10 text-xl font-semibold">
          {request?.title}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground mt-4 text-sm leading-6">
          {request?.description}
        </DialogDescription>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => finish(false)}>
            Cancel
          </Button>
          <Button
            variant={request?.destructive ? "destructive" : "default"}
            onClick={() => finish(true)}
          >
            {request?.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  return { confirm, dialog };
}
