Owner-approved operational history feedback (2026-11-11): backend, storage, budget and evidence-guard failures show concise professional unavailable/retry copy in the app; do not expose operator recovery instructions or raw technical errors. Keep technical causes in sanitized server diagnostics. Preserve specific ticker/history limitations and known retry timing, without inventing inception or prices. Provisional-source disclosure accompanies displayed results. Existing layout and approved supporting typography remain.

Owner-approved naming flow (2026-11-11): new-portfolio name input starts blank with ?New portfolio? as its placeholder; preview the same label until the user enters a name. Do not show an empty-name or duplicate error on opening or while typing. Validate on Done; keep the editor open, mark the field invalid and show a suggested alternative only after a conflict is submitted. Saving stays disabled for a blank or duplicate name.

Owner-approved mascot replacement (2026-11-11): the monochrome angled bear with aviator sunglasses, neutral mouth and suit collar supersedes the earlier amber-lens header/favicon mark below. Shared TikrLogo uses the approved 27-frame turn with a fixed collar, a slight dip, one-second right hold and an approximately ten-second rest between repetitions. Keep the icon still under reduced motion. Browser favicon and Apple touch icon are static bear heads; the existing dashboard cruiser illustration is outside this change.

Owner-approved history feedback (2026-11-10): retain the existing layout. Default new timeframe controls to 1W while preserving saved selections. Show every affected ticker and its actual safe limitation in readable destructive red text inside the live result status; meaning must remain understandable without color. Confirmed short history names the established available start and suggests a shorter period; source failures and missing bars must not claim inception. Keep budget/cooldown messages and known retry time distinct. The editor says ?Allocation is valid. History is checked separately.? rather than claiming results are current based on allocation alone.

Owner decision (2026-11-10, owner testing): request rate throttles and ephemeral visitor admission limits are removed for now, superseding earlier browsing token-bucket/visitor requirements below. Catalog import failures permit the next explicit retry without daily attempt or cooldown lockout. The editor pauses search after failure until Retry search; overlapping imports retain the same atomic catalog lease. Shared storage/I/O/provider budgets, four active hosted request slots, source refresh policy, correction/revocation/abandoned guards and lease ownership remain enforced. Historical ledger/attempt records are retained. Hosted access remains public and unauthenticated. Restore appropriate server-side request limiting as the final task before broader release; this change does not authorize deployment, live activation or credentials.

Asset search clarification (2026-11-10): show the actual sample/personal/hosted catalog source after a response. Empty sample search explains its six-asset scope; configured-but-disabled market data shows an activation error and no sample substitute. Malformed successful responses show unavailable/retry feedback. Existing layout and visual rules are unchanged.

Asset search implementation (2026-11-10): retain the existing editor styling and native keyboard/touch buttons. Search waits 180 ms after input, aborts superseded requests and rejects superseded responses. Announce prompt/loading/result-count/empty/unavailable states. Results show ticker and provider name, without an inferred ETF label; history availability is checked separately. At six holdings, disable additions while keeping selected assets removable and announce the limit. Show labeled sample results in the unconfigured demo, safe rate/budget/cooldown messages with known retry timing, and a Retry search action after failure.

# Tikr design direction

Market admission feedback (approved 2026-11-10): existing status text distinguishes browsing rate limits, refresh cooldowns, shared budget exhaustion and missing history, with a readable retry-after time when known. Retain dated stale-result context, accessible live status and the existing retry control. This is feedback within the existing visual system; no visual redesign is approved.
Owner decision (2026-11-05): portfolio name errors use a visible destructive-colored input border and message, following shadcn's invalid field pattern. Timeframe controls omit Max.

Owner-approved naming feedback (2026-11-05): show name conflicts inline beside the name field, mark the field invalid and disable save until resolved. Suggestions remain text until the user enters their choice. Dashboard cards include holding tickers beside asset counts to distinguish portfolios, including older records with identical names.


Owner update (2026-10-30): use SPY in place of VOO throughout the frontend benchmark controls, legends, difference labels and sample catalog. SPY remains an explicitly named S&P 500 ETF proxy with the existing dashed benchmark styling and tooltip rules. Historical VOO references below record the earlier design; this decision supersedes their ticker choice without changing layout or colors.


