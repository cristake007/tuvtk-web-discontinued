# Roluri, departamente și permisiuni compatibile cu EspoCRM

## Statut

Acest document este referința de arhitectură pentru implementarea în TUVTK Web a unui sistem de autorizare inspirat comportamental din EspoCRM, adaptat terminologiei și structurii companiei.

Documentul descrie:

- rolurile;
- departamentele;
- apartenența utilizatorilor la departamente;
- departamentul implicit opțional;
- permisiunile pe module și înregistrări;
- permisiunile pe câmpuri;
- permisiunile speciale;
- calculul accesului efectiv;
- filtrarea queryset-urilor;
- integrarea cu Django REST Framework și React;
- strategia de implementare în faze.

Acesta este un document de cercetare și arhitectură. Nu activează autorizarea, nu adaugă modele și nu creează migrații prin el însuși.

Referință cercetare:

```text
data: 2026-07-25
sursă: espocrm/espocrm
ramură analizată: master
commit analizat: d776b1f106cef73fbe8f91e87e32844c17d30ebc
repo țintă: cristake007/tuvtk-web
ramură țintă: dev
```

Obiectivul este compatibilitatea comportamentală cu EspoCRM, nu copierea codului PHP sau a schemei sale de baze de date. Implementarea Django trebuie să fie originală și adaptată convențiilor proiectului.

## Decizie terminologică

În TUVTK Web se folosesc termenii:

```text
Rol
Departament
Permisiune
```

Nu se folosesc în interfață sau în codul nou termenii `Team`, `Role` ori `Permission`.

Maparea semantică față de EspoCRM este:

```text
EspoCRM Team       -> Departament
EspoCRM Role       -> Rol
EspoCRM Permission -> Permisiune
```

Termenul corect în limba română este **permisiune**, plural **permisiuni**.

Identificatorii Python, cheile JSON și valorile din baza de date se scriu fără diacritice, dar rămân în limba română.

Exemple:

```text
Departament
Rol
PermisiuneRol
MembruDepartament
departament_implicit
fara_acces
proprii
```

În interfață se folosesc diacritice:

```text
Departamente
Roluri
Permisiuni
Departament implicit
Proprii
Fără acces
Nesetat
```

## Contextul organizației

Compania are aproximativ 15 persoane și separă activitatea în zone precum:

```text
Training
Certificări
Industrial
```

În acest proiect, aceste zone sunt denumite **departamente**.

Departamentele sunt grupuri plate de acces și organizare. Nu reprezintă obligatoriu o organigramă rigidă.

Reguli acceptate:

- un utilizator poate să nu aparțină niciunui departament;
- un utilizator poate aparține unuia sau mai multor departamente;
- un utilizator poate avea opțional un departament implicit;
- departamentul implicit trebuie să fie unul dintre departamentele utilizatorului;
- un departament poate să nu aibă niciun rol;
- un rol poate să nu fie atribuit nimănui;
- un utilizator poate să nu aibă niciun rol direct;
- toate departamentele sunt plate în prima versiune;
- nu se implementează departamente părinte-copil;
- poziția unui membru într-un departament este descriptivă și nu este rol ACL.

## De ce este o capabilitate de platformă

Rolurile și departamentele nu pot fi implementate doar ca niște câmpuri în pagina `Utilizatori`.

Sistemul afectează:

- modulele pe care un utilizator le poate deschide;
- înregistrările care apar în endpointurile de listă;
- citirea, editarea și ștergerea unei înregistrări;
- câmpurile returnate de API;
- câmpurile acceptate la creare și actualizare;
- persoanele și departamentele către care poate fi alocată o înregistrare;
- exporturile;
- actualizările în masă;
- accesul la audit;
- fluxurile și colaboratorii viitori;
- navigația și acțiunile din frontend.

Autorizarea trebuie să fie centralizată în Django și aplicată înainte de:

```text
filtrare
numărare
paginare
serializare
export
actualizare
ștergere
```

React poate ascunde funcții indisponibile, dar nu este o barieră de securitate.

## Comportamentul EspoCRM care trebuie păstrat

### Sursele rolurilor

Un utilizator intern care nu este superutilizator poate primi roluri din trei surse opționale:

1. rolul de bază configurat global;
2. rolurile atribuite direct utilizatorului;
3. rolurile moștenite din fiecare departament activ al utilizatorului.

Formula conceptuală:

```text
rol de bază opțional
+ roluri directe opționale
+ roluri moștenite din departamente opționale
= acces efectiv
```

Toate cele trei surse pot lipsi.

Un utilizator fără departamente și fără roluri este valid. Pentru resursele protejate primește valorile implicite stricte, în mod normal `fara_acces`.

Rolurile moștenite din departamente nu se copiază în tabela rolurilor directe ale utilizatorului.

### Fuziunea permisivă

Rolurile sunt cumulative.

