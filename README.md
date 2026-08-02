# TUVTK Web

Internal operations platform with a React frontend, a Django REST Framework API, asynchronous Celery services, and two independent PostgreSQL databases.

- `db_core` stores Django users, sessions, permissions, application configuration, navigation, generated files, integrations, and operational data.
- `db_registry` is reserved for the large ONRC registry and related reference data.
- Redis is an internal broker and result backend for Celery; it is not published on a host port.

## Stack

### Backend

- Python 3.14
- Django 6
- Django REST Framework
- django-filter
- drf-spectacular for OpenAPI, Swagger UI, and ReDoc
- Django sessions and CSRF protection
- Celery worker and Celery Beat
- Redis broker and result backend
- openpyxl and xlrd for spreadsheet workflows
- PostgreSQL 18
- Gunicorn outside the development override

The API stack is **Django REST Framework only**. Django Ninja is not used. API schemas and interactive documentation are generated with **drf-spectacular**.

### Frontend

- Node.js 24.18.1 LTS
- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7
- TanStack Query 5
- Tailwind CSS 4
- shadcn Base UI components
- Sonner notifications
- Lucide icons

Exact frontend versions are pinned in `frontend/package.json` and locked in `frontend/package-lock.json`.

## Frontend language

All user-facing frontend copy must be written in Romanian unless a specific feature explicitly requires another language.

This includes:

- navigation labels and database-backed navigation text;
- headings, descriptions, buttons, forms, placeholders, validation messages, notifications, empty states, loading states, and tooltips;
- accessibility labels such as `aria-label` and meaningful image `alt` text.

Technical identifiers remain in English where appropriate: route paths, API fields, TypeScript names, Django model fields, database columns, and internal code symbols.

Current primary navigation labels are:

```text
Dashboard
Companii
Documente
Planificator cursuri
Setări
```

`Setări` currently contains the `Integrări` submenu.

## Development architecture

```text
Browser
  └── React/Vite :5173
        ├── /api/*    ──proxy──> Django :8000
        ├── /admin/*  ──proxy──> Django :8000
        ├── /media/*  ──proxy──> Django :8000
        ├── /static/* ──proxy──> Django :8000
        └── application routes rendered by React

Django :8000
  ├── internal Compose service only
  ├── default database  ──> db_core
  └── registry database ──> db_registry

Celery worker ──> Redis ──> background tasks
Celery Beat   ──> Redis ──> scheduled task delivery
```

`compose.yaml` is the neutral production base: it runs the built backend image and keeps PostgreSQL private inside the Compose network. Start it with `docker compose -f compose.yaml up -d`.

`compose.override.yaml` is automatically included by `docker compose up` and adds development mode: Django `runserver`, Vite, OpenSearch, local source bind mounts, locally published database ports, and the host user's UID and GID. Start development with `./dev up` (or `docker compose up -d`). Python source changes require restarting the worker and Beat processes because Celery does not reload task code automatically.

## Production mode

