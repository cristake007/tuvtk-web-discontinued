#!/bin/sh
set -eu

TARGET_UID="${LOCAL_UID:-1000}"
TARGET_GID="${LOCAL_GID:-1000}"
TARGET_OWNER="${TARGET_UID}:${TARGET_GID}"
NODE_MODULES_DIR="/app/node_modules"
OWNER_MARKER="${NODE_MODULES_DIR}/.tuvtk-owner"

mkdir -p "$NODE_MODULES_DIR"

installed_owner="$(cat "$OWNER_MARKER" 2>/dev/null || true)"

if [ "$installed_owner" != "$TARGET_OWNER" ]; then
    echo "Preparing frontend/node_modules for ${TARGET_OWNER}..."
    chown -R "$TARGET_OWNER" "$NODE_MODULES_DIR"
    printf '%s\n' "$TARGET_OWNER" > "$OWNER_MARKER"
    chown "$TARGET_OWNER" "$OWNER_MARKER"
fi

if [ -e /app/package-lock.json ]; then
    chown "$TARGET_OWNER" /app/package-lock.json
fi