Nu există regula „interdicția câștigă”. Valoarea cea mai permisivă câștigă pentru fiecare acțiune, câmp și permisiune specială.

Nivelurile pentru înregistrări sunt:

```text
toate > departament > proprii > fara_acces
```

Nivelurile booleene sunt:

```text
da > nu
```

Un rol poate avea valoarea:

```text
nesetat
```

`nesetat` nu participă la fuziune.

Dacă toate sursele sunt `nesetat`, se aplică valoarea strictă implicită, de regulă `fara_acces` sau `nu`.

Exemple obligatorii:

```text
toate + fara_acces = toate
departament + proprii = departament
proprii + fara_acces = proprii
da + nu = da
nesetat + departament = departament
nesetat + nesetat = valoarea strictă implicită
```

Consecințe:

- un rol restrictiv nu poate anula accesul acordat de alt rol;
- pentru restricționare trebuie eliminat ori modificat rolul permisiv;
- restricțiile obligatorii ale platformei se aplică separat după fuziune;
- ordinea rolurilor nu creează prioritate.

### Administrator și personal administrativ

Maparea TUVTK este:

```text
is_superuser=True -> ocolire completă a ACL-ului normal
is_staff=True     -> acces la zone administrative, nu acces nelimitat la date
```

Reguli:

- superutilizatorul primește acces maxim, exceptând restricțiile obligatorii ale platformei;
- un utilizator `is_staff=True` continuă să fie evaluat prin roluri pentru modulele de business;
- în primele faze doar superutilizatorii pot crea sau modifica roluri, departamente și atribuiri;
- dreptul de a administra utilizatori nu trebuie confundat cu permisiunea de a vedea toate datele de business.

## Domenii de acces

Un domeniu de acces este o resursă protejată, de exemplu:

```text
utilizatori
planificari_cursuri
zile_libere
navigatie
interfata
companii
documente
```

Domeniile sunt înregistrate în cod, nu create arbitrar din interfață.

Acțiunile compatibile sunt:

```text
creare
citire
editare
stergere
flux
```

`creare` folosește valori booleene:

```text
da
nu
nesetat
```

Celelalte acțiuni folosesc:

```text
toate
departament
proprii
fara_acces
nesetat
```

Un domeniu poate fi:

```text
dezactivat
observare
aplicat
```

Semnificații:

- `dezactivat`: ACL-ul nou nu este folosit pentru domeniu;
- `observare`: decizia este calculată și înregistrată, dar nu blochează;
- `aplicat`: decizia ACL este obligatorie.

## Semnificația nivelurilor pe înregistrări

### Toate

Utilizatorul poate efectua acțiunea asupra tuturor înregistrărilor domeniului, sub rezerva restricțiilor obligatorii și a permisiunilor pe câmpuri.

### Departament

O înregistrare este accesibilă dacă este adevărată cel puțin una dintre condiții:

- înregistrarea aparține unuia dintre departamentele active ale utilizatorului;
- utilizatorul este proprietarul înregistrării;
- înregistrarea este partajată cu utilizatorul prin colaboratori, pentru acțiunile care acceptă această regulă.

Aceasta este o condiție `OR`, nu doar intersecția dintre departamente.

Un utilizator cu nivel `departament` trebuie să își poată vedea propria înregistrare chiar dacă acea înregistrare nu are departament.

### Proprii

Proprietatea se determină în această ordine:

1. dacă domeniul are mai mulți utilizatori alocați, utilizatorul curent este printre ei;
2. altfel, dacă domeniul are un utilizator alocat, acesta este utilizatorul curent;
3. altfel, dacă domeniul are creator, creatorul este utilizatorul curent;
4. altfel, nicio înregistrare nu poate satisface nivelul `proprii`.

Pentru citire și flux, colaboratorii pot primi acces partajat dacă domeniul suportă colaboratori și nivelul nu este `fara_acces`.

### Fără acces

Nicio înregistrare nu este accesibilă.

Endpointurile de listă trebuie să producă un queryset gol, iar accesul individual trebuie refuzat.

## Departamente

### Reguli generale

Un departament poate avea:

- nume;
- cod sau slug;
- descriere;
- stare activă;
- membri;
- poziții descriptive;
- zero sau mai multe roluri;
- înregistrări asociate.

Un utilizator poate aparține mai multor departamente.

Un utilizator poate să nu aparțină niciunui departament.

Un departament poate exista fără membri și fără roluri.

Rolurile atribuite unui departament sunt moștenite de toți membrii activi ai acelui departament.

Departamentele rămân plate. Nu se introduce moștenire între departamente.

### Departamentul implicit

Departamentul implicit este opțional.

Configurații valide:

```text
departamente: []
departament_implicit: null
```

```text
departamente: [Training]
departament_implicit: null
```

```text
departamente: [Training, Certificari]
departament_implicit: Training
```

