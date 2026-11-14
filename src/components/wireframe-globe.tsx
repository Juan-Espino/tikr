"use client";

import { useEffect, useRef, useState } from "react";
import {
  geoDistance,
  geoGraticule10,
  geoInterpolate,
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

const SIGNAL_COLORS = ["#f87171", "#4ade80"] as const;
const DEPARTURE_MS = 300;
const ARRIVAL_MS = 450;
const HOLD_MS = 450;
const FADE_MS = 1400;
const ROUTE_SAMPLES = 96;

type Route = {
  origin: number;
  destination: number;
  color: (typeof SIGNAL_COLORS)[number];
  started: number;
  drawDuration: number;
  points: { location: [number, number]; lift: number }[];
};

// A short acceleration/deceleration with steady travel through most of the arc.
function travelProgress(value: number) {
  const t = Math.max(0, Math.min(1, value));
  const ramp = 0.18;
  if (t < ramp) return (t * t) / (2 * ramp * (1 - ramp));
  if (t > 1 - ramp) return 1 - ((1 - t) * (1 - t)) / (2 * ramp * (1 - ramp));
  return (t - ramp / 2) / (1 - ramp);
}

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
    }[] = [];
    let routes: Route[] = [];
    let elapsed = 0;
    let nextRoute = 400;
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

    function updateRoutes() {
      routes = routes.filter(
        (route) =>
          elapsed - route.started <
          DEPARTURE_MS + route.drawDuration + ARRIVAL_MS + HOLD_MS + FADE_MS,
      );
      if (elapsed < nextRoute || routes.length >= 2) return;
      const available = HUBS.map((hub, index) => ({ hub, index })).filter(
        ({ index }) =>
          !routes.some(
            (route) => route.origin === index || route.destination === index,
          ),
      );
      const center: [number, number] = [-rotation[0], -rotation[1]];
      const visible = available.filter(
        ({ hub }) => geoDistance(hub, center) < Math.PI / 2,
      );
      // Prefer a visible departure, while allowing routes to rotate out of view.
      const origins = visible.length ? visible : available;
      const origin = origins[Math.floor(Math.random() * origins.length)];
      const destinations = available.filter(
        ({ index }) => index !== origin?.index,
      );
      const destination =
        destinations[Math.floor(Math.random() * destinations.length)];
      if (!origin || !destination) return;
      const distance = geoDistance(origin.hub, destination.hub);
      const interpolate = geoInterpolate(origin.hub, destination.hub);
      const height = 0.035 + (distance / Math.PI) * 0.085;
      routes.push({
        origin: origin.index,
        destination: destination.index,
        color: SIGNAL_COLORS[Math.random() < 0.5 ? 0 : 1],
        started: elapsed,
        drawDuration: 2500 + (distance / Math.PI) * 1000,
        points: Array.from({ length: ROUTE_SAMPLES + 1 }, (_, index) => {
          const progress = index / ROUTE_SAMPLES;
          return {
            location: interpolate(progress),
            lift: Math.sin(Math.PI * progress) * height,
          };
        }),
      });
      nextRoute = elapsed + 2400 + Math.random() * 600;
    }

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

      // Decorative city connections, never live financial or trading signals.
      const citySignals = new Map<
        number,
        { color: string; strength: number }
      >();
      if (!motion.matches) {
        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";
        for (const route of routes) {
          const age = elapsed - route.started;
          const arrival = DEPARTURE_MS + route.drawDuration;
          const fadeStart = arrival + ARRIVAL_MS + HOLD_MS;
          const opacity = 1 - Math.max(0, (age - fadeStart) / FADE_MS);
          const progress = travelProgress(
            (age - DEPARTURE_MS) / route.drawDuration,
          );
          citySignals.set(route.origin, {
            color: route.color,
            strength:
              opacity *
              Math.min(1, age / DEPARTURE_MS) *
              (0.3 + 0.7 * Math.exp(-Math.max(0, age - DEPARTURE_MS) / 700)),
          });
          if (age >= arrival) {
            citySignals.set(route.destination, {
              color: route.color,
              strength:
                opacity *
                (0.3 +
                  0.7 *
                    Math.sin(
                      (Math.PI / 2) * Math.min(1, (age - arrival) / ARRIVAL_MS),
                    )),
            });
          }
          if (progress <= 0) continue;

          const projected = route.points.map(({ location, lift }) => {
            const point = projection(location)!;
            const x = (point[0] - size / 2) * (1 + lift);
            const y = (point[1] - size / 2) * (1 + lift);
            // Elevated far-side segments can show beyond the silhouette,
            // but must never draw through the opaque globe itself.
            const visible =
              Math.cos(geoDistance(location, center)) >= 0 ||
              x * x + y * y > radius * radius;
            return { x: x + size / 2, y: y + size / 2, visible };
          });
          const end = progress * ROUTE_SAMPLES;
          const last = Math.floor(end);
          let connected = false;
          context.beginPath();
          for (let index = 0; index <= last; index++) {
            const point = projected[index]!;
            if (!point.visible) {
              connected = false;
              continue;
            }
            if (connected) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
            connected = true;
          }
          const before = projected[last]!;
          const after = projected[Math.min(last + 1, ROUTE_SAMPLES)]!;
          const fraction = end - last;
          const tip = {
            x: before.x + (after.x - before.x) * fraction,
            y: before.y + (after.y - before.y) * fraction,
            visible: before.visible && after.visible,
          };
          if (connected && tip.visible) context.lineTo(tip.x, tip.y);
          context.strokeStyle = route.color;
          context.shadowColor = route.color;
          context.shadowBlur = 6;
          context.globalAlpha = opacity * 0.16;
          context.lineWidth = 3;
          context.stroke();
          context.shadowBlur = 3;
          context.globalAlpha = opacity * 0.65;
          context.lineWidth = Math.max(0.8, size / 560);
          context.stroke();
          if (tip.visible && age < arrival) {
            context.globalAlpha = opacity;
            context.shadowBlur = 8;
            context.fillStyle = route.color;
            context.beginPath();
            context.arc(
              tip.x,
              tip.y,
              Math.max(1.4, size / 300),
              0,
              2 * Math.PI,
            );
            context.fill();
          }
        }
        context.restore();
      }
      accents.forEach((accent, index) => {
        const signal = citySignals.get(index);
        context.globalAlpha = motion.matches ? 0.6 : (signal?.strength ?? 0.16);
        context.fillStyle = signal?.color ?? SIGNAL_COLORS[index % 2]!;
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
        // Pin the pulse to the actual city, even when no land dot is nearby.
        const hub = HUBS[index]!;
        if (signal && geoDistance(hub, center) < Math.PI / 2) {
          const point = projection(hub)!;
          context.save();
          context.shadowColor = signal.color;
          context.shadowBlur = 8;
          context.beginPath();
          context.arc(
            point[0],
            point[1],
            Math.max(1.5, size / 260),
            0,
            2 * Math.PI,
          );
          context.fill();
          context.restore();
        }
      });
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
      const delta = Math.min(now - previous, 100);
      previous = now;
      elapsed += delta;
      rotation[0] = (rotation[0] + delta * 0.004) % 360;
      updateRoutes();
      render();
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
        accents = HUBS.map(() => ({ dots: [] }));
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
