/**
 * Zannid & Co. dashboard.
 *
 * A single page app for the private /admin route. It reads every editable
 * collection from /api/admin/state, edits it in memory and writes whole
 * collections back through /api/admin/save (which validates and stores them).
 */

type SectionKey = 'services' | 'work' | 'clients' | 'journey' | 'faqs' | 'about' | 'site' | 'legal';
type Storage = { backend: string; detail: string };

type Section = {
  key: SectionKey;
  label: string;
  kind: 'list' | 'doc';
  blurb: string;
  hint: string;
};

const SECTIONS: Section[] = [
  {
    key: 'services',
    label: 'Services',
    kind: 'list',
    blurb: 'Every service on the site, its department and its named options.',
    hint: 'JSON list of service objects.',
  },
  {
    key: 'work',
    label: 'Work & case studies',
    kind: 'list',
    blurb: 'Case studies on /work: title, client, story, image and link.',
    hint: 'JSON list of case-study objects.',
  },
  {
    key: 'clients',
    label: 'Clients',
    kind: 'list',
    blurb: 'The client wall on /clients and the marquee on the home page.',
    hint: 'JSON list of client objects.',
  },
  {
    key: 'journey',
    label: 'Journey',
    kind: 'list',
    blurb: 'The chapters of /journey: one story per screen, with cut-out PNGs on either side.',
    hint: 'JSON list of chapter objects.',
  },
  {
    key: 'about',
    label: 'About',
    kind: 'doc',
    blurb: 'Story, values, team and location on /about.',
    hint: 'One object with story, values, numbers, team and location.',
  },
  {
    key: 'site',
    label: 'Contact details',
    kind: 'doc',
    blurb: 'Email, phone, WhatsApp, social handles, address and hours.',
    hint: 'One object of site settings.',
  },
  {
    key: 'faqs',
    label: 'FAQ',
    kind: 'list',
    blurb: 'Questions and answers on /faq and the pricing page.',
    hint: 'JSON list of { group, q, a } objects.',
  },
  {
    key: 'legal',
    label: 'Privacy & terms',
    kind: 'doc',
    blurb: 'The two legal pages, section by section.',
    hint: 'One object with privacy and terms documents.',
  },
];

const GROUP_LABELS: Record<string, string> = {
  brand: 'Brand & content',
  growth: 'Growth & advertising',
  digital: 'Websites & AI',
  product: 'Product engineering',
  care: 'Care & maintenance',
};

const ICONS = [
  'compass', 'social', 'camera', 'film', 'growth', 'target', 'users',
  'code', 'bolt', 'strategy', 'layers', 'rocket', 'cloud', 'phone',
  'package', 'wrench', 'shield', 'refresh',
];

const EXAMPLES: Record<SectionKey, string> = {
  services: `[
  {
    "title": "Social Media Management",
    "shortTitle": "Social media",
    "group": "brand",
    "icon": "social",
    "summary": "Strategy, calendar, community and reporting.",
    "showPrice": false,
    "options": [
      {
        "name": "Essential",
        "bestFor": "One channel, shown up consistently.",
        "timeline": "Monthly",
        "price": "",
        "showPrice": true,
        "includes": ["12 posts a month", "Caption system"]
      }
    ]
  }
]`,
  work: `[
  {
    "title": "Biryani me dum nahi?",
    "client": "The Nawabs From North",
    "text": "A food metaphor that sells strategy.",
    "tag": "Reel · Food & restaurants",
    "stat": "254 likes",
    "href": "https://www.instagram.com/reel/...",
    "image": "",
    "from": "#f6c9a8",
    "to": "#e0784f"
  }
]`,
  clients: `[
  {
    "name": "Thrive Cafe & Bistro",
    "description": "Café, Hyderabad",
    "logo": "",
    "website": "",
    "industry": "Food & beverage"
  }
]`,
  faqs: `[
  { "group": "Pricing", "q": "How does pricing work?", "a": "Scoped on a call, quoted in writing." }
]`,
  journey: `[
  {
    "title": "The ownership problem",
    "date": "2023",
    "subtitle": "Five vendors. No owner.",
    "description": "Two or three sentences of story.",
    "category": "Beginning",
    "published": true,
    "illustrations": [
      {
        "src": "/api/journey/media/uploaded-file.png",
        "side": "left",
        "alt": "What the illustration shows",
        "order": 0
      }
    ]
  }
]`,
  about: `{
  "eyebrow": "About Zannid & Co.",
  "title": "A growth team, not a content vendor.",
  "lede": "One paragraph for the page header.",
  "storyTitle": "Why we started",
  "story": ["First paragraph.", "Second paragraph."],
  "valuesTitle": "What we believe",
  "values": [{ "title": "Strategy first", "body": "Why it matters." }],
  "numbers": [{ "value": "19", "label": "services under one roof" }],
  "team": [{ "name": "Zaid Hussain", "role": "Founder", "bio": "Short bio.", "image": "" }],
  "location": {
    "city": "Hyderabad",
    "region": "Telangana, India",
    "address": "",
    "note": "Shoots across India.",
    "mapUrl": ""
  }
}`,
  site: `{
  "name": "Zannid & Co.",
  "email": "hello@zannid.co",
  "phone": "",
  "whatsapp": "",
  "canonical": "https://zannid.co",
  "showUrgencyBanner": false,
  "instagram": "https://www.instagram.com/zannid.co/",
  "instagramHandle": "@zannid.co",
  "city": "Hyderabad",
  "address": "",
  "hours": "Mon–Sat, 10:00–19:00 IST",
  "mapUrl": ""
}`,
  legal: `{
  "privacy": {
    "title": "Privacy policy",
    "updated": "Last updated: 1 January 2027",
    "intro": "Plain English.",
    "sections": [{ "heading": "What we collect", "body": ["Paragraph one."] }]
  },
  "terms": {
    "title": "Terms of service",
    "updated": "Last updated: 1 January 2027",
    "intro": "Clear scopes.",
    "sections": [{ "heading": "Using this site", "body": ["Paragraph one."] }]
  }
}`,
};

const root = document.getElementById('admin');
if (!root) throw new Error('Admin root missing');

let db: any = null;
let storage: Storage | null = null;
let section: SectionKey = 'services';
let editing: number | null = null;
let snapshot = '';
let busy = false;
let importOpen = false;
let importError = '';
let loginError = '';

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] as string,
  );

const activeSection = (): Section => SECTIONS.find((item) => item.key === section)!;