Invarianta obligatorie:

```text
departament_implicit este null
sau
departament_implicit aparține departamentelor active ale utilizatorului
```

Departamentul implicit poate fi folosit pentru:

- asocierea automată a unei înregistrări noi;
- filtrări și valori implicite în formulare;
- configurări viitoare specifice departamentului;
- selectarea layoutului ori a contextului implicit, dacă va exista această funcție.

La eliminarea apartenenței la departamentul implicit, operația trebuie să:

- aleagă explicit alt departament implicit în aceeași tranzacție;
- sau să seteze explicit valoarea la `null`.

Nu se acceptă o referință invalidă.

### Poziția în departament

Un membru poate avea opțional o poziție descriptivă, de exemplu:

```text
Coordonator
Responsabil cursuri
Auditor
Consultant
```

Poziția:

- nu este rol ACL;
- nu acordă automat permisiuni;
- poate fi utilizată ulterior în fluxuri și afișare;
- trebuie să fie goală sau una dintre pozițiile configurate pentru departament.

## Roluri

Un rol poate fi atribuit:

- direct unui utilizator;
- unui departament;
- simultan utilizatorilor și departamentelor;
- nimănui încă.

Un rol poate avea:

- permisiuni pe domenii;
- permisiuni pe câmpuri;
- permisiuni speciale;
- stare activă;
- descriere.

Un rol inactiv nu participă la calculul accesului efectiv.

Rolurile directe, cele moștenite și rolul de bază trebuie păstrate separat în răspunsurile de diagnostic.

## Rolul de bază

Poate exista un singur rol de bază global și este opțional.

Acesta se aplică tuturor utilizatorilor interni care nu sunt superutilizatori.

Rolul de bază trebuie să conțină accesul comun minim, nu restricții care încearcă să anuleze alte roluri.

Schimbarea rolului de bază invalidează accesul calculat pentru toți utilizatorii.

## Permisiunea de alocare

Permisiunea de alocare este separată de permisiunea de editare a înregistrării.

Nivelurile sunt:

```text
toate
departament
fara_acces
```

Comportament:

- `toate`: poate aloca către utilizatori și departamente eligibile fără limitarea la departamente comune;
- `departament`: utilizatorul țintă trebuie să aibă cel puțin un departament comun, iar departamentele alocate trebuie să aparțină utilizatorului care efectuează operația;
- `fara_acces`: nu poate modifica utilizatorii sau departamentele alocate.

La creare:

- utilizatorul alocat implicit poate fi creatorul;
- departamentul implicit poate fi adăugat automat;
- valorile implicite se aplică pe server înaintea validării;
- clientul nu poate ocoli verificarea trimițând direct ID-uri de relații.

## Permisiunea asupra utilizatorilor

Această permisiune controlează accesul la alți utilizatori în contexte de business.

Nivelurile sunt:

```text
toate
departament
fara_acces
```

Reguli:

- utilizatorul curent rămâne întotdeauna accesibil propriei persoane;
- la nivel `departament`, un alt utilizator este accesibil doar dacă există cel puțin un departament comun;
- această permisiune protejează căutările de utilizatori, candidații de alocare și accesul efectiv al altui utilizator;
- nu acordă acces la pagina administrativă `Utilizatori`;
- administrarea conturilor rămâne o funcție separată, protejată explicit.

## Alte permisiuni speciale

Registrul trebuie să poată susține fără schimbarea schemei:

```text
alocare
utilizatori
calendar_utilizatori
portal
cont_email_grup
export
actualizare_in_masa
protectia_datelor
gestionare_urmaritori
mesaje
audit
mentionare
blocare
```

Permisiunile active recomandate inițial:

```text
alocare: toate | departament | fara_acces
utilizatori: toate | departament | fara_acces
export: da | nu
actualizare_in_masa: da | nu
audit: da | nu
```

Fiecare definiție din registru stabilește:

- codul;
- eticheta;
- nivelurile permise;
- ordinea nivelurilor;
- valoarea strictă implicită;
- dacă permisiunea este activă.

## Permisiuni pe câmpuri

Pentru fiecare domeniu și câmp, un rol poate defini:

```text
citire: da | nu | nesetat
editare: da | nu | nesetat
```

Reguli:

- `nesetat` nu participă la fuziune;
- `da` este mai permisiv decât `nu`;
- permisiunea pe câmp nu acordă acces la înregistrare;
- accesul la înregistrare este evaluat înaintea câmpurilor;
- un câmp fără drept de citire nu apare în răspunsurile API normale;
- un câmp fără drept de editare nu poate fi modificat;
- câmpurile interne de securitate rămân protejate prin reguli obligatorii;
- încercarea explicită de a scrie un câmp interzis trebuie să producă eroare clară.

Formatul standard al erorii:

