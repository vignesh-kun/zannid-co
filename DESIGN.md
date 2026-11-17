# Design

World: "The orbit". Achromatic paper and ink; colour lives only inside the iridescent glass nucleus, the Zanny mascot and photography. The ring around the nucleus is the page's navigation: it turns clockwise with scroll and each section is a checkpoint.

## Colour (Restrained, achromatic)
| Token | Value | Use |
|---|---|---|
| --bg | #fafafa | page ground |
| --paper | #ffffff | tables, panels, form |
| --ink | #0a0a0a | text, primary buttons, rules, rail, best plan |
| --ink2 | #2b2b2b | secondary reading text |
| --mute | #6b6b6b | captions, metadata (≥4.5:1 on --bg) |
| --faint | #9a9a9a | on-ink secondary, dashed series |
| --line | #e4e4e4 | hairlines |
| --soft | #f1f1f1 | bar tracks, estimator cells |
No gradients in UI chrome. No accent colour.

## Type
- Display: Archivo Variable, width 125%, weight 900, uppercase, tracking -0.02em, max 6rem.
- Reading: Familjen Grotesk Variable, 17px / 1.55, measure ≤ 70ch.
- Data: Martian Mono Variable, tabular numerals: prices, counts, countdown, axes only.
- Brand: Syncopate 700: the ZANNID wordmark, GROWTH / SCALE corners and the # mark.

## Shape & space
- One radius: 14px (--r); pills (999px) only for actions and toggles.
- Structure is hairline tables and full-bleed rows (1.5px ink outer, 1px --line inner), never card grids.
- Section rhythm: 140px top, 110px bottom, content column from --gut to 30vw from the right (ring zone).

## Components
Buttons (ink pill, ghost pill), text link (1.5px underline), offer bar → vertical rail, honeycomb service selector + detail table, work strip, reach chart, funnel bars, estimator, DM phone, step table, plan table + comparison, FAQ disclosure, lead form with sending / sent / error states.

## Motion
One authored moment: the ring turning clockwise with scroll, nucleus following the pointer. Data animates once on entry (chart draw, funnel, chat). Easing cubic-bezier(.16,1,.3,1). Reduced motion freezes nucleus wobble and entrances.

## Icons
One stroke set (src/components/Icon.astro), 1.75px, round caps. No emoji as icons (emoji only inside copy).
