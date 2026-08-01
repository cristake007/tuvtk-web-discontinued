# Unificarea tipografiei, a ierarhiei vizuale și a culorilor de brand

Repository: `cristake007/tuvtk-web`
Domeniu: `frontend/` (toate paginile, nu doar `/administrare`) + un câmp nou în `backend/apps/core`.

## Scop

Aplicația arată inconsecvent pentru că nu există o scală tipografică semantică — fiecare pagină și-a inventat propriile clase Tailwind pentru titluri și text. Acest document e o specificație de implementare, nu o discuție de design: fiecare fază de mai jos are un rezultat verificabil (typecheck, lint, `vitest run`, capturi de ecran).

Nu redesenăm aplicația. Nu schimbăm layout-ul, rutele sau componentele shadcn generice (`Button`, `Input`, `Select` etc.), cu o singură excepție explicită: `CardTitle`, care randează în prezent un `<div>` în loc de un heading real. Nu introduce biblioteci noi.

## Diagnostic (verificat în cod, nu presupus)

Inventar făcut cu `grep` peste `frontend/src`:

- **Doar 5 elemente `<h1>` reale există în toată aplicația** (`AdminPageHeader.tsx`, `AntetAplicatie.tsx`, `LoginForm.tsx`, `StaffRoute.tsx` — pagina de acces interzis, plus un mock de test). Restul „titlurilor de pagină" din aplicație nu sunt titluri semantice — sunt `<div>`/`<p>` stilizate. Un cititor de ecran care navighează pe headinguri (tasta „H") nu vede aproape nimic din structura reală a aplicației.
- **`CardTitle`** (`components/ui/card.tsx:36-46`) randează un `<div>` cu `text-base leading-snug font-medium`, folosit ca titlu de secțiune în zeci de carduri din toată aplicația. Niciunul dintre aceste titluri nu apare în ierarhia de headinguri a paginii.
- **8 combinații diferite de clase** revendică rolul de „titlu" în cod, fără nicio relație sistematică între ele:
  `text-2xl font-semibold tracking-tight sm:text-3xl` · `text-lg font-semibold tracking-tight` · `text-xl font-semibold tracking-tight text-foreground` · `text-sm font-semibold tracking-tight` · și alte 4 variații — unele cu `text-primary`, altele fără.
- **Text obișnuit (paragrafe, descrieri) e aproape peste tot `text-sm` (14px)** — 160 de apariții — sau chiar `text-xs` (12px) — 63 de apariții. Nu există o distincție sistematică între „text principal de citit" și „text auxiliar/meta" — ambele folosesc adesea aceeași clasă.
- **Anteturile de pagină din `/administrare` sunt inconsecvente la iconițe**: `AdministrationUserInterfaceHeader`, `IntegrationsHeader` și `PublicHolidaysIntegrationHeader` primesc un `icon`; `UtilizatoriHeader`, `GrupuriAplicatiiHeader`, `UtilizatorFormHeader`, `AdministrationHeader` (pagina index) nu. Decizia produsului: **fără iconițe în anteturi**, deloc.
- **Butoanele „primare"** (`variant="default"` din `components/ui/button.tsx`, care folosește deja `bg-primary` — deci culoarea de brand) sunt folosite inconsecvent: unele ecrane au o acțiune principală clar marcată cu culoarea de brand, altele folosesc `variant="outline"` pentru ce ar trebui să fie acțiunea principală, iar altele au mai multe butoane „default" care concurează vizual.
- **Nu există niciun token de culoare separat pentru titluri.** Toate titlurile moștenesc `--foreground` (aceeași culoare ca textul obișnuit). Din acest motiv, în `/administrare/sistem/interfata-utilizator`, secțiunea de branding poate schimba `culoare_primara`, `culoare_accent`, `culoare_fundal`, dar nu poate schimba culoarea titlurilor — pentru că nu există ce să schimbe.

## Scala tipografică semantică (ținta)