```json
{
  "code": "permission_denied",
  "detail": "Nu aveți permisiunea necesară.",
  "fields": {
    "nume_camp": ["Câmpul nu poate fi modificat."]
  }
}
```

## Colaboratori

Colaboratorii sunt o funcție ulterioară, dar arhitectura trebuie să permită adăugarea lor.

Comportament compatibil:

- pot acorda citire și flux;
- nu acordă automat editare sau ștergere;
- creatorul poate fi adăugat automat;
- persoanele alocate pot fi adăugate automat;
- un fost responsabil poate rămâne colaborator;
- filtrarea listelor trebuie să includă colaboratorii înainte de paginare.

Colaboratorii nu sunt necesari pentru prima fază cu roluri și departamente.

## Reguli obligatorii ale platformei

După fuziunea rolurilor se aplică restricții care nu pot fi modificate din editorul de roluri.

Exemple:

- câmpurile de autentificare nu devin editabile generic;
- câmpurile de securitate și audit rămân protejate;
- modulele dezactivate rămân dezactivate;
- câmpurile imutabile nu pot fi schimbate nici de superutilizator prin endpointuri generice;
- valorile absente din toate rolurile se rezolvă strict la refuz.

Regulile obligatorii sunt definite în cod sau configurație controlată, nu în tabele administrabile liber.

## Aplicația Django

Se creează o aplicație backend dedicată:

```text
backend/apps/control_acces/
```

Nu se introduce compilatorul în:

```text
authentication
core
utilizatori
```

Responsabilitățile rămân separate:

```text
authentication -> stabilește identitatea
control_acces  -> decide autorizarea
utilizatori    -> administrează conturile
```

## Modelul de date Django

### Rol

Model:

```text
Rol
```

Câmpuri recomandate:

```text
id
nume
slug
descriere
este_activ
creat_la
actualizat_la
creat_de
actualizat_de
```

Reguli:

- numele și slugul sunt unice;
- rolurile inactive nu participă la compilare;
- rolurile atribuite nu se șterg distructiv în mod implicit;
- dezactivarea este acțiunea principală;
- modificarea necesită superutilizator în prima versiune.

### PermisiuneDomeniuRol

Un rând pentru fiecare pereche rol-domeniu:

```text
rol
cod_domeniu
nivel_creare
nivel_citire
nivel_editare
nivel_stergere
nivel_flux
```

Valori stocate:

```text
nivel_creare:
  nesetat | da | nu

niveluri pe înregistrări:
  nesetat | toate | departament | proprii | fara_acces
```

Constrângere:

```text
unique(rol, cod_domeniu)
```

### PermisiuneCampRol

Un rând pentru fiecare rol, domeniu și câmp:

```text
rol
cod_domeniu
cod_camp
nivel_citire
nivel_editare
```

Valori:

```text
nesetat | da | nu
```

Constrângere:

```text
unique(rol, cod_domeniu, cod_camp)
```

Se acceptă numai câmpuri înregistrate în definiția domeniului.

### PermisiuneSpecialaRol

Un rând pentru fiecare rol și permisiune specială:

```text
rol
cod_permisiune
nivel
```

Constrângere:

```text
unique(rol, cod_permisiune)
```

Nivelurile sunt validate prin registrul permisiunilor speciale.

### Departament

Model:

```text
Departament
```

Câmpuri recomandate:

```text
id
nume
slug
descriere
lista_pozitii
este_activ
creat_la
actualizat_la
creat_de
actualizat_de
```

`lista_pozitii` poate fi un JSON validat care conține șiruri unice, ne-goale.

Departamentele sunt plate.

### MembruDepartament

Model de legătură între utilizator și departament:

```text
utilizator
departament
pozitie
este_activ
creat_la
creat_de
```

Constrângere:

```text
unique(utilizator, departament)
```

Reguli:

- apartenența este opțională;
- poziția este goală sau se află în lista departamentului;
- apartenența inactivă nu acordă roluri;
- modificarea invalidează accesul utilizatorului;
- utilizatorul nu se poate adăuga singur într-un departament prin profil;
- eliminarea apartenenței tratează departamentul implicit în aceeași tranzacție.

### RolDepartament

Model de legătură:

```text
departament
rol
creat_la
creat_de
```

Constrângere:

```text
unique(departament, rol)
```

Modificarea afectează toți membrii activi ai departamentului.

### RolUtilizator

Model de legătură pentru roluri directe:

```text
utilizator
rol
creat_la
creat_de
```

Constrângere:

```text
unique(utilizator, rol)
```

Tabela conține numai rolurile directe.

Rolurile de bază și cele moștenite nu se copiază aici.

### ProfilAccesUtilizator

Se păstrează modelul Django existent pentru utilizatori.

Se adaugă un profil one-to-one:

```text
utilizator
departament_implicit
versiune_acces
creat_la
actualizat_la
```

Reguli:

- profilul se creează automat și idempotent;
- departamentul implicit este nullable;
- departamentul implicit trebuie să aibă o apartenență activă;
- `versiune_acces` poate fi folosită pentru invalidare țintită în viitor.

### ConfiguratieControlAcces

Configurație singleton:

```text
rol_de_baza
revizie
aplicare_activa
actualizat_la
actualizat_de
```

Reguli:

- rolul de bază este nullable;
- revizia se schimbă după orice modificare care afectează accesul;
- aplicarea poate fi activată gradual.

## Registrul domeniilor

Locație recomandată:

```text
backend/apps/control_acces/domenii.py
```

Fiecare domeniu declară:

```text
cod
eticheta
actiuni
strategie_proprietate
suporta_departamente
suporta_colaboratori
suporta_flux
poate_fi_alocat
campuri
restrictii_obligatorii
stare_aplicare
```

Exemplu conceptual:

```text
cod: planificari_cursuri
actiuni: creare, citire, editare, stergere
strategie_proprietate: utilizator_alocat_apoi_creator
suporta_departamente: true
suporta_colaboratori: false
stare_aplicare: observare
```

Reguli:

- domeniile necunoscute sunt refuzate la validare;
- acțiunile necunoscute sunt refuzate;
- câmpurile necunoscute sunt refuzate;
- eliminarea unui domeniu necesită curățare sau migrare deliberată;
- frontendul primește lista din API, nu o păstrează hard-codată.

## Registrul permisiunilor speciale

Locație recomandată:

```text
backend/apps/control_acces/permisiuni.py
```

Fiecare definiție declară:

```text
cod
eticheta
niveluri
clasament
valoare_implicita
este_activa
```

Adăugarea unei noi permisiuni nu trebuie să necesite schimbarea compilatorului.

## Compilatorul accesului efectiv

Locație recomandată:

```text
backend/apps/control_acces/compilator.py
```

Intrare:

```text
utilizator
```

Surse colectate:

```text
rol_de_baza
roluri_directe_active
roluri_din_departamente_active
```

Ieșirea este o structură imutabilă care conține:

```text
surse_roluri
permisiuni_domenii
permisiuni_campuri
permisiuni_speciale
departamente_active
departament_implicit
revizie
explicatia_valorilor_castigatoare
```

Compilatorul:

- nu conține logică frontend;
- nu execută filtrarea în memorie după citirea datelor;
- trebuie să poată fi testat cu obiecte simple;
- folosește funcții pure pentru fuziune;
- compilează o singură dată per utilizator și revizie;
- păstrează sursa care a acordat nivelul câștigător.

## Serviciul central de autorizare

Locație recomandată:

```text
backend/apps/control_acces/servicii.py
```

Interfață conceptuală:

```text
poate_crea(utilizator, domeniu)
poate_citi(utilizator, domeniu, obiect)
poate_edita(utilizator, domeniu, obiect)
poate_sterge(utilizator, domeniu, obiect)
poate_citi_camp(utilizator, domeniu, camp)
poate_edita_camp(utilizator, domeniu, camp)
are_permisiune_speciala(utilizator, cod)
filtreaza_queryset(utilizator, domeniu, queryset)
```

Toate endpointurile de business trebuie să folosească același serviciu.

Nu se acceptă implementări locale diferite ale nivelurilor `departament` și `proprii`.

## Filtrarea queryset-urilor

Filtrarea trebuie aplicată în baza de date, înainte de:

```text
distinct
ordonare
numarare
paginare
serializare
```

### Nivel toate

```text
queryset neschimbat
```

### Nivel fără acces

```text
queryset.none()
```

### Nivel proprii

Condiție bazată pe strategia domeniului:

```text
utilizatori_alocati conține utilizatorul
sau
utilizator_alocat = utilizator
sau
creat_de = utilizator
```

Pentru citire și flux se poate adăuga condiția colaboratorilor.

### Nivel departament

Condiție `OR`:

```text
departamentele înregistrării intersectează departamentele utilizatorului
sau
înregistrarea este proprie
sau
utilizatorul este colaborator, unde este permis
```

Se folosesc:

- `Q` objects;
- `Exists` sau subinterogări când sunt potrivite;
- `distinct()` numai când relațiile pot produce duplicate;
- indexuri pentru cheile de relație.

Nu se filtrează rezultate deja paginate.

## Verificarea obiectelor individuale

Orice endpoint de detaliu trebuie să aplice aceeași semantică precum endpointul de listă.

Nu se acceptă situația în care:

- lista ascunde înregistrarea;
- dar URL-ul direct o returnează.

Verificarea obiectului și filtrarea listelor trebuie să provină din aceeași definiție de proprietate.

## Integrarea DRF

Componente recomandate:

```text
ControlAccesDomeniu
MixinQuerysetControlAcces
MixinCampuriControlAcces
ValidareAlocare
```

Ordine recomandată:

1. autentificare;
2. verificarea accesului la domeniu;
3. filtrarea queryset-ului;
4. verificarea obiectului;
5. filtrarea câmpurilor citibile;
6. validarea câmpurilor editabile;
7. validarea alocării;
8. salvarea;
9. auditarea.

Nu se bazează securitatea pe date trimise de frontend.

## Cache și invalidare

EspoCRM compilează ACL-ul pentru fiecare utilizator. TUVTK trebuie să păstreze același principiu.

Cheie simplă inițială:

```text
control-acces:utilizator:<id>:revizie:<revizie-globala>
```

Revizia globală se incrementează după:

- schimbarea permisiunilor unui rol;
- activarea sau dezactivarea unui rol;
- schimbarea rolurilor directe;
- schimbarea rolurilor departamentelor;
- schimbarea apartenențelor;
- activarea sau dezactivarea unui departament;
- schimbarea rolului de bază;
- schimbarea registrului domeniilor;
- schimbarea regulilor obligatorii.

Invalidarea se publică prin `transaction.on_commit`.

O tranzacție anulată nu trebuie să invalideze sau să publice o stare incompletă.

În aceeași cerere, accesul se compilează o singură dată.

Revocarea unei permisiuni trebuie să aibă efect imediat după commit în:

- procesele API;
- workerele Celery;
- toate instanțele aplicației.

## API

Prefix:

```text
/api/v1/control-acces/
```

### Domenii

```text
GET /api/v1/control-acces/domenii
```

Returnează:

- domenii;
- acțiuni;
- câmpuri;
- niveluri;
- permisiuni speciale;
- etichete;
- starea aplicării.

### Roluri

```text
GET    /api/v1/control-acces/roluri/
POST   /api/v1/control-acces/roluri/
GET    /api/v1/control-acces/roluri/<id>
PATCH  /api/v1/control-acces/roluri/<id>
DELETE /api/v1/control-acces/roluri/<id>
PUT    /api/v1/control-acces/roluri/<id>/permisiuni
```

Ștergerea permanentă nu este acțiunea principală. Se preferă dezactivarea.

### Departamente

```text
GET    /api/v1/control-acces/departamente/
POST   /api/v1/control-acces/departamente/
GET    /api/v1/control-acces/departamente/<id>
PATCH  /api/v1/control-acces/departamente/<id>
DELETE /api/v1/control-acces/departamente/<id>
PUT    /api/v1/control-acces/departamente/<id>/roluri
GET    /api/v1/control-acces/departamente/<id>/membri
PUT    /api/v1/control-acces/departamente/<id>/membri
```

Actualizarea membrilor este tranzacțională și tratează departamentul implicit.

### Atribuiri utilizator

```text
GET /api/v1/control-acces/utilizatori/<id>/atribuiri
PUT /api/v1/control-acces/utilizatori/<id>/roluri
PUT /api/v1/control-acces/utilizatori/<id>/departamente
PUT /api/v1/control-acces/utilizatori/<id>/departament-implicit
```

Răspunsul separă:

```text
roluri_directe
roluri_mostenite
rol_de_baza
```

### Acces efectiv

```text
GET /api/v1/control-acces/utilizatori/<id>/acces-efectiv
```

Răspunsul include:

- utilizatorul;
- ocolirea de superutilizator;
- rolul de bază;
- rolurile directe;
- rolurile grupate pe departamente;
- permisiunile finale pe domenii;
- permisiunile finale pe câmpuri;
- permisiunile speciale;
- departamentele;
- departamentul implicit;
- revizia;
- sursa valorii câștigătoare.

### Candidați pentru alocare

```text
GET /api/v1/control-acces/alocare/utilizatori?domeniu=<cod>&cautare=<text>
GET /api/v1/control-acces/alocare/departamente?domeniu=<cod>&cautare=<text>
```

Filtrarea este efectuată pe server.

## Frontend

Rolurile și departamentele rămân în zona `Administrare`, în secțiunea utilizatorilor.

Rute:

```text
/administrare/utilizatori
/administrare/utilizatori/roluri
/administrare/utilizatori/roluri/<id>
/administrare/utilizatori/departamente
/administrare/utilizatori/departamente/<id>
```

### Pagina Utilizatori

Se adaugă:

- roluri directe;
- apartenențe la departamente;
- poziția în departament;
- departamentul implicit;
- acțiunea `Acces efectiv`;
- etichete pentru sursele rolurilor.

Etichete:

```text
Direct
Departament: Training
Rol de bază
```

Identitatea utilizatorului și matricea completă de acces nu trebuie înghesuite în același dialog.

### Lista Roluri

Componente recomandate:

- căutare live;
- filtru activ/inactiv;
- număr utilizatori direcți;
- număr departamente;
- insignă pentru rolul de bază;
- creare;
- duplicare;
- dezactivare;
- deschidere.

### Editor Rol

