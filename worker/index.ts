// Cloudflare Worker for our sites: serves the static site (dist/) and handles the contact form at /api/contact.
// Messages are emailed through Cloudflare's own send_email binding to a destination
// address verified in Email Routing. Nothing is stored.

export interface SiteEnv {
  ASSETS: Fetcher;
  EMAIL: SendEmail;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  TURNSTILE_SECRET?: string;
}

interface ContactBody {
  name?: unknown; email?: unknown; message?: unknown; website?: unknown; elapsed?: unknown; token?: unknown;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, ' ').trim();

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}

export interface SiteWorkerOptions {
  /** Site name used in the contact emails, e.g. 'Mrs. Net Worth' */
  siteName: string;
}

export async function handleContact(req: Request, env: SiteEnv, url: URL, opts: SiteWorkerOptions): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);

  // Only accept posts from this site's own pages.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json({ ok: false, error: 'Forbidden.' }, 403);

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 20_000) return json({ ok: false, error: 'Message is too long.' }, 413);

  let body: ContactBody;
  try { body = (await req.json()) as ContactBody; } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  const name = typeof body.name === 'string' ? oneLine(body.name).slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  // Spam traps: hidden field filled in, or form sent faster than a person can type. Pretend success.
  if ((typeof body.website === 'string' && body.website !== '') || Number(body.elapsed) < 3000) return json({ ok: true });

  if (!EMAIL_RE.test(email) || email.length > 200) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (message.length < 10) return json({ ok: false, error: 'Please write a slightly longer message.' }, 400);
  if (message.length > 5000) return json({ ok: false, error: 'Please keep your message under 5,000 characters.' }, 400);

  if (env.TURNSTILE_SECRET) {
    const token = typeof body.token === 'string' ? body.token : '';
    const ok = token !== '' && await verifyTurnstile(env.TURNSTILE_SECRET, token, req.headers.get('cf-connecting-ip'));
    if (!ok) return json({ ok: false, error: 'Please complete the verification and try again.' }, 400);
  }

  const who = name || email;
  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: `${opts.siteName} website` },
      replyTo: { email, name: who },
      subject: `Contact form: ${who}`.slice(0, 150),
      text: `From: ${name || '(no name)'} <${email}>\n\n${message}\n\n— Sent from the ${opts.siteName} contact form. Reply to this email to answer.`,
    });
  } catch (err) {
    console.error('contact send failed', (err as { code?: string }).code ?? err);
    return json({ ok: false, error: 'Your message could not be sent right now. Please try again later.' }, 502);
  }
  return json({ ok: true });
}

/** Usage in a site's worker/index.ts:  export default createSiteWorker({ siteName: 'My Site' }); */
export function createSiteWorker(opts: SiteWorkerOptions) {
  return {
    async fetch(req, env): Promise<Response> {
      const url = new URL(req.url);
      if (url.pathname === '/api/contact') return handleContact(req, env, url, opts);
      return env.ASSETS.fetch(req);
    },
  } satisfies ExportedHandler<SiteEnv>;
}
