# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend, Django REST Framework backend, Celery worker, Celery Beat scheduler, Redis broker, and two PostgreSQL databases. Make focused, testable changes that are easy to review and compatible with the root `./dev` harness.

Reuse the existing authentication, CSRF handling, application bootstrap, database-backed navigation, shadcn shell, semantic theme, shared HTTP client, Celery configuration, and validation tooling instead of rebuilding them.

## Working approach

- Inspect the current branch, working tree, and relevant files before changing code.
- Read only the files required for the task first; avoid broad unrelated repository scans.
- Preserve existing behavior unless the task explicitly changes it.
- Do not redesign unrelated areas while implementing one feature.
- Prefer one clear implementation over parallel abstractions.
- Report changed files, checks run, and anything that could not be verified.
- Do not create temporary application stacks or test deployments unless explicitly requested.

## Git safety

Before pulling, switching, merging, rebasing, or applying a large change:

```bash
git status
git log -1 --oneline
```

- Do not overwrite uncommitted user work.
- Do not force-push or use destructive Git commands unless explicitly requested.
- Do not push, merge, delete branches, or change Git ignore rules unless requested.
- When uncommitted work exists, keep it on the current branch or move it to an explicitly agreed development branch.

## Architecture

- React owns visible pages, routing, login, the global shell, loading states, and feature interaction.
- Django owns authentication, permissions, validation, business rules, data access, administration, and the API.
- Django is reached through the Vite proxy for `/api`, `/admin`, `/media`, and `/static`.
- `db_core` stores Django system tables and operational data.
- `db_registry` stores ONRC registry and reference data.
- Django aliases are `default` for core and `registry` for ONRC data.
- Redis is the private Celery broker and result backend; PostgreSQL remains the source of truth.
- Celery workers execute asynchronous tasks. Celery Beat owns periodic delivery and exactly one Beat instance must run per environment.
- django-filter is the default DRF filtering backend for endpoints that need structured filters.

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not create cross-database foreign keys. Reference registry records through stable identifiers such as CUI.

## Repository layout

```text
backend/config/                     Django settings, API URLs, Celery, schema, system views
backend/apps/authentication/        Browser session authentication
backend/apps/core/                  Shell, navigation, and administration configuration
backend/apps/course_planner/        Course planning, history, and generated files
backend/apps/public_holidays/       Nager.Date, internal holidays, and central calendar
backend/apps/<domain>/              Domain models, serializers, services, views, URLs, tests
backend/tests/                      Cross-application integration tests

frontend/scripts/                   Dependency and quality checks
frontend/src/api/                   Shared HTTP transport
frontend/src/app/                   React Router configuration
frontend/src/components/ui/         Generated shadcn primitives
frontend/src/features/auth/         Authentication feature
frontend/src/features/branding/     Public branding and user-interface visual settings
frontend/src/features/core/         Shared shell API contracts
frontend/src/features/course-planner/ Course planner API, state, and interface
frontend/src/features/integrations/ External service settings and interfaces
frontend/src/features/<domain>/     Domain API, types, queries, hooks, components
frontend/src/layout/                Shared application shell
frontend/src/pages/                 Route-level composition
frontend/src/styles/globals.css     Tailwind imports and semantic theme tokens
```

## Domain module structure

A real module should have one owning Django app and one focused React feature folder.

```text
backend/apps/<domain>/
├── models.py
├── serializers.py
├── services.py
├── tasks.py          optional thin Celery boundary
├── urls.py
├── views.py
└── tests.py

frontend/src/features/<domain>/
├── api.ts
├── types.ts
├── queryKeys.ts
├── hooks/
└── components/

frontend/src/pages/<Domain>Page.tsx
```

Implementation order:

1. Confirm workflow, ownership, permissions, filters, scale, and synchronous/asynchronous boundaries.
2. Define backend models and constraints.
3. Define DRF serializers and explicit OpenAPI contracts.
4. Keep API views and Celery tasks thin; move reusable workflows into services.
5. Test authentication, permissions, CSRF, validation, filtering, concurrency, success paths, and failures.
6. Add typed frontend API functions through the shared HTTP client.
7. Add stable TanStack Query keys in the feature folder.
8. Build focused feature components and a route-level page.
9. Lazy-load only substantial routes or optional heavy capabilities.
10. Add database-backed navigation and verify permission filtering.

## Legacy Planificator migration