function getPath(target: any, path: string): any {
  return path.split('.').reduce((node, key) => (node == null ? node : node[key]), target);
}

function setPath(target: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let node = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (node == null) return;
    node = node[parts[index]];
  }
  if (node) node[parts[parts.length - 1]] = value;
}

function blankFor(path: string): unknown {
  if (path.endsWith('options')) return { name: '', bestFor: '', timeline: '', includes: [''], price: '', showPrice: true };
  if (path.endsWith('values')) return { title: '', body: '' };
  if (path.endsWith('numbers')) return { value: '', label: '' };
  if (path.endsWith('team')) return { name: '', role: '', bio: '', image: '' };
  if (path.endsWith('illustrations')) return { src: '', side: 'left', alt: '', order: 0 };
  if (path.endsWith('sections')) return { heading: '', body: [''] };
  return '';
}

let toastTimer: number | undefined;
function toast(message: string, kind: 'ok' | 'error' = 'ok'): void {
  let element = document.querySelector<HTMLElement>('[data-toast]');
  if (!element) {
    element = document.createElement('div');
    element.className = 'ad-toast';
    element.dataset.toast = '';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    document.body.append(element);
  }
  element.textContent = message;
  element.className = `ad-toast is-visible ${kind}`;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (element) element.className = 'ad-toast';
  }, 4500);
}

function isDirty(): boolean {
  return Boolean(db) && JSON.stringify(db) !== snapshot;
}

function updateDirty(): void {
  const dirty = isDirty();
  const bar = root!.querySelector<HTMLElement>('.ad-top');
  bar?.classList.toggle('is-dirty', dirty);
  const label = root!.querySelector<HTMLElement>('[data-dirty]');
  if (label) label.hidden = !dirty;
}

/* ------------------------------------------------------------------ fields */

type FieldOptions = { hint?: string; placeholder?: string; type?: string; mono?: boolean };

function field(label: string, path: string, value: unknown, options: FieldOptions = {}): string {
  return `<label class="ad-field">
    <span class="ad-label">${esc(label)}</span>
    <input
      data-path="${esc(path)}"
      type="${esc(options.type || 'text')}"
      value="${esc(value)}"
      ${options.placeholder ? `placeholder="${esc(options.placeholder)}"` : ''}
      ${options.mono ? 'class="mono"' : ''}
    />
    ${options.hint ? `<small class="ad-hint">${esc(options.hint)}</small>` : ''}
  </label>`;
}

function area(label: string, path: string, value: string, options: FieldOptions & { rows?: number; split?: 'line' | 'para' } = {}): string {
  return `<label class="ad-field full">
    <span class="ad-label">${esc(label)}</span>
    <textarea data-path="${esc(path)}" rows="${options.rows ?? 4}" ${options.split ? `data-split="${options.split}"` : ''} ${options.placeholder ? `placeholder="${esc(options.placeholder)}"` : ''}>${esc(value)}</textarea>
    ${options.hint ? `<small class="ad-hint">${esc(options.hint)}</small>` : ''}
  </label>`;
}

function selectField(label: string, path: string, value: string, choices: [string, string][]): string {
  return `<label class="ad-field">
    <span class="ad-label">${esc(label)}</span>
    <select data-path="${esc(path)}">
      ${choices
        .map(([optionValue, optionLabel]) => `<option value="${esc(optionValue)}"${optionValue === value ? ' selected' : ''}>${esc(optionLabel)}</option>`)
        .join('')}
    </select>
  </label>`;
}

function switchField(label: string, path: string, checked: boolean, hint = ''): string {
  return `<label class="ad-switch">
    <input type="checkbox" data-path="${esc(path)}"${checked ? ' checked' : ''} />
    <span class="ad-switch-track" aria-hidden="true"></span>
    <span class="ad-switch-text"><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span>
  </label>`;
}

function cardHead(title: string, addPath?: string, addLabel = 'Add'): string {
  return `<div class="ad-card-head">
    <h2>${esc(title)}</h2>
    ${addPath ? `<button class="ad-btn ghost sm" data-act="add" data-path="${esc(addPath)}">+ ${esc(addLabel)}</button>` : ''}
  </div>`;
}

function removeButton(path: string, label = 'Remove'): string {
  return `<button class="ad-btn danger sm" data-act="remove" data-path="${esc(path)}">${esc(label)}</button>`;
}

/* ------------------------------------------------------------------- views */

function rowShell(index: number, title: string, meta: string, actions: string, extra = ''): string {
  return `<div class="ad-row">
    <span class="ad-row-num mono">${String(index + 1).padStart(2, '0')}</span>
    <div class="ad-row-main">
      <strong>${esc(title) || '<em>Untitled</em>'}</strong>
      <span>${meta}</span>
    </div>
    ${extra}
    <div class="ad-row-actions">${actions}</div>
  </div>`;
}

function moveButtons(index: number): string {
  return `<button class="ad-icon-btn" data-act="move" data-i="${index}" data-dir="-1" aria-label="Move up" title="Move up">↑</button>
  <button class="ad-icon-btn" data-act="move" data-i="${index}" data-dir="1" aria-label="Move down" title="Move down">↓</button>`;
}

function servicesView(): string {
  if (editing !== null) return serviceEditor(editing);
  const rows = (db.services as any[])
    .map((service, index) =>
      rowShell(
        index,
        service.title,
        `${esc(GROUP_LABELS[service.group] || service.group)} · ${service.options?.length ?? 0} options · /services/${esc(service.slug)}`,
        `<button class="ad-btn ghost sm" data-act="edit" data-i="${index}">Edit</button>
         ${moveButtons(index)}
         <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete</button>`,
        `<label class="ad-price-toggle" title="Show option prices on the website">
          <input type="checkbox" data-path="${index}.showPrice"${service.showPrice ? ' checked' : ''} />
          <span>Prices on site</span>
        </label>`,
      ),
    )
    .join('');
  return `<p class="ad-note">Toggle <b>Prices on site</b> to reveal option prices on the public service pages. Leave it off and every page keeps saying “quoted per scope”.</p>
    <div class="ad-list">${rows || '<p class="ad-empty">No services yet.</p>'}</div>
    <button class="ad-add" data-act="new">+ Add a service</button>`;
}

