# Design

World: **daylight glass**. Warm paper floor, soft colour only in the atmosphere behind the glass, achromatic type and one black action per section. The iridescent nucleus and its ring remain the brand object on the desktop home page.

## Colour
| Token | Value | Use |
|---|---|---|
| --bg | #f7f4f0 | page ground |
| --ink | #0d0d12 | text, primary buttons, mark |
| --ink-2 | #383842 | reading text |
| --mute | #55555f | captions and metadata (AA on glass) |
| --line | rgba(13,13,18,.11) | hairlines |
| --glass | rgba(255,255,255,.58) | surfaces |
| --glass-strong | rgba(255,255,255,.78) | nav, forms |
| --glass-line | rgba(255,255,255,.74) | glass edge |

The fixed `.aurora` layer carries peach, lilac, mint and rose radial washes. It is atmosphere, never a text background on its own.

## Type
- Display: Archivo Variable, 700–800, tracking −0.038em. Large, quiet, sentence case.
- Reading: Familjen Grotesk Variable, 17px / 1.6, measure ≤ 62ch.
- Data: Martian Mono Variable for eyebrows, prices, counts and labels.
- Brand: Syncopate 700 for the ZANNID wordmark.

## Surfaces
Glass: gradient white fill, 1px white edge, blur + saturation, one soft shadow, inner top highlight. Used on nav, cards, pricing tables, forms and the mobile menu. One radius family (26px / 16px); pills only for actions and filters.

## Layout
Generous vertical rhythm (68–124px), 1240px content rail, left-aligned copy. On desktop home the content is capped at 760px with a reserved right column for the orbit. Below 1024px everything stacks and the orbit is removed.

## Motion
One authored moment: the ring turns clockwise with scroll; the nucleus follows the pointer. Everything else is a short fade-up on entry. Reduced motion freezes the ring and removes reveals. No pinned or scroll-hijacked sections anywhere.

## Icons
One 1.75px stroke set in `src/components/Icon.astro`. No emoji as icons (emoji only in copy).
