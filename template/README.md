# __SITE_NAME__

Lives in the `Sites` pnpm workspace next to `site-kit` (shared donate / contact / worker code).

```bash
pnpm install            # once, from the Sites folder (or here)
pnpm dev                # local preview at http://localhost:5173
pnpm build              # typecheck + production build into dist/
pnpm run ship           # build and deploy to Cloudflare (first time: pnpm exec wrangler login)
```

Edit `src/config.ts` (tip link, crypto addresses) and `wrangler.jsonc` (CONTACT_TO, domain route).