function serviceEditor(index: number): string {
  const service = db.services[index];
  if (!service) return servicesView();
  const base = `${index}.`;
  const options = (service.options as any[])
    .map((option, optionIndex) => {
      const path = `${base}options.${optionIndex}`;
      return `<div class="ad-option">
        <div class="ad-option-head">
          <span class="ad-option-num mono">Option ${optionIndex + 1}</span>
          ${removeButton(path, 'Remove option')}
        </div>
        <div class="ad-grid">
          ${field('Option name', `${path}.name`, option.name, { placeholder: 'Essential' })}
          ${field('Timeline', `${path}.timeline`, option.timeline, { placeholder: 'Monthly or 3–4 weeks' })}
          ${field('Price (optional)', `${path}.price`, option.price, { placeholder: 'From ₹45,000 / month', hint: 'Only visible when “Prices on site” is on for this service.' })}
          ${field('Best for', `${path}.bestFor`, option.bestFor, { placeholder: 'One line on who this fits.' })}
          ${area('What is included', `${path}.includes`, (option.includes || []).join('\n'), { rows: 4, split: 'line', hint: 'One deliverable per line.' })}
        </div>
        ${switchField('Show this price', `${path}.showPrice`, option.showPrice !== false, 'Uncheck to hide just this option’s price.')}
      </div>`;
    })
    .join('');

  return `<div class="ad-editor-head">
      <button class="ad-btn ghost sm" data-act="back">← All services</button>
      <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete service</button>
    </div>
    <div class="ad-card">
      <h2>Service</h2>
      <div class="ad-grid">
        ${field('Service name', `${base}title`, service.title)}
        ${field('Short name (menus)', `${base}shortTitle`, service.shortTitle)}
        ${selectField('Department', `${base}group`, service.group, Object.entries(GROUP_LABELS))}
        ${selectField('Icon', `${base}icon`, service.icon, ICONS.map((icon) => [icon, icon] as [string, string]))}
        ${area('Summary', `${base}summary`, service.summary, { rows: 3, hint: 'One sentence, shown on the services index and the page hero.' })}
        ${field('URL slug', `${base}slug`, service.slug, { hint: 'Leave blank to generate from the name on save.', mono: true })}
      </div>
      ${switchField('Prices on site', `${base}showPrice`, Boolean(service.showPrice), 'Turn on to publish option prices for this service.')}
    </div>
    <div class="ad-card">
      ${cardHead('Options', `${base}options`, 'Add option')}
      ${options}
    </div>`;
}

function workView(): string {
  if (editing !== null) {
    const item = db.work[editing];
    const base = `${editing}.`;
    return `<div class="ad-editor-head">
        <button class="ad-btn ghost sm" data-act="back">← All case studies</button>
        <button class="ad-btn danger sm" data-act="delete" data-i="${editing}">Delete</button>
      </div>
      <div class="ad-card">
        <h2>Case study</h2>
        <div class="ad-grid">
          ${field('Title', `${base}title`, item.title)}
          ${field('Client', `${base}client`, item.client)}
          ${field('Tag / category', `${base}tag`, item.tag, { placeholder: 'Reel · Food & restaurants' })}
          ${field('Result or stat', `${base}stat`, item.stat, { placeholder: '254 likes, 3.4× reach, ₹12L pipeline' })}
          ${area('Description', `${base}text`, item.text, { rows: 4, hint: 'What the work was, and what it was for.' })}
          ${field('Link', `${base}href`, item.href, { placeholder: 'https://instagram.com/reel/...', hint: 'Case study link, reel or article.' })}
          ${field('Image URL', `${base}image`, item.image, { placeholder: '/images/work/biryani.jpg or https://…', hint: 'Optional. Without an image, the card uses the gradient below.' })}
          ${field('Gradient from', `${base}from`, item.from, { type: 'color' })}
          ${field('Gradient to', `${base}to`, item.to, { type: 'color' })}
        </div>
      </div>
      ${item.image ? `<div class="ad-preview"><img src="${esc(item.image)}" alt="" /><span>Card image preview</span></div>` : ''}`;
  }

  const rows = (db.work as any[])
    .map((item, index) =>
      rowShell(
        index,
        item.title,
        `${esc(item.client || 'No client')} · ${esc(item.tag || 'No tag')}`,
        `<button class="ad-btn ghost sm" data-act="edit" data-i="${index}">Edit</button>
         ${moveButtons(index)}
         <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete</button>`,
      ),
    )
    .join('');
  return `<div class="ad-list">${rows || '<p class="ad-empty">No case studies yet.</p>'}</div>
    <button class="ad-add" data-act="new">+ Add a case study</button>`;
}

function clientsView(): string {
  if (editing !== null) {
    const item = db.clients[editing];
    const base = `${editing}.`;
    return `<div class="ad-editor-head">
        <button class="ad-btn ghost sm" data-act="back">← All clients</button>
        <button class="ad-btn danger sm" data-act="delete" data-i="${editing}">Delete</button>
      </div>
      <div class="ad-card">
        <h2>Client</h2>
        <div class="ad-grid">
          ${field('Name', `${base}name`, item.name)}
          ${field('Industry', `${base}industry`, item.industry, { placeholder: 'Food & beverage' })}
          ${field('Website', `${base}website`, item.website, { placeholder: 'https://…' })}
          ${field('Logo URL', `${base}logo`, item.logo, { placeholder: 'https://… or /images/clients/x.png', hint: 'Leave blank to show initials instead.' })}
          ${area('Description', `${base}description`, item.description, { rows: 3, hint: 'One short line under the name.' })}
        </div>
      </div>`;
  }

  const rows = (db.clients as any[])
    .map((client, index) =>
      rowShell(
        index,
        client.name,
        esc(client.industry || client.description || 'No description'),
        `<button class="ad-btn ghost sm" data-act="edit" data-i="${index}">Edit</button>
         ${moveButtons(index)}
         <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete</button>`,
      ),
    )
    .join('');
  return `<p class="ad-note">Client names shown here also feed the home page marquee and the count on the work page.</p>
    <div class="ad-list">${rows || '<p class="ad-empty">No clients yet.</p>'}</div>
    <button class="ad-add" data-act="new">+ Add a client</button>`;
}

/* ---------------------------------------------------------------- journey */

const JOURNEY_CATEGORIES = ['Beginning', 'Vision', 'Execution', 'Growth', 'Lessons', "What's next"];
const SIDE_LABELS: [string, string][] = [
  ['left', 'Left page'],
  ['right', 'Right page'],
];
const MAX_PNG_BYTES = 6 * 1024 * 1024;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Illustrations uploaded in this browser session, so we can say they were verified. */
const verifiedArt = new Set<string>();
let dragFrom: number | null = null;

