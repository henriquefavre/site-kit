// Creates a new site next to site-kit from site-kit/template.
// Usage (from the Sites folder):  pnpm new-site <folder-name> "<Site Name>" [domain]
//   e.g.  pnpm new-site budgetbuddy "Budget Buddy" budgetbuddy.app
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [slug, name, domain] = process.argv.slice(2);
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: pnpm new-site <folder-name> "<Site Name>" [domain]\n  folder-name: lowercase letters, digits and dashes, e.g. budget-buddy');
  process.exit(1);
}
const kit = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dest = resolve(kit, '..', slug);
if (existsSync(dest)) { console.error(`A folder named "${slug}" already exists in ${dirname(dest)}.`); process.exit(1); }

cpSync(join(kit, 'template'), dest, { recursive: true });
const vars = { __SLUG__: slug, __SITE_NAME__: name || slug, __DOMAIN__: domain || `${slug}.example.com` };
const TEXT = /\.(json|jsonc|ts|html|css|md|txt|xml)$|^_headers$|^\.git(ignore|attributes)$/;
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.test(f)) continue;
    let s = readFileSync(p, 'utf8');
    for (const [k, v] of Object.entries(vars)) s = s.split(k).join(v);
    writeFileSync(p, s);
  }
})(dest);

console.log(`Created ${dest}

Next:
  pnpm install                 (links the new site into the workspace, takes seconds)
  cd ${slug}
  pnpm dev                     (preview at http://localhost:5173)
  git init && git add -A && git commit -m "Start ${vars.__SITE_NAME__}"
`);
