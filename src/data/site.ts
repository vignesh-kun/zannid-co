// ─────────────────────────────────────────────────────────────
//  Zannid & Co. — edit everything business-related here.
// ─────────────────────────────────────────────────────────────
export const contact = {
  whatsapp: '91XXXXXXXXXX',          // TODO: country code + number, digits only
  email: 'hello@zannid.co',          // TODO: real inbox
  instagram: 'https://www.instagram.com/zannid.co/',
  instagramHandle: '@zannid.co',
};

export const offer = {
  title: 'Free growth audit + 30-day plan',
  value: '₹4,999',
  slots: 3, // slots left this month
};

// Real public engagement from the reels (update anytime)
export const work = [
  { key: 'biryani', title: 'Biryani me dum nahi?', href: 'https://www.instagram.com/zannid.co/reel/DfUrl5zo91N/',
    text: 'A food metaphor that sells strategy: masala without dum is content without a plan. Hinglish hook, punchline in the first two seconds.',
    tag: 'Reel · Food & restaurants', stat: '254 likes', alt: "Reel cover reading 'Biryani me masala daale… lekin dum nahi diye?'" },
  { key: 'cafe', title: 'Konsi café jaenge?', href: 'https://www.instagram.com/zaidhussain1316/reel/DfWeENpMRGj/',
    text: 'An AI-animated story about how friends actually pick a café, and the one marketing lesson every café owner misses.',
    tag: 'Reel · AI content · Cafés', stat: '138 likes', alt: 'Illustrated reel of three friends deciding which café to visit' },
  { key: 'hello', title: 'The launch film', href: 'https://www.instagram.com/zannid.co/reel/DfH0IH7stQP/',
    text: 'Our own launch: one clean frame, one bold line and a clear offer at the end. Shared 289 times in its first weeks.',
    tag: 'Reel · Brand launch', stat: '289 shares', alt: "Founder seated in a white studio under the headline 'Hello'" },
];

// Plan targets (what a Growth plan is built to do), not past client results
export const targets = {
  reachMultiple: 3.4, firstContentDays: 7, draftHours: 48,
  chartAlone: [8, 9, 9, 10, 9, 10, 11, 10, 11, 11, 12, 12],
  chartWith:  [8, 10, 13, 17, 21, 24, 28, 31, 34, 37, 39, 41],
};

export const plans = [
  { name: 'Starter', for: 'For new brands getting consistent', inr: '₹34,999', usd: '$549',
    items: ['Social media management', '8 reels, edited & posted', '12 posts & stories', 'Monthly growth report'] },
  { name: 'Growth', for: 'For brands ready to scale', inr: '₹79,999', usd: '$1,199', best: true,
    items: ['Everything in Starter', '16 reels + 2 shoot days', 'Meta ads management', '2 creator collabs a month', 'DM & WhatsApp automation'] },
  { name: 'Scale', for: 'Your full growth department', inr: '₹1,49,999+', usd: '$2,199+',
    items: ['Everything in Growth', 'Brand strategy & identity', 'Website design & build', 'Full AI automation suite', 'Dedicated growth lead'] },
];

export const separately = [
  ['Social media manager', '₹15,000 – 50,000'],
  ['Ads management fee', '₹20,000 – 1,00,000'],
  ['Content & reels production', '₹5,000 – 20,000'],
  ['Automation tools + setup', '₹5,000 – 15,000'],
];

export const services = [
  { name: 'Social media', img: 'photo-1611162617474-5b21e879e113', text: 'We run your page end to end: strategy, calendar, captions, community, and a monthly report that shows what moved.', rows: [['Content strategy','monthly'],['Posts & stories','12–30 a month'],['Community replies','daily'],['Growth report','monthly']] },
  { name: 'Reel shoots', img: 'photo-1516035069371-29a1b244cc32', text: 'Hooks and scripts written for the first two seconds, then shot on location by a director who knows what the feed rewards.', rows: [['Hook & script','per reel'],['Shoot day','half or full'],['Talent direction','included']] },
  { name: 'Product & food', img: 'photo-1504674900247-0877df9cc836', text: 'Stills of your product, menu or space, styled and lit for feeds, ads and your website.', rows: [['Styled shoot','per session'],['Edited photos','20–60'],['Ad-ready crops','4:5 · 9:16 · 1:1']] },
  { name: 'Editing', img: 'photo-1574717024653-61fd2cf4d44d', text: 'Trend-ready edits with captions, motion and sound design. First draft in 48 hours.', rows: [['Reel edits','48h first draft'],['Subtitles & motion','included'],['Revisions','2 rounds']] },
  { name: 'Design', img: 'photo-1561070791-2526d30994b5', text: 'Carousels, menus, packaging and brand kits that make every touchpoint look like the same brand.', rows: [['Brand kit','one-time'],['Carousels','monthly'],['Print & menus','on request']] },
  { name: 'Meta ads', img: 'photo-1460925895917-afdab827c52f', text: 'Campaigns that bring walk-ins, orders and leads: offer strategy, creative testing, weekly optimisation.', rows: [['Campaign setup','week 1'],['Creative testing','weekly'],['Reporting','weekly']] },
  { name: 'Creators', img: 'photo-1529156069898-49953e39b3ac', text: 'Creators your customers already trust, briefed and tracked so the collab converts.', rows: [['Creator matching','per campaign'],['Briefs & contracts','included'],['Performance tracking','included']] },
  { name: 'Websites', img: 'photo-1547658719-da2b51169166', text: 'Fast websites built to convert visitors, like the one you are scrolling right now.', rows: [['Design + build','2–4 weeks'],['SEO basics','included'],['Lead forms to WhatsApp','included']] },
  { name: 'AI automation', img: 'photo-1677442136019-21780ecad995', text: 'DM, WhatsApp and call bots that reply in seconds, qualify leads and book them in while you sleep.', rows: [['Instagram DM bot','keyword triggers'],['WhatsApp flows','lead capture'],['Follow-ups','automatic']] },
];