Last reconciled: 2026-10-30. Visual direction is approved; proposed screen copy/routes remain proposals in `product.md`.

## Character

Near-AMOLED black, warm stone-white typography, matte charcoal cards, restrained charts, and sparse luminous globe pixels. Sophisticated and approachable, not a dense trading terminal.

The owner replaced the initial pastel-card interpretation with dark stone cards. Do not reintroduce pastel fills based on the reference.

## Approved palette

| Role | Hex | Usage |
| --- | --- | --- |
| Ink black | `#080808` | App/landing background |
| Stone black | `#111111` | Cards and primary surfaces |
| Soft charcoal | `#1C1C1A` | Hover/elevated surfaces |
| Warm graphite | `#2B2B28` | Subtle borders |
| Stone white | `#E7E5E4` | Text, titles, primary portfolio line |
| Warm gray | `#A8A29E` | Supporting text |
| Muted stone | `#78716C` | Dashed VOO line, not default body text |
| Chalk white | `#F5F5F4` | Bright login panel |
| Globe red | `#F87171` | Sparse glowing pixels |
| Globe green | `#4ADE80` | Sparse glowing pixels |

- Flat fills, minimal shadows, restrained rounding; no glossy gradients, bevels, or glassmorphism.
- Card variation stays within subtle charcoal/stone shifts.
- Glow is localized to globe accents. Card color does not indicate investment quality.
- Define visible focus/selection/error states; subtle surface borders alone are insufficient feedback.
- Check contrast on actual surfaces; do not further dim muted text. Color alone must not communicate status.

## Typography and components

- Cabinet Grotesk in bold for titles; Manrope for body text and controls. Use tabular numerals for aligned financial data where supported.
- Supporting gray text throughout the app uses a readable 14px monospace treatment, 1.8 line height and slightly expanded letter spacing, following the owner's reference. Titles and controls retain their existing typography.
- Clear hierarchy, generous whitespace, warm stone-white primary text.
- Tailwind-first styling, shadcn/ui foundations, Lucide icons.
- If shadcn is installed, map palette into its theme contract rather than adding a parallel token system.
- Keep global CSS focused on tokens, base styles, typography, and genuine global behavior.
- Semantic controls, accessible menus/dialogs/fields, keyboard navigation, and no essential hover-only actions.

## Landing and globe

- Clear historical-experimentation message, build CTA, optional example action.
- Landing page uses the owner-supplied v0 wireframe dot-matrix globe: monochrome coastlines, dotted land and fine geographic grid, with slow rotation. Drag and arrow keys rotate it; automatic rotation resumes after interaction. Respect reduced-motion preferences, and do not show zoom or pause controls. Center the landing content in the viewport space below the header. Land dots within three degrees of New York, London, Hong Kong, Singapore, and Shanghai share a slowly fading red or green effect for each city as decorative accents, not live market signals; reduced motion shows static accents.
- Use credible geography, not an arbitrary sphere presented as an accurate map.
- Honor reduced motion, provide a static fallback, avoid rapid flashing, and keep animation lightweight.
- A polished static placeholder is acceptable early; animation must not block core portfolio work.

## Dashboard and charts

- Empty dashboard: center an always-open, forward-facing briefcase with a stone-gray frame, dark wireframe-grid lining in the lid and perspective tray, and a green-line graph card floating in front of the lid. Follow the owner's open-briefcase reference; no opening/closing loop. The graph gently bobs in place and stays visible; reduced motion keeps it static. Retain "Your portfolios will appear here." and the build/sample actions.
- Card hierarchy: name/pin, prominent return, smaller hypothetical value and VOO difference, chart, asset count/controls.
- Chart occupies most of the card. Do not label portfolio values Current price.
- Chart background matches its card; no inset black rectangle on a colored panel.
- Owner refinement (2026-10-26): use square, clickable dashboard cards with only title, asset count, percentage and signed dollar change, graph, and a small legend. Center dashboard content below the taskbar. Place one shared VOO ETF toggle above the cards; portfolio management belongs in the workspace. No drag handles/manual ordering.
- Owner refinement (2026-10-26): timeframe is one isolated button showing the current period. Hover expands a horizontal row to its left on desktop and right on mobile; the mobile control aligns to the left edge of its section. Leaving collapses it. Selection updates the current period. Provide tap and keyboard access, Escape/outside dismissal, and reduced-motion support.
- Responsive grid, readable single-column mobile layout, no tiny squeezed labels.
- shadcn line chart, not the reference bars. Stone-white primary line; dimmer dashed VOO.
- Distinguish additional portfolios with labeled neutral tones/line styles, not indistinguishable white paths.
- Sparse axis labels/subtle gridlines; pointer/touch tooltips identify date, series, and units.
- Percentage growth by default, explicit units for dollar view.
- Visible data/sample status, actual period, and concise assumptions.

