# AGENTS.md

## Purpose

This repository contains a Dockerized Django platform with a versioned Django Ninja API. Keep changes small, explicit, and compatible with the existing development harness.

## Architecture

- Root `Dockerfile` builds the Django runtime image.
- Root `compose.yaml` runs one Django container and two independent PostgreSQL 18 containers.
- Host `backend/` is bind-mounted to `/app`; application source must remain on the host.
- `db_core` stores Django system tables and normal operational application data.
- `db_registry` is reserved for the large ONRC registry and related reference data.
- Django database aliases are `default` for core and `registry` for ONRC data.
- `backend/config/api.py` owns the main Django Ninja API mounted at `/api/v1/`.

Do not create Django admin, auth, session, or content-type tables in the registry database. Do not introduce cross-database foreign keys. Reference registry companies from core data using stable values such as CUI.

## Repository layout

```text
backend/config/          Project-wide Django configuration and API entrypoint
backend/apps/            Local Django domain applications
backend/tests/           Project-level integration tests
backend/media/           Runtime uploads; not source code
backend/staticfiles/     Collected static files; not source code
backend/logs/            Runtime logs; not source code
```

Create Django apps with:

```bash
./dev app <name>
```

Apps must remain under `backend/apps/<name>/`, use the Python path `apps.<name>`, and be registered with their complete `AppConfig` path.

## API conventions

The public API prefix is `/api/v1/`. Preserve explicit versioning when adding routes.

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
- `schemas.py`: Pydantic/Django Ninja input and output contracts.
- `services.py`: business workflows and transaction boundaries.
- `models.py`: persistence and database constraints.

Endpoint functions must remain thin. Do not place substantial ORM queries or workflow logic directly in route functions.

Use Django session authentication for browser-facing internal routes. Authenticated routes should declare `django_auth` or router-level session authentication. Public routes must explicitly declare `auth=None`; do not make a route public accidentally.

Every new endpoint should have tests covering the relevant success response, authentication or permission behavior, validation failures, and important error status codes.

Do not expose registry write operations until the registry data model, database router, and import strategy explicitly support them. Registry queries must use the `registry` database alias or an approved router.

## Development commands

Prefer the root harness instead of manually reproducing Docker commands:

```bash
./dev up
./dev status
./dev check
./dev test
./dev migrations
./dev migrate
./dev shell
```

`./dev up` rebuilds the backend image, so use it after changing `backend/requirements.txt`.

Use direct `docker compose` commands only when diagnosing Docker or improving the harness itself.

Never run `migrate-registry` or `migrate-all` until a registry-specific application and database router explicitly control which migrations may run there.

The following commands are destructive and must never be run without the user's explicit request:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Implementation rules

- Inspect the relevant files before changing architecture or dependencies.
- Reuse Django, Django Ninja, Pydantic, and PostgreSQL capabilities before adding frameworks or services.
- Keep domain logic inside the owning app, not in `config/`.
- Keep external-data validation, imports, and service logic separate from views and API routes.
- Use database constraints for persistent invariants.
- Pin dependencies in `backend/requirements.txt` and add them only for a concrete requirement.
- Do not commit `.env`, secrets, database dumps, logs, uploaded media, or collected static files.
- Update `.env.example`, `README.md`, and this file when architecture or setup changes.
- Preserve host ownership of generated files; do not create source files as root.

## Validation before completion

Run the smallest relevant checks, normally:

```bash
./dev check
./dev test
```

For model changes, also create and inspect migrations:

```bash
./dev migrations
./dev migrate
```

For API changes, verify the OpenAPI schema remains available at `/api/v1/openapi.json` and that the API tests cover authentication and response contracts.

Report what changed, which checks ran, and anything that could not be verified.
