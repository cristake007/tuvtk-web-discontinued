# Remediere înainte de merge `dev` → `main`

Repository: `cristake007/tuvtk-web`  
Branch: `dev`

## Scop

Rezolvă problemele identificate în auditul tehnic înainte ca `dev` să fie promovat în `main`.

Nu reface arhitectura platformei. Nu introduce un nou motor ACL. Păstrează:

- utilizatorii Django;
- grupurile Django;
- `ApplicationDefinition`;
- accesul prin grupuri;
- accesul direct utilizator–aplicație;
- superuser cu acces complet;
- `StaffRoute`;
- `ApplicationAccessRoute`;
- bootstrapul autentificat drept sursă unică în frontend.

Nu face commit și nu face push.

---

# 1. Selector complet de utilizatori pentru grupuri

## Problema

Pagina „Grupuri și acces aplicații” folosește prima pagină din lista generală de utilizatori, limitată la 20 de rezultate.

După existența a mai mult de 20 de conturi, administratorul nu poate găsi sau selecta utilizatorii din paginile următoare.

## Backend

În `backend/apps/utilizatori` adaugă un endpoint administrativ separat:

```text
GET /api/v1/utilizatori/selectie
```

Permisiune:

```python
IsAdminUser
```

Parametri:

```text
search
page
page_size
```

Reguli:

- `page_size` implicit 20;
- maximum 50;
- căutare după username, first_name, last_name și email;
- ordonare stabilă după nume și username;
- răspuns paginat;
- payload minimal.

Exemplu:

```json
{
  "count": 125,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 25,
      "username": "maria.popescu",
      "full_name": "Maria Popescu",
      "email": "maria@example.com",
      "is_active": true
    }
  ]
}
```

Nu reutiliza serializerul complet `UserAccountSerializer`.

Adaugă serializer dedicat și teste pentru:

- paginare;
- căutare;
- utilizatorul 25 este disponibil;
- acces refuzat unui utilizator normal;
- rezultate inactive vizibile, dar marcate clar.

## Frontend

În dialogul de creare/editare grup:

- nu mai folosi prima pagină a listei generale;
- folosește endpointul `/selectie`;
- adaugă căutare server-side cu debounce rezonabil;
- păstrează selecțiile când se schimbă termenul de căutare sau pagina;
- membrii existenți ai grupului trebuie să fie afișați chiar dacă nu apar în pagina curentă;
- utilizatorii inactivi trebuie etichetați;
- nu încărca toți utilizatorii într-un singur request.

Teste obligatorii:

- minimum 30 de utilizatori;
- utilizatorul 25 poate fi găsit și selectat;
- selecția rămâne după schimbarea căutării;
- editarea unui grup păstrează membrii existenți;
- eliminarea unui membru este salvată corect.

---

# 2. Sincronizarea OpenAPI → TypeScript

## Problema

`frontend/src/api/generated.ts` nu mai reflectă schema backend curentă.

## Cerințe

Rulează generatorul existent:

```bash
./scripts/generate-frontend-api-types.sh
```

Verifică faptul că tipurile generate includ cel puțin:

```text
CoreBootstrap.accessible_application_keys

UserAccount.groups
UserAccount.direct_applications
UserAccount.inherited_applications
UserAccount.effective_applications

UserWrite.group_ids
UserWrite.direct_application_ids
```

Elimină extensiile TypeScript manuale devenite redundante din:

```text
frontend/src/features/core/types.ts
frontend/src/features/utilizatori/types.ts
```

Păstrează manual doar tipurile care nu fac parte din contractul OpenAPI.

## Verificare automată a driftului

Adaugă o comandă care:

1. generează tipurile într-un fișier temporar;
2. compară rezultatul cu `frontend/src/api/generated.ts`;
3. eșuează dacă diferă;
4. nu modifică fișierul versionat în modul check.

Exemplu de comandă:

```text
./dev frontend api-types-check
```

sau echivalent bine integrat în harness.

Adaugă această verificare în:

```text
./dev validate
```

Nu duplica logica generatorului.

---

# 3. Eliminarea sistemului vechi paralel de permisiuni

## Course Planner

Elimină complet:

```text
backend/apps/course_planner/permissions.py
CanUseCoursePlanner
course_planner.use_course_planner
```

Din modelul `CoursePlannerSettings` elimină permisiunea custom din `Meta.permissions`.

Creează migrare care:

- actualizează opțiunile modelului;
- elimină din `auth_permission` permisiunea cu codename `use_course_planner`, dacă există;
- este sigură și idempotentă.

