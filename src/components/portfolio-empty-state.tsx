"use client";

import { useId } from "react";

export function PortfolioEmptyState() {
  const id = useId();
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 260 240"
        className="h-56 w-60 max-w-full"
      >
        <defs>
          <pattern
            id={`${id}-pink`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3.5" cy="3.5" r="1" fill="#df9fb9" opacity=".75" />
          </pattern>
          <pattern
            id={`${id}-gold`}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2.5" cy="2.5" r=".8" fill="#d9b76f" />
          </pattern>
          <clipPath id={`${id}-drop`}>
            <rect width="260" height="125" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-drop)`}>
          {[0, 1].map((coin) => (
            <g key={coin} className={`piggy-coin piggy-coin-${coin}`}>
              <circle
                cx="127"
                cy="44"
                r="18"
                fill="var(--card)"
                stroke="#d9b76f"
                strokeWidth="1.5"
              />
              <circle
                cx="127"
                cy="44"
                r="13.5"
                fill={`url(#${id}-gold)`}
                stroke="#d9b76f"
                strokeWidth=".8"
              />
              <path
                d="M125 37h4v14h-4z"
                fill="var(--card)"
                stroke="#d9b76f"
                strokeWidth="1"
              />
            </g>
          ))}
        </g>
        <g
          fill="none"
          stroke="#df9fb9"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M57 157c-26 4-31-21-17-24 12-2 9 17-1 12" />
          <path
            d="M57 151c6-25 30-40 61-40 17 0 30 3 41 9l19-14 1 27c10 8 16 17 18 27l21 3v27l-25 4c-5 7-11 12-19 16l-3 15h-17l-3-10c-18 4-37 3-54-2l-4 12H76l-2-22c-16-12-24-30-17-52Z"
            fill={`url(#${id}-pink)`}
          />
          <path d="m164 123 8-7v16" />
          <path d="M112 125h29" strokeWidth="4" stroke="var(--card)" />
          <path d="M112 125h29" />
          <circle cx="181" cy="154" r="2" fill="#df9fb9" stroke="none" />
          <path d="M208 173v7M77 216h15m63 0h16" />
        </g>
      </svg>
      <p className="text-muted-foreground text-sm">
        Select Edit to add your first holdings.
      </p>
    </div>
  );
}
