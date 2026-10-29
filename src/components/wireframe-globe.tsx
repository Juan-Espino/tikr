"use client";

import { useEffect, useRef, useState } from "react";
import {
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import Image from "next/image";

const HUBS: [number, number][] = [
  [-74.006, 40.713], // New York
  [-0.128, 51.507], // London
  [114.169, 22.319], // Hong Kong
  [103.82, 1.352], // Singapore
  [121.474, 31.23], // Shanghai
];

// Adapted from the supplied v0 rotating-earth.tsx. Geography is served locally.
export function WireframeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<(command: string) => void>(() => undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;
    const controller = new AbortController();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let land: GeoPermissibleObjects | undefined;
    let dots: [number, number][] = [];
    let accents: {
      dots: [number, number][];
      phase: number;
      period: number;
      seed: number;
    }[] = [];
    let size = 0;
    let rotation: [number, number] = [-45, -15];
    let drag: { id: number; x: number; y: number } | null = null;
    let inView = false;
    let frame = 0;
    let previous = 0;
    let disposed = false;
    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, context);
    const grid = geoGraticule10();

    function render() {
      if (!context || !canvas || !size || !land) return;
      const radius = size * 0.44;
      projection
        .scale(radius)
        .translate([size / 2, size / 2])
        .rotate(rotation);
      context.clearRect(0, 0, size, size);
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, 2 * Math.PI);
      context.fillStyle = "#080808";
      context.fill();
      context.strokeStyle = "#e7e5e4";
      context.lineWidth = 1.2;
      context.stroke();
      context.beginPath();
      path(grid);
      context.strokeStyle = "#78716c";
      context.lineWidth = 0.5;
      context.stroke();
      context.beginPath();
      path(land);
      context.strokeStyle = "#e7e5e4";
      context.lineWidth = 0.6;
      context.stroke();
      const center: [number, number] = [-rotation[0], -rotation[1]];
      context.beginPath();
      for (const dot of dots) {
        if (geoDistance(dot, center) >= Math.PI / 2) continue;
        const point = projection(dot);
        if (!point) continue;
        const dotRadius = Math.max(0.55, size / 620);
        context.moveTo(point[0] + dotRadius, point[1]);
        context.arc(point[0], point[1], dotRadius, 0, Math.PI * 2);
      }
      context.fillStyle = "#a8a29e";
      context.fill();

      // Decorative accents use existing land dots, not live financial data.
      const time = performance.now();
      for (const accent of accents) {
        const cycle = time / accent.period + accent.phase;
        const strength = motion.matches
          ? 0.75
          : Math.sin(Math.PI * (cycle % 1)) ** 2;
        const color = motion.matches
          ? accent.seed % 2
          : (Math.floor(cycle) + accent.seed) % 2;
        context.globalAlpha = 0.8 * strength;
        context.fillStyle = color ? "#4ade80" : "#f87171";
        context.beginPath();
        for (const dot of accent.dots) {
          if (geoDistance(dot, center) >= Math.PI / 2) continue;
          const point = projection(dot);
          if (!point) continue;
          const dotRadius = Math.max(1, size / 420);
          context.moveTo(point[0] + dotRadius, point[1]);
          context.arc(point[0], point[1], dotRadius, 0, Math.PI * 2);
        }
        context.fill();
      }
      context.globalAlpha = 1;
    }

    function tick(now: number) {
      frame = 0;
      if (
        disposed ||
        motion.matches ||
        drag ||
        !inView ||
        document.hidden ||
        !land
      )
        return;
      if (now - previous >= 1000 / 30) {
        rotation[0] =
          (rotation[0] + Math.min(now - previous, 100) * 0.004) % 360;
        previous = now;
        render();
      }
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function preferenceChanged() {
      render();
      schedule();
    }
    preferenceChanged();
    motion.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", schedule);
    const resize = new ResizeObserver(() => {
      size = host.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    });
    resize.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      schedule();
    });
    visibility.observe(host);
    commandRef.current = (command) => {
      if (command === "ArrowLeft") rotation[0] -= 8;
      if (command === "ArrowRight") rotation[0] += 8;
      if (command === "ArrowUp") rotation[1] = Math.min(80, rotation[1] + 8);
      if (command === "ArrowDown") rotation[1] = Math.max(-80, rotation[1] - 8);
      render();
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (drag?.id !== event.pointerId) return;
      rotation = [
        rotation[0] + (event.clientX - drag.x) * 0.35,
        Math.max(
          -80,
          Math.min(80, rotation[1] - (event.clientY - drag.y) * 0.35),
        ),
      ];
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      render();
    };
    const pointerEnd = () => {
      drag = null;
      schedule();
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerEnd);
    canvas.addEventListener("pointercancel", pointerEnd);
    canvas.addEventListener("lostpointercapture", pointerEnd);
    void Promise.all([
      fetch("/globe/land.json", { signal: controller.signal }).then((r) => {
        if (!r.ok) throw new Error("Map unavailable");
        return r.json() as Promise<GeoPermissibleObjects>;
      }),
      fetch("/globe/dots.json", { signal: controller.signal }).then((r) => {
        if (!r.ok) throw new Error("Dots unavailable");
        return r.json() as Promise<[number, number][]>;
      }),
    ])
      .then(([map, points]) => {
        if (disposed) return;
        land = map;
        dots = points;
        accents = HUBS.map(() => ({
          dots: [],
          phase: Math.random(),
          period: 5000 + Math.random() * 4000,
          seed: Math.floor(Math.random() * 2),
        }));
        for (const dot of points) {
          let nearest = -1;
          let distance = (3 * Math.PI) / 180;
          HUBS.forEach((hub, index) => {
            const candidate = geoDistance(dot, hub);
            if (candidate < distance) {
              nearest = index;
              distance = candidate;
            }
          });
          if (nearest >= 0) accents[nearest]?.dots.push(dot);
        }
        render();
        setReady(true);
        schedule();
      })
      .catch(() => {
        /* The bundled static globe remains visible. */
      });

    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", schedule);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
      canvas.removeEventListener("lostpointercapture", pointerEnd);
      commandRef.current = () => undefined;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div ref={hostRef} className="relative aspect-square w-full">
        {!ready && (
          <Image
            src="/globe/fallback.svg"
            alt="Wireframe globe with dotted continents"
            fill
            unoptimized
            priority
          />
        )}
        <canvas
          ref={canvasRef}
          tabIndex={ready ? 0 : -1}
          role="img"
          aria-label="Interactive wireframe globe"
          className={`absolute inset-0 size-full touch-pan-y rounded-full ${ready ? "cursor-grab active:cursor-grabbing" : "invisible"}`}
          onKeyDown={(event) => {
            if (
              ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            ) {
              event.preventDefault();
              commandRef.current(event.key);
            }
          }}
        />
      </div>
    </div>
  );
}
