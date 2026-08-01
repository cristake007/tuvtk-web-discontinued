# Frontend, API & Backend Explorer — regenerarea datelor

Viewerul poate fi deschis direct din `index.html`; nu are nevoie de server, build sau pachete npm.

## Rescanare

Din rădăcina repository-ului rulează:

```bash
node docs/page-structure/viewer/refresh-data.mjs
```

Scriptul generează întregul raport din cod:

1. citește configurația reală `frontend/src/app/router.tsx`;
2. reconstruiește inventarul rutelor, inclusiv rutele index și cele nested;
3. rezolvă componentele lazy, wrapper-ele de rută și importurile locale `@/` sau relative;
4. urmărește recursiv componentele JSX și dependențele TS/TSX ale fiecărei pagini;
5. detectează structura React, elementele DOM, clasele, ID-urile, condițiile și listele;
6. detectează endpointurile folosite, formularele și indiciile pentru loading/error/empty;
7. generează problemele structurale și inconsistențele prin reguli aplicate rezultatelor scanării;
8. reconstruiește inventarul complet la fiecare rulare, astfel încât rutele adăugate sau eliminate din router apar automat;
9. suprascrie `data.json` și snapshotul integrat în `app.js`, necesar pentru `file://`.

`data.json`, fișierele `docs/page-structure/*.md` și snapshotul anterior din `app.js` nu sunt surse pentru raport. Vechiul `data.json` este citit numai ca text pentru a determina dacă outputul s-a schimbat în modul `--check`.

Aceeași comandă rulează `scan-backend.py`, un scanner AST bazat numai pe biblioteca standard Python. Acesta pornește din `backend/config/urls.py` și `INSTALLED_APPS`, urmărește configurațiile URL incluse, clasele API DRF, decoratoarele `extend_schema`, serializers, servicii, modele și relații, permissions, filters, signals, taskuri Celery, management commands, teste și integrări externe confirmate prin importuri. Rezultatul este corelat cu apelurile detectate în frontend pentru modurile **API**, **Backend** și **Data flow**.

În proiectul curent nu există o schemă OpenAPI materializată ca artefact versionat; contractele OpenAPI sunt extrase din decoratoarele `extend_schema`, setările drf-spectacular și ruta reală `/api/schema`. Numărul routerelor DRF detectate este păstrat în metadata chiar dacă proiectul curent nu înregistrează niciun router.

La fiecare scanare este regenerată și pagina **Inconsistențe**, care corelează exclusiv dovezi extrase din cod:

- aceeași componentă terminală folosită de mai multe rute;
- componente route-level diferite cu același template JSX;
- variațiile wrapperului și elementului root din același modul;
- diferențele dintre contractele loading/error/empty;
- componentele reutilizate și candidații derivați din template-uri similare.

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

## Sursa raportului

Viewerul afișează o singură sursă: **Scan cod**. Pentru fiecare rută, generatorul produce:

- arborele React și arborele DOM/HTML estimat;
- componentele și fișierele sursă urmărite recursiv;
- endpointurile consumate;
- indicii loading/error/empty, formulare și acțiuni;
- structuri comune, template-uri similare și variații între rute.

Orice rută nouă declarată în `appRoutes` este inclusă, chiar dacă numele sau rolul ei nu sunt cunoscute de generator. Dacă taxonomia nu poate determina modulul ori tipul paginii, ruta apare sub `Altele`, fără să fie eliminată din raport.

Scannerul este static și conservator: nu execută React sau Django, nu apelează API-uri, baze de date ori servicii externe și nu modifică frontendul sau backendul. Relațiile confirmate reprezintă dovezi în cod (URL-uri, importuri, apeluri, decoratori sau câmpuri de model), nu garanții că ramura se execută la runtime. Importurile dinamice, URL-urile construite programatic, consumatorii externi și ramurile determinate exclusiv la runtime pot necesita ulterior un adaptor opțional de runtime. Containerele aplicației nu sunt necesare pentru inventarul static curent.

## Cerințe

- Node.js 18 sau mai nou;
- Python 3.10 sau mai nou, fără pachete Python suplimentare;
- repository-ul trebuie să păstreze structura curentă `frontend/src` și `docs/page-structure/viewer`;
- nu sunt necesare `npm install`, server HTTP sau dependențe externe.