function artRow(art: any, artIndex: number): string {
  const path = `illustrations.${artIndex}`;
  const name = String(art.src || '').split('/').pop() || 'image.png';
  const verified = verifiedArt.has(art.src);
  return `<div class="ad-art">
    <span class="ad-checker" aria-hidden="true"><img src="${esc(art.src)}" alt="" loading="lazy" /></span>
    <div class="ad-art-body">
      <span class="ad-art-name mono">${esc(name)}</span>
      <div class="ad-art-grid">
        ${selectField('Side', `${path}.side`, art.side === 'right' ? 'right' : 'left', SIDE_LABELS)}
        ${field('Alt text', `${path}.alt`, art.alt, { placeholder: 'What the illustration shows' })}
      </div>
      <p class="ad-art-status${verified ? ' ok' : ''}">${verified ? 'Transparent PNG verified on upload' : 'Transparent PNG'}</p>
    </div>
    <div class="ad-art-actions">
      <label class="ad-btn ghost sm">Replace<input type="file" accept="image/png,.png" data-replace="${artIndex}" hidden /></label>
      <button class="ad-btn danger sm" data-act="remove" data-path="${path}">Remove</button>
    </div>
  </div>`;
}

function journeyView(): string {
  if (editing !== null) return journeyEditor(editing);

  const rows = (db.journey as any[])
    .map((chapter, index) => {
      const art = (chapter.illustrations || []) as any[];
      const left = art.filter((item) => (item.side === 'right' ? 'right' : 'left') === 'left').length;
      const right = art.length - left;
      return `<div class="ad-row ad-journey-row" draggable="true" data-drag="${index}">
        <span class="ad-grip" aria-hidden="true">⠿</span>
        <span class="ad-row-num mono">${String(index + 1).padStart(2, '0')}</span>
        <div class="ad-row-main">
          <strong>${esc(chapter.title) || '<em>Untitled chapter</em>'}</strong>
          <span>${esc(chapter.date || 'No date')} · ${esc(chapter.category)} · ${left} left / ${right} right${chapter.published ? '' : ' · draft'}</span>
        </div>
        <label class="ad-mini-switch" title="Publish this chapter on /journey">
          <input type="checkbox" data-path="${index}.published"${chapter.published ? ' checked' : ''} />
          Published
        </label>
        <div class="ad-row-actions">
          <a class="ad-btn ghost sm" href="/journey#chapter-${index + 1}" target="_blank" rel="noopener">Preview ↗</a>
          <button class="ad-btn ghost sm" data-act="edit" data-i="${index}">Edit</button>
          ${moveButtons(index)}
          <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete</button>
        </div>
      </div>`;
    })
    .join('');

  return `<p class="ad-note">This is the order visitors scroll through: drag a chapter to move it, or use ↑ ↓. Each published chapter becomes one full-screen page on /journey.</p>
    <div class="ad-list">${rows || '<p class="ad-empty">No chapters yet. Add the first one.</p>'}</div>
    <button class="ad-add" data-act="new">+ Add a chapter</button>`;
}

function journeyEditor(index: number): string {
  const chapter = db.journey[index];
  if (!chapter) return journeyView();
  const base = `${index}.`;
  const illustrations = (chapter.illustrations || []) as any[];
  const categories = [
    ...new Set([
      ...JOURNEY_CATEGORIES,
      ...(db.journey as any[]).map((item) => item.category).filter(Boolean),
    ]),
  ] as string[];

  const page = (side: 'left' | 'right') =>
    illustrations
      .map((art, artIndex) => ({ art, artIndex }))
      .filter((entry) => (entry.art.side === 'right' ? 'right' : 'left') === side)
      .map((entry) => artRow(entry.art, entry.artIndex))
      .join('') || '<p class="ad-art-empty">No illustration on this page yet.</p>';

  return `<div class="ad-editor-head">
      <button class="ad-btn ghost sm" data-act="back">← All chapters</button>
      <div class="ad-editor-actions">
        <a class="ad-btn ghost sm" href="/journey#chapter-${index + 1}" target="_blank" rel="noopener">Preview chapter ↗</a>
        <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete chapter</button>
      </div>
    </div>
    <div class="ad-card">
      <h2>Chapter</h2>
      <div class="ad-grid">
        ${field('Title', `${base}title`, chapter.title, { placeholder: 'The ownership problem' })}
        ${field('Date or marker', `${base}date`, chapter.date, { placeholder: '2023, March 2024, Chapter 03', hint: 'Shown above the title. Any label works.' })}
        ${selectField('Category', `${base}category`, chapter.category, categories.map((item) => [item, item] as [string, string]))}
        ${field('Subtitle', `${base}subtitle`, chapter.subtitle, { placeholder: 'One line under the title.' })}
        ${area('Story', `${base}description`, chapter.description, { rows: 6, hint: 'Two or three sentences: this is the paragraph the visitor reads while the illustrations settle.' })}
      </div>
      ${switchField('Published', `${base}published`, chapter.published !== false, 'Off keeps this chapter in your signed-in preview only.')}
    </div>
    <div class="ad-card">
      <h2>Illustrations</h2>
      <p class="ad-note">Transparent PNG only. The file is decoded and checked for a real alpha channel and at least one see-through pixel, so JPG, WebP, SVG, GIF and renamed files are rejected. Keep each under 6 MB.</p>
      <div class="ad-pages">
        <div class="ad-page">
          <h3 class="ad-page-title mono">Left page</h3>
          ${page('left')}
          <label class="ad-drop" data-drop="left">
            <input type="file" accept="image/png,.png" multiple data-upload="left" hidden />
            <b>Drop PNGs here</b>
            <small>or click to choose · several at once is fine</small>
          </label>
        </div>
        <div class="ad-page">
          <h3 class="ad-page-title mono">Right page</h3>
          ${page('right')}
          <label class="ad-drop" data-drop="right">
            <input type="file" accept="image/png,.png" multiple data-upload="right" hidden />
            <b>Drop PNGs here</b>
            <small>or click to choose · several at once is fine</small>
          </label>
        </div>
      </div>
      <p class="ad-hint">Uploads are stored immediately; press <b>Save changes</b> to publish them. Replacing or removing an illustration deletes the old file on the next save, once nothing else uses it.</p>
    </div>`;
}

