import QRCode from 'qrcode';
import type { DonateConfig } from './types';
import { isValidBtc, isValidEth } from './addresses';

interface Coin { name: string; address: string; uri: string; net: string }

function coins(DONATE: DonateConfig): Coin[] {
  const list: Coin[] = [];
  const btc = DONATE.btc.trim(), eth = DONATE.eth.trim();
  if (eth) {
    if (isValidEth(eth)) list.push({ name: DONATE.ethLabel, address: eth, uri: `ethereum:${eth}`, net: `Send on: ${DONATE.ethNetworks}` });
    else console.error('[donate] ETH address in the site config failed its checksum and is hidden.');
  }
  if (btc) {
    if (isValidBtc(btc)) list.push({ name: 'Bitcoin (BTC)', address: btc, uri: `bitcoin:${btc}`, net: 'Bitcoin network only' });
    else console.error('[donate] BTC address in the site config failed its checksum and is hidden.');
  }
  return list;
}

async function copy(text: string, btn: HTMLButtonElement, code: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = window.getSelection();
    sel?.removeAllRanges(); sel?.addRange(range);
    btn.textContent = 'Selected: press Ctrl/⌘+C';
  }
  window.setTimeout(() => { btn.textContent = 'Copy address'; }, 2500);
}

/** Fills the #donate box, #tipbar and floating tip button. Expects the markup in template/index.html. */
export function setupDonations(DONATE: DonateConfig) {
  const url = DONATE.tipUrl.trim();
  const validUrl = /^https:\/\/[^\s]+$/.test(url);
  const list = coins(DONATE);
  if (!validUrl && list.length === 0) return;

  document.getElementById('donate')!.hidden = false;

  if (validUrl) {
    const btn = document.getElementById('tip-btn') as HTMLAnchorElement;
    btn.href = url; btn.textContent = DONATE.tipLabel; btn.hidden = false;
    const bar = document.getElementById('tipbar')!;
    (document.getElementById('tipbar-link') as HTMLAnchorElement).href = url;
    bar.hidden = false;
    floatingTip(url, DONATE.tipLabel);
    const setH = () => document.documentElement.style.setProperty('--tipbar-h', bar.offsetHeight + 'px');
    setH();
    window.addEventListener('resize', setH);
  }

  if (list.length) {
    const box = document.getElementById('crypto')!;
    const host = document.getElementById('crypto-list')!;
    box.hidden = false;
    if (!validUrl) (box as HTMLDetailsElement).open = true;
    // Show one coin at a time (first = default) with a small toggle, so two QR codes never appear together.
    const tag = (name: string) => /\(([^)]+)\)/.exec(name)?.[1] ?? name;
    const panels: HTMLElement[] = [];
    let toggle: HTMLElement | null = null;
    if (list.length > 1) {
      toggle = document.createElement('div');
      toggle.className = 'coin-toggle';
      toggle.setAttribute('role', 'group');
      toggle.setAttribute('aria-label', 'Choose a coin');
      host.appendChild(toggle);
    }
    const show = (i: number) => {
      panels.forEach((p, j) => { p.hidden = j !== i; });
      toggle?.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
    };
    list.forEach((c, i) => {
      if (!toggle) return;
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = tag(c.name);
      b.addEventListener('click', () => show(i));
      toggle.appendChild(b);
    });
    for (const c of list) {
      const el = document.createElement('div');
      el.className = 'coin';
      panels.push(el);
      el.innerHTML = `<div class="qr" aria-hidden="true"></div><div><div class="name">${c.name}</div><div class="net">${c.net}</div><code></code><button type="button" class="copy">Copy address</button></div>`;
      const code = el.querySelector('code')!;
      code.textContent = c.address;
      const btn = el.querySelector('button')!;
      btn.addEventListener('click', () => copy(c.address, btn, code));
      QRCode.toString(c.uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f1720', light: '#ffffff' } })
        .then(svg => { el.querySelector('.qr')!.innerHTML = svg; })
        .catch(() => { /* QR is optional */ });
      host.appendChild(el);
    }
    show(0);
  }
}

// Floating tip button: always within reach, but out of the way while the donation box itself is on screen.
function floatingTip(url: string, label: string) {
  const a = document.createElement('a');
  a.className = 'tip-float';
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', `${label} (opens in a new tab)`);
  a.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z" fill="currentColor"/></svg><span>' + label + '</span>';
  const wrap = document.createElement('aside');
  wrap.setAttribute('aria-label', 'Support the project');
  wrap.appendChild(a);
  document.body.appendChild(wrap);
  let boxVisible = false, ready = false;
  const sync = () => a.classList.toggle('show', ready && !boxVisible);
  const box = document.getElementById('donate');
  if (box && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => { boxVisible = es.some(e => e.isIntersecting); sync(); }, { threshold: 0.2 }).observe(box);
  }
  window.setTimeout(() => { ready = true; sync(); }, 4000);
}
