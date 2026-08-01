# Route: `/`

**Page component:** `Navigate` declarat direct în `frontend/src/app/router.tsx` (nu există un fișier de pagină).

Ruta index este copilul lui `AuthenticationGate`. După bootstrap, dacă utilizatorul este autentificat, redirecționează cu `replace` la `/tablou-de-bord`; dacă nu este autentificat, `AuthenticationGate` afișează mai întâi `LoginPage`, indiferent de destinația din outlet.

## React component tree

```text
<AuthenticationGate> — frontend/src/app/AuthenticationGate.tsx
├── [neautentificat] <DeferredView><LoginPage /></DeferredView>
└── [autentificat] <AuthenticatedBootstrapProvider>
    └── <AppShell> — frontend/src/layout/AppShell.tsx
        ├── <AppHeader />
        ├── <AppSidebar />
        └── <SidebarInset>
            └── <Outlet>
                └── <Navigate replace to="/tablou-de-bord" /> — frontend/src/app/router.tsx
```

Arborele complet al shell-ului și ramura login sunt în [_runtime-comun.md](./_runtime-comun.md).

## Diagramă Mermaid

```mermaid
flowchart TD
  A[AuthenticationGate] -->|autentificat| S[AppShell]
  A -->|neautentificat| L[LoginPage]
  S --> O[Outlet]
  O --> N[Navigate replace]
  N --> D[/tablou-de-bord]
```

## DOM outline estimat

```text
[Navigate nu produce element DOM]
location.replace în istoricul React Router → /tablou-de-bord
```

Înainte de redirect pot exista DOM-ul de bootstrap/error/login descrise în runtime-ul comun.

## Endpointuri Django/API

- `GET /api/v1/core/bootstrap` — `AuthenticationGate`, hook `useQuery`.
- Niciun endpoint specific redirectului.

## Stări, formulare și acțiuni

- loading/error/login sunt stările comune ale bootstrapului;
- nu are stare empty, formular sau acțiune proprie;
- singura acțiune este redirectul declarativ cu înlocuirea intrării de istoric.

## Probleme structurale

- Nicio problemă de DOM: componenta terminală nu produce DOM.
- Destinația `/` din linkul brandului implică un hop suplimentar prin acest redirect; este comportament, nu defect structural.

