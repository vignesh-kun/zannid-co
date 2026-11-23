type LeadPayload = Record<string, string | string[]>;

const fieldError = (field: HTMLElement, message: string) => {
  field.classList.add('has-error');
  const input = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
  input?.setAttribute('aria-invalid', 'true');
  let error = field.querySelector<HTMLElement>('.error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'error';
    field.append(error);
  }
  error.textContent = message;
  if (input && !input.getAttribute('aria-describedby')) {
    const id = `err-${Math.random().toString(36).slice(2, 8)}`;
    error.id = id;
    input.setAttribute('aria-describedby', id);
  }
};

const clearError = (field: HTMLElement) => {
  field.classList.remove('has-error');
  const input = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
  input?.removeAttribute('aria-invalid');
  if (input?.getAttribute('aria-describedby')?.startsWith('err-')) {
    input.removeAttribute('aria-describedby');
  }
  field.querySelector('.error')?.remove();
};

const validateField = (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
  const field = input.closest<HTMLElement>('.field');
  if (!field) return true;
  clearError(field);
  if (!input.willValidate) return true;

  if (input.validity.valueMissing) {
    fieldError(field, input.dataset.error || 'This field is required.');
    return false;
  }
  if (input.validity.typeMismatch || input.validity.patternMismatch) {
    fieldError(field, input.dataset.error || 'Check the format and try again.');
    return false;
  }
  if (input.name === 'phone' && input.value.replace(/\D/g, '').length < 7) {
    fieldError(field, 'Add a WhatsApp number with country code.');
    return false;
  }
  return true;
};

const validateStep = (step: HTMLElement): boolean => {
  const inputs = [
    ...step.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="checkbox"]), select, textarea',
    ),
  ];
  let valid = true;
  inputs.forEach((input) => {
    if (!input.closest('.hp') && !validateField(input)) valid = false;
  });
  const firstInvalid = inputs.find((input) => input.getAttribute('aria-invalid') === 'true');
  firstInvalid?.focus({ preventScroll: false });
  return valid;
};

const detailsFor = (form: HTMLFormElement): string => {
  const data = new FormData(form);
  const lines: string[] = [];
  const get = (key: string) => String(data.get(key) || '').trim();
  if (get('name')) lines.push(`Name: ${get('name')}`);
  if (get('brand')) lines.push(`Brand: ${get('brand')}`);
  if (get('service')) lines.push(`Service: ${get('service')}`);
  if (get('budget')) lines.push(`Budget: ${get('budget')}`);
  if (get('region')) lines.push(`Region: ${get('region')}`);
  const needs = data.getAll('needs').map(String).filter(Boolean);
  if (needs.length) lines.push(`Needs: ${needs.join(', ')}`);
  if (get('message')) lines.push(`About: ${get('message')}`);
  return lines.join('\n');
};

const waFallback = (form: HTMLFormElement): string => {
  const number = (form.dataset.wa || '').replace(/\D/g, '');
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi Zannid & Co., I want a free growth audit.\n\n${detailsFor(form)}`)}`;
};

const mailFallback = (form: HTMLFormElement): string => {
  const email = form.dataset.email || '';
  if (!email) return '';
  return `mailto:${email}?subject=${encodeURIComponent('Free growth audit request')}&body=${encodeURIComponent(detailsFor(form))}`;
};

const showFallback = (form: HTMLFormElement, status: HTMLElement, message: string) => {
  status.className = 'form-status error';
  status.textContent = `${message} `;
  const href = waFallback(form) || mailFallback(form);
  if (!href) return;
  const link = document.createElement('a');
  link.href = href;
  link.target = href.startsWith('http') ? '_blank' : '_self';
  link.rel = 'noopener';
  link.textContent = href.startsWith('http') ? 'Send it on WhatsApp instead' : 'Send it by email instead';
  status.append(link);
};

document.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach((form) => {
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const nextButton = form.querySelector<HTMLButtonElement>('[data-next]');
  const backButton = form.querySelector<HTMLButtonElement>('[data-back]');
  const submitButton = form.querySelector<HTMLButtonElement>('[data-submit]');
  const nav = form.querySelector<HTMLElement>('[data-form-nav]');
  const progress = [...form.querySelectorAll<HTMLElement>('[data-step-dot]')];
  const status = form.querySelector<HTMLElement>('[data-form-status]') || form.querySelector<HTMLElement>('.form-status');
  const done = form.querySelector<HTMLElement>('[data-form-done]');
  const fields = form.querySelector<HTMLElement>('[data-form-fields]');
  let current = 0;

  const showStep = (index: number, moveFocus = false) => {
    if (!steps.length) return;
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((step, i) => {
      step.hidden = i !== current;
    });
    progress.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      if (i === current) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    if (backButton) backButton.hidden = current === 0;
    if (nextButton) nextButton.hidden = current === steps.length - 1;
    if (submitButton) submitButton.hidden = current !== steps.length - 1;
    if (moveFocus) {
      const first = steps[current]?.querySelector<HTMLElement>('input, select, textarea');
      first?.focus({ preventScroll: true });
    }
  };

  if (steps.length) showStep(0);

  nextButton?.addEventListener('click', () => {
    if (!steps.length) return;
    if (validateStep(steps[current])) showStep(current + 1, true);
  });

  backButton?.addEventListener('click', () => {
    if (!steps.length) return;
    showStep(current - 1, true);
  });

  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((input) => {
    input.addEventListener('blur', () => {
      if (input.value || input.required) validateField(input);
    });
    input.addEventListener('input', () => {
      const field = input.closest<HTMLElement>('.field');
      if (field?.classList.contains('has-error')) clearError(field);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status) {
      status.className = 'form-status';
      status.textContent = '';
    }

    if (steps.length) {
      const failed = steps.findIndex((step) => !validateStep(step));
      if (failed !== -1) {
        showStep(failed, true);
        return;
      }
    }

    const inputs = [
      ...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([type="checkbox"]), select, textarea',
      ),
    ];
    if (inputs.some((input) => !input.closest('.hp') && !validateField(input))) {
      if (status) {
        status.className = 'form-status error';
        status.textContent = 'Check the highlighted fields and try again.';
      }
      return;
    }

    const data = new FormData(form);
    const payload: LeadPayload = {
      name: String(data.get('name') || ''),
      brand: String(data.get('brand') || ''),
      phone: String(data.get('phone') || ''),
      email: String(data.get('email') || ''),
      service: String(data.get('service') || ''),
      budget: String(data.get('budget') || ''),
      region: String(data.get('region') || ''),
      message: String(data.get('message') || ''),
      source: String(data.get('source') || 'website'),
      needs: data.getAll('needs').map(String),
      website: String(data.get('website') || ''),
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.html = submitButton.innerHTML;
      submitButton.textContent = 'Sending…';
    }
    if (status) status.textContent = 'Sending your brief…';

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Request failed');
      if (fields) fields.hidden = true;
      if (nav) nav.hidden = true;
      if (done) {
        done.hidden = false;
        const heading = done.querySelector<HTMLElement>('h2');
        heading?.focus?.({ preventScroll: false });
        const continueLink = done.querySelector<HTMLAnchorElement>('[data-done-link]');
        const href = waFallback(form);
        if (continueLink && href) continueLink.href = href;
        else continueLink?.remove();
      }
      if (status) status.textContent = '';
      form.reset();
    } catch {
      showFallback(form, status || form, 'We could not save that just now.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.html || 'Send';
      }
    }
  });
});