Toate view-urile Planificatorului trebuie să rămână protejate exclusiv prin:

```python
HasApplicationAccess
application_key = "course-planner"
```

## NavigationItem

Câmpul:

```text
NavigationItem.permission_code
```

nu mai este folosit și nu trebuie păstrat în noua bază stabilă.

Elimină-l din model printr-o migrare nouă.

Nu rescrie migrațiile istorice. Actualizează numai codul curent și adaugă o migrare nouă.

Caută în întregul repository:

```text
permission_code
use_course_planner
CanUseCoursePlanner
has_perm(
user_permissions
```

Nu trebuie să rămână nicio verificare paralelă pentru accesul la aplicații.

Permisiunile Django native folosite intern de Django Admin nu trebuie afectate.

---

# 4. Aplicații atribuibile versus containere de navigație

## Problema

`CRM` este container de navigație, dar poate apărea și ca aplicație bifabilă separat de:

- Companii;
- Contacte;
- Oportunități;
- Activități.

## Model

Adaugă pe `ApplicationDefinition`:

```python
is_assignable = models.BooleanField(default=True)
```

Creează migrare de date.

Setează:

```text
core             → false
crm              → false
public-holidays  → false
```

Modulele business rămân atribuibile:

```text
companies
contacte
oportunitati
activitati
documents
course-planner
training
certificari
industrial
```

Nu schimba `is_access_controlled` pentru această cerință.

## API și UI

Endpointurile care oferă aplicațiile pentru grupuri și acces direct trebuie să returneze numai:

```text
is_enabled=True
is_access_controlled=True
is_assignable=True
```

Containerele nu trebuie afișate administratorului ca checkboxuri.

Sidebarul poate păstra automat containerul CRM când există cel puțin un copil permis.

Adaugă teste:

- CRM nu apare în lista bifabilă;
- Contacte apare;
- accesul la Contacte adaugă în sidebar containerul CRM și copilul Contacte;
- nu este necesar acces separat la CRM.

---

# 5. Optimizarea listei de utilizatori

## Problema

Serializerul calculează accesul moștenit și efectiv separat pentru fiecare utilizator, generând query-uri N+1.

## Cerință

Optimizează lista utilizatorilor astfel încât:

- grupurile;
- aplicațiile directe;
- aplicațiile moștenite;
- aplicațiile efective

să nu genereze query-uri separate pentru fiecare utilizator.

Poți folosi:

- `Prefetch`;
- mapări calculate în view;
- serializer context;
- query-uri batch.

Nu muta logică business în React.

Adaugă un test `assertNumQueries` pentru o listă cu cel puțin 20 de utilizatori și mai multe grupuri/aplicații.

Numărul de query-uri nu trebuie să crească liniar cu numărul de utilizatori.

---

# 6. Politica administratorilor

Păstrează politica actuală și documenteaz-o explicit:

## Staff

Un utilizator cu:

```text
is_staff=True
is_superuser=False
```

poate:

- accesa Administrare;
- lista și gestiona utilizatorii normali;
- crea și gestiona grupuri;
- acorda acces business prin grupuri și acces direct.

Nu poate:

- acorda sau retrage `is_staff`;
- modifica alt cont staff;
- limita sau modifica accesul unui superuser;
- dezactiva propriul cont;
- retrage propriul `is_staff`.

## Superuser

- acces complet la toate aplicațiile active;
- poate gestiona administratorii;
- accesul său nu poate fi limitat prin ACL.

Adaugă teste backend pentru toate regulile de mai sus.

Nu introduce un nou cod de permisiune pentru administrare în această etapă.

---

# 7. Teste frontend reale pentru autentificare și rute

## Problema

Testele actuale verifică doar funcții booleene și nu montează routerul sau componentele.

## Setup minim

Adaugă numai infrastructura minimă necesară pentru teste de integrare React:

- Vitest;
- jsdom;
- React Testing Library.

Folosește versiuni compatibile cu Node 24 și React 19 și fixează versiunile exacte în `package.json`.

Nu introduce Playwright, Cypress sau o infrastructură E2E mare în această etapă.

Actualizează scriptul frontend astfel încât testele `.test.tsx` să fie executate.

Păstrează testele pure existente, dar rulează-le printr-o singură comandă coerentă.

## Refactor minim pentru testabilitate

Expune configurația rutelor într-o formă reutilizabilă:

```text
route objects / appRoutes
```

Folosește aceeași definiție pentru:

