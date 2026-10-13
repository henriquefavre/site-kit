import type { ContactConfig, DonateConfig } from 'site-kit/types';

// ─────────────────────────────────────────────────────────────
//  Donation settings. Leave a value as '' to hide that option.
//  Paste addresses exactly as your wallet shows them.
// ─────────────────────────────────────────────────────────────
export const DONATE: DonateConfig = {
  tipUrl: '',
  tipLabel: 'Leave a tip',
  btc: '',
  eth: '',
  ethLabel: 'Ethereum (ETH)',
  ethNetworks: 'Ethereum network only',
};

export const CONTACT: ContactConfig = {
  turnstileSiteKey: '',
};
