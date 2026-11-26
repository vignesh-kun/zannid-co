# Design

World: **liquid glass**. A studio site that behaves like a lit pane of glass over an iridescent ground: curved surfaces, blurred translucency, one specular highlight, and photography doing the explaining. It replaced the "call sheet" world in November 2026. The brand commitments in PRODUCT.md still hold — the iridescent nucleus, the achromatic interface, the Zannid wordmark — but colour now enters through the glass, the logo and the images rather than being withheld.

## Colour
| Token | Value | Use |
|---|---|---|
| --bg | #f4f1f8 | page ground, warm lilac paper |
| --glass | rgba(255,255,255,.56) | pane fill, gradient from .74 to .34 |
| --glass-line | rgba(255,255,255,.7) | pane edge and highlight |
| --ink | #121019 | text, filled actions |
| --ink-2 | #35313f | reading text |
| --mute | #5f5a6c | labels, metadata, captions (AA) |
| --line | rgba(18,16,25,.1) | hairlines inside panes |

The ground is a fixed mesh of violet, cyan, rose, amber and mint radials, drifting on a 42s loop, with a fine grain multiply on top. Cards are white glass over it, so the colour reaches the interface only as light. One text accent runs violet → teal → magenta (`--accent` gradient on `.accent`). The footer is dark glass: deep violet-black with the same mesh, low and warm.

## Type
- Display: Archivo Variable 800, tracking −0.042em, line-height 0.95, sentence case. Headings lead; section labels sit *under* the heading as captions, never as kickers above it.
- Reading: Familjen Grotesk Variable, 17px / 1.58, measure ≤ 58ch.
- Data and labels: Martian Mono Variable, 11px floor, uppercase, tracking 0.1–0.16em. Mono is for metadata, counts, prices, times and citations, never for body copy.
- Brand: the supplied circular Zannid & Co. logo (iridescent orb, ring, wordmark), used as the mark in the header and footer; the Syncopate wordmark is retired from the chrome.

## Surfaces
Everything that holds content is a pane: header capsule, cards, panels, form fields, chips, buttons, facts and the footer. Radii are 18px (inputs, tiles), 28px (cards), 44px (media and closing panels), pills for controls and tags. Each pane uses `backdrop-filter: blur(26px) saturate(1.55)`, a white-to-transparent fill, a 1px white edge, an inset top highlight and a long, cool shadow. No pane sits on a hard border and no shadow is black. Images are always framed by radius and glass; captions are small glass platters inside the frame.

## Layout
1280px rail, `--pad` gutters, rhythm 56–104px. Home: a split hero (copy left, glass-framed studio photograph right with a floating fact pane) over the shader field, then three glass problem cards, a horizontal image rail of what the work looks like, the results pair and metric strip, the proof cards, a 21:9 studio showcase with a glass caption, the client wall, the process grid, and a closing glass panel. Inner pages: the same rail and pane language, with department thumbnails on the services index, a wide story image on About and a work band on Work.

## Motion
Three authored moments. The hero shader (raw WebGL, no library) drifts through soft iridescent ribbons, pauses off-screen and on hidden tabs, caps DPR at 1.5, runs near 30fps and holds one still frame under `prefers-reduced-motion`. The ground mesh drifts on a long loop. Reveals are a 0.75s ease-out rise; content is always visible and only its position animates, so the page reads with no JavaScript. Controls lift 2px, arrows nudge, images scale 1.045 inside their frames.

## Icons
Unchanged: one 1.75px stroke set in `src/components/Icon.astro`, now sitting in rounded glass chips.
