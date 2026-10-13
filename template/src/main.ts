import 'site-kit/support.css';
import './style.css';

import { setupDonations } from 'site-kit/donate';
import { setupContact } from 'site-kit/contact';
import { setupExitAsk } from 'site-kit/exit-ask';
import { DONATE, CONTACT } from './config';

setupDonations(DONATE);
setupContact(CONTACT);
setupExitAsk({
  tipUrl: DONATE.tipUrl,
  message: '__SITE_NAME__ is free, with no ads and nothing saved. If it helped you today, a coffee keeps it online.',
  cryptoText: DONATE.btc || DONATE.eth ? 'Prefer crypto?' : '',
});

// Your site's own code starts here.
