# ACL simplu pe aplicații — specificație de implementare

## Context

Repository: `cristake007/tuvtk-web`  
Branch: `dev`

Implementarea ACL anterioară a fost retrasă. Nu trebuie reintrodus vechiul sistem `control_acces`.

Obiectivul acestei etape este un sistem simplu și stabil:

- utilizatorii sunt utilizatorii Django existenți;
- grupurile sunt `django.contrib.auth.models.Group`;
- administratorul creează grupuri;
- administratorul adaugă utilizatori în grupuri;
- administratorul bifează aplicațiile disponibile fiecărui grup;
- Django controlează sidebarul și endpointurile;
- React doar afișează rezultatul primit de la backend.

Accesul este numai:

- acces;
- fără acces.

Nu implementa în această etapă:

- permisiuni pe câmpuri;
- permisiuni pe obiecte;
- niveluri `proprii`, `departament`, `toate`;
- reguli explicite de tip deny;
- roluri custom;
- acces direct utilizator–aplicație;
- un nou registru de aplicații;
- un nou motor ACL.

---

## 1. Modelele folosite

Folosește exclusiv:

- `get_user_model()` pentru utilizatori;
- `django.contrib.auth.models.Group` pentru grupuri;
- `apps.core.models.ApplicationDefinition` pentru catalogul aplicațiilor.

Nu crea:

- `Rol`;
- `Permisiune`;
- `RolUtilizator`;
- `ApplicationPermission`;
- un al doilea model User.

---

## 2. Extinderea `ApplicationDefinition`

În `apps.core.models.ApplicationDefinition` adaugă:

```python
from django.contrib.auth.models import Group

allowed_groups = models.ManyToManyField(
    Group,
    blank=True,
    related_name="allowed_applications",
)

is_access_controlled = models.BooleanField(default=True)
```

Creează migrarea Django normală.

### Reguli inițiale de date

- `core` → `is_access_controlled=False`
- `public-holidays` → `is_access_controlled=False`
- `companies` → `is_access_controlled=True`
- `documents` → `is_access_controlled=True`
- `course-planner` → `is_access_controlled=True`

Nu modifica poziția sau structura navigației.

`public-holidays` rămâne integrare administrativă și nu devine meniu principal.

---

## 3. Regula de acces

Implementează în `apps.core` un helper unic și explicit:

```python
user_has_application_access(user, application_key)
```

Reguli:

1. utilizator neautentificat → fără acces;
2. utilizator inactiv → fără acces;
3. superuser → acces la toate aplicațiile active;
4. aplicație inexistentă → fără acces;
5. aplicație dezactivată → fără acces;
6. aplicație cu `is_access_controlled=False` → nu este decisă prin grupuri;
7. aplicație controlată → acces numai dacă unul dintre grupurile utilizatorului apare în `allowed_groups`.

Nu implementa acces direct utilizator–aplicație.

Pentru acces acordat unei singure persoane se poate crea un grup cu un singur membru.

Permisiunile grupurilor se cumulează.

---

## 4. Sidebar și bootstrap

Modifică `apps.core.services.get_core_bootstrap`.

Pentru fiecare `NavigationItem`:

1. păstrează verificarea `requires_staff`;
2. pentru aplicațiile controlate include itemul numai dacă utilizatorul are acces prin grup;
3. Dashboard rămâne disponibil oricărui utilizator autentificat;
4. Administrare rămâne disponibilă conform regulilor existente;
5. `is_staff` nu acordă automat acces la aplicațiile de business;
6. superuserul vede toate aplicațiile active.

Nu folosi `NavigationItem.permission_code` pentru accesul la aplicații.

Câmpul poate rămâne momentan în model, dar nu trebuie populat și nu trebuie folosit pentru noul ACL.

Extinde bootstrapul cu:

```json
{
  "accessible_application_keys": [
    "course-planner",
    "documents"
  ]
}
```

Lista este calculată exclusiv în Django.

---

## 5. Administrare — secțiunea Utilizatori

În `frontend/src/pages/AdministrationPage.tsx`, secțiunea trebuie să fie:

### Utilizatori

Descriere:

`Gestionarea conturilor utilizatorilor platformei.`

Rută:

`/administrare/utilizatori`

### Grupuri și acces aplicații

Înlocuiește intrarea actuală `Roluri și permisiuni`.

Descriere:

`Creează grupuri, atribuie utilizatori și stabilește aplicațiile disponibile.`

Rută:

`/administrare/grupuri`

### Echipe și departamente

Redenumește intrarea actuală `Echipe`.

Descriere:

`Organizarea utilizatorilor în echipe și departamente.`

Nu implementa această funcționalitate în această etapă.

### Istoric autentificări

Păstrează intrarea și descrierea actuală.

Nu implementa această funcționalitate în această etapă.

---

## 6. API pentru grupuri

Extinde aplicația existentă:

`backend/apps/utilizatori`

Nu crea o nouă aplicație Django pentru ACL.

Adaugă endpointurile:

```text
GET    /api/v1/utilizatori/grupuri
POST   /api/v1/utilizatori/grupuri
GET    /api/v1/utilizatori/grupuri/<id>
PATCH  /api/v1/utilizatori/grupuri/<id>
DELETE /api/v1/utilizatori/grupuri/<id>
```

Folosește `IsAdminUser`.

### Payload de scriere

```json
{
  "name": "Operatori Planificator",
  "application_ids": [4],
  "user_ids": [2, 7]
}
```

### Răspuns