Fiecare rol de mai jos are UN singur set de clase canonic. Nu se inventează variații pe pagină.

| Rol | Element HTML | Clase Tailwind canonice | Unde se folosește |
|---|---|---|---|
| Titlu de pagină | `<h1>` | `text-2xl font-semibold tracking-tight sm:text-3xl text-heading` | Exact unul per pagină. Deja standardizat în `AdminPageHeader.tsx` — acesta rămâne sursa canonică. |
| Titlu de secțiune | `<h2>` | `text-lg font-semibold tracking-tight text-heading sm:text-xl` | Titluri de grupuri/secțiuni în interiorul unei pagini (ex. grupurile „Sistem", „Utilizatori" din `/administrare`). |
| Titlu de card/subsecțiune | `<h3>` | `text-base font-semibold leading-snug text-heading` | Înlocuiește complet stilul actual al `CardTitle`. |
| Text principal (descriere, conținut) | `<p>` | `text-base leading-6 text-foreground` (sau `text-muted-foreground` dacă e text explicativ secundar sub un titlu) | Paragrafele care explică ce face o pagină/secțiune. Acesta e textul „prea mic" reclamat — crește de la `text-sm` la `text-base`. |
| Etichetă | `<label>` / `<span>` | `text-sm font-medium text-foreground` | Etichete de câmp, capete de tabel (`<TableHead>`). |
| Text auxiliar/meta | `<span>` / `<p>` | `text-xs text-muted-foreground` | Timestamp-uri, contoare, hint-uri sub câmpuri, texte de tip „25/120". |
| Control UI (buton, input, item de navigare) | — | rămâne `text-sm`, nu se atinge | Dimensiunea e dată de componentele shadcn (`Button`, `Input`, `SidebarMenuButton`), nu de regulile de mai sus. Text dens de UI ≠ text de conținut. |

Regulă de decizie simplă pentru orice text nou: **dacă utilizatorul trebuie să-l citească pentru a înțelege ce e pe ecran → `text-base` sau mai mare, cu ierarhia h1/h2/h3 de mai sus. Dacă e context/confirmare/metadate → `text-xs`/`text-sm` cu `text-muted-foreground`.** Nu există o a treia categorie.

## Token nou de culoare: `--heading`

Adaugă în `frontend/src/styles/globals.css`, lângă `--foreground`, în toate cele trei locuri unde apar tokenii de culoare (`:root`, `:root[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`):

```css
--heading: var(--foreground); /* implicit = aceeași culoare ca textul, până e configurat separat */
```

Și în `@theme inline`, lângă `--color-foreground`:

```css
--color-heading: var(--heading);
```

Asta expune clasa Tailwind `text-heading`, folosită de toate titlurile din tabelul de mai sus. Implicit nu schimbă nimic vizual (moștenește `--foreground`), dar devine independent configurabil — vezi Faza 5.

---

# Faza 0 — Fundația (tokeni + `CardTitle` + componente de titlu)

## Obiectiv
Pune bazele fără să atingă încă restul aplicației. La finalul acestei faze, nimic nu trebuie să arate diferit vizual (implicit) — doar mecanismul devine disponibil.

## Cerințe

1. Adaugă tokenul `--heading` conform secțiunii de mai sus (3 locuri în `globals.css` + `@theme inline`).
2. Modifică `components/ui/card.tsx` → `CardTitle`: schimbă elementul din `<div>` în `<h3>`, clasele din `text-base leading-snug font-medium` în `text-base font-semibold leading-snug text-heading`. Nu schimba props-urile componentei (`className`, `...props` rămân la fel) — doar elementul și clasele implicite. Acesta e un fix cu efect sistemic: repară ierarhia de headinguri peste tot unde există un `CardTitle`, fără să atingă cele ~40+ fișiere care îl folosesc.
3. Creează `components/ui/heading.tsx` cu două componente:
   - `PageTitle` → randează `<h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl text-heading", className)}>`.
   - `SectionTitle` → randează `<h2 className={cn("text-lg font-semibold tracking-tight text-heading sm:text-xl", className)}>`.
   Ambele acceptă `className` și `...props` ca restul componentelor din `components/ui/`. Nu crea `Heading3`/`CardTitle` separat — `CardTitle` de la pasul 2 acoperă acel rol.
