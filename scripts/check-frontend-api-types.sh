#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPORARY_OUTPUT="$(mktemp "$ROOT_DIR/frontend/.generated-types.XXXXXX.ts")"
trap 'rm -f "$TEMPORARY_OUTPUT"' EXIT
chmod 666 "$TEMPORARY_OUTPUT"

OPENAPI_TYPES_OUTPUT_PATH="$TEMPORARY_OUTPUT" "$ROOT_DIR/scripts/generate-frontend-api-types.sh"
diff --unified=3 "$ROOT_DIR/frontend/src/api/generated.ts" "$TEMPORARY_OUTPUT"
