# Route: `/crm/activitati`

**Page component:** `ModulePlaceholderPage` din `frontend/src/pages/ModulePlaceholderPage.tsx`, titlu „Activități”.

## React component tree

```text
<AuthenticationGate> → <AppShell>
└── <ApplicationAccessRoute applicationKey="activitati">
    ├── [fără acces] <AccessDenied />
    └── [cu acces] <ModulePlaceholderPage>
        └── <section> → <Card> → <CardHeader>(<CardDescription />, <PageTitle />) + <CardContent>(p)
```

## Diagramă Mermaid

```mermaid
flowchart TD
  S[AppShell] --> G[ApplicationAccessRoute: activitati]
  G --> D[AccessDenied]
  G --> P[ModulePlaceholderPage]
  P --> C[Card: Activități]
```

## DOM outline estimat

```text
main[data-slot=sidebar-inset] > div > div
└── section.flex.flex-1.items-center.justify-center [ModulePlaceholderPage]
    └── div[data-slot=card].w-full.max-w-2xl
        ├── div[data-slot=card-header] > div[data-slot=card-description] + h1 "Activități"
        └── div[data-slot=card-content] > p "Modulul pentru gestionarea activităților..."
```

## Endpointuri Django/API

- Numai `GET /api/v1/core/bootstrap`; gardianul citește cheia `activitati`.

## Stări, formulare și acțiuni

- Stările comune bootstrap/access denied; placeholderul este starea empty.
- Fără hook, formular sau acțiune.

## Probleme structurale

- Card folosit drept wrapper integral; restul structurii este compact și semantic.