```json
{
  "id": 1,
  "name": "Operatori Planificator",
  "applications": [
    {
      "id": 4,
      "key": "course-planner",
      "name": "Planificator cursuri"
    }
  ],
  "users": [
    {
      "id": 2,
      "username": "maria",
      "full_name": "Maria Popescu"
    }
  ]
}
```

### Validări

- numele grupului este obligatoriu;
- numele grupului este unic;
- aplicațiile trebuie să existe;
- aplicațiile trebuie să fie active;
- aplicațiile trebuie să aibă `is_access_controlled=True`;
- utilizatorii trebuie să existe;
- ID-urile duplicate trebuie normalizate;
- actualizarea relațiilor trebuie să fie atomică.

Nu expune permisiunile tehnice Django în interfața React.

---

## 7. Extinderea administrării utilizatorilor

În API-ul și dialogul existent pentru utilizatori adaugă:

```text
group_ids
groups
```

La creare și editare, administratorul poate bifa grupurile utilizatorului.

În lista utilizatorilor afișează grupurile Django reale.

Nu mai numi `is_staff` rol.

Filtrele trebuie să fie:

- stare: activ / inactiv;
- tip cont: administrator / utilizator;
- grup: grup Django.

`is_staff` înseamnă `Acces administrativ`, nu rol de business.

Păstrează regulile existente:

- numai superuserul poate acorda sau retrage `is_staff`;
- utilizatorul nu își poate dezactiva propriul cont;
- superuserul nu poate fi degradat accidental.

---

## 8. Pagina Grupuri și acces aplicații

Creează ruta React:

```text
/administrare/grupuri
```

Folosește componentele shadcn existente.

Pagina trebuie să conțină:

- titlu `Grupuri și acces aplicații`;
- descriere scurtă;
- căutare după numele grupului;
- listă de grupuri;
- buton `Adaugă grup`;
- creare;
- editare;
- ștergere cu confirmare.

### Editorul grupului

#### Nume grup

Input text.

#### Acces aplicații

Checkbox pentru fiecare `ApplicationDefinition` activă și controlată:

```text
☐ Companii
☐ Documente
☐ Planificator cursuri
```

Nu afișa:

- Core;
- Dashboard;
- Administrare;
- Zile libere;
- elementele individuale de navigație;
- cheile interne;
- codurile de permisiune;
- permisiunile tehnice Django.

#### Utilizatori

Checkboxuri sau selector pentru membrii grupului.

Afișează clar că accesul provenit din mai multe grupuri se cumulează.

Nu implementa reguli `deny`.

---

## 9. Protejarea backendului

Adaugă o clasă DRF generică și mică:

```python
class HasApplicationAccess(BasePermission):
    ...
```

Fiecare view protejat declară intern:

```python
application_key = "course-planner"
```

Cheia este internă și nu este afișată administratorului.

Aplică verificarea la toate endpointurile existente din:

- `apps.course_planner` cu cheia `course-planner`;
- `apps.documente` cu cheia `documents`.

Pentru `companies`, protejează momentan ruta frontend, deoarece este încă o pagină placeholder fără API de business.

Nu modifica în această etapă:

- `apps.public_holidays`;
- endpointurile `apps.core`;
- autentificarea;
- Dashboard.

Un utilizator fără acces trebuie să primească `403 Forbidden` chiar dacă apelează manual endpointul.

Nu verifica simultan o permisiune Django veche precum:

```text
course_planner.use_course_planner
```

Trebuie să existe o singură decizie: accesul grupului la `ApplicationDefinition`.

---

## 10. Frontend route guard

Creează un guard generic bazat pe:

```text
bootstrap.accessible_application_keys
```

Aplică-l pe:

- `/companies` → `companies`;
- `/documents` și rutele copil → `documents`;
- `/planificator-cursuri` și toate rutele copil → `course-planner`.

Fără acces:

- linkul nu apare în sidebar;
- ruta directă afișează o stare 403 în zona normală de conținut;
- API-ul răspunde 403.

React nu recalculează grupurile și nu decide independent accesul.

---

## 11. Matrice obligatorie de teste

### Utilizator fără grup

- vede numai Dashboard;
- nu vede Companii;
- nu vede Documente;
- nu vede Planificator;
- API-urile protejate răspund 403.

### Grup cu Planificator

- membrii văd Dashboard și Planificator;
- nu văd Companii;
- nu văd Documente;
- endpointurile Planificatorului sunt accesibile.

### Grup cu Documente

- membrii văd Documente;
- endpointurile Documente sunt accesibile.

### Utilizator în două grupuri

- primește reuniunea aplicațiilor celor două grupuri.

### Eliminarea din grup

- accesul dispare la următorul bootstrap.

### Aplicație dezactivată

- nu apare în meniu;
- nu poate fi accesată.

### Staff fără grupuri

- vede Administrare;
- nu primește automat acces la aplicațiile de business.

### Superuser

- vede toate aplicațiile active.

### Zile libere

- nu apare ca meniu principal;
- rămâne în `Administrare → Integrări`.

---

## 12. Verificări

Rulează:

```bash
./dev backend makemigrations --check
./dev backend migrate
./dev backend check
./dev frontend typecheck
./dev frontend lint
./dev frontend test
./dev test backend
./dev validate
git diff --check
```

Nu face commit și nu face push.

---

## Raport final

Raportează concis:

- modelele Django folosite;
- migrarea creată;
- endpointurile pentru grupuri;
- paginile și rutele frontend;
- aplicațiile protejate;
- matricea testată;
- fișierele modificate.