- `createBrowserRouter` în aplicație;
- `createMemoryRouter` în teste.

Nu duplica arborele de rute.

## Teste obligatorii

### StaffRoute

Utilizator normal pe:

```text
/administrare
/administrare/utilizatori
/administrare/utilizatori/1
/administrare/grupuri
/administrare/integrari
```

Rezultat:

- pagina administrativă nu se montează;
- apare `AccessDenied`;
- requesturile paginii protejate nu sunt pornite.

### ApplicationAccessRoute

Utilizator fără `course-planner`:

```text
/planificator-cursuri
/planificator-cursuri/generator
/planificator-cursuri/istoric
```

Rezultat:

- componentele nu se montează;
- requesturile Planificatorului nu pornesc.

Utilizator cu cheia potrivită:

- pagina se montează.

### Schimbarea utilizatorului

Testează fluxul:

1. bootstrap superuser;
2. rută `/administrare/utilizatori`;
3. logout;
4. bootstrap utilizator normal;
5. login reușit;
6. ruta finală `/tablou-de-bord`.

Verifică:

- cache-ul privat este eliminat;
- bootstrapul vechi nu este reutilizat;
- pagina administrativă nu apare temporar;
- navigarea folosește `replace`;
- Back nu revine la pagina contului anterior.

### Proxy Vite

Adaugă cel puțin un test de configurație sau o verificare scriptată pentru:

```text
/admin/          → proxy Django
/administrare    → SPA React
```

Nu porni Django pentru acest test dacă poate fi verificat direct din configurația Vite.

---

# 8. README și documentație

Actualizează README pentru starea reală:

- `Administrare`, nu `Setări`;
- ruta `/administrare/integrari`;
- rutele actuale ale Planificatorului;
- utilizatori și grupuri;
- ACL simplu la nivel de aplicație;
- aplicațiile placeholder marcate clar ca neimplementate;
- Dashboard și Documente marcate ca schelete dacă nu au funcționalitate reală;
- `db_registry` descris ca infrastructură pregătită, nu registru implementat;
- comenzile reale din harness;
- fluxul de generare și verificare a tipurilor OpenAPI.

Definește corect sistemul:

> Acces simplu la nivel de aplicație, construit peste utilizatorii și grupurile Django.

Nu îl descrie ca sistemul standard Django `auth.Permission`.

---

# 9. Gate-ul `./dev validate`

Extinde `./dev validate` astfel încât să ruleze și:

```bash
python manage.py makemigrations --check --dry-run
```

și verificarea driftului OpenAPI → TypeScript.

Păstrează verificările existente:

- Django check;
- Ruff;
- OpenAPI validate;
- teste backend;
- frontend dependency sync;
- frontend lint;
- TypeScript;
- teste frontend;
- theme check;
- build.

Nu pune comenzi Git destructive în harness.

`git diff --check` rămâne comandă separată pentru gate-ul final.

---

# 10. Verificare finală

Rulează:

```bash
./dev backend manage makemigrations --check --dry-run
./dev backend migrate
./dev backend check
./dev backend lint
./dev backend schema

./scripts/generate-frontend-api-types.sh
./dev frontend api-types-check
./dev frontend typecheck
./dev frontend lint
./dev frontend test
./dev frontend build

./dev test backend
./dev validate
git diff --check
```

Verifică și că nu există referințe rămase:

```bash
grep -RIn \
  -e 'use_course_planner' \
  -e 'CanUseCoursePlanner' \
  -e 'permission_code' \
  -e 'has_perm(' \
  backend frontend \
  --exclude-dir=migrations
```

Rezultatul trebuie să fie gol pentru sistemul ACL de aplicații.

---

# 11. Limite

Nu face în această etapă:

- departamente;
- echipe;
- roluri custom;
- permisiuni CRUD;
- permisiuni pe câmpuri;
- reguli deny;
- object-level permissions;
- CI GitHub Actions;
- deployment de producție;
- refactorizarea modulelor placeholder;
- implementarea CRM/ONRC/Documente.

Nu modifica poziția sau designul general al navigației decât unde este necesar pentru `is_assignable`.

Nu face commit și nu face push.

---

# Raport final

Raportează concis:

1. fișiere modificate;
2. migrații create;
3. endpointul de selecție utilizatori;
4. modificările ACL;
5. testele React adăugate;
6. optimizarea query-urilor și rezultatul `assertNumQueries`;
7. comenzile executate;
8. rezultatele;
9. orice problemă rămasă care blochează merge-ul.
