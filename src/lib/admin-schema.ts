import type {
  About,
  Client,
  Faq,
  JourneyMilestone,
  Legal,
  LegalDoc,
  Service,
  SiteConfig,
  TeamMember,
  WorkItem,
} from './site';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const GROUP_SLUGS = ['brand', 'growth', 'digital', 'product', 'care'] as const;

export const ICON_NAMES = [
  'compass',
  'social',
  'camera',
  'film',
  'growth',
  'target',
  'users',
  'code',
  'bolt',
  'strategy',
  'layers',
  'rocket',
  'cloud',
  'phone',
  'package',
  'wrench',
  'shield',
  'refresh',
] as const;

const text = (value: unknown, max = 600): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const list = (value: unknown, max = 60): string[] =>
  Array.isArray(value)
    ? value.map((item) => text(item, 1200)).filter(Boolean).slice(0, max)
    : [];

const rows = (value: unknown, max = 60): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object').slice(0, max) as Record<string, unknown>[]
    : [];

const flag = (value: unknown): boolean => value === true;

/** Only an uploaded illustration, a site path, or an https URL. */
const safeImageSrc = (value: string): boolean =>
  /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(value);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function normalizeServices(input: unknown): Service[] {
  if (!Array.isArray(input)) throw new ValidationError('Services must be a JSON list.');
  const used = new Set<string>();

  return input.slice(0, 200).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const title = text(item.title, 120);
    if (!title) throw new ValidationError(`Service ${index + 1} needs a name.`);

    const base = slugify(text(item.slug, 80) || title) || `service-${index + 1}`;
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    used.add(slug);

    const options = rows(item.options, 12).map((option, optionIndex) => {
      const name = text(option.name, 80);
      if (!name) {
        throw new ValidationError(`“${title}”: option ${optionIndex + 1} needs a name.`);
      }
      return {
        name,
        bestFor: text(option.bestFor, 220),
        timeline: text(option.timeline, 40),
        includes: list(option.includes, 12),
        price: text(option.price, 40),
        showPrice: option.showPrice !== false,
      };
    });

    if (!options.length) throw new ValidationError(`“${title}” needs at least one option.`);

    const group = (GROUP_SLUGS as readonly string[]).includes(text(item.group, 20))
      ? text(item.group, 20)
      : 'brand';

    const icon = (ICON_NAMES as readonly string[]).includes(text(item.icon, 20))
      ? text(item.icon, 20)
      : 'compass';

    return {
      slug,
      title,
      shortTitle: text(item.shortTitle, 40) || title.slice(0, 34),
      group,
      icon,
      summary: text(item.summary, 260),
      showPrice: flag(item.showPrice),
      options,
    };
  });
}

export function normalizeWork(input: unknown): WorkItem[] {
  if (!Array.isArray(input)) throw new ValidationError('Work must be a JSON list.');
  const used = new Set<string>();

  return input.slice(0, 100).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const title = text(item.title, 140);
    if (!title) throw new ValidationError(`Case study ${index + 1} needs a title.`);

    const base = slugify(text(item.key, 60) || title) || `work-${index + 1}`;
    let key = base;
    let suffix = 2;
    while (used.has(key)) {
      suffix += 1;
      key = `${base}-${suffix}`;
    }
    used.add(key);

    return {
      key,
      title,
      client: text(item.client, 120),
      text: text(item.text, 700),
      tag: text(item.tag, 120),
      stat: text(item.stat, 60),
      href: text(item.href, 500),
      image: text(item.image, 600),
      from: text(item.from, 20) || '#e7e2da',
      to: text(item.to, 20) || '#c9c1b4',
    };
  });
}

export function normalizeJourney(input: unknown): JourneyMilestone[] {
  if (!Array.isArray(input)) throw new ValidationError('Journey must be a JSON list of chapters.');
  const used = new Set<string>();
  const now = new Date().toISOString();

  return input.slice(0, 60).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const title = text(item.title, 140);
    if (!title) throw new ValidationError(`Chapter ${index + 1} needs a title.`);

    const base = slugify(text(item.id, 80) || title) || `chapter-${index + 1}`;
    let id = base;
    let suffix = 1;
    while (used.has(id)) {
      suffix += 1;
      id = `${base}-${suffix}`;
    }
    used.add(id);

    const illustrations = rows(item.illustrations, 12).map((art, artIndex) => {
      const src = text(art.src, 800);
      if (!src) {
        throw new ValidationError(`“${title}”: illustration ${artIndex + 1} has no image. Remove it or upload one.`);
      }
      if (!safeImageSrc(src)) {
        throw new ValidationError(
          `“${title}”: illustration ${artIndex + 1} must be an uploaded PNG, a /path, or an https URL.`,
        );
      }
      return {
        src,
        side: art.side === 'right' ? ('right' as const) : ('left' as const),
        alt: text(art.alt, 240),
        order: Number.isFinite(Number(art.order)) ? Number(art.order) : artIndex,
      };
    });

    return {
      id,
      title,
      date: text(item.date, 60),
      subtitle: text(item.subtitle, 240),
      description: text(item.description, 1800),
      category: text(item.category, 40) || 'Milestone',
      order: index,
      published: item.published !== false,
      illustrations,
      createdAt: text(item.createdAt, 40) || now,
      updatedAt: now,
    };
  });
}

