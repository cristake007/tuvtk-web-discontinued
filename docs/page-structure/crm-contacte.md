# Route: `/crm/contacte`

**Page component:** `ModulePlaceholderPage` din `frontend/src/pages/ModulePlaceholderPage.tsx`, titlu „Contacte”.

## React component tree

```text
<AuthenticationGate> → <AppShell>
└── <ApplicationAccessRoute applicationKey="contacte">
    ├── [fără acces] <AccessDenied />
    └── [cu acces] <ModulePlaceholderPage>
        └── <section> → <Card> → <CardHeader>(<CardDescription />, <PageTitle />) + <CardContent>(p)
```

## Diagramă Mermaid

```mermaid
flowchart TD
  S[AppShell] --> G[ApplicationAccessRoute: contacte]
  G --> D[AccessDenied]
  G --> P[ModulePlaceholderPage]
  P --> C[Card: Contacte]
```

## DOM outline estimat

```text
main[data-slot=sidebar-inset] > div > div
└── section.flex.flex-1.items-center.justify-center [ModulePlaceholderPage]
    └── div[data-slot=card].w-full.max-w-2xl
        ├── div[data-slot=card-header] > div[data-slot=card-description] + h1 "Contacte"
        └── div[data-slot=card-content] > p "Modulul pentru gestionarea contactelor..."
```

## Endpointuri Django/API

- Numai `GET /api/v1/core/bootstrap`; gardianul citește cheia `contacte` din răspuns.

## Stări, formulare și acțiuni

- Stările comune bootstrap/access denied; placeholderul este starea empty.
- Fără hook de pagină, formular sau acțiune.

## Probleme structurale

- Card folosit drept wrapper al întregii rute; altfel un singur `h1`, semantică suficientă și fără interactive imbricate.