## Workspace

- An empty portfolio shows a pink outline/dot-matrix piggy bank and gold outline/dotted coins with the line "Select Edit to add your first holdings." Coins gently drop into the slot; reduced motion shows a static coin. No grid or glossy fill.
- Performance labels read "Ending value" and "Difference vs VOO". The performance card omits repeated demo copy; the app-level demo indicator remains visible.

- Editor/results together. Side-by-side desktop and logical mobile stack are proposed compositions pending prototype review.
- Allocation remaining/excess indicator stays visible and actionable; invalid state cannot rely only on red/green.
- Keep related-asset explanations compact and factual. AI discovery needs input counter, remaining quota, loading, no-match, limit, and fallback states.

## Login

- Split screen: chalk-white sign-in area with dark text; black globe area.
- Continue with Google only; no Apple/email/password, forgot-password link, or separate signup form.
- Short heading; Sign in to save your portfolio when arriving from guest save.
- Small Terms/Privacy links. Readable disclaimer: Hypothetical results only. Past performance does not guarantee future returns.
- Use the landing wireframe globe on the dark login panel, without the landing zoom entrance; no testimonial carousel.
- Mobile prioritizes login controls and may hide the large globe, but keeps disclaimer available.
- Prototype demo entry is explicitly separate from genuine Google authentication.

## Reference provenance

Screenshots were supplied in this conversation; originals are not checked into the repository. IDs below identify attachments, not local project files.

| Reference | Conversation image ID | Interpretation |
| --- | --- | --- |
| Pixel globe | `image_dec39a94-9a76-40f6-ac47-49864e49eb64` | Texture/contrast; add sparse red/green accents |
| Rounded cards | `image_1aac5196-f96f-417b-b599-8dc21aca011d` | Proportions/rounding, not pastel fills or bars |
| Exchange chart | `image_625cf91a-e193-4316-8329-80dd15af7497` | Restrained lines and compact period controls |
| Split login | `image_7a8900ae-8335-4e9a-9d59-34676a98b8e6` | Composition, not photo/testimonial/extra auth |

If attachments are unavailable, follow written rules and request repository-owned assets when visual comparison is needed. Do not claim to have seen unavailable references.

## Implementation baseline

The frontend and App Router refactor are merged into the actual app's main branch. The owner reports the frontend is virtually complete. The UI includes Cabinet Grotesk titles, Manrope body text, matte near-black/stone surfaces, bright sign-in preview, portfolio cards, and the workspace. Landing and sign-in reuse the geographic wireframe globe, superseding the early static-sphere placeholder. Chart colors, tooltips, editing dialogs, and empty states have subsequent owner refinements recorded below. Browser regression after the route/provider refactor remains separate from owner-reported design completion. See `plan.md` for verification and integration gaps.

## Review checklist

Desktop/mobile, keyboard/focus, contrast, touch charts, reduced motion, long names, empty/loading/error states, invalid allocations, quota exhaustion, and draft preservation. A v0 prompt is a starting point; review its output before marking design accepted.

- Owner refinement (2026-10-26): chart legends use actual line samples matching each series, with the benchmark labeled ?VOO?; the shared control identifies it as an ETF.

- Owner refinement: dashboard return percentages are green for gains, red for losses, and neutral at zero; retain signed figures so color is not the only indicator.

- Owner refinement: comparison portfolios use distinct, muted colors (avoiding red and green) with matching legend samples; the main portfolio uses green for positive total return, red for negative, and stone-white for zero; VOO remains dashed gray.

