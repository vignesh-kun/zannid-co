const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Sticky header state ─────────────────────────────────────────────── */
const head = document.querySelector<HTMLElement>('[data-head]');
const syncHead = () => head?.classList.toggle('is-scrolled', window.scrollY > 16);
addEventListener('scroll', syncHead, { passive: true });
syncHead();

/* ── Mobile menu ─────────────────────────────────────────────────────── */
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.querySelector<HTMLElement>('[data-menu]');

function setMenu(open: boolean, restoreFocus = false) {
  if (!menuToggle || !menu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('.sr')!.textContent = open ? 'Close menu' : 'Open menu';
  menu.hidden = !open;
  if (open) {
    menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
  } else if (restoreFocus) {
    menuToggle.focus({ preventScroll: true });
  }
}

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
menu?.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false, true);
  }
});
addEventListener('resize', () => {
  if (window.innerWidth >= 1024) setMenu(false);
});

/* ── Scroll reveals (no pinned or hijacked sections) ─────────────────── */
const revealItems = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-in'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add('is-in');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ── Currency toggle: locale default, user override remembered ───────── */
type Currency = 'INR' | 'USD';
const currencyButtons = [...document.querySelectorAll<HTMLButtonElement>('button[data-currency]')];
const hasPrices = Boolean(document.querySelector('[data-money]'));
if (hasPrices) {
  const key = 'zannid-currency';
  const root = document.documentElement;
  const status = document.getElementById('currency-status');

  const localeCurrency = (): Currency => {
    let language = navigator.language || 'en-IN';
    try {
      language = navigator.languages?.[0] || language;
    } catch {
      /* keep the browser language */
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isIndia =
      /-IN$/i.test(language) || /^Asia\/(Calcutta|Kolkata)$/i.test(timeZone);
    return isIndia ? 'INR' : 'USD';
  };

  const apply = (currency: Currency, persist = false) => {
    root.dataset.currency = currency;
    currencyButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.currency === currency));
    });
    document.querySelectorAll<HTMLElement>('[data-money]').forEach((el) => {
      const value = currency === 'INR' ? el.dataset.inr : el.dataset.usd;
      if (value) el.textContent = value;
    });
    document.querySelectorAll<HTMLElement>('[data-unit-money]').forEach((el) => {
      el.textContent = currency === 'INR' ? 'INR' : 'USD';
    });
    if (status) {
      status.textContent = `Prices shown in ${currency === 'INR' ? 'Indian rupees' : 'US dollars'}.`;
    }
    if (persist) {
      try {
        localStorage.setItem(key, currency);
      } catch {
        /* storage may be unavailable */
      }
    }
  };

  let saved: string | null = null;
  try {
    saved = localStorage.getItem(key);
  } catch {
    saved = null;
  }
  const initial: Currency =
    saved === 'INR' || saved === 'USD' ? (saved as Currency) : localeCurrency();

  apply(initial);
  currencyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currency = button.dataset.currency === 'USD' ? 'USD' : 'INR';
      apply(currency, true);
    });
  });
}
