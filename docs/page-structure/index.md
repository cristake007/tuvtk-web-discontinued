# Structura paginilor React

## Domeniul analizei

Raportul pornește din configurația reală `appRoutes` din `frontend/src/app/router.tsx`, nu din inventarul directorului `pages`. Starea analizată este working tree-ul din 2026-08-01; modificările locale preexistente din frontend au fost citite, dar nu au fost modificate.

Sunt documentate toate cele 27 de intrări terminale din router: redirectul index, 25 de rute concrete și ruta catch-all. `LoginPage` este o ramură condiționată a `AuthenticationGate` pentru orice URL, nu o rută separată; structura sa este inclusă în [runtime-ul comun](./_runtime-comun.md).

Convenții folosite în arbori:

- `[condiție]` marchează o ramură randată condiționat;
- `× N`, `× date` sau `× listă` marchează componente/elemente generate cu `map`;
- `→ portal` marchează conținut montat în afara subarborelui local de un primitive Base UI;
- tagurile primitive shadcn sunt desfăcute până la tagul DOM relevant (`Card → div`, `PageTitle → h1`, `Table → div > table`);
- iconurile Lucide sunt componente React care produc `svg`; ele sunt grupate acolo unde repetarea nu schimbă structura.

Calea componentei principale este scrisă în fiecare raport, iar componentele tranzitive specifice sunt anotate în arbore sau în textul imediat adiacent. Pentru rezolvarea exhaustivă a oricărui nume repetat (layout, gardian, feature, primitive UI sau bibliotecă externă), vezi [catalogul surselor componentelor](./_catalog-surse.md).

## Inventarul complet al rutelor

| # | Rută | Componentă terminală | Acces | Încărcare | Raport |
|---:|---|---|---|---|---|
| 1 | `/` | `Navigate` | bootstrap | direct | [root.md](./root.md) |
| 2 | `/tablou-de-bord` | `TablouDeBordPage` | autentificat | direct | [tablou-de-bord.md](./tablou-de-bord.md) |
| 3 | `/crm` | `ModulePlaceholderPage` | aplicația `crm` | direct | [crm.md](./crm.md) |
| 4 | `/crm/companii` | `WorkspaceCardPage` | aplicația `companies` | direct | [crm-companii.md](./crm-companii.md) |
| 5 | `/companies` | `WorkspaceCardPage` | aplicația `companies` | direct | [companies.md](./companies.md) |
| 6 | `/crm/contacte` | `ModulePlaceholderPage` | aplicația `contacte` | direct | [crm-contacte.md](./crm-contacte.md) |
| 7 | `/crm/oportunitati` | `ModulePlaceholderPage` | aplicația `oportunitati` | direct | [crm-oportunitati.md](./crm-oportunitati.md) |
| 8 | `/crm/activitati` | `ModulePlaceholderPage` | aplicația `activitati` | direct | [crm-activitati.md](./crm-activitati.md) |
| 9 | `/training/in-pregatire` | `ModulePlaceholderPage` | aplicația `training` | direct | [training-in-pregatire.md](./training-in-pregatire.md) |
| 10 | `/certificari/in-pregatire` | `ModulePlaceholderPage` | aplicația `certificari` | direct | [certificari-in-pregatire.md](./certificari-in-pregatire.md) |
| 11 | `/industrial/in-pregatire` | `ModulePlaceholderPage` | aplicația `industrial` | direct | [industrial-in-pregatire.md](./industrial-in-pregatire.md) |
| 12 | `/documente` | `DocumentePage` | aplicația `documents` | direct | [documente.md](./documente.md) |
| 13 | `/planificator-cursuri` | `CoursePlannerPage` | aplicația `course-planner` | lazy | [planificator-cursuri.md](./planificator-cursuri.md) |
| 14 | `/planificator-cursuri/generator` | `CoursePlannerGeneratorPage` | aplicația `course-planner` | lazy | [planificator-cursuri-generator.md](./planificator-cursuri-generator.md) |
| 15 | `/planificator-cursuri/istoric` | `CoursePlannerHistoryPage` | aplicația `course-planner` | lazy | [planificator-cursuri-istoric.md](./planificator-cursuri-istoric.md) |
| 16 | `/planificator-cursuri/xml` | `CoursePlannerXmlPage` | aplicația `course-planner` | lazy | [planificator-cursuri-xml.md](./planificator-cursuri-xml.md) |
| 17 | `/planificator-cursuri/word-matcher` | `CoursePlannerWordMatcherPage` | aplicația `course-planner` | lazy | [planificator-cursuri-word-matcher.md](./planificator-cursuri-word-matcher.md) |
| 18 | `/planificator-cursuri/update-wordpress` | `UpdateWordPressPage` | aplicația `course-planner` | lazy | [planificator-cursuri-update-wordpress.md](./planificator-cursuri-update-wordpress.md) |
| 19 | `/administrare` | `AdministrationPage` | staff | lazy | [administrare.md](./administrare.md) |
| 20 | `/administrare/sistem/interfata-utilizator` | `AdministrationUserInterfacePage` | staff | lazy | [administrare-interfata-utilizator.md](./administrare-interfata-utilizator.md) |
| 21 | `/administrare/utilizatori` | `UtilizatoriPage` | staff | lazy | [administrare-utilizatori.md](./administrare-utilizatori.md) |
| 22 | `/administrare/utilizatori/adaugare` | `UtilizatorFormPage` | staff | lazy | [administrare-utilizatori-adaugare.md](./administrare-utilizatori-adaugare.md) |
| 23 | `/administrare/utilizatori/:userId` | `UtilizatorFormPage` | staff | lazy | [administrare-utilizatori-user-id.md](./administrare-utilizatori-user-id.md) |
| 24 | `/administrare/grupuri` | `GrupuriAplicatiiPage` | staff | lazy | [administrare-grupuri.md](./administrare-grupuri.md) |
| 25 | `/administrare/integrari` | `IntegrationsPage` | staff | lazy | [administrare-integrari.md](./administrare-integrari.md) |
| 26 | `/administrare/integrari/zile-libere` | `PublicHolidaysIntegrationPage` | staff | lazy | [administrare-integrari-zile-libere.md](./administrare-integrari-zile-libere.md) |
| 27 | `*` | `ModulePlaceholderPage` | autentificat | direct | [catch-all.md](./catch-all.md) |

