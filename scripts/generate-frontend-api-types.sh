#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker info >/dev/null 2>&1; then
    DOCKER=(docker)
else
    DOCKER=(sudo docker)
fi

export LOCAL_UID="${LOCAL_UID:-$(id -u)}"
export LOCAL_GID="${LOCAL_GID:-$(id -g)}"
SCHEMA_PATH="${OPENAPI_SCHEMA_PATH:-$ROOT_DIR/frontend/.openapi.generated.json}"
OUTPUT_PATH="${OPENAPI_TYPES_OUTPUT_PATH:-$ROOT_DIR/frontend/src/api/generated.ts}"
FRONTEND_SCHEMA_PATH="/app/$(basename "$SCHEMA_PATH")"
if [[ "$OUTPUT_PATH" == "$ROOT_DIR/frontend/src/api/generated.ts" ]]; then
    FRONTEND_OUTPUT_PATH="/app/src/api/generated.ts"
else
    FRONTEND_OUTPUT_PATH="/app/$(basename "$OUTPUT_PATH")"
fi
trap 'rm -f "$SCHEMA_PATH"' EXIT

if "${DOCKER[@]}" compose ps --status running --services | grep -qx backend; then
    "${DOCKER[@]}" compose exec -T backend \
        python manage.py spectacular --format openapi-json > "$SCHEMA_PATH"
else
    "${DOCKER[@]}" compose run --rm --no-deps -T backend \
        python manage.py spectacular --format openapi-json > "$SCHEMA_PATH"
fi

if "${DOCKER[@]}" compose ps --status running --services | grep -qx frontend; then
    "${DOCKER[@]}" compose exec -T frontend npm run api:types -- "$FRONTEND_SCHEMA_PATH" "$FRONTEND_OUTPUT_PATH"
else
    "${DOCKER[@]}" compose run --rm --no-deps -T frontend npm run api:types -- "$FRONTEND_SCHEMA_PATH" "$FRONTEND_OUTPUT_PATH"
fi

echo "Generated ${OUTPUT_PATH#$ROOT_DIR/} from the backend OpenAPI schema."
