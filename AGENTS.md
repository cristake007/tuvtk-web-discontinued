# AGENTS.md

## Purpose

This repository contains a Dockerized Django platform. Keep changes small, explicit, and compatible with the existing development harness.

## Architecture

- Root `Dockerfile` builds the Django runtime image.
- Root `compose.yaml` runs one Django container and two independent PostgreSQL 18 containers.
- Host `backend/` is bind-mounted to `/app`; application source must remain on the host.
- `db_core` stores Django system tables and normal operational application data.
- `db_registry` is reserved for the large ONRC registry and related reference data.
- Django database aliases are `default` for core and `registry` for ONRC data.

Do not create Django admin, auth, session, or content-type tables in the registry database. Do not introduce cross-database foreign keys. Reference registry companies from core data using stable values such as CUI.

## Repository layout

```text
backend/config/          Project-wide Django configuration
backend/apps/            Local Django applications
backend/media/           Runtime uploads; not source code
backend/staticfiles/     Collected static files; not source code
backend/logs/            Runtime logs; not source code
```

Create Django apps with:

```bash
./dev app <name>
```

Apps must remain under `backend/apps/<name>/`, use the Python path `apps.<name>`, and be registered with their complete `AppConfig` path.

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
- Reuse Django and PostgreSQL capabilities before adding frameworks or services.
- Keep domain logic inside the owning app, not in `config/`.
- Keep external-data validation, imports, and service logic separate from views.
- Use database constraints for persistent invariants.
- Add dependencies only for a concrete requirement.
- Do not commit `.env`, secrets, database dumps, logs, uploaded media, or collected static files.
- Update `.env.example` and `README.md` when configuration or setup changes.
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

Report what changed, which checks ran, and anything that could not be verified.
