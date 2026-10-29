"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ranges, type Range } from "~/lib/demo";

export function RangePicker({
  value,
  onChange,
  alignStart = false,
}: {
  value: Range;
  alignStart?: boolean;
  onChange: (range: Range) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  function close() {
    if (root.current?.contains(document.activeElement))
      trigger.current?.focus();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      className={`relative h-10 w-full max-w-72 ${alignStart ? "" : "sm:ml-auto"}`}
    >
      <div
        ref={root}
        className={`border-border bg-background absolute top-0 left-0 z-20 flex h-10 flex-row-reverse items-center rounded-md border text-sm shadow-sm ${alignStart ? "" : "sm:right-0 sm:left-auto sm:flex-row"}`}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setOpen(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") close();
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
            ).sort(
              (first, second) =>
                first.getBoundingClientRect().left -
                second.getBoundingClientRect().left,
            );
            const current = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              (current +
                (event.key === "ArrowLeft" ? -1 : 1) +
                buttons.length) %
                buttons.length
            ]?.focus();
          }
        }}
      >
        <div
          id={id}
          role="group"
          aria-label="Choose timeframe"
          aria-hidden={!open}
          inert={!open}
          className={`flex overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none ${open ? "w-[220px] opacity-100" : "w-0 opacity-0"}`}
        >
          {ranges
            .filter((range) => range !== value)
            .map((range) => (
              <button
                key={range}
                type="button"
                className="text-muted-foreground hover:bg-muted hover:text-foreground h-9 w-11 shrink-0 rounded focus-visible:-outline-offset-4"
                aria-label={`Set timeframe to ${range}`}
                onClick={() => {
                  trigger.current?.focus();
                  onChange(range);
                  if (window.matchMedia("(hover: none)").matches)
                    setOpen(false);
                }}
              >
                {range}
              </button>
            ))}
        </div>
        <button
          ref={trigger}
          type="button"
          aria-label={`Timeframe: ${value}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((previous) => !previous)}
          className="text-foreground hover:bg-muted flex h-9 w-14 shrink-0 items-center justify-center gap-1 rounded focus-visible:-outline-offset-4"
        >
          <ChevronLeft
            aria-hidden="true"
            className={`size-3 transition-transform motion-reduce:transition-none ${alignStart ? (open ? "rotate-0" : "rotate-180") : open ? "sm:rotate-180" : "rotate-180 sm:rotate-0"}`}
          />
          {value}
        </button>
      </div>
    </div>
  );
}
