# Route: `/training/in-pregatire`

**Page component:** `ModulePlaceholderPage` din `frontend/src/pages/ModulePlaceholderPage.tsx`, titlu „Training”.

## React component tree

```text
<AuthenticationGate> → <AppShell>
└── <ApplicationAccessRoute applicationKey="training">
    ├── [fără acces] <AccessDenied />
    └── [cu acces] <ModulePlaceholderPage>
        └── <section> → <Card> → <CardHeader>(<CardDescription />, <PageTitle />) + <CardContent>(p)
```

## Diagramă Mermaid

```mermaid
flowchart TD
  S[AppShell] --> G[ApplicationAccessRoute: training]
  G --> D[AccessDenied]
  G --> P[ModulePlaceholderPage]
  P --> C[Card: Training]
```

## DOM outline estimat

```text
main[data-slot=sidebar-inset] > div > div
└── section.flex.flex-1.items-center.justify-center [ModulePlaceholderPage]
    └── div[data-slot=card].w-full.max-w-2xl
        ├── div[data-slot=card-header] > div[data-slot=card-description] + h1 "Training"
        └── div[data-slot=card-content] > p "Modulele pentru Training vor fi definite ulterior."
```

## Endpointuri Django/API

- Numai `GET /api/v1/core/bootstrap`; gardianul citește cheia `training`.

## Stări, formulare și acțiuni

- Stări comune bootstrap/access denied; placeholder vizibil pentru empty.
- Fără hook, formular sau acțiune proprie.

## Probleme structurale

- Cardul învelește întreaga rută; nu sunt alte probleme structurale evidente.

