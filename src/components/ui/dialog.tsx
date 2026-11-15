"use client";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogContent({
  children,
  className,
  closeLabel = "Close editor",
}: {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/70" />
      <DialogPrimitive.Popup
        className={cn(
          "dialog-popup bg-card text-foreground border-border fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border p-6 shadow-xl outline-none",
          className,
        )}
      >
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="hover:bg-muted absolute top-4 right-4 rounded-md p-2"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
