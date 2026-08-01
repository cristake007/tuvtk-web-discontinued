# Frontend, API & Backend Explorer — regenerarea datelor

Viewerul poate fi deschis direct din `index.html`; nu are nevoie de server, build sau pachete npm.

## Rescanare

Din rădăcina repository-ului rulează:

```bash
node docs/page-structure/viewer/refresh-data.mjs
```

Scriptul:

1. citește configurația reală `frontend/src/app/router.tsx`;
2. reconstruiește inventarul rutelor, inclusiv rutele index și cele nested;
3. rezolvă componentele lazy, wrapper-ele de rută și importurile locale `@/` sau relative;
4. urmărește recursiv componentele JSX și dependențele TS/TSX ale fiecărei pagini;
5. detectează structura React, elementele DOM, clasele, ID-urile, condițiile și listele;
6. detectează endpointurile folosite, formularele și indiciile pentru loading/error/empty;
7. recitește `domOutline` și `issues` din rapoartele Markdown, le reconciliază cu scanarea curentă și generează analiza separată „Scan actual”;
8. adaugă automat rutele care nu existau în `data.json` și elimină din inventar rutele scoase din router;
9. actualizează `data.json` și snapshotul integrat în `app.js`, necesar pentru `file://`.

Aceeași comandă rulează `scan-backend.py`, un scanner AST bazat numai pe biblioteca standard Python. Acesta pornește din `backend/config/urls.py` și `INSTALLED_APPS`, urmărește configurațiile URL incluse, clasele API DRF, decoratoarele `extend_schema`, serializers, servicii, modele și relații, permissions, filters, signals, taskuri Celery, management commands, teste și integrări externe confirmate prin importuri. Rezultatul este corelat cu apelurile documentate și scanate din frontend pentru modurile **API**, **Backend** și **Data flow**.

În proiectul curent nu există o schemă OpenAPI materializată ca artefact versionat; contractele OpenAPI sunt extrase din decoratoarele `extend_schema`, setările drf-spectacular și ruta reală `/api/schema`. Numărul routerelor DRF detectate este păstrat în metadata chiar dacă proiectul curent nu înregistrează niciun router.

La fiecare scanare este regenerată și pagina **Inconsistențe**, care corelează:

- aceeași componentă terminală folosită de mai multe rute;
- componente route-level diferite cu același template JSX;
- variațiile wrapperului și elementului root din același modul;
- diferențele dintre contractele loading/error/empty;
- candidații de reutilizare și inconsistențele confirmate în rapoartele Markdown.

Rularea este deterministă: dacă sursele nu s-au schimbat, o nouă execuție nu rescrie fișierele.

## Verificare fără scriere

```bash
node docs/page-structure/viewer/refresh-data.mjs --check
```

Comanda termină scanarea și spune dacă viewerul este sincronizat, fără să modifice fișiere.

Pentru inventarul detaliat și componentele pe care scannerul nu le-a putut rezolva:

```bash
node docs/page-structure/viewer/refresh-data.mjs --check --verbose
```

## Analiză documentată și scan actual

Pentru rutele deja documentate, viewerul oferă două surse ale arborelui:

- **Analiză documentată** — raportul structural verificat manual, cu observații semantice;
- **Scan actual** — rezultatul regenerat direct din cod la ultima rulare.

Rutele noi folosesc automat arborele scanat. Scannerul este static și conservator: nu execută React sau Django, nu apelează API-uri, baze de date ori servicii externe și nu modifică frontendul sau backendul. Relațiile confirmate reprezintă dovezi în cod (URL-uri, importuri, apeluri, decoratori sau câmpuri de model), nu garanții că ramura se execută la runtime. Importurile dinamice, URL-urile construite programatic, consumatorii externi și ramurile determinate exclusiv la runtime trebuie confirmate manual.

Pentru rutele documentate, secțiunile `DOM outline estimat` și `Probleme structurale` din raportul Markdown sunt sursa câmpurilor `domOutline` și `issues`. `_runtime-comun.md` este sursa pentru `sharedRuntime.componentOutline` și `sharedRuntime.domOutline`. Generatorul elimină o constatare manuală despre un element root atunci când `autoScan` identifică fără ambiguitate un alt element și oprește regenerarea dacă o contradicție despre `ApplicationState` supraviețuiește reconcilierii.

## Cerințe

- Node.js 18 sau mai nou;
- Python 3.10 sau mai nou, fără pachete Python suplimentare;
- repository-ul trebuie să păstreze structura curentă `frontend/src` și `docs/page-structure/viewer`;
- nu sunt necesare `npm install`, server HTTP sau dependențe externe.
