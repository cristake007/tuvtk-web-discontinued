# AGENTS.md

## Purpose

This repository contains a Dockerized React frontend and Django backend with a versioned Django Ninja API. Make changes that are small, explicit, testable, easy to review, and compatible with the root `./dev` harness.

The current foundation already provides authentication, CSRF handling, application bootstrap data, database-backed navigation, a responsive shadcn application shell, semantic theme tokens, route-level lazy loading, and vendor chunk splitting. Reuse this foundation instead of rebuilding it.

## Working approach

- Inspect the current branch, working tree, and relevant files before changing code.
- Read only the files needed for the task first. Do not begin with a broad repository scan.
- Prefer one focused implementation over multiple parallel abstractions.
- Reuse existing Django, Django Ninja, React Router, TanStack Query, Tailwind, shadcn, and PostgreSQL capabilities before adding dependencies.
- Preserve existing behavior unless the task explicitly changes it.
- Do not silently redesign unrelated areas while implementing one feature.
- Keep generated code, application composition, domain logic, and infrastructure clearly separated.
- Report what changed, which checks ran, and anything that could not be verified.

## Git and local safety

Before pulling, switching, merging, rebasing, or applying a large change:

```bash
git status
git log -1 --oneline
```

Rules:

- Do not overwrite uncommitted user changes.
- Do not force-push or use destructive Git commands unless explicitly requested.
- Do not assume the user is on the branch mentioned in an earlier message.
- Use a feature branch for new modules unless the user explicitly requests a direct `main` update.
- Do not push, merge, or delete a branch unless the user asks for that Git operation.
- After a merge, verify that the expected files exist locally before diagnosing an application error as a missing commit.

## Architecture

- `compose.yaml` defines Django and two independent PostgreSQL 18 services.
- `compose.override.yaml` is the only development override; it starts Django `runserver` and Vite.
- `backend/` and `frontend/` are bind-mounted for development reload.
- The frontend container runs as the current host UID/GID.
- React owns visible pages, routing, login, header, sidebar, loading states, and feature interaction.
- Django owns authentication, permissions, validation, data access, business logic, administration, and the API.
- Django is internal on port 8000 and is reached through Vite proxies for `/api`, `/admin`, `/media`, and `/static`.
- `db_core` stores Django system tables and operational data.
- `db_registry` stores ONRC registry and reference data.
- Django aliases are `default` for core and `registry` for ONRC data.

Do not create Django auth, admin, session, or content-type tables in the registry database. Do not create cross-database foreign keys. Reference registry companies through stable identifiers such as CUI.

## Repository layout

```text
backend/config/                     Django configuration and API entrypoint
backend/apps/accounts/              Browser session authentication API
backend/apps/core/                  Shell configuration and navigation
backend/apps/<domain>/              Domain models, API, services, and tests
backend/tests/                      Cross-application integration tests

frontend/components.json            shadcn Base UI configuration
frontend/scripts/                   Dependency synchronization and Vite startup
frontend/src/api/                   Shared HTTP transport and common API types
frontend/src/app/                   React Router configuration
frontend/src/components/ui/         Generated shadcn primitives
frontend/src/features/auth/         Authentication API, query keys, and gate
frontend/src/features/<domain>/     Domain API, queries, hooks, and components
frontend/src/layout/                Shared application shell
frontend/src/pages/                 Route-level page composition
frontend/src/styles/globals.css     Tailwind imports and semantic theme tokens
```

Create Django apps with:

```bash
./dev app <name>
```

Apps belong under `backend/apps/<name>/`, use `apps.<name>`, and must be registered with their complete `AppConfig` path.

## Domain module structure

A real application module should have one owning Django app and one focused React feature folder.

```text
backend/apps/<domain>/
├── api.py
├── schemas.py
├── services.py
├── models.py
└── tests.py

frontend/src/features/<domain>/
├── api.ts
├── queryKeys.ts
├── types.ts
├── components/
└── hooks/

frontend/src/pages/<Domain>Page.tsx
```

Implementation order:

1. Confirm the user workflow, data ownership, permissions, filters, and expected scale.
2. Define backend models and database constraints.
3. Add explicit Django Ninja request and response schemas.
4. Keep endpoints thin and move workflows into services.
5. Test authentication, permissions, filtering, pagination, validation, and important failures.
6. Add typed frontend API functions through the shared HTTP transport.
7. Add stable TanStack Query keys in the feature folder.
8. Build focused feature components and a route-level page.
9. Lazy-load substantial routes or optional capabilities.
10. Add navigation through the database-backed shell and verify permission filtering.

Do not build a second platform inside one feature. Extend the existing shell, API conventions, and shared components.

## Authentication

Use Django users, groups, permissions, password hashing, server-side sessions, and CSRF protection.