Secțiuni:

1. informații generale;
2. matricea domeniilor;
3. permisiuni pe câmpuri;
4. permisiuni speciale;
5. utilizatori și departamente;
6. rezumatul impactului.

Coloane:

```text
Domeniu | Creare | Citire | Editare | Ștergere | Flux
```

Valorile includ `Nesetat`.

Câmpurile unui domeniu se încarcă la expandare, nu toate simultan.

### Lista și detaliul Departamentelor

Se afișează:

- nume;
- descriere;
- stare;
- număr membri;
- număr roluri;
- lista pozițiilor;
- membri;
- poziția membrului;
- indicator departament implicit;
- rolurile moștenite;
- avertismentul privind numărul utilizatorilor afectați.

### Vizualizarea Acces efectiv

Trebuie să afișeze sursa și rezultatul:

- rol de bază;
- roluri directe;
- roluri pe departamente;
- matricea finală;
- permisiunile pe câmpuri;
- permisiunile speciale;
- explicația valorii câștigătoare;
- revizia curentă.

Această pagină este obligatorie pentru diagnosticarea fuziunii permisive.

## Navigație

Vizibilitatea modulelor folosește accesul efectiv.

Reguli:

- un modul se ascunde când domeniul este dezactivat sau nu există nicio acțiune utilă permisă;
- modulele de business nu se bazează numai pe `is_staff`;
- `Administrare` rămâne pentru personal administrativ;
- administrarea controlului de acces rămâne superutilizator-only la început;
- backendul rămâne autoritar chiar dacă navigația ascunde o rută.

Bootstrapul frontend poate primi o hartă compactă a accesului, nu întreaga matrice de câmpuri.

## Aplicarea graduală

### Faza 0 — Contracte și funcții pure

Se livrează:

- aplicația `control_acces`;
- enumerările nivelurilor;
- registrul domeniilor;
- registrul permisiunilor speciale;
- structurile imutabile;
- funcțiile pure de fuziune;
- testele de clasament și valori implicite;
- fără modele;
- fără migrații;
- fără blocarea endpointurilor existente.

Criterii de ieșire:

- vocabularul este exclusiv în română;
- domeniile inițiale sunt identificate;
- strategiile de proprietate sunt documentate;
- nu există alt vocabular ACL în aplicațiile de business.

### Faza 1 — Roluri, departamente și atribuiri

Se livrează:

- modelele;
- migrațiile;
- API-urile administrative;
- invarianta departamentului implicit;
- paginile de listă și detaliu;
- tipurile frontend generate din OpenAPI;
- auditarea actorului și momentului;
- mutații superutilizator-only.

Niciun endpoint de business nu este încă restricționat de noile roluri.

### Faza 2 — Compilator și acces efectiv

Se livrează:

- colectarea rolului de bază;
- colectarea rolurilor directe;
- colectarea rolurilor departamentelor;
- fuziunea permisivă;
- regulile obligatorii;
- cache;
- invalidare;
- endpointul de acces efectiv;
- explicația surselor.

### Faza 3 — Infrastructura DRF în mod observare

Se livrează:

- mixinurile de filtrare;
- verificarea obiectelor;
- filtrarea câmpurilor;
- validarea alocării;
- jurnalizarea diferențelor;
- fără blocare reală.

Se compară decizia nouă cu comportamentul existent.

### Faza 4 — Domeniu pilot

Se alege un domeniu cu proprietate clară.

Se livrează:

- câmpuri de proprietate necesare;
- relația cu departamente;
- indexuri;
- filtrare queryset;
- verificare obiect;
- câmpuri;
- exporturi și numărări conforme;
- aplicare reală numai pe domeniul pilot.

### Faza 5 — Extindere pe module

Se activează domeniu cu domeniu.

Fiecare modul trebuie să dovedească:

- filtrarea listelor;
- accesul direct;
- crearea;
- editarea;
- ștergerea;
- exportul;
- actualizarea în masă;
- testarea nivelurilor;
- lipsa scurgerilor prin căutări și relații.

### Faza 6 — Funcții avansate

Se pot adăuga:

- colaboratori;
- flux;
- calendar utilizatori;
- permisiuni de audit extinse;
- blocare;
- menționare;
- ștergerea recent creată, dacă este decisă explicit.

## Testare obligatorie

### Fuziunea rolurilor

- fără roluri;
- numai rol de bază;
- numai rol direct;
- numai rol din departament;
- toate sursele;
- roluri inactive;
- departamente inactive;
- apartenențe inactive;
- `toate + fara_acces`;
- `departament + proprii`;
- `nesetat` din toate sursele;
- sursa câștigătoare.

### Departamente

- utilizator fără departamente;
- utilizator cu un departament;
- utilizator cu mai multe departamente;
- departament implicit null;
- departament implicit valid;
- departament implicit invalid;
- eliminarea departamentului implicit;
- rol moștenit;
- rol eliminat;
- poziție validă;
- poziție invalidă.