function faqsView(): string {
  if (editing !== null) {
    const item = db.faqs[editing];
    const base = `${editing}.`;
    const groups = [...new Set(['General', 'Pricing', 'Process', ...(db.faqs as any[]).map((faq) => faq.group)])];
    return `<div class="ad-editor-head">
        <button class="ad-btn ghost sm" data-act="back">← All questions</button>
        <button class="ad-btn danger sm" data-act="delete" data-i="${editing}">Delete</button>
      </div>
      <div class="ad-card">
        <h2>Question</h2>
        <div class="ad-grid">
          ${selectField('Group', `${base}group`, item.group, groups.map((group) => [group, group] as [string, string]))}
          ${field('Question', `${base}q`, item.q, { placeholder: 'How fast will I see results?' })}
          ${area('Answer', `${base}a`, item.a, { rows: 5 })}
        </div>
      </div>`;
  }

  const rows = (db.faqs as any[])
    .map((faq, index) =>
      rowShell(
        index,
        faq.q,
        esc(faq.group),
        `<button class="ad-btn ghost sm" data-act="edit" data-i="${index}">Edit</button>
         ${moveButtons(index)}
         <button class="ad-btn danger sm" data-act="delete" data-i="${index}">Delete</button>`,
      ),
    )
    .join('');
  return `<div class="ad-list">${rows || '<p class="ad-empty">No questions yet.</p>'}</div>
    <button class="ad-add" data-act="new">+ Add a question</button>`;
}

function aboutView(): string {
  const about = db.about;
  const values = (about.values as any[])
    .map((value, index) => {
      const path = `values.${index}`;
      return `<div class="ad-option">
        <div class="ad-option-head">
          <span class="ad-option-num mono">Value ${index + 1}</span>
          ${removeButton(path)}
        </div>
        <div class="ad-grid">
          ${field('Title', `${path}.title`, value.title)}
          ${area('Description', `${path}.body`, value.body, { rows: 3 })}
        </div>
      </div>`;
    })
    .join('');

  const numbers = (about.numbers as any[])
    .map((number, index) => {
      const path = `numbers.${index}`;
      return `<div class="ad-inline-row">
        ${field('Value', `${path}.value`, number.value)}
        ${field('Label', `${path}.label`, number.label)}
        ${removeButton(path)}
      </div>`;
    })
    .join('');

  const team = (about.team as any[])
    .map((member, index) => {
      const path = `team.${index}`;
      return `<div class="ad-option">
        <div class="ad-option-head">
          <span class="ad-option-num mono">${esc(member.name) || `Member ${index + 1}`}</span>
          ${removeButton(path)}
        </div>
        <div class="ad-grid">
          ${field('Name', `${path}.name`, member.name)}
          ${field('Role', `${path}.role`, member.role)}
          ${field('Photo URL', `${path}.image`, member.image, { placeholder: 'https://… or /images/team/name.jpg' })}
          ${area('Short bio', `${path}.bio`, member.bio, { rows: 3 })}
        </div>
        ${member.image ? `<img class="ad-thumb" src="${esc(member.image)}" alt="" />` : ''}
      </div>`;
    })
    .join('');

  const place = about.location || {};
  return `<div class="ad-card">
      <h2>Page header</h2>
      <div class="ad-grid">
        ${field('Eyebrow', 'eyebrow', about.eyebrow)}
        ${field('Title', 'title', about.title)}
        ${area('Lede', 'lede', about.lede, { rows: 3 })}
      </div>
    </div>
    <div class="ad-card">
      ${cardHead('Story')}
      <div class="ad-grid">
        ${field('Story heading', 'storyTitle', about.storyTitle)}
        ${area('Story paragraphs', 'story', (about.story || []).join('\n\n'), { rows: 8, split: 'para', hint: 'Blank line between paragraphs.' })}
      </div>
    </div>
    <div class="ad-card">
      ${cardHead('Values', 'values', 'Add value')}
      ${values || '<p class="ad-empty">No values yet.</p>'}
    </div>
    <div class="ad-card">
      ${cardHead('Numbers', 'numbers', 'Add number')}
      ${numbers || '<p class="ad-empty">No numbers yet.</p>'}
    </div>
    <div class="ad-card">
      ${cardHead('Team', 'team', 'Add member')}
      ${team || '<p class="ad-empty">No team members yet.</p>'}
    </div>
    <div class="ad-card">
      <h2>Location</h2>
      <div class="ad-grid">
        ${field('City', 'location.city', place.city, { placeholder: 'Hyderabad' })}
        ${field('Region', 'location.region', place.region, { placeholder: 'Telangana, India' })}
        ${field('Address', 'location.address', place.address, { hint: 'Optional. Shown when filled in.' })}
        ${field('Travel note', 'location.note', place.note)}
        ${field('Map URL', 'location.mapUrl', place.mapUrl, { placeholder: 'https://maps.app.goo.gl/…' })}
      </div>
    </div>`;
}

function siteView(): string {
  const site = db.site;
  return `<div class="ad-card">
      <h2>How people reach you</h2>
      <div class="ad-grid">
        ${field('Studio name', 'name', site.name)}
        ${field('Email', 'email', site.email, { type: 'email' })}
        ${field('Phone', 'phone', site.phone, { placeholder: '+91 …', hint: 'Shown on the contact page when filled in.' })}
        ${field('WhatsApp number', 'whatsapp', site.whatsapp, { placeholder: '+91 …', hint: 'With country code. Leave blank to route buttons to /contact.' })}
        ${field('Instagram URL', 'instagram', site.instagram)}
        ${field('Instagram handle', 'instagramHandle', site.instagramHandle, { placeholder: '@zannid.co' })}
      </div>
    </div>
    <div class="ad-card">
      <h2>Studio</h2>
      <div class="ad-grid">
        ${field('City', 'city', site.city)}
        ${field('Address', 'address', site.address)}
        ${field('Hours', 'hours', site.hours, { placeholder: 'Mon–Sat, 10:00–19:00 IST' })}
        ${field('Map URL', 'mapUrl', site.mapUrl)}
        ${field('Canonical site URL', 'canonical', site.canonical, { hint: 'Used for canonical tags and structured data.' })}
      </div>
      ${switchField('Show the urgency banner', 'showUrgencyBanner', Boolean(site.showUrgencyBanner), 'The “free audit” strip above the header.')}
    </div>`;
}