Set the production values described in [Production security](#production-security), then build and start only the base Compose file so the development override is not loaded:

```bash
docker compose -f compose.yaml build
docker compose -f compose.yaml up -d
```

The nginx service publishes HTTP on port 80, serves the compiled React application and the shared static/media volumes, and proxies API and administration requests to Django. Put it behind an external TLS-terminating proxy that forwards `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`. Django runs `collectstatic` before Gunicorn starts. Stop production with `docker compose -f compose.yaml down`.

The optional `onrc-data/` directory is mounted read-only at `/data/onrc` in development for local ONRC data snapshots. It is ignored by Git and must be created manually before importing snapshots.

## Initial setup

Requirements: Linux or WSL, Docker Engine, Docker Compose v2, Git, and Bash.

```bash
git clone git@github.com:cristake007/tuvtk-web.git
cd tuvtk-web
cp .env.example .env
chmod +x dev
```

Replace the example Django secret and database passwords in `.env`, then run:

```bash
./dev up
./dev backend migrate
./dev backend admin-create
```

`./dev up` builds and starts Django, React, both PostgreSQL services, Redis, the Celery worker, and Celery Beat.

Open:

```text
React application: http://localhost:5173/
Django admin:      http://localhost:5173/admin/
Swagger UI:        http://localhost:5173/api/docs
ReDoc:             http://localhost:5173/api/redoc
OpenAPI schema:    http://localhost:5173/api/schema
```

API documentation is restricted to staff users.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml
├── compose.override.yaml
├── dev
├── backend/
│   ├── apps/
│   │   ├── authentication/          Browser session authentication
│   │   ├── core/                    Shell configuration and navigation
│   │   ├── course_planner/          Course planning, history, and generated files
│   │   ├── public_holidays/         Nager.Date, internal holidays, and calendar API
│   │   └── <domain>/                Domain applications
│   ├── config/
│   │   ├── api_urls.py
│   │   ├── api_views.py
│   │   ├── celery.py
│   │   ├── settings.py
│   │   └── urls.py
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── requirements-dev.txt
└── frontend/
    ├── scripts/
    ├── src/
    │   ├── api/                     Shared HTTP transport
    │   ├── app/                     Router configuration
    │   ├── components/              Shared application components
    │   ├── components/ui/           Generated shadcn primitives
    │   ├── features/
    │   │   ├── auth/                Session authentication
    │   │   ├── branding/            Company branding settings
    │   │   ├── core/                Shared shell contracts
    │   │   ├── course-planner/      Course planner feature
    │   │   └── integrations/        External-service settings and interfaces
    │   ├── layout/                  Application shell
    │   ├── pages/                   Route-level composition
    │   └── styles/                  Theme and shared interaction styles
    ├── package.json
    ├── package-lock.json
    └── vite.config.ts
```

## Backend conventions

The public API is mounted under `/api/v1/`. Each domain app owns its HTTP contract.

```text
backend/apps/<domain>/
├── models.py
├── serializers.py
├── services.py
├── tasks.py          optional Celery boundary
├── urls.py
├── views.py
└── tests.py
```

Responsibilities:

- `serializers.py` defines DRF request and response contracts;
- `views.py` handles HTTP input, authentication, permissions, status codes, and response mapping;
- `services.py` contains reusable business workflows and database queries;
- `tasks.py` calls reusable services and must not duplicate business logic;
- `models.py` owns persistence and database constraints;
- `tests.py` verifies authentication, permissions, CSRF, validation, filtering, success paths, and important failures.

Keep API views and Celery tasks thin. Django services remain authoritative for validation, transactions, and business rules. Do not introduce Django Ninja or a second API framework.

### API documentation

The schema and documentation are generated by drf-spectacular:

```bash
./dev backend schema
```

This generates and validates `/tmp/tuvtk-openapi.yaml` inside the backend container.

## Authentication contract

React uses Django users, permissions, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth
GET  /api/v1/auth/
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

- The session endpoint always returns `200` with `{authenticated, user}`.
- Invalid credentials return `401`.
- Logout is CSRF-protected, idempotent, and returns `204`.
- Protected API endpoints return `401` without a valid session.
- Permission checks belong in Django, not in hidden frontend controls.

## Planificator cursuri

Routes:

```text
/planificator-cursuri
/planificator-cursuri/istoric
```

API contract:

```text
GET  /api/v1/course-planner/settings
PUT  /api/v1/course-planner/settings
POST /api/v1/course-planner/generate
POST /api/v1/course-planner/export
GET  /api/v1/course-planner/history
GET  /api/v1/course-planner/history/<id>/files/excel
GET  /api/v1/course-planner/history/<id>/files/word
GET  /api/v1/course-planner/history/<id>/files/xml
```

The module accepts CSV, XLSX, and XLS course lists, calculates periods around weekends and configured holidays, stores planner settings, persists every successful generation, and stores generated artifacts for authenticated download.

Only business logic and file contracts are migrated from `cristake007/planificator`. Its Django templates, DaisyUI shell, page CSS, and browser JavaScript are not reused. See `docs/planificator-migration.md` for the staged migration plan.

## Zile sărbătoare și Nager.Date

The `public_holidays` Django app is the central calendar for Romanian legal holidays and company-specific internal non-working days.

Frontend route:

```text
/settings/integrations
```

API contract:

```text
GET    /api/v1/integrations/public-holidays/holidays?year=2027
GET    /api/v1/integrations/public-holidays/settings
PUT    /api/v1/integrations/public-holidays/settings
POST   /api/v1/integrations/public-holidays/sync
POST   /api/v1/integrations/public-holidays/internal
PATCH  /api/v1/integrations/public-holidays/internal/<id>
DELETE /api/v1/integrations/public-holidays/internal/<id>
```

Behavior:

- Nager.Date v3 supplies `localName`; the stored and exposed primary name is localized for Romania.
- API dates are exposed as `ZZ.LL.AAAA`.
- Synchronization imports national holidays of type `Public` for the current and following year.
- Reconciliation updates and removes only Nager.Date-managed records.
- Internal days are marked `internal` and are never overwritten or removed by Nager.Date synchronization.
- Network or validation failures retain the previously stored holiday calendar.
- Settings support automatic synchronization every one month, six months, or one year.

Other Django applications must read stored data through the backend facade, not by calling Nager.Date or the application's own HTTP API:

```python
from apps.public_holidays.calendar import (
    get_holiday_dates,
    get_holidays,
    is_holiday,
)
```

### Celery scheduling

Celery Beat sends `public_holidays.sync_if_due` every day at `03:15` in the configured `Europe/Bucharest` timezone. The task performs no external request unless:

- the integration is enabled;
- automatic synchronization is enabled;
- `next_sync_at` is empty or has been reached.

Only one Celery Beat instance may run for one environment. Multiple workers are supported because the synchronization service uses a database-backed lock with stale-lock recovery.

Useful commands:

```bash
./dev status
./dev logs celery_worker
./dev logs celery_beat
./dev logs redis
./dev restart celery_worker
./dev restart celery_beat
```

Manual task dispatch for diagnostics:

```bash
./dev backend manage shell -c \
'from apps.public_holidays.tasks import sync_public_holidays_task; print(sync_public_holidays_task.delay().id)'
```

The manual **Preia zilele acum** action calls the same synchronization service synchronously and reports the result directly in the interface. Celery and the HTTP endpoint do not contain separate implementations.

## Frontend conventions

Pages are composition boundaries. Domain logic belongs in focused feature folders.

```text
frontend/src/features/<domain>/
├── api.ts
├── types.ts
├── queryKeys.ts
├── hooks/
└── components/

frontend/src/pages/<Domain>Page.tsx
```

Rules:

- use Romanian for all visible frontend copy;
- use React Router for routes and TanStack Query for server state;
- feature components do not call `fetch` directly; use `frontend/src/api/http.ts`;
- use Sonner for transient success, warning, information, and error messages;
- use the shared `FileUploadField` for application file-upload controls;
- keep route pages focused on composition;
- UI primitives under `components/ui/` must not depend on application features;
- use the `@/` alias for application imports;
- lazy-load substantial pages and optional heavy capabilities, not the small initial shell.

### Application shell

- The header spans the full application width and contains the configured logo.
- The sidebar begins below the header.
- The header remains visible and becomes slightly more compact when the content area is scrolled.
- The shell owns the outer content gutter and plain background.
- Do not reintroduce the diagonal background pattern.
- Do not use a `Card` only as a wrapper for an entire route page.
- Cards remain appropriate for real interface sections such as configuration panels, summaries, previews, and tables.

## UI system

The frontend uses Tailwind CSS 4 and shadcn Base UI.

Brand tokens are defined in `frontend/src/styles/globals.css`:

```css
--primary: #164194;
--brand-red: #d41131;
```

Prefer semantic utilities such as `bg-primary`, `text-primary`, `bg-brand-red`, `text-muted-foreground`, and `border-border`.

Files under `frontend/src/components/ui/` are generated primitives. Compose them from application components instead of rewriting their internal variants without a concrete reason.

## Development commands

```bash
# Environment
./dev up
./dev down
./dev restart [service]
./dev status
./dev logs [service]
./dev build [service]

# Backend
./dev backend app <name>
./dev backend manage <arguments>
./dev backend migrations [app]
./dev backend migrate [arguments]
./dev backend migrate-registry [arguments]
./dev backend migrate-all
./dev backend check
./dev backend lint
./dev backend schema
./dev backend django-shell
./dev backend shell
./dev backend admin-create
./dev backend admin-password [username]

# Frontend
./dev frontend sync
./dev frontend lock
./dev frontend lint
./dev frontend typecheck
./dev frontend test
./dev frontend api-types-check
./dev frontend build
./dev frontend npm <arguments>
./dev frontend shell

# Complete validation
./dev test backend [arguments]
./dev test frontend
./dev validate
```

`./dev validate` runs migration-drift checking, Django checks, Ruff, OpenAPI validation, Django tests, frontend dependency synchronization, OpenAPI-to-TypeScript drift checking, React convention checks, TypeScript validation, frontend tests, theme-token validation, and the Vite build.

## Continuous integration

GitHub Actions runs on pushes and pull requests targeting `dev` and `main`. The backend job checks migration drift, Django, Ruff, the OpenAPI schema, and Django tests against PostgreSQL and Redis. The frontend job installs locked dependencies and runs linting, type checking, tests, and the production build.

The generated `frontend/src/api/generated.ts` OpenAPI synchronization check remains local through `bash dev validate`, because it requires a running backend service.

## Administrare și acces

`Administrare` este punctul de configurare pentru utilizatori, grupuri și integrări, inclusiv `/administrare/integrari`. Accesul este simplu, la nivel de aplicație, construit peste utilizatorii și grupurile Django: grupurile și atribuirea directă pot acorda acces unei aplicații, iar superutilizatorii au acces complet. Nu este descris și nu funcționează ca un sistem CRUD bazat pe `auth.Permission`.

Planificatorul cursuri este disponibil la `/planificator-cursuri`, `/planificator-cursuri/generator` și `/planificator-cursuri/istoric`. Modulele CRM, Dashboard și Documente care nu au încă fluxuri complete sunt marcate ca schelete/placeholder. `db_registry` este infrastructură pregătită pentru date de registru, nu o implementare ONRC finalizată.

Tipurile TypeScript ale API-ului se regenerează cu `./scripts/generate-frontend-api-types.sh`; `./dev frontend api-types-check` verifică driftul fără a modifica fișierul versionat.

## Dependency workflow

Frontend dependencies are managed through the committed lockfile:

```bash
./dev frontend npm install <package> --save-exact
./dev frontend lock
./dev restart frontend
./dev validate
```

Do not use `sudo npm`, `npm audit fix --force`, `--no-package-lock`, or commit `node_modules`.

Backend runtime dependencies belong in `backend/requirements.txt`. Development-only Python tooling belongs in `backend/requirements-dev.txt`. After changing either file, recreate all Python services from the updated image:

```bash
./dev up
```

A plain restart only restarts the existing container and does not install image dependencies. After Python source changes that affect tasks, restart both Celery processes:

```bash
./dev restart celery_worker
./dev restart celery_beat
```

## Database rules

Django aliases:

- `default` connects to `db_core`;
- `registry` connects to `db_registry`.

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not use cross-database foreign keys. Core records should reference registry companies through stable identifiers such as CUI.

Database reset commands are destructive and request explicit confirmation:

```bash
./dev database reset-core
./dev database reset-registry
./dev database reset-all
./dev wipe
```

The Redis volume contains transient broker/result data and is not a source of truth. PostgreSQL remains authoritative for integration settings and holiday records.

## Production security

Production must use HTTPS and configure secure cookies and proxy handling:

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

Production must run:

- one web service;
- one or more Celery workers;
- exactly one Celery Beat scheduler;
- one private Redis service;
- outbound HTTPS access from the worker to `date.nager.at`.

Redis must not be exposed publicly. The Vite development server is not a production server. Production must serve the compiled React application behind the same HTTPS origin that proxies `/api/`, `/admin/`, `/media/`, and `/static/` to Django.
