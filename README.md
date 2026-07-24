# TUVTK Web

Dockerized React and Django application with a versioned API and two independent PostgreSQL 18 databases.

- `db_core` — users, sessions, permissions, application configuration, navigation, and operational data.
- `db_registry` — the large ONRC company registry and related reference data.

## Stack

### Backend

- Python 3.14
- Django 6
- Django Ninja
- Django sessions and CSRF protection
- Gunicorn outside the development override
- PostgreSQL 18

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query

## Development architecture

```text
Browser
  └── React/Vite :5173
        ├── /api/*   ──proxy──> Django :8000
        ├── /admin/* ──proxy──> Django :8000
        ├── /media/* ──proxy──> Django :8000
        └── application routes rendered by React

Django :8000
  ├── internal Compose service only
  ├── default database  ──> db_core
  └── registry database ──> db_registry
```

The Django container is not published on a host port. Use the React address for the application, Django admin, API documentation, and API requests.

`compose.override.yaml` is the only development override. It replaces Gunicorn with Django `runserver` and starts Vite. Both source trees are bind-mounted for automatic reload.

The frontend container runs as the current host UID/GID. It does not run as root and does not use a root permission-initializer service.

## Initial setup

Requirements:

- Linux or WSL
- Docker Engine
- Docker Compose v2
- Git
- Bash

```bash
git clone git@github.com:cristake007/tuvtk-web.git
cd tuvtk-web
cp .env.example .env
chmod +x dev
```

Replace the example Django secret and database passwords in `.env`.

```bash
openssl rand -base64 48
openssl rand -hex 24
```

Start and initialize the application:

```bash
./dev up
./dev migrate
./dev admin-create
```

The first frontend start generates `frontend/package-lock.json` when it is missing. Commit it immediately:

```bash
git add frontend/package-lock.json
git commit -m "Lock frontend dependencies"
```

Open:

```text
React application: http://localhost:5173/
Django admin:      http://localhost:5173/admin/
API docs:          http://localhost:5173/api/v1/docs
OpenAPI JSON:      http://localhost:5173/api/v1/openapi.json
```

Sign in with the Django account created by `./dev admin-create`.

Normal Python, TypeScript, React, and CSS edits do not require a restart. Restart the frontend after changing `package.json` or `package-lock.json`.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml
├── compose.override.yaml
├── dev
├── backend/
│   ├── apps/
│   │   ├── accounts/       Session authentication API
│   │   └── core/           Shell configuration and navigation
│   ├── config/             Django settings, URLs, and API entrypoint
│   ├── tests/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── scripts/            Dependency synchronization and Vite startup
│   ├── src/
│   │   ├── api/            Shared HTTP transport and core API calls
│   │   ├── app/            React Router configuration
│   │   ├── features/auth/  Session API and authentication boundary
│   │   ├── layout/         Header, sidebar, and application shell
│   │   ├── pages/          Route-level pages
│   │   └── styles/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
└── .env.example
```

## Frontend dependency workflow

`frontend/node_modules` is stored in the bind-mounted frontend directory and ignored by Git. This allows Remote SSH and local editors to resolve TypeScript, React, and `vite/client` definitions while Docker remains the runtime environment.

`frontend/package-lock.json` is required and must be committed. Startup behavior is deterministic:

1. A missing lockfile is generated once with `npm install`.
2. Missing or stale dependencies are synchronized with `npm ci`.
3. Matching dependencies are reused without reinstalling.

After changing dependencies:

```bash
./dev npm install <package> --save-exact
./dev frontend-lock
./dev restart frontend
./dev validate
git add frontend/package.json frontend/package-lock.json
```

Do not use `sudo npm`, `--no-package-lock`, or commit `node_modules`.

### Build output

Development validation must not write generated bundles into the bind-mounted source tree. The development Compose service sets:

```text
VITE_BUILD_OUT_DIR=/tmp/tuvtk-frontend-dist
```

Therefore `./dev frontend-build` and `./dev validate` write their temporary bundle inside the container. A production build without this development environment variable continues to use Vite's conventional `frontend/dist` output.

An old host-side `frontend/dist` directory is ignored and is not read or modified by development validation.

## Authentication contract

React uses Django's built-in users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

`GET /api/v1/auth/session` always returns HTTP `200`. Anonymous state is normal:

```json
{
  "authenticated": false,
  "user": null
}
```

`POST /login` returns `401` only for invalid credentials. `POST /logout` is CSRF-protected, idempotent, and returns `204`. Protected business endpoints return `401` without a valid session.

Do not add JWT, a second user table, or frontend-only authorization without a concrete external-client requirement.

## Core application shell

The `core` Django app owns shared shell data:

- `ApplicationConfiguration` stores application and organization labels.
- `NavigationItem` stores ordered, nested, permission-aware navigation entries.
- `GET /api/v1/core/bootstrap` returns the authenticated user's shell configuration and permitted navigation.

React owns the visible login page, header, sidebar, routing, and feature pages. Django does not render a root application page.

## API conventions

The API is mounted under `/api/v1/`. Each Django domain app owns its router, schemas, services, models, and tests:

```text
backend/apps/companies/api.py
backend/apps/companies/schemas.py
backend/apps/companies/services.py
backend/apps/companies/models.py
backend/apps/companies/tests.py
```

- `api.py` handles HTTP input, authentication, permissions, statuses, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transaction boundaries.
- `models.py` owns persistence and database constraints.
- `tests.py` verifies success, authentication, permissions, CSRF, validation, and important errors.

Frontend components do not call `fetch` directly:

- `frontend/src/api/http.ts` owns HTTP, credentials, CSRF, empty-body, JSON, and error handling.
- Feature modules own their API calls and TanStack Query keys.

## Security settings

Development defaults use HTTP-compatible cookies. Production must use HTTPS and set at least:

```env
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com
DJANGO_SESSION_COOKIE_SECURE=true
DJANGO_CSRF_COOKIE_SECURE=true
DJANGO_SECURE_SSL_REDIRECT=true
DJANGO_TRUST_X_FORWARDED_PROTO=true
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=true
DJANGO_SECURE_HSTS_PRELOAD=true
```

Only trust `X-Forwarded-Proto` when the trusted reverse proxy removes client-supplied forwarding headers and sets it itself.

The Vite development server is not a production web server. Production must serve the compiled React output behind the same HTTPS origin that proxies `/api/`, `/admin/`, and `/media/` to Django.

## Development commands

```bash
./dev help
./dev up
./dev down
./dev status
./dev logs backend
./dev logs frontend
./dev backend-shell
./dev frontend-shell

./dev check
./dev test
./dev migrations
./dev migrate
./dev shell

./dev frontend-sync
./dev frontend-lock
./dev frontend-typecheck
./dev frontend-build
./dev npm <arguments>

./dev validate
```

`./dev validate` runs Django checks and tests, synchronizes frontend dependencies, runs TypeScript validation, and creates a temporary Vite production bundle inside the container.

Database reset commands are destructive and request explicit confirmation:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Databases

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not use cross-database foreign keys. Core records should reference registry companies through stable identifiers such as CUI.