function legalView(): string {
  const renderDoc = (key: 'privacy' | 'terms', label: string) => {
    const doc = db.legal[key];
    const sections = (doc.sections as any[])
      .map((item, index) => {
        const path = `${key}.sections.${index}`;
        return `<div class="ad-option">
          <div class="ad-option-head">
            <span class="ad-option-num mono">Section ${index + 1}</span>
            ${removeButton(path)}
          </div>
          <div class="ad-grid">
            ${field('Heading', `${path}.heading`, item.heading)}
            ${area('Paragraphs', `${path}.body`, (item.body || []).join('\n\n'), { rows: 5, split: 'para', hint: 'Blank line between paragraphs.' })}
          </div>
        </div>`;
      })
      .join('');
    return `<div class="ad-card">
      ${cardHead(label, `${key}.sections`, 'Add section')}
      <div class="ad-grid">
        ${field('Page title', `${key}.title`, doc.title)}
        ${field('Last updated', `${key}.updated`, doc.updated, { placeholder: 'Last updated: 1 January 2027' })}
        ${area('Intro', `${key}.intro`, doc.intro, { rows: 2 })}
      </div>
      ${sections || '<p class="ad-empty">No sections yet.</p>'}
    </div>`;
  };

  return `<p class="ad-note">These pages publish exactly what you write. Anything else on the site that mentions the policy links here.</p>
    ${renderDoc('privacy', 'Privacy policy')}
    ${renderDoc('terms', 'Terms of service')}`;
}

