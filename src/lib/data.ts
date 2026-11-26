import { readStore } from './store';
import { bundles, content, serviceGroups } from './site';
import type {
  About,
  Client,
  Faq,
  JourneyMilestone,
  Legal,
  Service,
  ServiceGroup,
  SiteConfig,
  WorkItem,
  Bundle,
} from './site';

export type SiteData = {
  services: Service[];
  groups: ServiceGroup[];
  work: WorkItem[];
  clients: Client[];
  journey: JourneyMilestone[];
  faqs: Faq[];
  about: About;
  site: SiteConfig;
  legal: Legal;
  content: typeof content;
  bundles: Bundle[];
};

/** One read per request; the store memoises for a moment across components. */
export async function getData(): Promise<SiteData> {
  const store = await readStore();
  return {
    services: store.services,
    groups: serviceGroups,
    work: store.work,
    clients: store.clients,
    journey: store.journey,
    faqs: store.faqs,
    about: store.about,
    site: store.site,
    legal: store.legal,
    content,
    bundles,
  };
}
