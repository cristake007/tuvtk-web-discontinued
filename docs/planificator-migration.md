# Migrare Planificator

Repository-ul `cristake007/planificator` rămâne sursa funcțională pentru instrumentele interne care vor fi migrate în TUVTK Web.

Instrumentele se mută pe rând, ca module independente. Nu se copiază shellul vechi, templateurile Django, DaisyUI, CSS-ul sau JavaScriptul paginilor vechi. Backendul se adaptează la Django REST Framework, iar interfața se reconstruiește în React cu shellul și tema proiectului curent.

## Etapa curentă: Planificator cursuri

Rută frontend:

```text
/planificator-cursuri
```

API:

```text
GET  /api/v1/course-planner/settings
PUT  /api/v1/course-planner/settings
POST /api/v1/course-planner/generate
POST /api/v1/course-planner/export
```

Logica migrată:

- citirea fișierelor CSV, XLSX și XLS;
- validarea coloanelor `Title`, `Durata Curs` și `Permalink`;
- suport pentru coloana opțională `investitie`;
- calculul zilelor lucrătoare, weekendurilor și zilelor libere;
- regula cursurilor de maximum cinci zile în aceeași săptămână de lucru și aceeași lună;
- nivelul de distribuție a datelor de început;
- salvarea setărilor;
- exportul Excel compatibil cu structura folosită de instrumentele vechi.

## Etape ulterioare

Se vor migra separat:

1. potrivirea perioadelor din Word;
2. conversia și formatarea XML;
3. actualizarea datelor cursurilor în WordPress;
4. generatorul de diplome;
5. setările specifice fiecărui instrument.

Fiecare etapă trebuie să păstreze contractele de fișiere necesare etapelor următoare, fără să importe infrastructură frontend din proiectul vechi.
