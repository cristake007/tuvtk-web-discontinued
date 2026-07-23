#!/usr/bin/env bash
set -euo pipefail

VOLUME_NAME="$(
  grep -E '^POSTGRES_VOLUME_NAME=' .env 2>/dev/null |
  tail -n 1 |
  cut -d= -f2-
)"

VOLUME_NAME="${VOLUME_NAME:-tuvtk_postgres_data}"

echo "Stopping containers..."
sudo docker compose down

echo "Deleting PostgreSQL volume: ${VOLUME_NAME}"
sudo docker volume rm "${VOLUME_NAME}" 2>/dev/null || true

echo "Starting fresh containers..."
sudo docker compose up -d

echo "Waiting for Django..."
until sudo docker compose exec -T backend \
  python manage.py check >/dev/null 2>&1
do
  sleep 2
done

echo "Creating development administrator..."
sudo docker compose exec -T backend \
  python manage.py createsuperuser --noinput

echo "Fresh development database created."
