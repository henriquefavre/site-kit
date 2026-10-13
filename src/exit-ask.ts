// "Before you go" card: a single, gentle tip ask for people who actually used the site.
// Desktop: shown when the pointer leaves through the top of the window (towards the tabs / close button).
// Touch screens have no such signal, so there it appears once, a while after the person starts using the tool.
// Never shown twice per visit, never to someone who already clicked a tip or crypto option. Nothing is stored.

export interface ExitAskOptions {
  /** Tip link (Ko-fi etc.). The card is skipped when this is not an https URL. */
  tipUrl: string;
  /** Small round image at the top of the card, e.g. './badge-320.png'. '' = none. */
  image?: string;
  title?: string;
  /** Main paragraph (HTML allowed). */
  message: string;
  tipText?: string;
  laterText?: string;
  /** Link that scrolls to the crypto options. '' hides it. */
  cryptoText?: string;
  /** Optional personal line (HTML) computed when the card opens, e.g. the visitor's result. '' = hidden. */
  personal?: () => string;
  /** ms on the page before the ask can appear (default 20 s) */
  engageDelay?: number;
  /** ms after first interaction on touch screens (default 45 s) */
  touchDelay?: number;
  /** Clicks on these count as "engaged" (besides typing in a form). */
  engageSelector?: string;
}

export function setupExitAsk(o: ExitAskOptions) {
  const url = o.tipUrl.trim();
  if (!/^https:\/\/\S+$/.test(url) || typeof HTMLDialogElement === 'undefined') return;
  const ENGAGE_DELAY = o.engageDelay ?? 20_000;
  const TOUCH_DELAY = o.touchDelay ?? 45_000;

  const start = Date.now();
  let engagedAt = 0, done = false;
  const touch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const dlg = document.createElement('dialog');
  dlg.className = 'exit-ask';
  dlg.setAttribute('aria-labelledby', 'exit-title');
  dlg.innerHTML = `
    <button type="button" class="exit-x" aria-label="Close">×</button>
    ${o.image ? `<img src="${o.image}" width="72" height="72" alt="">` : ''}
    <h2 id="exit-title">${o.title ?? 'Before you go…'}</h2>
    <p class="exit-you" hidden></p>
    <p>${o.message}</p>
    <div class="exit-actions">
      <a class="tip-btn exit-tip" href="${url}" target="_blank" rel="noopener">${o.tipText ?? '♥ Buy us a coffee'}</a>
      <button type="button" class="exit-later">${o.laterText ?? 'Maybe later'}</button>
    </div>
    ${o.cryptoText ? `<button type="button" class="exit-crypto">${o.cryptoText}</button>` : ''}`;
  document.body.appendChild(dlg);

  const close = () => { if (dlg.open) dlg.close(); };
  dlg.querySelector('.exit-x')!.addEventListener('click', close);
  dlg.querySelector('.exit-later')!.addEventListener('click', close);
  dlg.querySelector('.exit-tip')!.addEventListener('click', () => window.setTimeout(close, 50));
  dlg.querySelector('.exit-crypto')?.addEventListener('click', () => {
    close();
    const box = document.getElementById('donate'), crypto = document.getElementById('crypto') as HTMLDetailsElement | null;
    if (crypto && !crypto.hidden) crypto.open = true;
    box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  // click on the dimmed backdrop closes it
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

  // Already supported (or about to): never ask.
  document.addEventListener('click', e => {
    const t = e.target as HTMLElement | null;
    if (!t || dlg.contains(t)) return;
    if (t.closest(`a[href^="${url}"], .copy, #crypto summary, .coin-toggle`)) done = true;
  }, true);

  // Engagement = the person changed an input or clicked one of the engage controls.
  const engage = () => { if (!engagedAt) { engagedAt = Date.now(); if (touch) armTouch(); } };
  document.addEventListener('input', e => { if ((e.target as HTMLElement).closest('form')) engage(); }, true);
  if (o.engageSelector) {
    const sel = o.engageSelector;
    document.addEventListener('click', e => { if ((e.target as HTMLElement).closest(sel)) engage(); }, true);
  }

  function show(leaving = false) {
    if (done || !engagedAt || dlg.open || Date.now() - start < ENGAGE_DELAY) return;
    // On the timed (touch) ask: don't interrupt typing, and don't ask while the donation box is on screen.
    const ae = document.activeElement;
    if (!leaving && ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;
    const box = document.getElementById('donate');
    if (!leaving && box && !box.hidden) {
      const r = box.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2) return;
    }
    const you = dlg.querySelector<HTMLElement>('.exit-you')!, line = o.personal?.() ?? '';
    you.innerHTML = line; you.hidden = !line;
    done = true;
    dlg.showModal();
    dlg.querySelector<HTMLElement>('.exit-tip')!.focus();
  }

  if (!touch) {
    document.addEventListener('mouseout', e => {
      if (!e.relatedTarget && e.clientY <= 8) show(true);
    });
  }
  function armTouch() {
    const tick = () => {
      if (done) return;
      if (document.visibilityState === 'visible' && Date.now() - engagedAt >= TOUCH_DELAY) { show(); if (done) return; }
      window.setTimeout(tick, 5000);
    };
    window.setTimeout(tick, TOUCH_DELAY);
  }
}