function renderSection(): string {
  switch (section) {
    case 'services':
      return servicesView();
    case 'work':
      return workView();
    case 'clients':
      return clientsView();
    case 'journey':
      return journeyView();
    case 'faqs':
      return faqsView();
    case 'about':
      return aboutView();
    case 'site':
      return siteView();
    case 'legal':
      return legalView();
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ shell */

function countFor(key: SectionKey): string {
  const value = db?.[key];
  if (Array.isArray(value)) return String(value.length);
  return '';
}

function renderApp(): void {
  const current = activeSection();
  const dirty = isDirty();
  root!.innerHTML = `
    <div class="ad-shell">
      <aside class="ad-side">
        <div class="ad-brand">
          <span class="ad-brand-mark">Z</span>
          <span><b>Zannid &amp; Co.</b><small>Dashboard</small></span>
        </div>
        <nav class="ad-nav" aria-label="Sections">
          ${SECTIONS.map(
            (item) => `<button data-act="nav" data-section="${item.key}" class="${item.key === section ? 'is-active' : ''}">
              <span>${esc(item.label)}</span>
              ${countFor(item.key) ? `<span class="ad-badge">${countFor(item.key)}</span>` : ''}
            </button>`,
          ).join('')}
        </nav>
        <div class="ad-side-foot">
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
          <button data-act="logout">Sign out</button>
        </div>
      </aside>

      <main class="ad-main">
        <header class="ad-top ${dirty ? 'is-dirty' : ''}">
          <div class="ad-top-text">
            <p class="ad-kicker">${current.kind === 'list' ? 'Content' : 'Settings'}${storage ? ` · ${esc(storage.backend === 'supabase' ? 'Supabase' : 'local file')}` : ''}</p>
            <h1>${esc(current.label)}</h1>
            <p class="ad-sub">${esc(current.blurb)}</p>
          </div>
          <div class="ad-top-actions">
            <span class="ad-dirty" data-dirty ${dirty ? '' : 'hidden'}>Unsaved changes</span>
            ${section === 'journey' ? '<a class="ad-btn ghost" href="/journey" target="_blank" rel="noopener">Preview journey ↗</a>' : ''}
            <button class="ad-btn ghost" data-act="import">Import JSON</button>
            <button class="ad-btn primary" data-act="save"${busy ? ' disabled' : ''}>${busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </header>

        ${storage && storage.backend !== 'supabase' ? `<p class="ad-banner">${esc(storage.detail)}</p>` : ''}

        <div class="ad-body">${renderSection()}</div>
      </main>
    </div>
    ${importOpen ? importModal() : ''}
  `;
  const save = root!.querySelector<HTMLButtonElement>('[data-act="save"]');
  if (save) save.disabled = busy;
}

function importModal(): string {
  const current = activeSection();
  return `<div class="ad-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
    <div class="ad-modal-card">
      <h2 id="import-title">Import JSON · ${esc(current.label)}</h2>
      <p class="ad-hint">${esc(current.hint)} Every import is validated before it goes live, so a broken file cannot take the page down.</p>
      <label class="ad-field full">
        <span class="ad-label">Choose a .json file</span>
        <input type="file" accept="application/json,.json" data-import-file />
      </label>
      <label class="ad-field full">
        <span class="ad-label">Or paste JSON</span>
        <textarea data-import-text rows="10" spellcheck="false" class="mono"></textarea>
      </label>
      <div class="ad-radio-row">
        <label><input type="radio" name="import-mode" value="replace" checked /> Replace this section</label>
        ${current.kind === 'list' ? '<label><input type="radio" name="import-mode" value="append" /> Append to existing entries</label>' : ''}
      </div>
      ${importError ? `<p class="ad-error">${esc(importError)}</p>` : ''}
      <details class="ad-example">
        <summary>Show the expected shape</summary>
        <pre>${esc(EXAMPLES[current.key])}</pre>
      </details>
      <div class="ad-modal-actions">
        <button class="ad-btn ghost" data-act="import-close">Cancel</button>
        <button class="ad-btn primary" data-act="import-apply">Import and save</button>
      </div>
    </div>
  </div>`;
}

function renderLogin(error = ''): void {
  root!.innerHTML = `
    <div class="ad-login">
      <form class="ad-login-card" data-login novalidate>
        <p class="ad-kicker">Private area</p>
        <h1>Dashboard</h1>
        <p class="ad-sub">Enter the admin password to manage the website.</p>
        <label class="ad-field full">
          <span class="ad-label">Password</span>
          <input type="password" name="password" autocomplete="current-password" autofocus required />
        </label>
        <button class="ad-btn primary wide" type="submit">Unlock dashboard</button>
        <p class="ad-error" data-login-error role="alert">${esc(error || loginError)}</p>
        <p class="ad-hint">The password lives in ADMIN_PASSWORD in your .env file, never in the code.</p>
      </form>
    </div>`;
}

/* ------------------------------------------------------------------- data */

async function load(): Promise<void> {
  try {
    const response = await fetch('/api/admin/state', { headers: { accept: 'application/json' } });
    const payload = await response.json();
    if (!payload.authed) {
      renderLogin(payload.error || '');
      return;
    }
    db = payload.data;
    storage = payload.storage;
    snapshot = JSON.stringify(db);
    editing = null;
    importOpen = false;
    renderApp();
  } catch {
    renderLogin('Could not reach the server. Refresh and try again.');
  }
}

async function persist(
  collection: SectionKey,
  data: unknown,
): Promise<{ ok: boolean; data?: unknown; error?: string; auth?: boolean }> {
  try {
    const response = await fetch('/api/admin/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection, data }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) return { ok: false, auth: true, error: 'Session expired.' };
    if (!response.ok) return { ok: false, error: payload.error || 'Could not save that.' };
    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: 'Network error. Nothing was saved.' };
  }
}

async function save(): Promise<void> {
  if (busy || !db) return;
  busy = true;
  renderApp();
  const result = await persist(section, db[section]);
  busy = false;
  if (result.auth) {
    renderLogin('Session expired. Sign in again.');
    return;
  }
  if (!result.ok) {
    renderApp();
    toast(result.error || 'Could not save.', 'error');
    return;
  }
  db[section] = result.data;
  snapshot = JSON.stringify(db);
  renderApp();
  toast('Saved. The live site now shows this.');
}

async function applyImport(): Promise<void> {
  const textarea = root!.querySelector<HTMLTextAreaElement>('[data-import-text]');
  const raw = textarea?.value.trim() || '';
  const mode = (root!.querySelector<HTMLInputElement>('input[name="import-mode"]:checked')?.value || 'replace') as 'replace' | 'append';
  importError = '';

  if (!raw) {
    importError = 'Paste some JSON first.';
    renderApp();
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    importError = `That is not valid JSON: ${error instanceof Error ? error.message : 'parse error'}`;
    renderApp();
    return;
  }

  const current = db[section];
  let next: unknown;
  if (Array.isArray(current)) {
    if (!Array.isArray(parsed)) {
      importError = 'This section needs a JSON array, starting with [ and ending with ].';
      renderApp();
      return;
    }
    next = mode === 'append' ? [...current, ...parsed] : parsed;
  } else {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      importError = 'This section needs a single JSON object, starting with { and ending with }.';
      renderApp();
      return;
    }
    next = parsed;
  }

  busy = true;
  const result = await persist(section, next);
  busy = false;
  if (result.auth) {
    renderLogin('Session expired. Sign in again.');
    return;
  }
  if (!result.ok) {
    importError = result.error || 'Import failed.';
    renderApp();
    return;
  }

  db[section] = result.data;
  snapshot = JSON.stringify(db);
  importOpen = false;
  editing = null;
  renderApp();
  toast('Imported and saved.');
}

/* ---------------------------------------------------------------- actions */

function newItem(): void {
  switch (section) {
    case 'services':
      db.services.push({
        slug: '',
        title: '',
        shortTitle: '',
        group: 'brand',
        icon: 'compass',
        summary: '',
        showPrice: false,
        options: [{ name: '', bestFor: '', timeline: '', includes: [''], price: '', showPrice: true }],
      });
      editing = db.services.length - 1;
      break;
    case 'work':
      db.work.push({
        key: '', title: '', client: '', text: '', tag: '', stat: '', href: '', image: '', from: '#e7e2da', to: '#c9c1b4',
      });
      editing = db.work.length - 1;
      break;
    case 'clients':
      db.clients.push({ name: '', description: '', logo: '', website: '', industry: '' });
      editing = db.clients.length - 1;
      break;
    case 'journey':
      db.journey.push({
        id: '',
        title: '',
        date: '',
        subtitle: '',
        description: '',
        category: 'Beginning',
        order: db.journey.length,
        published: false,
        illustrations: [],
        createdAt: '',
        updatedAt: '',
      });
      editing = db.journey.length - 1;
      break;
    case 'faqs':
      db.faqs.push({ group: 'General', q: '', a: '' });
      editing = db.faqs.length - 1;
      break;
    default:
      return;
  }
  renderApp();
  const first = root!.querySelector<HTMLInputElement>('.ad-editor-head ~ .ad-card input[data-path]');
  first?.focus();
}

function handleClick(event: MouseEvent): void {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!target) return;
  const action = target.dataset.act;

  if (action === 'nav') {
    section = target.dataset.section as SectionKey;
    editing = null;
    importOpen = false;
    renderApp();
    window.scrollTo({ top: 0 });
    return;
  }
  if (action === 'logout') {
    void fetch('/api/admin/logout', { method: 'POST' }).then(() => {
      db = null;
      renderLogin('Signed out.');
    });
    return;
  }
  if (action === 'save') {
    void save();
    return;
  }
  if (action === 'import') {
    importOpen = true;
    importError = '';
    renderApp();
    return;
  }
  if (action === 'import-close') {
    importOpen = false;
    importError = '';
    renderApp();
    return;
  }
  if (action === 'import-apply') {
    void applyImport();
    return;
  }
  if (action === 'back') {
    editing = null;
    renderApp();
    return;
  }
  if (action === 'new') {
    newItem();
    return;
  }
  if (action === 'edit') {
    editing = Number(target.dataset.i);
    renderApp();
    window.scrollTo({ top: 0 });
    return;
  }
  if (action === 'delete') {
    const index = Number(target.dataset.i);
    const list = db[section] as any[];
    const name = list[index]?.title || list[index]?.name || list[index]?.q || 'this item';
    if (!window.confirm(`Delete “${name}”? This cannot be undone after you save.`)) return;
    list.splice(index, 1);
    editing = null;
    renderApp();
    updateDirty();
    return;
  }
  if (action === 'move') {
    const index = Number(target.dataset.i);
    const direction = Number(target.dataset.dir);
    const list = db[section] as any[];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
    renderApp();
    return;
  }
  if (action === 'add') {
    const path = target.dataset.path || '';
    const list = getPath(db[section], path);
    if (!Array.isArray(list)) return;
    list.push(blankFor(path));
    renderApp();
    return;
  }
  if (action === 'remove') {
    const path = target.dataset.path || '';
    const parts = path.split('.');
    const key = parts.pop() as string;
    const list = getPath(db[section], parts.join('.'));
    if (!Array.isArray(list)) return;
    list.splice(Number(key), 1);
    renderApp();
  }
}

/* ---------------------------------------------------------------- uploads */

