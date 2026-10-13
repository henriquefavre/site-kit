import type { ContactConfig } from './types';

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

// The Turnstile script (anti-spam) loads only once someone starts using the form,
// so the calculator itself never contacts another server.
let turnstileId: string | undefined;
let turnstileToken = '';
function loadTurnstile(host: HTMLElement, siteKey: string) {
  if (!siteKey || document.getElementById('cf-turnstile-js')) return;
  const s = document.createElement('script');
  s.id = 'cf-turnstile-js';
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true;
  s.onload = () => {
    turnstileId = window.turnstile?.render(host, {
      sitekey: siteKey,
      callback: (t: string) => { turnstileToken = t; },
      'expired-callback': () => { turnstileToken = ''; },
    });
  };
  document.head.appendChild(s);
}

/** Wires #contact-form to POST ./api/contact (handled by site-kit/worker). */
export function setupContact(CONTACT: ContactConfig) {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;
  const status = document.getElementById('contact-status')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const tsHost = document.getElementById('turnstile')!;
  const opened = Date.now();

  form.addEventListener('focusin', () => loadTurnstile(tsHost, CONTACT.turnstileSiteKey), { once: true });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();
    status.className = 'form-status';
    if (!/^\S+@\S+\.\S+$/.test(email)) { status.textContent = 'Please enter a valid email address so we can reply.'; status.classList.add('err'); return; }
    if (message.length < 10) { status.textContent = 'Please write a slightly longer message.'; status.classList.add('err'); return; }
    if (CONTACT.turnstileSiteKey && !turnstileToken) { status.textContent = 'Please complete the verification below.'; status.classList.add('err'); return; }

    btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
    try {
      const res = await fetch('./api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(fd.get('name') ?? ''), email, message,
          website: String(fd.get('website') ?? ''), elapsed: Date.now() - opened, token: turnstileToken,
        }),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && out.ok) {
        form.reset();
        status.textContent = 'Thanks! Your message is on its way. We reply by email, usually within a few days.';
        status.classList.add('ok');
      } else {
        status.textContent = out.error ?? 'Your message could not be sent right now. Please try again later.';
        status.classList.add('err');
      }
    } catch {
      status.textContent = 'Your message could not be sent right now. Please check your connection and try again.';
      status.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = 'Send message';
      if (turnstileId !== undefined) { window.turnstile?.reset(turnstileId); turnstileToken = ''; }
    }
  });
}
