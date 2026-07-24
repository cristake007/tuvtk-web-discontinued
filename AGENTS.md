# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend and Django REST Framework backend. Make changes that are focused, testable, easy to review, and compatible with the root `./dev` harness.

Reuse the existing authentication, CSRF handling, application bootstrap, database-backed navigation, shadcn shell, semantic theme, and validation tooling instead of rebuilding them.

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

Do not create Django authentication, administration, session, or content-type tables in the registry database. Do not create cross-database foreign keys. Reference registry records through stable identifiers such as CUI.

## Repository layout

```text
backend/config/                     Django settings, API URLs, schema, and system views
backend/apps/accounts/              Browser session authentication
backend/apps/core/                  Shell configuration and navigation
backend/apps/<domain>/              Domain models, serializers, services, views, URLs, tests
backend/tests/                      Cross-application integration tests

frontend/scripts/                   Dependency and quality checks
frontend/src/api/                   Shared HTTP transport
frontend/src/app/                   React Router configuration
frontend/src/components/ui/         Generated shadcn primitives
frontend/src/features/auth/         Authentication feature
frontend/src/features/branding/     Branding feature
frontend/src/features/core/         Shared shell API contracts
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

1. Confirm workflow, ownership, permissions, filters, and scale.
2. Define backend models and constraints.
3. Define DRF serializers and explicit OpenAPI contracts.
4. Keep API views thin and move reusable workflows into services.
5. Test authentication, permissions, CSRF, validation, filtering, pagination, and failures.
6. Add typed frontend API functions through the shared HTTP client.
7. Add stable TanStack Query keys in the feature folder.
8. Build focused feature components and a route-level page.
9. Lazy-load only substantial routes or optional heavy capabilities.
10. Add database-backed navigation and verify permission filtering.

## Backend conventions

The public API prefix is `/api/v1/`. Each domain app owns its endpoints.

- `serializers.py`: request and response contracts.
- `views.py`: HTTP handling, authentication, permissions, statuses, response mapping.
- `urls.py`: domain URL declarations.
- `services.py`: workflows, queries, and transaction boundaries.
- `models.py`: persistence and database constraints.
- `tests.py`: success, authentication, permissions, CSRF, validation, and important errors.

Use Django REST Framework and drf-spectacular. Do not reintroduce Django Ninja or create a second API framework.

Use `extend_schema` where automatic schema generation is incomplete. Keep `/api/schema`, `/api/docs`, and `/api/redoc` working and validate them with:

```bash
./dev backend schema
```

Protected endpoints use the configured browser session authentication and return `401` without a valid session. Unsafe browser requests must retain Django CSRF protection.

## Authentication contract

```text
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

## Frontend conventions

- React and TypeScript own user-facing pages.
- Use React Router for routes and TanStack Query for server state.
- `frontend/src/api/http.ts` owns credentials, CSRF, response parsing, and `ApiError`.
- Feature components must not call `fetch` directly.
- Feature API calls, types, query keys, validation, hooks, and components belong to the owning feature folder.
- Route pages should compose features rather than contain all domain logic.
- UI primitives must not depend on features or pages.
- Prefer local state over introducing another global state library.
- Use `@/` aliases for application imports.
- Keep TypeScript strict and do not use `@ts-ignore`.
- Effects in application-owned code must declare explicit dependency arrays.
- Images must include meaningful `alt` text or an explicit empty `alt` when decorative.

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

It relies on shadcn's `SidebarProvider`, `Sidebar`, `SidebarMenuButton`, `collapsible="icon"`, and tooltip behavior. Preserve desktop expanded, desktop collapsed, and mobile drawer behavior. Do not broadly override collapsed dimensions, padding, label state, or tooltip behavior.

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
- Rebuild the relevant image after dependency changes and report installed package changes.

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

`./dev validate` is the complete quality gate and must remain deterministic. It runs Django checks, Ruff, OpenAPI validation, Django tests, frontend dependency synchronization, frontend convention checks, TypeScript validation, frontend unit tests, theme validation, and the Vite build.

Do not run destructive database reset or wipe commands without explicit user authorization.

## Completion report

Keep final implementation reports short:

- changed files or areas;
- validation commands run;
- commands the user must run locally;
- unresolved failures or unverified behavior.

Do not claim complete validation when Docker, browser, database, or runtime checks were not actually run.
