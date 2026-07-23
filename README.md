# TUVTK Web

Dockerized React and Django application with a versioned API and two independent PostgreSQL 18 databases:

- `db_core` — users, authentication, application configuration, navigation, and operational data.
- `db_registry` — the large ONRC company registry and related reference data.

## Stack

### Backend

- Python 3.14
- Django 6
- Django Ninja
- Gunicorn for production-style execution
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
        └── application routes rendered by React

Django
  ├── default database  ──> db_core
  └── registry database ──> db_registry
```

`compose.override.yaml` is loaded automatically by Docker Compose in development. It replaces Gunicorn with Django `runserver` and starts the Vite frontend. Both backend and frontend source directories are bind-mounted, so Python changes reload automatically and React changes use Vite Fast Refresh.

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

Edit `.env` and replace the example Django secret and both database passwords.

```bash
openssl rand -base64 48
openssl rand -hex 24
```

Start the development environment and create the core tables:

```bash
./dev up
./dev migrate
./dev admin-create
```

Development interfaces:

```text
React application: http://localhost:5173/
Django admin:      http://localhost:5173/admin/
API docs:          http://localhost:5173/api/v1/docs
OpenAPI JSON:      http://localhost:5173/api/v1/openapi.json
Direct backend:    http://localhost:8000/
```

After the initial start, normal Python, TypeScript, React, CSS, and template edits do not require a container restart.

Restart or rebuild only after changing dependencies, Docker configuration, or environment variables.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml                 Production-style backend services
├── compose.override.yaml        Development backend and Vite frontend
├── dev
├── backend/
│   ├── apps/
│   │   └── core/                Application shell configuration and API
│   ├── config/
│   │   ├── api.py               Main versioned Django Ninja API
│   │   ├── settings.py
│   │   └── urls.py
│   ├── tests/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                 Typed API client and contracts
│   │   ├── app/                 React Router configuration
│   │   ├── layout/              Header, sidebar, and application shell
│   │   ├── pages/               Route-level pages
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
└── .env.example
```

## Core application shell

The `core` Django app owns the shared application shell data:

- `ApplicationConfiguration` stores application and organization labels.
- `NavigationItem` stores ordered, nested, permission-aware navigation entries.
- `GET /api/v1/core/bootstrap` returns configuration, current user information, and permitted navigation.

React owns the complete visible shell. It loads the bootstrap endpoint and renders the header, sidebar, routes, and user information.

Manage the shell data through Django admin:

```text
http://localhost:5173/admin/
```

## API conventions

The API is mounted under `/api/v1/`.

```text
GET /api/v1/health
GET /api/v1/me
GET /api/v1/core/bootstrap
GET /api/v1/docs
GET /api/v1/openapi.json
```

Each domain application should own its router, schemas, and services:

```text
backend/apps/companies/api.py
backend/apps/companies/schemas.py
backend/apps/companies/services.py
```

Keep responsibilities separated:

- `api.py` handles HTTP input, authentication, status codes, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transactions.
- `models.py` owns persistence and database constraints.

## Common commands

```bash
./dev help
./dev up
./dev down
./dev restart backend
./dev status
./dev logs backend
./dev logs frontend
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

## Databases

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

The core database owns normal Django and platform data. The registry database is reserved for ONRC records, CAEN data, company statuses, import metadata, and future enrichment data.

Cross-database foreign keys are not used. Core records should reference registry companies through stable identifiers such as CUI.

Do not migrate Django authentication or administration tables into the registry database.

## Validation

```bash
./dev check
./dev test

docker compose exec frontend npm run typecheck
docker compose exec frontend npm run build
```
