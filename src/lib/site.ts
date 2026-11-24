import configJson from '../data/site.config.json';
import servicesJson from '../data/services.json';
import groupsJson from '../data/service-groups.json';
import bundlesJson from '../data/bundles.json';
import clientsJson from '../data/clients.json';
import workJson from '../data/work.json';
import faqsJson from '../data/faqs.json';
import contentJson from '../data/content.json';

export type ServiceOption = {
  name: string;
  bestFor: string;
  timeline: string;
  includes: string[];
};
export type Service = (typeof servicesJson)[number];
export type ServiceGroup = (typeof groupsJson)[number];
export type Bundle = (typeof bundlesJson)[number];

export const siteConfig = configJson;
export const services = servicesJson;
export const serviceGroups = groupsJson;
export const work = workJson;
export const clients = clientsJson;
export const bundles = bundlesJson as Bundle[];
export const faqs = faqsJson;
export const content = contentJson;

export const whatsappNumber = (siteConfig.whatsapp || '').replace(/\D/g, '');
export const hasWhatsApp = whatsappNumber.length >= 8;

export function servicesInGroup(groupSlug: string): Service[] {
  return services.filter((service) => service.group === groupSlug);
}

export function groupFor(service: Service): ServiceGroup | undefined {
  return serviceGroups.find((group) => group.slug === service.group);
}

export const totalOptions = services.reduce(
  (total, service) => total + service.options.length,
  0,
);

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function serviceTitle(slug: string): string {
  return serviceBySlug(slug)?.title ?? slug;
}

export function relatedServices(service: Service, count = 3): Service[] {
  const sameGroup = services.filter(
    (item) => item.slug !== service.slug && item.group === service.group,
  );
  const others = services.filter(
    (item) => item.slug !== service.slug && item.group !== service.group,
  );
  return [...sameGroup, ...others].slice(0, count);
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

export function whatsappLink(message = 'Hi Zannid & Co., I want to grow my brand.'): string {
  if (!hasWhatsApp) return '/contact';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject = 'Project enquiry', body = ''): string {
  const query = body ? `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : `?subject=${encodeURIComponent(subject)}`;
  return `mailto:${siteConfig.email}${query}`;
}

export function canonicalUrl(path = '/'): string {
  return new URL(path, siteConfig.canonical).toString();
}

export function faqGroup(group: string) {
  return faqs.filter((faq) => faq.group === group);
}

export const navigation = [
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Work' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];

export const budgetOptions = content.forms.budgets;
export const regionOptions = content.forms.regions;
