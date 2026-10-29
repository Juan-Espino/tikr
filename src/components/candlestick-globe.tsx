"use client";

import { geoDistance, geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import { useEffect, useRef, useState } from "react";
import styles from "./candlestick-globe.module.css";

// Decorative shapes, not market data.
const candles = [
  [43, 180, 191, 174, 199, 0],
  [57, 157, 176, 150, 182, 1],
  [71, 147, 157, 141, 162, 1],
  [85, 132, 146, 126, 152, 1],
  [99, 72, 130, 62, 137, 1],
  [113, 76, 87, 71, 92, 0],
  [127, 42, 72, 35, 79, 1],
  [141, 33, 45, 27, 51, 1],
  [155, 25, 35, 18, 42, 1],
  [169, 33, 56, 26, 62, 0],
  [183, 51, 64, 44, 70, 1],
  [197, 54, 77, 48, 84, 0],
  [211, 88, 99, 82, 105, 0],
  [225, 79, 99, 74, 106, 1],
  [239, 80, 153, 73, 159, 0],
  [253, 151, 167, 145, 173, 0],
  [267, 167, 180, 161, 185, 0],
] as const;

export function CandlestickGlobe({
  variant = "candles",
}: {
  variant?: "candles" | "holdings";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projection = geoOrthographic().clipAngle(90);
    const grid = geoGraticule().step([20, 20])();
    const path = geoPath(projection, context);
    let rotation = -45;
    let size = 0;
    let frame = 0;
    let previous = 0;
    let inView = false;

    function render() {
      if (!context || !size) return;
      const radius = size * 0.44;
      projection
        .scale(radius)
        .translate([size / 2, size / 2])
        .rotate([rotation, -15]);
      context.clearRect(0, 0, size, size);
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      context.strokeStyle = "#78716c";
      context.globalAlpha = 0.55;
      context.lineWidth = 0.7;
      context.stroke();
      context.beginPath();
      path(grid);
      context.lineWidth = 0.5;
      context.stroke();
      context.beginPath();
      for (let lat = -80; lat <= 80; lat += 20) {
        for (let lon = -180; lon < 180; lon += 20) {
          const coordinate: [number, number] = [lon, lat];
          if (geoDistance(coordinate, [-rotation, 15]) >= Math.PI / 2) continue;
          const point = projection(coordinate);
          if (!point) continue;
          const dotRadius = Math.max(0.7, size / 420);
          context.moveTo(point[0] + dotRadius, point[1]);
          context.arc(point[0], point[1], dotRadius, 0, 2 * Math.PI);
        }
      }
      context.fillStyle = "#a8a29e";
      context.globalAlpha = 0.7;
      context.fill();
      context.globalAlpha = 1;
    }
    function tick(now: number) {
      frame = 0;
      if (motion.matches || !inView || document.hidden) return;
      if (now - previous >= 1000 / 30) {
        rotation = (rotation + Math.min(now - previous, 100) * 0.004) % 360;
        previous = now;
        render();
      }
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      previous = performance.now();
      if (!motion.matches && inView && !document.hidden)
        frame = requestAnimationFrame(tick);
    }
    function preferenceChanged() {
      render();
      schedule();
    }
    const resize = new ResizeObserver(() => {
      size = host.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
      setReady(true);
    });
    resize.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      schedule();
    });
    visibility.observe(host);
    motion.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="relative aspect-square w-56 max-w-full sm:w-72"
    >
      {!ready && (
        <svg
          viewBox="0 0 300 300"
          className="absolute inset-0 size-full"
          fill="none"
          stroke="#78716c"
          strokeWidth="0.5"
          opacity="0.55"
        >
          <circle cx="150" cy="150" r="132" />
          <ellipse cx="150" cy="150" rx="80" ry="132" />
          <ellipse cx="150" cy="150" rx="35" ry="132" />
          <ellipse cx="150" cy="150" rx="132" ry="80" />
          <ellipse cx="150" cy="150" rx="132" ry="35" />
        </svg>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {variant === "candles" ? (
        <svg
          viewBox="0 0 300 300"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <defs>
            <filter
              id="candle-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {candles.map(([x, top, bottom, high, low, up]) => {
            const color = up ? "#4ade80" : "#f87171";
            return (
              <g key={x} fill={color} stroke={color}>
                <g opacity="0.32" filter="url(#candle-glow)">
                  <path d={`M${x} ${high}V${low}`} strokeWidth="2" />
                  <rect
                    x={x - 4}
                    y={top}
                    width="8"
                    height={bottom - top}
                    stroke="none"
                  />
                </g>
                <path d={`M${x} ${high}V${low}`} strokeWidth="2" />
                <rect
                  x={x - 4}
                  y={top}
                  width="8"
                  height={bottom - top}
                  stroke="none"
                />
              </g>
            );
          })}
        </svg>
      ) : (
        <svg
          viewBox="0 0 300 300"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <g className={styles.tiles}>
            {[60, 124, 188].map((x) => (
              <rect
                key={x}
                x={x}
                y="124"
                width="52"
                height="52"
                rx="5"
                fill="#111111"
                stroke="#a8a29e"
                strokeWidth="1.4"
              />
            ))}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M71 139h20m-20 7h13M135 139h20m-20 7h13M199 139h20m-20 7h13"
                stroke="#a8a29e"
                strokeWidth="2"
              />
              <path
                d="m71 165 8-5 7 2 10-9"
                stroke="#4ade80"
                strokeWidth="1.7"
              />
              <path
                d="m135 164 7-2 6 1 7-2 7 1"
                stroke="#a8a29e"
                strokeWidth="1.7"
              />
              <path
                d="m199 153 8 4 6-2 11 10"
                stroke="#f87171"
                strokeWidth="1.7"
              />
            </g>
          </g>
        </svg>
      )}
    </div>
  );
}
