# Route: `/certificari/in-pregatire`

**Page component:** `ModulePlaceholderPage` din `frontend/src/pages/ModulePlaceholderPage.tsx`, titlu „Certificări”.

## React component tree

```text
<AuthenticationGate> → <AppShell>
└── <ApplicationAccessRoute applicationKey="certificari">
    ├── [fără acces] <AccessDenied />
    └── [cu acces] <ModulePlaceholderPage>
        └── <section> → <Card> → <CardHeader>(<CardDescription />, <PageTitle />) + <CardContent>(p)
```

## Diagramă Mermaid

```mermaid
flowchart TD
  S[AppShell] --> G[ApplicationAccessRoute: certificari]
  G --> D[AccessDenied]
  G --> P[ModulePlaceholderPage]
  P --> C[Card: Certificări]
```

## DOM outline estimat

```text
main[data-slot=sidebar-inset] > div > div
└── section.flex.flex-1.items-center.justify-center [ModulePlaceholderPage]
    └── div[data-slot=card].w-full.max-w-2xl
        ├── div[data-slot=card-header] > div[data-slot=card-description] + h1 "Certificări"
        └── div[data-slot=card-content] > p "Modulele pentru Certificări vor fi definite ulterior."
```

## Endpointuri Django/API

- Numai `GET /api/v1/core/bootstrap`; gardianul citește cheia `certificari`.

## Stări, formulare și acțiuni

- Stări comune bootstrap/access denied; placeholderul reprezintă empty.
- Fără hook, formular sau acțiune.

## Probleme structurale

- Card folosit drept wrapper integral; nu apar alte probleme din categoriile cerute.