```text
GET  /api/v1/auth/csrf
GET  /api/v1/auth/session
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

Rules:

- `GET /auth/session` always returns `200` with `{authenticated, user}`.
- Invalid login credentials return `401`.
- Logout is CSRF-protected, idempotent, and returns `204`.
- Protected business routes use Django session authentication and return `401` without a valid session.
- Unsafe requests include Django's CSRF header.
- Permission checks belong in Django; React is not the security boundary.
- Do not add JWT or another user store without a concrete external-client requirement.
- Do not duplicate session or CSRF handling in feature components.

Authentication belongs to `backend/apps/accounts/`. Shell configuration and navigation belong to `backend/apps/core/`.

## Backend conventions

The public API prefix is `/api/v1/`. Domain endpoints belong to the owning app:

```text
backend/apps/<domain>/api.py
backend/apps/<domain>/schemas.py
backend/apps/<domain>/services.py
backend/apps/<domain>/models.py
backend/apps/<domain>/tests.py
```

Responsibilities:

- `api.py`: HTTP input, authentication, permissions, statuses, and response mapping.
- `schemas.py`: Django Ninja input and output contracts.
- `services.py`: business workflows and transaction boundaries.
- `models.py`: persistence and database constraints.
- `tests.py`: success, authentication, permissions, CSRF, validation, pagination, filtering, and important error behavior.

Keep route functions thin. Do not place substantial ORM queries or workflows directly in endpoints.

Use Django permissions and database constraints for persistent rules. Do not rely on hidden frontend controls as authorization.

Registry queries must use the `registry` database alias or an approved database router. Do not expose registry writes until the import and ownership strategy explicitly supports them.

## Frontend conventions

- React and TypeScript own all user-facing pages.
- Use React Router for routes and TanStack Query for server state.
- `frontend/src/api/http.ts` owns credentials, CSRF, empty-body handling, JSON parsing, and `ApiError` behavior.
- Feature components must not call `fetch` directly.
- Feature API calls, types, query keys, and hooks belong to the owning feature folder.
- Keep route pages focused on composition rather than embedding all domain logic.
- Treat Django responses and permissions as authoritative.
- Prefer focused components over one large page component.
- Prefer local feature state over new global state libraries.
- Do not introduce another frontend framework.
- Use `@/` aliases for application imports.

When a page is substantial, load it with `lazy()` or a React Router lazy route. Use a meaningful loading fallback through `ApplicationState` or a feature-specific skeleton.

## UI system

The frontend uses Tailwind CSS 4 and shadcn Base UI with the `base-nova` style.

### Theme

The semantic theme is defined in `frontend/src/styles/globals.css`.

Brand tokens:

```css
--primary: #164194;
--brand-red: #d41131;
```

Rules:

- Keep `--secondary` as a neutral surface token.
- Use `--brand-red` for red brand accents, active states, destructive emphasis where appropriate, and intentional visual highlights.
- Prefer semantic utilities such as `bg-primary`, `text-primary`, `bg-brand-red`, `text-brand-red`, `bg-secondary`, `text-muted-foreground`, and `border-border`.
- Do not scatter raw brand hex values across components.
- Add new semantic tokens in `globals.css` when a repeated application meaning genuinely exists.
- Run `theme:check` through the normal build or validation workflow.

### shadcn primitives

Files under `frontend/src/components/ui/` are generated primitives.

- Prefer application-level composition and `className` overrides from feature or layout components.
- Do not rewrite generated variants merely to change one screen.
- Change a generated primitive only when the primitive lacks a required capability or has an app-wide defect.
- Keep primitive changes small, generic, and compatible with future shadcn updates.
- Do not add a second component library for a capability shadcn already provides.

Tailwind utility classes in rendered HTML are expected. Improve source readability by extracting focused components, constants, `cva` variants, and `cn()` expressions. Do not create a parallel CSS naming system only to hide utility classes.

### Sidebar rules

The shell uses shadcn's official Base UI sidebar behavior:

- `SidebarProvider`
- `Sidebar`
- `SidebarMenuButton`
- `collapsible="icon"`
- the built-in `tooltip` prop

Preserve those responsibilities.

- Do not override collapsed button size and padding with broad `!important` utilities.
- Do not leave menu labels visible in icon mode.
- Let `SidebarMenuButton` decide when collapsed tooltips are shown.
- Keep tooltip popup and arrow colors consistent.
- Apply expanded-only rail and text-shift effects without affecting collapsed centering.
- Verify expanded desktop, collapsed desktop, and mobile drawer states separately.
- Do not modify the generated sidebar primitive for a shell-only visual preference.

## Application shell

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

Preserve:

- Django bootstrap data and permission-filtered navigation.
- Authentication state and logout invalidation.
- Mobile sidebar behavior.
- Route content through `Outlet`.
- Shared loading and failure states.

Do not move domain-specific controls into the global header or sidebar unless they are genuinely shared across modules.

## Performance and code splitting

`frontend/vite.config.ts` separates React, React Router, TanStack Query, Base UI, Lucide, and remaining vendor modules into stable chunks.

Rules:

- Lazy-load substantial route pages and optional heavy capabilities.
- Do not eagerly import charts, editors, calendars, document tools, or large tables into the root shell unless immediately required.
- When Vite reports an oversized chunk, inspect the generated asset list and identify the dependency.
- Do not raise `chunkSizeWarningLimit` merely to silence the warning.
- Prefer dynamic imports and intentional chunk groups.
- Avoid duplicate dependencies that solve the same problem.

## Frontend dependencies and generated files

- `frontend/package-lock.json` is required and committed.
- Direct dependencies are pinned to exact versions.
- Do not use `--no-package-lock` or edit the lockfile manually.
- Do not commit `frontend/node_modules/` or build output.
- Startup generates the initial lockfile only when missing, then uses `npm ci` whenever the installed dependency hash differs.
- The frontend container runs as the host UID/GID.
- Do not run `sudo npm`, use a root-running frontend container, or create root-owned files in `frontend/`.
- Do not run `npm audit fix --force`.
- Development validation sets `VITE_BUILD_OUT_DIR=/tmp/tuvtk-frontend-dist`; it must not write or clean `frontend/dist`.
- A production build without the development override uses `frontend/dist`.

Dependency workflow:

```bash
./dev npm install <package> --save-exact
./dev frontend-lock
./dev restart frontend
./dev validate
git add frontend/package.json frontend/package-lock.json
```

## Development commands

Prefer the root harness:

```bash
./dev help
./dev up
./dev down
./dev restart [service]
./dev status
./dev logs backend
./dev logs frontend

