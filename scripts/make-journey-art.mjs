/**
 * Draws the seed Journey illustrations and writes them as transparent PNGs.
 *
 *   node scripts/make-journey-art.mjs
 *
 * The art is authored geometry in the site palette, rasterised with sharp, so
 * every file really is a PNG with an alpha channel (and real transparent
 * pixels) — the same thing the dashboard's uploader validates. Replace any of
 * them from /admin → Journey.
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/assets/journey';

const INK = '#14141b';
const PAPER = '#fffdf9';
const PEACH = '#ffcaa9';
const APRICOT = '#ef9459';
const LILAC = '#ccc3ff';
const MINT = '#aee3cc';
const ROSE = '#ffd0dc';
const SAND = '#e8ddcd';

const defs = `
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f4ece0"/>
    </linearGradient>
    <radialGradient id="glass" cx="0.36" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.32" stop-color="#ffe3cf"/>
      <stop offset="0.6" stop-color="#d9d2ff"/>
      <stop offset="0.82" stop-color="#bfe9d8"/>
      <stop offset="1" stop-color="#f6d9e2"/>
    </radialGradient>
    <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PEACH}"/>
      <stop offset="0.55" stop-color="${ROSE}"/>
      <stop offset="1" stop-color="${LILAC}"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${PEACH}"/>
      <stop offset="0.5" stop-color="${ROSE}"/>
      <stop offset="1" stop-color="${MINT}"/>
    </linearGradient>
  </defs>`;

const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">${defs}${body}</svg>`;

const art = {
  '01-note': wrap(`
    <g transform="rotate(-7 300 300)">
      <path d="M150 118h300v336l-26 20-30-18-28 18-30-20-28 18-30-18-28 20-28-20-30 18-22-20z"
            fill="url(#paper)" stroke="#e2d6c4" stroke-width="3"/>
      <path d="M150 118h300v44H150z" fill="#ffffff" opacity=".55"/>
      <g transform="translate(214 196) scale(1.52)" fill="${INK}">
        <path d="M10 28 96 12h8L40 92l66-8-8 20L8 112H0l66-78-62 6z"/>
        <path d="M-8 76 126 46" stroke="${PAPER}" stroke-width="7"/>
      </g>
      <path d="M196 412h208" stroke="#c9bba8" stroke-width="3" stroke-dasharray="9 11"/>
      <circle cx="300" cy="452" r="9" fill="${APRICOT}"/>
    </g>
    <circle cx="470" cy="128" r="26" fill="${PEACH}"/>
    <circle cx="106" cy="470" r="13" fill="${LILAC}"/>
  `),

  '01-threads': wrap(`
    <path d="M148 178C214 104 330 128 292 268" fill="none" stroke="${INK}" stroke-width="4"
          stroke-dasharray="7 10" opacity=".45" stroke-linecap="round"/>
    <path d="M430 226C452 320 414 388 322 306" fill="none" stroke="${INK}" stroke-width="4"
          stroke-dasharray="7 10" opacity=".45" stroke-linecap="round"/>
    <path d="M356 442C300 470 246 440 296 322" fill="none" stroke="${INK}" stroke-width="4"
          stroke-dasharray="7 10" opacity=".45" stroke-linecap="round"/>
    <circle cx="148" cy="176" r="50" fill="${ROSE}"/>
    <circle cx="432" cy="218" r="40" fill="${LILAC}"/>
    <circle cx="358" cy="446" r="56" fill="${MINT}"/>
    <circle cx="300" cy="300" r="30" fill="${INK}"/>
    <circle cx="300" cy="300" r="52" fill="none" stroke="${INK}" stroke-width="2" opacity=".22"/>
    <circle cx="470" cy="418" r="11" fill="${APRICOT}"/>
  `),

  '02-orbit': wrap(`
    <ellipse cx="300" cy="306" rx="222" ry="74" transform="rotate(-21 300 306)"
             fill="none" stroke="${INK}" stroke-width="7"/>
    <ellipse cx="300" cy="306" rx="222" ry="74" transform="rotate(-21 300 306)"
             fill="none" stroke="${INK}" stroke-width="26" opacity=".05"/>
    <circle cx="300" cy="300" r="92" fill="url(#glass)"/>
    <circle cx="300" cy="300" r="92" fill="none" stroke="#ffffff" stroke-width="4" opacity=".85"/>
    <circle cx="300" cy="300" r="56" fill="#ffffff" opacity=".25"/>
    <circle cx="456" cy="212" r="19" fill="${INK}"/>
    <circle cx="132" cy="404" r="10" fill="${APRICOT}"/>
  `),

  '02-strips': wrap(`
    <g transform="rotate(-7 300 300)">
      <rect x="112" y="158" width="322" height="46" rx="10" fill="${INK}"/>
      <rect x="146" y="218" width="322" height="46" rx="10" fill="${PEACH}"/>
      <rect x="126" y="278" width="322" height="46" rx="10" fill="${LILAC}"/>
      <rect x="160" y="338" width="322" height="46" rx="10" fill="${MINT}"/>
      <rect x="134" y="398" width="322" height="46" rx="10" fill="${ROSE}"/>
      <circle cx="408" cy="181" r="8" fill="${PAPER}"/>
      <circle cx="160" cy="301" r="8" fill="${PAPER}"/>
    </g>
  `),

  '03-camera': wrap(`
    <g transform="rotate(-5 300 300)">
      <rect x="116" y="186" width="368" height="262" rx="48" fill="${INK}"/>
      <rect x="206" y="140" width="126" height="62" rx="18" fill="${INK}"/>
      <circle cx="300" cy="316" r="94" fill="${PAPER}"/>
      <circle cx="300" cy="316" r="70" fill="url(#lens)"/>
      <circle cx="300" cy="316" r="28" fill="${INK}"/>
      <circle cx="276" cy="292" r="12" fill="#ffffff" opacity=".8"/>
      <circle cx="152" cy="234" r="17" fill="${APRICOT}"/>
      <rect x="392" y="222" width="46" height="16" rx="8" fill="${PAPER}" opacity=".55"/>
    </g>
    <circle cx="486" cy="126" r="14" fill="${MINT}"/>
  `),

  '03-film': wrap(`
    <g transform="rotate(-13 300 300)">
      <rect x="64" y="248" width="472" height="104" rx="14" fill="${INK}"/>
      <rect x="80" y="296" width="440" height="14" fill="${PEACH}" opacity=".9"/>
      ${Array.from({ length: 9 })
        .map((_, i) => `<rect x="${82 + i * 50}" y="264" width="24" height="18" rx="4" fill="${PAPER}" opacity=".8"/>`)
        .join('')}
      ${Array.from({ length: 9 })
        .map((_, i) => `<rect x="${82 + i * 50}" y="318" width="24" height="18" rx="4" fill="${PAPER}" opacity=".8"/>`)
        .join('')}
    </g>
    <circle cx="118" cy="432" r="12" fill="${LILAC}"/>
    <circle cx="470" cy="146" r="9" fill="${APRICOT}"/>
  `),

  '04-bars': wrap(`
    <path d="M118 498h384" stroke="${INK}" stroke-width="4" opacity=".28"/>
    <rect x="136" y="372" width="62" height="126" rx="12" fill="${MINT}"/>
    <rect x="216" y="312" width="62" height="186" rx="12" fill="${LILAC}"/>
    <rect x="296" y="244" width="62" height="254" rx="12" fill="${PEACH}"/>
    <rect x="376" y="152" width="62" height="346" rx="12" fill="${INK}"/>
    <circle cx="407" cy="120" r="20" fill="${APRICOT}"/>
    <circle cx="484" cy="330" r="8" fill="${ROSE}"/>
  `),

  '04-arrow': wrap(`
    <path d="M132 470C246 438 306 330 350 190" fill="none" stroke="${PEACH}" stroke-width="26"
          stroke-linecap="round" opacity=".75"/>
    <g fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">
      <path d="M196 414l62-64 62 64" opacity=".95"/>
      <path d="M196 336l62-64 62 64" opacity=".5"/>
      <path d="M196 258l62-64 62 64" opacity=".24"/>
    </g>
    <circle cx="408" cy="152" r="16" fill="${APRICOT}"/>
    <circle cx="452" cy="220" r="9" fill="${LILAC}"/>
    <circle cx="380" cy="96" r="7" fill="${MINT}"/>
  `),

  '05-rocket': wrap(`
    <g transform="rotate(-16 300 300)">
      <path d="M300 74c78 66 106 158 106 250H194c0-92 28-184 106-250z"
            fill="url(#paper)" stroke="${INK}" stroke-width="7"/>
      <circle cx="300" cy="220" r="44" fill="url(#lens)" stroke="${INK}" stroke-width="7"/>
      <path d="M194 320l-54 96 72-18z" fill="${INK}"/>
      <path d="M406 320l54 96-72-18z" fill="${INK}"/>
      <path d="M262 330c2 54 16 88 38 116 22-28 36-62 38-116z" fill="${APRICOT}"/>
      <path d="M276 326c2 40 12 64 24 84 12-20 22-44 24-84z" fill="${PEACH}"/>
      <path d="M300 168v-30" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    </g>
    <circle cx="128" cy="176" r="10" fill="${MINT}"/>
    <circle cx="478" cy="402" r="14" fill="${ROSE}"/>
    <circle cx="466" cy="126" r="7" fill="${APRICOT}"/>
  `),

  '05-window': wrap(`
    <rect x="146" y="112" width="308" height="372" rx="18" fill="${INK}"/>
    <rect x="174" y="140" width="252" height="316" rx="8" fill="url(#sky)"/>
    <path d="M300 140v316M174 298h252" stroke="${INK}" stroke-width="12"/>
    <path d="M110 492h380l-34 34H144z" fill="${SAND}"/>
    <circle cx="392" cy="200" r="26" fill="#ffffff" opacity=".7"/>
    <path d="M424 132l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill="${APRICOT}"/>
    <circle cx="142" cy="86" r="9" fill="${LILAC}"/>
  `),
};

await mkdir(OUT, { recursive: true });
for (const [name, svg] of Object.entries(art)) {
  const buffer = Buffer.from(svg);
  await sharp(buffer, { density: 144 })
    .resize(900, 900, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}.png`);
  console.log(`wrote ${OUT}/${name}.png`);
}
