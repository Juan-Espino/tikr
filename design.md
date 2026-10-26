# Tikr design direction

Last reconciled: 2026-10-25. Visual direction is approved; proposed screen copy/routes remain proposals in `product.md`.

## Character

Near-AMOLED black, warm stone-white typography, matte charcoal cards, restrained charts, and sparse luminous globe pixels. Sophisticated and approachable, not a dense trading terminal.

The owner replaced the initial pastel-card interpretation with dark stone cards. Do not reintroduce pastel fills based on the reference.

## Approved palette

| Role | Hex | Usage |
| --- | --- | --- |
| Ink black | `#080808` | App/landing background |
| Stone black | `#151514` | Cards and primary surfaces |
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

- Manrope; tabular numerals for aligned financial data where supported.
- Clear hierarchy, generous whitespace, warm stone-white primary text.
- Tailwind-first styling, shadcn/ui foundations, Lucide icons.
- If shadcn is installed, map palette into its theme contract rather than adding a parallel token system.
- Keep global CSS focused on tokens, base styles, typography, and genuine global behavior.
- Semantic controls, accessible menus/dialogs/fields, keyboard navigation, and no essential hover-only actions.

## Landing and globe

- Clear historical-experimentation message, build CTA, optional example action.
- Reusable monochrome pixel globe, slow spin, few luminous red/green pixels suggesting major market hubs.
- Original reference mentioned ten hubs; cities/locations and color meaning remain unspecified. Do not imply live data without a source.
- Use credible geography, not an arbitrary sphere presented as an accurate map.
- Honor reduced motion, provide a static fallback, avoid rapid flashing, and keep animation lightweight.
- A polished static placeholder is acceptable early; animation must not block core portfolio work.

## Dashboard and charts

- Card hierarchy: name/pin, prominent return, smaller hypothetical value and VOO difference, chart, asset count/controls.
- Chart occupies most of the card. Do not label portfolio values Current price.
- Chart background matches its card; no inset black rectangle on a colored panel.
- Shared timeframe selector, per-card VOO toggle, lightweight secondary actions. No drag handles/manual ordering.
- Responsive grid, readable single-column mobile layout, no tiny squeezed labels.
- shadcn line chart, not the reference bars. Stone-white primary line; dimmer dashed VOO.
- Distinguish additional portfolios with labeled neutral tones/line styles, not indistinguishable white paths.
- Sparse axis labels/subtle gridlines; pointer/touch tooltips identify date, series, and units.
- Percentage growth by default, explicit units for dollar view.
- Visible data/sample status, actual period, and concise assumptions.

## Workspace

- Editor/results together. Side-by-side desktop and logical mobile stack are proposed compositions pending prototype review.
- Allocation remaining/excess indicator stays visible and actionable; invalid state cannot rely only on red/green.
- Keep related-asset explanations compact and factual. AI discovery needs input counter, remaining quota, loading, no-match, limit, and fallback states.

## Login

- Split screen: chalk-white sign-in area with dark text; black globe area.
- Continue with Google only; no Apple/email/password, forgot-password link, or separate signup form.
- Short heading; Sign in to save your portfolio when arriving from guest save.
- Small Terms/Privacy links. Readable disclaimer: Hypothetical results only. Past performance does not guarantee future returns.
- Replace reference photograph/testimonial with globe; no testimonial carousel.
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

The inspected app still uses a Create T3 App starter UI with purple gradients and Geist typography. The approved palette, Manrope, portfolio UI, and globe have not yet been implemented or visually verified. Keep this distinction explicit when reviewing v0 output.

## Review checklist

Desktop/mobile, keyboard/focus, contrast, touch charts, reduced motion, long names, empty/loading/error states, invalid allocations, quota exhaustion, and draft preservation. A v0 prompt is a starting point; review its output before marking design accepted.
