/**
 * Journey scroll engine.
 *
 * One passive scroll listener, one rAF per frame, one class change per chapter.
 * The active chapter is derived from the scroll position itself, so the pinned
 * spread can never drift out of sync with the text.
 *
 * Base CSS lays the chapters out as a normal stacked story. This script only
 * upgrades that to the pinned, page-turning spread when the viewport is wide
 * enough and the visitor has not asked for reduced motion.
 */

const flow = document.querySelector<HTMLElement>('[data-flow]');
const stage = flow?.querySelector<HTMLElement>('[data-stage]');
const scenes = flow ? [...flow.querySelectorAll<HTMLElement>('.jr-scene')] : [];
const tabs = flow ? [...flow.querySelectorAll<HTMLAnchorElement>('[data-tab]')] : [];
const counter = flow?.querySelector<HTMLElement>('[data-count-current]');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrow = window.matchMedia('(max-width: 767px)');

let index = -1;
let top = 0;
let step = 1;
let live = false;
let lastPaint = 0;
let trailing = 0;

function setActive(next: number): void {
  index = next;

  scenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle('is-active', sceneIndex === next);
    scene.classList.toggle('is-before', sceneIndex < next);
  });

  tabs.forEach((tab, tabIndex) => {
    if (tabIndex === next) tab.setAttribute('aria-current', 'true');
    else tab.removeAttribute('aria-current');
  });

  if (counter) counter.textContent = String(next + 1).padStart(2, '0');
}

function paint(force = false): void {
  if (!live || !flow) return;

  const raw = Math.max(0, (window.scrollY - top) / step);
  const next = Math.max(0, Math.min(scenes.length - 1, Math.floor(raw)));
  // -1 … 1 across one chapter, for the paper's parallax drift.
  const local = Math.max(-1, Math.min(1, (raw - next - 0.5) * 2));

  flow.style.setProperty('--jr-shift', local.toFixed(3));
  if (next !== index || force) setActive(next);
}

function measure(): void {
  if (!flow || !stage) return;
  const rect = flow.getBoundingClientRect();
  top = rect.top + window.scrollY;
  step = Math.max(1, (flow.offsetHeight - stage.offsetHeight) / Math.max(1, scenes.length));
}

function applyMode(): void {
  if (!flow) return;

  // A pinned spread only works if the tallest chapter fits the viewport;
  // a long story on a short screen falls back to the stacked reading.
  const tallest = scenes.reduce((max, scene) => Math.max(max, scene.offsetHeight), 0);
  const fits = tallest + 132 <= window.innerHeight;
  const shouldLive = !reduceMotion.matches && !narrow.matches && scenes.length > 1 && fits;
  if (shouldLive === live) {
    if (live) {
      measure();
      paint(true);
    }
    return;
  }

  live = shouldLive;
  flow.classList.toggle('is-live', live);
  flow.style.setProperty('--jr-shift', '0');

  if (live) {
    measure();
    setActive(0);
    paint(true);
  } else {
    scenes.forEach((scene) => scene.classList.remove('is-before'));
  }
}

if (flow && scenes.length) {
  applyMode();

  // Throttled timers rather than requestAnimationFrame: when the tab is
  // occluded rAF can stop firing, which would leave the spread frozen for
  // good. A trailing paint always lands on the final scroll position.
  addEventListener(
    'scroll',
    () => {
      if (!live) return;
      const now = performance.now();
      if (now - lastPaint > 12) {
        lastPaint = now;
        paint();
      }
      window.clearTimeout(trailing);
      trailing = window.setTimeout(() => {
        lastPaint = performance.now();
        paint();
      }, 90);
    },
    { passive: true },
  );

  document.addEventListener('visibilitychange', () => {
    if (!live || document.hidden) return;
    measure();
    paint(true);
  });

  addEventListener('resize', () => {
    if (!live) return;
    measure();
    paint(true);
  });

  reduceMotion.addEventListener('change', applyMode);
  narrow.addEventListener('change', applyMode);

  if ('ResizeObserver' in window && stage) {
    new ResizeObserver(() => {
      if (!live) return;
      measure();
      paint(true);
    }).observe(stage);
  }

  addEventListener('load', () => {
    if (!live) return;
    measure();
    paint(true);
  });

  tabs.forEach((tab, tabIndex) => {
    tab.addEventListener('click', (event) => {
      if (!live) return;
      event.preventDefault();
      const target = top + step * tabIndex + 2;
      window.scrollTo({
        top: target,
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
      });
    });
  });
}