./dev check
./dev test
./dev migrations [app]
./dev migrate

./dev frontend-sync
./dev frontend-lock
./dev frontend-typecheck
./dev frontend-build
./dev validate
```

Useful passthrough commands:

```bash
./dev backend-shell
./dev frontend-shell
./dev django <arguments>
./dev npm <arguments>
```

Normal source edits reload automatically. Restart the frontend after dependency or lockfile changes.

Use direct Docker Compose commands only for diagnosis or harness work. Do not bypass the harness in normal implementation instructions.

Never run `migrate-registry` or `migrate-all` until a registry-specific app and database router explicitly control registry migrations.

Destructive commands require the user's explicit request:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

## Troubleshooting

### Stale Vite module graph

After a merge or branch switch, Vite may report that an import cannot be resolved even though the file exists.

Confirm the branch and host file first:

```bash
git status
git rev-parse --short HEAD
ls -l <expected-file>
```

Then clear only Vite's cache and restart:

```bash
rm -rf frontend/node_modules/.vite
./dev restart frontend
```

If the host file exists but the container still cannot see it, recreate the development containers without deleting volumes:

```bash
./dev down
./dev up
```

Do not delete the lockfile, reinstall everything, reset the repository, or remove database volumes for a stale Vite cache problem.

### Unknown `./dev` command

Do not assume the command exists on every historical branch. Check:

```bash
git status
git log -1 --oneline
git diff origin/main -- dev
./dev help
```

### Base UI runtime context errors

TypeScript and production builds can pass while a Base UI component fails at runtime because of an invalid component hierarchy.

Inspect the generated wrapper and ensure required parent components exist. For example, labels that require a group must remain inside the matching group component.

Do not work around a context error by suppressing it or replacing the entire component library.

## Production and security

- Production uses one HTTPS origin for React, `/api/`, `/admin/`, `/media/`, and `/static/`.
- Vite's development server is never a production server.
- Production frontend images and CI install from the committed lockfile with `npm ci`.
- Enable secure session and CSRF cookies, HTTPS redirection, and HSTS only after HTTPS is verified.
- Trust `X-Forwarded-Proto` only when the trusted proxy strips client-supplied forwarding headers and sets it itself.
- Keep `SESSION_COOKIE_HTTPONLY` enabled.
- Keep the CSRF cookie readable by the SPA so it can send `X-CSRFToken`.
- Do not weaken CSRF protection to work around frontend defects.

## Validation

Run the smallest checks that cover the change.

Frontend-only source changes:

```bash
./dev frontend-typecheck
./dev frontend-build
```

Backend-only changes:

```bash
./dev check
./dev test
```

Cross-stack, dependency, shell, or shared infrastructure changes:

```bash
./dev validate
```

Model changes:

```bash
./dev migrations <app>
./dev migrate
./dev test
```

API changes must also verify `/api/v1/openapi.json` through the frontend proxy and include tests for authentication, permissions, validation, and response contracts.

Documentation-only changes do not require container validation, but commands and paths must be checked against the current repository before committing.
