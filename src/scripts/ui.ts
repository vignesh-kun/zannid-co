const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// Offer bar folds into the left rail once the visitor starts reading
const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 120);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Countdown to the end of the month
{
  const end = new Date(); end.setMonth(end.getMonth() + 1, 1); end.setHours(0, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    const s = Math.max(0, Math.floor((+end - Date.now()) / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    $$('[data-cd]').forEach((e) => (e.textContent = 'long' in e.dataset ? `${d}d ${p(h)}h ${p(m)}m ${p(ss)}s` : `ends in ${d}d ${p(h)}h ${p(m)}m`));
  };
  tick(); setInterval(tick, 1000);
}

// Services honeycomb → detail panel
{
  const data: { name: string; text: string; rows: [string, string][] }[] = JSON.parse($('#svc-data').textContent!);
  const det = $('#detail'), hexes = $$<HTMLButtonElement>('.hex');
  const show = (i: number) => {
    if (hexes[i].getAttribute('aria-pressed') === 'true') return;
    hexes.forEach((h, j) => h.setAttribute('aria-pressed', String(i === j)));
    const s = data[i];
    $('[data-d=name]', det).textContent = s.name;
    $('[data-d=text]', det).textContent = s.text;
    $('[data-d=cta]', det).firstChild!.textContent = `Ask about ${s.name.toLowerCase()} `;
    $('[data-d=rows]', det).innerHTML = s.rows.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('');
    det.classList.remove('swap'); void det.offsetWidth; det.classList.add('swap');
  };
  hexes.forEach((h, i) => { h.addEventListener('mouseenter', () => show(i)); h.addEventListener('focus', () => show(i)); h.addEventListener('click', () => show(i)); });
}

// Data that animates when it enters view
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  if (e.target.id === 'funnel') $$<HTMLElement>('i', e.target).forEach((i) => (i.style.width = i.dataset.w + '%'));
  io.unobserve(e.target);
}), { threshold: 0.25 });
['#chart', '#funnel', '#phone'].forEach((s) => io.observe($(s)));

// Reach chart with hover read-out
{
  const svg = $<SVGSVGElement>('#cs'), tip = $('#tip'), chart = $('#chart');
  const { a, b }: { a: number[]; b: number[] } = JSON.parse($('#chart-data').textContent!);
  const W = 1000, H = 300, mx = Math.max(...b) * 1.08, n = a.length;
  const X = (i: number) => (i / (n - 1)) * W, Y = (v: number) => H - (v / mx) * H;
  const pts = (d: number[]) => d.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  let g = '';
  for (let k = 0; k <= 4; k++) g += `<line x1="0" x2="${W}" y1="${(H * k) / 4}" y2="${(H * k) / 4}" stroke="#ececec" vector-effect="non-scaling-stroke"/>`;
  a.forEach((_, i) => (g += `<text x="${X(i)}" y="${H + 24}" font-size="12" fill="#6b6b6b" text-anchor="middle" font-family="Martian Mono Variable, monospace">W${i + 1}</text>`));
  svg.innerHTML = g +
    `<polygon class="area" points="0,${H} ${pts(b)} ${W},${H}" fill="#0a0a0a" fill-opacity=".06"/>` +
    `<polyline points="${pts(a)}" fill="none" stroke="#9a9a9a" stroke-width="2.5" stroke-dasharray="7 7" vector-effect="non-scaling-stroke"/>` +
    `<polyline class="grow" points="${pts(b)}" fill="none" stroke="#0a0a0a" stroke-width="4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
    `<line id="cx" y1="0" y2="${H}" stroke="#0a0a0a" opacity="0" vector-effect="non-scaling-stroke"/>`;
  const cx = $('#cx', svg);
  const move = (clientX: number) => {
    const r = svg.getBoundingClientRect(), cr = chart.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left) / r.width) * (n - 1))));
    cx.setAttribute('x1', String(X(i))); cx.setAttribute('x2', String(X(i))); cx.setAttribute('opacity', '1');
    tip.style.opacity = '1';
    tip.style.left = `${r.left - cr.left + (X(i) / W) * r.width}px`;
    tip.style.top = `${r.top - cr.top + (Y(b[i]) / H) * r.height}px`;
    tip.innerHTML = `<b>Week ${i + 1}</b> · ${b[i]}k reach vs ${a[i]}k alone (${(b[i] / a[i]).toFixed(1)}×)`;
  };
  svg.addEventListener('pointermove', (e) => move(e.clientX));
  svg.addEventListener('pointerleave', () => { tip.style.opacity = '0'; cx.setAttribute('opacity', '0'); });
}

// Ad budget estimator (CPM ≈ ₹90, lead rate ≈ 0.35% of reach)
{
  const bud = $<HTMLInputElement>('#bud');
  const fmt = (n: number) => n.toLocaleString('en-IN');
  const run = () => {
    const v = +bud.value, reach = Math.round(((v / 90) * 1000) / 1000) * 1000;
    $('#budv').textContent = '₹' + fmt(v); $('#o1').textContent = fmt(reach); $('#o2').textContent = fmt(Math.round(reach * 0.0035));
  };
  bud.addEventListener('input', run); run();
}

// Currency switch
$$<HTMLButtonElement>('.cur button').forEach((btn) => btn.addEventListener('click', () => {
  $$('.cur button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
  const c = btn.dataset.c as 'inr' | 'usd';
  $$('[data-inr]').forEach((p) => (p.textContent = p.dataset[c]!));
}));

// Mascot: eyes follow the pointer, smiles when you visit
{
  const z = $('#zanny');
  addEventListener('pointermove', (e) => $$('.e i', z).forEach((p) => {
    const r = p.parentElement!.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2, d = Math.hypot(dx, dy) || 1;
    p.style.transform = `translate(${(dx / d) * 4}px,${(dy / d) * 4}px)`;
  }));
  const cheer = () => z.classList.add('happy');
  z.addEventListener('mouseenter', cheer); z.addEventListener('click', cheer);
}

// Lead form → /api/lead (Supabase), WhatsApp as the fallback path
{
  const form = $<HTMLFormElement>('#lead'), status = $('#status'), btn = $<HTMLButtonElement>('button[type=submit]', form);
  const waMsg = (f: FormData, needs: string) =>
    `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(`Hi Zannid & Co.! I'd like my free growth audit.\nName: ${f.get('name')}\nBrand: ${f.get('brand')}\nWhatsApp: ${f.get('phone')}\nNeed: ${needs}\nBudget: ${f.get('budget')}`)}`;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { status.className = 'status err'; status.textContent = 'Add your name, brand and WhatsApp number (with country code) to continue.'; form.reportValidity(); return; }
    const f = new FormData(form), needs = f.getAll('needs').map(String);
    const link = waMsg(f, needs.join(', ') || 'Not sure yet');
    btn.disabled = true; btn.firstChild!.textContent = 'Sending… '; status.className = 'status'; status.textContent = 'Saving your request.';
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: f.get('name'), brand: f.get('brand'), phone: f.get('phone'), budget: f.get('budget'), needs, website: f.get('website') }) });
      const out = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !out.ok) throw new Error(out.error || 'failed');
      $<HTMLAnchorElement>('#done-wa').href = link;
      form.classList.add('sent'); $('.done', form).focus();
    } catch {
      status.className = 'status err';
      status.innerHTML = `We couldn't save that just now. <a href="${link}" target="_blank" rel="noopener">Send it on WhatsApp instead</a>; it's already filled in.`;
    } finally { btn.disabled = false; btn.firstChild!.textContent = 'Claim my free audit '; }
  });
}
