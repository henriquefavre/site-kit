// Cloudflare Worker: serves dist/ and handles the contact form (/api/contact). All logic lives in site-kit.
import { createSiteWorker } from 'site-kit/worker';

export default createSiteWorker({ siteName: '__SITE_NAME__' });
