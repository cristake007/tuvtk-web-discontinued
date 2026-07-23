# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend and Django backend with a versioned Django Ninja API. Keep changes small, explicit, testable, and compatible with the development harness.

## Architecture

- Root `compose.yaml` defines Django and two independent PostgreSQL 18 services.
- Root `compose.override.yaml` is the only development override; it starts Django `runserver` and the Vite frontend.
- `backend/` is bind-mounted into the Django container.
- `frontend/` is bind-mounted into the Node container.
- React owns the visible application, routing, login page, header, sidebar, and feature pages.
- Django owns authentication, permissions, data access, business logic, administration, and the API.
- Django is internal to the Compose network on port 8000 and is reached through Vite's `/api`, `/admin`, and `/media` proxies.
- `db_core` stores Django system tables and normal operational data.
- `db_registry` is reserved for the large ONRC registry and related reference data.
- Django database aliases are `default` for core and `registry` for ONRC data.
- `backend/config/api.py` owns only the main Django Ninja instance, system endpoints, and router registration.

Do not create Django admin, auth, session, or content-type tables in the registry database. Do not introduce cross-database foreign keys. Reference registry companies from core data using stable values such as CUI.

## Repository layout

```text
backend/config/                 Project-wide Django configuration and API entrypoint
backend/apps/accounts/          Session authentication API and account contracts
backend/apps/core/              Shell configuration and permission-aware navigation
backend/apps/<domain>/          Other backend domain applications
backend/tests/                  Project-level backend integration tests
frontend/src/api/               Shared HTTP transport, core API calls, and contracts
frontend/src/features/auth/     Authentication API, query keys, and gate
frontend/src/layout/            Shared React application shell
frontend/src/pages/             Route-level React pages
frontend/src/styles/            Shared frontend styles
```

Create Django apps with:

```bash
./dev app <name>
```

Apps must remain under `backend/apps/<name>/`, use the Python path `apps.<name>`, and be registered with their complete `AppConfig` path.

## Authentication

Use Django's built-in users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

The browser authentication contract is:

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

Rules:

- `GET /auth/session` always returns `200` with `{authenticated, user}`. Anonymous state is not an exception.
- Invalid login credentials return `401`.
- Logout is CSRF-protected, idempotent, and returns `204` even when the session has expired.
- Protected business routes use Django session authentication and return `401` without a valid session.
- Browser requests use same-origin cookies.
- Unsafe requests must include Django's CSRF header.
- Do not add JWT, a second user table, or frontend-only authorization without a concrete external-client requirement.
- Permission checks belong in Django. React may hide unavailable controls but must not be the security boundary.

Authentication endpoints and contracts belong to `backend/apps/accounts/`. Shell configuration and navigation belong to `backend/apps/core/`.

## API conventions

The public API prefix is `/api/v1/`. Preserve explicit versioning.

Domain endpoints belong to the app that owns the domain:

```text
backend/apps/<app>/api.py
backend/apps/<app>/schemas.py
backend/apps/<app>/services.py
backend/apps/<app>/tests.py
```

Keep responsibilities separated:

- `api.py`: HTTP routes, authentication, permissions, status codes, and response mapping.
- `schemas.py`: Django Ninja input and output contracts.
- `services.py`: business workflows and transaction boundaries.
- `models.py`: persistence and database constraints.
- `tests.py`: success, authentication, permission, CSRF, validation, and important error behavior.

Endpoint functions must remain thin. Do not put substantial ORM queries or workflows directly in route functions.

## Frontend conventions

- React and TypeScript own all user-facing pages.
- Use React Router for routes and TanStack Query for server state.
- `frontend/src/api/http.ts` is the only shared fetch/JSON/error/credentials/CSRF transport.
- Domain API calls belong to focused modules such as `frontend/src/api/core.ts` or `frontend/src/features/<feature>/api.ts`.
- Components must not call `fetch` directly or duplicate CSRF handling.
- Centralize TanStack Query keys inside the owning feature.
- Keep authentication code in `frontend/src/features/auth/`.
- Keep the shared header/sidebar in `frontend/src/layout/`.
- Treat Django responses and permissions as authoritative.
- Prefer focused feature folders over a large global component directory.
- Do not introduce a second frontend framework.

## Development commands

Prefer the root harness:

```bash
./dev up
./dev status
./dev logs backend
./dev logs frontend
./dev check
./dev test
./dev frontend-typecheck
./dev frontend-build
./dev validate
```

Useful shells and passthrough commands:

```bash
./dev backend-shell
./dev frontend-shell
./dev django <arguments>
./dev npm <arguments>
```

`./dev up` uses `compose.yaml` plus the automatically loaded `compose.override.yaml`. Normal Python and frontend source edits reload without a container restart.

Use direct `docker compose` commands only when diagnosing Docker or improving the harness.

Never run `migrate-registry` or `migrate-all` until a registry-specific app and database router explicitly control registry migrations.

The following commands are destructive and require the user's explicit request:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Production and security rules

- Production uses one HTTPS origin for React, `/api/`, `/admin/`, and `/media/`.
- The Vite development server is never a production web server.
- Production enables secure session and CSRF cookies, HTTPS redirection, and appropriate HSTS only after HTTPS is verified.
- Only trust `X-Forwarded-Proto` when the trusted reverse proxy strips client-supplied forwarding headers and sets it itself.
- Keep `SESSION_COOKIE_HTTPONLY` enabled.
- The CSRF cookie remains readable by the SPA because the frontend sends it in `X-CSRFToken`.
- Do not weaken CSRF protection to work around frontend bugs.

## Implementation rules

- Inspect relevant files before changing architecture or dependencies.
- Reuse Django, Django Ninja, React, TanStack Query, and PostgreSQL before adding frameworks or services.
- Keep domain logic inside the owning Django app, not in `config/`.
- Use database constraints for persistent invariants.
- Pin direct dependencies and commit lock files when dependency installation is finalized.
- Do not commit `.env`, secrets, database dumps, logs, uploaded media, collected static files, `node_modules`, or frontend build output.
- Update `.env.example`, `README.md`, and this file when architecture or setup changes.
- Preserve host ownership of generated source files.

## Validation before completion

Run the smallest relevant checks. For changes spanning both sides, use:

```bash
./dev validate
```

For model changes, also create and inspect migrations:

```bash
./dev migrations
./dev migrate
```

For API changes, verify `/api/v1/openapi.json` remains available through the frontend proxy and ensure tests cover authentication and response contracts.

Report what changed, which checks ran, and anything that could not be verified.
