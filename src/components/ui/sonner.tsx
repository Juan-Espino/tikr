"use client";
import { Toaster as Sonner, type ToasterProps } from "sonner";
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      closeButton={false}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!bg-card !text-foreground !border-border !font-sans",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