`cristake007/planificator` is the functional source for several internal tools. Migrate those workflows one at a time into independent modules.

- Port business rules, file contracts, validation behavior, and required settings.
- Do not copy the legacy Django templates, DaisyUI, Tailwind browser runtime, page CSS, JavaScript shell, navigation, authentication, or deployment structure.
- Rebuild every visible workflow in React using the current shadcn shell and semantic theme.
- Keep exported file structures compatible when a later migrated tool consumes them.
- The current migrated workflow is `Planificator cursuri`; Word matching, XML, WordPress updates, diplomas, and their settings remain separate future stages.

See `docs/planificator-migration.md` for the staged migration scope.

## Public holidays integration

`backend/apps/public_holidays/` owns the central Romanian non-working-day calendar.

- Nager.Date synchronization reads localized `localName` values and stores national `Public` holidays only.
- API dates are exposed as `ZZ.LL.AAAA`; database fields remain real `DateField` values.
- Nager.Date-managed rows and internal company days are separate sources.
- Reconciliation must never modify or remove internal days.
- Other Django applications use `apps.public_holidays.calendar`, not Nager.Date and not the application's own HTTP endpoints.
- Scheduled and manual synchronization must call the same reusable service.
- Celery Beat sends the due-check task daily. The service checks `next_sync_at` before contacting Nager.Date.
- Keep the database-backed synchronization lock and stale-lock recovery intact.
- Network, validation, or transactional failures must preserve previously stored holiday data.

## Backend conventions

The public API prefix is `/api/v1/`. Each domain app owns its endpoints.

- `serializers.py`: request and response contracts.
- `views.py`: HTTP handling, authentication, permissions, statuses, response mapping.
- `urls.py`: domain URL declarations.
- `services.py`: workflows, queries, transaction boundaries, and reusable business logic.
- `models.py`: persistence and database constraints.
- `filters.py`: django-filter definitions when an endpoint needs filtering.
- `tasks.py`: thin Celery entry points only; do not duplicate service logic.
- `tests.py`: success, authentication, permissions, CSRF, validation, concurrency, and important errors.

Use Django REST Framework and drf-spectacular. Do not reintroduce Django Ninja or create a second API framework.

Use `extend_schema` where automatic schema generation is incomplete. Keep `/api/schema`, `/api/docs`, and `/api/redoc` working and validate them with:

```bash
./dev backend schema
```

Protected endpoints use the configured browser session authentication and return `401` without a valid session. Unsafe browser requests must retain Django CSRF protection.

## Celery conventions

- Redis URLs come from `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND`.
- Periodic schedules belong in Django settings until database-managed schedules are explicitly required.
- Run exactly one `celery_beat` service per environment.
- Workers may scale horizontally only when tasks are idempotent or protected by a reliable lock.
- Task names must be stable and explicit.
- Task code must call application services; HTTP views and tasks must not contain parallel business implementations.
- Do not treat Redis results or queues as authoritative business storage.
- After task-source changes, restart `celery_worker` and `celery_beat`; they do not reload Python code automatically.

Diagnostics:

```bash
./dev status
./dev logs celery_worker
./dev logs celery_beat
./dev logs redis
```

## Authentication contract

```text
GET  /api/v1/auth
GET  /api/v1/auth/
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

- Session state always returns `200` with `{authenticated, user}`.
- Invalid credentials return `401`.
- Logout is CSRF-protected, idempotent, and returns `204`.
- Permission checks belong in Django; React is not a security boundary.
- Do not add JWT or another user store without a concrete external-client requirement.

## Administration contract

`Administrare` is the staff-only entry point for system configuration. Do not recreate the former `/settings` frontend routes or API endpoint aliases.

```text
Frontend:
/administrare
/administrare/sistem/interfata-utilizator
/administrare/integrari
/administrare/integrari/zile-libere

