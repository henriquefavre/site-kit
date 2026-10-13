# site-kit

Shared building blocks for our sites, used through the `Sites` pnpm workspace:

| Import | What it does |
| --- | --- |
| `site-kit/donate` | `setupDonations(DONATE)`: tip bar, donate box, floating tip button, BTC/ETH QR codes |
| `site-kit/addresses` | BTC / ETH address checksum validation (a mistyped address is never shown) |
| `site-kit/contact` | `setupContact(CONTACT)`: contact form posting to `/api/contact`, optional Turnstile |
| `site-kit/exit-ask` | `setupExitAsk({...})`: the one-time "Before you go…" tip card |
| `site-kit/worker` | `createSiteWorker({ siteName })`: Cloudflare Worker serving `dist/` + contact emails |
| `site-kit/types` | `DonateConfig`, `ContactConfig` |
| `site-kit/support.css` | Styles for all of the above (uses the site's colour tokens) |

Sites import the TypeScript directly; Vite and Wrangler bundle it, so there is no build step here.
`template/` is the starter for new sites. Change something here and every site picks it up on its next build.

## Folder layout

```
Documents\Sites\
  package.json, pnpm-workspace.yaml, pnpm-lock.yaml   ← workspace (copies in site-kit/workspace/)
  node_modules\                                        ← the one shared install
  site-kit\                                            ← this repo
  mrsnetworth\                                         ← one repo per site
```

## Everyday commands (from `Documents\Sites`)

```bash
pnpm install                                        # after cloning, or after adding a site
pnpm new-site budget-buddy "Budget Buddy" budgetbuddy.app   # new site from template/
pnpm --filter mrsnetworth dev                       # or: cd mrsnetworth && pnpm dev
pnpm -r run build                                   # build every site
```

Deploy a site from its folder with `pnpm run ship` (note: `pnpm deploy` is a different, built-in pnpm command).

## Deploying with Cloudflare (git push)

Cloudflare clones only the site's own repo, so it can't see this folder or the workspace files.
Each site has `scripts/cloudflare-build.sh`, which fetches site-kit from GitHub, rebuilds a small
workspace (site + site-kit, versions from `workspace/pnpm-workspace.yaml`) and builds.
In the Worker's **Settings → Build**:

| Setting | Value |
| --- | --- |
| Build command | `bash scripts/cloudflare-build.sh` |
| Deploy command | `npx wrangler deploy` (default) |
| Build variable | `SKIP_DEPENDENCY_INSTALL` = `1` |
| Build variable (only if site-kit is private) | `SITE_KIT_TOKEN` = read-only GitHub token, marked **Secret** |

So site-kit must be pushed to `github.com/henriquefavre/site-kit` (branch `main`) before a site can build there,
and a change to site-kit reaches a live site on that site's next build.

## New computer

```bash
npm install -g pnpm
mkdir Sites && cd Sites
git clone https://github.com/henriquefavre/site-kit.git
copy site-kit\workspace\* .        # package.json, pnpm-workspace.yaml, .gitignore
git clone https://github.com/henriquefavre/mrsnetworth.git
pnpm install
```
