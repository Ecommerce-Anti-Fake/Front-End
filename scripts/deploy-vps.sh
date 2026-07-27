#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing ${REPO_DIR}/.env" >&2
  exit 1
fi

git pull --ff-only
npm ci
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "Frontend build did not produce dist/index.html" >&2
  exit 1
fi

sudo nginx -t
sudo systemctl reload nginx