API:
GET    /api/v1/core/administration/user-interface
POST   /api/v1/core/administration/user-interface/company-logo
DELETE /api/v1/core/administration/user-interface/company-logo
```

- The administration overview groups: `Sistem`, `Utilizatori`, `Mesagerie`, `Configurare`, `Date`, and `Integrări`.
- `Interfață utilizator` is the extensible page for visual and presentation settings; the company logo is one child setting, not the page identity.
- Administrative API resources use `IsAdminUser` and retain session authentication plus CSRF protection.
- The public read-only logo remains available at `/api/v1/core/company-logo`.

## Frontend language

All user-facing frontend copy must be written in Romanian unless the feature explicitly requires another language.

This applies to:

- navigation labels and database-backed navigation text;
- headings, descriptions, buttons, forms, placeholders, tooltips, alerts, empty states, loading states, and validation messages;
- accessibility labels such as `aria-label` and meaningful image `alt` text.

Keep technical identifiers in English where appropriate: route paths, API fields, TypeScript names, Django fields, database columns, and internal code symbols.

Approved primary navigation labels:

```text
Dashboard
Companii
Documente
Planificator cursuri
Administrare
```

`Integrări` belongs inside the `Administrare` overview. Do not add it back as a sidebar submenu. Do not rename `Dashboard` to `Spațiu de lucru` or `Panou de control` unless explicitly requested.

## Frontend conventions

- React and TypeScript own user-facing pages.
- Use React Router for routes and TanStack Query for server state.
- `frontend/src/api/http.ts` owns credentials, CSRF, response parsing, downloads, and `ApiError`.
- Feature components must not call `fetch` directly.
- Feature API calls, types, query keys, validation, hooks, and components belong to the owning feature folder.
- Route pages should compose features rather than contain all domain logic.
- UI primitives must not depend on features or pages.
- Prefer local state over introducing another global state library.
- Use `@/` aliases for application imports.
- Keep TypeScript strict and do not use `@ts-ignore`.
- Effects in application-owned code must declare explicit dependency arrays.
- Images must include meaningful `alt` text or an explicit empty `alt` when decorative.
- Use Sonner for transient operation feedback.

The shell owns the plain content background and outer gutter. Do not recreate shell backgrounds in route pages and do not use a `Card` solely as a wrapper for an entire route. Cards remain appropriate for real interface sections.

Run:

```bash
./dev frontend lint
./dev frontend typecheck
./dev frontend test
```

## UI system

The frontend uses Tailwind CSS 4 and shadcn Base UI.

Brand tokens:

```css
--primary: #164194;
--brand-red: #d41131;
```

- Prefer semantic Tailwind utilities.
- Do not scatter raw brand hex values across components.
- Keep `--secondary` as a neutral surface token.
- Files under `frontend/src/components/ui/` are generated primitives.
- Prefer application-level composition instead of rewriting generated primitives.
- Do not add a second component library for capabilities shadcn already provides.

### Sidebar

The current sidebar implementation is approved and should not be changed unless the task explicitly targets it.

It relies on shadcn's `SidebarProvider`, `Sidebar`, `SidebarMenuButton`, `collapsible="icon"`, and tooltip behavior. Preserve desktop expanded, desktop collapsed, and mobile drawer behavior. The mobile drawer and portal-based overlays must remain positioned relative to the global header.

## Performance

- Keep the small initial shell and dashboard directly imported.
- Lazy-load substantial pages and heavy optional capabilities such as editors, charts, calendars, and large tables.
- Do not add serial loading gates without a concrete requirement.
- Do not raise bundle warning limits merely to hide warnings.
- Avoid duplicate libraries solving the same problem.

## Dependencies

- Frontend direct dependencies are pinned and `package-lock.json` is committed.
- Do not edit the lockfile manually.
- Do not use `sudo npm`, `--no-package-lock`, or `npm audit fix --force`.
- Do not commit `node_modules` or generated build output.
- Runtime Python dependencies belong in `backend/requirements.txt`.
- Development-only Python tooling belongs in `backend/requirements-dev.txt`.
- Recreate all Python services after dependency changes; a plain restart does not install packages.

## Development harness

Use the root harness instead of ad hoc Docker commands for normal workflows.

```bash
./dev help
./dev backend help
./dev frontend help
./dev test help

./dev backend check
./dev backend lint
./dev backend schema
./dev test backend

./dev frontend lint
./dev frontend typecheck
./dev frontend test
./dev frontend build

./dev validate
```

`./dev validate` is the complete quality gate and must remain deterministic. It runs Django checks, Ruff, OpenAPI validation, Django tests, frontend dependency synchronization, frontend convention checks, TypeScript validation, frontend tests, theme validation, and the Vite build.

Do not run destructive database reset or wipe commands without explicit user authorization.

## Completion report

Keep final implementation reports short:

- changed files or areas;
- validation commands run;
- commands the user must run locally;
- unresolved failures or unverified behavior.

Do not claim complete validation when Docker, browser, database, Celery, network, or runtime checks were not actually run.
