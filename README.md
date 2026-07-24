# TUVTK Web

Dockerized internal operations platform with a React frontend, a Django API, and two independent PostgreSQL 18 databases.

- `db_core` — users, sessions, permissions, application configuration, navigation, and operational data.
- `db_registry` — the large ONRC company registry and related reference data.

The application foundation currently includes Django session authentication, CSRF protection, a React application shell, database-backed navigation, a responsive shadcn sidebar, semantic TUV branding, route-level lazy loading, and production bundle splitting.

## Stack

### Backend

- Python 3.14
- Django 6
- Django Ninja
- Django sessions and CSRF protection
- Gunicorn outside the development override
- PostgreSQL 18

### Frontend

- Node.js 24
- React 19
- TypeScript 6
- Vite 8
- React Router 7
- TanStack Query 5
- Tailwind CSS 4
- shadcn `base-nova` components built on Base UI
- Lucide icons

Exact frontend versions are pinned in `frontend/package.json` and locked in `frontend/package-lock.json`.

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

The Django container is not published on a host port. Use the React address for the application, Django admin, API documentation, and API requests.

`compose.override.yaml` is the only development override. It replaces Gunicorn with Django `runserver` and starts Vite. Both source trees are bind-mounted for automatic reload.

The frontend container runs as the current host UID/GID. It does not run as root and does not use a permission-initializer service.

## Initial setup

Requirements:

- Linux or WSL
- Docker Engine
- Docker Compose v2
- Git
- Bash

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

Start and initialize the application:

```bash
./dev up
./dev migrate
./dev admin-create
```

The first frontend start generates `frontend/package-lock.json` only when it is missing. The committed lockfile is then used with `npm ci`.

Open:

```text
React application: http://localhost:5173/
Django admin:      http://localhost:5173/admin/
API docs:          http://localhost:5173/api/v1/docs
OpenAPI JSON:      http://localhost:5173/api/v1/openapi.json
```

Sign in with the Django account created by `./dev admin-create`.