export function normalizeClients(input: unknown): Client[] {
  if (!Array.isArray(input)) throw new ValidationError('Clients must be a JSON list.');
  return input.slice(0, 200).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const name = text(item.name, 120);
    if (!name) throw new ValidationError(`Client ${index + 1} needs a name.`);
    return {
      name,
      description: text(item.description, 200),
      logo: text(item.logo, 600),
      website: text(item.website, 400),
      industry: text(item.industry, 60),
    };
  });
}

export function normalizeFaqs(input: unknown): Faq[] {
  if (!Array.isArray(input)) throw new ValidationError('FAQ must be a JSON list.');
  return input.slice(0, 200).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const q = text(item.q, 220);
    const a = text(item.a, 1500);
    if (!q) throw new ValidationError(`Question ${index + 1} is empty.`);
    if (!a) throw new ValidationError(`“${q}” needs an answer.`);
    return { group: text(item.group, 40) || 'General', q, a };
  });
}

export function normalizeAbout(input: unknown): About {
  if (!input || typeof input !== 'object') throw new ValidationError('About must be a JSON object.');
  const item = input as Record<string, unknown>;
  const location = (item.location && typeof item.location === 'object' ? item.location : {}) as Record<string, unknown>;

  const team: TeamMember[] = rows(item.team, 40).map((member, index) => {
    const name = text(member.name, 80);
    if (!name) throw new ValidationError(`Team member ${index + 1} needs a name.`);
    return {
      name,
      role: text(member.role, 80),
      bio: text(member.bio, 400),
      image: text(member.image, 600),
    };
  });

  return {
    eyebrow: text(item.eyebrow, 60),
    title: text(item.title, 140),
    lede: text(item.lede, 600),
    storyTitle: text(item.storyTitle, 140),
    story: list(item.story, 20),
    valuesTitle: text(item.valuesTitle, 140),
    values: rows(item.values, 20).map((value, index) => {
      const title = text(value.title, 80);
      if (!title) throw new ValidationError(`Value ${index + 1} needs a title.`);
      return { title, body: text(value.body, 400) };
    }),
    numbers: rows(item.numbers, 8).map((number) => ({
      value: text(number.value, 20),
      label: text(number.label, 80),
    })),
    team,
    location: {
      city: text(location.city, 60) || 'Hyderabad',
      region: text(location.region, 80),
      address: text(location.address, 240),
      note: text(location.note, 240),
      mapUrl: text(location.mapUrl, 600),
    },
  };
}

export function normalizeSite(input: unknown): SiteConfig {
  if (!input || typeof input !== 'object') throw new ValidationError('Site settings must be an object.');
  const item = input as Record<string, unknown>;
  const email = text(item.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('That contact email does not look valid.');
  }
  const canonical = text(item.canonical, 300);
  if (canonical && !/^https?:\/\//.test(canonical)) {
    throw new ValidationError('The canonical URL must start with http:// or https://.');
  }
  return {
    name: text(item.name, 80) || 'Zannid & Co.',
    email,
    phone: text(item.phone, 40),
    whatsapp: text(item.whatsapp, 40),
    canonical: canonical || 'https://zannid.co',
    showUrgencyBanner: flag(item.showUrgencyBanner),
    instagram: text(item.instagram, 400),
    instagramHandle: text(item.instagramHandle, 60),
    city: text(item.city, 60) || 'Hyderabad',
    address: text(item.address, 240),
    hours: text(item.hours, 120),
    mapUrl: text(item.mapUrl, 600),
  };
}

function normalizeLegalDoc(input: unknown, label: string): LegalDoc {
  if (!input || typeof input !== 'object') throw new ValidationError(`${label} must be an object.`);
  const item = input as Record<string, unknown>;
  const sections = rows(item.sections, 40).map((section, index) => {
    const heading = text(section.heading, 140);
    if (!heading) throw new ValidationError(`${label}: section ${index + 1} needs a heading.`);
    return { heading, body: list(section.body, 30) };
  });
  return {
    title: text(item.title, 120) || label,
    updated: text(item.updated, 80),
    intro: text(item.intro, 400),
    sections,
  };
}

export function normalizeLegal(input: unknown): Legal {
  if (!input || typeof input !== 'object') throw new ValidationError('Legal must be an object.');
  const item = input as Record<string, unknown>;
  return {
    privacy: normalizeLegalDoc(item.privacy, 'Privacy policy'),
    terms: normalizeLegalDoc(item.terms, 'Terms of service'),
  };
}

export function normalizeCollection(collection: string, input: unknown): unknown {
  switch (collection) {
    case 'services':
      return normalizeServices(input);
    case 'work':
      return normalizeWork(input);
    case 'clients':
      return normalizeClients(input);
    case 'journey':
      return normalizeJourney(input);
    case 'faqs':
      return normalizeFaqs(input);
    case 'about':
      return normalizeAbout(input);
    case 'site':
      return normalizeSite(input);
    case 'legal':
      return normalizeLegal(input);
    default:
      throw new ValidationError(`Unknown collection “${collection}”.`);
  }
}
