"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Central motion values for owner tuning. No persistent will-change hints.
export const SEARCH_MOTION = {
  height: 200,
  enter: 200,
  exit: 100,
  stagger: 30,
  staggerCount: 6,
  rise: 5,
};
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SearchResultsViewport({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = viewport.current!,
      inner = content.current!;
    const dialog = outer.closest<HTMLElement>("[role=dialog]");
    let frame = 0,
      animation: Animation | undefined,
      target = -1;
    const measure = () => {
      frame = 0;
      const current = outer.getBoundingClientRect().height;
      let cap = Infinity;
      if (dialog) {
        const allocation = dialog.querySelector<HTMLElement>(
          "[data-editor-allocation]",
        );
        const style = getComputedStyle(dialog);
        const maximum = parseFloat(style.maxHeight);
        // Reserve space for existing editor controls. Allocation may scroll in its
        // own region on short screens; the input and Done action never scroll away.
        const allocationSize = allocation?.getBoundingClientRect().height ?? 0;
        const chrome =
          parseFloat(style.paddingTop) +
          parseFloat(style.paddingBottom) +
          parseFloat(style.borderTopWidth) +
          parseFloat(style.borderBottomWidth);
        const layout = [...dialog.children].reduce((sum, child) => {
          const childStyle = getComputedStyle(child);
          if (
            childStyle.position === "absolute" ||
            childStyle.position === "fixed"
          )
            return sum;
          return (
            sum +
            child.getBoundingClientRect().height +
            parseFloat(childStyle.marginTop) +
            parseFloat(childStyle.marginBottom)
          );
        }, chrome);
        const fixed = layout - current - allocationSize;
        const available = Math.max(0, maximum - fixed);
        const naturalAllocation = allocation?.scrollHeight ?? 0;
        cap = Math.max(
          0,
          available - Math.min(naturalAllocation, available / 2),
        );
      }
      const next = Math.min(inner.getBoundingClientRect().height, cap);
      if (Math.abs(next - target) < 0.5) return;
      target = next;
      animation?.cancel();
      outer.style.height = `${next}px`;
      if (!reduced() && Math.abs(current - next) > 0.5)
        animation = outer.animate(
          [{ height: `${current}px` }, { height: `${next}px` }],
          { duration: SEARCH_MOTION.height, easing: "ease-out" },
        );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(inner);
    // Watch editor siblings, not the animated dialog height, to avoid feedback.
    if (dialog)
      for (const child of dialog.children)
        if (!child.contains(outer)) {
          if (child.hasAttribute("data-editor-allocation")) {
            for (const control of child.children) observer.observe(control);
          } else observer.observe(child);
        }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChange = () => {
      animation?.cancel();
      target = -1;
      schedule();
    };
    motion.addEventListener("change", motionChange);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      animation?.cancel();
      motion.removeEventListener("change", motionChange);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <div
      ref={viewport}
      data-search-viewport
      className="search-results-viewport overflow-x-hidden overflow-y-auto"
      style={{ height: 0 }}
    >
      <div ref={content} className="flow-root">
        {children}
      </div>
    </div>
  );
}

type Item = { key: string; content: ReactNode };
function EnteringRow({ item, index }: { item: Item; index: number }) {
  const node = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reduced() || index >= SEARCH_MOTION.staggerCount) return;
    const animation = node.current!.animate(
      [
        { opacity: 0, transform: `translateY(${SEARCH_MOTION.rise}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: SEARCH_MOTION.enter,
        delay: index * SEARCH_MOTION.stagger,
        easing: "ease-out",
        fill: "backwards",
      },
    );
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => animation.cancel();
    motion.addEventListener("change", cancel);
    return () => {
      animation.cancel();
      motion.removeEventListener("change", cancel);
    };
    // Mount-only: ticker identity, not query or Add state, controls entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={node} data-search-row={item.key} className="min-w-0">
      {item.content}
    </div>
  );
}

export function AnimatedSearchRows({
  items,
  className = "",
}: {
  items: Item[];
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef(
    new Map<string, Item & { top: number; left: number; width: number }>(),
  );
  const [exits, setExits] = useState<
    Array<Item & { top: number; left: number; width: number }>
  >([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useLayoutEffect(() => {
    const old = previous.current;
    const keys = new Set(items.map((i) => i.key));
    const removed = [...old.values()].filter((i) => !keys.has(i.key));
    if (removed.length && !reduced()) {
      setExits((current) => [
        ...current.filter((i) => !removed.some((r) => r.key === i.key)),
        ...removed,
      ]);
      const timer = setTimeout(() => {
        setExits((current) =>
          current.filter((i) => !removed.some((r) => r.key === i.key)),
        );
        timers.current.delete(timer);
      }, SEARCH_MOTION.exit);
      timers.current.add(timer);
    }
    previous.current = new Map(
      items.map((item) => {
        const row = [
          ...root.current!.querySelectorAll<HTMLElement>("[data-search-row]"),
        ].find((n) => n.dataset.searchRow === item.key)!;
        return [
          item.key,
          {
            ...item,
            top: row.offsetTop,
            left: row.offsetLeft,
            width: row.offsetWidth,
          },
        ];
      }),
    );
  }, [items]);
  useLayoutEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );
  const active = new Set(items.map((i) => i.key));
  let entering = 0;
  return (
    <div ref={root} className={`relative ${className}`} data-search-rows>
      {items.map((item) => (
        <EnteringRow
          key={item.key}
          item={item}
          index={
            previous.current.has(item.key)
              ? SEARCH_MOTION.staggerCount
              : entering++
          }
        />
      ))}
      {exits
        .filter((i) => !active.has(i.key))
        .map((item) => (
          <div
            key={`exit-${item.key}`}
            aria-hidden="true"
            inert
            className="search-row-exit pointer-events-none absolute"
            style={{
              top: item.top,
              left: item.left,
              width: item.width,
              animationDuration: `${SEARCH_MOTION.exit}ms`,
            }}
          >
            {item.content}
          </div>
        ))}
    </div>
  );
}