/** Cheap browser-side gate before the authoritative server check. */
async function pngProblem(file: File): Promise<string | null> {
  if (file.size === 0) return 'is empty';
  if (file.size > MAX_PNG_BYTES) return 'is larger than 6 MB';

  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!PNG_SIGNATURE.every((byte, index) => head[index] === byte)) {
    return 'is not a real PNG (wrong file signature)';
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return 'could not be decoded as an image';
  }
  if (!bitmap.width || !bitmap.height) {
    bitmap.close?.();
    return 'has no readable dimensions';
  }
  if (Math.min(bitmap.width, bitmap.height) < 96) {
    bitmap.close?.();
    return 'is smaller than 96px on the short side';
  }
  if (Math.max(bitmap.width, bitmap.height) > 3000) {
    bitmap.close?.();
    return 'is larger than 3000px on the long side';
  }

  const width = Math.min(bitmap.width, 480);
  const height = Math.max(1, Math.round((bitmap.height / bitmap.width) * width));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close?.();
    return null;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const { data } = context.getImageData(0, 0, width, height);
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return null;
  }
  return 'has no transparent pixels — the whole image is opaque';
}

async function uploadArt(
  files: File[],
  side: 'left' | 'right',
  replaceIndex: number | null,
): Promise<void> {
  const chapter = editing === null ? null : (db.journey[editing] as any);
  if (!chapter) return;
  let added = 0;

  for (const [position, file] of files.entries()) {
    const problem = await pngProblem(file);
    if (problem) {
      toast(`${file.name} ${problem}.`, 'error');
      continue;
    }

    const body = new FormData();
    body.append('file', file);

    let payload: any = {};
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        renderLogin('Session expired. Sign in again.');
        return;
      }
      if (!response.ok || !payload.src) {
        toast(`${file.name}: ${payload.error || 'upload failed.'}`, 'error');
        continue;
      }
    } catch {
      toast(`${file.name}: network error, nothing was uploaded.`, 'error');
      continue;
    }

    verifiedArt.add(payload.src);
    const target = replaceIndex !== null && position === 0 ? chapter.illustrations?.[replaceIndex] : null;
    if (target) {
      target.src = payload.src;
    } else {
      if (!Array.isArray(chapter.illustrations)) chapter.illustrations = [];
      chapter.illustrations.push({
        src: payload.src,
        side,
        alt: '',
        order: chapter.illustrations.length,
      });
    }
    added += 1;
  }

  if (added) {
    renderApp();
    updateDirty();
    toast(`${added} illustration${added === 1 ? '' : 's'} uploaded. Save changes to publish.`);
  }
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const path = target?.dataset?.path;
  if (!path || !db) return;
  let value: unknown =
    target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
  if (target instanceof HTMLTextAreaElement && target.dataset.split && typeof value === 'string') {
    const parts = target.dataset.split === 'para' ? value.split(/\n\s*\n/) : value.split('\n');
    value = parts.map((part) => part.trim()).filter(Boolean);
  }
  setPath(db[section], path, value);
  updateDirty();
}

root.addEventListener('click', handleClick);
root.addEventListener('input', handleInput);
root.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement;
  if (target.matches('[data-import-file]')) {
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const textarea = root!.querySelector<HTMLTextAreaElement>('[data-import-text]');
      if (textarea) textarea.value = String(reader.result || '');
      toast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    return;
  }
  if (target.matches('[data-upload]')) {
    const files = [...(target.files || [])];
    target.value = '';
    if (files.length) {
      void uploadArt(files, target.dataset.upload === 'right' ? 'right' : 'left', null);
    }
    return;
  }
  if (target.matches('[data-replace]')) {
    const files = [...(target.files || [])];
    const replaceIndex = Number(target.dataset.replace);
    target.value = '';
    if (files.length) {
      void uploadArt(files, 'left', Number.isFinite(replaceIndex) ? replaceIndex : null);
    }
    return;
  }
  handleInput(event);
});

/* Drag and drop: files onto a page, chapters into a new order. */
root.addEventListener('dragover', (event) => {
  const dragEvent = event as DragEvent;
  if (!dragEvent.dataTransfer?.types?.includes('Files')) {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-drag]');
    if (row && dragFrom !== null) event.preventDefault();
    return;
  }
  event.preventDefault();
  const drop = (event.target as HTMLElement).closest<HTMLElement>('[data-drop]');
  if (drop) drop.classList.add('is-over');
});

root.addEventListener('dragleave', (event) => {
  const drop = (event.target as HTMLElement).closest<HTMLElement>('[data-drop]');
  if (drop && !drop.contains(event.relatedTarget as Node)) drop.classList.remove('is-over');
});

root.addEventListener('dragstart', (event) => {
  const row = (event.target as HTMLElement).closest<HTMLElement>('[data-drag]');
  if (!row) return;
  dragFrom = Number(row.dataset.drag);
  row.classList.add('is-dragging');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(dragFrom));
  }
});

root.addEventListener('dragend', () => {
  dragFrom = null;
  root!.querySelectorAll('.ad-journey-row').forEach((row) => {
    row.classList.remove('is-dragging', 'is-target');
  });
});

root.addEventListener('drop', (event) => {
  const dragEvent = event as DragEvent;
  const files = [...(dragEvent.dataTransfer?.files || [])];
  const drop = (event.target as HTMLElement).closest<HTMLElement>('[data-drop]');

  if (files.length) {
    event.preventDefault();
    if (drop) {
      drop.classList.remove('is-over');
      void uploadArt(files, drop.dataset.drop === 'right' ? 'right' : 'left', null);
    }
    return;
  }

  const row = (event.target as HTMLElement).closest<HTMLElement>('[data-drag]');
  if (!row || dragFrom === null || section !== 'journey' || editing !== null) return;
  event.preventDefault();

  const to = Number(row.dataset.drag);
  const list = db.journey as any[];
  if (Number.isFinite(to) && to !== dragFrom) {
    const [moved] = list.splice(dragFrom, 1);
    list.splice(to, 0, moved);
    list.forEach((item, position) => {
      item.order = position;
    });
    updateDirty();
  }
  dragFrom = null;
  renderApp();
});

root.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement;
  if (!form.matches('[data-login]')) return;
  event.preventDefault();
  loginError = '';
  const password = (form.querySelector<HTMLInputElement>('input[name="password"]')?.value || '').trim();
  if (!password) {
    loginError = 'Enter the password.';
    renderLogin();
    return;
  }
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.textContent = 'Checking…';
  }
  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not sign in.');
      await load();
    })
    .catch((error: Error) => {
      loginError = error.message;
      renderLogin();
    });
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (db) void save();
  }
  if (event.key === 'Escape' && importOpen) {
    importOpen = false;
    renderApp();
  }
});

window.addEventListener('beforeunload', (event) => {
  if (isDirty()) {
    event.preventDefault();
    event.returnValue = '';
  }
});

void load();