Normal Python, TypeScript, React, and CSS edits do not require a restart. Restart the frontend after changing dependencies or when Vite retains a stale module graph after a branch switch or merge.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml
├── compose.override.yaml
├── dev
├── backend/
│   ├── apps/
│   │   ├── accounts/            Session authentication API
│   │   ├── core/                Shell configuration and navigation
│   │   └── <domain>/            Domain models, API, services, and tests
│   ├── config/                  Django settings, URLs, and API entrypoint
│   ├── tests/                   Cross-application integration tests
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── components.json          shadcn Base UI configuration
│   ├── scripts/                 Dependency checks and Vite startup
│   ├── src/
│   │   ├── api/                 Shared HTTP transport and common API types
│   │   ├── app/                 React Router configuration
│   │   ├── components/
│   │   │   ├── ui/              Generated shadcn primitives
│   │   │   └── ApplicationState.tsx
│   │   ├── features/
│   │   │   ├── auth/            Authentication API, query keys, and gate
│   │   │   └── <domain>/        Domain API, queries, components, and state
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── app-shell/       Header, sidebar, navigation, and user menu
│   │   ├── lib/                 Shared frontend utilities
│   │   ├── pages/               Route-level page composition
│   │   └── styles/globals.css   Tailwind imports and semantic theme tokens
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
└── .env.example
```

## UI system

The frontend uses Tailwind CSS 4 and shadcn's Base UI implementation with the `base-nova` style. `frontend/components.json` points shadcn to `src/styles/globals.css` and the `@/components/ui` alias.

### Theme tokens

All application colors are semantic CSS variables in `frontend/src/styles/globals.css`.

Important brand values:

```css
--primary: #164194;
--brand-red: #d41131;
```

`--secondary` remains a neutral surface token. The red brand color must not be assigned globally to `--secondary`, because shadcn uses the secondary token for badges, buttons, panels, and other subdued surfaces.

Use semantic Tailwind utilities such as:

```text
bg-primary
text-primary
bg-brand-red
text-brand-red
bg-secondary
text-muted-foreground
border-border
```

Do not scatter raw brand hex values through components unless a concrete integration cannot use the semantic tokens.

### shadcn component rules

Files under `frontend/src/components/ui/` are generated primitives. Prefer composing and styling them from application components instead of rewriting their internal variants.

A generated primitive may be changed only when the capability is genuinely missing or an app-wide primitive defect must be fixed. Such changes must remain small and compatible with future shadcn updates.

The sidebar relies on shadcn's native `SidebarProvider`, `Sidebar`, `SidebarMenuButton`, `collapsible="icon"`, and built-in tooltip behavior. Do not override collapsed button dimensions, padding, label visibility, or tooltip state with broad `!important` rules.

Tailwind utility classes appearing in rendered HTML are expected. Source readability should be improved through focused React components, constants, variants, and `cn()` composition rather than introducing a parallel custom CSS naming system.

## Authentication contract

React uses Django's built-in users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

`GET /api/v1/auth/session` always returns HTTP `200`. Anonymous state is normal:

```json
{
  "authenticated": false,
  "user": null
}
```

Invalid login credentials return `401`. Logout is CSRF-protected, idempotent, and returns `204`. Protected business endpoints return `401` without a valid session.

Do not add JWT, a second user table, or frontend-only authorization without a concrete external-client requirement.

## Core application shell

The `core` Django app owns shared shell data:

- `ApplicationConfiguration` stores application and organization labels.
- `NavigationItem` stores ordered, nested, permission-aware navigation entries.
- `GET /api/v1/core/bootstrap` returns the authenticated user's configuration and permitted navigation.

React owns the visible login page, header, sidebar, routing, user menu, loading states, and feature pages. Django does not render the root application page.

The shell composition is:

```text
AuthenticationGate
└── AppShell
    └── TooltipProvider
        └── SidebarProvider
            ├── AppSidebar
            └── SidebarInset
                ├── AppHeader
                └── Outlet
```

The login page and authenticated shell are lazy-loaded after session resolution. The dashboard is also loaded as a separate route chunk.

## Building a domain module

Each real application module should have one owning Django app and one focused React feature folder.

Example:

```text
backend/apps/companies/
├── api.py
├── schemas.py
├── services.py
├── models.py
└── tests.py

frontend/src/features/companies/
├── api.ts
├── queryKeys.ts
├── types.ts
├── components/
└── hooks/

