# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend and Django backend with a versioned Django Ninja API. Keep changes small, explicit, testable, and compatible with the root `./dev` harness.

## Architecture

- `compose.yaml` defines Django and two independent PostgreSQL 18 services.
- `compose.override.yaml` is the only development override; it starts Django `runserver` and Vite.
- `backend/` and `frontend/` are bind-mounted for development reload.
- The frontend container runs as the current host UID/GID. Do not add a root-running frontend or permission-initializer service.
- React owns all visible application pages, routing, login, header, sidebar, and feature UI.
- Django owns authentication, permissions, data access, business logic, administration, and the API.
- Django is internal on port 8000 and is reached through Vite proxies for `/api`, `/admin`, `/media`, and `/static`.
- `db_core` stores Django system tables and operational data.
- `db_registry` stores ONRC registry and reference data.
- Django aliases are `default` for core and `registry` for ONRC data.

Do not create Django auth, admin, session, or content-type tables in the registry database. Do not create cross-database foreign keys. Reference registry companies through stable identifiers such as CUI.

## Repository layout

```text
backend/config/                 Django project configuration and API entrypoint
backend/apps/accounts/          Browser session authentication API
backend/apps/core/              Shell configuration and navigation
backend/apps/<domain>/          Other backend domains
backend/tests/                  Project-level backend tests
frontend/scripts/               Dependency synchronization and Vite startup
frontend/src/api/               Shared HTTP transport and core API calls
frontend/src/features/auth/     Authentication API, query keys, and gate
frontend/src/layout/            Shared application shell
frontend/src/pages/             Route-level pages
frontend/src/styles/            Shared styles
```

Create Django apps with:

```bash
./dev app <name>
```

Apps belong under `backend/apps/<name>/`, use `apps.<name>`, and must be registered with their complete `AppConfig` path.

## Authentication

Use Django users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

Rules:

- `GET /auth/session` always returns `200` with `{authenticated, user}`.
- Invalid login credentials return `401`.
- Logout is CSRF-protected, idempotent, and returns `204`.
- Protected business routes use Django session authentication and return `401` without a valid session.
- Unsafe requests include Django's CSRF header.
- Permission checks belong in Django; React is not the security boundary.
- Do not add JWT or another user store without a concrete external-client requirement.

Authentication belongs to `backend/apps/accounts/`. Shell configuration and navigation belong to `backend/apps/core/`.

## API conventions

The public API prefix is `/api/v1/`. Domain endpoints belong to the owning app:

```text
backend/apps/<app>/api.py
backend/apps/<app>/schemas.py
backend/apps/<app>/services.py
backend/apps/<app>/models.py
backend/apps/<app>/tests.py
```

Responsibilities:

- `api.py`: HTTP routes, authentication, permissions, statuses, and response mapping.
- `schemas.py`: Django Ninja input and output contracts.
- `services.py`: business workflows and transaction boundaries.
- `models.py`: persistence and database constraints.
- `tests.py`: success, authentication, permission, CSRF, validation, and important error behavior.

Keep route functions thin. Do not place substantial ORM queries or workflows directly in endpoints.

## Frontend conventions

- React and TypeScript own all user-facing pages.
- Use React Router for routes and TanStack Query for server state.
- `frontend/src/api/http.ts` is the shared HTTP, credentials, CSRF, empty-body, JSON, and error transport.
- Feature API calls and query keys belong to focused feature modules.
- Components must not call `fetch` directly or duplicate CSRF handling.
- Keep authentication in `frontend/src/features/auth/`.
- Keep the shared header and sidebar in `frontend/src/layout/`.
- Treat Django responses and permissions as authoritative.
- Prefer focused feature folders over a global component dump.
- Do not introduce another frontend framework.

## Frontend dependencies and generated files

- `frontend/package-lock.json` is required and committed.
- Direct dependencies are pinned to exact versions.
- Do not use `--no-package-lock` or edit the lockfile manually.
- Do not commit `frontend/node_modules/` or build output.
- Startup generates the initial lockfile only when missing, then uses `npm ci` whenever the installed dependency hash differs.
- The frontend container runs as the host UID/GID. Do not run `sudo npm` or create root-owned files in `frontend/`.
- Development validation sets `VITE_BUILD_OUT_DIR=/tmp/tuvtk-frontend-dist`; it must not write or clean `frontend/dist`.
- A production build without the development override uses the conventional `frontend/dist` output.

Dependency workflow:

```bash
./dev npm install <package> --save-exact
./dev frontend-lock
./dev restart frontend
./dev validate
git add frontend/package.json frontend/package-lock.json
```

## Development commands

Prefer the root harness:

```bash
./dev up
./dev status
./dev logs backend
./dev logs frontend
./dev check
./dev test
./dev frontend-sync
./dev frontend-lock
./dev frontend-typecheck
./dev frontend-build
./dev validate
```

Useful passthrough commands:

```bash
./dev backend-shell
./dev frontend-shell
./dev django <arguments>
./dev npm <arguments>
```

Normal source edits reload automatically. Restart the frontend after dependency or lockfile changes. Use direct Docker Compose commands only for diagnosis or harness work.

Never run `migrate-registry` or `migrate-all` until a registry-specific app and database router explicitly control registry migrations.

Destructive commands require the user's explicit request:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Production and security

- Production uses one HTTPS origin for React, `/api/`, `/admin/`, and `/media/`.
- Vite's development server is never a production server.
- Production frontend images and CI install from the committed lockfile with `npm ci`.
- Enable secure session and CSRF cookies, HTTPS redirection, and HSTS only after HTTPS is verified.
- Trust `X-Forwarded-Proto` only when the trusted proxy strips client-supplied forwarding headers and sets it itself.
- Keep `SESSION_COOKIE_HTTPONLY` enabled.
- Keep the CSRF cookie readable by the SPA so it can send `X-CSRFToken`.
- Do not weaken CSRF protection to work around frontend defects.

## Implementation rules

- Inspect relevant files before changing architecture or dependencies.
- Reuse Django, Django Ninja, React, TanStack Query, and PostgreSQL before adding frameworks or services.
- Keep domain logic in the owning Django app, not in `config/`.
- Use database constraints for persistent invariants.
- Preserve host ownership of source and generated lockfiles.
- Update `.env.example`, `README.md`, and this file when architecture or setup changes.
- Do not commit secrets, dumps, logs, uploads, collected static files, `node_modules`, or frontend bundles.

## Validation

For cross-stack changes:

```bash
./dev validate
```

For model changes:

```bash
./dev migrations
./dev migrate
```

For API changes, verify `/api/v1/openapi.json` through the frontend proxy and ensure tests cover authentication and response contracts.

Report what changed, which checks ran, and anything that could not be verified.
