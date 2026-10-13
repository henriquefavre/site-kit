#!/usr/bin/env bash
# Cloudflare build: recreates the Sites workspace inside the build machine.
#
# On your computer this site lives in Documents\Sites next to site-kit, and pnpm links
# the two together. Cloudflare only clones this repo, so this script fetches site-kit
# too, turns this folder into a small two-package workspace and builds.
#
# Cloudflare settings (Workers & Pages > this Worker > Settings > Build):
#   Build command:   bash scripts/cloudflare-build.sh
#   Deploy command:  npx wrangler deploy            (the default)
#   Build variables: SKIP_DEPENDENCY_INSTALL = 1
#                    SITE_KIT_TOKEN = <GitHub token>  (only if the site-kit repo is private; mark it as Secret)
#
# Never run this on your computer: it is only for the clean Cloudflare build machine.
set -euo pipefail

SITE_KIT_REPO="${SITE_KIT_REPO:-github.com/henriquefavre/site-kit.git}"
SITE_KIT_REF="${SITE_KIT_REF:-main}"

if [ -f ../pnpm-workspace.yaml ]; then
  echo "This folder is already inside a pnpm workspace (your Sites folder). Use 'pnpm run build' here instead." >&2
  exit 1
fi

# 1. Fetch site-kit (public repo, or private with a read-only token)
rm -rf .site-kit
if [[ "$SITE_KIT_REPO" == /* ]]; then
  url="$SITE_KIT_REPO"                                    # local path (used for testing)
elif [ -n "${SITE_KIT_TOKEN:-}" ]; then
  url="https://x-access-token:${SITE_KIT_TOKEN}@${SITE_KIT_REPO}"
else
  url="https://${SITE_KIT_REPO}"
fi
echo "Fetching site-kit (${SITE_KIT_REF})…"
git clone --quiet --depth 1 --branch "$SITE_KIT_REF" "$url" .site-kit

# 2. Workspace = this site + site-kit, with the shared version catalog from site-kit/workspace
sed "s#^  - '\*'#  - '.'\n  - '.site-kit'#" .site-kit/workspace/pnpm-workspace.yaml > pnpm-workspace.yaml
grep -q "'.site-kit'" pnpm-workspace.yaml || { echo "Could not set up pnpm-workspace.yaml" >&2; exit 1; }

# 3. Install with the same pnpm major as your computer, then build
PNPM="npx --yes pnpm@${PNPM_VERSION:-12}"
$PNPM install --no-frozen-lockfile
$PNPM run build
