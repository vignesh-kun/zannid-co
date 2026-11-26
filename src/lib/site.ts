import groupsJson from '../data/service-groups.json';
import bundlesJson from '../data/bundles.json';
import contentJson from '../data/content.json';

export type ServiceOption = {
  name: string;
  bestFor: string;
  timeline: string;
  includes: string[];
  price?: string;
  showPrice?: boolean;
};
export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  group: string;
  icon: string;
  summary: string;
  showPrice?: boolean;
  options: ServiceOption[];
};
export type ServiceGroup = { slug: string; title: string; blurb: string };
export type Bundle = (typeof bundlesJson)[number];
export type WorkItem = {
  key: string;
  title: string;
  client?: string;
  text: string;
  tag: string;
  stat: string;
  href: string;
  image?: string;
  from: string;
  to: string;
};
export type Client = {
  name: string;
  logo?: string;
  description: string;
  website?: string;
  industry?: string;
};
export type Faq = { group: string; q: string; a: string };
export type TeamMember = { name: string; role: string; bio: string; image: string };
export type About = {
  eyebrow: string;
  title: string;
  lede: string;
  storyTitle: string;
  story: string[];
  valuesTitle: string;
  values: { title: string; body: string }[];
  numbers: { value: string; label: string }[];
  team: TeamMember[];
  location: { city: string; region: string; address: string; note: string; mapUrl: string };
};
export type JourneySide = 'left' | 'right';
export type JourneyIllustration = {
  src: string;
  side: JourneySide;
  alt: string;
  order: number;
};
export type JourneyMilestone = {
  id: string;
  title: string;
  date: string;
  subtitle: string;
  description: string;
  category: string;
  order: number;
  published: boolean;
  illustrations: JourneyIllustration[];
  createdAt: string;
  updatedAt: string;
};
export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };
export type Legal = { privacy: LegalDoc; terms: LegalDoc };
export type SiteConfig = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  canonical: string;
  showUrgencyBanner: boolean;
  instagram: string;
  instagramHandle: string;
  city: string;
  address: string;
  hours: string;
  mapUrl: string;
};

export const serviceGroups = groupsJson as ServiceGroup[];
export const bundles = bundlesJson as Bundle[];
export const content = contentJson;

/** The price to show for an option, or an empty string when pricing is not public. */
export function optionPrice(service: Service, option: ServiceOption): string {
  if (!service.showPrice || option.showPrice === false) return '';
  return (option.price || '').trim();
}

export function servicesInGroup(services: Service[], groupSlug: string): Service[] {
  return services.filter((service) => service.group === groupSlug);
}

export function groupFor(groups: ServiceGroup[], service: Service): ServiceGroup | undefined {
  return groups.find((group) => group.slug === service.group);
}

export function totalOptions(services: Service[]): number {
  return services.reduce((total, service) => total + service.options.length, 0);
}

export function serviceBySlug(services: Service[], slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function serviceTitle(services: Service[], slug: string): string {
  return serviceBySlug(services, slug)?.title ?? slug;
}

export function relatedServices(services: Service[], service: Service, count = 3): Service[] {
  const sameGroup = services.filter(
    (item) => item.slug !== service.slug && item.group === service.group,
  );
  const others = services.filter(
    (item) => item.slug !== service.slug && item.group !== service.group,
  );
  return [...sameGroup, ...others].slice(0, count);
}

export function faqGroup(faqs: Faq[], group: string): Faq[] {
  return faqs.filter((faq) => faq.group === group);
}

export const JOURNEY_MEDIA_PREFIX = '/api/journey/media/';

export const JOURNEY_CATEGORIES = [
  'Beginning',
  'Vision',
  'Execution',
  'Growth',
  'Lessons',
  "What's next",
] as const;

/** Published chapters, in the order the admin put them in. */
export function journeyChapters(journey: JourneyMilestone[], includeDrafts = false): JourneyMilestone[] {
  return [...journey]
    .filter((milestone) => includeDrafts || milestone.published)
    .sort((a, b) => a.order - b.order);
}

/** Illustrations for one side, in display order. */
export function illustrationsFor(
  milestone: JourneyMilestone,
  side: JourneySide,
): JourneyIllustration[] {
  return [...milestone.illustrations]
    .filter((illustration) => illustration.side === side && illustration.src)
    .sort((a, b) => a.order - b.order);
}

export function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function initials(name: string): string {
  const stop = new Set(['the', 'from', 'and', 'of', '&', 'co.', 'co']);
  const words = name
    .replace(/[^\p{L}\p{N} .&]/gu, '')
    .split(/\s+/)
    .filter((word) => word && !stop.has(word.toLowerCase()));
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function whatsappNumber(site: SiteConfig): string {
  return (site.whatsapp || '').replace(/\D/g, '');
}

export function hasWhatsApp(site: SiteConfig): boolean {
  return whatsappNumber(site).length >= 8;
}

export function whatsappLink(site: SiteConfig, message = 'Hi Zannid & Co., I want to grow my brand.'): string {
  if (!hasWhatsApp(site)) return '/contact';
  return `https://wa.me/${whatsappNumber(site)}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(
  site: SiteConfig,
  subject = 'Project enquiry',
  body = '',
): string {
  const query = body
    ? `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : `?subject=${encodeURIComponent(subject)}`;
  return `mailto:${site.email}${query}`;
}

export function canonicalUrl(site: SiteConfig, path = '/'): string {
  return new URL(path, site.canonical).toString();
}

export const navigation = [
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Work' },
  { href: '/clients', label: 'Clients' },
  { href: '/journey', label: 'Journey' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];

export const budgetOptions = content.forms.budgets;
export const regionOptions = content.forms.regions;
