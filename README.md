# TUVTK Web

Internal operations platform with a React frontend, a Django REST Framework API, and two independent PostgreSQL databases.

- `db_core` stores Django users, sessions, permissions, application configuration, navigation, and operational data.
- `db_registry` is reserved for the large ONRC registry and related reference data.

## Stack

### Backend

- Python 3.14
- Django 6
- Django REST Framework
- django-filter
- drf-spectacular with local Swagger UI and ReDoc assets
- Django sessions and CSRF protection
- Celery, prepared for future background jobs
- openpyxl and xlrd for spreadsheet workflows
- PostgreSQL 18
- Gunicorn outside the development override

### Frontend

- Node.js 24
- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7
- TanStack Query 5
- Tailwind CSS 4
- shadcn Base UI components
- Lucide icons

Exact frontend versions are pinned in `frontend/package.json` and locked in `frontend/package-lock.json`.

## Frontend language

All user-facing frontend copy must be written in Romanian unless a specific feature explicitly requires another language.

This includes:

- navigation labels;
- page titles and descriptions;
- buttons, form labels, placeholders, validation messages, alerts, empty states, loading states, tooltips, and accessibility labels;
- text rendered from database-backed frontend configuration.

Technical identifiers remain in English where appropriate: route paths, API fields, TypeScript names, Django model fields, database columns, and code comments.

Current primary navigation labels are:

```text
Dashboard
Companii
Documente
Planificator cursuri
Setări
```

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
```

`compose.override.yaml` starts Django `runserver` and Vite for development. Backend and frontend source directories are bind-mounted for automatic reload.

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
│   │   ├── course_planner/          Course-period generation and Excel export
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
    │   ├── components/ui/           Generated shadcn primitives
    │   ├── features/
    │   │   ├── auth/                Session authentication
    │   │   ├── branding/            Company branding settings
    │   │   ├── core/                Shared shell contracts
    │   │   └── course-planner/      Course planner feature
    │   ├── layout/                  Application shell
    │   ├── pages/                   Route-level composition
    │   └── styles/globals.css
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
├── urls.py
├── views.py
└── tests.py
```

Responsibilities:

- `serializers.py` defines request and response contracts.
- `views.py` handles HTTP input, authentication, permissions, status codes, and response mapping.
- `services.py` contains reusable business workflows and database queries.
- `models.py` owns persistence and database constraints.
- `tests.py` verifies authentication, permissions, CSRF, validation, filtering, success paths, and important failures.

Keep API views thin. Django remains authoritative for validation, permissions, and business rules.

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

The first workflow migrated from `cristake007/planificator` is available at:

```text
/planificator-cursuri
```

API contract:

```text
GET  /api/v1/course-planner/settings
PUT  /api/v1/course-planner/settings
POST /api/v1/course-planner/generate
POST /api/v1/course-planner/export
```

The module accepts CSV, XLSX, and XLS course lists, calculates periods around weekends and configured holidays, stores planner settings, and exports the legacy-compatible Excel structure required by later Word and XML workflows.

Only business logic and file contracts are migrated from the legacy project. Its Django templates, DaisyUI shell, page CSS, and browser JavaScript are not reused. See `docs/planificator-migration.md` for the staged migration plan.

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

- Use Romanian for all visible frontend copy.
- Use React Router for routes and TanStack Query for server state.
- Feature components do not call `fetch` directly; use `frontend/src/api/http.ts`.
- Keep feature API calls, types, queries, validation, and components in the owning feature folder.
- Keep route pages focused on composition.
- UI primitives under `components/ui/` must not depend on application features.
- Use the `@/` alias for application imports.
- Lazy-load substantial pages and optional heavy capabilities, not the small initial shell.

The shared content background is owned by `AppShell`. Route pages should render their own content surfaces over it rather than recreating the background grid.

## UI system

The frontend uses Tailwind CSS 4 and shadcn Base UI.

Brand tokens are defined in `frontend/src/styles/globals.css`:

```css
--primary: #164194;
--brand-red: #d41131;
```

Prefer semantic utilities such as `bg-primary`, `text-primary`, `bg-brand-red`, `text-muted-foreground`, and `border-border`.

Files under `frontend/src/components/ui/` are generated primitives. Compose them from application components instead of rewriting their internal variants.

The sidebar uses shadcn's native `SidebarProvider`, `Sidebar`, `SidebarMenuButton`, `collapsible="icon"`, and tooltip behavior. Preserve the current sidebar implementation unless a task explicitly requires changing it.

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
./dev frontend build
./dev frontend npm <arguments>
./dev frontend shell

# Complete validation
./dev test backend [arguments]
./dev test frontend
./dev validate
```

`./dev validate` runs Django checks, Ruff, OpenAPI validation, Django tests, frontend dependency synchronization, React convention checks, TypeScript validation, frontend tests, theme-token validation, and the Vite build.

## Dependency workflow

Frontend dependencies are managed through the committed lockfile:

```bash
./dev frontend npm install <package> --save-exact
./dev frontend lock
./dev restart frontend
./dev validate
```

Do not use `sudo npm`, `npm audit fix --force`, `--no-package-lock`, or commit `node_modules`.

Backend runtime dependencies belong in `backend/requirements.txt`. Development-only checks belong in `backend/requirements-dev.txt`. Rebuild the backend image after changing either file:

```bash
./dev build backend
./dev restart backend
```

## Database rules

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not use cross-database foreign keys. Core records should reference registry companies through stable identifiers such as CUI.

Database reset commands are destructive and request explicit confirmation:

```bash
./dev database reset-core
./dev database reset-registry
./dev database reset-all
./dev wipe
```

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

The Vite development server is not a production server. Production must serve the compiled React application behind the same HTTPS origin that proxies `/api/`, `/admin/`, `/media/`, and `/static/` to Django.