4. Actualizează `features/administration/AdminPageHeader.tsx` să folosească `PageTitle` în loc de `<h1 className="...">` scris manual (același text, doar sursa clasei se mută în componentă).
5. Extinde `scripts/check-react-conventions.mjs` cu o regulă nouă: interzice `<h1` sau `<h2` scrise direct cu `className` care conține `text-2xl`/`text-3xl`/`text-lg`/`text-xl` în afara `components/ui/heading.tsx` și `AdminPageHeader.tsx` — mesajul erorii trebuie să spună explicit „Folosește `PageTitle`/`SectionTitle` din `@/components/ui/heading`, nu clase scrise manual." Verifică întâi cum sunt implementate regulile existente în script (ex. regula pentru `@ts-ignore` sau pentru hook-uri) ca să respecți același stil de raportare (`report(sourceFile, node, message)`).

## Verificare
- `npm run typecheck`, `npm run lint`, `npx vitest run` — toate trec.
- Captură de ecran pe 2-3 pagini din `/administrare` (deja migrate la `AdminPageHeader`) — trebuie să arate identic cu înainte.
- Rulează `npm run lint` intenționat pe un `<h1 className="text-2xl ...">` scris de mână undeva temporar, ca să confirmi că noua regulă îl prinde, apoi șterge testul.

---

# Faza 1 — Text principal vs. text auxiliar

## Obiectiv
Aplică regula „ce e important e mai mare" la nivel de text (nu doar titluri).

## Cerințe
1. Găsește toate paragrafele de tip „descriere sub titlu" (`<p>` imediat sub un `<h1>`/`PageTitle` sau sub un `CardTitle`/`CardDescription`) care folosesc `text-sm`. Listă de pornire (deja cunoscute din sesiunea de `/administrare`): toate fișierele `*Header.tsx` din `features/administration`, `features/branding`, `features/utilizatori`, `features/integrations` — acestea deja folosesc `text-sm leading-6 text-muted-foreground` pentru descriere; **schimbă la `text-base leading-6 text-muted-foreground`** peste tot unde acest pattern apare ca descriere de pagină.
2. **Nu schimba** text-ul din: tabele (`TableCell`, `TableHead`), butoane, inputuri, itemi de navigare, bare de filtrare, badge-uri, `CardDescription` folosit ca subtitlu compact de card (acolo `text-sm` rămâne corect — e lângă un `CardTitle` mic, nu sub un `<h1>`). Dacă nu ești sigur dacă un text e „conținut de citit" sau „UI dens", implicit **nu îl schimba** și notează-l într-o listă separată pentru revizuire manuală, în loc să presupui.
3. Text auxiliar/meta (timestamp-uri, contoare de tip „25/120", hint-uri de sub câmpuri) — verifică să fie `text-xs text-muted-foreground`, nu `text-sm`. Nu e o schimbare „a bump", e o reducere unde s-a folosit `text-sm` pentru ce e de fapt metadata (ex. contorul de caractere din `GeneralSettingsCard.tsx`).

## Verificare
- `npm run typecheck`, `npm run lint`, `npx vitest run`.
- Captură de ecran înainte/după pe cel puțin 5 pagini diferite (nu doar `/administrare`) ca să confirmi că ierarhia „titlu mare → descriere medie → meta mic" e vizibil consecventă.

---

# Faza 2 — Eliminarea iconițelor din anteturile de pagină

## Obiectiv
Regulă de produs: anteturile de pagină nu au iconițe, niciodată.

## Cerințe
1. În `features/administration/AdminPageHeader.tsx`: elimină complet prop-ul `icon` (nu-l face opțional-neutilizat — șterge-l din tipul componentei și din JSX).
2. Actualizează cele 3 apeluri care încă transmit `icon`:
   - `features/branding/AdministrationUserInterfaceHeader.tsx` (transmitea `Monitor`)
   - `features/integrations/IntegrationsHeader.tsx` (transmitea `PlugZap`)
   - `features/integrations/public-holidays/PublicHolidaysIntegrationHeader.tsx` (transmitea `CalendarDays`)

   Șterge importul iconiței și argumentul `icon={...}` din fiecare. Verifică că layout-ul antetului rămâne corect fără span-ul de iconiță (probabil `AdminPageHeader` poate renunța și la `flex items-start gap-4` dacă nu mai există niciodată un al doilea element pe orizontală lângă text — simplifică structura internă a componentei o dată, nu per-pagină).
3. `components/AntetAplicatie.tsx` (componenta mai veche, folosită doar de `CoursePlannerPage`) are `pictograma: LucideIcon` ca prop **obligatoriu**. Aceasta contrazice regula „fără iconițe". Nu o schimba în această fază dacă `CoursePlannerPage` e în afara scopului curent de lucru — dar notează explicit în raportul final (secțiunea „Limite" de mai jos) că `AntetAplicatie` trebuie aliniată la `AdminPageHeader` (sau înlocuită cu el) într-o fază viitoare, ca să nu rămână o a doua sursă de adevăr pentru anteturi.