## Componente și comportamente comune

[Runtime-ul comun](./_runtime-comun.md) documentează integral:

- provider-ele din `main.tsx`;
- bootstrapul `AuthenticationGate`, ramura publică `LoginPage` și erorile de rută;
- `AppShell`, `AppHeader`, căutarea, notificările, meniul utilizatorului și logoutul;
- `AppSidebar`, navigația din date, variantele desktop/mobile și listele generate;
- `GlobalLoadingOverlay`, `Toaster`, portalurile și corespondentul DOM al primitivelor comune.

## Constatări transversale

1. `SidebarInset` produce deja un element `main`. Orice `ApplicationState` de eroare randat în interiorul unei pagini autentificate produce încă un `main`, deci DOM invalid cu `main` imbricat. Încărcările nu îl produc deoarece `ApplicationState loading` întoarce `null` și activează overlay-ul global.
2. `CoursePlannerPage` și `IntegrationsPage` dublează aproape integral compoziția cardurilor de catalog (icon, titlu, descriere, badge, footer și link).
3. Componentele cele mai mari și cu mai multe responsabilități sunt `UpdateWordPressPanel` (394 linii), `UtilizatoriPanel` (362), `UtilizatorForm` (360), `GrupuriAplicatiiPanel` (327), `PlannerConfigurationCard` (277) și `CoursePlanHistoryTable` (267).
4. Shell-ul și paginile normale folosesc semantic un singur `main`, dar rutele goale `/crm/companii` și `/companies` nu au titlu, conținut ori stare empty vizibilă. Placeholder-ele au structură semantică, dar folosesc un `Card` drept wrapper integral al rutei.
5. Stările de încărcare globale acoperă orice query/mutation TanStack, însă unele pagini nu au stare locală explicită: istoricul ascunde tabelul în pending; `UpdateWordPressPanel` nu expune eroarea query-ului de setări; filtrul de grupuri al utilizatorilor ignoră eroarea `groupsQuery`; selecția utilizatorilor din dialogul de grup nu are error/empty dedicat.
6. Nu au fost identificate perechi `button > a` sau `a > button` în JSX-ul aplicației: compozițiile `Button render={<Link />}`/`nativeButton={false}` înlocuiesc elementul rădăcină, nu îl imbrică.
7. Pe fluxurile normale nu există pagini cu mai multe `h1`; pagina de administrare primește `h1` din header-ul layoutului, iar conținutul propriu începe cu `h2`. Rutele workspace goale nu au niciun `h1`.
8. `NotificationMenu` conține copy în engleză, deși convenția frontendului cere română. Nu este o problemă de arbore, dar apare în fiecare rută autentificată.
9. Paginile din același modul Planificator nu folosesc același wrapper: generator/XML/Word Matcher/Update WordPress au `section.relative.flex.min-h-[calc(100svh-4rem)]`, istoricul are `section.min-h-full`, iar catalogul are `section.flex...gap-6`. Shell-ul absoarbe diferența, dar layoutul nu este uniform între pagini similare.
10. `ApplicationState` folosește `CardTitle`, care produce `h3`; stările full-page de bootstrap/query/error nu au `h1` și sar direct la nivelul 3.

## Surse analizate

- router și gardieni: `frontend/src/app/`;
- bootstrap și transport: `frontend/src/api/`;
- shell: `frontend/src/layout/`;
- pagini: `frontend/src/pages/`;
- componentele tranzitive ale paginilor: `frontend/src/features/`, `frontend/src/components/` și primitivele relevante din `frontend/src/components/ui/`.
