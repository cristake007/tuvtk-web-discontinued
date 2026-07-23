#!/usr/bin/env bash
set -euo pipefail

REGISTRY_DB="${POSTGRES_REGISTRY_DB:-tuvtk_registry}"

echo "Creating additional database: ${REGISTRY_DB}"

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=registry_db="$REGISTRY_DB" \
  --set=database_owner="$POSTGRES_USER" <<'EOSQL'
SELECT format(
    'CREATE DATABASE %I OWNER %I',
    :'registry_db',
    :'database_owner'
)
WHERE NOT EXISTS (
    SELECT FROM pg_database
    WHERE datname = :'registry_db'
)\gexec
EOSQL
