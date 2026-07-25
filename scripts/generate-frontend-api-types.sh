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
SCHEMA_PATH="$ROOT_DIR/frontend/.openapi.generated.json"
trap 'rm -f "$SCHEMA_PATH"' EXIT

if "${DOCKER[@]}" compose ps --status running --services | grep -qx backend; then
    "${DOCKER[@]}" compose exec -T backend \
        python manage.py spectacular --format openapi-json > "$SCHEMA_PATH"
else
    "${DOCKER[@]}" compose run --rm --no-deps -T backend \
        python manage.py spectacular --format openapi-json > "$SCHEMA_PATH"
fi

if "${DOCKER[@]}" compose ps --status running --services | grep -qx frontend; then
    "${DOCKER[@]}" compose exec -T frontend npm run api:types
else
    "${DOCKER[@]}" compose run --rm --no-deps -T frontend npm run api:types
fi

echo "Updated frontend/src/api/generated.ts from the backend OpenAPI schema."