frontend/src/pages/CompaniesPage.tsx
```

Recommended sequence:

1. Define the backend data model and permissions.
2. Add thin Django Ninja endpoints and explicit schemas.
3. Test authentication, permission, filtering, pagination, validation, and errors.
4. Add typed frontend API functions using `frontend/src/api/http.ts`.
5. Define stable TanStack Query keys in the feature folder.
6. Build focused feature components and a route-level page.
7. Lazy-load substantial route modules.
8. Add the database-backed navigation item and verify permission filtering.

React controls presentation and interaction. Django remains authoritative for permissions, validation, business rules, and persisted data.

## API conventions

The API is mounted under `/api/v1/`. Each Django domain app owns its router, schemas, services, models, and tests:

```text
backend/apps/<domain>/api.py
backend/apps/<domain>/schemas.py
backend/apps/<domain>/services.py
backend/apps/<domain>/models.py
backend/apps/<domain>/tests.py
```

- `api.py` handles HTTP input, authentication, permissions, statuses, and response mapping.
- `schemas.py` defines request and response contracts.
- `services.py` contains business workflows and transaction boundaries.
- `models.py` owns persistence and database constraints.
- `tests.py` verifies success, authentication, permissions, CSRF, validation, and important errors.

Keep endpoint functions thin. Do not place substantial ORM queries or workflows directly in routes.

Frontend components do not call `fetch` directly:

- `frontend/src/api/http.ts` owns credentials, CSRF, empty-body handling, JSON parsing, and `ApiError` behavior.
- Feature modules own their API calls and TanStack Query keys.
- Django response schemas are the source of truth for frontend types and behavior.

## Frontend dependency workflow

`frontend/node_modules` is stored in the bind-mounted frontend directory and ignored by Git. This allows Remote SSH and local editors to resolve TypeScript, React, and Vite definitions while Docker remains the runtime environment.

`frontend/package-lock.json` is required and committed. Startup behavior is deterministic:

1. A missing lockfile is generated once with `npm install`.
2. Missing or stale dependencies are synchronized with `npm ci`.
3. Matching dependencies are reused without reinstalling.

After changing dependencies:

```bash
./dev npm install <package> --save-exact
./dev frontend-lock
./dev restart frontend
./dev validate
git add frontend/package.json frontend/package-lock.json
```

Do not use `sudo npm`, `npm audit fix --force`, `--no-package-lock`, or commit `node_modules`.

## Build output and code splitting

Development validation must not write generated bundles into the bind-mounted source tree. The development Compose service sets:

```text
VITE_BUILD_OUT_DIR=/tmp/tuvtk-frontend-dist
```

Therefore `./dev frontend-build` and `./dev validate` write their temporary bundle inside the container. A production build without this environment variable uses Vite's conventional `frontend/dist` output.

`vite.config.ts` separates React, React Router, TanStack Query, Base UI, Lucide, and remaining vendor modules into stable chunks. Large pages and optional capabilities should also use dynamic imports.

Do not silence an oversized-chunk warning by raising `chunkSizeWarningLimit` before identifying the responsible dependency. Prefer route-level lazy loading and intentional code splitting.

## Git workflow

Start new work from an up-to-date `main` branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/<short-name>
```

Before pulling, switching, merging, or rebasing:

```bash
git status
git log -1 --oneline
```

Do not overwrite uncommitted work. Commit or stash it first.

After a feature is merged:

```bash
git switch main
git pull --ff-only origin main
```

Keep the feature branch until `main` runs successfully and relevant validation passes.

## Development commands

```bash
./dev help
./dev up
./dev down
./dev restart [service]
./dev status
./dev logs backend
./dev logs frontend
./dev backend-shell
./dev frontend-shell

./dev check
./dev test
./dev migrations [app]
./dev migrate
./dev shell

./dev frontend-sync
./dev frontend-lock
./dev frontend-typecheck
./dev frontend-build
./dev npm <arguments>

./dev validate
```

`./dev validate` runs Django checks and tests, synchronizes frontend dependencies, runs theme-token validation, runs TypeScript validation, and creates a temporary Vite production bundle inside the container.

Database reset commands are destructive and request explicit confirmation:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Troubleshooting

### Vite reports that an existing import cannot be resolved

After a merge or branch switch, Vite may retain an outdated module graph even though the file exists on the host.

Confirm the file and branch first:

```bash
git status
git rev-parse --short HEAD
ls -l frontend/src/components/ApplicationState.tsx
```

Then clear only Vite's cache and restart the frontend:

```bash
rm -rf frontend/node_modules/.vite
./dev restart frontend
```

If the host file exists but the container still does not see it, recreate the development containers without deleting volumes:

```bash
./dev down
./dev up
```

### `./dev` reports an unknown command

Check that the working tree is on the expected branch and that the local `dev` script matches `origin/main`:

```bash
git status
git log -1 --oneline
git diff origin/main -- dev
./dev help
```

Do not assume a command exists on an older branch.

## Security settings

Development defaults use HTTP-compatible cookies. Production must use HTTPS and set at least:

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

Only trust `X-Forwarded-Proto` when the trusted reverse proxy removes client-supplied forwarding headers and sets it itself.

The Vite development server is not a production server. Production must serve the compiled React output behind the same HTTPS origin that proxies `/api/`, `/admin/`, `/media/`, and `/static/` to Django.

## Databases

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not use cross-database foreign keys. Core records should reference registry companies through stable identifiers such as CUI.