- Owner refinement (2026-10-27): card surfaces use matte #111111, as selected by the owner. Total return and the main chart line use green for gains, red for losses, and stone-white for zero.

- Landing globe replacement (2026-10-27): adapted from `wireframe-dot-matrix-globe.zip`; local Natural Earth land assets and a matching static fallback. The login illustration is unchanged.

- Landing headline reveals word by word, briefly highlighting ?portfolio? and ?simpler? in green with a pause after ?portfolio.? Reduced motion displays the complete headline immediately.

- After the headline entrance, the landing globe fades in while zooming out to its normal size. Reduced motion shows it immediately.

- Workspace refinement: lead with the simulation value and chart, followed by the holdings summary and an expandable editor. Keep comparisons and portfolio actions compact; retain the last result with a clear stale label when simulation inputs change.

- Historical chart lines reveal from left to right with an easeOutQuart curve on load; reduced motion shows them immediately.

- On mobile, place the dashboard timeframe selector on its own left-aligned row below the heading, ahead of the VOO toggle; retain the desktop arrangement.

- On desktop, align the timeframe selector and Show VOO button with Resume Draft; reserve room for leftward expansion. Show VOO is a pressed-state button using the card surface when active. On mobile, the timeframe selector remains on its own row below the heading.

- Portfolio editor actions are visible below the heading: Pin, Edit, Duplicate, Delete. Edit opens a dialog with the existing allocation and simulation controls. Below performance, an allocation-sized treemap shows each asset return using muted green/red tiles and signed returns; a readable list exposes tiny allocations.

- Dialogs fade and scale from 97% to 100% over 220ms with easeOutQuart; exit takes 160ms. Backdrops fade separately. Reduced motion skips both transitions.

- Portfolio chart toolbar places Show VOO and Dollar value pressed-state buttons beside timeframe and Run simulation controls. Timeframe is outside the editor modal. Remove the visible chart-help/data-table/drawdown footer; retain table access for screen readers.

- Portfolio comparisons use an always-visible wrapping row of toggle buttons, with portfolio names always colored to match their graph lines, selected checkmarks, and a two-selection counter. No dropdown or visible checkboxes.

- Editor refinement: asset toggle cards, a searchable catalog, editable allocation rows, an equal-weight button, and a persistent allocation summary with Done. Valid edits update results immediately; incomplete inputs keep the last valid result visible. Chart tooltips display the primary portfolio and selected comparisons together.

- Dashboard pinned cards display a small stone pin at the far right of the title row, vertically centered; long titles truncate without displacing the pin.

- Dashboard timeframe refinement: left-align the picker on desktop and mobile, with options expanding to the right; retain space for the expanded control on desktop.

- Dashboard desktop control order: Resume draft, Show VOO, then the left-aligned timeframe picker. Mobile keeps the picker on its own row first.

## Bear mascot (2026-10-29)
Owner selected a relaxed, slightly grinning bear on a vintage cruiser longboard, riding a gently descending graph. Full-scene and transparent rider assets live in public/brand. A simplified SVG bear-head derivative and raster icon sizes are prepared for owner review. The empty dashboard now uses a continuous sideways skating loop with pause and a static reduced-motion fallback, replacing the briefcase there.

- Owner approved the bear-head preview with black aviator frames, amber lenses and a slimmer grin. Use the approved raster mark with the Tikr wordmark on landing, sign-in and app headers, and for favicon exports.

- Dashboard bear rider uses a low crouch and amber aviators. It cruises left to right and turns back at each edge; a pause control and static reduced-motion state remain available.

- Dashboard rider now kneels with one leg bent and one knee on the deck, skating fully offscreen before turning and returning.

- Dashboard bear uses thicker legs and a monochrome board; the loop waits two seconds offscreen at each end. A standing, arms-out balancing pose is available as an alternate rider.

- Dashboard bear rides standing to the right and kneeling to the left, switching poses offscreen. Both share the fur-tuft silhouette and monochrome board.

- Dashboard empty-state illustration now uses a static wireframe globe grid with gray dots at grid intersections and softly glowing red and green candlesticks. Tiky is absent from this illustration; prior skating assets are retained.

- Dashboard empty-state refinement: match the surrounding #080808 background. Show the entire wireframe globe, with dots at grid intersections and a slow rotation; decorative glowing candlesticks stay fixed in front. Reduced motion keeps the globe static.

