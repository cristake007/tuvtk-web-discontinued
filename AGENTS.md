# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend and Django backend with a versioned Django Ninja API. Keep changes small, explicit, and compatible with the existing development harness.

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
- `backend/config/api.py` owns the main Django Ninja API mounted at `/api/v1/`.

Do not create Django admin, auth, session, or content-type tables in the registry database. Do not introduce cross-database foreign keys. Reference registry companies from core data using stable values such as CUI.

## Repository layout

```text
backend/config/          Project-wide Django configuration and API entrypoint
backend/apps/            Local Django domain applications
backend/tests/           Project-level backend integration tests
frontend/src/api/        Typed HTTP client and API contracts
frontend/src/auth/       Session authentication boundary
frontend/src/layout/     Shared React application shell
frontend/src/pages/      Route-level React pages
frontend/src/styles/     Shared frontend styles
```

Create Django apps with:

```bash
./dev app <name>
```

Apps must remain under `backend/apps/<name>/`, use the Python path `apps.<name>`, and be registered with their complete `AppConfig` path.

## Authentication

Use Django's built-in users, groups, permissions, password hashing, sessions, and CSRF protection.

- React authenticates through `/api/v1/auth/*`.
- Browser requests use same-origin session cookies.
- State-changing requests must include Django's CSRF header.
- Internal API routes should use `django_auth` unless explicitly public.
- Do not add JWT, a second user table, or frontend-only authorization without a concrete external-client requirement.
- Permission checks belong in Django. React may hide unavailable controls but must not be the security boundary.

## API conventions

The public API prefix is `/api/v1/`. Preserve explicit versioning.

`backend/config/api.py` should contain only:

- the main `NinjaAPI` instance;
- project-wide system endpoints such as health checks;
- router registration.

Domain endpoints belong to the app that owns the domain:

```text
backend/apps/<app>/api.py
backend/apps/<app>/schemas.py
backend/apps/<app>/services.py
```

Keep responsibilities separated:

- `api.py`: HTTP routes, authentication, permissions, status codes, and response mapping.
- `schemas.py`: Django Ninja input and output contracts.
- `services.py`: business workflows and transaction boundaries.
- `models.py`: persistence and database constraints.

Endpoint functions must remain thin. Every new endpoint should test success, authentication or permission behavior, validation failures, and important error statuses.

## Frontend conventions

- React and TypeScript own all user-facing pages.
- Use React Router for application routes and TanStack Query for server state.
- Keep API calls in `frontend/src/api/`; components must not duplicate fetch and CSRF handling.
- Keep authentication flow in `frontend/src/auth/` and the login page.
- Keep the shared header/sidebar in `frontend/src/layout/`.
- Treat Django responses and permissions as authoritative.
- Prefer focused components and feature folders over a large global component directory.
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

## Implementation rules

- Inspect relevant files before changing architecture or dependencies.
- Reuse Django, Django Ninja, React, TanStack Query, and PostgreSQL before adding frameworks or services.
- Keep domain logic inside the owning Django app, not in `config/`.
- Use database constraints for persistent invariants.
- Pin dependencies and add them only for a concrete requirement.
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
