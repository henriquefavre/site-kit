/** Donation settings. Leave a value as '' to hide that option. Paste addresses exactly as your wallet shows them. */
export interface DonateConfig {
  /** Full Ko-fi (or Buy Me a Coffee / Stripe payment link) URL, e.g. 'https://ko-fi.com/yourname' */
  tipUrl: string;
  /** Label on the tip button */
  tipLabel: string;
  /** Bitcoin address (bc1…, 1… or 3…) */
  btc: string;
  /** Ethereum-style address (0x…) */
  eth: string;
  /** Name shown for the 0x address, e.g. 'Ethereum (ETH)' or 'Tether (USDT)' */
  ethLabel: string;
  /** Networks the 0x address can receive on, shown to donors */
  ethNetworks: string;
}

export interface ContactConfig {
  /** Optional Cloudflare Turnstile site key (anti-spam). '' = only the built-in spam traps.
   *  If you set it, also run: pnpm exec wrangler secret put TURNSTILE_SECRET */
  turnstileSiteKey: string;
}