- Empty portfolio now uses the same rotating wireframe globe as the dashboard, overlaid with three outlined holdings tiles. The decorative charts are green rising, neutral, and red falling. Tiles gently float; reduced motion displays a static arrangement. Existing guidance remains.


## Verified-result states (2026-11-04)

Retain existing Manrope, near-black/stone surfaces and chart conventions. Dashboard cards remain square native buttons across their full surface, with a textual performance/status description for assistive technology. Keep sign-in explicitly a preview and portfolio definitions labeled browser-local until ownership/authentication is implemented.

A cold result shows loading; a failed/unconfigured verification shows unavailable history without fabricated numbers or demo graphs. A refresh may show a dated previously verified result; known-invalidated or expired evidence removes it. Display actual common dates, as-of/check times and ticker-level blocking history explanations. Server decimal formatting controls metrics/tooltips, while Number conversion serves plot geometry. The detail view includes an accessible daily-value table and same-period asset returns. Retry intent belongs to one explicit request and never carries into edits. Dashboard assumptions describe actual buy-and-hold/payment-date reinvestment and each portfolio's own starting amount, superseding earlier synthetic-demo footer copy.


## Dashboard and comparison review (2026-11-04)

Dashboard cards prioritize a larger chart with percentage and date axes while retaining their padding. Omit routine provider details on cards; keep meaningful freshness, availability, and blocking history notices. In the portfolio view, comparison controls sit below the chart and before asset returns. The visible daily-values disclosure is removed; the chart retains a screen-reader-accessible data table. During timeframe or comparison updates, keep the previous dated result visible with an updating indicator until the replacement is available; never retain expired or blocked results.


Dashboard updates pulse only changing values and charts, with cards switching together after a bounded wait. Portfolio comparisons use consistent assigned colors and animate out on removal when their dates still align. Reduced-motion preferences disable these animations.


Keep the last complete dated snapshot unchanged while a new selection loads; swap only once a complete final response arrives. Start comparison exit on deselection and retain the old chart through its animation. For the explicitly marked synthetic review only, recently completed selection results may be reused briefly in memory. Live or unmarked results still require server-side validity checks.


Personal provisional disclosure (2026-11-05): retain existing typography and status layout; show "Personal provisional Alpaca data; subject to corrections" and the action-completeness limitation on both workspace and compact dashboard results. This copy implements the owner's provisional-data decision without changing approved visual rules.

## 2026-11-12 implementation checkpoint

Preserve professional unavailable/retry messages, explicit
period choices, 1W migration, submit-time names and provisional disclosure through
the cache redesign. Synthetic QA responses have an explicit non-market-data disclosure. Browser acceptance status is recorded in
[market-redesign-checkpoint.md](market-redesign-checkpoint.md).

The QA follow-up retains fractional percent-axis labels and enough axis room to
avoid clipping, including compact cards. Palette, typography and layout rules
remain unchanged. Final evidence is in `market-browser-acceptance.md`.


## November13 operational feedback

The existing inline status area now carries precise active/interrupted/legacy
refresh copy, actual retry timing and a wrapping error reference. Layout, approved
Manrope typography, near-black/stone palette, chart conventions and reduced-motion
behavior remain. No new operator recovery instructions appear in the product.
Verification details are in `history-refresh-journal.md`.

Monthlyusage ownernotice: small flat bordered status in existing app shell, available
only on loopback ownerreview43202. Normal/incomplete state neutral; warning amber,
urgent/stop red with status/alert roles. Details collapse normal-state limits and
coverage; no accountusage/credentials fetched on public origins. 390pxnooverflow
verified. This is operatorvisibility, not publicbilling UI. See convex-usage-monitoring.md.

Owner decision (2026-11-13): portfolio cards omit the provisional Alpaca informational disclosure; retain actionable refresh/history errors and synthetic QA labels.

Owner UI decision (2026-11-13): no operational usage banner, dashboard Retry or error
reference identifiers in the UI. Editor Retry remains. Compact chart wrappers use full
width and explicit176px plot height. Safe actionable failure text remains; synthetic
QA labels stay visible only in isolated fixture builds. See mvp-history-readiness.md.
