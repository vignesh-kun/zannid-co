import configJson from '../data/site.config.json';
import servicesJson from '../data/services.json';
import pricingJson from '../data/pricing.json';
import bundlesJson from '../data/bundles.json';
import clientsJson from '../data/clients.json';
import workJson from '../data/work.json';
import faqsJson from '../data/faqs.json';
import contentJson from '../data/content.json';

export type Currency = 'INR' | 'USD';
export type Range = { min: number; max: number | null };
export type PriceRow = {
  service: string;
  tier: string;
  unit: string;
  inr: Range;
  usd: Range;
  public: boolean;
};
export type Service = (typeof servicesJson)[number];
export type Bundle = (typeof bundlesJson)[number];

export const siteConfig = configJson;
export const services = servicesJson;
export const work = workJson;
export const clients = clientsJson;
export const bundles = bundlesJson as Bundle[];
export const pricingRows = pricingJson.rows as PriceRow[];
export const pricingNote = pricingJson.note;
export const comparison = pricingJson.comparison;
export const faqs = faqsJson;
export const content = contentJson;

export const defaultCurrency: Currency = siteConfig.currency === 'USD' ? 'USD' : 'INR';
export const whatsappNumber = (siteConfig.whatsapp || '').replace(/\D/g, '');
export const hasWhatsApp = whatsappNumber.length >= 8;

const inrFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const usdFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatMoney(value: number, currency: Currency): string {
  return currency === 'INR' ? `₹${inrFormat.format(value)}` : `$${usdFormat.format(value)}`;
}

export function formatRange(range: Range, currency: Currency): string {
  if (range.max === null) return 'Quote on request';
  if (range.min === range.max) return formatMoney(range.min, currency);
  return `${formatMoney(range.min, currency)} – ${formatMoney(range.max, currency)}`;
}

export function unitLabel(unit: string): string {
  switch (unit) {
    case 'month':
      return '/month';
    case 'shoot day':
      return ' per shoot day';
    case 'one-time':
      return ' one-time';
    default:
      return ` ${unit}`;
  }
}

export function priceLabel(row: PriceRow, currency: Currency): string {
  const range = currency === 'INR' ? row.inr : row.usd;
  if (range.max === null) return 'Quote on request';
  const prefix = row.unit === 'month' ? 'from ' : '';
  return `${prefix}${formatRange(range, currency)}${unitLabel(row.unit)}`;
}

export function publicRowsFor(slug: string): PriceRow[] {
  return pricingRows.filter((row) => row.service === slug && row.public);
}

export function startingPrice(slug: string, currency: Currency): string {
  const rows = publicRowsFor(slug);
  if (!rows.length) return 'Quote on request';
  const minimum = Math.min(...rows.map((row) => (currency === 'INR' ? row.inr.min : row.usd.min)));
  return `From ${formatMoney(minimum, currency)}`;
}

export function moneyRange(range: Range, currency: Currency): string {
  if (range.max === null) return formatMoney(range.min, currency);
  return `${formatMoney(range.min, currency)} – ${formatMoney(range.max, currency)}`;
}

export function bundlePrice(bundle: Bundle, currency: Currency): string {
  const inr = bundle.amountInr;
  const amount =
    currency === 'INR' ? inr : Math.round(inr / siteConfig.usdRate / 100) * 100;
  return `${formatMoney(amount, currency)}${bundle.plus ? '+' : ''}`;
}

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function serviceTitle(slug: string): string {
  return serviceBySlug(slug)?.title ?? slug;
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