## Verificare
- `npm run typecheck`, `npm run lint`, `npx vitest run`.
- Captură de ecran pe toate cele 7 pagini din `/administrare` — niciun antet nu mai are iconiță.

---

# Faza 3 — Consecvența butoanelor de brand

## Obiectiv
O singură acțiune „primară" (culoarea de brand, `variant="default"`) per ecran/card. Restul acțiunilor — `variant="outline"` (secundară), `variant="ghost"` (terțiară/inline), `variant="destructive"` (ștergere).

## Cerințe
1. Pentru fiecare pagină din `/administrare` (listă: `AdministrationPage`, `AdministrationUserInterfacePage` — cele 3 taburi, `UtilizatoriPanel`, `UtilizatorForm`, `GrupuriAplicatiiPanel`, `IntegrationsPage`, `PublicHolidaysIntegrationPanel`), identifică acțiunea principală a ecranului (de regulă „Salvează"/„Creează"/„Adaugă") și confirmă că e singurul buton `variant="default"` vizibil simultan pe ecran. Dacă există mai multe carduri cu propriul buton de salvare (ex. `GeneralSettingsCard` + `BrandingPanel` pe același tab), fiecare card poate avea propriul „default" — regula e „un default per card/formular independent", nu „unul per pagină întreagă" dacă pagina conține formulare independente unele de altele.
2. Verifică că butoanele de ștergere (`Elimină`, `Șterge`) folosesc `variant="destructive"`, nu `variant="outline"` sau `variant="ghost"` cu text roșu manual.
3. Verifică că butoanele de navigare secundară (înapoi, anulare, link către altă pagină) folosesc `variant="outline"`.
4. Nu schimba `buttonVariants` din `components/ui/button.tsx` — problema nu e în definiția variantelor (acestea sunt deja corecte: `default` folosește deja `bg-primary`), problema e în ce variantă alege fiecare pagină pentru fiecare buton.

## Verificare
- Captură de ecran pe fiecare pagină din listă, cu o notă scurtă (1 linie) per pagină: care e butonul „default" și de ce.

---

# Faza 4 — Migrarea restului aplicației

## Obiectiv
Extinde Fazele 0-3 dincolo de `/administrare`, care a fost deja aliniată într-o sesiune anterioară.

## Cerințe
1. Listă de pornire (pagini/componente cu titluri „proprii", identificate prin `grep -rn "text-2xl\|text-xl\|text-lg" --include=*.tsx` combinat cu `font-semibold`): `pages/TablouDeBordPage.tsx` / `WorkspaceCardPage.tsx`, `pages/DocumentePage.tsx`, `features/course-planner/*` (inclusiv `CoursePlannerPanel.tsx`, care folosește `AntetAplicatie`), `features/utilizatori/UtilizatorDialog.tsx` (verifică dacă mai are titlu propriu după refactorizarea din `/administrare`), orice pagină din `pages/` nemenționată încă.
2. Pentru fiecare fișier: înlocuiește titlul „de mână" cu `PageTitle`/`SectionTitle`, aliniază descrierea la `text-base`, elimină iconița din antet (dacă are), verifică butonul principal conform Fazei 3.
3. Rulează din nou grep-urile de diagnostic din secțiunea „Diagnostic" de mai sus la finalul fazei — numărul de combinații diferite de clase „titlu" trebuie să scadă la cele documentate în tabelul din secțiunea „Scala tipografică semantică".

## Verificare
- `npm run typecheck`, `npm run lint`, `npx vitest run`.
- Captură de ecran pe toate paginile principale ale aplicației (nu doar `/administrare`).

---

# Faza 5 — Culoare de titluri configurabilă din Branding

## Obiectiv
Adaugă `culoare_titluri` ca al patrulea câmp de culoare configurabil, alături de `culoare_primara`, `culoare_accent`, `culoare_fundal`, folosind exact același tipar existent — nu inventa un mecanism nou.

## Backend (`backend/apps/core`)
1. `models.py` — în `ApplicationConfiguration`, adaugă lângă `culoare_fundal`:
   `culoare_titluri = models.CharField(max_length=7, default="#1b2230")` (sau valoarea hex echivalentă tokenului `--foreground` actual din `globals.css`, ca implicit să nu schimbe nimic vizual la lansare).
2. Migrație nouă (`0020_...py`, următorul număr după `0019_application_assignability_and_remove_navigation_permission.py`).
3. `serializers.py` — adaugă `culoare_titluri` în toate cele trei locuri unde apar `culoare_primara`/`culoare_accent`/`culoare_fundal`:
   - `ShellConfigurationSerializer`
   - `PublicBrandingSerializer`
   - `ActualizareInterfataUtilizatorSerializer` (cu același `RegexField(r"^#[0-9A-Fa-f]{6}$", required=False)`)
4. Verifică `apps/core/views.py` (sau unde sunt definite endpoint-urile care folosesc aceste serializere) — dacă serializarea e automată din model, nu ar trebui să fie nevoie de alte schimbări; confirmă totuși că nu există vreun loc care listează explicit câmpurile de culoare (`fields = [...]`) și trebuie actualizat manual.

## Frontend (`frontend/src`)
1. Regenerează tipurile API: `npm run api:types` (script definit în `package.json`, citește schema OpenAPI expusă de backend). Confirmă că `ShellConfiguration` din `api/generated.ts` are acum `culoare_titluri: string`.
2. `layout/AppShell.tsx` — în `useEffect`-ul care setează `--primary`/`--brand-red`/`--background` din `bootstrap.configuration`, adaugă:
   `root.style.setProperty("--heading", culoare_titluri);` (și `removeProperty` simetric la cleanup).
3. `features/branding/components/BrandColorsSection.tsx` — adaugă al patrulea câmp în `CAMPURI_CULORI` (`camp: "culoare_titluri", eticheta: "Culoare titluri", descriere: "Titlurile de pagină, secțiune și card din toată aplicația."`). Tipul `CuloriInterfata` din `useUserInterfaceSettings.ts` trebuie extins cu `culoare_titluri`, la fel `culoriImplicite` (valoarea implicită trebuie să corespundă cu cea din backend).
4. `features/branding/components/LiveShellPreview.tsx` — scopează și `--heading` pe lângă `--primary`/`--brand-red`/`--background` în `stilTema`, și aplică `text-heading` pe elementele din previzualizare care reprezintă titluri (dacă previzualizarea are text care simulează un titlu — verifică structura actuală înainte de a adăuga).
5. Verifică `features/branding/api.ts` — funcțiile `fetchUserInterfaceSettings`/`updateUserInterfaceSettings` folosesc tipul generat, deci ar trebui să preia automat noul câmp; confirmă că `Partial<Pick<ShellConfiguration, ...>>` din `updateUserInterfaceSettings` include și `culoare_titluri` în lista de chei acceptate.

## Verificare
- Migrație rulează curat: `./dev backend migrate` (sau comanda echivalentă din `./dev`, verifică `README.md`/`AGENTS.md` pentru sintaxa exactă).
- `npm run typecheck`, `npm run lint`, `npx vitest run`.
- Manual: în `/administrare/sistem/interfata-utilizator`, tab Branding, schimbă „Culoare titluri" la o valoare vizibil diferită (ex. verde) și confirmă că live preview-ul și, după salvare, titlurile reale din aplicație (h1/h2/h3/CardTitle) își schimbă culoarea, iar textul obișnuit (`text-foreground`) NU se schimbă.

---

# Faza 6 — Standardizarea elementelor HTML semantice (container-e, text, liste)

## Problema
Dincolo de titluri (Fazele 0-4), alegerea elementului HTML de bază pentru restul marcajului e inconsecventă. Verificat în cod:

- `features/branding/SortableMenuList.tsx:74` și `:121` — lista de elemente de meniu e un `<div role="list">` care conține `<div role="listitem">`, în loc de `<ul>`/`<li>` native. Nu există niciun motiv tehnic pentru asta — `useSortable` din `@dnd-kit/sortable` se atașează prin `ref`, nu impune un anume tip de element.
- Wrapper-ul rădăcină de pagină e aproape peste tot `<section className="flex min-w-0 flex-1 flex-col gap-6">` (7 din 10 pagini) — corect și consecvent — dar 3 pagini adaugă în plus `bg-background` la același wrapper, fără un motiv vizibil de ce doar acelea. `AdministrationLayout.tsx` folosește `<div>` pentru wrapper-ul de layout (rail + `<Outlet/>`) — corect, pentru că nu e o pagină, e o compunere de layout, deci rămâne `<div>`, nu se schimbă.
- Nu există nicio folosire a `<code>` în aplicație, deși `globals.css` are deja o regulă `code, .mono { font-family: ui-monospace, ... }` gata pregătită. Orice text tehnic afișat static (cod hex, cale, identificator) în afara unui `<input>` ar trebui să fie `<code>`, nu un `<span>`/`<div>` cu `font-mono` adăugat manual.

## Reguli
- Container de nivel de pagină sau de grupare tematică (are sens de sine stătător, ar putea avea propriul heading): `<section>`.
- Container pur de layout (poziționare flex/grid, fără sens tematic propriu — ex. o compunere de tip rail+conținut): `<div>`.
- Text tip propoziție/paragraf (descrieri, explicații): `<p>`.
- Fragment de text în interiorul unui rând (etichetă scurtă, valoare, contor, text de badge): `<span>`.
- Listă de elemente similare, repetate (rânduri de meniu, rezultate de căutare, elemente sortabile, orice ce azi e randat cu `.map()` într-un container): `<ul>`/`<li>` native. `role="list"`/`role="listitem"` pe un `<div>` se folosește *doar* dacă un element `<li>` chiar rupe vizual layout-ul (browserele adaugă `display: list-item` implicit, ușor de suprascris cu `list-none` dacă e nevoie) — nu implicit, din obișnuință.
- Valoare tehnică afișată ca text static (cod hex, cale de rută, nume de fișier, identificator) în afara unui `<input>`: `<code>`. Nu mai adăuga `font-mono` manual pe `<span>`/`<div>` pentru asta — `code` are deja stilul din `globals.css`.

## Cerințe
1. `SortableMenuList.tsx`: schimbă `<div ... role="list">` în `<ul ...>` și `<div ... role="listitem">` în `<li ...>`. Păstrează restul claselor și `ref`-ul de la `useSortable` neschimbate. Verifică vizual (captură de ecran) că lista arată identic — un `<ul>` fără `list-style` explicit poate primi implicit marcatori/indentare din stilurile browser-ului dacă nu există deja un reset global; confirmă că `globals.css`/reset-ul Tailwind acoperă asta (de regulă `list-style: none` e parte din reset-ul standard Tailwind, dar confirmă, nu presupune).
2. Cele 7 wrappere de pagină cu `<section className="flex min-w-0 flex-1 flex-col gap-6">`: decide o singură variantă (cu sau fără `bg-background`) verificând dacă acea clasă schimbă ceva vizual sau e redundantă (culoarea de fundal vine oricum de la părinte) — apoi aplic-o uniform pe toate cele 7.
3. Fă un audit țintit (nu exhaustiv pe toate cele 291 de `<div>`, doar pe cele care randează conținut, nu layout) pentru cazuri unde un `<div>`/`<span>` e folosit acolo unde textul e de fapt o propoziție completă (ar trebui `<p>`) sau unde o listă `.map()` randează rânduri fără element de listă real. Pornește de la paginile deja atinse în Fazele 0-4 din `/administrare`, apoi extinde la restul aplicației din lista de la Faza 4.
4. Nu atinge elementele cu `role="group"`/`role="list"` din `components/ui/*` (`item.tsx`, `button-group.tsx`, `field.tsx`, `carousel.tsx`, `input-group.tsx`) — sunt primitive shadcn generice, cu semantică ARIA aleasă intenționat de biblioteca sursă, nu cod propriu al aplicației.

## Verificare
- `npm run typecheck`, `npm run lint`, `npx vitest run`.
- Grep de regresie: `grep -rn 'role="list"\|role="listitem"' frontend/src --include=*.tsx` — singurele rezultate rămase trebuie să fie în `components/ui/`, nu în `features/`/`pages/`.
- Captură de ecran pe pagina `/administrare/sistem/interfata-utilizator`, tab Meniu — lista de elemente sortabile trebuie să arate identic cu înainte.

---

# Verificare finală (după toate fazele)

- `npm run typecheck`, `npm run lint`, `npx vitest run` — zero erori.
- Grep-urile din secțiunea „Diagnostic" rulate din nou, cu rezultatul documentat într-un tabel „înainte/după" în raportul final.
- Grep-ul din Faza 6 (`role="list"`/`role="listitem"` în afara `components/ui/`) rulat din nou — trebuie să nu mai returneze nimic din `features/`/`pages/`.
- Captură de ecran pentru fiecare pagină principală a aplicației (listă: toate din `/administrare`, `tablou-de-bord`, `documente`, `planificator-cursuri` + sub-paginile lui, `login`).
- Testare manuală cu un cititor de ecran (VoiceOver/NVDA) pe cel puțin o pagină, navigare pe headinguri („H"), pentru a confirma că ierarhia h1 → h2 → h3 e acum reală și completă.

# Limite (nu face)

- Nu redenumi rute, nu muta fișiere de pagină, nu schimba structura routerului (`app/router.tsx`) dincolo de ce e strict necesar pentru importuri.
- Nu schimba `buttonVariants`, `badgeVariants` sau alte definiții structurale din `components/ui/` în afara `CardTitle` (Faza 0).
- Nu atinge marcajul ARIA din primitivele shadcn generice (`components/ui/*`) — Faza 6 privește doar codul propriu al aplicației (`features/`, `pages/`).
- Nu introduce o bibliotecă nouă de componente sau un sistem de design token separat de Tailwind/`globals.css` existent.
- Nu atinge `AntetAplicatie.tsx`/`CoursePlannerPage` dincolo de a nota inconsecvența (vezi Faza 2) — e în afara scopului dacă nu se decide explicit altfel.
- Nu face commit și nu face push fără aprobare explicită după fiecare fază — fiecare fază de mai sus e gândită ca un punct natural de revizuire separat.