### Queryset

- toate;
- departament;
- proprii;
- fără acces;
- înregistrare fără departament, dar proprie;
- înregistrare din departament comun;
- înregistrare din alt departament;
- paginare după filtrare;
- count după filtrare;
- lipsa duplicatelor.

### Obiect individual

- obiect din listă accesibil;
- obiect ascuns refuzat direct;
- editare proprie;
- editare departament;
- ștergere refuzată;
- obiect inexistent versus inaccesibil fără scurgeri de informații.

### Câmpuri

- câmp citibil;
- câmp ascuns;
- câmp editabil;
- câmp refuzat;
- câmp intern obligatoriu;
- câmp necunoscut;
- eroare standardizată.

### Alocare

- toate;
- departament comun;
- fără departament comun;
- fără acces;
- valori implicite de creare;
- ID-uri trimise direct pentru ocolire;
- utilizator inactiv;
- departament inactiv.

### Cache

- hit;
- miss;
- schimbare rol;
- schimbare apartenență;
- schimbare rol departament;
- schimbare rol de bază;
- rollback;
- invalidare după commit;
- consistență între procese.

## Securitate

Principii obligatorii:

- deny by default;
- verificare pe server;
- filtrare înainte de paginare;
- fără încredere în frontend;
- fără auto-escaladare;
- fără modificarea propriilor roluri ori departamente;
- fără diferențe între listă și detaliu;
- fără scurgeri prin export, autocomplete sau count;
- fără ACL rămas în cache după revocare;
- fără câmpuri sensibile controlate doar de roluri.

## Performanță și indexuri

Indexuri recomandate:

```text
MembruDepartament(utilizator, este_activ)
MembruDepartament(departament, este_activ)
RolUtilizator(utilizator, rol)
RolDepartament(departament, rol)
PermisiuneDomeniuRol(rol, cod_domeniu)
PermisiuneCampRol(rol, cod_domeniu, cod_camp)
PermisiuneSpecialaRol(rol, cod_permisiune)
```

Modelele de business care suportă acces pe departament trebuie să indexeze tabelele intermediare.

Queryseturile nu trebuie să compileze accesul pentru fiecare rând.

## Audit

Se înregistrează cel puțin:

- cine a creat rolul;
- cine l-a modificat;
- cine a schimbat permisiunile;
- cine a adăugat sau eliminat un membru;
- cine a schimbat rolurile unui departament;
- cine a schimbat rolurile directe;
- cine a schimbat departamentul implicit;
- cine a schimbat rolul de bază;
- momentul;
- valorile anterioare și noi, unde este fezabil.

## Compatibilitate și licențiere

Implementarea este clean-room și urmărește comportamentul observabil al EspoCRM.

Nu se copiază cod PHP.

Când documentația și codul sursă diferă, comportamentul demonstrat prin cod și teste upstream are prioritate pentru compatibilitatea descrisă aici.

## Fișiere EspoCRM analizate

Referințe principale:

```text
application/Espo/Core/Acl/Table/DefaultRoleListProvider.php
application/Espo/Core/Acl/Table/DefaultTable.php
application/Espo/Core/AclManager.php
application/Espo/Core/Acl/DefaultOwnershipChecker.php
application/Espo/Core/Acl/DefaultAccessChecker.php
application/Espo/Core/Select/AccessControl/Filters/OnlyOwn.php
application/Espo/Core/Select/AccessControl/Filters/OnlyTeam.php
application/Espo/Core/Acl/Table/DefaultCacheKeyProvider.php
tests/integration/Espo/User/AclTest.php
```

## Decizii înghețate înainte de implementare

Următoarele decizii nu trebuie schimbate accidental în fazele următoare:

1. termenii canonici sunt `Rol`, `Departament` și `Permisiune`;
2. aplicația backend se numește `control_acces`;
3. API-ul folosește `/api/v1/control-acces/`;
4. un utilizator poate avea zero departamente;
5. un utilizator poate avea mai multe departamente;
6. departamentul implicit este opțional;
7. departamentul implicit trebuie să fie o apartenență activă;
8. rolurile directe sunt opționale;
9. rolurile departamentelor sunt opționale;
10. rolul de bază este opțional;
11. toate sursele de roluri sunt cumulative;
12. nivelurile sunt `toate > departament > proprii > fara_acces`;
13. `nesetat` nu participă la fuziune;
14. departamentele sunt plate;
15. poziția în departament nu este rol ACL;
16. `is_superuser` ocolește ACL-ul normal;
17. `is_staff` nu oferă acces nelimitat la datele de business;
18. autorizarea este aplicată în backend înainte de paginare și serializare;
19. implementarea începe fără blocarea endpointurilor existente;
20. fiecare domeniu este activat gradual după testare.
