/**
 * Client application form.
 * Pressing Apply opens the visitor's mail app with the brief filled in and
 * addressed to the studio. It also records the enquiry when the CRM is wired up.
 */
document.querySelectorAll<HTMLFormElement>('[data-apply-form]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('[data-apply-status]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) || '').trim();

    if (get('website')) return; // honeypot

    const lines = [
      `Name: ${get('name')}`,
      `Brand: ${get('brand')}`,
      `Email: ${get('email')}`,
      get('phone') ? `WhatsApp: ${get('phone')}` : '',
      '',
      get('problem'),
      '',
      'Sent from the clients page on zannid.co',
    ].filter((line, index) => line !== '' || index === 4);

    const email = form.dataset.email || 'hello@zannid.co';
    const subject = `New client enquiry: ${get('brand')}`;
    const body = lines.join('\n');
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const number = (form.dataset.wa || '').replace(/\D/g, '');
    const whatsapp = number.length >= 8
      ? `https://wa.me/${number}?text=${encodeURIComponent(body)}`
      : '';

    if (status) {
      status.className = 'form-status';
      status.textContent = '';
      const opened = document.createElement('span');
      opened.textContent = 'Opening your email app with the brief. ';
      const mailLink = document.createElement('a');
      mailLink.href = mailto;
      mailLink.textContent = 'Open it again';
      const note = document.createElement('span');
      note.textContent = ' · Nothing opened? Email ';
      const fallback = document.createElement('a');
      fallback.href = mailto;
      fallback.textContent = email;
      note.append(fallback);
      if (whatsapp) {
        note.append(document.createTextNode(' or '));
        const waLink = document.createElement('a');
        waLink.href = whatsapp;
        waLink.target = '_blank';
        waLink.rel = 'noopener';
        waLink.textContent = 'send it on WhatsApp';
        note.append(waLink);
      }
      status.append(opened, mailLink, note);
    }

    window.location.href = mailto;

    // Keep a record when lead storage is configured. Failure is silent: the
    // email is the real delivery path for this form.
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: get('name'),
        brand: get('brand'),
        phone: get('phone') || '0000000000',
        email: get('email'),
        message: get('problem'),
        source: 'clients',
        website: '',
      }),
    }).catch(() => undefined);
  });
});
