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

Open:

```text
React application: http://localhost:5173/
Django admin:      http://localhost:5173/admin/
API docs:          http://localhost:5173/api/v1/docs
OpenAPI JSON:      http://localhost:5173/api/v1/openapi.json
```

Sign into the React application with the Django account created by `./dev admin-create`.

Normal Python, TypeScript, React, and CSS edits do not require a container restart. Rebuild or recreate containers only after dependency, Docker, or environment changes.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml                 Base backend and database services
├── compose.override.yaml        Development runserver and Vite services
├── dev                          Development command harness
├── backend/
│   ├── apps/
│   │   └── core/                Shell configuration, navigation, and auth API
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
│   │   ├── auth/                Authentication boundary
│   │   ├── layout/              Header, sidebar, and application shell
│   │   ├── pages/               Login and route-level pages
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
└── .env.example
```

## Authentication

React uses Django's built-in user, group, permission, password, session, and CSRF systems.

```text
GET  /api/v1/auth/csrf
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

The browser receives Django's session cookie after login. The frontend API client includes same-origin credentials and sends the CSRF header for state-changing requests. Do not introduce a second user store or JWT authentication without a concrete external-client requirement.

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

Each domain app owns its router, schemas, and services:

```text
backend/apps/companies/api.py
backend/apps/companies/schemas.py
backend/apps/companies/services.py
```

- `api.py` handles HTTP input, authentication, permissions, status codes, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transactions.
- `models.py` owns persistence and database constraints.

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

./dev frontend-install
./dev frontend-typecheck
./dev frontend-build
./dev npm <arguments>

./dev validate
```

`./dev validate` runs Django checks and tests, then TypeScript validation and the Vite production build.

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
