#!/bin/sh
set -eu

LOCKFILE="package-lock.json"
STAMP_FILE="node_modules/.tuvtk-package-lock.sha256"

if [ ! -f "$LOCKFILE" ]; then
    echo "frontend/package-lock.json is missing; generating it with npm install."
    npm install --include=dev

    mkdir -p node_modules
    sha256sum "$LOCKFILE" | awk '{print $1}' > "$STAMP_FILE"

    echo
    echo "Generated frontend/package-lock.json. Commit this file before merging or deploying."
    exit 0
fi

expected_hash="$(sha256sum "$LOCKFILE" | awk '{print $1}')"
installed_hash="$(cat "$STAMP_FILE" 2>/dev/null || true)"

if [ ! -x node_modules/.bin/vite ] || [ ! -x node_modules/.bin/tsc ] || [ "$installed_hash" != "$expected_hash" ]; then
    echo "Synchronizing frontend dependencies from package-lock.json..."
    npm ci --include=dev
    mkdir -p node_modules
    printf '%s\n' "$expected_hash" > "$STAMP_FILE"
else
    echo "Frontend dependencies already match package-lock.json."
fi
