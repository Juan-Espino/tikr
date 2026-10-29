# v0 prototype inspection

Inspected before modifying application source: `C:\Users\JuanE\OneDrive\Downloads\tikr-portfolio-prototype.zip`. Archive contains one client page with four state-switched screens, a button component, utility, theme CSS, configuration and placeholder image assets. There are no nested AGENTS.md files in the archive or application source directories.

## Reused

Landing hierarchy/CTA composition, split bright login, stone dashboard cards, side-by-side editor/results, six sample asset names, three example names, Lucide icons, shadcn/Base UI button and class utility. Layout/theme were adapted into `src/` with the existing `~` alias. Placeholder branding/images were not imported. The globe was replaced with an honestly decorative static sphere.

## Dependency differences

ZIP requests Next 16.4, pnpm 12.3.4, TypeScript 5.7, Node types 24, Tailwind 4.3, React 19, Base UI, Lucide, CVA, clsx, tailwind-merge, shadcn CLI/runtime CSS, tw-animate-css and Vercel analytics. Existing app uses Next 15, pnpm 10.11.0, TypeScript 5, Node types 20, Tailwind 4, React 19, Convex, T3 env and Zod.

Retained repository framework/package-manager/configuration and Convex. Added Base UI, Lucide, CVA, clsx and tailwind-merge for copied UI, plus Recharts for actual data-driven accessible line charts. No Next 16 migration, shadcn CLI dependency, animation package or analytics. Existing dependency versions in the lockfile remain as resolved by the app; ZIP lockfile was not copied.

## Mocked behavior and conflicts corrected

- Google and demo buttons both entered dashboard; now Google is disabled and demo entry explicitly states no account is created.
- Save/cancel merely changed screen; cards all opened one hard-coded portfolio; menus/settings were inert. Replaced by local CRUD/persistence and explicit screen navigation.
- Weight fields were uncontrolled, never validated, and three equal values totaled 99.99%. Replaced by integer basis-point validation and deterministic remainder handling.
- Returns/ending values/drawdown and SVG paths were unrelated constants. VOO was listed without a plotted line. Replaced by one deterministic sample-series calculation used for chart and metrics.
- Timeframe changed labels but not history. Added common-date simulations; independent VOO and saved comparisons.
- Colored return lines implied quality; replaced by neutral stone styles. Very dim labels were raised to readable warm gray. Semantic fields, named icon buttons, focus rings and reduced-motion handling added.
- Global Arial overrode intended font; replaced with Manrope. The arbitrary dot pattern was presented as a world map/live-like market signals; replaced with decorative sphere and no-live-signals disclosure.
- A hover-expanding timeframe widget obscured options, cards were nonsemantic click targets, mobile menu was inert. Replaced with native select, explicit card links/buttons, and visible navigation.

## Explicitly deferred

No real auth, market data, Groq, database portfolio model, server quotas or deployments. Sample fixture methodology and demo safeguards do not approve production financial or limit policies. Dedicated routes, full shadcn ChartContainer adoption, geographic animation and owner visual acceptance remain follow-up work; see `plan.md`.
