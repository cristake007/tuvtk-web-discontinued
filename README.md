# TUVTK Web

Dockerized React and Django application with a versioned API and two independent PostgreSQL 18 databases.

- `db_core` — users, sessions, permissions, application configuration, navigation, and operational data.
- `db_registry` — the large ONRC company registry and related reference data.

## Stack

### Backend

- Python 3.14
- Django 6
- Django Ninja
- Django session authentication and CSRF protection
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

The Django container is not published on a host port. Use the React development address for the application, admin, API documentation, and API requests.

`compose.override.yaml` is the only development override. Docker Compose loads it automatically. It replaces Gunicorn with Django `runserver` and starts Vite. Python changes use Django auto-reload and React changes use Vite Fast Refresh.

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

Start the environment and initialize Django:

```bash
./dev up
./dev migrate
./dev admin-create
```

The first frontend start generates `frontend/package-lock.json` when it is missing. Review and commit that file immediately:

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

Sign into the React application with the Django account created by `./dev admin-create`.

Normal Python, TypeScript, React, and CSS edits do not require a container restart. Restart the frontend after changing `package.json` or `package-lock.json` so dependencies are synchronized before Vite starts.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml                 Base backend and database services
├── compose.override.yaml        Development runserver and Vite services
├── dev                          Development command harness
├── backend/
│   ├── apps/
│   │   ├── accounts/            Session authentication API and account contracts
│   │   └── core/                Shell configuration and permission-aware navigation
│   ├── config/
│   │   ├── api.py               Main versioned Django Ninja API
│   │   ├── settings.py
│   │   └── urls.py
│   ├── tests/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── scripts/                 Dependency synchronization and Vite startup
│   ├── src/
│   │   ├── api/                 Shared HTTP transport, core API calls, and contracts
│   │   ├── app/                 React Router configuration
│   │   ├── features/auth/       Session API, query keys, and authentication boundary
│   │   ├── layout/              Header, sidebar, and application shell
│   │   ├── pages/               Login and route-level pages
│   │   └── styles/
│   ├── package.json
│   ├── package-lock.json        Committed deterministic dependency tree
│   └── vite.config.ts
└── .env.example
```

## Frontend dependency workflow

`frontend/node_modules` is stored in the bind-mounted frontend directory and ignored by Git. This lets a host or Remote SSH editor resolve TypeScript, React, and `vite/client` definitions while the Node container remains the authoritative runtime.

`frontend/package-lock.json` must be committed. npm documents the lockfile as the exact dependency tree used to make teammate, deployment, and CI installs reproducible. `npm ci` requires that committed lockfile and refuses to silently rewrite it when it differs from `package.json`.

On frontend startup:

1. If the lockfile is missing, the development entrypoint runs `npm install`, creates it, and prints a commit reminder.
2. If `node_modules` is missing or its recorded lockfile hash differs, it runs `npm ci`.
3. If the installed tree already matches the lockfile, Vite starts without reinstalling packages.

After adding, removing, or updating packages:

```bash
./dev npm install <package> --save-exact
./dev frontend-lock
./dev restart frontend
git add frontend/package.json frontend/package-lock.json
git commit
```

Do not use `--no-package-lock`, and do not commit `node_modules`.

## Authentication contract

React uses Django's built-in users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

`GET /api/v1/auth/session` always returns HTTP `200`. An anonymous browser is normal application state, not an API exception:

```json
{
  "authenticated": false,
  "user": null
}
```

An authenticated response contains the current account:

```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "admin",
    "display_name": "admin",
    "email": "",
    "is_staff": true
  }
}
```

`POST /login` returns `401` only for invalid credentials. `POST /logout` is CSRF-protected and idempotent: it returns `204` even if the browser session has already expired. Protected business endpoints continue to return `401` when no valid session exists.

The browser stores only Django's session identifier. Frontend requests include same-origin credentials and send `X-CSRFToken` for unsafe methods. Do not add JWT, a second user table, or frontend-only authorization without a concrete external-client requirement.

## Core application shell

The `core` Django app owns shared shell data:

- `ApplicationConfiguration` stores application and organization labels.
- `NavigationItem` stores ordered, nested, permission-aware navigation entries.
- `GET /api/v1/core/bootstrap` returns the authenticated user's shell configuration and permitted navigation.

React owns the complete visible shell: login, header, sidebar, routing, and pages. Django does not render a root application page.

Manage users and shell records through:

```text
http://localhost:5173/admin/
```

## API conventions

The API is mounted under `/api/v1/`.

Each domain app owns its router, schemas, services, and tests:

```text
backend/apps/companies/api.py
backend/apps/companies/schemas.py
backend/apps/companies/services.py
backend/apps/companies/tests.py
```

- `api.py` handles HTTP input, authentication, permissions, status codes, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transactions.
- `models.py` owns persistence and database constraints.
- `tests.py` verifies success, authentication, permission, CSRF, validation, and important error behavior.

Frontend transport and feature API code are separated:

- `frontend/src/api/http.ts` owns fetch, empty-body and JSON handling, credentials, errors, and CSRF headers.
- `frontend/src/api/core.ts` owns core/system API calls.
- `frontend/src/features/auth/api.ts` owns authentication requests.
- TanStack Query owns server-state caching; components do not call `fetch` directly.

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

Only enable `DJANGO_TRUST_X_FORWARDED_PROTO` when the trusted reverse proxy removes client-supplied forwarding headers and sets `X-Forwarded-Proto` itself.

The Vite development server is not a production web server. A production deployment must serve the compiled React output behind the same HTTPS origin that proxies `/api/`, `/admin/`, and `/media/` to Django.

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

`./dev validate` runs Django checks and tests, synchronizes frontend dependencies, then runs TypeScript validation and the Vite production build.

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
