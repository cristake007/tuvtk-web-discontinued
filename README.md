# TUVTK Web

Dockerized Django development environment with a versioned API and two independent PostgreSQL 18 containers:

- `db_core` — Django users, authentication, administration, and operational application data.
- `db_registry` — the large ONRC company registry and related reference data.

The host directory `backend/` is bind-mounted to `/app` in the Django container. Source files always remain directly editable on the host.

## Stack

- Python 3.14
- Django 6
- Django Ninja and Pydantic-based API schemas
- Gunicorn
- PostgreSQL 18
- Docker Compose

## Requirements

- Linux or WSL
- Docker Engine
- Docker Compose v2
- Git
- Bash

## Initial setup

```bash
git clone git@github.com:cristake007/tuvtk-web.git
cd tuvtk-web
cp .env.example .env
chmod +x dev
```

Edit `.env` and replace the example Django secret and both database passwords. Useful generators:

```bash
openssl rand -base64 48
openssl rand -hex 24
```

Start or rebuild the environment:

```bash
./dev up
./dev status
```

`./dev up` includes `--build`, so it installs changed Python dependencies after a pull.

Create the core Django tables and an administrator:

```bash
./dev migrate
./dev admin-create
```

The development interfaces are available at:

```text
Django admin:  http://localhost:8000/admin/
API docs:      http://localhost:8000/api/v1/docs
OpenAPI JSON:  http://localhost:8000/api/v1/openapi.json
```

Do not migrate Django authentication or administration tables into the registry database. The registry database remains empty until registry-specific models and a database router are added.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml
├── dev
├── backend/
│   ├── apps/                 Local domain applications
│   ├── config/
│   │   ├── api.py            Main versioned API instance
│   │   ├── settings.py
│   │   └── urls.py
│   ├── tests/                Project-level integration tests
│   ├── manage.py
│   └── requirements.txt
└── .env.example
```

Create local Django applications under `backend/apps/`:

```bash
./dev app users
./dev app audits
```

Register each app in `backend/config/settings.py` using its complete Python path, for example:

```python
"apps.users.apps.UsersConfig"
```

## API

The API is mounted under `/api/v1/`. The first endpoints are:

```text
GET /api/v1/health          Public API and core database health check
GET /api/v1/me              Current Django user; session authentication required
GET /api/v1/docs            Interactive API documentation
GET /api/v1/openapi.json    Machine-readable OpenAPI schema
```

Browser-facing internal endpoints use Django session authentication. The `/me` endpoint therefore works with the same login session as Django admin. Public endpoints must explicitly declare that authentication is disabled.

`backend/config/api.py` owns only the main `NinjaAPI` instance and project-wide system endpoints. As domain applications are added, each app should own its API router:

```text
backend/apps/audits/api.py
backend/apps/audits/schemas.py
backend/apps/audits/services.py
```

The central API then mounts that router. Keep endpoint functions thin:

- `api.py` handles HTTP input, authentication, status codes, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transactions.
- `models.py` owns persistence and database constraints.

## Common commands

```bash
./dev help
./dev up
./dev down
./dev status
./dev logs backend
./dev backend-shell
./dev check
./dev test
./dev migrations
./dev migrate
./dev shell
./dev admin-password admin
```

Database reset commands are destructive and request explicit confirmation:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

These commands remove Docker state and database volumes, not the bind-mounted `backend/` source directory.

## Databases

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

The core database owns normal Django and platform data. The registry database is reserved for ONRC records, CAEN data, company statuses, import metadata, and future enrichment data.

Cross-database foreign keys are not used. Core records should reference registry companies through stable identifiers such as CUI.

## Validation

Run the standard project checks before committing:

```bash
./dev check
./dev test
```
